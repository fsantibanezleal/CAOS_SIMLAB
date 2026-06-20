# S06 — The solver applied (CP-SAT: how, why, and the lane)

> Use-case node: [06_s06_jobshop](../06_s06_jobshop.md) · prev:
> [02_formalization.md](./02_formalization.md) · next:
> [04_results-and-reading.md](./04_results-and-reading.md)

## The tool

S06 is solved by **[OR-Tools](../../frameworks/08_ortools.md)** — Google's optimization engine
(Apache-2.0, single pip package, CPU-only) — using its **CP-SAT** sub-solver (constraint programming over a
SAT/CP engine). CP-SAT is the strongest single tool in the lab for **scheduling and combinatorial
feasibility**: instead of forcing everything into linear inequalities, it lets you state high-level
combinatorial constraints — interval variables, `NoOverlap`, precedence — directly, and searches with
constraint propagation plus modern SAT/learning techniques.

The scenario imports it lazily (`from ortools.sat.python import cp_model`) *only inside `run()`*, so merely
importing the scenario registry never pulls the native engine.

## The concrete API / approach

The build mirrors the formalization one-to-one
([`simlab/scenarios/s06_jobshop.py`](../../../simlab/scenarios/s06_jobshop.py)):

1. **Model + horizon.** `model = cp_model.CpModel()`; `horizon = sum of all durations` (the loose upper
   bound $H$ that bounds every time variable).
2. **Interval variables per operation.** For each operation $(j,k)$ on machine $m$ for duration $d$:
   ```python
   s  = model.new_int_var(0, horizon, f"s_{j}_{k}")     # start
   e  = model.new_int_var(0, horizon, f"e_{j}_{k}")     # end
   iv = model.new_interval_var(s, d, e, f"i_{j}_{k}")   # ties e = s + d
   machine_intervals[m].append(iv)
   ```
   The **interval variable** is the idiom that makes this a scheduling model rather than a generic MILP: it
   binds start/duration/end into one object CP-SAT reasons about natively.
3. **Precedence (per job).** `if k > 0: model.add(s >= ends[(j, k-1)])` — operation $k$ waits for $k-1$.
4. **Disjunctive machine constraint.** For each machine: `model.add_no_overlap(machine_intervals[m])` — the
   single high-level call that forbids two operations sharing a machine from overlapping. This is exactly
   the constraint that would be clumsy as pairwise big-M disjunctions in a MILP.
5. **Objective.** A `makespan` int var bound to the latest job-end via
   `model.add_max_equality(makespan, [ends of each job's last op])`, then `model.minimize(makespan)`.
6. **Deterministic solve.** A `CpSolver` with `max_time_in_seconds = 10.0`, `num_search_workers = 1`,
   `random_seed = 42`; `solver.solve(model)`; status mapped to `OPTIMAL` / `FEASIBLE` / `UNKNOWN`.
7. **Extract the trace.** Read `solver.value(starts[(j,k)])` for every operation into
   `ops = [{job, machine, start, dur}, …]`, plus `makespan = solver.value(makespan)`, and compute the KPIs.

## Why CP-SAT (and not LP/MILP or a metaheuristic)

- **The structure is logical, not arithmetic.** Job-shop is dominated by *no-overlap*, *precedence* and
  *sequencing* — constraints CP-SAT expresses directly (interval vars, `NoOverlap`) and propagates
  efficiently. Encoding the same disjunctions in a MILP needs big-M tricks that solve slower and read worse.
- **It proves optimality on these sizes.** For the small-to-moderate instances here, CP-SAT returns a
  **proved-optimal** schedule — the committed `ft06` run is `OPTIMAL` with $C_{\max}=55$, matching the
  literature, and all ten variants return `OPTIMAL`. (On a hard instance it would stop *near* optimal at the
  10 s cap and report a bound. The reproducibility invariants that make the committed trace
  machine-independent are `num_search_workers = 1` and the fixed `random_seed = 42` — a single deterministic
  search thread; the 10 s cap is just a safety ceiling these small instances never approach.)
- **One library, maximum didactic surface.** OR-Tools also provides Routing (S07–S09) and GLOP LP (S11), so
  the lab teaches CP scheduling, routing and LP from a single `pip install ortools`. CP-SAT is the
  pure-optimization anchor of that set. See the
  [Optimization & Routing guide §4](../../problem-types/03_optimization-routing.md) and the framework's
  [applying note](../../frameworks/08_ortools/03_applying.md).

The framework's runnable [example.py](../../frameworks/08_ortools/example.py) demonstrates the same CP-SAT
job-shop on `ft06` (verified makespan 55) alongside a GLOP LP.

## Live vs precompute lane (this scenario)

**Precompute, always.** OR-Tools is native C++ with a Python wrapper; it **cannot** compile to WASM and so
never runs in the Pyodide live lane. The scenario declares `pure_python = False`, which fails the engine
gate of the lab's [4-gate](../../architecture/03_the-gate.md) (`live` requires pure-Python *and*
`wheels ⊆ LIVE_WHEELS` *and* `run_ms < 3000` *and* `trace_bytes < ~1 MB`). The committed manifest records
`lane = precomputed` with the reason *"not pure-Python (cannot run in Pyodide/WASM)"*; for `ft06` the
measured gate timing is well under the 3 s cap (`run_ms` ≈ 39.5 ms in the committed manifest — a few tens of
ms; note S06 fails the lane on the engine gate, not on time) and `trace_bytes ≈ 1954`.

Concretely:

- The optimal schedule for every variant is solved **offline in the local `.venv`** by the
  [precompute pipeline](../../guides/01_precompute-pipeline.md)
  (`python -m simlab.pipeline s06_jobshop --seed 42`).
- The compact seeded trace is committed to `data/artifacts/s06_jobshop/<variant>-seed42.json` and the
  per-scenario manifest to `manifests/s06_jobshop.json`.
- The static web app only **replays** that trace as a Gantt animation — there is no in-browser re-solve, and
  the parameter sliders select among the precomputed variants rather than launching a new CP-SAT search.

This is the same "replay = truth" discipline as the rest of the lab, and the reason S06 ships as a clean
optimize-only exhibit rather than the optimize-then-simulate pairing used by S07–S09 and S11.
