"""S01 M/M/c — reproducibility, theory validation, and the live gate.

These tests double as the curriculum's honesty guarantees: a run is reproducible from (params, seed),
and the simulator agrees with the closed-form M/M/c when averaged over replications (a single run is
noisy — that is itself a lesson, see test_single_run_is_noisy_but_replications_converge).
"""
from __future__ import annotations

from statistics import fmean

from simlab.core.scenario import classify_lane
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
    assert ref["Wq"] == float("inf")


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
