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


def test_chart_pipeline_manifest(tmp_path):
    for sid in ("s05_beergame", "s10_montecarlo"):
        res = precompute(sid, seed=42, out_root=tmp_path)
        assert res["variants"] >= 10
        m = json.loads((tmp_path / "manifests" / f"{sid}.json").read_text(encoding="utf-8"))
        assert m["viz"]["renderer"] == "chart"
        for v in m["variants"]:
            assert (tmp_path / v["trace"]).exists()
