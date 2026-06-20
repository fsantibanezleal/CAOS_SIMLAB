# 03 — Methods & KPIs: CIs, warm-up, variance reduction, DOE

> Part of [Monte-Carlo replications & the simulation-methodology curriculum](../04_monte-carlo-replications.md).
> Prev: [02 — When to use it](./02_when-to-use.md) · Next: [04 — Tools](./04_tools.md).

This is the analytical heart of the curriculum: how to turn a sample of seeded replications into an honest
confidence interval, how to remove the warm-up bias that no number of replications can fix, how to buy
precision more cheaply with variance reduction, and how to sweep a parameter space with uncertainty intact.

## Confidence intervals: the honest answer

The deliverable of a replication study is not a point estimate — it is an **interval** that, over repeated
studies, would contain the true value a stated fraction of the time (e.g. 95%).

### Normal-approximation (large `n`)

For a reasonably large number of replications (a common rule of thumb is `n ≥ 30`, and our GPU/joblib
studies run hundreds-to-thousands), the Central Limit Theorem justifies a normal-based interval on the
sample mean:

```
X̄ ± z_(1−α/2) · s / √n
```

- `X̄` — sample mean of the per-replication KPI
- `s` — sample standard deviation (with the `n−1` divisor; this is `numpy.std(..., ddof=1)`)
- `n` — number of replications
- `z_(1−α/2)` — the standard-normal critical value (≈ 1.96 for 95%)

### Student-`t` (small `n`, unknown variance)

When `n` is small you do **not** know the variance — you estimate it from the same small sample — so the
normal critical value `z` is too optimistic and the interval is too narrow. Use the **Student-`t`**
distribution with `n−1` degrees of freedom:

```
X̄ ± t_(1−α/2, n−1) · s / √n
```

`t` is wider than `z` for small `n` and converges to `z` as `n → ∞` (by `n ≈ 30` they are within ~2%). The
honest default in this lab is: **use `t` unless you have a genuinely large `n` and a strongly normal
sampling distribution.** It costs nothing and never under-covers.

### How to compute it (don't hand-roll the math)

We do **not** type critical values from a table or reimplement the formula. The interval math comes from
[**`scipy.stats`**](../../frameworks/13_scipy-stats.md) — `scipy.stats.norm.ppf` / `scipy.stats.t.ppf` for
the critical values, or `scipy.stats.t.interval(confidence, df, loc=mean, scale=sem)` and `scipy.stats.sem`
for the standard error directly. This is the canonical, tested implementation; see the
[`scipy.stats` usage guide](../../frameworks/13_scipy-stats/02_usage.md).

### Honesty caveats the curriculum insists on

- **A 95% CI is not "95% probability the truth is in this interval."** It is a statement about the long-run
  coverage of the *procedure*. Teach the frequentist reading explicitly.
- **The CI captures Monte-Carlo (sampling) error only.** It says nothing about *model* error — a wrong
  arrival process or a missing failure mode is not in the interval. A tight CI around a wrong model is a
  precise lie.
- **Means can be the wrong target.** For heavy-tailed KPIs (queue waits near saturation, response-time
  tails) report quantiles (p90/p95) and their intervals too, not just the mean — the mean alone hides the
  tail that operations actually care about.

## The initial-transient (warm-up) bias

Most operational questions are about **steady state** — the long-run average wait once the system has
"filled up". But a simulation almost always starts from an *empty-and-idle* state, which is not
representative: the first patients walk into an empty ED, the first trucks face no queue. Including those
early, atypically-low observations **biases the steady-state estimate downward**. This is the
**initial-transient** or **warm-up** problem. (Whether it applies at all depends on the regime — see
[02 — When to use it](./02_when-to-use.md).)

Critically, **more replications do not fix this.** Averaging 10,000 biased runs gives a very precise estimate
of the *wrong* number — a tight confidence interval centred off-target. Bias and variance are different
diseases; replications cure variance, not bias.

The standard remedy is **deletion / truncation (Welch's method)**: discard the first `w` time units (or the
first `w` events) of every run before computing the KPI, so the average is taken only over the steady-state
portion. Choosing `w`:

