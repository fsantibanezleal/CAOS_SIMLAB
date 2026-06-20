# 01 · Assumptions & scope

The canonical instance of S07 and the explicit boundary of what the model does and does not capture. Numbers
here are taken verbatim from [`simlab/scenarios/s07_haul.py`](../../../simlab/scenarios/s07_haul.py) and the
shared terrain in `simlab/scenarios/_geo.py`; nothing is invented.

## The canonical instance

A single shared loader serves a fixed fleet of trucks that recirculate between one load point and one dump,
across a graded grid road network.

| Element | Canonical value | Source |
|---|---|---|
| Grid | `g × g` junction grid, `g = 12` | `param_specs` default `grid=12` |
| Terrain | `"ridge"` — a horizontal Gaussian ridge at `ridge_row = (g−1)/2 = 5.5` | `GridNetwork(..., terrain="ridge")` |
| Pass | one low notch carved at `pass_col = 2` (column index) | terrain `passes=[pass_col]` |
| Load point | bottom edge, column `lift_col = 4` → node `0·g + lift_col` | `load_node` |
| Dump point | top edge, column `lift_col = 4` → node `(g−1)·g + lift_col` | `dump_node` |
| Grade penalty | `grade` (γ), default `3.0`, range `0–8` | `ParamSpec("grade", …)` |
| Trucks | `n_trucks` (N), default `5`, range `1–14` | `ParamSpec("n_trucks", …)` |
| Loaders | `n_loaders` (c), default `1`, range `1–4` | `ParamSpec("n_loaders", …)` |
| Load time | `load_time = 4.0` min (the binding service) | `run()` |
| Dump time | `dump_time = 1.0` min | `run()` |
| Truck speed | `speed = 1.0` (leg time = cost / speed) | `run()` / `timed_legs` |
| Shift length | `horizon` (H), default `60.0` min, range `20–200` | `ParamSpec("horizon", …)` |
| Barrier | `barrier ∈ {0,1}` — walls the two ridge-row cells in `lift_col` | `run()` `blocked` |

The elevation field is **deterministic** (a Gaussian ridge `ridge_amp·exp(−(y−ridge_row)²/2w²)` multiplied
by pass notches, plus a tiny base tilt `base_tilt·y/(rows−1)`; no RNG — see `_geo._build_elev`). A
**barrier**, when enabled, removes the two ridge-row cells of the lift column from the graph entirely,
forcing a detour regardless of grade.

## What is modeled

- An **exactly optimal loaded route** from load to dump that minimizes a grade-graded edge cost
  (penalizing only climbing), with a **fast empty return** routed on plain distance.
- A **single shared loader** (capacity `n_loaders`) as the **binding resource** of the cycle.
- A **finite** calling population of `N` trucks: a truck cannot ask for the loader again until it finishes
  its haul-and-return, so this is the machine-repair (finite-source) `M/M/1//N` queue — the analytic
  analogue that explains why throughput saturates at the loader rate.
- A **finite shift** of length `H` (transient, not steady state): a load that cannot finish before `H` is
  dropped, so the shift end truncates the run.

## What is NOT modeled

The following are deliberately out of scope for this scenario:

- **Variable truck speed or breakdowns** — speed is fixed at `1.0`, trucks never fail.
- **Loaded descent** — only positive climb is penalized (`max(0, Δelev)`); going down is free of grade
  penalty.
- **Multi-truck road congestion** — trucks share the loader but not the road; legs never interfere.
- **Explicit fuel cost** — the grade penalty is a proxy, not a fuel/energy model.
- **Dynamic in-shift rerouting** — the route is fixed once at the start of the shift.
- **Multi-vehicle capacitated routing (CVRP)** — that is a separate scenario (S08).
- **Stochastic dispatch / random call streams** — handled in a separate dispatch scenario (S09).

## Determinism

The route is a **unique shortest path on a fixed graph** (NetworkX), confirmed by a seeded CP-SAT solve
(OR-Tools). The DES has **no stochastic variates** in this variant family — service times are fixed
(`load_time`, `dump_time`) and leg times are a deterministic function of the route — so the replay is a
**fully deterministic function of (params, seed)**: the same input yields the same trace byte-for-byte. The
`seed` is recorded in the trace as the reproducibility key, but it is **inert** here (there is no random
sampling). This is what places the scenario in the deterministic-replay precompute lane — see
[03 · Solvers applied](./03_solvers-applied.md).
