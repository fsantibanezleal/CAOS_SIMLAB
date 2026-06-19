"""S04 ED (multi-stage DES) + S06 job-shop (CP-SAT). S06 is skipped where OR-Tools isn't installed."""
from __future__ import annotations

import json

import pytest

from simlab.pipeline import precompute
from simlab.scenarios.s04_ed import EDScenario


def test_ed_reproducible_and_flow():
    sc = EDScenario()
    assert len(sc.variants()) >= 10
    a = sc.run({}, seed=42)
    assert a.to_json() == sc.run({}, seed=42).to_json()
    assert len(a.stations) == 3 and a.stations[0]["id"] == "triage"
    assert len(a.events) > 0
    assert "mean_LOS" in a.kpis


def test_ed_pipeline_manifest(tmp_path):
    res = precompute("s04_ed", seed=42, out_root=tmp_path)
    assert res["variants"] >= 10
    m = json.loads((tmp_path / "manifests" / "s04_ed.json").read_text(encoding="utf-8"))
    assert m["viz"]["renderer"] == "flow"


def test_jobshop_ft06_optimal():
    pytest.importorskip("ortools")
    from simlab.scenarios.s06_jobshop import JobShopScenario
    sc = JobShopScenario()
    assert len(sc.variants()) >= 10
    tr = sc.run({"instance": 1}, seed=42)
    # Fisher–Thompson ft06 has a proven optimal makespan of 55.
    assert tr.kpis["makespan"] == 55
    assert tr.kpis["optimal"] is True
    assert tr.machines and tr.ops


def test_jobshop_pipeline_manifest(tmp_path):
    pytest.importorskip("ortools")
    res = precompute("s06_jobshop", seed=42, out_root=tmp_path)
    assert res["variants"] >= 10
    m = json.loads((tmp_path / "manifests" / "s06_jobshop.json").read_text(encoding="utf-8"))
    assert m["viz"]["renderer"] == "gantt"
