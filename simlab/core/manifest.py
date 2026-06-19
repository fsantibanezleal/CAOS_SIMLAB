"""The per-scenario manifest — the keystone that makes the live/precompute call auditable.

Each scenario emits a manifest declaring its lane, engine, seed, params, the MEASURED gate numbers, the
wheel closure and its viz binding. The app reads it to know how to run/replay a scenario; CI reads it to
enforce that nothing tagged "live" actually breaches the gates.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .scenario import GATE_MAX_RUN_MS, GATE_MAX_TRACE_BYTES, GateResult, Scenario

SCHEMA = "simlab.manifest/v1"


def build_manifest(scenario: Scenario, seed: int, params: dict, gate: GateResult) -> dict[str, Any]:
    return {
        "schema": SCHEMA,
        "id": scenario.id,
        "title": scenario.title,
        "method": scenario.method,
        "tier": scenario.tier,
        "engine": scenario.engine,
        "seed": int(seed),
        "params": params,
        "lane": gate.lane,
        "gate": {
            "pure_python": gate.pure_python,
            "run_ms": gate.run_ms,
            "trace_bytes": gate.trace_bytes,
            "reasons": gate.reasons,
            "thresholds": {"max_run_ms": GATE_MAX_RUN_MS, "max_trace_bytes": GATE_MAX_TRACE_BYTES},
        },
        "wheel_closure": list(scenario.wheels),
        "viz": {"renderer": scenario.viz, "dimensionality": scenario.dimensionality},
    }


def write_manifest(manifest: dict, path: str | Path) -> Path:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return p
