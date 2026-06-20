"""Geospatial routing lane: shared _geo network + S07 haul, S08 VRP (OR-Tools), S09 ambulance.

S08 is skipped where OR-Tools isn't installed (mirrors the S06 pattern).
"""
from __future__ import annotations

import json

import pytest

from simlab.pipeline import precompute
from simlab.scenarios._geo import GridNetwork, timed_legs
from simlab.scenarios.s07_haul import HaulScenario
from simlab.scenarios.s09_ambulance import AmbulanceScenario


def _vparams(sc, vid):
    return next(v.params for v in sc.variants() if v.id == vid)


def test_geo_network_shortest_path_and_legs():
    net = GridNetwork(4, 4, spacing=1.0)
    path, d = net.shortest_path(0, 15)
    assert path[0] == 0 and path[-1] == 15
    assert d > 0
    # a graded cost that penalises uphill cannot make the path cheaper than the plain one
    _, d_up = net.shortest_path(0, 15, cost=lambda a, b: net.dist(a, b) * (1 + 5 * max(0.0, net.elev[b] - net.elev[a])))
    assert d_up >= d
    legs, t = timed_legs(net, path, 0.0, 1.0)
    assert len(legs) == len(path) - 1 and t > 0
    assert legs[0]["t0"] == 0.0 and legs[-1]["t1"] == pytest.approx(t)


def test_haul_loader_saturates_and_reproducible():
    sc = HaulScenario()
    assert len(sc.variants()) >= 10
    a = sc.run({}, seed=42)
    assert a.to_json() == sc.run({}, seed=42).to_json()
    assert a.nodes and a.edges and a.agents
    t6 = sc.run(_vparams(sc, "f_t6"), 42)
    t12 = sc.run(_vparams(sc, "f_t12"), 42)
    # one loader caps throughput: more trucks just queue (loads plateau, the wait explodes)
    assert t12.kpis["loads_delivered"] >= t6.kpis["loads_delivered"]
    assert t12.kpis["loader_wait_per_load"] > 2 * t6.kpis["loader_wait_per_load"]
    # a second loader lifts the ceiling
    assert sc.run(_vparams(sc, "f_l2t12"), 42).kpis["loads_delivered"] > t12.kpis["loads_delivered"]
    # steep grade lengthens the cycle vs flat
    assert sc.run(_vparams(sc, "x_steep2"), 42).kpis["mean_cycle_time"] > sc.run(_vparams(sc, "x_flat"), 42).kpis["mean_cycle_time"]


def test_haul_route_switches_with_grade():
    """The non-monotone ridge makes the optimal route flip direct->pass across the critical grade."""
    sc = HaulScenario()
    mid = sc.run(_vparams(sc, "r_mid"), 42)       # grade 3 < g*≈3.38
    sw = sc.run(_vparams(sc, "r_switch"), 42)     # grade 4 > g*
    assert "crest" in mid.analytic["route_via"]   # direct over the ridge
    assert "pass" in sw.analytic["route_via"]     # flipped to the low pass
    assert mid.routes[0]["path"] != sw.routes[0]["path"]  # the actual haul polyline changed
    # moving the pass sends the detour the other way
    assert "pass" in sc.run(_vparams(sc, "r_passR"), 42).analytic["route_via"]
    # a wall reroutes the haul even at low grade, and is recorded for the viz
    wall = sc.run(_vparams(sc, "r_wall"), 42)
    assert wall.analytic["cross_col"] != wall.analytic["lift_col"] and wall.barriers


