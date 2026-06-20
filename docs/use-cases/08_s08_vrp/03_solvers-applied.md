# 03 · Solvers applied — S08 Vehicle Routing Problem (CVRP)

> Part of the [S08 — Vehicle Routing Problem](../08_s08_vrp.md) use-case node. This page says **which
> dedicated tools** solve the instance, **how** (the concrete API and configuration in the code), **why**
> these tools, and the **live-vs-precompute lane**. Everything maps directly onto
> `simlab/scenarios/s08_vrp.py`.

## Two solvers, one instance

S08 deliberately runs the **same** CVRP instance through **two state-of-the-art VRP engines** and exposes
**both** plans, so the lab can show the contrast between a capable general-purpose solver and a specialised
competition-grade one:

| Engine | Role | What it minimizes | Where it lands in the trace |
|---|---|---|---|
| **OR-Tools** routing (Google) | **primary** plan | total distance **+** a global-span penalty (balanced routes) | `routes` / `agents` / `kpis` — rendered exactly as the app already does |
| **PyVRP** (Hybrid Genetic Search) | **SOTA contrast** | **pure** total distance | the free-form `analytic` slot — overlaid/toggled, no schema change |

Both engines see one instance from one seeded RNG; distances are the integer-scaled grid shortest paths
([01 · Assumptions](./01_assumptions.md)), so the comparison is fair and the run reproducible.

## OR-Tools routing — the primary plan (`solve_ortools`)

OR-Tools is the lab's **optimization default** ([08 · OR-Tools framework node](../../frameworks/08_ortools.md)):
a single Apache-2.0 pip package whose **Routing** layer models VRP/CVRP/VRPTW/PDPTW on top of constraint
programming. The concrete approach in the code:

- **Index manager + routing model**: `pywrapcp.RoutingIndexManager(len(special), K, 0)` (depot = node 0),
  then `pywrapcp.RoutingModel(manager)`.
- **Arc cost** = the integer distance matrix, registered as a transit callback
  (`RegisterTransitCallback`) and set on all vehicles.
- **Capacity dimension**: a unary demand callback feeds
  `AddDimensionWithVehicleCapacity(dem_cb, 0, [Q]*K, True, "Capacity")` — this enforces $u_i \le Q$ per
  vehicle (the MTZ-style load constraint of [02 · Formalization](./02_formalization.md)).
- **Distance dimension + global span**: `AddDimension(transit, 0, 1_000_000, True, "Distance")` then
  `GetDimensionOrDie("Distance").SetGlobalSpanCostCoefficient(100)` — this is the $\gamma = 100$ term that
  **balances** route lengths (minimizes the longest route), so added vehicles are actually used and the
  total-distance-vs-longest-route trade-off becomes visible.
