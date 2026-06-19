"""Shared synthetic road network for the geospatial routing scenarios (S07/S08/S09).

A self-contained grid-of-junctions graph (no OSM, no tiles) with coordinates + an elevation field, plus
Dijkstra shortest paths (with a pluggable edge cost so haul trucks can be slowed uphill / when loaded) and
helpers to expand a node path into timed travel legs for the route trace.
"""
from __future__ import annotations

import heapq
import math
from typing import Callable

import numpy as np


class GridNetwork:
    def __init__(self, rows: int, cols: int, spacing: float = 1.0, jitter: float = 0.0,
                 rng: np.random.Generator | None = None) -> None:
        self.rows, self.cols = rows, cols
        self.coords: dict[int, tuple[float, float]] = {}
        for r in range(rows):
            for c in range(cols):
                jx = float(rng.uniform(-jitter, jitter)) if (rng is not None and jitter) else 0.0
                jy = float(rng.uniform(-jitter, jitter)) if (rng is not None and jitter) else 0.0
                self.coords[r * cols + c] = (c * spacing + jx, r * spacing + jy)
        self.adj: dict[int, list[int]] = {n: [] for n in self.coords}
        self.edges: list[list[int]] = []
        for r in range(rows):
            for c in range(cols):
                nid = r * cols + c
                for dr, dc in ((0, 1), (1, 0)):
                    nr, nc = r + dr, c + dc
                    if nr < rows and nc < cols:
                        m = nr * cols + nc
                        self.adj[nid].append(m)
                        self.adj[m].append(nid)
                        self.edges.append([nid, m])
        xs = [x for x, _ in self.coords.values()]
        ys = [y for _, y in self.coords.values()]
        self._span = (max(xs) + max(ys)) or 1.0
        self.elev = {n: (x + y) / self._span for n, (x, y) in self.coords.items()}  # 0..1, ridge to top-right

    def dist(self, a: int, b: int) -> float:
        (x1, y1), (x2, y2) = self.coords[a], self.coords[b]
        return math.hypot(x2 - x1, y2 - y1)

    def shortest_path(self, src: int, dst: int, cost: Callable[[int, int], float] | None = None) -> tuple[list[int], float]:
        """Dijkstra. `cost(a,b)` defaults to euclidean distance; pass a custom cost for grade/loaded."""
        cf = cost or self.dist
        dist = {src: 0.0}
        prev: dict[int, int] = {}
        pq = [(0.0, src)]
        while pq:
            d, u = heapq.heappop(pq)
            if u == dst:
                break
            if d > dist.get(u, math.inf):
                continue
            for v in self.adj[u]:
                nd = d + cf(u, v)
                if nd < dist.get(v, math.inf):
                    dist[v] = nd
                    prev[v] = u
                    heapq.heappush(pq, (nd, v))
        path = [dst]
        while path[-1] != src:
            if path[-1] not in prev:
                return [src], math.inf
            path.append(prev[path[-1]])
        path.reverse()
        return path, dist.get(dst, math.inf)

    def nodes_list(self, kinds: dict[int, str] | None = None, labels: dict[int, str] | None = None) -> list[dict]:
        kinds = kinds or {}
        labels = labels or {}
        out = []
        for n, (x, y) in self.coords.items():
            d = {"id": n, "x": round(x, 3), "y": round(y, 3), "kind": kinds.get(n, "junction")}
            if n in labels:
                d["label"] = labels[n]
            out.append(d)
        return out

    def bounds(self) -> dict[str, float]:
        xs = [x for x, _ in self.coords.values()]
        ys = [y for _, y in self.coords.values()]
        return {"minx": min(xs), "miny": min(ys), "maxx": max(xs), "maxy": max(ys)}


def timed_legs(net: GridNetwork, path: list[int], t0: float, speed: float,
               cost: Callable[[int, int], float] | None = None) -> tuple[list[dict], float]:
    """Expand a node path into timed legs {a,b,t0,t1}; returns (legs, arrival_time). Leg time = cost/speed."""
    cf = cost or net.dist
    legs = []
    t = t0
    for a, b in zip(path, path[1:]):
        dt = cf(a, b) / speed
        legs.append({"a": a, "b": b, "t0": round(t, 3), "t1": round(t + dt, 3)})
        t += dt
    return legs, t
