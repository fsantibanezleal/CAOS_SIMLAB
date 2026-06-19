"""Event trace for a multi-stage flow DES (e.g. an emergency department: triage → treatment → discharge).

Like the single-station `Trace` but with an ordered list of `stations` (each a resource pool of size c)
and events that carry the patient id + priority class, so the web `FlowViz` can reconstruct, at any time
t, the queue + in-service population at every station and animate patients flowing through the pipeline.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SCHEMA = "simlab.flowtrace/v1"


@dataclass
class FlowTrace:
    scenario: str
    title: str
    method: str
    seed: int
    params: dict[str, Any]
    stations: list[dict[str, Any]] = field(default_factory=list)  # [{id,label_en,label_es,c}]
    legend: list[dict[str, Any]] = field(default_factory=list)  # priority classes (code,label,color)
    events: list[dict[str, Any]] = field(default_factory=list)  # {t,kind,id,prio}
    t_end: float = 0.0
    kpis: dict[str, Any] = field(default_factory=dict)
    analytic: dict[str, Any] = field(default_factory=dict)

    def add_event(self, t: float, kind: str, **payload: Any) -> None:
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
            "stations": self.stations,
            "legend": self.legend,
            "kpis": self.kpis,
            "analytic": self.analytic,
            "timeline": {"t_end": round(self.t_end, 4), "events": self.events},
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), separators=(",", ":"))

    def write(self, path: str | Path) -> int:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(self.to_json(), encoding="utf-8")
        return p.stat().st_size
