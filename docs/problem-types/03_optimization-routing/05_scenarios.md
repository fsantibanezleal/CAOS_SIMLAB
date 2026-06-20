# 05 · Scenarios

> Node: [Optimization & Routing](../03_optimization-routing.md) · prev: [04 · Tools](./04_tools.md)

How the tools in [04 · Tools](./04_tools.md) and the methods in
[03 · Methods & KPIs](./03_methods-and-kpis.md) map onto the lab's scenarios. Five scenarios live in the
optimization half; each commits its **solver search parameters, time limit, and seed** into the manifest so
the replayed plan is reproducible (the [determinism contract](../../architecture/02_determinism-and-trace.md)).

| Scenario | Optimization tool(s) | Simulation / replay | What it teaches |
|---|---|---|---|
| **[S06 — Job-Shop Scheduling](../../use-cases/06_s06_jobshop.md)** | OR-Tools **CP-SAT** (interval vars, `NoOverlap`, minimize makespan) | Animated **Gantt** replay of the optimal schedule | Pure combinatorial scheduling; what an *optimizer* (not a simulator) does |
| **[S07 — Construction Haul Routing](../../use-cases/07_s07_haul.md)** | OR-Tools Routing + **OSMnx** road graph (matrix + geometry) | **SimPy** replay under stochastic load/dump/delay; 2D grade overlay (3D terrain post-v1) | Optimize-then-simulate where **elevation drives the cost model** |
| **[S08 — VRP / VRPTW](../../use-cases/08_s08_vrp.md)** | OR-Tools Routing (`GUIDED_LOCAL_SEARCH` + time limit + seed) **+ PyVRP** (SOTA contrast) | **SimPy** replay under stochastic demand/delay; report window violations | The core simheuristic bridge **+** the OR-Tools-vs-PyVRP solution-quality gap |
| **[S09 — Emergency / Ambulance Dispatch](../../use-cases/09_s09_ambulance.md)** | OR-Tools (base dispatch/relocation plan) + city **graph** (OSMnx/OSRM matrix) | **SimPy** many stochastic call streams; replay one representative run + aggregate metrics | Stochastic demand over a city graph; response-time distributions & coverage |
| **[S11 — Mine Haul (truck/shovel allocation)](../../use-cases/11_s11_minehaul.md)** | OR-Tools **GLOP LP** (continuous flow allocation) | **SimPy** DES with breakdowns + queueing | LP gives the steady-state target; the sim reveals the variance the LP cannot see |

## How to read these as a progression

- **S06** is the **pure-optimization anchor** — the only scenario whose deliverable is the optimizer's output
  itself (an animated Gantt of a proven-optimal job-shop schedule, OR-Library **ft06**, makespan 55). No
  stochastic replay; it shows what *solving* (not simulating) looks like. Method:
  [CP-SAT](./03_methods-and-kpis.md#constraint-programming--or-tools-cp-sat).
- **S11** is the **LP anchor** — the smoothest, most continuous optimization (truck/shovel flow), paired with
  the starkest "the optimum hides variance" lesson when SimPy injects breakdowns. Method:
  [LP / GLOP](./03_methods-and-kpis.md#linear-programming-lp--or-tools-glop).
- **S07 / S08 / S09** are the **routing trio**, each exercising the
  [optimize-then-simulate bridge](./03_methods-and-kpis.md#the-optimize-then-simulate-bridge-simheuristics)
  on a different flavour of vehicle routing: S07 makes *elevation* the cost driver, S08 makes the
  *OR-Tools↔PyVRP quality gap* the exhibit, and S09 makes *stochastic demand over a city graph* the
  centerpiece (response-time distributions and coverage).

## Where the scenario code lives

The runnable scenario code lives in `simlab/scenarios/` (one module per scenario, e.g.
`simlab/scenarios/s08_vrp.py`); the shared synthetic road graph + Dijkstra shortest paths live in
`simlab/scenarios/_geo.py`; and each scenario's committed seeded plan lives in its `manifests/<scenario>.json`.
Each use-case node (linked in the table above) walks its scenario's assumptions, formalization, solvers, and
results in depth.

## Related

- [01 · What it is](./01_what-it-is.md) · [02 · When to use it](./02_when-to-use.md) ·
  [03 · Methods & KPIs](./03_methods-and-kpis.md) · [04 · Tools](./04_tools.md)
- Full catalog of every lab scenario (all four problem types): [`../../README.md`](../../README.md#scenario--tool-map).
