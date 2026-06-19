"""S02 Schelling + S03 SIR — reproducibility, variant family, and the grid-trace pipeline."""
from __future__ import annotations

import json

from simlab.pipeline import precompute
from simlab.scenarios.s02_schelling import SchellingScenario
from simlab.scenarios.s03_sir import SIRScenario


def test_schelling_reproducible_and_variants():
    sc = SchellingScenario()
    assert len(sc.variants()) >= 10
    a = sc.run({}, seed=42)
    b = sc.run({}, seed=42)
    assert a.to_json() == b.to_json()
    assert len(a.frames) >= 2 and "segregation" in a.series
    assert "final_segregation" in a.kpis


def test_sir_reproducible_and_curve():
    sc = SIRScenario()
    assert len(sc.variants()) >= 10
    a = sc.run({}, seed=42)
    assert a.to_json() == sc.run({}, seed=42).to_json()
    for k in ("S", "I", "R", "x"):
        assert k in a.series
    # S decreases, R increases over the epidemic
    assert a.series["S"][0] >= a.series["S"][-1]
    assert a.series["R"][-1] >= a.series["R"][0]
    assert "attack_rate" in a.kpis


def test_grid_pipeline_manifest(tmp_path):
    for sid in ("s02_schelling", "s03_sir"):
        res = precompute(sid, seed=42, out_root=tmp_path)
        assert res["variants"] >= 10
        m = json.loads((tmp_path / "manifests" / f"{sid}.json").read_text(encoding="utf-8"))
        assert m["viz"]["renderer"] == "agent-grid"
        assert m["schema"] == "simlab.manifest/v2"
        for v in m["variants"]:
            assert (tmp_path / v["trace"]).exists()
