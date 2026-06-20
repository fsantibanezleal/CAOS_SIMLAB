# NetworkX — Applying it

This page is the "when and why" for NetworkX in CAOS_SIMLAB: which scenarios use it, the pattern it
serves, the honest trade-offs from the research, and when to reach for it versus the alternatives.

## What NetworkX is *for* in this lab

NetworkX is the **graph layer**: it holds the network (junctions + weighted road segments) and answers
**shortest-path** questions on it — the cheapest route between two points, and the *k* cheapest distinct
alternatives. It is **not** a vehicle-routing optimizer (that is OR-Tools / PyVRP) and **not** a
simulator (that is SimPy). It sits *upstream* of both: it produces the road geometry and the
travel-time matrix that the optimizer consumes, and the route polylines that the simulator animates.

The companion tool is **OSMnx**, which downloads real OpenStreetMap road networks *into* a NetworkX
graph. NetworkX is the algorithms; OSMnx is the real-world data source. In the synthetic example in
this folder we generate the grid directly, so no OSMnx and no OSM attribution are needed.

## Which scenarios use it

| Scenario | How NetworkX is used | Paired with |
|---|---|---|
| **S07 — Construction Haul Routing** | Shortest path across a graded junction grid; the edge cost encodes **grade × elevation gain**, so the "cheapest" haul route bends around steep climbs. k-shortest paths expose the near-tie between the direct climb and the longer-but-flatter detour (the route "flips" past a critical grade). | **SimPy** DES replay under stochastic load/dump/queue delays; 2D grade overlay |
| **S09 — Ambulance Dispatch** | Shortest path on a city junction grid to compute travel time from each station to each call, which drives the nearest-available-ambulance dispatch decision. Shortest-path lengths feed the response-time and coverage KPIs. | **SimPy** DES with stochastic Poisson call arrivals over many runs |

> **Implementation note (honesty):** the *current* S07/S09 code in the lab ships a small hand-rolled
> Dijkstra in `simlab/scenarios/_geo.py` (a teaching-transparent ~25-line `heapq` loop). NetworkX is
> documented here as the **library-grade, canonical equivalent** of that same computation — the tool
> you reach for the moment you outgrow the toy grid (real OSM graphs, A\* on large networks, k-shortest
> alternatives, all-pairs matrices). The algorithm and results are the same; NetworkX gives you the
> battle-tested, feature-complete implementation and the OSMnx on-ramp to real data.

## The pattern: graph → matrix → optimize → simulate

NetworkX is the **first stage** of the lab's signature *optimize-then-simulate* (simheuristic)
pipeline:

1. **Graph.** Build (or download via OSMnx) the road network as a weighted NetworkX graph.
2. **Matrix.** Run shortest paths (Dijkstra / A\* / all-pairs) to get the N×N travel-time matrix and
   the drawable route geometry. *This is the NetworkX step.*
3. **Optimize.** Hand the matrix to OR-Tools / PyVRP to choose routes or dispatch (deterministic
   inputs → an "optimal" plan).
4. **Simulate.** Replay the plan in a **SimPy** DES under stochastic delays and watch the optimum
   degrade — missed time windows, queueing, idle ambulances.

The research states the bridge plainly: *"an optimum on paper is fragile under uncertainty"* — the
optimizer proposes, the simulator disposes. NetworkX makes step 2 readable and inspectable. The
**k-shortest paths** capability is what makes the fragility *visible*: when route #1 and route #2 are a
near-tie (8.986 vs 9.029 in the example), a tiny stochastic delay on one segment is enough to make the
"second-best" route actually win — which is exactly the lesson the SimPy replay drives home.

## Honest trade-offs (grounded in the research)

**Strengths — why NetworkX is the road layer:**

- **Highest didactic clarity in the routing dimension.** The research's framework table rates
  "OSMnx + NetworkX" as the **highest** for didactic clarity: *"Pure Python… readable, no server,
  draws routes."* You can read the whole shortest-path computation.
