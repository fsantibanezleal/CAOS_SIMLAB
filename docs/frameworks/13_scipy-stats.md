# 13 · `scipy.stats` — confidence intervals for Monte-Carlo studies

`scipy.stats` is SciPy's statistics toolbox (probability distributions, descriptive statistics,
hypothesis tests). CAOS_SIMLAB uses a deliberately tiny, sharp slice of it: **turning a sample of
Monte-Carlo replications into an honest confidence interval (CI)** — the normal-approximation (z)
interval and the Student-t interval — and nothing more. It is the *statistics layer* of a replication
study, not the engine that runs the simulations: NumPy's seeded `Generator` draws the randomness for one
replication, [joblib](./12_joblib.md) (CPU) or the GPU lane fan out thousands of seeded replications, and
`scipy.stats` reduces the resulting sample to `X̄ ± t·s/√K`. That last step is small in code but it is the
step that decides whether the headline number is defensible or a precise lie.

Reach for it whenever a stochastic KPI needs a **mean with its uncertainty**, and especially when the
replication count `K` is small — the Student-t interval is the lab's honest default because it widens to
admit that we *estimated* the variance from the same sample, and it converges to the z-interval as `K`
grows. In CAOS_SIMLAB the CI math runs **live in the browser**: `scipy` is in `LIVE_WHEELS` and the Pyodide
worker loads it (`loadPackage("scipy")`), so the shipped **S10 — Monte-Carlo Replication / CI Study** computes
its confidence intervals in-browser via `scipy.stats` (the same study is also precomputed and committed as a
seed-42 trace for the deterministic gallery). S10's methodology is the conceptual backbone of the whole lab.
It pairs naturally with the parallel-replication tools — see [Related frameworks](#related-frameworks) below.

## Read in order

1. [Installation](./13_scipy-stats/01_installation.md) — exact pip line, pinned version, which
   requirements lane, dependencies, platform/CUDA/determinism notes.
2. [Usage](./13_scipy-stats/02_usage.md) — the concepts (z vs t, SEM, ddof), the five-call API, the
   runnable example walked step by step, and its real captured output.
3. [Applying](./13_scipy-stats/03_applying.md) — how to formalize a "mean with uncertainty" problem and
   solve it with this tool, which lab scenarios use it, the research trade-offs, and when to pick it over
   `statsmodels` / bootstrap / hand-rolled math.

## Runnable example

- [`example.py`](./13_scipy-stats/example.py) — self-contained, seeded; computes z and t 95% CIs over a
  small M/M/c queue at `K ∈ {8, 30, 400}` and shows the two intervals converging. Run it from the repo
  root (`cwd = CAOS_SIMLAB`):

  ```bash
  .venv/Scripts/python.exe docs/frameworks/13_scipy-stats/example.py
  ```

## Where the lab uses it

- Scenario **S10 — Monte-Carlo Replication / CI Study** (see the [scenario map](../README.md)) — the only
  scenario whose primary output is a confidence interval, hence the only one that pins `scipy`.
- Problem type: [Monte-Carlo replications & the simulation-methodology curriculum](../problem-types/04_monte-carlo-replications.md)
  — why a single run is noisy, the warm-up bias, variance reduction, and the honest GPU verdict.

## Related frameworks

- **joblib** ([`./12_joblib.md`](./12_joblib.md)) — fans the replications across CPU cores (the *generation*
  step `scipy.stats` summarises).
- **CuPy** ([`./15_cupy.md`](./15_cupy.md)) / **Numba** ([`./14_numba.md`](./14_numba.md)) — the GPU lane that
  produces thousands of replications at once when the `1/√K` wall bites; the CI summary on top is still
  cheap CPU SciPy.
