# 01 — What it is: replications as i.i.d. samples

> Part of [Monte-Carlo replications & the simulation-methodology curriculum](../04_monte-carlo-replications.md).
> Next: [02 — When to use it](./02_when-to-use.md) · [03 — Methods & KPIs](./03_methods-and-kpis.md).

A Monte-Carlo replication study treats a stochastic simulation as a **sampler** and reports an estimate
*with* its uncertainty, instead of mistaking one run for "the answer". This page covers the three ideas the
rest of the curriculum builds on: why a single run is noisy, what a replication actually is, and why the
replications must come from genuinely independent RNG streams.

## Why a single run is noisy

Every CAOS_SIMLAB simulation is a pure function of `(params, seed)`: the same parameters and the same seed
always produce the same trace (this is the [determinism contract](../../architecture/02_determinism-and-trace.md)
that makes replay = truth). Change the seed and you change the random draws — interarrival times, service
times, routing coin-flips — and therefore you change the output KPI (mean wait, utilisation, makespan,
response-time tail). So a KPI from one run is a **single observation of a random variable**, not "the
answer".

Concretely, run the [S01 M/M/c queue](../../use-cases/01_s01_queue.md) once near saturation (utilisation
ρ → 1) and the reported mean wait can swing by a factor of two or more purely from seed luck, because the
queue spends most of its mass in rare long busy periods. Reporting that one number as "the mean wait" is the
single most common sin in applied simulation, and the whole point of this curriculum is to refuse it.

The fix is **statistical, not computational**: treat the simulation as a sampler, take independent
replications, and report an estimate with its uncertainty.

## Replications: independent runs as i.i.d. samples

A **replication** is one full simulation run with an independent random-number stream. Run the model `n`
times with `n` distinct, non-overlapping seeds and you obtain `n` i.i.d. observations `X_1, …, X_n` of the
output KPI. Their sample mean `X̄` estimates the true expected KPI; their spread tells you how much you can
trust `X̄`.

Two non-negotiable rules:

- **Streams must be independent.** Reusing the same seed, or seeds whose streams overlap, secretly
  correlates your "independent" runs and collapses your real sample size. Use a well-specified RNG with
  guaranteed stream separation (see [RNG-stream discipline](#rng-streams-the-foundation-of-trustworthy-replications)
  below, and the per-backend recipes in [04 — Tools](./04_tools.md)).
- **More replications shrink the interval, not the noise.** The standard error of the mean falls like
  `1/√n`. Going from 10 to 1000 replications narrows the confidence interval by ~10×; it does **not** make
  any single run less variable. This `√n` wall is exactly why batching thousands of cheap replications is
  attractive, and exactly where parallel hardware (CPU cores, then GPU threads) earns its keep — see
  [02 — When to use it](./02_when-to-use.md) for the CPU-vs-GPU decision.

In CAOS_SIMLAB the replication driver for v1 is [**joblib**](../../frameworks/12_joblib.md) (CPU-parallel,
the default), with an **optional GPU exhibit** ([CuPy](../../frameworks/15_cupy.md) /
[Numba CUDA](../../frameworks/14_numba.md)) for the embarrassingly-parallel case.

## RNG streams: the foundation of trustworthy replications

Everything above assumes the `n` replications are *genuinely independent*. That is an RNG property, not an
accident. The short version (per-backend recipes live in [04 — Tools](./04_tools.md)):

- **CPU (joblib / SimPy / Ciw / Mesa):** give each replication a distinct seed and use NumPy's modern
  `SeedSequence` / `default_rng` spawning so the per-run streams are provably non-overlapping. Pass a seed
  per worker; never let parallel workers share or re-derive the same global RNG.
- **GPU (Numba CUDA):** each GPU thread owns its own counter-based stream via
  `numba.cuda.random.create_xoroshiro128p_states` + `xoroshiro128p_uniform_float32`. The `xoroshiro128p`
  generator has period `2^128 − 1` and passes the BigCrush battery, so tens of thousands of per-thread
  streams stay independent — this is precisely what makes "one replication per GPU thread" valid.
- **GPU (CuPy):** array RNG is cuRAND-backed; seed the generator and draw whole replication batches as array
  columns.

Determinism is also a **replay** requirement here: GPU thread-scheduling is non-deterministic, so for any
trace we replay frame-by-frame we **fix the per-replication seed and snapshot deterministic state**, so the
committed artifact is reproducible regardless of scheduling. (See the architecture's "replay = truth"
contract in [determinism & trace](../../architecture/02_determinism-and-trace.md).)

## Next

- [02 — When to use it](./02_when-to-use.md) — regimes (terminating vs steady-state), and CPU vs GPU.
- [03 — Methods & KPIs](./03_methods-and-kpis.md) — confidence intervals, warm-up bias, variance reduction.
