# 02 · Using `scipy.stats` for confidence intervals

`scipy.stats` is SciPy's statistics toolbox: probability distributions, descriptive statistics, and
hypothesis tests. CAOS_SIMLAB uses a tiny, sharp slice of it — **turning a sample of replications into a
confidence interval (CI)** — and nothing else. The rule the lab follows is: *don't hand-roll the interval
math; call the canonical, tested implementation.*

This page covers the key concepts and API, then walks the runnable example
[`example.py`](./example.py) step by step and shows its **real captured output**. For installation see
[`01_installation.md`](./01_installation.md); for how it slots into a scenario see
[`03_applying.md`](./03_applying.md).

---

## 1. Key concepts

A stochastic simulation run gives one noisy KPI. Run it `n` times with independent seeds and you have a
**sample** `X_1, …, X_n` of one random variable. The point estimate is the sample mean `X̄`; the honest
deliverable is a CI around it. A 95% CI is a statement about the *procedure*: over many repeated studies,
intervals built this way contain the true mean ~95% of the time. (It is **not** "95% probability the truth
is in this one interval" — teach the frequentist reading.)

Two intervals matter here:

- **Normal-approximation (z) CI** — `X̄ ± z_(1−α/2) · s/√n`. Justified by the Central Limit Theorem when
  `n` is reasonably large. Uses a fixed critical value `z ≈ 1.96` for 95%.
- **Student-t CI** — `X̄ ± t_(1−α/2, n−1) · s/√n`. Uses the t-distribution with `n−1` degrees of freedom.
  It is **wider** than the z-interval because it accounts for the fact that we *estimated* the variance
  `s²` from the same small sample. As `n → ∞`, `t → z` and the two intervals coincide (by `n ≈ 30` they
  are within ~2%).

In both, `s` is the **sample** standard deviation with the `n−1` divisor (`numpy.std(..., ddof=1)`), and
`s/√n` is the **standard error of the mean (SEM)**.

## 2. Key API

The whole job uses five entry points, all from `from scipy import stats`:

| Call | Returns | What it is |
|---|---|---|
| `stats.sem(sample)` | float | standard error of the mean = `s/√n` with `ddof=1` (the `n−1` divisor) |
| `stats.norm.ppf(q)` | float | inverse-CDF (quantile) of the standard normal; `ppf(0.975) ≈ 1.96` is the z critical value |
| `stats.t.ppf(q, df)` | float | inverse-CDF of Student-t with `df` degrees of freedom; the t critical value |
| `stats.norm.interval(conf, loc, scale)` | `(lo, hi)` | the normal CI in one call — `loc=mean`, `scale=sem` |
| `stats.t.interval(conf, df, loc, scale)` | `(lo, hi)` | the Student-t CI in one call — note the extra `df` argument |

The two `.interval(...)` calls are the convenient form; the `.ppf(...)` form (critical value × SEM, added
to/subtracted from the mean) is the explicit form. They give identical answers — the example asserts this.

Two idioms worth internalising:

```python
from scipy import stats

# normal-approx 95% CI for the mean of `sample`
mean = sample.mean()
sem  = stats.sem(sample)                                  # s/√n, ddof=1
lo, hi = stats.norm.interval(0.95, loc=mean, scale=sem)   # z-based

# Student-t 95% CI (the safe default) — df = n-1
df = sample.size - 1
lo, hi = stats.t.interval(0.95, df, loc=mean, scale=sem)  # t-based, wider for small n
```

Pitfalls:

- `stats.t.interval` needs `df` as a **positional** second argument; forgetting it (passing it where
  `loc` is expected) silently gives a wrong interval. `stats.norm.interval` has no `df`.
- `stats.sem` already uses `ddof=1`. Don't divide a population sd (`ddof=0`) by `√n` by hand — you'll
  under-state the SEM.
- These functions are pure and deterministic. They never reseed or draw randomness; reproducibility is
  entirely the caller's seeded sampler.

## 3. The runnable example, step by step

The script [`example.py`](./example.py) is self-contained and seeded. Its structure:

- **`mmc_mean_wait(lam, mu, c, n, rng)`** — one replication: the mean time-in-queue of an M/M/c FCFS queue
  via the earliest-free-server method. It mirrors `simlab/scenarios/s10_montecarlo.py::mmc_mean_wait`
  exactly and takes a *pre-built* `Generator`, so each replication owns an independent, seeded RNG stream.
- **`sample_kpis(...)`** — draws `k_reps` i.i.d. per-run KPIs with the seed plan `base_seed + r`, the same
  scheme S10 uses (`make_rng(seed + r)`). This is the *sample* we then summarise.
- **`normal_ci(sample, confidence)`** — the z-interval, computed two ways and `assert`ed equal:
  (A) one call `stats.norm.interval(conf, loc=mean, scale=sem)`, and
  (B) by hand `mean ± stats.norm.ppf(1−α/2) · sem`.
- **`student_t_ci(sample, confidence)`** — the t-interval, again two ways and `assert`ed equal, with
  `df = n−1`. As `n → ∞` this collapses onto `normal_ci`.
- **`erlang_c_wq(lam, mu, c)`** — the closed-form Erlang-C steady-state mean wait, used as a *reference
  target* to check the small-sample interval brackets a known truth.
- **`main()`** — prints the critical values, runs the same study at `K ∈ {8, 30, 400}` (so you can watch
  the `t-width / z-width` ratio fall toward `1.000`), spells out the small-`K=8` case, and confirms
  determinism.

Run it from the repo root (`cwd = CAOS_SIMLAB`):

```bash
.venv/Scripts/python.exe docs/frameworks/13_scipy-stats/example.py
```

### Walk-through of the output

- **Critical values.** `z = norm.ppf(0.975)` is a constant `1.9600`. `t = t.ppf(0.975, df)` starts large
  for small `df` (`2.3646` at `df=7`) and falls toward `z` as `df` grows (`1.9659` at `df=399`). That gap
  *is* the small-sample penalty.
- **The table.** For each `K`, the z-CI and t-CI are printed side by side. At `K=8` the t-interval is
  `1.206×` wider than the z-interval; at `K=30` it is `1.044×`; at `K=400` it is `1.003×`. Same data, same
  SEM — only the critical value differs, and its effect vanishes as `K` grows.
- **The K=8 block.** With only 8 replications, the z-interval (width `0.3237`) is *too narrow*: it pretends
  we know the variance. The t-interval (width `0.3905`) is the honest one. The Erlang-C theoretical mean
  `0.4444` falls inside the t-interval, as it should at this moderate load.
- **Determinism.** The final line confirms the sample is a pure function of the seed.

## 4. Verified output

Captured by actually running the command above against the project `.venv`
(Python 3.13.0, scipy 1.18.0, numpy 2.4.6), re-run from this folder. This is the real stdout, not a
reconstruction:

```text
=== scipy.stats confidence intervals (S10 statistics layer) ===
model: M/M/c  lam=2.0 mu=1.0 c=3  customers/run n=600  rho=0.667
reference: Erlang-C steady-state Wq = 0.4444
confidence = 95%  (alpha = 0.05)

critical values from scipy.stats:
  z = norm.ppf(0.975)            = 1.9600   (n-independent)
  t = t.ppf(0.975, df=  7)       = 2.3646   (df = n-1, shrinks toward z)
  t = t.ppf(0.975, df= 29)       = 2.0452   (df = n-1, shrinks toward z)
  t = t.ppf(0.975, df=399)       = 1.9659   (df = n-1, shrinks toward z)

K (reps) |    mean |     sem |        normal (z) 95% CI |         Student-t 95% CI | t-width / z-width
--------------------------------------------------------------------------------------------------------
       8 |  0.5042 |  0.0826 | [ 0.3424,  0.6661] | [ 0.3090,  0.6995] |  1.206x
      30 |  0.4826 |  0.0357 | [ 0.4127,  0.5526] | [ 0.4096,  0.5557] |  1.044x
     400 |  0.4346 |  0.0092 | [ 0.4167,  0.4526] | [ 0.4166,  0.4527] |  1.003x

small sample (K=8) - why we default to Student-t:
  sample (per-run Wq): [0.4807 0.3031 0.3213 0.9534 0.7310 0.5561 0.3330 0.3554]
  normal (z)  CI: [0.3424, 0.6661]  width 0.3237  (too narrow: assumes known variance)
  Student-t   CI: [0.3090, 0.6995]  width 0.3905  (wider, honest: variance estimated)
  Erlang-C theory 0.4444 inside t-CI? True

determinism: same base_seed reproduces the sample exactly? True
```

The two `assert` statements inside `normal_ci` / `student_t_ci` (that the one-call `.interval` form equals
the explicit `.ppf × sem` form) pass silently — the script exits 0, confirming both routes agree.
