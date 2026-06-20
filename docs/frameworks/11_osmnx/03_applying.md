# OSMnx — 03 · Applying it to a real problem

This page explains *where* OSMnx fits in CAOS_SIMLAB, how to **formalize** the kind of problem it
solves and **solve** it with this tool, the **honest trade-offs** (grounded in research dimension
03, *Optimization & Routing*), and **when to pick OSMnx vs the alternatives**. For the API and
verified example see [`02_usage.md`](./02_usage.md); for install/version see
[`01_installation.md`](./01_installation.md).

---

## 1. What problem OSMnx actually solves here

A router (OR-Tools, PyVRP) does not know what a road is. Before it can optimize anything it needs
a **cost matrix**: the travel time or distance between every pair of locations. That matrix comes
from a **graph**, and OSMnx is the tool that produces a *real* road graph — and the drawable
polylines to animate the result on a map.

So OSMnx is never the headline of a scenario; it is the **road layer underneath the optimizer and
the simulator**. Two jobs:

1. **Build the distance/time matrix** that feeds OR-Tools / PyVRP (shortest path between each pair
   of stops on the road network).
2. **Provide drawable geometry** (route LineStrings) so the optimized plan can be animated on a 2D
   map and, for haul scenarios, draped over terrain.

---

## 2. Formalize the problem, then solve it with OSMnx

The routing problems in this lab reduce to one shape. Write it down before reaching for a tool:

- **Given** a set of locations `L = {l_0, …, l_{n-1}}` (depots, stops, incident sites) as lon/lat
  coordinates, and a **road network** `G = (V, E)` with positive edge costs `c: E → ℝ⁺`
  (metres for distance, seconds for time).
- **Want** the `n × n` **cost matrix** `D` where `D[i][j]` is the cost of the cheapest path from
  `l_i` to `l_j` *on the road network* (not the straight-line distance) — plus, for the chosen
  plan, the **polyline geometry** of each leg for display.

The straight-line ("as the crow flies") distance is the wrong cost: roads bend, are one-way, and
have speed limits. OSMnx gives you the real graph and the real shortest paths. The solve, step by
step with this tool:

1. **Obtain `G`.** `ox.graph_from_point(center, dist=…, network_type="drive")` (small radius) or
   the synthetic stand-in. The graph already carries `length` (metres) on every edge.
2. **Turn cost into time.** `ox.add_edge_speeds(G, fallback=…)` then `ox.add_edge_travel_times(G)`
   so each edge has `travel_time` (seconds) — usually the cost you actually want to optimize.
3. **Snap each `l_i` to a node.** `ox.distance.nearest_nodes(G, X=lon, Y=lat)` → `node_i`.
   (Remember `X=lon, Y=lat`.)
4. **Fill `D`.** For each ordered pair `(i, j)`, run `ox.routing.shortest_path(G, node_i, node_j,
   weight="travel_time")` and sum the edge weights along the returned node list (or use NetworkX
   `nx.shortest_path_length` directly for the scalar). This is the matrix the solver consumes.
5. **Hand `D` to the optimizer.** OR-Tools / PyVRP solves CVRP/VRPTW/dispatch on `D`.
6. **Render the chosen legs.** `ox.routing.route_to_gdf(G, route, weight="length")` → LineStrings;
   serialise to JSON. **This JSON is the only OSMnx artifact the public repo commits.**

The `k_shortest_paths` helper additionally lets you surface route **alternatives** (detours), which
is how a viewer shows that "the optimum" is one of several near-equal options.

---

## 3. Which scenarios use it

Per the scenario→tool map and the routing problem-type guide
([`../../problem-types/03_optimization-routing.md`](../../problem-types/03_optimization-routing.md)):

| Scenario | OSMnx role (the real-OSM on-ramp) | Shipped engines |
|---|---|---|
| **S07 — Construction haul routing** | *would* supply a real OSM road graph + grade-aware cost when wired in; the **shipped** S07 uses a synthetic graded `_geo` grid via NetworkX (no OSMnx) | NetworkX (Dijkstra route) + **OR-Tools CP-SAT** (route-cost certificate) + a **deterministic** SimPy haul DES |
| **S09 — Emergency / ambulance dispatch** | *would* supply the real city road graph; the **shipped** S09 uses the synthetic `_geo` city grid via NetworkX (no OSMnx) | NetworkX (shortest paths) + **SimPy** driven by **one seeded** Poisson call stream (no OR-Tools) |

OSMnx is the **real-OSM on-ramp** for the road layer. Importantly, the **shipped** S07/S09 build their
graphs from the synthetic `_geo` grid with **NetworkX** — they do *not* import OSMnx; it is the documented
next step for real geography. (S08 last-mile VRP also routes on a road network conceptually, but its headline
contrast is OR-Tools-vs-PyVRP; OSMnx would supply the graph/matrix role there too when a real network is
wired in.)

> **Honest status of the repo today.** No scenario currently ingests OpenStreetMap. S07/S08/S09
> run on a **self-contained synthetic `GridNetwork`** (`simlab/scenarios/_geo.py`) — a grid of
> junctions with an analytic elevation field and Dijkstra shortest paths — precisely so the public
> repo carries no ODbL-encumbered data and stays deterministic. OSMnx is the documented **drop-in
> real road layer**: the synthetic graph mimics the OSMnx graph contract (`x`/`y` nodes, `length`
> edges), so swapping in `ox.graph_from_point(...)` is a localised change, not a rewrite. See
> [`ATTRIBUTION.md`](../../../ATTRIBUTION.md).

---

## 4. The pattern: build-the-graph → matrix → optimize → simulate

OSMnx sits at the front of the lab's core didactic pattern, **optimize-then-simulate**
(simheuristics):

