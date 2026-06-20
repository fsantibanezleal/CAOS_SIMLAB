# S05 Beer Game — the canonical instance, scope & assumptions

← Back to the use-case index: [../05_s05_beergame.md](../05_s05_beergame.md) ·
Next: [02_formalization.md](./02_formalization.md)

This page pins down **exactly which Beer Game instance the lab ships** and draws the line between what the
model captures and what it deliberately leaves out. The numbers and rules here are read straight from
[`simlab/scenarios/s05_beergame.py`](../../../simlab/scenarios/s05_beergame.py) and the scenario's Context
block in the live app (`web/src/pages/Experiments.tsx`, `S05Desc`); nothing is invented.

---

## 1. The canonical instance

The classic MIT **Beer Distribution Game** as a deterministic, seeded simulation of four serial echelons.

| Element | Value in the shipped instance | Source |
|---|---|---|
| Echelons (in series) | retailer → wholesaler → distributor → factory | `STAGES` |
| Horizon | 52 weeks (default; slider 20–120) | `ParamSpec("weeks", …, 52, 20, 120)` |
| Base demand `d₀` | 8 units/week | `base = 8.0` |
| Replenishment policy | order-up-to (base-stock) on an exponentially-smoothed forecast | `EchelonAgent.place_order` |
| Lead time `L` | 2 weeks (default; slider 1–6, integer) | `ParamSpec("lead", …, 2, 1, 6)` |
| Forecast smoothing `θ` | 0.4 (default; slider 0.1–0.9) | `ParamSpec("theta", …, 0.4, 0.1, 0.9)` |
| Demand change `Δ` | 4 units (default; slider 0–12) | `ParamSpec("step", …, 4.0, 0, 12)` |
| Demand pattern | step / spike / AR(1) noise (default = step) | `ParamSpec("pattern", …, 0, 0, 2)` |
| Shock timing (step & spike) | displayed week 7 (`warmup = 6`, the 0-indexed array position) | `warmup = 6` |
| Seed | 42 (only matters for the AR(1) noise pattern) | manifest `seed: 42` |

The shock is applied to **end-customer demand only**: base demand of 8 units/week receives a step (or a
one-week spike, or AR(1) noise) starting at **displayed week 7** (the code's `warmup = 6` is the 0-indexed
array position — `demand[6:]` — and the chart's x-axis is `range(1, weeks+1)`, so array index 6 is the 7th
plotted week), and the question is how that small, downstream change propagates upstream. Same parameters
across all four echelons (homogeneous policy).

## 2. What the model **does** capture

- **The order-decision dynamics of each echelon** — a forecast that adapts to incoming demand, and an
  order-up-to target sized for the lead time. These are the two structural drivers of the bullwhip in the
  Lee–Padmanabhan–Whang (1997) account: **demand-signal processing** (forecast updating) and the
  **order-up-to / lead-time** sizing.
- **The serial coupling** — one echelon's placed order *is* the demand the next echelon upstream sees, so
  amplification compounds stage by stage. Within a single week the model activates the echelons
  **downstream → upstream**, so the order an agent places this tick is the demand its upstream neighbour
  reads this same tick (information ripples up one stage per activation).
- **Amplification, measured** — the per-echelon **bullwhip ratio** `Bᵢ = Var(oᵢ)/Var(d)`, the order variance
  relative to the original customer-demand variance (cumulative amplification, not the stage-local ratio).
- **Determinism** — for the step and spike patterns the run is exact; the noisy pattern is an AR(1) process
  driven entirely by the seeded model RNG, so `(params, seed)` reproduces the trace exactly.

## 3. What is **out of scope** (deliberately not modeled)

This instance is a clean teaching model of *order amplification*, not a full inventory simulation. It does
**not** model:

- **Physical inventory and backorders** — there is no on-hand stock variable, no unmet-demand queue. Only
  the *order signal* and its variance are tracked.
- **Costs** — no holding cost, no stockout/backorder penalty, no objective function. **Nothing is
  optimized**; the goal is to *exhibit* the amplification, not minimize it. (Contrast the optimization
  scenarios S06–S11, which do minimize a real cost.)
- **Information delays other than the shipping lead time** — order information is assumed to reach the
  upstream neighbour the same week it is placed.
- **Per-echelon heterogeneity** — every echelon uses the same `L` and `θ`. Mixed policies, different
  lead times per stage, or strategic behaviour (e.g. order batching, gaming, rationing) are not modeled.
- **Capacity limits at the factory** — orders are unbounded above; the only clamp is non-negativity
  (`order = max(0, …)`).

## 4. Initial / steady-state assumptions

Before the week-7 shock every echelon is assumed to sit in steady state at the base demand:

- Forecast seeded at base demand: `forecast = d₀ = 8` (the pre-loop value; the first *computed* forecast is
  `F₁`).
- Order-up-to seeded at the steady-state level: `S^{(i)}_0 = (L+1)·d₀` (verified `self.s_prev = (lead + 1) *
  base`, so the pre-shock order equals base demand and `Bᵢ = 1` until the shock perturbs the chain).

These seeds are why a flat demand produces flat orders — the bullwhip only appears once the customer-demand
signal changes. (The seed is the order-up-to level *carried into* the first week's order, so it is indexed
`S^{(i)}_0` — subscript 0, not −1 — consistent with the order recurrence that indexes from `t = 1`; the
numeric value `(L+1)·d₀` is the same regardless of how the subscript is written.)

---

Continue to the math: [02_formalization.md](./02_formalization.md) ·
the tool & lane: [03_solvers-applied.md](./03_solvers-applied.md) ·
results: [04_results-and-reading.md](./04_results-and-reading.md).
