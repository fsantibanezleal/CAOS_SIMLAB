# 04 · Results & reading — variants, KPIs, and the viz

> Variant definitions are read from `MineHaulScenario.variants()` in
> [`../../../simlab/scenarios/s11_minehaul.py`](../../../simlab/scenarios/s11_minehaul.py); the narratives
> are the verified per-variant notes (English `ne` / Spanish `nse`) and the Context block. The grade-band
> verdicts ("in band" / "below band") are the *designed intent* of each variant; the live KPIs in the app
> are the authoritative numbers.

## The central regime: fleet size drives the grade slip

The whole scenario turns on one comparison — **the same blend plan, a growing fleet**. The far,
high-grade phase needs the longest loaded hauls, so it is the first to be starved when there are too few
trucks. The headline KPI is **grade deviation from target** (`grade_dev`, lower is better) with the
companion **plan adherence %**.

| Variant | Trucks | Designed outcome |
|---|---|---|
| `undertrucked` | 3 | Too few trucks: the far rich phase lags, the blend **slips below target**. |
| `base` | 6 | A matched fleet roughly realizes the plan: blend **near target**. |
| `overtrucked` | 12 | Ample fleet: every planned flow completes, the blend **lands on target**. |

Reading these three in order is the lesson: *an optimal plan is necessary but not sufficient.* The LP's
`plan_grade` (in the analytic block) stays the same across all three — only the **realized** `ĝ` moves,
because realization is fleet-limited.

## The other regimes (all twelve variants)

| Variant | Key change | What it shows |
|---|---|---|
| `base` | nt=6 | Matched fleet — blend near target. |
| `undertrucked` | nt=3 | Rich phase starved — grade below band. |
| `overtrucked` | nt=12 | Plan fully met — on target. |
| `tight_grade` | tol=0.08 | A **narrow band** — small fleet-driven deviations now miss spec. |
| `surge` | dem=120 | A **demand surge** at the same fleet — adherence drops, out of band. |
| `surge12` | nt=16, dem=120, hz=200 | More trucks + a longer shift **absorb the surge** — back in band. |
| `stock_source` | init=40, sg=3.2 | A pre-built rich stock **feeds** the plant — the stock **drains** as a source. |
| `two_phase_rich` | nt=4, gt=3.2 | A **high target** needs the distant rich phase a small fleet can't deliver. |
| `dump_heavy` | dem=25 | **Low plant demand** — most production routes to the **dump** (more dump loads than plant loads). |
| `barrier` | bar=1 | An **L-shaped wall** on the rich phase's haul road lengthens its cycle — the slip **worsens** vs `base`. |
| `low_target` | gt=1.75 | A **low target** leans on the near phases alone — easy to hit, **in band**. |
| `stock_buffer` | nt=8, init=10 | A stock **fills** from a phase while the plant runs — watch the bar **rise**. |

Two designed contrasts are worth pairing:

- **`surge` vs `surge12`** — the same 120-t demand, but `surge` (6 trucks, 145 shift) falls out of band
  while `surge12` (16 trucks, 200 shift) recovers the blend. Capacity *and* time both matter.
- **`stock_source` vs `stock_buffer`** — the same stockpile node used in its two roles: a pre-built rich
  stock **draining** to feed the plant (`stock_source`, watch `stock_end` fall and `stock_peak ≈ init`),
  versus a stock **filling** from a phase as a buffer (`stock_buffer`, watch the bar rise).

## What the KPIs say

The grid-KPI panel (`MINEHAUL_KPI`) ranks variants by **`grade_dev`** and shows these columns:

| KPI (`code`) | Reading |
|---|---|
| `grade_achieved` (ĝ) | the blend actually delivered to the plant |
| `grade_target` (g*) | the spec |
| `grade_dev` = \|ĝ − g*\| | the headline — **lower is better** |
| `in_band` (0/1) | 1 when \|ĝ − g*\| ≤ τ |
| `plan_adherence_pct` | fraction of the **plant-feed** plan delivered (capped 100%) |
| `plant_tons` | tonnes landed at the plant |
| `n_trucks` | the fleet that produced this row |

Beyond the grid panel, the per-run KPIs also carry `plant_demand`, `loads_plant`, `loads_dump`,
`loads_stock`; and the **analytic** block carries `plan_grade`, `plan_x` (the LP allocation per source),
`demand_eff`, `stock_peak`, `stock_end`. Comparing `plan_grade` (what the LP promised) against
`grade_achieved` (what the fleet delivered) is the honest "plan vs realization" gap.

The pattern to watch: as the fleet shrinks, **`plan_adherence_pct` falls and `grade_dev` rises** — the
plant-feed flows that go short are the long ones from the rich far phase, so the blend loses its
high-grade contribution first and `ĝ` drops below the band.

## How to read the viz

The scenario renders on the **route** viewer (the same one the other haul scenarios use), driven by the
committed routetrace. Elements:

- **Nodes** (legend colors): **phases** (accent) labelled `phase·low / phase·mid / phase·high`,
  **plant** (green — the grade target), **dump** (amber), **stockpile** (magenta).
- **Flows** — the coloured polylines are the *planned* source→destination flows: green to the plant, amber
  to the dump, magenta to/from the stock. They follow the **graded** shortest path, so they visibly wind
  around the hills rather than going straight.
- **Trucks** — animate the realized cycles: they **crawl uphill** on the loaded graded haul and **race
  back empty** on the plain-distance return; trucks aimed at the same phase **queue** for its shared
  loader.
- **Stockpile fill bar** (a gauge at the stock node) — **rises** on tip-in and **falls** on draw-out,
  tracking `ℓ(t)`; the frames come from `stock_frames`. In `stock_source` it drains; in `stock_buffer` it
  rises.
- **Barrier** — in the `barrier` variant an L-shaped wall sits on the rich phase's road; the green flow
  reroutes up and over higher ground and its cycle lengthens.
- **Plant HUD** — counts the trips and compares **grade achieved ĝ vs target g*** and **plan adherence**
  as you change the fleet. When the fleet is under-sized, the stock bar and the trips to the plant fall
  short and **ĝ drops below the band**.

## See also

- The instance & scope: [01 · Assumptions](./01_assumptions.md).
- The math: [02 · Formalization](./02_formalization.md).
- The tools & lane: [03 · Solvers applied](./03_solvers-applied.md).
- Node index: [11 · S11](../11_s11_minehaul.md) · frameworks
  [OR-Tools](../../frameworks/08_ortools.md) · [SimPy](../../frameworks/01_simpy.md).
