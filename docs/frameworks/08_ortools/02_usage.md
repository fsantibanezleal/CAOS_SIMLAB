# OR-Tools — Usage

> Wiki node: [08_ortools](../08_ortools.md) · prev: [01_installation.md](./01_installation.md) · next: [03_applying.md](./03_applying.md)

OR-Tools is three solvers in one package. This lab uses all three:

| Sub-solver | Import | What it solves | Scenarios |
|---|---|---|---|
| **CP-SAT** | `from ortools.sat.python import cp_model` | Constraint programming / discrete scheduling | S06 job-shop; S07 haul (min-cost-flow route-cost certificate) |
| **Routing** | `from ortools.constraint_solver import pywrapcp, routing_enums_pb2` | TSP / CVRP / VRPTW / PDPTW | S08 VRP |
| **GLOP** | `from ortools.linear_solver import pywraplp` | Linear programming (continuous) | S11 blend LP |

The two demos in [`example.py`](./example.py) cover the **CP-SAT** and **GLOP** ends of the toolkit (the
Routing end is the same `pywrapcp` family used by **S08** — a routing model is internally a
constraint-programming model with index/arc variables, so the modelling mindset carries straight over).
Note **S09** (ambulance dispatch) is **not** an OR-Tools scenario — it is SimPy + NetworkX.

## Key concepts

### CP-SAT (constraint programming over integers)

CP-SAT is a constraint-programming solver backed by a SAT/CP hybrid engine. You build a **declarative model**
of variables, constraints and an objective, then hand it to a solver that searches for a feasible assignment
that optimises the objective. It is **exact**: it returns `OPTIMAL` when it has *proved* no better solution
exists — as opposed to `FEASIBLE`, which means it found a solution but the time limit stopped it before it
could prove optimality.

The core API (OR-Tools 9.x "new style", lower-case methods, as used in S06):

- `model = cp_model.CpModel()` — the empty model.
- `model.new_int_var(lo, hi, name)` — an integer decision variable in `[lo, hi]`.
- `model.new_interval_var(start, size, end, name)` — a contiguous interval `[start, start+size)`; the natural
  way to model "an operation occupies a machine for `size` time units". `start`, `end` are themselves int
  vars, so the solver places the interval.
- `model.add(expr)` — a linear/relational constraint (e.g. `s >= ends[(j, k-1)]` for precedence within a job).
- `model.add_no_overlap([iv, ...])` — the key scheduling constraint: these intervals may not overlap (one
  machine does one operation at a time). This is the disjunctive constraint that makes job-shop hard.
- `model.add_max_equality(z, [...])` and `model.minimize(z)` — define the makespan as the max end time and
  minimise it.
- `solver = cp_model.CpSolver()` then `solver.solve(model)`; read results with `solver.value(var)` and map the
  returned status against `cp_model.OPTIMAL / FEASIBLE / INFEASIBLE`.

#### Determinism knobs

The **reproducibility invariants** — what makes a committed trace replay bit-for-bit — are exactly two: a
single search worker and a fixed seed.

```python
solver.parameters.num_search_workers = 1     # multi-worker search is faster but NON-deterministic
solver.parameters.random_seed = 42
solver.parameters.max_time_in_seconds = 10.0 # a TERMINATION GUARD, not a determinism knob (cap is per-scenario)
```

Multi-worker search races several strategies in parallel and returns whichever finishes first, which makes
the result order non-reproducible. Pinning a single worker plus a fixed seed trades a little speed for exact
reproducibility — the right call when the output is a *committed artifact* the web app will replay forever.

The time cap is **not** a determinism knob: it only guarantees the script terminates, and its value is
**per-scenario**, not a single mandated number. The small benchmark instances here all solve to `OPTIMAL`
well inside any cap, so the cap never actually fires. S06 and the S07 plan builder use **10 s**
(`CP_TIME_LIMIT_S = 10.0`); the standalone [`example.py`](./example.py) uses the same 10 s. Changing the cap
does not change the (already-optimal) result — only `num_search_workers=1` + `random_seed` do.

