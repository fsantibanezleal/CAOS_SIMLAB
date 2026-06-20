# S06 — Canonical instance, scope & assumptions

> Use-case node: [06_s06_jobshop](../06_s06_jobshop.md) · next: [02_formalization.md](./02_formalization.md)
> · scenario code: [`simlab/scenarios/s06_jobshop.py`](../../../simlab/scenarios/s06_jobshop.py)

## What a job-shop is

A **job-shop** processes several **jobs**. Each job is an *ordered sequence of operations*; every operation
requires one **specific machine** for a **fixed duration**. Two hard facts make it combinatorial:

- **Precedence inside a job** — within a job, operation $k$ cannot start before operation $k-1$ finishes.
- **A machine does one operation at a time** — operations assigned to the same machine cannot overlap (the
  classic *disjunctive* machine constraint).

The decision is: *at what time does each operation start?* The goal is to make the **last job finish as
early as possible** — minimize the **makespan** $C_{\max}$ (the finish time of the latest operation).

This is the lab's **pure-optimization anchor**: a solver computes the *best* schedule, in contrast to the
simulators elsewhere in SIMLAB that *sample* a system under random events. There is no stochasticity here.

## The canonical instance: Fisher–Thompson `ft06`

The reference case is the **Fisher & Thompson (1963) `ft06`** benchmark from the OR-Library — **6 jobs × 6
machines**, with a **proven optimal makespan of 55**. It is the one real external dataset in this scenario
(cited; everything else is labeled synthetic). It is hard-coded in the scenario as `FT06`: per job, an
ordered list of `(machine, duration)` pairs. For example job 0 is
`[(2,1),(0,3),(1,6),(3,7),(5,3),(4,6)]` — machine 2 for 1 time unit, then machine 0 for 3, and so on.

The scenario also generates instances on demand (`instance = 0`): for each job it shuffles the machine
order under a per-variant seed and draws each duration uniformly from $\{2,\dots,9\}$. **Every generated
job routes through *every* machine** (the shuffled order is a permutation of all machines), which has a
consequence used in the results page — total work differs from instance to instance, so makespans are not
comparable across variants (see [04_results-and-reading.md](./04_results-and-reading.md)).

## Determinism (the reproducibility contract)

The model has **no randomness**; durations are fixed integers. The only "randomness" is in *constructing*
generated instances, and it is fully seeded:

- Each **variant carries its own instance seed** (e.g. `ft06`=0, `j3m3`=11, `j4m3`=12, … `j4m6`=19), so the
  instance is reproducible.
- **CP-SAT itself is pinned to determinism**: a single search worker (`num_search_workers = 1`), a fixed
  `random_seed = 42`, and a bounded `max_time_in_seconds = 10.0`.

Because the search is deterministic and the trace is committed, the schedule the web app shows is a *replay*
of the offline solve — "replay = truth". OR-Tools is native C++ that cannot run in the browser, so S06 is
**always precomputed** (the engine gate; see [03_solvers-applied.md](./03_solvers-applied.md)).

## In scope (modeled)

- Ordered operations per job with **precedence** (`s_{j,k} ≥ e_{j,k-1}`).
- **One machine per operation**, fixed integer duration.
- **No-overlap** on each machine (disjunctive constraint).
- A single objective: **minimize makespan** $C_{\max}$.
- Integer time (start/end variables bounded by the horizon $H = \sum_{j,k} d_{j,k}$).

## Assumptions (simplifications)

- **No preemption** — once an operation starts, it holds its machine until it finishes.
- **Machines always available** — no shifts, no scheduled downtime.
- **No setup, transport, or due dates** — the time between operations is exactly the precedence wait.
- **Each operation uses exactly one machine** — no alternative machines, no machine choice.
- **Deterministic durations** — durations are known and fixed.

## Out of scope (deliberately not modeled)

- **Stochastic processing times** (the rest of SIMLAB's simulators handle uncertainty; S06 is the
  optimize-only contrast).
- **Machine breakdowns / failures.**
- **Alternative routings** (flexible job-shop, where an operation may run on one of several machines).
- **Objectives other than makespan** — tardiness, weighted completion time, cost, energy.
- **Shared-resource / cumulative constraints** beyond per-machine no-overlap (e.g. operators, tooling).

These omissions are *pedagogical features*: S06 shows what "just optimizing" produces on a clean,
deterministic problem before the paired routing scenarios (S07–S09, S11) complicate it with simulation
under uncertainty (the **optimize-then-simulate** bridge — see the
[Optimization & Routing guide](../../problem-types/03_optimization-routing.md)).