def test_haul_every_variant_slider_stop_has_a_committed_plan():
    """Live-lane guard: every s07 variant × every reachable grade/wall slider stop must resolve to a committed
    plan, so toggling the free sliders (grade, wall) in the browser never raises a native-plan miss. This would
    have caught the r_passR-corridor gap where only one grade was committed for the off-default pass/lift."""
    from simlab.scenarios.s07_haul import PLANS, _plan_key

    sc = HaulScenario()
    specs = {s.key: s for s in sc.param_specs}
    grade, barrier = specs["grade"], specs["barrier"]

    def stops(spec):  # every slider position min..max inclusive
        n = int(round((spec.max - spec.min) / spec.step))
        return [round(spec.min + i * spec.step, 1) for i in range(n + 1)]

    grades, barriers = stops(grade), [int(b) for b in stops(barrier)]
    # pass/lift columns are pinned (min==max), so the only reachable corridors are the variants' own (pass,lift)
    for v in sc.variants():
        p = v.params
        for g in grades:
            for b in barriers:
                key = _plan_key(int(p["grid"]), g, int(p["pass_col"]), int(p["lift_col"]), b)
                assert key in PLANS, f"s07 {v.id}: no committed plan for grade={g}, barrier={b} ({key})"


def test_haul_route_tie_stable():
    """A route-shape variant must not flip under tiny (±1e-9) cost noise — no near-ties (critique)."""
    from simlab.scenarios._geo import GridNetwork
    g = 12
    net = GridNetwork(g, g, spacing=1.0, terrain="ridge", terrain_opts={"passes": [2], "ridge_row": 5.5})
    load, dump = 4, (g - 1) * g + 4
    for grade in (3.0, 4.0):
        def c(a, b, grade=grade):
            return net.dist(a, b) * (1.0 + grade * max(0.0, net.elev[b] - net.elev[a]))
        base = net.shortest_path(load, dump, cost=c)[0]
        for eps in (1e-9, -1e-9):
            def cp(a, b, eps=eps, grade=grade):
                return net.dist(a, b) * (1.0 + grade * max(0.0, net.elev[b] - net.elev[a])) + eps
            assert net.shortest_path(load, dump, cost=cp)[0] == base, (grade, eps)


def test_haul_pipeline_manifest(tmp_path):
    res = precompute("s07_haul", seed=42, out_root=tmp_path)
    assert res["variants"] >= 10
    m = json.loads((tmp_path / "manifests" / "s07_haul.json").read_text(encoding="utf-8"))
    assert m["viz"]["renderer"] == "route"
    # S07 is LIVE now: the native OR-Tools/NetworkX route PLAN is committed offline and only the SimPy
    # stochastic replay runs in the worker (pure-Python wheels).
    assert m["lane"] == "live" and m["wheel_closure"] == ["numpy", "simpy"]


def test_haul_committed_plan_reproduces_natively():
    """The committed plans (s07_plans.py) must equal a fresh native NetworkX+OR-Tools rebuild — not stale."""
    pytest.importorskip("ortools")
    pytest.importorskip("networkx")
    from simlab.scenarios import _haul_plan
    from simlab.scenarios.s07_plans import PLANS

    fresh = _haul_plan.build_all_plans()
    assert set(fresh) == set(PLANS)
    for key, plan in fresh.items():
        committed = PLANS[key]
        # route geometry + cost certificate + analytic must match the committed data byte-for-byte
        assert plan["up_path"] == committed["up_path"], key
        assert plan["down_path"] == committed["down_path"], key
        assert plan["up_cost"] == committed["up_cost"], key
        assert plan["analytic"] == committed["analytic"], key


def test_haul_runs_live_without_ortools():
    """The live SimPy replay must run with the native solver libs blocked (Pyodide has no WASM OR-Tools)."""
    import sys

    poison = ("ortools", "ortools.sat", "ortools.sat.python", "ortools.sat.python.cp_model", "networkx")
    builder = "simlab.scenarios._haul_plan"  # may already be imported by an earlier test
    saved = {m: sys.modules.get(m) for m in (*poison, builder)}
    try:
        for m in poison:
            sys.modules[m] = None        # poison: any attempt to import these now fails
        sys.modules.pop(builder, None)   # drop so we can prove the live path doesn't re-import it
        from simlab.live import run_trace_json
        out = run_trace_json("s07_haul", {}, 42)
        assert '"scenario":"s07_haul"' in out
        # the native plan builder module must NOT have been pulled in by the live path
        assert builder not in sys.modules
    finally:
        for m, mod in saved.items():
            if mod is None:
                sys.modules.pop(m, None)
            else:
                sys.modules[m] = mod


