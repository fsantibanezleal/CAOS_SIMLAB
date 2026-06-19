"""Frame-based trace for grid Agent-Based Models (Schelling, SIR, …).

Where the DES `Trace` records an event timeline, an ABM grid records a sequence of full grid snapshots
(`frames`) plus per-step time series (for charts) and a legend mapping cell-state codes to bilingual
labels + theme colours. Same contract as `Trace`: a run is determined by (params, seed), so the committed
frame trace replays identically.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SCHEMA = "simlab.gridtrace/v1"


@dataclass
class GridTrace:
    scenario: str
    title: str
    method: str
    seed: int
    params: dict[str, Any]
    w: int
    h: int
    legend: list[dict[str, Any]] = field(default_factory=list)
    frames: list[dict[str, Any]] = field(default_factory=list)  # {"t": int, "cells": list[int]}
    series: dict[str, list[float]] = field(default_factory=dict)  # {"x": [...], "<key>": [...]}
    kpis: dict[str, Any] = field(default_factory=dict)
    analytic: dict[str, Any] = field(default_factory=dict)  # empty for ABM (no closed form)

    def add_frame(self, t: int, cells: list[int]) -> None:
        self.frames.append({"t": int(t), "cells": [int(c) for c in cells]})

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema": SCHEMA,
            "scenario": self.scenario,
            "title": self.title,
            "method": self.method,
            "seed": self.seed,
            "params": self.params,
            "grid": {"w": self.w, "h": self.h},
            "legend": self.legend,
            "kpis": self.kpis,
            "analytic": self.analytic,
            "series": self.series,
            "frames": self.frames,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), separators=(",", ":"))

    def write(self, path: str | Path) -> int:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(self.to_json(), encoding="utf-8")
        return p.stat().st_size
