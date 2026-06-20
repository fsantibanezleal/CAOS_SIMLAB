"""The Pyodide live-lane entrypoint (simlab/live.py).

These run in CPython, but they pin the contract the browser relies on: which scenarios may run live, the
native-engine guard, and — the keystone — that ``run_trace_json`` reproduces the COMMITTED trace byte-for-
byte. That byte-equality is exactly what the in-browser "Verify against the committed trace" feature checks
in WASM; asserting it here catches any drift (a scenario change without a trace regen) at PR time.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from simlab.live import live_lanes, run_trace_json
from simlab.registry import get_scenario

ROOT = Path(__file__).resolve().parent.parent


def test_live_lanes_are_pyodide_loadable_only():
    lanes = set(live_lanes())
    # Live = pure-Python AND every wheel is Pyodide-loadable (LIVE_WHEELS). MEASURED: Mesa 3 runs in Pyodide
    # (with sqlite3), so the ABM scenarios run live on real Mesa; SimPy/Ciw/NetworkX/joblib also load. The
    # ONLY thing that stays precompute is the native OR-Tools solver (s06/s07/s08/s11).
    assert lanes == {"s01_queue", "s02_schelling", "s03_sir", "s04_ed", "s05_beergame", "s09_ambulance", "s10_montecarlo"}
    assert {"s06_jobshop", "s07_haul", "s08_vrp", "s11_minehaul"}.isdisjoint(lanes)  # native OR-Tools → precompute


def test_run_trace_json_refuses_precompute_only():
    # native OR-Tools scenarios must be refused in WASM (no WASM build); Mesa ABM is NOT refused (it runs live)
    with pytest.raises(RuntimeError):
        run_trace_json("s08_vrp", {}, 42)
    with pytest.raises(RuntimeError):
        run_trace_json("s11_minehaul", {}, 42)


def test_run_trace_json_byte_matches_committed():
    """replay = truth: a fresh run of each live variant equals the committed seed-42 trace bytes."""
    for sid in live_lanes():
        var = get_scenario(sid).variants()[0]
        committed = (ROOT / "data" / "artifacts" / sid / f"{var.id}-seed42.json").read_text(encoding="utf-8")
        assert run_trace_json(sid, var.params, 42) == committed, sid
