# 04 — Results & reading

> Reading order: file 4 of 4 in the [S10 use-case node](../10_s10_montecarlo.md).
> Previous: [03 — Solvers applied](./03_solvers-applied.md).

## The ten variants

All variants hold `μ = 1`, `c = 3`, `n_customers = 600` fixed (so `ρ = λ/3`) and move only the load (`λ`)
and the replication budget (`n_reps`). From `variants()` in
[`s10_montecarlo.py`](../../../simlab/scenarios/s10_montecarlo.py):

| Variant | λ | ρ | reps | The lesson |
|---|---|---|---|---|
| `rep50_mod` | 2.0 | ≈0.67 | 50 | Few replications: wide, jumpy CI. |
| `rep200_mod` | 2.0 | ≈0.67 | 200 | More replications: the CI tightens around theory. |
| `rep500_mod` | 2.0 | ≈0.67 | 500 | Many replications: a tight, well-centred CI. |
| `rep200_light` | 1.5 | ≈0.50 | 200 | Light load: low variance, easy to estimate. |
| `rep200_busy` | 2.4 | ≈0.80 | 200 | Busier: more run-to-run variability. |
| `rep200_heavy` | 2.7 | ≈0.90 | 200 | Heavy load: ~600 customers/run is too short — a ~16% transient bias pulls the CI below Erlang-C. |
| `rep500_busy` | 2.4 | ≈0.80 | 500 | More reps tame the busy-system variance. |
| `rep500_heavy` | 2.7 | ≈0.90 | 500 | More reps tighten the CI but can't fix bias: it converges precisely onto a ~16%-low value, outside Erlang-C. |
| `rep50_heavy` | 2.7 | ≈0.90 | 50 | The danger case: few reps at high load — don't trust it. |
| `rep500_light` | 1.5 | ≈0.50 | 500 | Best case: light load, many reps, razor-tight CI. |

## Two readings, two lessons

### Lesson 1 — replication / CI (precision)

Read the **replication sweep** at fixed load `rep50_mod → rep200_mod → rep500_mod` (`ρ≈0.67`). The 95% CI
closes like `1/√N` — quadruple the reps, halve the half-width — until the running mean sits on the
Erlang-C line and the band is narrow. `rep500_light` is the clean best case (light load + many reps =
razor-tight CI centred on theory). This is the textbook output-analysis lesson: a single run is noisy, but
the running mean of many seeded replications stabilises and the CI narrows predictably.

The **load sweep** at fixed 200 reps `rep200_light (0.50) → rep200_busy (0.80) → rep200_heavy (0.90)`
shows the complementary effect: as `ρ` rises the per-run `Wq^(r)` spread widens, so `s_k` — and therefore
the CI half-width `h_k` — grow. More load ⇒ more replications needed for the same precision. For `ρ ≤ 0.8`
the sweep still converges to Erlang-C (theory sits comfortably in-band), and `rep500_busy` confirms that
more reps tame the busy-system variance.

### Lesson 2 — finite-run bias (precision ≠ accuracy)

At `ρ = 0.9` with only ~600 customers per run a **start-up transient bias** sets in: each replication
starts empty and never reaches steady state within 600 customers, so the per-run mean comes out **~16%
low**. The consequences are the point of the scenario:

- `rep200_heavy` → `rep500_heavy`: adding replications **tightens** the CI but *around the biased value*.
  The Erlang-C line falls **outside** the band. A tight CI here is a *precise estimate of the wrong
  number* — the CI measures the precision of a biased estimator, not its accuracy.
- `rep50_heavy` is the **danger case**: few reps at high load. Erlang-C happens to fall in-band, but only
  because the CI is so wide — the mean is still ~9% biased low. "Theory is inside my CI" is not the same as
  "my estimate is correct".

The honest takeaway baked into the variants: the fix for bias is a **longer run / warm-up discard**, not
more replications. S10 deliberately omits warm-up removal (see
[01 — Assumptions](./01_assumptions.md)) so this failure mode is visible.

## How to read the visualization

- **X-axis** = replication count `n`; **Y-axis** = mean wait `Wq`.
- **Magenta line** = the running mean `W̄_k` — the estimate as replications accumulate.
- **Shaded band** = the 95% CI `[W̄_k − h_k, W̄_k + h_k]`. Watch it narrow as replications arrive; its
  closing rate *is* the `1/√n` law.
- **Green reference line** = the closed-form Erlang-C `Wq`. **Absent** when `ρ ≥ 1` (no steady state) — its
  absence is itself the signal that the system is unstable.
- **Faint bars** = the histogram (18 bins) of the per-run `Wq^(r)`. Its **width is the variance** that
  dilates the CI — a wide histogram and a wide band are the same fact seen two ways.
- The relationship to watch: does the green line sit *inside* the band (accurate) or *outside* it (the
  finite-run-bias cases)?

## KPI readout (the HUD)

The KPI grid (`MONTECARLO_KPI` in the web app, `tr.kpis` in the scenario) reports, per run:

| KPI | Read it as |
|---|---|
| `final_mean` (`W̄_N`) | the headline estimate of `Wq` |
| `theory_Wq` | the Erlang-C truth (blank when `ρ ≥ 1`) |
| `ci_halfwidth` (`h_N`) | how *precise* the estimate is (shrinks with `N`, grows with `ρ`) |
| `rel_error_pct` | how *accurate* it is: `100·|W̄_N − Wq|/Wq` — the bias shows up here (~16% in the heavy cases) even when `ci_halfwidth` is tiny |
| `n_reps` (`N`) | the replication budget |
| `rho` (`ρ`) | the load |

The pair to compare is **`ci_halfwidth` vs `rel_error_pct`**: a small half-width with a large relative
error is the finite-run-bias signature — a confident, wrong answer.

## Related

- [02 — Formalization](./02_formalization.md) — the `1/√k` and bias math behind these readings.
- [Monte-Carlo & Replications](../../problem-types/04_monte-carlo-replications.md) — warm-up bias, variance
  reduction, and DOE in depth.
- Tools: [12 — joblib](../../frameworks/12_joblib.md) · [13 — `scipy.stats`](../../frameworks/13_scipy-stats.md).
