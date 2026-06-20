# 10 — S10 · Monte-Carlo Replication / CI Study (joblib + SciPy)

A stochastic simulation is a *random experiment*, not a calculation: a single run of the M/M/c queue (the
same M/M/c model class as S01 — a fast NumPy estimator, not S01's SimPy engine) returns a noisy mean
wait-in-queue `Wq`, and two seeds give two different answers. The
output-analysis question this scenario makes interactive is **how many independent, seeded replications do
I need — and at what precision — for my estimator to match the closed-form Erlang-C answer?** S10 runs `N`
seeded replications, plots the **running mean** and its **95% confidence interval** as replications
accumulate, and contrasts them against the Erlang-C `Wq`. It teaches two lessons at once: the CI narrows
like `1/√n` (precision), and at high load (`ρ≈0.9`, ~600 customers/run) a start-up transient **bias**
pulls the whole CI below Erlang-C — so a tight CI can be a *precise* estimate of a *biased* number. The
replications are fanned across CPU cores by **joblib** and reduced to an interval by **`scipy.stats`** —
the lab uses the very tools it documents.

## Read in order

1. [01 — Assumptions & scope](./10_s10_montecarlo/01_assumptions.md) — the canonical instance, what is and
   is not modeled, and the honesty boundary (no warm-up discard, normal-approx CI, live-capable).
2. [02 — Formalization](./10_s10_montecarlo/02_formalization.md) — sets, parameters, the per-replication
   random variable, the estimator state, the M/M/c model class, the running-mean / running-CI math, the
   Erlang-C oracle, and the KPIs — pulled verified from the scenario Context and the code.
3. [03 — Solvers applied](./10_s10_montecarlo/03_solvers-applied.md) — how **joblib** (`Parallel` /
   `delayed`, `threading` backend) and **`scipy.stats`** (`norm.ppf` / `sem` / `norm.interval`) solve it,
   why these tools, and the live-vs-precompute lane.
4. [04 — Results & reading](./10_s10_montecarlo/04_results-and-reading.md) — the ten variants (replication
   sweep + load sweep + the finite-run-bias cases), what the KPIs show, and how to read the chart.

## Related

- **Scenario code:** [`s10_montecarlo.py`](../../simlab/scenarios/s10_montecarlo.py) (the verified source
  this node documents) · base model + Erlang-C oracle in
  [`s01_queue.py`](../../simlab/scenarios/s01_queue.py) (`erlang_c_mmc`).
- **Frameworks (install · usage · applying · runnable example):**
  [12 — joblib](../frameworks/12_joblib.md) (the CPU replication driver) ·
  [13 — `scipy.stats`](../frameworks/13_scipy-stats.md) (the confidence-interval layer) ·
  optional GPU lane above the crossover: [14 — Numba](../frameworks/14_numba.md) ·
  [15 — CuPy](../frameworks/15_cupy.md).
- **Methodology backbone:**
  [Monte-Carlo & Replications](../problem-types/04_monte-carlo-replications.md) (why one run is noisy, CIs,
  warm-up bias, variance reduction, the honest GPU verdict).
- **Lab map:** [docs/README.md — Scenario → tool map](../README.md#scenario--tool-map) ·
  [architecture.md](../architecture.md) (the deterministic-replay two-lane design).
