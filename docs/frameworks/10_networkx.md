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
("replay = truth"). The k-shortest-paths capability is what makes route *fragility* legible: when the two
cheapest routes are a near-tie, a small change in edge weights (e.g. a barrier or a grade shift) flips which
one wins — in S07 the grade slider and wall toggle re-select among committed plans to show exactly that
switch. (The shipped SimPy replays are deterministic; the fragility is shown by re-selecting plans, not by
injecting random delay.)

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

Both scenarios are in the
[Optimization & Routing problem type](../problem-types/03_optimization-routing.md). NetworkX is the road
layer in each, but the rest of the pipeline differs:

- **S07 — Construction Haul Routing.** NetworkX (`nx.dijkstra_path`) finds the haul route on the graded road
  graph; **OR-Tools CP-SAT** certifies that route's cost (offline); the committed plan is then replayed by a
  **deterministic** SimPy haul DES whose saturation comes from the shared finite loader.
- **S09 — Ambulance Dispatch.** NetworkX (`nx.single_source_dijkstra` over the in-repo road graph) supplies
  the shortest paths, and **SimPy** replays the seeded Poisson call stream with exact **nearest-available**
  (closed-form argmin) dispatch and deterministic per-leg service — **no OR-Tools**, no stochastic
  stress-test.

## Companion & alternative frameworks

- [OSMnx](./11_osmnx.md) — downloads real OSM road networks into a NetworkX graph (the real-world data
  source; same path API). *(Mind OSM's ODbL attribution — see [`../../ATTRIBUTION.md`](../../ATTRIBUTION.md).)*
- [OR-Tools](./08_ortools.md) · [PyVRP](./09_pyvrp.md) — the fleet/vehicle-routing optimizers that
  *consume* the NetworkX travel-time matrix.
- [SimPy](./01_simpy.md) — the discrete-event simulator that replays the routing plan (the deterministic
  S07 haul DES; the seeded nearest-available S09 dispatch).
