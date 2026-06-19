"""The per-scenario manifest — the keystone that makes the live/precompute call auditable.

A scenario emits ONE manifest listing its family of pre-simulated **variants**. Each variant declares its
lane, params, the MEASURED gate numbers, its KPIs and analytic reference, and its committed trace path.
The app reads the manifest to populate the variant selector and to know how to run/replay each one; CI
reads it to enforce that nothing tagged "live" actually breaches the gates.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .scenario import GATE_MAX_RUN_MS, GATE_MAX_TRACE_BYTES, Scenario

SCHEMA = "simlab.manifest/v2"


def build_scenario_manifest(scenario: Scenario, seed: int, variants: list[dict[str, Any]]) -> dict[str, Any]:
    """Assemble the scenario manifest from per-variant result dicts (built by the pipeline)."""
    lanes = {v["lane"] for v in variants}
    scenario_lane = "live" if lanes == {"live"} else "precomputed"
    return {
        "schema": SCHEMA,
        "id": scenario.id,
        "title": scenario.title,
        "method": scenario.method,
        "tier": scenario.tier,
        "engine": scenario.engine,
        "seed": int(seed),
        "viz": {"renderer": scenario.viz, "dimensionality": scenario.dimensionality},
        "wheel_closure": list(scenario.wheels),
        "param_specs": [vars(p) for p in scenario.param_specs],
        "lane": scenario_lane,
        "gate_thresholds": {"max_run_ms": GATE_MAX_RUN_MS, "max_trace_bytes": GATE_MAX_TRACE_BYTES},
        "variants": variants,
    }


def write_manifest(manifest: dict, path: str | Path) -> Path:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return p
