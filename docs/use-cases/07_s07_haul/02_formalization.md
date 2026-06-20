# 02 · Formalization

The math behind S07, grounded in the **code** — the live SimPy replay in
[`simlab/scenarios/s07_haul.py`](../../../simlab/scenarios/s07_haul.py), the offline route-plan builder
[`simlab/scenarios/_haul_plan.py`](../../../simlab/scenarios/_haul_plan.py) (NetworkX + the OR-Tools CP-SAT
cost certificate), and the committed plans in
[`simlab/scenarios/s07_plans.py`](../../../simlab/scenarios/s07_plans.py). The canonical statement of which
engine owns which part of the pipeline is [03 · Solvers applied](./03_solvers-applied.md); the equations here
are kept consistent with those modules. The scenario is a **hybrid**: a deterministic shortest-path
optimization (the route, precomputed offline) followed by a live discrete-event simulation of a closed
finite-source queue (the cycle).

## Sets

- **Nodes** `n` of the `g × g` junction grid (`g = 12`), each carrying an elevation `elev(n)`.
- A **load** node on the bottom edge and a **dump** node on the top edge, both in column `lift_col`.
- **Directed arcs** `(a → b)`: one per undirected road segment in each direction (built offline in
  `build_road_graph`, in the plan builder `_haul_plan.py`); `A` denotes the arc set.

## Parameters

| Symbol | Code | Meaning |
|---|---|---|
| `γ` | `grade` | grade penalty, `0–8` |
| `pass_col` | `pass_col` | column of the low pass |
| `lift_col` | `lift_col` | load/dump column |
| `barrier` | `barrier ∈ {0,1}` | wall across the direct line |
| `N` | `n_trucks` | number of trucks (the "machines"), `1–14` |
| `c` | `n_loaders` | number of loaders (the repair server), `1–4` |
| `t_L = 4` | `load_time` | load time (min) — the binding service |
| `1` | `dump_time` | dump time (min) |
| `H` | `horizon` | shift length (min) |
| `elev(n)` | `net.elev` | deterministic ridge-with-pass field |

## Decision & state variables

- **Decision variable (optimize step):** the **loaded route** — the node sequence from load to dump that
  minimizes the graded cost (the empty return uses plain distance). In the OR-Tools certificate this is the
  binary arc selector `x[a,b] ∈ {0,1}`.
- **State variables (simulate step):** the time each **loader becomes free**, and the **number of trucks
  waiting** at the loader at time `t`.

## Model class

- **Optimize:** a single-commodity **shortest path** on a weighted directed graph (Dijkstra), equivalently a
  **min-cost single-unit-flow ILP** (the OR-Tools CP-SAT certificate).
- **Simulate:** a **closed, finite-source discrete-event queue** — the machine-repair model — solved as a
  real SimPy DES, with the `M/M/1//N` (or `M/M/c//N`) queue as the analytic analogue.

## Objective & cost (the optimize step)

The loaded route minimizes a sum of edge costs that penalizes **only climbing** (`loaded_cost` in the code):
distance is inflated by grade `γ` times the positive climb `Δelev = max(0, elev_b − elev_a)`:

```
cost(a → b) = dist(a, b) · (1 + γ · max(0, elev_b − elev_a))
```

The empty return is routed on plain `dist(a, b)` (no grade term), so it always takes the geometrically
shortest path back.

### Route-switch grade `g*`

Let `(L, C)` be a route's total length and total climb. The **direct** route over the crest is short and
climbs hard `(L_dir, C_dir)`; the **detour** to the pass is long and nearly flat `(L_det, C_det)`. The detour
wins when

```
L_dir + γ·C_dir  >  L_det + γ·C_det
```

which defines the **critical grade** `g*` at which the optimal route flips direct → pass (the code's
`switch` quantity, computed from the grade-0 reference path `direct` and a grade-50 reference path `detour`):

```
g* = (L_det − L_dir) / (C_dir − C_det) = ΔL / ΔC      (here g* ≈ 3.4)
```

Below `g*` the direct climb wins; above `g*` the route flips to the pass. A **barrier** across the direct
line reroutes to the pass independent of grade — and because the barrier itself bends the "direct" reference
path onto a detour, the closed-form `g*` is ill-defined for barrier variants and is reported as **undefined
(None)** there (the route flip is still correct; only the `g*` number is suppressed).

## Dynamics (the simulate step)

Each truck is a SimPy process repeating a four-phase cycle until a load would overrun the shift:

1. **Join** the loader queue (FIFO over the finite fleet) and **wait** for a free loader.
2. **Hold** a loader for `t_L` (the load), if `start_load + t_L ≤ H`; otherwise stop (no time left).
3. **Haul up** the planned loaded route, **dump** (`dump_time`), then **haul back** the empty route.
4. **Re-enter** the queue.

Because the loader is shared and finite, with one loader adding trucks only lengthens the queue — throughput
saturates at the loader rate. This is the **machine-repair / finite-source** queue: with `N` trucks, `c`
loaders, load rate `μ = 1/t_L` and per-truck return rate `λ`, the state-dependent rates are

```
λ_n = (N − n)·λ,    μ_n = min(n, c)·μ,    0 ≤ n ≤ N
```

(unlike the open `M/M/c` of the bank-queue scenario, arrivals here depend on how many trucks are already at
the loader). The throughput ceiling is `c·μ`. The mining shorthand is the **match factor**:

```
MF = (N · t_L) / (c · t_cycle)
```

with `MF < 1` under-trucked (loader idle, fleet-limited), `MF ≈ 1` matched (loader full, ~no queue), and
`MF > 1` over-trucked (persistent queue, throughput pinned at `c·μ`). Under variability the practical
optimum sits slightly below `MF = 1`.

## KPIs (measured)

From `tr.kpis` / `tr.analytic` in `run()`:

| KPI | Code key | Definition |
|---|---|---|
| Loads delivered | `loads_delivered` | completed loads over the shift |
| Throughput per hour | `throughput_per_hr` | `loads / H · 60` |
| Mean cycle time | `mean_cycle_time` | `busy_time / loads` (load → return) |
| Loader wait per load | `loader_wait_per_load` | `wait_time / loads` |
| Switch grade `g*` | `switch_grade_est` | `ΔL/ΔC`, or `None` under a barrier |
| Trucks / loaders | `n_trucks` / `n_loaders` | the fleet vs the server |
| Route taken | `route_via` (analytic) | "direct over crest" or "pass at col …" |

The route-switch grade `g*` is the **predictive** quantity: compare it to each variant's `γ` to predict
whether the route runs direct (γ < g*) or via the pass (γ > g*). See
[04 · Results & reading](./04_results-and-reading.md).
