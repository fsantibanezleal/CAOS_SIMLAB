# S06 — Formalization (sets, variables, model, objective, constraints, KPIs)

> Use-case node: [06_s06_jobshop](../06_s06_jobshop.md) · prev:
> [01_assumptions.md](./01_assumptions.md) · next: [03_solvers-applied.md](./03_solvers-applied.md)

This is the **verified** formalization, kept consistent with the scenario code
([`simlab/scenarios/s06_jobshop.py`](../../../simlab/scenarios/s06_jobshop.py)) and the on-site Context
block (`web/src/pages/Experiments.tsx`, `S06Desc`). Nothing here is invented.

## Model class

A **constraint-programming** model of the classic **disjunctive job-shop**, solved by **CP-SAT** (constraint
programming over a SAT/CP engine). It is **deterministic combinatorial optimization** — not a stochastic
simulation. The hallmark is the per-machine **disjunctive (no-overlap)** constraint plus **precedence**
within each job, minimizing the **makespan**.

## Sets

| Symbol | Meaning |
|---|---|
| $j = 1,\dots,n$ | **Jobs**. Each job is an ordered list of operations. |
| $(j,k)$, $k = 0,\dots,m_j-1$ | The $k$-th **operation** of job $j$ (0-indexed in the code). |
| $M = \{1,\dots,m\}$ | **Machines** (in `ft06`, 6 jobs × 6 machines). |

## Parameters (per operation)

| Symbol | Meaning |
|---|---|
| $\mu(j,k) \in M$ | the **machine required** by operation $(j,k)$. |
| $d_{j,k}$ | the **fixed integer duration** of operation $(j,k)$. In generated instances $d \in \{2,\dots,9\}$, with the machine order seed-shuffled (a permutation of all machines). For `ft06`, durations are the literal benchmark values. |
| $H = \sum_{j,k} d_{j,k}$ | the **horizon**: the sum of all durations, a trivial upper bound that bounds every time variable. |

## Decision & state variables

| Symbol | Domain | Meaning |
|---|---|---|
| $s_{j,k}$ | $[0, H]$ integer | **start time** of operation $(j,k)$ — the genuine decision variable. |
| $e_{j,k}$ | $[0, H]$ integer | **end time**, tied to the start by the interval: $e_{j,k} = s_{j,k} + d_{j,k}$. |
| interval $(j,k)$ | $[s_{j,k},\, s_{j,k}+d_{j,k})$ | an **interval variable** binding start, duration, end into one object the solver reasons about. |
| $C_{\max}$ | $[0, H]$ integer | the **makespan** variable — the objective. |

In the code these are `model.new_int_var(0, horizon, …)` for `s`/`e`, `model.new_interval_var(s, d, e, …)`
for the interval, and a `makespan` int var.

## Objective

Minimize the makespan — the finish time of the latest-completing job:

$$ C_{\max} = \max_{j}\, e_{j,\,m_j-1}, \qquad \min\; C_{\max}. $$

In the code: `model.add_max_equality(makespan, [ends of each job's last op])` then `model.minimize(makespan)`.

## Constraints

**1. Precedence (within a job).** Operation $k$ cannot start before operation $k-1$ finishes:

$$ s_{j,k} \;\ge\; e_{j,k-1} \;=\; s_{j,k-1} + d_{j,k-1}, \qquad k \ge 1. $$

In the code: `model.add(s >= ends[(j, k-1)])` for `k > 0`.

**2. Disjunctive / no-overlap (per machine).** A machine does one operation at a time; its assigned
intervals never overlap. This is a single `AddNoOverlap` over the set of intervals on machine $m$,
equivalent to the disjunction for every pair $(j,k),(j',k')$ sharing that machine:

$$ \bigl(e_{j,k} \le s_{j',k'}\bigr) \;\lor\; \bigl(e_{j',k'} \le s_{j,k}\bigr). $$

In the code: intervals are collected into `machine_intervals[m]` and `model.add_no_overlap(...)` is added
per machine. (The interval variable enforces $e = s + d$ implicitly.)

**3. Domain bounds.** All time variables lie in $[0, H]$ with $H = \sum_{j,k} d_{j,k}$.

## Dynamics

There are **no dynamics** in the stochastic sense — no events, no clock advancing under randomness. The
"state" is the static assignment of start times the solver returns; the Gantt animation merely *replays* a
left-to-right time sweep over that fixed optimal schedule (it is a visualization device, not a simulation).

## Solver settings (committed for reproducibility)

- `num_search_workers = 1`, `random_seed = 42`, `max_time_in_seconds = 10.0`.
- Status reported as `OPTIMAL` or `FEASIBLE` (or `UNKNOWN`). For `ft06` the proven optimum is $C_{\max}=55$;
  in the committed run all ten variants return **`OPTIMAL`**.

## KPIs (exactly as the trace records them)

The trace's `kpis` block carries:

| KPI | Definition |
|---|---|
| `makespan` | $C_{\max}$ — the solved makespan. |
| `optimal` | boolean: did the solver prove optimality (`status == OPTIMAL`)? |
| `n_jobs` | number of jobs. |
| `n_machines` | number of machines ($1 + \max$ machine index seen). |
| `n_operations` | total operations $= \sum_j m_j$. |
| `utilization` | $\dfrac{\sum_{j,k} d_{j,k}}{C_{\max}\cdot m}$ — fraction of the Gantt area actually occupied (rounded to 3 dp; $0$ if $C_{\max}=0$). |

The trace also stores `machines` (`[{id, label "M{i+1}"}]`), `jobs`, the per-op list `ops`
(`{job, machine, start, dur}`), and `makespan`. The viz binding is a **Gantt** renderer (`2d`).
See [04_results-and-reading.md](./04_results-and-reading.md) for the per-variant numbers.