- **Pure Python, no server, no native code.** It can run *live* in the browser Pyodide tier for small
  graphs, and it draws route polylines you can put on a 2D map or drape on a terrain mesh.
- **Permissive license (BSD-3).** Safe to vendor and ship in a public repo; pairs with MIT OSMnx.
- **Zero hard dependencies.** The path algorithms run on the standard library alone.

**Limits — when NetworkX stops being the right tool:**

- **The matrix is the bottleneck, not the path query.** For *N* stops you need an *N×N* travel-time
  matrix; all-pairs shortest paths on a *large* OSM graph is **slow**. The research is explicit: keep
  *live* instances small (**≈ ≤ 20–30 stops**) and **precompute** the matrix for anything bigger using
  a heavy backend (**OSRM**'s `Table` service via Docker), committing only the JSON. NetworkX is the
  *live/light* path; it is not the high-throughput matrix engine.
- **It finds paths, it does not route a fleet.** A single shortest path is not a CVRP/VRPTW solution.
  The moment the problem is "many vehicles, capacities, time windows", you move *up* to OR-Tools or
  PyVRP — NetworkX only supplies their distance matrix.
- **Single-pair on huge graphs.** Plain Dijkstra explores too much; switch to **A\*** with a
  straight-line heuristic for big single-pair queries.

## When to pick NetworkX vs the alternatives

| You need… | Reach for | Why |
|---|---|---|
| Shortest path / k-shortest paths on a small or medium graph, live and readable | **NetworkX** | Pure Python, inspectable, runs in Pyodide; highest didactic clarity |
| The same, but on a *real* road network | **OSMnx → NetworkX** | OSMnx downloads OSM into a NetworkX graph; same path API (mind ODbL attribution) |
| A *fast all-pairs travel-time matrix* on a large geography | **OSRM** (`Table`, Docker, precompute) | NetworkX all-pairs does not scale; OSRM is the C++ matrix engine — commit JSON only |
| Choosing routes for a *fleet* (CVRP / VRPTW / PDPTW) | **OR-Tools Routing** (teaching default) / **PyVRP** (SOTA contrast) | These are vehicle-routing solvers; they *consume* the NetworkX/OSRM matrix |
| Out-of-the-box VRP wrapping real matrices | **VROOM** (precompute, Docker) | Convenient black box; teaches less than OR-Tools/PyVRP |

**Rule of thumb from the research:** *NetworkX/OSMnx for the live, light, ≤ 20–30-stop road layer;
OSRM to precompute big matrices; OR-Tools/PyVRP to optimize the fleet on top of that matrix; SimPy to
stress-test the resulting plan.*

## Deprecated — do not use

`AgentPy` and `desmod` show up in older tutorials but are **deprecated and excluded** from this lab.
They are simulation wrappers, unrelated to graphs, and mentioned here only so any tutorial pairing them
with routing is ignored. For graphs use **NetworkX**; for the optimizer use **OR-Tools / PyVRP**; for
the simulator use **SimPy**.

## Sources

Grounded in the CAOS_SIMLAB optimization & routing research dimension (report 03):

- NetworkX: <https://networkx.org/> · OSMnx (Boeing, MIT): <https://github.com/gboeing/osmnx>
- OR-Tools (Apache-2.0): <https://github.com/google/or-tools> · PyVRP (MIT):
  <https://github.com/PyVRP/PyVRP>
- OSRM (BSD-2, `Table` matrix, self-host): <https://github.com/Project-OSRM/osrm-backend> ·
  VROOM (BSD-2): <https://github.com/VROOM-Project/vroom>
- Simheuristics / agile-optimization survey: <https://www.mdpi.com/2076-3417/13/1/101>
- Sim-optimization for stochastic location-routing:
  <https://link.springer.com/article/10.1057/jos.2015.15>
- OpenStreetMap data is **ODbL** — display "© OpenStreetMap contributors", commit rendered geometry
  only (see the repo's `ATTRIBUTION.md`).
