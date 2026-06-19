"""S01 M/M/c — reproducibility, theory validation, and the live gate.

These tests double as the curriculum's honesty guarantees: a run is reproducible from (params, seed),
and the simulator agrees with the closed-form M/M/c when averaged over replications (a single run is
noisy — that is itself a lesson, see test_single_run_is_noisy_but_replications_converge).
"""
from __future__ import annotations

import json
from statistics import fmean

from simlab.core.scenario import classify_lane
from simlab.pipeline import precompute
from simlab.scenarios.s01_queue import QueueScenario, erlang_c_mmc


def test_run_is_reproducible():
    sc = QueueScenario()
    a = sc.run({}, seed=42)
    b = sc.run({}, seed=42)
    assert a.to_json() == b.to_json()  # identical trace => replay == truth


def test_different_seeds_differ():
    sc = QueueScenario()
    assert sc.run({}, seed=1).kpis["Wq_sim"] != sc.run({}, seed=2).kpis["Wq_sim"]


def test_erlang_c_known_value():
    # lam=2, mu=1, c=3 => rho=2/3, Wq = 0.4444... (worked example in the queueing chapter)
    ref = erlang_c_mmc(2.0, 1.0, 3)
    assert ref["stable"] is True
    assert abs(ref["Wq"] - 0.4444) < 1e-3


def test_unstable_system_is_flagged():
    ref = erlang_c_mmc(5.0, 1.0, 3)  # rho > 1
    assert ref["stable"] is False
    assert ref["Wq"] is None  # null, not inf — keeps the committed trace valid JSON


def test_single_run_is_noisy_but_replications_converge():
    sc = QueueScenario()
    analytic = erlang_c_mmc(2.0, 1.0, 3)["Wq"]
    params = {"lam": 2.0, "mu": 1.0, "c": 3, "n_customers": 2000}
    wqs = [sc.run(params, seed=s).kpis["Wq_sim"] for s in range(24)]
    mean_wq = fmean(wqs)
    # The replication mean must land within 15% of theory (the validation pedagogy).
    assert abs(mean_wq - analytic) / analytic < 0.15


def test_s01_is_live_lane():
    # Default instance is small + pure-Python => the gate must allow the live lane.
    sc = QueueScenario()
    tr = sc.run({}, seed=42)
    gate = classify_lane(sc.pure_python, run_ms=50.0, trace_bytes=len(tr.to_json()))
    assert gate.lane == "live", gate.reasons


def test_variants_are_many_distinct_and_reproducible():
    sc = QueueScenario()
    vs = sc.variants()
    assert len(vs) >= 10  # the brief: at least 10 pre-simulated parameter versions
    ids = [v.id for v in vs]
    assert len(set(ids)) == len(ids)  # unique ids
    assert all(v.label_en and v.label_es for v in vs)  # bilingual labels
    a = sc.run(vs[0].params, seed=42)
    b = sc.run(vs[0].params, seed=42)
    assert a.to_json() == b.to_json()


def test_pipeline_emits_v2_manifest_and_every_variant_trace(tmp_path):
    res = precompute("s01_queue", seed=42, out_root=tmp_path)
    assert res["variants"] >= 10
    manifest = json.loads((tmp_path / "manifests" / "s01_queue.json").read_text(encoding="utf-8"))
    assert manifest["schema"] == "simlab.manifest/v2"
    assert manifest["lane"] in ("live", "precomputed")
    assert len(manifest["variants"]) >= 10
    for v in manifest["variants"]:
        assert (tmp_path / v["trace"]).exists(), v["trace"]
        assert "kpis" in v and "analytic" in v and "gate" in v