- **Search strategy (mandatory, or the lesson lies)**: first solution
  `FirstSolutionStrategy.PATH_CHEAPEST_ARC`, metaheuristic
  `LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH`. Out of the box OR-Tools returns the *first feasible*
  construction and stops — not optimized — which would make it look far worse than PyVRP; GLS is what makes
  the comparison honest (see the problem-type guide's critical-configuration callout).
- **Deterministic stop**: `sp.solution_limit = 200` (`OR_SOLUTION_LIMIT`) — a **solution-count** limit, not
  a wall-clock `time_limit`. This is deliberate: a wall-clock limit makes the optimum machine-dependent (a
  faster laptop explores more), whereas a count limit makes the committed trace **byte-stable on any
  machine** — the *"replay = truth"* contract. (The Experiments Context prose describes the stop as a
  3-second time limit; the **code uses `solution_limit` instead**, and the code is authoritative.)
- **Reading the solution**: walk each vehicle's chain from `routing.Start(vh)` via `sol.Value(NextVar(...))`
  to the end, collecting `manager.IndexToNode(idx)`, and append the depot to close the tour →
  per-vehicle `special`-index sequences.

**Why OR-Tools here**: it is the teaching default — one library covers the whole OR curriculum, it is
CPU-only and cross-platform, and its Routing layer is the best-trodden path for capacitated routing with a
balancing objective.

## PyVRP — the state-of-the-art contrast (`solve_pyvrp`)

PyVRP is a single-purpose, **competition-winning Hybrid Genetic Search** solver (the lineage behind first
place in the 2021 DIMACS VRPTW challenge and the static EURO-NeurIPS 2022 competition) —
[09 · PyVRP framework node](../../frameworks/09_pyvrp.md). It exists in S08 *so the learner can see the gap*
between a properly-configured general solver and "what good looks like" on the **identical** instance. The
concrete approach in the code (the verified `Model` builder API):

- **Build the model**: `m = Model()`; add the depot at the depot's grid coordinates
  (`m.add_depot(x, y)`); add the homogeneous fleet with `m.add_vehicle_type(num_available=K, capacity=Q)`.
- **Add clients**: one `m.add_client(x, y, delivery=d_i)` per customer, in `special` order (so location index
  0 = depot, 1..n = clients — exactly the indices the distance matrix uses).
- **Add the *same* edges**: explicit `m.add_edge(frm, to, distance=D[i][j])` for every ordered pair using the
  **identical scaled-integer matrix OR-Tools uses** — this is what makes the comparison fair (the cost is
  driven by the same matrix, not by PyVRP's own coordinate bookkeeping).
- **Deterministic stop + seed**: `m.solve(stop=MaxIterations(200), seed=42, display=False)` — `MaxIterations`
  is a **count**, not wall time, and HGS is stochastic so the fixed `seed` keeps the committed plan
  reproducible.
- **Reading the solution**: each `route.visits()` is a list of **location indices in `special` numbering**;
  wrap with the depot (`[0, *visits, 0]`) to close the tour → per-vehicle `special`-index sequences, the same
  shape OR-Tools produces.

PyVRP minimizes **pure total distance** (no global-span term), so its plan is typically **shorter in total
but less balanced** than OR-Tools' — exactly the trade-off the head-to-head exposes.

## Shared rendering and the head-to-head

Both solvers' `special`-index sequences go through the **same** `_plan_from_special_seqs` helper, which
expands each route into grid-node polylines + timed legs and computes `total_distance`, `max_route_dist`,
`vehicles_used` and per-vehicle `loads`. Because both plans use the same renderer they are drawn identically.
The OR-Tools plan becomes the trace's `routes`/`agents`/`kpis`; the PyVRP plan plus a `compare` block
(`distance_gap`, `distance_gap_pct`, both `max_route_dist`) is carried in `analytic` so the frontend can
overlay/toggle the SOTA contrast and CI can assert the gap. See [04 · Results & reading](./04_results-and-reading.md).

## Live vs. precompute lane

S08 is **precompute-only — never live**. Per the lab's 3-gate rule, the **engine gate** requires pure
Python to run in the browser (Pyodide). **Both** engines fail it: OR-Tools is native C++ with a Python
wrapper, and PyVRP is a C++ core wrapped in Python — neither compiles to WASM. So:

- both solvers run **offline** in the local `.venv` (they are lazily imported inside the solve functions,
  marked *"precompute-only"*), emit a **seeded JSON trace + manifest**, and the front end only **replays**
  the committed plans with a scrubber under the *"precomputed due to cost; full pipeline in the repo"* banner;
- the scenario declares `pure_python = False` and `engine = "ortools+pyvrp"`, and the manifest's `lane` is
  `precomputed` — confirming no live tier;
- the only pure-Python piece that *could* touch the live tier — the grid shortest-path matrix — is here used
  offline to build the cost matrix, not exposed as a live re-solve.

See [Precompute pipeline](../../guides/01_precompute-pipeline.md) for the local `.venv` → seeded trace → replay
flow, and the [Optimization & Routing](../../problem-types/03_optimization-routing.md) guide for why these two
engines are paired (and why the GLS + deterministic-stop + seed configuration is mandatory).