### GLOP (linear programming)

GLOP is a primal-dual **simplex** solver for continuous LPs. The API is the generic `pywraplp` wrapper, so
the same code shape works for other backends (CLP, SCIP, etc.) just by changing the solver name string:

- `solver = pywraplp.Solver.CreateSolver("GLOP")`
- `inf = solver.infinity()` then `x = solver.NumVar(lo, inf, name)` — a continuous variable.
- `solver.Add(linear_expr <relop> rhs)` — a linear constraint.
- `solver.Maximize(expr)` / `solver.Minimize(expr)` — the objective.
- `solver.Solve()` returns a status; read the optimum via `solver.Objective().Value()` and each
  `var.solution_value()`.

LPs over rational data are solved deterministically by simplex, so no seed is needed; we still check the
returned status is `OPTIMAL` before trusting the numbers.

## Minimal runnable example, walked through

The script [`example.py`](./example.py) runs two tiny demos. Run it from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/08_ortools/example.py
```

### Demo 1 — CP-SAT job-shop (`solve_jobshop`)

1. **Instance.** A job-shop is a list of jobs; each job is an ordered list of `(machine, duration)`
   operations. We first solve the **Fisher & Thompson ft06** 6×6 benchmark, whose optimal makespan is a
   famous, proven **55** — a built-in correctness check. Then we solve a tiny **3×3** instance produced by
   `generate_jobshop`, which uses a seeded `numpy` generator so the instance is identical on every run.
2. **Variables.** For every operation we create a `start` int var, an `end` int var, and an `interval` of
   fixed `duration` linking them (`new_interval_var(s, d, e, ...)`).
3. **Constraints.** Within a job, operation `k` cannot start before operation `k-1` finishes
   (`model.add(s >= ends[(j, k-1)])`). On each machine, the intervals must not overlap
   (`model.add_no_overlap(machine_intervals[m])`).
4. **Objective.** `makespan = max over jobs of (last op's end)` via `add_max_equality`; we `minimize(makespan)`.
5. **Solve.** Single worker, `random_seed=42`, 10-second termination cap (the same cap S06 and the S07 plan
   builder use; the instance solves to `OPTIMAL` long before it fires). We print the makespan and whether the
   solver returned `OPTIMAL` (proved) vs `FEASIBLE` (found, not proved).

The `horizon = sum of all durations` is used as a safe upper bound on any start/end — every operation must
finish by the time you run them all back-to-back, so no variable domain can be too small.

### Demo 2 — GLOP linear program (`solve_lp`)

A textbook 2-variable LP: maximise `3x + 5y` subject to `x <= 4`, `2y <= 12`, `3x + 2y <= 18`, `x, y >= 0`.
The known optimum is `36` at `(x*, y*) = (2, 6)`. We build it with `pywraplp`, solve, and print the status,
the objective value and the optimal point. This is the same modelling family as S11's plant-blend LP (mix
sources to hit a target subject to supply caps), just stripped to two variables for clarity.

## Verified output

Captured by actually running `.venv/Scripts/python.exe docs/frameworks/08_ortools/example.py` from the repo
root with **ortools 9.15.6755** on Python 3.13.0. The output is **bit-for-bit identical across repeated runs**
(verified by diffing two consecutive runs):

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
  the solver *proves* optimality, not just feasibility. This is exactly the value scenario S06 commits in
  `data/artifacts/s06_jobshop/ft06-seed42.json`.
- **Generated 3×3 makespan = 27, OPTIMAL** — instantly solved; the printed instance shows each job visits all
  three machines once (the full-permutation route convention S06 uses).
- **LP optimum = 36 at (2, 6), OPTIMAL** — matches the textbook answer, confirming the GLOP setup.

## Lint

The example is ruff-clean:

```bash
.venv/Scripts/python.exe -m ruff check docs/frameworks/08_ortools/example.py
# -> All checks passed!
```

Next: how to **formalize** an optimization problem and pick OR-Tools (or an alternative) to solve it →
[03_applying.md](./03_applying.md).
