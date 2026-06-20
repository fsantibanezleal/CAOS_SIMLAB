# Optimization & Routing (Operations Research)

> Part of the CAOS_SIMLAB problem-type guides. This page is the decision map for the
> **optimization** half of the lab: which solver to reach for, what each one is honestly good at,
> and how an optimized plan is handed to a discrete-event simulation so a learner can watch it
> survive — or fail — under uncertainty.

Where the [DES](./discrete-event-simulation.md) and [ABM](./agent-based-modeling.md) guides cover
*simulating* a system, this guide covers *deciding* something about it: the best machine schedule,
the cheapest set of delivery routes, the fastest path across a road network. Operations Research (OR)
is the discipline of computing those decisions, and CAOS_SIMLAB treats it as the natural partner of
simulation — not a competitor.

The single most important lesson on this page, and the reason every optimization scenario in the lab
is paired with a simulator, is this:

> **An optimum on paper is fragile under uncertainty.** A route plan that is provably minimal on
> *deterministic* travel times can violate every time window the moment real traffic, breakdowns, or
> stochastic demand arrive. The job of OR here is not to produce a number to admire; it is to produce
> a *plan to stress-test*.

---

## 1. The optimization toolbox (what to use for what)

Every tool below is a real, dedicated solver — none of this is "minimize a loss with a for-loop by
hand". The recommendations and trade-offs come directly from the CAOS_SIMLAB optimization & routing
research dimension (research report 03).

| Tool | Role in the lab | Problems it solves | License | Live in browser? |
|---|---|---|---|---|
| **OR-Tools** (Routing + CP-SAT) | **Teaching default** | LP (GLOP), MILP (CBC/branch&bound), CP-SAT scheduling/assignment, TSP, CVRP, VRPTW, PDPTW | Apache-2.0 | **No** (native C++) → precompute |
| **PyVRP** | The "what *good* looks like" contrast | CVRP, VRPTW, PD, MDVRP, prize-collecting, heterogeneous/multi-trip | MIT | No (C++/Python) → precompute |
| **NetworkX + OSMnx** | Road graph + shortest paths + travel-time matrix | Dijkstra, A\*, k-shortest paths, graph download | MIT | **Yes** (pure Python, small graphs) |
| **OSRM / VROOM** | Heavy precompute backends: fast all-pairs matrix + out-of-the-box VRP | `Table` (matrix), `Route`, TSP, CVRP, VRPTW, PDPTW | BSD-2 | No — **local-only**, commit JSON |

> **Deprecated — do not use.** `AgentPy` and `desmod` show up in older OR/simulation tutorials but
> are deprecated and excluded from this lab. If you see them recommended elsewhere, ignore it. For
> ABM use **Mesa / Mesa-Geo**; for DES use **SimPy / Ciw / Salabim** (see the sibling guides).

### Why OR-Tools is the default and not the only choice

