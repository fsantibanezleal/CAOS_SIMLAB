# NetworkX — the graph + shortest-path layer

**NetworkX** is the pure-Python graph library that gives CAOS_SIMLAB its *road/network layer*: a
graph data structure (junctions + weighted segments) plus the classic shortest-path algorithms —
**Dijkstra**, **A\***, and **k-shortest simple paths** (Yen's algorithm). In this lab it answers the
question *"what is the cheapest route between two points, and what are the next-best alternatives?"*
on a weighted road graph. It is intentionally **not** a fleet optimizer (that is OR-Tools / PyVRP)
and **not** a simulator (that is SimPy); it sits *upstream* of both, producing the travel-time matrix
the optimizer consumes and the route polylines the simulator animates.

**When to use it:** reach for NetworkX whenever you need readable, in-process shortest paths or a
travel-time matrix on a small-to-medium graph (live-capable in the browser Pyodide tier, ≈ ≤ 20–30
stops). For *real* road networks pair it with **OSMnx** (downloads OpenStreetMap straight into a
NetworkX graph, same path API); for *large* all-pairs matrices precompute with OSRM instead. **How
the lab uses it:** NetworkX is stage 1 of the signature *optimize-then-simulate* (simheuristic)
pipeline — `graph → matrix → optimize → simulate`. It is the road layer behind **S07** (construction
haul routing, grade-weighted) and **S09** (ambulance dispatch, distance-weighted), where its edge
weights mirror the lab's graded `_geo` grid byte-for-byte so the seeded routing trace replays exactly
("replay = truth"). The k-shortest-paths capability is what makes route *fragility* visible: when the
two cheapest routes are a near-tie, a tiny stochastic delay flips which one actually wins — the lesson
the downstream SimPy replay drives home.

## Read in order

1. [Installation](./10_networkx/01_installation.md) — exact `pip` line + version, requirements lane,
   dependencies, platform/CUDA/OSM-data notes, verification.
2. [Usage](./10_networkx/02_usage.md) — the real API and concepts, the runnable example walked through
   step by step, and its actual captured output.
3. [Applying it](./10_networkx/03_applying.md) — how to formalize the routing problem and solve it
   with NetworkX, which scenarios use it, the honest research trade-offs, and when to pick it over
   the alternatives.

## Artifacts

- [`example.py`](./10_networkx/example.py) — deterministic shortest-path + k-shortest demo on a small
  weighted grid road graph (no network access, runs live). Re-run:
  `.venv/Scripts/python.exe docs/frameworks/10_networkx/example.py`.

## Scenarios that use it

- **S07 — Construction Haul Routing** and **S09 — Ambulance Dispatch**, both in the
  [Optimization & Routing problem type](../problem-types/03_optimization-routing.md). NetworkX builds the
  graph and computes the shortest paths / matrix; OR-Tools optimizes on top; **SimPy** stress-tests
  the plan under stochastic delays.

## Companion & alternative frameworks

- [OSMnx](./11_osmnx.md) — downloads real OSM road networks into a NetworkX graph (the real-world data
  source; same path API). *(Mind OSM's ODbL attribution — see [`../../ATTRIBUTION.md`](../../ATTRIBUTION.md).)*
- [OR-Tools](./08_ortools.md) · [PyVRP](./09_pyvrp.md) — the fleet/vehicle-routing optimizers that
  *consume* the NetworkX travel-time matrix.
- [SimPy](./01_simpy.md) — the discrete-event simulator that replays the optimized routing plan under
  uncertainty.
