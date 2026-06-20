# Monte-Carlo replications & the simulation-methodology curriculum

A stochastic simulation is a random experiment, not a calculation. One run answers nothing on its own — it
answers *"what happened on this one seed?"*. This node is the **methodological backbone** of CAOS_SIMLAB:
why a single run is noisy, how to turn many runs into a defensible estimate with an honest confidence
interval, how to deal with the warm-up bias that quietly corrupts steady-state estimates, how to make each
run cheaper to trust (variance reduction), and how to sweep a parameter space without lying to yourself.

It is also where we give the **honest GPU verdict**: GPUs accelerate *thousands of independent replications*
and *large-N agent models* — they do **not** accelerate a small discrete-event loop, where they are
measurably *slower*. That asymmetry is itself a lesson, and we teach it rather than hide it.

This node is the conceptual reference. The runnable per-tool guides live under
[`docs/frameworks/`](../frameworks.md) and the worked scenario is
[S10 — Monte-Carlo Replication / CI Study](../use-cases/10_s10_montecarlo.md), which runs replications over
the [S01 bank-queue](../use-cases/01_s01_queue.md) and [S04 emergency-department](../use-cases/04_s04_ed.md)
base models.

## Read in order

1. [01 — What it is](./04_monte-carlo-replications/01_what-it-is.md) — why a single run is noisy, what a
   replication is, why streams must be independent, and the `1/√n` precision wall that motivates everything
   downstream.
2. [02 — When to use it](./04_monte-carlo-replications/02_when-to-use.md) — terminating vs steady-state
   regimes, when warm-up deletion applies (and when it is *wrong*), and how to decide between CPU and GPU
   for the replication batch — including the honest GPU verdict and its decision table.
3. [03 — Methods & KPIs](./04_monte-carlo-replications/03_methods-and-kpis.md) — confidence intervals (z vs
   Student-t, how to compute them honestly), the initial-transient (warm-up) bias and Welch's deletion,
   variance reduction (CRN, antithetics), and design-of-experiments sweeps.
4. [04 — Tools](./04_monte-carlo-replications/04_tools.md) — which dedicated tool for which job (joblib,
   SciPy, CuPy, Numba CUDA, Taichi, FLAME GPU 2), RNG-stream discipline per backend, the deprecated tools we
   refuse, and what ships in v1.
5. [05 — Scenarios](./04_monte-carlo-replications/05_scenarios.md) — where this methodology is exercised in
   the lab (S10 as the dedicated exhibit, the results-honesty beat across every stochastic scenario), and
   the research references behind the numbers.

## Related

- **Framework guides (install · usage · applying · runnable example):**
  [12 — joblib](../frameworks/12_joblib.md) (the v1 CPU replication driver) ·
  [13 — `scipy.stats`](../frameworks/13_scipy-stats.md) (the confidence-interval layer) ·
  [14 — Numba](../frameworks/14_numba.md) · [15 — CuPy](../frameworks/15_cupy.md) (the optional GPU exhibit
  above the crossover) · [16 — Taichi](../frameworks/16_taichi.md) (niche grid/CA GPU) ·
  [18 — GPU-ABM chapter](../frameworks/18_gpu-abm-chapter.md) (FLAME GPU 2, reference only).
- **Base models being replicated:** [SimPy](../frameworks/01_simpy.md) (+
  [Ciw](../frameworks/02_ciw.md) for M/M/c analytics) — the S01 / S04 models S10 layers on top of.
- **Sibling problem types:** [Discrete-Event Simulation](./01_discrete-event-simulation.md) ·
  [Agent-Based Modeling](./02_agent-based-modeling.md) · [Optimization & Routing](./03_optimization-routing.md).
- **Lab map & architecture:** [docs README](../README.md) ·
  [determinism & trace](../architecture/02_determinism-and-trace.md) (the replay = truth contract).

---

*This node is part of the CAOS_SIMLAB teaching repo. It is conceptual reference; the runnable code lives in
the [framework guides](../frameworks.md) and the [S10 scenario](../use-cases/10_s10_montecarlo.md).*
