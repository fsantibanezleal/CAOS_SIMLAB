# 04 · Results & reading

The S07 variants split into three families: (A) the **route trade-off** (sweep grade across `g*`, move the
pass, drop a wall), (B) the **loader-bottleneck fleet sizing** (route fixed, vary trucks/loaders), and (C)
the **coupled grade × fleet**. The KPI values below are the committed, verified outputs of the deterministic
replay (default `H = 60` min, `t_L = 4` min). Variant definitions are in `variants()` of
[`simlab/scenarios/s07_haul.py`](../../../simlab/scenarios/s07_haul.py).

## (A) Route trade-off — does the route go direct or via the pass?

Read this against the switch grade `g* ≈ 3.4`: when `γ < g*` the route runs **direct over the crest**; when
`γ > g*` it **flips to the pass**.

| Variant | γ | Route taken | Reading |
|---|---|---|---|
| `r_low` | 1.0 | direct over crest | Low grade: the short crest route wins. |
| `r_mid` | 3.0 | direct over crest (`g*≈3.38`) | Just below the switch — still direct. |
| `r_switch` | 4.0 | pass at col 2 | Just past the switch — flips to the low pass. |
| `r_steep` | 8.0 | pass at col 2 | Steep: climbing dominates, the detour is clearly cheaper. |
| `r_passR` | 6.0 | pass at col 9 | Pass moved right (col 9) — the detour goes the other way. |
| `r_wall` | 1.0 | pass at col 3 | A barrier across the direct climb reroutes even at low grade (`g*` reported as undefined). |

The takeaway: the optimal route is **not** monotone in geometry — it **switches discretely** at `g*`. The
`g*` KPI lets you predict the flip without re-solving: it is purely a property of the two reference routes
`(L, C)`, independent of the fleet.

## (B) Loader bottleneck — throughput saturates, wait explodes

Here the route is fixed; only the fleet changes. Watch throughput **flatten** while the loader wait keeps
**climbing** once you cross `MF ≈ 1`.

| Variant | Trucks · loaders | Loads | Wait/load | Reading |
|---|---|---|---|---|
| `f_t2` | 2 · 1 | 4 | ~0.99 | Under-trucked: the loader idles, throughput is fleet-limited. |
| `f_t6` | 6 · 1 | 12 | ~4.97 | Loader busy; queues begin to form (MF → 1). |
| `f_t12` | 12 · 1 | 15 | ~20.95 | Over-trucked: loads rise only ~12 → ~15 while the wait jumps ~5 → ~21 (~4×). |
| `f_l2t12` | 12 · 2 | 24 | — | A second loader lifts the throughput ceiling. |
| `f_l3t12` | 12 · 3 | 24 | — | Three loaders absorb the big fleet. |

The signature result: going from 6 to 12 trucks on **one** loader barely raises loads (the loader is already
maxed at `c·μ`) but **quadruples** the per-load wait — every extra truck just adds queue. Adding loaders, not
trucks, is what raises the ceiling (`f_l2t12`/`f_l3t12` jump to 24 loads).

## (C) Coupled grade × fleet

| Variant | Trucks · γ | Loads | Cycle | Reading |
|---|---|---|---|---|
| `x_steep2` | 6 · 8.0 | 12 | ~31.63 | Steep + matched-ish fleet: the long cycle lowers throughput. |
| `x_flat` | 6 · 0.0 | 13 | ~27.00 | Flat haul: fast cycles, route trivially direct. |

A steeper haul lengthens the cycle time, which lowers the match factor for the same fleet — grade and fleet
sizing are coupled, not independent.

## How to read the viz

- **Shaded field** — the ridge (warm) and the low pass (cool); the elevation that drives the cost.
- **Trucks** — crawl uphill on the graded loaded route and race back fast on the empty return.
- **Node colours** — `load` (green) and `dump` (amber).
- **Faint line** — the chosen loaded route; it **visibly moves to the pass** as `γ` rises past `g*`.
- **HUD** — counts trucks currently en route.

In the **KPI table**: watch `throughput_per_hr` flatten while `loader_wait_per_load` keeps climbing once you
cross `MF ≈ 1` (family B), and compare `switch_grade_est` (`g*`) against each variant's `γ` to predict
direct-vs-pass (family A). For the full per-variant captions and the broader optimization-vs-simulation
framing, see the [Optimization & Routing problem-type guide](../../problem-types/03_optimization-routing.md) and
the in-app Experiments description (the `S07Desc` Context block).