1. **Graph (OSMnx).** Acquire the road network (live, small) or load the synthetic stand-in.
   Enrich edges with `speed_kph` / `travel_time`.
2. **Matrix (OSMnx + NetworkX).** Compute shortest paths between all stops to build the N×N
   travel-time matrix — `ox.routing.shortest_path` / `nx` Dijkstra. This is the input the solver
   actually consumes.
3. **Optimize (OR-Tools / PyVRP).** Solve CVRP/VRPTW on **deterministic** travel times → a plan
   that is optimal *for that idealized world*.
4. **Simulate (SimPy).** Replay that exact plan under **stochastic** delays — travel-time noise,
   loader/dump queues, breakdowns, random calls — and watch the "optimal" plan degrade (missed
   time windows, idle ambulances, queueing).
5. **Render (OSMnx geometry).** Animate the route polylines from `route_to_gdf` on the map.

The lesson the learner takes away — straight from the research — is *"an optimum on paper is
fragile under uncertainty."* OSMnx makes step 1–2 *real geography* instead of an abstract matrix,
and step 5 *visible* instead of a number.

---

## 5. Honest trade-offs (from the research)

These are the documented limits of using OSMnx as the road layer:

- **The matrix is the real bottleneck, not the solver.** For N stops you need an N×N travel-time
  matrix; OSMnx all-pairs shortest paths on a large graph is *slow* and does not scale. The
  research is explicit: **cap "live" instances small (≈ ≤ 20–30 stops)** and **precompute** the
  matrix for anything bigger.
- **CPU-only, pure-Python — a feature for clarity, a limit for scale.** OSMnx/NetworkX is fully
  inspectable and readable (its highest didactic value), but for large geography-real instances it
  is outpaced by a compiled engine. The RTX-4070 gives it nothing; there is no GPU path.
- **Network dependency at acquire time.** `graph_from_*` hits the public Overpass API — slow,
  rate-limited, and non-deterministic across snapshots. For reproducible committed runs you must
  pin a snapshot and commit only the rendered output, never re-download in CI.
- **ODbL is a share-alike trap.** A pruned OSM graph is a Derivative Database. Commit **rendered
  geometry only** (JSON), never raw `.graphml`, and display "© OpenStreetMap contributors". This
  is the single biggest public-repo risk in this dimension.
- **Determinism for replay.** Because the lab's contract is "replay = truth", any committed OSMnx
  output must be reproducible: pin the OSM snapshot, fix the cost/speed assumptions, and (for the
  downstream solver/SimPy) seed the RNGs.

---

## 6. When to pick OSMnx vs the alternatives

The routing dimension defines a clear ladder; pick by **instance size and where it runs**:

| Use… | When | Why |
|---|---|---|
| **OSMnx + NetworkX** (this tool) | small "light" instances (≤ ~20–30 stops); the *teaching* road layer; building drawable geometry | Pure Python, MIT, no server, fully inspectable, highest didactic clarity. Can even run in the live/Pyodide tier for tiny graphs. |
| **OSRM** (BSD-2, Docker) | large, geography-real instances needing a fast all-pairs `Table` matrix | Compiled C++ engine; preprocessing OSM is RAM/disk-heavy and stateful — **precompute pipeline only, never the live (Pages) deploy**; commit only its JSON output. |
| **VROOM** (BSD-2, Docker) | want an out-of-the-box VRP engine that wraps OSRM | Solves CVRP/VRPTW in ms, but a *black box* relative to OR-Tools/PyVRP — teaches less; keep it as a precompute convenience, not the primary teaching tool. |
| **synthetic `GridNetwork`** (in-repo) | you want zero external data, perfect determinism, and no ODbL exposure | The repo's current default; mimics the OSMnx graph contract so OSMnx is a drop-in upgrade. |

Rule of thumb from the research: **keep live instances small with OSMnx/NetworkX; precompute the
matrix with OSRM for anything larger, and commit the JSON.** Both OSRM and VROOM are
**local-precompute backends** — neither belongs on the live deploy (the public site is static
GitHub Pages, no app server). The compatible permissive licenses (OSMnx/NetworkX MIT, OR-Tools Apache-2.0, PyVRP MIT,
OSRM/VROOM BSD-2) make mixing them safe; the **ODbL on the underlying OSM data** is the only
share-alike obligation to manage.

---

## 7. Deprecated — do not use

`AgentPy` and `desmod` are deprecated and excluded from this lab; ignore any tutorial that
recommends them. The road layer is **OSMnx + NetworkX**, paired with OR-Tools/PyVRP for
optimization and SimPy for the stochastic replay.

---

### Sources

Grounded in the CAOS_SIMLAB research and synthesis:

- Optimization & Routing research dimension (report 03) — OSMnx/NetworkX as the live road layer,
  the matrix bottleneck, OSRM/VROOM as precompute backends, ODbL hygiene, optimize-then-simulate.
- Scenario catalog (report 10) — S07/S08/S09 road layer; ODbL "attribution + share-alike on
  derived data".
- Routing problem-type guide:
  [`../../problem-types/03_optimization-routing.md`](../../problem-types/03_optimization-routing.md).
- OSMnx (Boeing 2025, MIT): <https://github.com/gboeing/osmnx>
- OR-Tools (Apache-2.0): <https://github.com/google/or-tools>
- PyVRP (MIT): <https://github.com/PyVRP/PyVRP>
- OSRM (BSD-2): <https://github.com/Project-OSRM/osrm-backend> ·
  VROOM (BSD-2): <https://github.com/VROOM-Project/vroom>
- Repo attribution policy: [`ATTRIBUTION.md`](../../../ATTRIBUTION.md)

---

**Back to the node landing page:** [`../11_osmnx.md`](../11_osmnx.md).
