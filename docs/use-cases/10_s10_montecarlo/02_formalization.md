# 02 — Formalization

> Reading order: file 2 of 4 in the [S10 use-case node](../10_s10_montecarlo.md).
> Previous: [01 — Assumptions & scope](./01_assumptions.md) · Next:
> [03 — Solvers applied](./03_solvers-applied.md).

The math below is pulled verified from the scenario Context block (`S10Desc` in
`web/src/pages/Experiments.tsx`) and from the code
([`s10_montecarlo.py`](../../../simlab/scenarios/s10_montecarlo.py),
`erlang_c_mmc` in [`s01_queue.py`](../../../simlab/scenarios/s01_queue.py)). It is kept consistent with the
code — nothing here is invented.

## Model class

**M/M/c** (Poisson arrivals, exponential service, `c` servers, FCFS), studied by
**independent-replication Monte-Carlo**. It is the same M/M/c *model class* as S01, but a **different
engine**: S10 uses a fast NumPy heap-based earliest-free-server estimator (`mmc_mean_wait`), not S01's
SimPy `Resource` simulation — so a per-run `Wq` here is not byte-identical to an S01 run, only the same
underlying queue. S10 wraps that estimator in an output-analysis study.

## Sets & indices

- Replication index `r = 1, …, N` — each is one independent seeded run.
- Customer index `i = 1, …, n` *within* a replication.
- Running prefix length `k = 1, …, N` — the "how many replications so far" axis of the chart.

## Parameters (fixed per study)

- `λ` — arrival rate (`lam`).
- `μ` — per-server service rate (`mu`).
- `c` — number of servers.
- `n` — customers simulated per replication (`n_customers`).
- `N` — number of replications (`n_reps`).
- `seed` — base seed; replication `r` uses `seed + r`.
- `z` — the 95% two-sided normal critical value. In the code this is the **exact** SciPy value
  `Z95 = scipy.stats.norm.ppf(0.975) ≈ 1.959964` (the Context's `z = 1.96` is the rounded narrative form
  of the same constant).

The **utilization** (the load axis of the whole study):

```
ρ = λ / (c·μ),   here μ=1, c=3  ⇒  ρ = λ/3.
```

## Random variable & state variables

- **Per-replication random variable** `Wq^(r)` = the mean time-in-queue of replication `r`, computed by
  the earliest-free-server method (`mmc_mean_wait`): build a min-heap of the `c` server-free times, and
  for each customer `i` take `start = max(arrival[i], earliest_free)`, accumulate `start - arrival[i]`,
  then push `start + service[i]`. Returns `total_wait / n`. This yields an i.i.d. sample
  `Wq^(1), …, Wq^(N)`.
- **Estimator state, as a function of `k`:**
  - running mean `W̄_k`,
  - running sample standard deviation `s_k` (corrected, ddof=1),
  - running 95% CI half-width `h_k`.
- **Reference (oracle):** the closed-form Erlang-C `Wq` and the utilization `ρ`.

## Objective / quantities computed

This is an **estimation** study (no decision variable to optimise) — the "objective" is to estimate `Wq`
with a quantified uncertainty and compare it to the analytic truth.

**Running mean** after `k` replications:

```
W̄_k = (1/k) · Σ_{r=1..k} Wq^(r).
```

**Sample standard deviation** (corrected, ddof = 1):

```
s_k = sqrt( (1/(k-1)) · Σ_{r=1..k} (Wq^(r) − W̄_k)^2 ).
```

**95% CI half-width** (normal approximation) and the interval:

```
h_k = z · s_k / sqrt(k),    CI_95% = [ W̄_k − h_k ,  W̄_k + h_k ].
```

In the code, for `k = 1` the half-width is set to `0.0` (a single point has no spread); from `k ≥ 2` the
band uses `np.std(wqs[:k], ddof=1)` with the SciPy critical value `Z95`. The **headline** CI (the final
point) is built through the canonical SciPy API rather than re-derived by hand:

```
final_mean   = mean(Wq^(1..N))
sem          = scipy.stats.sem(Wq^(1..N))                     # = s_N / sqrt(N), ddof=1
(lo, hi)     = scipy.stats.norm.interval(0.95, loc=final_mean, scale=sem)
ci_halfwidth = (hi − lo) / 2                                  # == h_N
```

## The oracle (closed-form Erlang-C)

With offered load `a = λ/μ` (Erlangs) and `ρ = λ/(c·μ)`, the Erlang-C delay probability and the mean wait:

```
C(c,a) = [ (a^c / c!) · 1/(1−ρ) ] / [ Σ_{n=0..c−1} a^n/n!  +  (a^c / c!)·1/(1−ρ) ]

Wq = C(c,a) / (c·μ − λ).
```

This matches `erlang_c_mmc` in [`s01_queue.py`](../../../simlab/scenarios/s01_queue.py), which also
returns `Lq = λ·Wq` and `p_wait = C(c,a)`. **Unstable regime:** when `ρ ≥ 1` (`λ ≥ c·μ`) there is no
finite steady state, so the function returns `Wq = None` (null, not ∞) — the chart then draws no theory
line and the sample mean grows with `n` instead of converging.

## Convergence properties (what the math predicts)

- **Consistency.** By the law of large numbers `W̄_k → Wq` as `k → ∞`.
- **Precision scaling.** `h_k ∝ 1/√k`: quadrupling the replications halves the CI.
- **Load → variance.** As `ρ` rises the `Wq^(r)` spread widens, so `s_k` (and hence `h_k`) grow — more
  replications are needed for the same precision.
- **Bias caveat (the finite-run lesson).** Consistency/precision are about the *sampling distribution of
  the estimator*. They say nothing about bias: with a short run length `n` and high load, each `Wq^(r)`
  carries a start-up transient, so `W̄_k` converges to a **biased** value and a tight CI sits around it,
  outside Erlang-C. Precision ≠ accuracy.

## KPIs (emitted in the trace)

From `tr.kpis` in [`s10_montecarlo.py`](../../../simlab/scenarios/s10_montecarlo.py):

| KPI | Meaning |
|---|---|
| `final_mean` | `W̄_N`, the final running mean (the headline estimate of `Wq`) |
| `ci_halfwidth` | `h_N`, the 95% CI half-width at the final replication |
| `theory_Wq` | the Erlang-C `Wq` (null when `ρ ≥ 1`) |
| `rel_error_pct` | `100·|W̄_N − Wq| / Wq` — relative error vs theory (null when unstable) |
| `n_reps` | `N`, the replication budget |
| `rho` | the utilization `ρ` |

The trace also carries the series (`x`, `run_mean`, `ci_lo`, `ci_hi`), the Erlang-C reference line, the
per-run histogram (`bars`: 18-bin edges + counts) and the analytic block. The x-axis label is
"replications n", the y-axis "mean wait Wq".
