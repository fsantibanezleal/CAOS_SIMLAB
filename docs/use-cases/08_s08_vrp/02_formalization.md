# 02 · Formalization — S08 Vehicle Routing Problem (CVRP)

> Part of the [S08 — Vehicle Routing Problem](../08_s08_vrp.md) use-case node. The math here is pulled
> **verified** from the scenario's Experiments Context block (`web/src/pages/Experiments.tsx`, `S08Desc`)
> and from the scenario code (`simlab/scenarios/s08_vrp.py`). It is kept consistent with the code — the
> equations describe what the two solvers are actually configured to optimize, nothing more.

## Model class

S08 is the **Capacitated Vehicle Routing Problem (CVRP)**, the canonical *optimize-then-route* problem and
an **NP-hard** combinatorial optimization. It is cast as an **arc-flow MILP**. There is **no time
dimension and no randomness** in the model itself — one instance is solved once. Two solvers attack the
**same** instance with **two different objectives** (§Objective).

## Sets

| Symbol | Definition |
|---|---|
| $V = \{0, 1, \dots, n\}$ | **special nodes**: index $0$ is the **depot**, indices $1\dots n$ are the **customers** ($n =$ `n_customers`) |
| $A = \{(i,j) : i,j \in V,\ i \neq j\}$ | directed **arcs** between special nodes |
| $\{1,\dots,K\}$ | the **fleet** of $K =$ `n_vehicles` identical vehicles |

The special nodes are a subset of the `g × g` grid junctions; arcs are *abstract* (depot↔customer,
customer↔customer), and each arc's cost is the **shortest path on the grid** between the two nodes.

## Parameters

| Symbol | Definition |
|---|---|
| $d_i$ | **demand** at node $i$: $d_0 = 0$; $d_i \sim \mathcal{U}\{1,2,3\}$ for each customer (seeded by `inst_seed`) |
| $c_{ij}$ | **cost (distance)** of arc $(i,j)$ = grid shortest-path distance, **scaled $\times 100$ and rounded to integer** |
| $Q$ | per-vehicle **capacity** (`capacity`), identical for all $K$ vehicles |
| $K$ | fleet size (`n_vehicles`) |
| $\gamma = 100$ | **global-span coefficient** (OR-Tools only; penalizes the longest route) |

The matrix is **symmetric and metric** ($c_{ij} = c_{ji}$, triangle inequality holds) because it is built
from shortest paths on an undirected grid.

## Decision variables

| Symbol | Definition |
|---|---|
| $x_{ij} \in \{0,1\}$ | **arc selection**: 1 if some vehicle traverses arc $i \to j$, else 0 |
| $u_i$ | **cumulative load** carried when leaving node $i$ (an MTZ-style load/position variable; OR-Tools' *Capacity* dimension) |

In the rendered plan the solver output is a set of per-vehicle **`special`-index sequences** (each
`depot..customers..depot`); these are equivalent to a feasible assignment of $x_{ij}=1$ along each route.

## Objective

### Base objective (both engines minimize distance)

$$\min \; \sum_{i\in V}\sum_{j\in V} c_{ij}\, x_{ij}$$

This is the total distance over all traversed arcs — the classic CVRP objective, and exactly what **PyVRP**
minimizes (pure total distance).

### OR-Tools' effective objective (distance + balanced routes)

The OR-Tools model adds a **distance dimension with a global-span cost**. Because each vehicle's cumulative
distance starts at 0, the span penalizes the **longest** route (the maximum cumulative distance across
vehicles; the minimum is 0), with coefficient $\gamma = 100$:

$$\min \; \sum_{i,j} c_{ij}\, x_{ij} \;+\; \gamma \cdot \max_{k}\, \text{dist}_k, \qquad \gamma = 100$$

This is the **key divergence between the two engines**: OR-Tools *balances* the fleet (it minimizes the
longest route, so extra vehicles actually get used when an instance is tight enough to need them), while
PyVRP chases the **shortest total** with no balancing term. The contrast — total distance vs. longest
route — is the whole pedagogical point of running both.

## Constraints

**Degree constraints** — each customer is visited exactly once, and $K$ vehicles leave the depot:

$$\sum_{j\in V} x_{ij} = 1 \;\; \forall i\neq 0, \qquad \sum_{i\in V} x_{ij} = 1 \;\; \forall j\neq 0, \qquad \sum_{j} x_{0j} = K$$

**Capacity** is enforced with the cumulative-load variables in **MTZ** style, which simultaneously
**eliminate subtours**:

$$u_j \ge u_i + d_j - Q\,(1 - x_{ij}), \qquad d_i \le u_i \le Q \;\; \forall i\neq 0$$

The load rises by $d_j$ across a used arc and never exceeds $Q$; the depot resets the load. In OR-Tools this
is the **`Capacity` dimension** (`AddDimensionWithVehicleCapacity`); the routing model's circuit structure
handles the depot return and route closure.

## Dynamics

There are **none** in the optimization — S08 is a static, deterministic combinatorial problem. The only
"dynamics" are at **render time**: each used route's grid-node polyline is expanded into **timed legs**
$\{a, b, t_0, t_1\}$ at uniform speed $= 1$ (`timed_legs` in `_geo.py`), so the web app can animate a vehicle
driving its sequence. This timing is presentation, not part of the model.

## KPIs

The primary plan's KPIs (from **OR-Tools**, carried in the trace exactly as the app renders) are:

| KPI | Meaning |
|---|---|
| `total_distance` | the **base objective** — total distance over all used arcs |
| `vehicles_used` | how many of the $K$ available vehicles carry a non-trivial route (depot→depot routes are dropped) |
| `max_route_time` | the **longest route** (the term the global span penalizes) — surfaced in render-time units |
| `customers` | $n$, the number of customers served |
| `capacity` | $Q$ |

### The OR-Tools ↔ PyVRP head-to-head (the `analytic` slot)

PyVRP's plan is carried alongside in the trace's free-form **`analytic`** field (no route-schema change), so
the SOTA contrast travels with every committed trace and is available to any future overlay/toggle UI. (The
shipped web viewer renders only the primary OR-Tools plan today; it does not yet read this `analytic` slot
for S08 — the contrast lives in the committed data and in [04 · Results & reading](./04_results-and-reading.md),
not in an in-app toggle.) The committed comparison block records, for the same instance:

- per engine: `total_distance`, `vehicles_used`, `max_route_dist`, per-vehicle `loads`;
- `compare.distance_gap` $=$ (OR-Tools total) $-$ (PyVRP total); **$> 0$ means PyVRP found a shorter total**;
- `compare.distance_gap_pct`, and both engines' `max_route_dist`.

The reading: the **gap** quantifies "what good looks like" (a competition-grade HGS solver vs. a
general-purpose one with a balancing term), while comparing the two `max_route_dist` values shows the cost of
that shorter total — PyVRP's longest route is typically *longer* (less balanced) than OR-Tools'. The actual
per-variant numbers are in [04 · Results & reading](./04_results-and-reading.md).
