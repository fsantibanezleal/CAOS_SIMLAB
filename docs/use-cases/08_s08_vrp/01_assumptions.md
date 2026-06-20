# 01 · Assumptions — S08 Vehicle Routing Problem (CVRP)

> Part of the [S08 — Vehicle Routing Problem](../08_s08_vrp.md) use-case node. This page fixes the
> **canonical instance** the scenario solves and states the **scope**: what is and what isn't modeled. The
> facts here come from the scenario code (`simlab/scenarios/s08_vrp.py`) and its Experiments Context block —
> nothing is invented.

## The canonical instance

S08 is a **capacitated vehicle routing problem (CVRP)** built from a single seeded RNG, then solved
**twice** — once with OR-Tools and once with PyVRP — on the *identical* instance for a fair, reproducible
contrast. One instance is fully described by five integer parameters:

| Parameter | Code name | Meaning | Default | Range |
|---|---|---|---|---|
| Grid size | `grid` | side `g` of a `g × g` junction grid (the road network) | 7 | 4–10 |
| Customers | `n_customers` | number of customers `n` to serve | 12 | 4–18 |
| Vehicles | `n_vehicles` | fleet size `K` (all identical) | 3 | 1–6 |
| Capacity | `capacity` | per-vehicle load capacity `Q` (same for all) | 12 | 4–40 |
| Instance seed | `inst_seed` | the only source of randomness | 1 | 0–9999 |

How the instance is constructed (`build_instance`):

- **The road network** is a `g × g` `GridNetwork` of junctions on unit spacing — a self-contained synthetic
  grid (no OpenStreetMap, no tiles), with 4-neighbour streets between adjacent junctions. It is the same
  shared graph used by S07 and S09 (`simlab/scenarios/_geo.py`).
- **The depot** is the **centre node** `(g//2)·g + (g//2)` — deterministic, not random.
- **The customers** are `n_customers` nodes drawn by shuffling all non-depot nodes with the seeded RNG and
  taking the first `n`. The depot plus customers form the **special nodes** `special = [depot] + customers`,
  the rows/columns of the cost matrix.
- **Demands** are `d_0 = 0` at the depot and `d_i ~ U{1,2,3}` (uniform integer 1–3) for each customer,
  drawn from the same seeded RNG.
- **The cost matrix** `c_{ij}` is the **grid shortest path** (Dijkstra over Euclidean edge lengths) between
  each pair of special nodes, **scaled by 100 and rounded to an integer** (`SCALE = 100`). Integer scaling
  keeps both engines — which are integer solvers internally — exact and byte-stable.

The instance is **fully deterministic from `(params, inst_seed)`**: re-running yields the same matrix and the
same two plans.

## What IS modeled

- A **single depot**, `n` customers each with an integer demand, and a **homogeneous fleet** of `K` vehicles
  with a common capacity `Q`.
- **Capacity feasibility**: the total demand carried by any one vehicle must not exceed `Q`.
- **Closed routes**: every used vehicle departs the depot, visits a sequence of customers, and returns to
  the depot.
- **Two objectives, two engines on one instance**:
  - **OR-Tools** (the primary plan) minimizes **total travelled distance plus a global-span penalty** that
    also shortens the **longest** route, so it *balances* the fleet.
  - **PyVRP** (the state-of-the-art contrast) minimizes **pure total distance**, so its plan is usually
    shorter in total but less balanced.
- **Symmetric, metric distances** on the grid (shortest paths), scaled to integers.
- **Animation timing**: a used route's grid-node polyline is expanded into timed legs at **uniform speed
  `= 1`** purely to drive the replay; speed does not change the optimization.

## What is NOT modeled (out of scope)

This is **pure combinatorial optimization** — one instance, solved once. There is **no stochastic dynamics**:

- **No time windows**: customers have no `[earliest, latest]` service interval (that would be VRPTW; the
  *optimize-then-simulate* fragility-under-uncertainty lesson is carried by the EMS-dispatch scenario S09,
  not here).
- **No traffic, no variable service times, no breakdowns** — travel is deterministic.
- **No multiple depots, no pickup-and-delivery, no heterogeneous fleet, no dynamic/online demand** — the
  PyVRP `Model` supports these variants, but this scenario uses only the single-depot homogeneous CVRP form.
- **No proven MILP optimality certificate.** Both engines stop on a **deterministic count** (OR-Tools:
  `solution_limit = 200`; PyVRP: `MaxIterations(200)`), not a wall-clock limit and not an optimality gap of
  zero. On these small instances the result is high-quality / near-optimal, but it is the *committed*
  solution, not a certified optimum. (The Experiments Context describes the stop in wall-clock terms — "a
  3-second time limit"; the code uses the machine-independent **`solution_limit`** instead precisely so the
  committed trace is byte-stable on any machine. Where the two disagree, the code is authoritative.)
- An **unused vehicle** — one whose route is just depot→depot — is **dropped** and does not appear in the
  rendered plan or the `vehicles_used` KPI.

## Why these choices

- **Synthetic grid, not real OSM**: keeps the scenario self-contained and the cost matrix small, integer and
  reproducible — no map tiles, no ODbL data, no all-pairs matrix bottleneck. The shortest-path machinery is
  the readable `GridNetwork.shortest_path` (Dijkstra), shared across the routing scenarios.
- **Integer-scaled distances (`×100`)**: both OR-Tools Routing and PyVRP operate on integer costs; scaling
  preserves enough precision while keeping every committed number exact across machines.
- **Deterministic stopping rule + fixed solver seed (42)** for both engines: this is the lab's *"replay =
  truth"* contract — a solution-count / iteration-count stop is machine-independent, unlike a wall-clock
  `time_limit` where a faster CPU would explore more and produce a different "optimum".

## Where the numbers live

The exact per-variant instances and both solvers' results are committed in the manifest
[`manifests/s08_vrp.json`](../../../manifests/s08_vrp.json); the variant table and KPI readings are discussed
in [04 · Results & reading](./04_results-and-reading.md).
