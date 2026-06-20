# 05 · Scenarios

> Node: [Optimization & Routing](../03_optimization-routing.md) · prev: [04 · Tools](./04_tools.md)

How the tools in [04 · Tools](./04_tools.md) and the methods in
[03 · Methods & KPIs](./03_methods-and-kpis.md) map onto the lab's scenarios. Five scenarios are listed in the
optimization half; each commits its **solver search parameters, deterministic stopping rule, and seed** into
the manifest so the replayed plan is reproducible (the
[determinism contract](../../architecture/02_determinism-and-trace.md)). The stopping rules are deliberately
*machine-independent*: S06 and S11 cap CP-SAT/GLOP search (with `num_search_workers=1` + a fixed
`random_seed`), while S08 uses a solution-**count** limit (`solution_limit = 200`, *not* a wall-clock time
limit). S09 is the exception — it has no optimizer (see the S09 row and footnote).

| Scenario | Optimization tool(s) | Simulation / replay | What it teaches |
|---|---|---|---|
| **[S06 — Job-Shop Scheduling](../../use-cases/06_s06_jobshop.md)** | OR-Tools **CP-SAT** (interval vars, `NoOverlap`, minimize makespan) | Animated **Gantt** replay of the optimal schedule | Pure combinatorial scheduling; what an *optimizer* (not a simulator) does |
| **[S07 — Construction Haul Routing](../../use-cases/07_s07_haul.md)** | **NetworkX + OR-Tools CP-SAT** route plan, precomputed offline and committed as data (grade×wall grid) | **SimPy** replay (live), deterministic in the shipped variants (fixed load/dump times; the optional breakdown stream is pinned to 0); 2D grade overlay (3D terrain post-v1) | Optimize-then-simulate where **elevation drives the cost model**; the plan is committed, the replay runs live |
| **[S08 — Vehicle Routing (CVRP)](../../use-cases/08_s08_vrp.md)** | OR-Tools Routing (`GUIDED_LOCAL_SEARCH` + `solution_limit = 200` + seed; minimizes distance + global-span balance) **+ PyVRP** HGS (SOTA contrast, pure total distance) | — (no SimPy; static plans replayed as vehicles driving the network) | The OR-Tools-vs-PyVRP total-distance gap on the identical CVRP instance (strictly CVRP — no time windows, no DES leg) |
| **[S09 — Emergency / Ambulance Dispatch](../../use-cases/09_s09_ambulance.md)** † | — (closed-form **nearest-available argmin**; no solver) · **NetworkX** shortest paths (`nx.single_source_dijkstra` over an in-repo `GridNetwork`) | **SimPy** one seeded Poisson call stream, live; aggregate metrics + one representative run | Stochastic demand over a city graph; response-time distributions & coverage |
| **[S11 — Mine Haul (truck/shovel allocation)](../../use-cases/11_s11_minehaul.md)** | OR-Tools **GLOP LP** (continuous flow allocation) | **SimPy** DES with breakdowns + queueing | LP gives the steady-state target; the sim reveals the variance the LP cannot see |

## How to read these as a progression

- **S06** is the **pure-optimization anchor** — the only scenario whose deliverable is the optimizer's output
  itself (an animated Gantt of a proven-optimal job-shop schedule, OR-Library **ft06**, makespan 55). No
  stochastic replay; it shows what *solving* (not simulating) looks like. Method:
  [CP-SAT](./03_methods-and-kpis.md#constraint-programming--or-tools-cp-sat).
- **S11** is the **LP anchor** — the smoothest, most continuous optimization (truck/shovel flow), paired with
  the starkest "the optimum hides variance" lesson when SimPy injects breakdowns. Method:
  [LP / GLOP](./03_methods-and-kpis.md#linear-programming-lp--or-tools-glop).
- **S07 / S08 / S09** are the **routing trio**, each on a different flavour of vehicle routing: S07 makes
  *elevation* the cost driver, S08 makes the *OR-Tools↔PyVRP quality gap* the exhibit, and S09 makes
  *stochastic demand over a city graph* the centerpiece (response-time distributions and coverage). S07 and
  S08 sit on the
  [optimize-then-simulate bridge](./03_methods-and-kpis.md#the-optimize-then-simulate-bridge-simheuristics)
  (an OR-Tools / PyVRP plan, then evaluation); **S09 is the closed-form exception** — it carries no
  optimizer at all (see †) and runs fully live.

> † **S09 has no solver.** Unlike S07/S08, it is a pure **SimPy + NetworkX** discrete-event simulation:
> dispatch is the closed-form **nearest-available argmin** (the unit with the earliest feasible scene
> arrival, honouring each unit's busy clock) and routing is `nx.single_source_dijkstra` over an in-repo
> `GridNetwork` road graph — **no** OR-Tools and **no** OSMnx/OSRM. One seeded Poisson call stream is
> replayed, so the scenario is `lane = live` (pure-Python, wheels `numpy + simpy + networkx`). It is listed
> here only because EMS dispatch is conventionally framed as a routing problem.

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
