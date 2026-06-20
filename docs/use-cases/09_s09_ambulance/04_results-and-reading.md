# 04 · Results & reading — S09 Ambulance Dispatch

The variants/regimes the scenario ships, what their KPIs reveal, and how to read the route visualization.
Variant definitions are from [`../../../simlab/scenarios/s09_ambulance.py`](../../../simlab/scenarios/s09_ambulance.py)
(`variants()`); the KPIs are defined in [02 · Formalization](./02_formalization.md).

## The variants

All variants share the default `g = 8`, `τ = 8` min, `T = 90` min; they sweep **fleet size**, **station
count**, and **demand** `λ`. The teaching axis is *resourcing × siting × load*.

| id | Fleet `c` | Stations `n_s` | `λ` | What it isolates |
|---|---|---|---|---|
| `a2` | 2 | 1 | 12 | Under-resourced: long waits, low coverage. |
| `a3` | 3 | 1 | 12 | Still centralized: travel from one base hurts. |
| `a4` | 4 | 2 | 12 | Two stations cut travel times (the "good" baseline). |
| `a4s1` | 4 | 1 | 12 | **Same fleet, one base** — the pure cost of bad siting. |
| `a6` | 6 | 2 | 12 | A comfortable fleet for this demand. |
| `a4s4` | 4 | 4 | 12 | Spread thin: great siting, less surge capacity. |
| `surge` | 4 | 2 | 22 | A demand surge overwhelms the fleet (`ρ > 1`). |
| `surge6` | 6 | 2 | 22 | More units absorb the surge. |
| `quiet` | 3 | 2 | 6 | Low demand: even a small fleet covers well. |
| `big` | 8 | 4 | 22 | A large, well-sited system under heavy load. |

## What the KPIs show

The HUD reports four numbers per run: **mean response**, **p90 response**, **coverage** within `τ`, and
**offered load** `ρ` (as `load_pct`). The story they tell across the variants:

- **Resourcing (`a2 → a3 → a6`, fixed siting).** Adding units at the same demand drives mean and p90
  response down and coverage up — but with diminishing returns once `ρ` is comfortably below 1.
- **Siting, held resources constant (`a4` vs `a4s1`).** This is the cleanest lesson: **same fleet of 4**, but
  `a4` spreads them over 2 stations while `a4s1` centralizes them at 1. The centralized variant has longer
  average travel-to-scene, so worse response and coverage — *location matters independently of fleet size*.
- **Siting vs surge capacity (`a4s4`).** Spreading 4 units over 4 stations gives the best geographic reach,
  but with one unit per station there is little local **surge** absorption when two nearby calls cluster.
- **Load saturation (`surge` vs `surge6`).** At `λ = 22` the 4-unit fleet's **offered load passes 100%**
  (`ρ > 1`): demand outstrips capacity, units are never idle, response and coverage collapse and calls pile
  up. Six units (`surge6`) bring `ρ` back under 1 and recover coverage. `big` (8 units, 4 stations) shows a
  large well-sited system staying healthy under the same heavy load.
- **Slack (`quiet`).** At `λ = 6`, even 3 units cover well — the system is demand-limited, not capacity-limited.

The single most important reading: **coverage degrades non-linearly as `ρ → 1`.** Below saturation, extra
units buy little; right at it, a small change in fleet or demand swings coverage sharply. `ρ` is the early
warning the mean response alone hides.

## How to read the viz

The trace renders on the [`route`](../../../simlab/core/routetrace.py) viewer (`viz = "route"`):

- **The grid is the streets.** Junctions are the `g × g` nodes; segments are the road edges.
- **Marked nodes.** **Station** nodes are drawn in the accent colour; the single **hospital** (centre) in the
  "good"/green colour. (Legend codes: `station`, `hospital`, `incident`.)
- **Calls.** Each **emergency call** appears as a red `incident` marker at its instant `t_k` and **clears**
  when the responding unit reaches the scene at `t_sc` (the marker's `t0 → t1`). Red markers that **pile up
  unreached** are the visual signature of an overwhelmed fleet.
- **Ambulances.** Each unit (magenta) animates along its legs in order: **base → scene → hospital → base.**
  An idle unit sits at its home station; a busy one is mid-trajectory.
- **The HUD** reports the KPIs live — mean and p90 response, coverage within `τ`, and load `ρ`. When red
  markers accumulate and **load passes 100%**, the fleet is falling behind demand: that is the saturation
  regime made visible.

Because the run is a pure function of `(params, seed)`, every variant replays identically — what you read off
the viz is exactly what the committed KPIs report.

---

Back to the [node index](../09_s09_ambulance.md) · Previous: [03 · Solvers applied](./03_solvers-applied.md).
