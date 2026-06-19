"""Chart/series trace for scenarios whose story is a set of time series (Monte-Carlo CI, the Beer Game
bullwhip, …) rather than a queue animation or an agent grid.

Carries named series over an x-axis, a declarative list of `lines` to plot, an optional confidence
`band`, an optional `bars` histogram, and horizontal `ref_lines` (e.g. a theoretical value). The web
`ChartViz` renders it directly; same (params, seed) → same trace contract.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SCHEMA = "simlab.charttrace/v1"


@dataclass
class ChartTrace:
    scenario: str
    title: str
    method: str
    seed: int
    params: dict[str, Any]
    x_label_en: str = "step"
    x_label_es: str = "paso"
    y_label_en: str = ""
    y_label_es: str = ""
    series: dict[str, list[float]] = field(default_factory=dict)  # includes "x"
    lines: list[dict[str, Any]] = field(default_factory=list)  # {key,color,label_en,label_es,dashed?}
    band: dict[str, Any] | None = None  # {lo,hi,color,label_en,label_es}
    bars: dict[str, Any] | None = None  # {edges:[...], counts:[...], color, label_en, label_es}
    ref_lines: list[dict[str, Any]] = field(default_factory=list)  # {y,color,label_en,label_es}
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
            "x_label_en": self.x_label_en,
            "x_label_es": self.x_label_es,
            "y_label_en": self.y_label_en,
            "y_label_es": self.y_label_es,
            "series": self.series,
            "lines": self.lines,
            "band": self.band,
            "bars": self.bars,
            "ref_lines": self.ref_lines,
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