- Plot the **ensemble average** of the KPI over time across replications (Welch's moving-average plot) and
  cut where it visibly flattens.
- When in doubt, cut more rather than less — over-truncation costs a little variance; under-truncation leaves
  bias.
- For **terminating** simulations there *is* no steady state — the transient *is* the system. Do **not**
  apply warm-up deletion to terminating models; estimate the full-horizon KPI instead.

[S10](../../use-cases/10_s10_montecarlo.md) makes this concrete: it shows the naive single-run, no-warm-up
answer **beside** the replicated-with-warm-up answer so the learner sees the bias and the noise removed in
the same view. The warm-up cut length is an exposed preset on that scenario.

## Variance reduction: a tighter interval for the same compute

Because precision improves only as `1/√n`, halving a confidence interval naively costs **4× the runs**.
Variance-reduction techniques (VRTs) buy precision more cheaply by engineering the randomness. The two we
teach because they are simple and broadly safe:

- **Common Random Numbers (CRN)** — when *comparing two configurations* (e.g. 4 vs 5 treatment bays), feed
  both the *same* random streams so they face the same arrival pattern and service draws. The shared noise
  cancels in the difference, sharpening the estimate of *which is better* dramatically. CRN requires
  disciplined per-source stream alignment, which is exactly why an RNG with separable streams matters (see
  [04 — Tools](./04_tools.md)).
- **Antithetic Variates** — pair each run using draws `U` with a mirror run using `1−U`; negatively
  correlated pairs average to a lower-variance estimate of the mean.

Two warnings the curriculum states plainly: CRN helps *comparisons* but can mislead if streams aren't
properly synchronised across the variants, and antithetics can *backfire* (raise variance) if the response
isn't monotone in the inputs. VRTs are an optimisation, never a correctness requirement — a plain replicated
CI is always a valid baseline.

## Design of experiments: sweeping the parameter space

Often the question isn't "what's the KPI here?" but "how does the KPI move across the parameter space?" —
e.g. mean wait as a function of arrival multiplier × number of servers. A **design-of-experiments (DOE)**
sweep evaluates a grid (or a smarter design) of parameter points, each with its **own replicated CI**, so you
can see effects and interactions *with their uncertainty*, not as single noisy dots.

Practical guidance:

- Each grid cell is an independent replication batch → the whole sweep is **embarrassingly parallel** and
  maps directly onto [joblib (CPU)](../../frameworks/12_joblib.md) or a GPU batch.
- Keep **seeds reproducible and disjoint** across cells; record the seed plan in the manifest so the whole
  surface is regenerable.
- Plot effects with uncertainty (CI ribbons over a sweep line, or a response surface with error shown) —
  never a bare best-fit curve through noisy point estimates.
- A full factorial grid explodes combinatorially; for many factors prefer a fractional/Latin-hypercube design
  over a dense grid. (v1 ships small explicit grids; larger designs are a documented extension.)

The [S10](../../use-cases/10_s10_montecarlo.md) 3D cost/response surface (an optional Plotly exhibit) is
exactly a DOE sweep visualised — and a reminder that a surface of point estimates without shown uncertainty
is decoration, not evidence.

## KPIs this methodology produces

| KPI | What it reports | Honesty note |
|---|---|---|
| Sample mean `X̄` | point estimate of the expected KPI over `n` replications | never report alone — always with the interval below |
| CI half-width `t·s/√n` (or `z·s/√n`) | the precision of `X̄`; shrinks like `1/√n` | use Student-`t` unless `n` is large and the sampling dist is normal |
| Quantiles p90 / p95 (+ their CIs) | the tail operations actually care about | mandatory for heavy-tailed KPIs (saturated queues, response-time tails) |
| Warm-up cut `w` | events/time deleted to remove transient bias | only for steady-state regimes; **never** for terminating models |
| DOE response surface (per-cell CI) | how the KPI moves across parameters, with uncertainty | a surface of bare point estimates is decoration, not evidence |

## Next

- [04 — Tools](./04_tools.md) — the dedicated tool for each step and the per-backend RNG-stream recipes.
- [05 — Scenarios](./05_scenarios.md) — where this methodology is exercised, and the research references.
