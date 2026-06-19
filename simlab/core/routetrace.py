"""Route/network trace for geospatial routing scenarios (haul, VRP, ambulance dispatch).

A self-contained synthetic network: `nodes` (with x,y coordinates + a `kind` + optional `elev` height) and
`edges` (roads). Moving entities are `agents`, each a list of timed `legs` (travel from node a to node b
over [t0,t1]); the web `RouteViz` interpolates each agent's position at time t. Dynamic `markers` (e.g.
emergency incidents) appear/resolve over time. Optional static `routes` draw planned-route polylines.
Optional `barriers` mark impassable cells (only serialized when present). When nodes carry `elev`, the
viz paints a normalized elevation field behind the roads. No external map / tiles / OSM — fully
reproducible from (params, seed).
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SCHEMA = "simlab.routetrace/v1"


@dataclass
class RouteTrace:
    scenario: str
    title: str
    method: str
    seed: int
    params: dict[str, Any]
    bounds: dict[str, float] = field(default_factory=dict)  # {minx,miny,maxx,maxy}
    nodes: list[dict[str, Any]] = field(default_factory=list)  # {id,x,y,kind,label?}
    edges: list[list[int]] = field(default_factory=list)  # [from, to]
    routes: list[dict[str, Any]] = field(default_factory=list)  # {agent, path:[nodeId], color}
    agents: list[dict[str, Any]] = field(default_factory=list)  # {id, kind, color, legs:[{a,b,t0,t1}]}
    markers: list[dict[str, Any]] = field(default_factory=list)  # {x,y,t0,t1,kind}
    barriers: list[dict[str, Any]] = field(default_factory=list)  # {x,y} impassable cells (haul wall)
    legend: list[dict[str, Any]] = field(default_factory=list)
    t_end: float = 0.0
    kpis: dict[str, Any] = field(default_factory=dict)
    analytic: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        d = {
            "schema": SCHEMA,
            "scenario": self.scenario,
            "title": self.title,
            "method": self.method,
            "seed": self.seed,
            "params": self.params,
            "bounds": self.bounds,
            "nodes": self.nodes,
            "edges": self.edges,
            "routes": self.routes,
            "agents": self.agents,
            "markers": self.markers,
            "legend": self.legend,
            "t_end": round(self.t_end, 3),
            "kpis": self.kpis,
            "analytic": self.analytic,
        }
        if self.barriers:  # only emit when present, so barrier-free traces (S08/S09) stay byte-identical
            d["barriers"] = self.barriers
        return d

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), separators=(",", ":"))

    def write(self, path: str | Path) -> int:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(self.to_json(), encoding="utf-8")
        return p.stat().st_size
