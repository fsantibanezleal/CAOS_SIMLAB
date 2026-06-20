# OR-Tools — Usage

OR-Tools is three solvers in one package. This lab uses all three:

| Sub-solver | Import | What it solves | Scenarios |
|---|---|---|---|
| **CP-SAT** | `from ortools.sat.python import cp_model` | Constraint programming / discrete scheduling | S06 job-shop |
| **Routing** | `from ortools.constraint_solver import pywrapcp, routing_enums_pb2` | TSP / CVRP / VRPTW / PDPTW | S07, S08, S09 |
| **GLOP** | `from ortools.linear_solver import pywraplp` | Linear programming (continuous) | S11 blend LP |

The two demos in `example.py` cover the **CP-SAT** and **GLOP** ends of the toolkit (the Routing end is the
same `pywrapcp` family used by S07/S08/S09).

## Key concepts

### CP-SAT (constraint programming over integers)

CP-SAT is a constraint-programming solver backed by a SAT/CP hybrid engine. You build a **declarative model**
of variables, constraints and an objective, then hand it to a solver that searches for a feasible assignment
that optimises the objective. It is exact: it returns `OPTIMAL` when it has *proved* no better solution exists.

The core API (OR-Tools 9.x "new style", as used in S06):

- `model = cp_model.CpModel()` — the empty model.
- `model.new_int_var(lo, hi, name)` — an integer decision variable in `[lo, hi]`.
- `model.new_interval_var(start, size, end, name)` — a contiguous interval `[start, start+size)`; the natural
  way to model "an operation occupies a machine for `size` time units".
- `model.add(expr)` — a linear/relational constraint (e.g. `s >= ends[(j, k-1)]` for precedence).
- `model.add_no_overlap([iv, ...])` — the key scheduling constraint: these intervals may not overlap (one
  machine does one operation at a time).
- `model.add_max_equality(z, [...])` and `model.minimize(z)` — define the makespan as the max end time and
  minimise it.
- `solver = cp_model.CpSolver()` then `solver.solve(model)`; read results with `solver.value(var)`.

**Determinism knobs** (mandatory in this lab): `solver.parameters.num_search_workers = 1` and
`solver.parameters.random_seed = 42`, plus `solver.parameters.max_time_in_seconds = ...` so the search is
bounded. Multi-worker search is faster but non-deterministic, which would break committed-trace replay.

### GLOP (linear programming)

GLOP is a primal-dual **simplex** solver for continuous LPs. The API is the generic `pywraplp` wrapper, so
the same code shape works for other backends (CLP, etc.) by changing the solver name string:

- `solver = pywraplp.Solver.CreateSolver("GLOP")`
- `x = solver.NumVar(lo, hi, name)` — a continuous variable.
- `solver.Add(linear_expr <relop> rhs)` — a linear constraint.
- `solver.Maximize(expr)` / `solver.Minimize(expr)` — the objective.
- `solver.Solve()` returns a status; read the optimum via `solver.Objective().Value()` and each
  `var.solution_value()`.

LPs over rational data are solved deterministically by simplex, so no seed is needed; we still check the
returned status is `OPTIMAL`.

## Minimal runnable example, walked through

The script `docs/frameworks/ortools/example.py` runs two tiny demos. Run it from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/ortools/example.py
```

### Demo 1 — CP-SAT job-shop (`solve_jobshop`)

1. **Instance.** A job-shop is a list of jobs; each job is an ordered list of `(machine, duration)`
   operations. We first solve the **Fisher & Thompson ft06** 6×6 benchmark, whose optimal makespan is a
   famous, proven **55** — a built-in correctness check. Then we solve a tiny **3×3** instance produced by
   `generate_jobshop`, which uses a seeded `numpy` generator so the instance is identical on every run.
2. **Variables.** For every operation we create a `start`, an `end`, and an `interval` of fixed `duration`.
3. **Constraints.** Within a job, operation `k` cannot start before operation `k-1` finishes
   (`s >= ends[(j, k-1)]`). On each machine, the intervals must not overlap (`add_no_overlap`).
4. **Objective.** `makespan = max over jobs of (last op's end)`; we `minimize(makespan)`.
5. **Solve.** Single worker, `random_seed=42`, 5-second cap. We print the makespan and whether the solver
   returned `OPTIMAL` (proved) vs `FEASIBLE` (found, not proved).

### Demo 2 — GLOP linear program (`solve_lp`)

A textbook 2-variable LP: maximise `3x + 5y` subject to `x <= 4`, `2y <= 12`, `3x + 2y <= 18`, `x, y >= 0`.
The known optimum is `36` at `(x*, y*) = (2, 6)`. We build it with `pywraplp`, solve, and print the status,
the objective value and the optimal point. This is the same modelling family as S11's plant-blend LP (mix
sources to hit a target subject to supply caps), just stripped to two variables for clarity.

## Verified output

Captured by actually running
`.venv/Scripts/python.exe docs/frameworks/ortools/example.py` (cwd = repo root). The output is
**bit-for-bit identical across repeated runs** (verified by diffing two consecutive runs):

```text
=== OR-Tools demo (deterministic, seed=42) ===

[1] CP-SAT job-shop scheduling (minimise makespan)
    ft06 (6x6 benchmark): makespan = 55  status = OPTIMAL  (known optimum = 55)
    generated 3x3 instance: makespan = 27  status = OPTIMAL
    (instance = [[(2, 7), (1, 5), (0, 5)], [(0, 7), (1, 3), (2, 2)], [(2, 7), (1, 8), (0, 7)]])

[2] GLOP linear program (maximise 3x + 5y)
    status = OPTIMAL  optimum = 36.0  at  x* = 2.0, y* = 6.0
    (textbook optimum = 36 at x*=2, y*=6)
```

Reading the result:

- **ft06 makespan = 55, OPTIMAL** — matches the published proven optimum, confirming the model is correct and
  the solver proves optimality, not just feasibility. This is exactly the value scenario S06 commits in
  `data/artifacts/s06_jobshop/ft06-seed42.json`.
- **Generated 3×3 makespan = 27, OPTIMAL** — instantly solved; the printed instance shows each job visits all
  three machines once (the full-permutation route convention S06 uses).
- **LP optimum = 36 at (2, 6), OPTIMAL** — matches the textbook answer, confirming the GLOP setup.
