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
                 rng: np.random.Generator | None = None, *, terrain: str = "ramp",
                 terrain_opts: dict | None = None, blocked: set[int] | None = None) -> None:
        # `terrain`/`terrain_opts`/`blocked` are keyword-only with ramp defaults, so existing positional
        # callers (S08/S09: GridNetwork(g, g, spacing=1.0)) reproduce the old graph + ramp elevation
        # byte-for-byte. `blocked` removes interior nodes entirely (true impassable cells).
        self.rows, self.cols = rows, cols
        blocked = blocked or set()
        self.coords: dict[int, tuple[float, float]] = {}
        for r in range(rows):
            for c in range(cols):
                nid = r * cols + c
                if nid in blocked:
                    continue
                jx = float(rng.uniform(-jitter, jitter)) if (rng is not None and jitter) else 0.0
                jy = float(rng.uniform(-jitter, jitter)) if (rng is not None and jitter) else 0.0
                self.coords[nid] = (c * spacing + jx, r * spacing + jy)
        self.adj: dict[int, list[int]] = {n: [] for n in self.coords}
        self.edges: list[list[int]] = []
        for r in range(rows):
            for c in range(cols):
                nid = r * cols + c
                if nid not in self.coords:
                    continue
                for dr, dc in ((0, 1), (1, 0)):
                    nr, nc = r + dr, c + dc
                    if nr < rows and nc < cols:
                        m = nr * cols + nc
                        if m not in self.coords:
                            continue
                        self.adj[nid].append(m)
                        self.adj[m].append(nid)
                        self.edges.append([nid, m])
        # span from the NOMINAL grid extent (not the possibly-holey coords) so blocking never shifts the
        # frame or the ramp field.
        self._span = ((cols - 1) * spacing + (rows - 1) * spacing) or 1.0
        self.elev = self._build_elev(terrain, terrain_opts or {})

    def _build_elev(self, terrain: str, opts: dict) -> dict[int, float]:
        if terrain == "ramp":
            return {n: (x + y) / self._span for n, (x, y) in self.coords.items()}  # 0..1, ridge to top-right
        if terrain == "ridge":
            # A horizontal ridge (wall) at `ridge_row` separates load (bottom) from dump (top); `passes`
            # carve low notches so a detour through a pass climbs far less than going over the crest.
            ridge_row = opts.get("ridge_row", (self.rows - 1) / 2.0)
            passes = opts.get("passes", [2])
            w = opts.get("w", 0.75)
            ridge_amp = opts.get("ridge_amp", 1.6)
            wp = opts.get("wp", 0.8)
            pass_depth = opts.get("pass_depth", 0.97)
            base_tilt = opts.get("base_tilt", 0.05)
            denom = (self.rows - 1) or 1
            elev: dict[int, float] = {}
            for n, (x, y) in self.coords.items():
                ridge = ridge_amp * math.exp(-((y - ridge_row) ** 2) / (2 * w * w))
                notch = 1.0
                for cp in passes:
                    notch *= 1.0 - pass_depth * math.exp(-((x - cp) ** 2) / (2 * wp * wp))
                elev[n] = ridge * notch + base_tilt * y / denom
            return elev
        if terrain == "hills":
            # A richly varied landscape: a sum of Gaussian bumps (peaks, or basins when amp<0) at given
            # centres, each with its OWN width. Graded haul routes wind through the saddles between peaks,
            # so spread O-D pairs get distinct, irregular routes everywhere. `bumps` = [(cx, cy, amp)] or
            # [(cx, cy, amp, sigma)] in grid coords; deterministic, no RNG.
            bumps = opts.get("bumps", [(0.35, 0.55, 1.5), (0.65, 0.40, 1.3), (0.5, 0.8, 1.1)])
            default_sig = opts.get("sigma", 2.2)
            elev = {}
            for n, (x, y) in self.coords.items():
                e = 0.0
                for bp in bumps:
                    cx, cy, amp = bp[0], bp[1], bp[2]
                    s = bp[3] if len(bp) > 3 else default_sig
                    e += amp * math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s))
                elev[n] = e
            return elev
        raise ValueError(f"unknown terrain '{terrain}'")

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
