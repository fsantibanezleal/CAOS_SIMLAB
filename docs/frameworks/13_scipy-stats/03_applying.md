# 03 · Applying `scipy.stats` to a real problem

`scipy.stats` is the **statistics layer** of a Monte-Carlo study, not the engine that runs the
simulations. The division of labour in CAOS_SIMLAB is deliberate:

- **NumPy** (and the seeded `Generator`) draws the randomness for one replication.
- **joblib** (CPU) — and optionally **CuPy / Numba CUDA** (GPU) — fan thousands of independent,
  seeded replications across cores/threads.
- **`scipy.stats`** reduces that resulting sample to an honest **confidence interval**.

This is the standard *replicate-then-summarise* pattern: generate i.i.d. KPI observations, then estimate
the mean **with its uncertainty**. SciPy only does the last step, but it is the step that decides whether
the headline number is defensible or a precise lie.

For installation see [`01_installation.md`](./01_installation.md); for the API and walk-through see
[`02_usage.md`](./02_usage.md); the node overview is the [landing page](../13_scipy-stats.md).

## 1. Formalizing the problem

You have a simulation that is a **pure function of `(params, seed)`** returning one scalar KPI `X` (mean
wait, utilisation, makespan, a response-time tail). One run is a single draw of the random variable `X`;
you want to report the population mean `E[X]` *with a defensible uncertainty band*. Formalize it as:

- **Estimand:** the population mean `μ = E[X]` of the KPI under fixed parameters.
- **Sample:** `K` i.i.d. observations `X_1,…,X_K`, one per replication, each from an independent
  non-overlapping seed stream.
- **Estimator + uncertainty:** the sample mean `X̄` and a `(1−α)` confidence interval
  `X̄ ± c · s/√K`, where `s` is the sample sd (`ddof=1`), `s/√K` is the SEM, and `c` is the critical value
  (`t_{1−α/2, K−1}` for Student-t, or `z_{1−α/2}` for the normal approximation).

That is exactly the shape `scipy.stats` solves with `stats.sem`, `stats.t.interval` and
`stats.norm.interval`. The decision variable is *which critical value* — see §4.

## 2. The pattern: replicate → summarise

```
seeded sampler (NumPy)  ──►  many replications (joblib / CuPy)  ──►  CI (scipy.stats)
   one noisy KPI               K i.i.d. KPI observations              X̄ ± t·s/√K
```

1. Define the replication as a pure function of `(params, seed)` returning one KPI.
2. Run `K` replications with **independent, non-overlapping** seeds. S10 fans them with joblib
   (`delayed(mmc_mean_wait)(..., int(seed) + r)` for `r` in `range(reps)`); each replication builds its own
   stream inside the worker with `np.random.default_rng(int(seed) + r)`, so the result is identical on any
   worker count.
3. Pass the resulting array to `scipy.stats`: `stats.sem(sample)` for the standard error, then
   `stats.t.interval(0.95, K-1, loc=mean, scale=sem)` for the interval.

In CAOS_SIMLAB this runs **live in the browser**: `scipy` is in `LIVE_WHEELS` and the Pyodide worker loads
it, so S10 computes its CIs in-browser with `scipy.stats` (the same study is also committed as a seed-42
trace for the deterministic gallery). See [`01_installation.md`](./01_installation.md).

## 3. Which scenario uses it

| Scenario | Use of `scipy.stats` |
|---|---|
| **S10 — Monte-Carlo Replication / CI Study** | the confidence intervals. S10 runs `K` seeded replications of the S01 M/M/c queue, then reports the running mean and a 95% CI. The CI half-width is the deliverable; `scipy.stats` is the canonical way to compute it. |

S10 is the methodology backbone scenario — see
[`docs/problem-types/04_monte-carlo-replications.md`](../../problem-types/04_monte-carlo-replications.md) and the
[scenario map](../../README.md). It is the only scenario whose *primary output* is a confidence interval,
hence the only one that pins `scipy`. (Other scenarios *consume* the lesson — any KPI in the lab could be
wrapped in a CI — but S10 is where it is taught and exercised.)

