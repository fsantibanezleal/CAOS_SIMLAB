"""The trace schema — the single artifact both lanes produce and the web player consumes.

A Trace is a compact, JSON-serialisable record of one run: its inputs (scenario, seed, params), its
KPIs, an optional analytic reference (for validation scenarios), and a timeline of events the front end
animates. The SAME object is produced whether the run happened live in Pyodide or offline in the
pipeline — so one render path serves both lanes.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SCHEMA = "simlab.trace/v1"


@dataclass
class Trace:
    scenario: str
    title: str
    method: str
    seed: int
    params: dict[str, Any]
    kpis: dict[str, Any] = field(default_factory=dict)
    analytic: dict[str, Any] = field(default_factory=dict)
    t_end: float = 0.0
    events: list[dict[str, Any]] = field(default_factory=list)

    def add_event(self, t: float, kind: str, **payload: Any) -> None:
        """Append a timeline event. `kind` is scenario-defined (e.g. arrival/start/depart)."""
        ev: dict[str, Any] = {"t": round(float(t), 4), "kind": kind}
        ev.update(payload)
        self.events.append(ev)
        if t > self.t_end:
            self.t_end = float(t)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema": SCHEMA,
            "scenario": self.scenario,
            "title": self.title,
            "method": self.method,
            "seed": self.seed,
            "params": self.params,
            "kpis": self.kpis,
            "analytic": self.analytic,
            "timeline": {"t_end": round(self.t_end, 4), "events": self.events},
        }

    def to_json(self) -> str:
        # Compact separators keep committed traces small (the trace-bytes gate cares about this).
        return json.dumps(self.to_dict(), separators=(",", ":"))

    def write(self, path: str | Path) -> int:
        """Write the compact trace to `path`; return its size in bytes (feeds the gate)."""
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(self.to_json(), encoding="utf-8")
        return p.stat().st_size
