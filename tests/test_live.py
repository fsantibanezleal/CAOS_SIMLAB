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


def test_live_lanes_are_lightweight_pure_python_only():
    lanes = set(live_lanes())
    # Live = pure-Python AND wheel closure ⊆ the browser worker's (numpy, simpy, ciw). Today that is exactly
    # the SimPy DES scenarios. Everything heavier is precompute + replay: Mesa ABM (pandas/scipy closure too
    # heavy for the live cold-start), OR-Tools (native, no WASM), joblib/scipy (s10), networkx (s09).
    assert lanes == {"s01_queue", "s04_ed"}
    assert {
        "s02_schelling", "s03_sir", "s05_beergame", "s06_jobshop", "s07_haul",
        "s08_vrp", "s09_ambulance", "s10_montecarlo", "s11_minehaul",
    }.isdisjoint(lanes)


def test_run_trace_json_refuses_precompute_only():
    # native engine (OR-Tools) and heavy-closure (Mesa) scenarios must both be refused in WASM
    with pytest.raises(RuntimeError):
        run_trace_json("s08_vrp", {}, 42)
    with pytest.raises(RuntimeError):
        run_trace_json("s02_schelling", {}, 42)


def test_run_trace_json_byte_matches_committed():
    """replay = truth: a fresh run of each live variant equals the committed seed-42 trace bytes."""
    for sid in live_lanes():
        var = get_scenario(sid).variants()[0]
        committed = (ROOT / "data" / "artifacts" / sid / f"{var.id}-seed42.json").read_text(encoding="utf-8")
        assert run_trace_json(sid, var.params, 42) == committed, sid
