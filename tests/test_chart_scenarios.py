"""S05 Beer Game + S10 Monte-Carlo — reproducibility, the headline effect, and the chart pipeline."""
from __future__ import annotations

import json

from simlab.pipeline import precompute
from simlab.scenarios.s05_beergame import BeerGameScenario
from simlab.scenarios.s10_montecarlo import MonteCarloScenario


def test_beergame_reproducible_and_amplifies_upstream():
    sc = BeerGameScenario()
    assert len(sc.variants()) >= 10
    a = sc.run({}, seed=42)
    assert a.to_json() == sc.run({}, seed=42).to_json()
    # bullwhip amplifies stage by stage upstream
    assert a.kpis["bullwhip_factory"] >= a.kpis["bullwhip_retailer"]
    assert a.kpis["bullwhip_factory"] > 1.0
    assert "factory" in a.series and "demand" in a.series


def test_montecarlo_reproducible_and_converges():
    sc = MonteCarloScenario()
    assert len(sc.variants()) >= 10
    a = sc.run({}, seed=42)
    assert a.to_json() == sc.run({}, seed=42).to_json()
    # 200 reps of the default ρ≈0.67 case should land near Erlang-C theory
    assert a.kpis["rel_error_pct"] < 25.0
    assert a.kpis["ci_halfwidth"] > 0
    for k in ("run_mean", "ci_lo", "ci_hi", "x"):
        assert k in a.series


def test_montecarlo_unstable_regime_does_not_crash():
    """The live lane lets users pick ρ ≥ 1 (no steady-state Wq): must not crash on round(None)."""
    sc = MonteCarloScenario()
    tr = sc.run({"lam": 9.0, "mu": 1.0, "c": 1, "n_customers": 200, "n_reps": 30}, seed=42)
    assert tr.analytic["Wq"] is None  # unstable
    assert tr.ref_lines == []  # no theory line to compare against
    assert tr.kpis["theory_Wq"] is None and tr.kpis["rel_error_pct"] is None
    assert tr.kpis["rho"] >= 1.0
    json.loads(tr.to_json())  # serializes (nulls are valid JSON)


def test_chart_pipeline_manifest(tmp_path):
    for sid in ("s05_beergame", "s10_montecarlo"):
        res = precompute(sid, seed=42, out_root=tmp_path)
        assert res["variants"] >= 10
        m = json.loads((tmp_path / "manifests" / f"{sid}.json").read_text(encoding="utf-8"))
        assert m["viz"]["renderer"] == "chart"
        for v in m["variants"]:
            assert (tmp_path / v["trace"]).exists()