[**OR-Tools**](https://github.com/google/or-tools) (Google, Apache-2.0) is the teaching default for one
reason: a single `pip install ortools` gives you almost the entire OR curriculum in one importable
library — linear programming, mixed-integer programming, constraint programming, *and* a dedicated
vehicle-routing layer. That breadth is exactly what a didactic lab wants: maximum number of teachable
problem types for minimum infrastructure, CPU-only, on Windows/macOS/Linux.

[**PyVRP**](https://github.com/PyVRP/PyVRP) (MIT) is the deliberate counterweight. It is a single-purpose,
competition-winning Hybrid Genetic Search solver (more on this in §5). It exists in the lab *so the
learner can see the gap* between a capable general-purpose solver running with default settings and a
specialised state-of-the-art solver on the **same instance**. Showing only OR-Tools would teach "this
is what an optimizer produces"; showing both teaches "solution quality is a choice you make".

---

## 2. Linear Programming (LP) — OR-Tools GLOP

**Linear programming** is the simplest and most fundamental OR model: a linear objective minimized or
maximized subject to linear constraints, with **continuous** decision variables. Because the feasible
region is a convex polytope, an LP is solved *exactly and quickly* — there is no combinatorial
explosion.

In OR-Tools, LP is solved by **GLOP** (Google's primal-dual simplex implementation). Reach for GLOP
when the decision is fundamentally "how much of each thing" rather than "which discrete choice":
allocate a fleet's hours across faces, blend feed grades to hit a target, decide flow rates on a
network.

```text
maximise / minimise   cᵀx
subject to            Ax ≤ b,   x ≥ 0     (x continuous)
```

LP is the backbone of scenario **S11 (mine haul)** in this lab: an OR-Tools **GLOP LP** computes the
steady-state allocation of trucks to shovels / routes (a continuous flow problem), and a **SimPy** DES
then injects discrete breakdowns and queueing to show how the smooth LP allocation degrades into a
lumpy reality. LP gives the *target*; the simulation reveals the *gap*.

**Honest limit:** LP assumes everything is divisible and deterministic. You cannot say "use exactly 7
trucks" in pure LP (that needs an integer variable → MILP), and the LP optimum says nothing about
variance. Both gaps are pedagogical features here, not bugs.

---

## 3. Mixed-Integer Linear Programming (MILP) — branch & bound

When *some* decision variables must be **integer** (a count of vehicles, an on/off facility, an
assignment that is yes-or-no), the problem becomes a **Mixed-Integer Linear Program**. The model looks
like an LP, but the integrality requirement makes it NP-hard in general.

The standard exact method is **branch & bound**: solve the LP relaxation (ignore integrality); if a
fractional variable appears, *branch* into two subproblems (e.g. `x ≤ 3` and `x ≥ 4`); use the LP
relaxation as a *bound* to prune subtrees that cannot beat the best integer solution found so far.
OR-Tools exposes MILP through its linear-solver wrapper (CBC and other backends) and, increasingly, the
same models solve faster as **CP-SAT** (§4).

**Use MILP when** the structure is "linear costs and constraints, but with indivisible/yes-no
decisions": facility location, fixed-charge network design, "open this depot or not", integer fleet
sizing. **Don't use MILP when** the model is heavily logical/combinatorial (sequencing, no-overlap,
alldifferent) — CP-SAT will usually express it more naturally and solve it faster.

**Honest limit:** branch & bound is *exact* but can be *exponential*. On small instances you get a
proven optimum; on large ones you set a time limit and accept a gap (the best bound vs. best solution).
That trade-off — proof of optimality vs. wall-clock — is exactly what a learner should feel.

---

## 4. Constraint Programming — OR-Tools CP-SAT

**CP-SAT** is OR-Tools' constraint-programming-over-SAT solver, and it is the strongest single tool in
the lab for **scheduling and combinatorial feasibility**. Instead of expressing everything as linear
inequalities, CP lets you state high-level combinatorial constraints directly — `NoOverlap` (two tasks
can't use the same machine at once), `AllDifferent`, interval variables with start/duration/end,
precedence, cumulative resource limits — and the solver searches with constraint propagation plus
modern SAT/learning techniques.

This is the engine behind scenario **S06 (job-shop scheduling)**:

- Each job is a chain of operations, each operation must run on a specific machine for a fixed time, and
  operations on the same machine cannot overlap.
- CP-SAT models each operation as an **interval variable**, adds `NoOverlap` per machine and precedence
  per job, and **minimizes the makespan** (the finish time of the last operation).
- The lab solves a public OR-Library job-shop instance offline and replays the optimal/near-optimal
  schedule as an **animated Gantt chart** — the one scenario whose visual is a Gantt rather than a queue
  network or a map.

**Use CP-SAT for** job-shop / flow-shop scheduling, crew and machine assignment, rostering, sequencing,
and any model dominated by logical constraints. CP-SAT can also model the routing problems below via
`AddCircuit` / `add_multiple_circuit`, but for vehicle routing the dedicated Routing layer (§5) is the
better-trodden teaching path.

**Honest limit:** CP-SAT returns the best solution found within its time limit and a bound; for a hard
instance it may stop *near* optimal without a proof. Always commit the **time limit, search parameters,
and seed** with the scenario so the replayed schedule is reproducible.

---

## 5. Routing — TSP, CVRP, VRPTW (OR-Tools Routing + PyVRP)

Vehicle routing is the lab's headline OR family, and it comes in a ladder of difficulty:

- **TSP (Travelling Salesman):** one vehicle, visit every node once, return to start, minimize distance.
- **CVRP (Capacitated VRP):** a fleet with capacity limits serving customer demands from a depot.
- **VRPTW (VRP with Time Windows):** CVRP where each customer must be served inside `[earliest, latest]`
  — the model where "fragile under uncertainty" bites hardest, because a single delay cascades into
  downstream window violations.
- **PDPTW (Pickup-and-Delivery with Time Windows):** every request pairs a pickup and a delivery with
  precedence and same-vehicle constraints.

### OR-Tools Routing — the teaching default, with a mandatory caveat

OR-Tools' **Routing** library models all of the above with capacities, time-window dimensions, and
pickup/delivery constraints in one consistent API. It is the default teaching object.

> **Critical configuration — or the lesson lies.** Out of the box, OR-Tools Routing returns the
> *first feasible solution* it finds (e.g. a cheap nearest-neighbor construction) and stops. That is
> **not** optimized. If you then compare it to PyVRP, OR-Tools will look far worse than it really is and
> the comparison misleads the learner. Every routing scenario in this lab **must** set, explicitly:
>
> - a **first-solution strategy** (e.g. `PATH_CHEAPEST_ARC`),
> - the **`GUIDED_LOCAL_SEARCH`** metaheuristic for local-search improvement,
> - a **time limit**, and
> - a **fixed random seed**.
>
> These four are baked into the scenario template. Skip them and the OR-Tools-vs-PyVRP exhibit becomes
> dishonest.

### PyVRP — the state-of-the-art contrast

[**PyVRP**](https://github.com/PyVRP/PyVRP) (MIT) implements **Hybrid Genetic Search (HGS)**, the
algorithm family behind first place in the 2021 DIMACS VRPTW challenge and the static EURO-NeurIPS 2022
competition. On the same CVRP/VRPTW instance, properly-configured OR-Tools is solid, but PyVRP
typically finds *materially shorter* routes. The lab presents both so the learner internalizes that a
specialised competition-grade solver and a capable general-purpose one are genuinely different tiers —
"what good looks like" is a concrete, measurable thing.

PyVRP's HGS is **stochastic**, so its run must be **seeded** to keep committed precomputed routes
reproducible.

This pairing drives scenario **S08 (VRP/VRPTW)**: solve a public **Solomon / Gehring-Homberger** VRPTW
benchmark with both OR-Tools and PyVRP, animate the optimized routes on a 2D map, then hand the chosen
plan to a **SimPy** replay (see §7).

---

## 6. Shortest paths & the road graph — NetworkX + OSMnx (and OSRM/VROOM)

Before any router can optimize, it needs a **cost matrix**: the travel time or distance between every
pair of locations. That matrix comes from a graph, and graphs are where most of the real
engineering — and the real bottleneck — lives.

### NetworkX + OSMnx — the live, in-process, pure-Python path

[**OSMnx**](https://github.com/gboeing/osmnx) (Boeing, MIT) downloads a real road network from
OpenStreetMap as a [**NetworkX**](https://networkx.org/) graph, and NetworkX provides the classic
shortest-path algorithms:

- **Dijkstra** — exact shortest path on non-negative weights; the default for road travel times.
- **A\*** — Dijkstra with an admissible heuristic (e.g. straight-line distance) to expand fewer nodes;
  faster for single-pair queries on large graphs.
- **k-shortest paths** — alternative routes, useful for showing route diversity.

Because this stack is **pure Python**, small road graphs *can* run live in the Pyodide Worker, and it is
the readable, fully-inspectable way to build the distance/time matrix that feeds OR-Tools or PyVRP, plus
the drawable road polylines for the map. It is the road layer for the "light" scenarios.

See the framework guides: [NetworkX](../frameworks/networkx/usage.md) · [OSMnx](../frameworks/osmnx/usage.md)

> **Attribution is mandatory.** OpenStreetMap data is **ODbL** (share-alike + attribution). Wherever map
> data appears, display **"© OpenStreetMap contributors"**, and per the public-repo hygiene rules commit
> only *rendered geometry* (a pruned OSM graph is a derivative database) — never raw `.graphml`. See
> [`ATTRIBUTION.md`](../../ATTRIBUTION.md).

### OSRM / VROOM — heavy precompute backends, local-only

For large, geography-real instances, an all-pairs matrix from OSMnx/NetworkX is *slow* — and **the
matrix, not the solver, is usually the real bottleneck.** For N stops you need an N×N travel-time matrix,
and OSMnx all-pairs on a big graph does not scale.

**OSRM / VROOM (Docker precompute backends — local-only, not a pip pipeline)** run via Docker on the local
precompute machine only:

- [**OSRM**](https://github.com/Project-OSRM/osrm-backend) (BSD-2) is a high-performance C++ engine over
  OpenStreetMap; its `Table` service returns all-pairs durations/distances fast, and it also yields real
  road geometry. Preprocessing an OSM extract is RAM- and disk-heavy and stateful.
- [**VROOM**](https://github.com/VROOM-Project/vroom) (BSD-2) is an out-of-the-box VRP engine that wraps
  OSRM for real matrices and solves CVRP/VRPTW/PDPTW in milliseconds — convenient, but a *black box*
  relative to OR-Tools/PyVRP, so it teaches less.

Neither belongs on the host: this is a static GitHub Pages site with no application server (see
[ARCHITECTURE.md](../ARCHITECTURE.md)). **Commit only their JSON output** — the matrices, the routes,
the geometry — never the running service.

**Rule of thumb:** keep *live* instances small (≈ ≤ 20–30 stops) using OSMnx/NetworkX; **precompute the
matrix** for anything larger using OSRM, and commit the JSON.

---

## 7. The optimize-then-simulate bridge (simheuristics)

This is the payload of the whole optimization half of the lab, and the reason no routing scenario ships
as "just an optimizer".

**The pattern:**

1. **Optimize** a plan (OR-Tools / PyVRP / CP-SAT / GLOP) on **deterministic** inputs — fixed travel
   times, fixed service durations. You get a plan that is optimal *for that idealized world*.
2. **Simulate** the same plan in a **SimPy** DES under **stochastic** conditions — travel-time noise,
   loader/dump queues, breakdowns, variable demand, random call arrivals.
3. **Compare** the plan's *promised* cost/finish against the *distribution* of actual outcomes across
   many seeded runs: missed time windows, idle resources, queueing, response-time spread.

This is the **simheuristic** idea made visible: optimization and simulation are not rivals; the
optimizer proposes and the simulator disposes. The learner watches a provably-good plan slip — and that
visceral "the optimum was fragile" moment motivates everything downstream (robust optimization,
scenario-based planning, safety margins).

> **Determinism is the contract.** Seed *both* the solver (where it is stochastic — PyVRP's HGS, CP-SAT
> search) *and* the SimPy RNG, so every committed precomputed run reproduces exactly from the repo. This
> is the same "replay = truth" discipline the whole lab is built on ([ARCHITECTURE.md](../ARCHITECTURE.md)).

---

## 8. Where this runs: precompute-only, never live

OR-Tools is **native C++ with a Python wrapper** — it cannot be compiled to WASM and therefore **never
runs live** in the Pyodide Worker. PyVRP (C++/Python) and the OSRM/VROOM backends are in the same boat.
Per the lab's [3-gate live/precompute rule](../ARCHITECTURE.md#the-3-gate-rule-simlabcorescenariopy):

- **Engine gate:** must be pure-Python to run live. OR-Tools / PyVRP fail this → **always precompute**.
- The optimized plan is solved **offline** on the local pipeline, emitted as a **seeded JSON/Arrow
  trace + manifest**, and the front end only **replays** it with a scrubber under the
  *"precomputed due to cost; full pipeline in the repo"* banner.
- **Live knobs over a precomputed plan:** the editable parameters in routing scenarios mutate only the
  **SimPy stochastic-delay replay** over a fixed optimized plan (or a toy ≤ 20-stop heuristic in
  Pyodide) — they do **not** re-solve OR-Tools in the browser.

The only pure-Python optimization piece that *can* touch the live tier is **NetworkX/OSMnx shortest
paths on a small graph**.

---

## 9. Scenario map

How the tools above map onto the lab's scenarios. See the full [scenarios catalog](../scenarios.md)
for the complete set.

| Scenario | Optimization tool(s) | Simulation / replay | What it teaches |
|---|---|---|---|
| **S06 — Job-Shop Scheduling** | OR-Tools **CP-SAT** (interval vars, `NoOverlap`, minimize makespan) | Animated **Gantt** replay of the optimal schedule | Pure combinatorial scheduling; what an *optimizer* (not a simulator) does |
| **S07 — Construction Haul Routing** | OR-Tools Routing + **OSMnx** road graph (matrix + geometry) | **SimPy** replay under stochastic load/dump/delay; 2D grade overlay (3D terrain post-v1) | Optimize-then-simulate where **elevation drives the cost model** |
| **S08 — VRP / VRPTW** | OR-Tools Routing (`GUIDED_LOCAL_SEARCH` + time limit + seed) **+ PyVRP** (SOTA contrast) | **SimPy** replay under stochastic demand/delay; report window violations | The core simheuristic bridge **+** OR-Tools-vs-PyVRP solution-quality gap |
| **S09 — Emergency / Ambulance Dispatch** | OR-Tools (base dispatch/relocation plan) + city **graph** (OSMnx/OSRM matrix) | **SimPy** many stochastic call streams; replay one representative run + aggregate metrics | Stochastic demand over a city graph; response-time distributions & coverage |
| **S11 — Mine Haul (truck/shovel allocation)** | OR-Tools **GLOP LP** (continuous flow allocation) | **SimPy** DES with breakdowns + queueing | LP gives the steady-state target; the sim reveals the variance the LP cannot see |

Each scenario commits its **solver search parameters, time limit, and seed** into the manifest so the
replayed plan is reproducible.

---

## 10. Per-framework deep dives

This page is the map; the implementation detail for each tool lives in its own guide:

- [OR-Tools](../frameworks/ortools/usage.md) — Routing API, CP-SAT modelling, GLOP LP, the mandatory
  `GUIDED_LOCAL_SEARCH` + time-limit + seed template.
- [PyVRP](../frameworks/pyvrp/usage.md) — Hybrid Genetic Search, seeding, the fair-comparison setup against
  OR-Tools.
- [NetworkX + OSMnx](../frameworks/networkx/usage.md) — building the road graph, Dijkstra/A\*, the
  travel-time matrix, ODbL attribution.
- [SimPy](../frameworks/simpy/usage.md) — the DES that replays optimized plans under uncertainty.

## 11. License & attribution summary

All optimization/routing tools here are permissive and mutually compatible:

| Tool | License |
|---|---|
| OR-Tools | Apache-2.0 |
| PyVRP | MIT |
| NetworkX, OSMnx | MIT |
| OSRM, VROOM | BSD-2-Clause |
| **OpenStreetMap data** | **ODbL** — display "© OpenStreetMap contributors", commit rendered geometry only |
| Benchmark instances (Solomon, Gehring-Homberger, CVRPLIB, OR-Library) | cite the originating papers |

See [`LICENSES.md`](../../LICENSES.md) and [`ATTRIBUTION.md`](../../ATTRIBUTION.md). Repo:
<https://github.com/fsantibanezleal/CAOS_SIMLAB>.

---

### Sources

This guide is grounded in the CAOS_SIMLAB research and synthesis:

- OR-Tools (Apache-2.0): <https://github.com/google/or-tools> · VRPTW guide:
  <https://developers.google.com/optimization/routing/vrptw> · CP-SAT primer:
  <https://d-krupke.github.io/cpsat-primer/04B_advanced_modelling.html>
- PyVRP (MIT): <https://github.com/PyVRP/PyVRP> · HGS paper: <https://arxiv.org/abs/2403.13795>
- VROOM (BSD-2): <https://github.com/VROOM-Project/vroom>
- OSRM (BSD-2, self-host + `Table`): <https://talos.tools/selfhosted/open-source-routing-machine-osrm>
- OSMnx (MIT): <https://github.com/gboeing/osmnx>
- Simheuristics / agile-optimization survey: <https://www.mdpi.com/2076-3417/13/1/101>
- Sim-optimization for stochastic location-routing: <https://link.springer.com/article/10.1057/jos.2015.15>
- CVRPLIB / Solomon / Gehring-Homberger: <https://github.com/junhua/CVRPLIB>