A note on the shipped S10 code: it currently computes the CI inline with the **normal approximation**
(`1.96 · s/√k`) because S10's variants run hundreds of replications, where z and t agree to within ~2% (at
`K=200`, `df=199`, `t.ppf(0.975)=1.972` vs `z=1.960`). `scipy.stats` is the reference implementation the
methodology page points to, and the small-`K` regime — where the choice actually matters and you should
prefer Student-t — is exactly what [`example.py`](./example.py) demonstrates.

## 4. Choosing the interval: z vs t

| Situation | Pick | Why |
|---|---|---|
| Small `K` (rule of thumb `K < 30`), variance estimated from the sample | **Student-t** (`stats.t.interval`) | the t-critical value is larger, widening the interval to admit we don't know the variance — it never under-covers |
| Large `K` and a roughly normal sampling distribution | normal-approx (`stats.norm.interval`) is fine | z and t are within ~2% by `K ≈ 30`; the cheaper constant `1.96` is acceptable |
| **Default when unsure** | **Student-t** | it costs nothing extra and converges to z anyway; the lab's honest default is "use t unless you have a genuinely large `K`" |

## 5. Honest trade-offs (grounded in the research)

The research dimensions for this lab — *07 GPU-acceleration* and the *monte-carlo-replications* problem
type — make several points that constrain how `scipy.stats` should be applied:

- **A CI captures sampling error only, never model error.** The interval says how precisely you estimated
  *this model's* mean; it says nothing about whether the model is right. A tight CI around a wrong arrival
  process is a precise lie. SciPy can't detect this — the curriculum insists you state it.
- **Replications cure variance, not bias.** The initial-transient (warm-up) bias is a *different disease*.
  At high load (ρ ≈ 0.9, ~600 customers/run) S10 shows the CI converging tightly around a value ~16% below
  the Erlang-C theory: the band is narrow and **excludes** the true value. A CI computed by `scipy.stats`
  on biased samples is still biased — narrowness is not accuracy. (See the S10 audit and fix notes.)
- **The mean can be the wrong target.** For heavy-tailed KPIs (queue waits near saturation, response-time
  tails) report quantiles (p90/p95) and *their* intervals too. `scipy.stats` supports distribution-aware
  estimators, but the lab's default CI is for the *mean* — know when that's not what operations care about.
- **`1/√K` is a hard wall.** Halving a CI costs 4× the replications. This is why the *generation* step is
  parallelised (joblib, then GPU); `scipy.stats` is microseconds and never the bottleneck. Per research
  07, GPUs help by running **thousands of replications at once** (the highest-ROI GPU use in this product),
  not by speeding up the summary — the summary is always cheap CPU SciPy.

## 6. When to pick `scipy.stats` vs alternatives

- **vs hand-rolled formula math.** Don't. Typing `1.96` and a `t`-table value invites copy errors and
  ddof mistakes. `scipy.stats` is the canonical, tested implementation; the lab rule is to call it.
- **vs `statsmodels`.** `statsmodels` is excellent for regression and richer inference, but it is a much
  larger dependency for what is, here, three function calls. `scipy` is already pinned directly
  (`scipy==1.18.0`) and loaded into the live worker, and is sufficient for means and standard CIs.
- **vs bootstrap (`scipy.stats.bootstrap`).** When the sampling distribution is *not* approximately
  normal and you want a distribution-free interval (e.g. for a quantile or a ratio), `scipy.stats.bootstrap`
  is the right tool — and it lives in the same package, so adopting it costs no new dependency. For the
  *mean* of many replications, the CLT-backed t-interval is simpler and standard; reach for the bootstrap
  for awkward statistics or small, clearly non-normal samples.
- **Deprecated tools — do not use.** This lab uses only real, maintained tools. The deprecated DES/ABM
  packages **AgentPy** and **desmod** are mentioned in the research only as *deprecated — don't use*; they
  are not part of any scenario and are unrelated to the statistics layer. `scipy.stats` has no deprecated
  competitor here — it is the standard choice.
