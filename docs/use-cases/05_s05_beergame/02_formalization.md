# S05 Beer Game — formalization

← Back to the use-case index: [../05_s05_beergame.md](../05_s05_beergame.md) ·
Prev: [01_assumptions.md](./01_assumptions.md) · Next: [03_solvers-applied.md](./03_solvers-applied.md)

The math below is the **verified** formalization from the scenario's Context block
(`web/src/pages/Experiments.tsx`, `S05Desc`) cross-checked line-for-line against the code in
[`simlab/scenarios/s05_beergame.py`](../../../simlab/scenarios/s05_beergame.py). The S05 adversarial audit
confirmed every equation matches the implementation; nothing here is invented.

---

## Model class

A **deterministic, sequential agent-based model (ABM)**. Four echelons, no spatial grid — the topology is a
*serial line* (a tiny network). Each echelon is an autonomous agent running one local rule; the bullwhip is
an **emergent** property of the four agents interacting, not anything programmed globally.

## Sets

| Symbol | Meaning |
|---|---|
| `i ∈ {1,2,3,4}` | echelons in series: 1 = retailer, 2 = wholesaler, 3 = distributor, 4 = factory |
| `t = 1 … W` | discrete weeks (`W = 52` by default) |

## Parameters

| Symbol | Meaning | Default | Range |
|---|---|---|---|
| `L` | shipping lead time (integer weeks), same for all echelons | 2 | 1–6 |
| `θ` | exponential-smoothing weight (forecast reactivity), `θ ∈ (0,1)` | 0.4 | slider 0.1–0.9 |
| `d₀` | base customer demand | 8 | fixed |
| `Δ` | magnitude of the demand change | 4 | 0–12 |
| `pattern` | demand-shock shape: 0 = step, 1 = spike, 2 = AR(1) noise | 0 (step) | {0,1,2} |
| `seed` | RNG seed (only affects the AR(1) pattern) | 42 | — |

## Decision, state & input variables (per echelon `i`, per week `t`)

| Symbol | Role | Code |
|---|---|---|
| `r^(i)_t` | **input** — orders the echelon *receives* this week | `received` arg of `place_order` |
| `F^(i)_t` | **state** — exponentially-smoothed forecast of received demand | `self.forecast` |
| `S^(i)_t` | **state** — order-up-to (base-stock) target level | `s_t`, with prior in `self.s_prev` |
| `o^(i)_t` | **decision** — the order the echelon *places* (emitted upstream) | return of `place_order` |

The retailer's input is the customer demand: `r^(1)_t = d_t`. Every other echelon's input is the order its
**downstream** neighbour just placed.

## Customer-demand signal `d_t` (the only exogenous driver)

Built once, up front, from the seeded RNG (`BeerGameModel._build_demand`):

- **step** (`pattern=0`): `d_t = d₀` for the first `warmup = 6` weeks, then `d_t = d₀ + Δ` from **array
  index 6 onward**. Note the labeling: the demand array is 0-indexed while the plotted x-axis is `range(1,
  W+1)` (1-indexed weeks, `s05_beergame.py:190`), so array index 6 is rendered as **displayed week 7** — the
  step appears on the chart at week 7, not week 6.
- **spike** (`pattern=1`): `d_t = d₀` everywhere except a single pulse at **array index 6** (`demand[ws] = d₀
  + Δ`), i.e. **displayed week 7** on the same 0-vs-1 indexing as the step.
- **AR(1) noise** (`pattern=2`): `e_t = 0.6·e_{t−1} + ε_t`, `ε_t ∼ N(0, (Δ/2)²)`, then
  `d_t = max(0, d₀ + e_t)`. The draws flow through the seeded model RNG — reproducible per seed.

## Dynamics (the per-week local rule, `EchelonAgent.place_order`)

Each echelon, given the demand it received this week, updates its forecast, sizes its order-up-to target,
and emits a non-negative order:

**1. Forecast — simple exponential smoothing** (seeded `F^(i)_0 = d₀`):
```
F^(i)_t = θ · r^(i)_t + (1 − θ) · F^(i)_{t−1}
```

**2. Order-up-to target — cover the lead time plus the current period** (`L+1` forecast periods):
```
S^(i)_t = (L + 1) · F^(i)_t
```

**3. Order — replenish consumption plus the target-level adjustment, clamped non-negative:**
```
o^(i)_t = max( 0,  r^(i)_t + ( S^(i)_t − S^(i)_{t−1} ) )
```

**4. Serial coupling — one echelon's order is the next echelon's demand:**
```
r^(i+1)_t = o^(i)_t
```

Within a week the four agents activate **downstream → upstream** (retailer first, factory last), so the
order placed at stage `i` becomes the demand read at stage `i+1` *in the same tick* — information ripples up
the chain one activation per stage. There is no separate objective or constraint set: in an ABM **the run is
the answer**; the dynamics above, iterated for `W` weeks, *are* the model.

## Objective / constraints

- **Objective:** none. No cost is minimized — the model *exhibits* amplification, it does not optimize it.
- **Constraints:** the single structural constraint is non-negativity of orders (`max(0, …)`). Orders are
  otherwise unbounded; no inventory, backorder, or capacity constraint exists (see
  [01_assumptions.md](./01_assumptions.md) §3).

## KPIs (read out from the emitted trace)

**Bullwhip ratio** per echelon — order variance relative to the *original* customer-demand variance
(`var_d = Var(d)`, floored at `1e-9` to avoid divide-by-zero on flat demand):
```
B_i = Var(o^(i)) / Var(d)
```
The hallmark of the bullwhip is the monotone chain `B₁ ≤ B₂ ≤ B₃ ≤ B₄` with `Bᵢ > 1` — order variance
**grows stage by stage** toward the factory. This is the cumulative amplification (against the original
demand), not the stage-local `Var(oᵢ)/Var(rᵢ)`.

The five KPIs the scenario emits (`tr.kpis`):

| KPI key | Meaning |
|---|---|
| `bullwhip_retailer` | `B₁` |
| `bullwhip_wholesaler` | `B₂` |
| `bullwhip_distributor` | `B₃` |
| `bullwhip_factory` | `B₄` (the headline amplification) |
| `peak_factory_order` | `max_t o^(4)_t` — the largest single order the factory must place |

---

Continue: [03_solvers-applied.md](./03_solvers-applied.md) — which tool runs this and how ·
[04_results-and-reading.md](./04_results-and-reading.md) — what the numbers say.
