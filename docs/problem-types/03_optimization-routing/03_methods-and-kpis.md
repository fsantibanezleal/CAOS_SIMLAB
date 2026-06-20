# 03 · Methods & KPIs

> Node: [Optimization & Routing](../03_optimization-routing.md) · prev: [02 · When to use it](./02_when-to-use.md) · next: [04 · Tools](./04_tools.md)

This page walks the model-class ladder from [01 · What it is](./01_what-it-is.md#2-the-model-class-ladder)
in depth — the *method* behind each rung and the **KPIs** it reports — and then the
[optimize-then-simulate bridge](#the-optimize-then-simulate-bridge-simheuristics) that turns any of them
into a stress-test. For *which* class to pick and its honest limit, see
[02 · When to use it](./02_when-to-use.md).

---

## Linear Programming (LP) — OR-Tools GLOP

**Linear programming** is the simplest and most fundamental OR model: a linear objective minimized or
maximized subject to linear constraints, with **continuous** decision variables. Because the feasible region
is a convex polytope, an LP is solved *exactly and quickly* — there is no combinatorial explosion.

```text
maximise / minimise   cᵀx
subject to            Ax ≤ b,   x ≥ 0     (x continuous)
```

In OR-Tools, LP is solved by **GLOP** (Google's primal-dual simplex implementation). Reach for GLOP when the
decision is fundamentally *how much of each thing* rather than *which discrete choice*: allocate a fleet's
hours across faces, blend feed grades to a target, decide flow rates on a network.

LP is the backbone of scenario **[S11 — Mine Haul](../../use-cases/11_s11_minehaul.md)**: an OR-Tools GLOP LP
computes the steady-state allocation of trucks to shovels / routes (a continuous flow problem), and a SimPy
DES then injects discrete breakdowns and queueing to show how the smooth LP allocation degrades into a lumpy
reality. **LP gives the *target*; the simulation reveals the *gap*.**

**KPIs:** objective value (e.g. total throughput or cost), shadow prices / dual values (the marginal worth of
relaxing a binding constraint), and — once paired with SimPy — the *gap* between the LP's promised allocation
and the realized distribution of throughput/utilization across seeded runs.

---

## Mixed-Integer Linear Programming (MILP) — branch & bound

When *some* decision variables must be **integer** (a count of vehicles, an on/off facility, a yes-or-no
assignment), the problem becomes a **Mixed-Integer Linear Program**. The model looks like an LP, but the
integrality requirement makes it NP-hard in general.

The standard exact method is **branch & bound**: solve the LP relaxation (ignore integrality); if a
fractional variable appears, *branch* into two subproblems (e.g. `x ≤ 3` and `x ≥ 4`); use the LP relaxation
as a *bound* to prune subtrees that cannot beat the best integer solution found so far. OR-Tools exposes MILP
through its linear-solver wrapper (CBC and other backends) and, increasingly, the same models solve faster as
**CP-SAT** (below).

Use MILP when the structure is "linear costs and constraints, but with indivisible / yes-no decisions":
facility location, fixed-charge network design, "open this depot or not", integer fleet sizing.

**KPIs:** objective value, the **optimality gap** (best bound vs incumbent solution), and the **proof status**
(proven optimal vs time-limited). On small instances you get a proven optimum; on large ones you set a time
limit and accept a gap — that proof-vs-wall-clock trade-off is itself the lesson.

---

## Constraint Programming — OR-Tools CP-SAT

**CP-SAT** is OR-Tools' constraint-programming-over-SAT solver, and it is the strongest single tool in the lab
for **scheduling and combinatorial feasibility**. Instead of expressing everything as linear inequalities, CP
lets you state high-level combinatorial constraints directly — `NoOverlap` (two tasks can't use one machine at
once), `AllDifferent`, **interval variables** with start/duration/end, precedence, cumulative resource
limits — and the solver searches with constraint propagation plus modern SAT / clause-learning techniques.

This is the engine behind scenario **[S06 — Job-Shop Scheduling](../../use-cases/06_s06_jobshop.md)**:

- Each job is a chain of operations; each operation must run on a specific machine for a fixed time; and
  operations on the same machine cannot overlap.
- CP-SAT models each operation as an **interval variable**, adds `NoOverlap` per machine and precedence per
  job, and **minimizes the makespan** (the finish time of the last operation).
- The lab solves a public OR-Library job-shop instance (Fisher & Thompson **ft06**, proven makespan 55)
  offline and replays the optimal schedule as an **animated Gantt chart** — the one scenario whose visual is a
  Gantt rather than a queue network or a map.

Use CP-SAT for job-shop / flow-shop scheduling, crew and machine assignment, rostering, sequencing, and any
model dominated by logical constraints. CP-SAT can also model the routing problems below via `AddCircuit` /
`add_multiple_circuit`, but for vehicle routing the dedicated Routing layer is the better-trodden teaching
path.

**KPIs:** **makespan** (job-shop), the objective bound + gap, solver status, and the committed
**time-limit / search-parameter / seed** triple that makes the replayed schedule reproducible.

---

## Routing — TSP, CVRP, VRPTW

Vehicle routing is the lab's headline OR family, and it comes in a ladder of difficulty:

- **TSP (Travelling Salesman):** one vehicle, visit every node once, return to start, minimize distance.
- **CVRP (Capacitated VRP):** a fleet with capacity limits serving customer demands from a depot.
- **VRPTW (VRP with Time Windows):** CVRP where each customer must be served inside `[earliest, latest]` — the
  model where "fragile under uncertainty" bites hardest, because a single delay cascades into downstream
  window violations.
- **PDPTW (Pickup-and-Delivery with Time Windows):** every request pairs a pickup and a delivery with
  precedence and same-vehicle constraints.

### OR-Tools Routing — the teaching default, with a mandatory caveat

OR-Tools' **Routing** library models all of the above with capacities, time-window dimensions, and
pickup/delivery constraints in one consistent API. It is the default teaching object.

> **Critical configuration — or the lesson lies.** Out of the box, OR-Tools Routing returns the *first
> feasible solution* it finds (e.g. a cheap nearest-neighbor construction) and stops. That is **not**
> optimized. If you then compare it to PyVRP, OR-Tools will look far worse than it really is and the
> comparison misleads the learner. Every routing scenario in this lab **must** set, explicitly:
>
> - a **first-solution strategy** (e.g. `PATH_CHEAPEST_ARC`),
> - the **`GUIDED_LOCAL_SEARCH`** metaheuristic for local-search improvement,
> - a **time limit**, and
> - a **fixed random seed**.
>
> These four are baked into the scenario template. Skip them and the OR-Tools-vs-PyVRP exhibit becomes
> dishonest. The full template is in [04 · Tools](./04_tools.md#or-tools).

### PyVRP — the state-of-the-art contrast

[**PyVRP**](../../frameworks/09_pyvrp.md) implements **Hybrid Genetic Search (HGS)**, the algorithm family
behind first place in the 2021 DIMACS VRPTW challenge and the static EURO-NeurIPS 2022 competition. On the
same CVRP/VRPTW instance, properly-configured OR-Tools is solid, but PyVRP typically finds *materially
shorter* routes. The lab presents both so the learner internalizes that a specialised competition-grade
solver and a capable general-purpose one are genuinely different tiers — "what good looks like" is a concrete,
measurable thing. PyVRP's HGS is **stochastic**, so its run must be **seeded** to keep committed precomputed
routes reproducible.

This pairing drives scenario **[S08 — VRP / VRPTW](../../use-cases/08_s08_vrp.md)**: solve a public
**Solomon / Gehring-Homberger** VRPTW benchmark (or a synthetic CVRP grid) with both OR-Tools and PyVRP,
animate the optimized routes on a 2D map, then hand the chosen plan to a SimPy replay
(see the [bridge](#the-optimize-then-simulate-bridge-simheuristics)).

**KPIs:** **total travel distance / cost**, number of vehicles / routes used, route balance (max-span),
**time-window violations** (VRPTW), the **OR-Tools ↔ PyVRP distance gap** (the head-to-head exhibit), and —
after SimPy replay — the realized vs promised distribution of lateness and idle time.

---

## Shortest paths & the road graph — NetworkX + OSMnx

Before any router can optimize, it needs a **cost matrix**: the travel time or distance between every pair of
locations. That matrix comes from a graph, and graphs are where most of the real engineering — and the real
bottleneck — lives.

[**OSMnx**](../../frameworks/11_osmnx.md) downloads a real road network from OpenStreetMap as a
[**NetworkX**](../../frameworks/10_networkx.md) graph, and NetworkX provides the classic shortest-path
algorithms:

- **Dijkstra** — exact shortest path on non-negative weights; the default for road travel times.
- **A\*** — Dijkstra with an admissible heuristic (e.g. straight-line distance) to expand fewer nodes; faster
  for single-pair queries on large graphs.
- **k-shortest paths** — alternative routes, useful for showing route diversity.

Because this stack is **pure Python**, small road graphs *can* run live in the Pyodide Worker, and it is the
readable, fully-inspectable way to build the distance/time matrix that feeds OR-Tools or PyVRP, plus the
drawable road polylines for the map. It is the road layer for the "light" scenarios. For large instances the
all-pairs matrix is the bottleneck and is precomputed with OSRM — see
[04 · Tools](./04_tools.md#osrm--vroom).

**KPIs:** path length / travel time, number of nodes expanded (A\* vs Dijkstra efficiency), and the size /
build-time of the N×N cost matrix that downstream routers consume.

---

## The optimize-then-simulate bridge (simheuristics)

This is the payload of the whole optimization half of the lab, and the reason no routing scenario ships as
"just an optimizer."

**The pattern:**

1. **Optimize** a plan (OR-Tools / PyVRP / CP-SAT / GLOP) on **deterministic** inputs — fixed travel times,
   fixed service durations. You get a plan that is optimal *for that idealized world*.
2. **Simulate** the same plan in a **SimPy** DES under **stochastic** conditions — travel-time noise,
   loader/dump queues, breakdowns, variable demand, random call arrivals.
3. **Compare** the plan's *promised* cost/finish against the *distribution* of actual outcomes across many
   seeded runs: missed time windows, idle resources, queueing, response-time spread.

This is the **simheuristic** idea made visible: optimization and simulation are not rivals; the optimizer
proposes and the simulator disposes. The learner watches a provably-good plan slip — and that visceral "the
optimum was fragile" moment motivates everything downstream (robust optimization, scenario-based planning,
safety margins).

> **Determinism is the contract.** Seed *both* the solver (where it is stochastic — PyVRP's HGS, CP-SAT
> search) *and* the SimPy RNG, so every committed precomputed run reproduces exactly from the repo. This is
> the same "replay = truth" discipline the whole lab is built on — see
> [determinism & trace](../../architecture/02_determinism-and-trace.md).

**Bridge KPIs:** the *gap* metrics — promised vs realized cost, fraction of seeded runs that violate a time
window, idle/queue time the optimizer ignored, and the spread (variance / percentiles) of the outcome
distribution.

## Related

- [04 · Tools](./04_tools.md) — the solvers behind each method + the mandatory OR-Tools template.
- [05 · Scenarios](./05_scenarios.md) — which scenario exercises which method.
- [SimPy](../../frameworks/01_simpy.md) — the DES that replays optimized plans under uncertainty.
