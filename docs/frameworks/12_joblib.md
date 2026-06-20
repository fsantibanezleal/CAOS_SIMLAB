# 12 — joblib (CPU-parallel replication driver)

**joblib** is a lightweight, pure-Python toolkit for *embarrassingly-parallel* work: it fans a list of
independent function calls across CPU processes (or threads) with one line, transparently handling worker
creation, task dispatch, and **order-preserving** result collection. There is no GPU, no cluster, and no
boilerplate — you build a list of deferred calls with `delayed(...)`, hand it to a `Parallel(...)` executor,
and get the results back in submission order. That combination of "one line of parallelism" plus
"results stay in the order you asked for them" is exactly what a reproducible Monte-Carlo study needs.

In CAOS_SIMLAB joblib is the **v1 default driver for Monte-Carlo replications**. The honest deliverable of a
stochastic simulation is never one run — it is a *mean with a confidence interval* over many independent,
seeded replications, and that standard error only shrinks like `1/√n` (4× the runs to halve the interval).
joblib turns "run K independent seeded replications of a cheap model and collect their KPIs" into a few
lines that saturate every CPU core and finish in seconds, while staying **bit-reproducible across any worker
count** (one seed per task, RNG built inside the worker). It lives in the **precompute** lane — the offline
engine that generates committed replication sweeps and CI studies; the browser only ever replays the seeded
artifacts those sweeps produce. Reach for joblib whenever you have many independent CPU runs to aggregate
into an interval; reach for a GPU only above the crossover where heavy data-parallel arithmetic out-earns
transfer/launch overhead — and never put the discrete-event *model* itself on the GPU.

## Read in order

1. [01 — Installation](./12_joblib/01_installation.md) — exact pip line, pinned version, the precompute
   requirements lane, dependency notes, and the Windows `__main__`/picklability platform gotchas.
2. [02 — Usage](./12_joblib/02_usage.md) — the real `delayed` / `Parallel` API and concepts, the runnable
   example walked through step by step, and its **real captured output**.
3. [03 — Applying it](./12_joblib/03_applying.md) — how to formalize a "report an interval, not a point"
   problem, the replicate-then-aggregate pattern, which lab scenarios use joblib, the research trade-offs,
   and when to pick it vs SciPy / CuPy / Numba / a GPU.

## Runnable example

- [`./12_joblib/example.py`](./12_joblib/example.py) — CPU-parallel Monte-Carlo of a tiny M/M/c queue
  (the S10 pattern in miniature): K seeded replications fanned across cores, aggregated into a 95% CI, with
  three determinism checks. Run it with the repo interpreter from the repo root:
  `\.venv/Scripts/python.exe docs/frameworks/12_joblib/example.py`.

## Where it is used in the lab

- **S10 — Monte-Carlo Replication / CI Study (primary).** joblib is the default replication driver: it runs
  K seeded replications of the base models and turns them into a 95% CI compared against the closed-form
  Erlang-C reference. See the [scenario → tool map](../README.md#scenario--tool-map).
- **Every stochastic scenario's results-honesty beat** — the replicate-then-aggregate pattern (a single
  noisy run beside the replicated, CI-banded answer) is the house standard, notably for the S04 emergency
  department flagship.

## Related

- [Monte-Carlo & Replications](../problem-types/04_monte-carlo-replications.md) — the conceptual backbone
  (replications, CIs, warm-up bias, variance reduction, DOE, the honest GPU verdict).
- Companion frameworks: [SciPy stats](./13_scipy-stats.md) (turns the replications into the
  interval), [Numba](./14_numba.md) and [CuPy](./15_cupy.md) (the optional GPU exhibit above
  the crossover).
- [All frameworks](../README.md#by-framework-install--usage--applying--a-verified-examplepy).