def test_ambulance_coverage_and_reproducible():
    sc = AmbulanceScenario()
    assert len(sc.variants()) >= 10
    a = sc.run({}, seed=42)
    assert a.to_json() == sc.run({}, seed=42).to_json()
    assert a.nodes and a.edges and a.agents
    assert len(a.markers) == a.kpis["calls"]  # one incident marker per call
    # a bigger, well-sited fleet covers more of the same demand
    cov2 = sc.run(_vparams(sc, "a2"), 42).kpis["coverage_pct"]
    cov4 = sc.run(_vparams(sc, "a4"), 42).kpis["coverage_pct"]
    assert cov2 < cov4
    # under-resourcing pushes offered load past 100%
    assert sc.run(_vparams(sc, "a2"), 42).kpis["load_pct"] > 100.0


def test_ambulance_pipeline_manifest(tmp_path):
    res = precompute("s09_ambulance", seed=42, out_root=tmp_path)
    assert res["variants"] >= 10
    m = json.loads((tmp_path / "manifests" / "s09_ambulance.json").read_text(encoding="utf-8"))
    assert m["viz"]["renderer"] == "route"


def test_vrp_serves_all_customers():
    pytest.importorskip("ortools")
    from simlab.scenarios.s08_vrp import VRPScenario
    sc = VRPScenario()
    assert len(sc.variants()) >= 10
    tr = sc.run(_vparams(sc, "base"), 42)
    assert tr.kpis["total_distance"] > 0
    assert tr.kpis["vehicles_used"] >= 1
    assert tr.nodes and tr.agents and tr.routes
    # every customer node is present
    assert sum(1 for n in tr.nodes if n["kind"] == "customer") == tr.kpis["customers"]


def test_vrp_pipeline_manifest(tmp_path):
    pytest.importorskip("ortools")
    res = precompute("s08_vrp", seed=42, out_root=tmp_path)
    assert res["variants"] >= 10
    m = json.loads((tmp_path / "manifests" / "s08_vrp.json").read_text(encoding="utf-8"))
    assert m["viz"]["renderer"] == "route" and m["lane"] == "precomputed"


def test_minehaul_blend_slip_and_recovery():
    pytest.importorskip("ortools")
    from simlab.scenarios.s11_minehaul import MineHaulScenario
    sc = MineHaulScenario()
    assert len(sc.variants()) >= 10
    base = sc.run(_vparams(sc, "base"), 42)
    assert base.to_json() == sc.run(_vparams(sc, "base"), 42).to_json()  # GLOP + DES deterministic
    assert base.nodes and base.agents and base.routes
    # the blend PLAN hits the target (the LP can satisfy the grade); the achieved grade is the fleet's reality
    assert abs(base.analytic["plan_grade"] - base.kpis["grade_target"]) <= 0.05
    under = sc.run(_vparams(sc, "undertrucked"), 42)
    over = sc.run(_vparams(sc, "overtrucked"), 42)
    # an optimal plan is degraded by a fixed fleet: the grade slips, and more trucks recover it
    assert under.kpis["grade_dev"] > over.kpis["grade_dev"]
    assert over.kpis["in_band"] == 1 and under.kpis["in_band"] == 0


def test_minehaul_stock_dual_role():
    pytest.importorskip("ortools")
    from simlab.scenarios.s11_minehaul import MineHaulScenario
    sc = MineHaulScenario()
    src = sc.run(_vparams(sc, "stock_source"), 42)   # pre-built stock → drains as a source
    assert src.gauges and src.analytic["stock_end"] < 40.0
    buf = sc.run(_vparams(sc, "stock_buffer"), 42)    # empty-ish stock → fills as a sink
    assert buf.analytic["stock_peak"] > _vparams(sc, "stock_buffer")["init_stock"]


def test_minehaul_pipeline_manifest(tmp_path):
    pytest.importorskip("ortools")
    res = precompute("s11_minehaul", seed=42, out_root=tmp_path)
    assert res["variants"] >= 10
    m = json.loads((tmp_path / "manifests" / "s11_minehaul.json").read_text(encoding="utf-8"))
    assert m["viz"]["renderer"] == "route" and m["lane"] == "precomputed"  # native solver → no live lane
