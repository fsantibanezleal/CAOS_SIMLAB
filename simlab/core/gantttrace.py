"""Gantt trace for scheduling scenarios (e.g. job-shop): per-machine job bars over time.

The optimizer (OR-Tools CP-SAT) is native code that cannot run in the browser, so these scenarios are
always precomputed; the committed trace is just the schedule (operations with start/duration) + makespan,
which the web `GanttViz` renders directly.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SCHEMA = "simlab.gantt/v1"


@dataclass
class GanttTrace:
    scenario: str
    title: str
    method: str
    seed: int
    params: dict[str, Any]
    machines: list[dict[str, Any]] = field(default_factory=list)  # [{id, label}]
    jobs: int = 0
    ops: list[dict[str, Any]] = field(default_factory=list)  # {job, machine, start, dur}
    makespan: float = 0.0
    kpis: dict[str, Any] = field(default_factory=dict)
    analytic: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema": SCHEMA,
            "scenario": self.scenario,
            "title": self.title,
            "method": self.method,
            "seed": self.seed,
            "params": self.params,
            "machines": self.machines,
            "jobs": self.jobs,
            "ops": self.ops,
            "makespan": self.makespan,
            "kpis": self.kpis,
            "analytic": self.analytic,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), separators=(",", ":"))

    def write(self, path: str | Path) -> int:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(self.to_json(), encoding="utf-8")
        return p.stat().st_size
