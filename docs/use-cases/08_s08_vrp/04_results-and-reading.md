# 04 · Results & reading — S08 Vehicle Routing Problem (CVRP)

> Part of the [S08 — Vehicle Routing Problem](../08_s08_vrp.md) use-case node. This page lists the
> **variants/regimes**, what their **KPIs** show, and **how to read the viz**. The numbers below are read
> directly from the committed manifest [`manifests/s08_vrp.json`](../../../manifests/s08_vrp.json) — the
> *replay = truth* record — so they match exactly what the app renders.

## The ten variants

Each variant is one CVRP instance (the parameters of [01 · Assumptions](./01_assumptions.md)). The table
shows the **OR-Tools** primary KPIs (`total dist`, `longest route` = `max_route_time`, `vehicles used`) and
the **PyVRP** head-to-head from the `analytic` block (its total, the `distance_gap` = OR-Tools − PyVRP, and
each engine's longest route by distance, `max_route_dist`).

| Variant | Customers · Vehicles | `Q` | OR total | OR longest | OR veh. used | PyVRP total | Gap (OR−PyVRP) | OR max-dist / PyVRP max-dist |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| **small** | 8 · 2 | 14 | 22.0 | 12.0 | 2 | 22.0 | 0.0 (0.0%) | 12.0 / 12.0 |
| **base** | 12 · 3 | 12 | 36.0 | 12.0 | 3 | 30.0 | **6.0 (16.7%)** | 12.0 / 16.0 |
| **tightcap** | 12 · 3 | 8 | 36.0 | 12.0 | 3 | 36.0 | 0.0 (0.0%) | 12.0 / 16.0 |
| **fewveh** | 12 · 2 | 18 | 30.0 | 16.0 | 2 | 30.0 | 0.0 (0.0%) | 16.0 / 16.0 |
| **manyveh** | 12 · 4 | 9 | 36.0 | 12.0 | 3 | 34.0 | 2.0 (5.6%) | 12.0 / 16.0 |
| **c15** | 15 · 3 | 14 | 46.0 | 16.0 | 3 | 42.0 | 4.0 (8.7%) | 16.0 / 18.0 |
| **c15v4** | 15 · 4 | 12 | 46.0 | 16.0 | 3 | 42.0 | 4.0 (8.7%) | 16.0 / 18.0 |
| **c18** | 18 · 4 | 14 | 64.0 | 18.0 | 4 | 56.0 | **8.0 (12.5%)** | 18.0 / 20.0 |
| **dense** | 10 · 3 | 10 | 30.0 | 12.0 | 3 | 30.0 | 0.0 (0.0%) | 12.0 / 14.0 |
| **spread** | 12 · 3 | 14 | 56.0 | 20.0 | 3 | 50.0 | 6.0 (10.7%) | 20.0 / 30.0 |

## What the KPIs show

**1 — The two engines optimize different things, and the trade-off is visible in the data.** Whenever there
is a non-zero gap (base, manyveh, c15, c15v4, c18, spread), **PyVRP's total is shorter** but its **longest
route is longer** than OR-Tools' (PyVRP max-dist ≥ OR max-dist in *every* row). This is the headline lesson
made quantitative: PyVRP minimizes pure total distance; OR-Tools' global-span term trades a little total
distance for a **more balanced** fleet (a shorter longest route). The starkest case is **spread**
(OR 20.0 vs PyVRP 30.0 longest route) — PyVRP saves 6 units of total distance by overloading one route.

**2 — "What good looks like" is concrete.** The gap ranges from **0% up to ~17%** (base). On these small,
metric grid instances a properly-configured general-purpose solver is solid, but a competition-grade HGS
solver still finds materially shorter totals — exactly why the lab ships both rather than one.

**3 — Extra vehicles only get used when the instance is tight enough to need them.** This is the most
counter-intuitive reading and is borne out by the numbers:

- **manyveh** offers a 4th vehicle (`K=4`) but OR-Tools still uses only **3** — same total (36.0) and same
  longest route (12.0) as **base**. The extra vehicle is dropped as unused.
- **c15v4** offers `K=4` but again uses **3**, matching **c15**'s 3-route solution exactly (46.0 / 16.0). 
- The takeaway: with a balancing objective, adding a vehicle does **not** automatically help — it helps only
  when capacity or geometry forces the work to spread.

**4 — Capacity that doesn't bind changes nothing.** **tightcap** drops `Q` to 8, but on this instance the
demand is low enough that the cap **does not bind**: OR-Tools' solution is identical to **base** (3 routes,
36.0 total, 12.0 longest). Compare with **fewveh** (`K=2`), where removing a vehicle *does* bite — total
drops to 30.0 but the longest route grows to 16.0 (the work is squeezed onto two routes).

**5 — Geometry drives cost.** **dense** (10 customers packed on a small `6×6` grid) is cheap (30.0);
**spread** (12 customers on a large `10×10` grid) is expensive (56.0) with the longest route at 20.0 — long
legs dominate. **c18** (18 customers, `9×9`) is the largest instance and the only one that genuinely uses
**4** vehicles, with the second-largest absolute gap (8.0).

## How to read the viz

- **The map.** The synthetic road grid is drawn with junctions and streets. The **depot** is marked
  **green** (legend `depot`) and the **customers** **magenta** (legend `customer`).
- **The routes.** Each *used* vehicle gets **one route color** and animates leaving the depot, visiting its
  customer sequence in order, and returning. Unused vehicles (depot→depot only) are not drawn.
- **The OR-Tools ↔ PyVRP overlay.** The primary (OR-Tools) plan is what renders by default; the PyVRP plan
  lives in the `analytic` slot with the **same polyline/leg shape**, so the frontend can toggle/overlay it to
  show the head-to-head — and the `compare` block surfaces the distance gap directly.
- **The HUD KPIs** (configured columns: `total_distance`, `max_route_time`, `vehicles_used`, `customers`,
  `capacity`). The reading lens is the **total-distance ↔ longest-route trade-off**: compare `vehicles_used`
  against `total_distance` and `max_route_time` across variants. When the gap to PyVRP is non-zero, that is
  the price OR-Tools pays for balance — a shorter longest route at the cost of a slightly longer total.

## Reproducing the numbers

Everything above is deterministic from `(params, inst_seed)` with the fixed solver seed **42** and the
deterministic stops (OR-Tools `solution_limit = 200`, PyVRP `MaxIterations(200)`). The committed manifest
holds both plans; re-running the offline pipeline reproduces it byte-for-byte. See
[03 · Solvers applied](./03_solvers-applied.md) for the engine configuration and the
[Precompute pipeline](../../guides/01_precompute-pipeline.md) for the local `.venv` → trace → replay flow.
