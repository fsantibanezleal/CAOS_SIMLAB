"""Core machinery: the live/precompute gate and the trace schema."""
from __future__ import annotations

from simlab.core.scenario import GATE_MAX_TRACE_BYTES, classify_lane
from simlab.core.trace import SCHEMA, Trace


def test_gate_live_when_all_pass():
    g = classify_lane(pure_python=True, run_ms=500.0, trace_bytes=10_000)
    assert g.lane == "live"
    assert g.reasons == []


def test_gate_precompute_when_native():
    g = classify_lane(pure_python=False, run_ms=10.0, trace_bytes=10)
    assert g.lane == "precomputed"
    assert any("pure-Python" in r for r in g.reasons)


def test_gate_precompute_when_slow_or_big():
    slow = classify_lane(True, run_ms=9999.0, trace_bytes=10)
    big = classify_lane(True, run_ms=10.0, trace_bytes=GATE_MAX_TRACE_BYTES + 1)
    assert slow.lane == "precomputed" and big.lane == "precomputed"


def test_trace_roundtrip_and_event_order():
    tr = Trace("x", "X", "DES", 1, {"a": 1})
    tr.add_event(2.0, "depart", id=0)
    tr.add_event(0.5, "arrival", id=0)
    d = tr.to_dict()
    assert d["schema"] == SCHEMA
    assert d["timeline"]["t_end"] == 2.0
    assert [e["kind"] for e in d["timeline"]["events"]] == ["depart", "arrival"]
