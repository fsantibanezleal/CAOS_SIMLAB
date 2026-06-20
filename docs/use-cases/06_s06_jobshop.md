# S06 — Job-Shop Scheduling (CP-SAT) · use-case node

A **job-shop** processes several jobs, each defined as an *ordered sequence of operations*; every operation
needs a *specific machine* for a *fixed time*. Each machine does one operation at a time, and within a job
operations run in order. The task is to assign start times to all operations so the **last job finishes as
early as possible** — i.e. minimize the **makespan** $C_{\max}$. Unlike the rest of SIMLAB, this is not
stochastic simulation but **pure combinatorial optimization**: what a solver *computes* (OR-Tools CP-SAT),
not what a simulator *samples*. The canonical instance is the **Fisher–Thompson `ft06`** benchmark (6 jobs ×
6 machines, proven optimal makespan 55); a family of seeded generated instances probes machine contention.

## Read in order

1. [01_assumptions.md](./06_s06_jobshop/01_assumptions.md) — the canonical instance, scope, and what is /
   isn't modeled (deterministic, no preemption, no setup/transport/due-dates).
2. [02_formalization.md](./06_s06_jobshop/02_formalization.md) — the math: sets, parameters, decision &
   state variables, the model class, objective, constraints, and KPIs (verified against the scenario code
   and the on-site Context block).
3. [03_solvers-applied.md](./06_s06_jobshop/03_solvers-applied.md) — which dedicated tool solves it and
   *how* (interval vars, `AddNoOverlap`, `AddMaxEquality`, `Minimize`), why CP-SAT, and the precompute lane.
4. [04_results-and-reading.md](./06_s06_jobshop/04_results-and-reading.md) — the ten variants, what the
   verified KPIs show, and how to read the Gantt animation.

## Links

- **Scenario code:** [`simlab/scenarios/s06_jobshop.py`](../../simlab/scenarios/s06_jobshop.py) — the
  single source of truth for the model.
- **Framework node (tool):** [OR-Tools](../frameworks/08_ortools.md) — the optimization engine; sub-solver
  **CP-SAT**. Deep dives: [installation](../frameworks/08_ortools/01_installation.md) ·
  [usage](../frameworks/08_ortools/02_usage.md) · [applying](../frameworks/08_ortools/03_applying.md) ·
  runnable [example.py](../frameworks/08_ortools/example.py) (CP-SAT `ft06`, makespan 55).
- **Problem-type guide:** [Optimization & Routing](../problem-types/03_optimization-routing.md) §4 (CP-SAT).
- **Pipeline:** [Precompute pipeline](../guides/01_precompute-pipeline.md) — local `.venv` → seeded trace →
  replay. OR-Tools is native code, so S06 is always precomputed.
