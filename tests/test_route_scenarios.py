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
    t9 = sc.run(_vparams(sc, "t9"), 42)
    t12 = sc.run(_vparams(sc, "t12"), 42)
    # one loader caps throughput: extra trucks just queue (same loads, longer wait)
    assert t12.kpis["loads_delivered"] == t9.kpis["loads_delivered"]
    assert t12.kpis["loader_wait_per_load"] > t9.kpis["loader_wait_per_load"]
    # a second loader lifts the ceiling
    assert sc.run(_vparams(sc, "l2t12"), 42).kpis["loads_delivered"] > t12.kpis["loads_delivered"]
    # grade lengthens the cycle
    assert sc.run(_vparams(sc, "steep"), 42).kpis["mean_cycle_time"] > sc.run(_vparams(sc, "flat"), 42).kpis["mean_cycle_time"]


def test_haul_pipeline_manifest(tmp_path):
    res = precompute("s07_haul", seed=42, out_root=tmp_path)
    assert res["variants"] >= 10
    m = json.loads((tmp_path / "manifests" / "s07_haul.json").read_text(encoding="utf-8"))
    assert m["viz"]["renderer"] == "route"


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
