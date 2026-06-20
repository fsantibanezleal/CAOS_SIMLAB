"""OR-Tools — two tiny, deterministic demos in one script.

Demo 1 (CP-SAT): a small disjunctive job-shop. We solve the classic
Fisher & Thompson ft06 6x6 benchmark (proven optimal makespan = 55) the same
way scenario S06 does, then a tiny generated 3x3 instance to show generality.
We minimise the makespan and print whether the solver proved optimality.

Demo 2 (GLOP): a 2-variable linear program (a small blend, the same modelling
family as S11). We maximise profit subject to two resource constraints and
print the optimum and the optimal x*, y*.

Determinism:
  * CP-SAT: the reproducibility invariants are single worker (num_search_workers = 1)
    + fixed random_seed = 42. The wall-clock cap (CP_TIME_LIMIT_S = 10.0, matching S06
    and the S07 plan builder) is only a termination guard, not a determinism knob, and
    never fires on these tiny instances.
  * GLOP: the simplex on this LP is deterministic; we still print solver status.
  * The generated job-shop instance uses a seeded numpy Generator so the demo
    prints the same numbers on every run.

Run from the repo root:
    .venv/Scripts/python.exe docs/frameworks/08_ortools/example.py
"""
from __future__ import annotations

import numpy as np
from ortools.linear_solver import pywraplp
from ortools.sat.python import cp_model

SEED = 42
# Termination guard only (NOT a determinism knob): matches S06 and the S07 plan builder
# (CP_TIME_LIMIT_S = 10.0). ft06 solves to OPTIMAL in tens of ms, so this cap never fires;
# reproducibility comes from num_search_workers = 1 + random_seed.
CP_TIME_LIMIT_S = 10.0

# Fisher & Thompson (1963) ft06: per job, an ordered list of (machine, duration).
# Proven optimal makespan = 55. This is the exact instance scenario S06 ships.
FT06 = [
    [(2, 1), (0, 3), (1, 6), (3, 7), (5, 3), (4, 6)],
    [(1, 8), (2, 5), (4, 10), (5, 10), (0, 10), (3, 4)],
    [(2, 5), (3, 4), (5, 8), (0, 9), (1, 1), (4, 7)],
    [(1, 5), (0, 5), (2, 5), (3, 3), (4, 8), (5, 9)],
    [(2, 9), (1, 3), (4, 5), (5, 4), (0, 3), (3, 1)],
    [(1, 3), (3, 3), (5, 9), (0, 10), (4, 4), (2, 1)],
]


def generate_jobshop(n_jobs: int, n_machines: int, seed: int) -> list[list[tuple[int, int]]]:
    """A seeded random job-shop where each job visits every machine once (a full
    permutation route — the classic JSSP convention used by S06)."""
    rng = np.random.default_rng(seed)
    jobs: list[list[tuple[int, int]]] = []
    for _ in range(n_jobs):
        order = list(range(n_machines))
        rng.shuffle(order)
        jobs.append([(int(m), int(rng.integers(2, 10))) for m in order])
    return jobs


def solve_jobshop(jobs: list[list[tuple[int, int]]]) -> tuple[int, str]:
    """Minimise the makespan of a disjunctive job-shop with CP-SAT.

    Decision vars : interval [start, start+dur) for every operation.
    Constraints   : precedence within a job + no_overlap per machine.
    Objective     : minimise the max end time (the makespan).
    Returns (makespan, status_name).
    """
    n_machines = 1 + max(m for job in jobs for (m, _) in job)
    horizon = sum(d for job in jobs for (_, d) in job)  # a safe upper bound on any start/end

    model = cp_model.CpModel()
    starts: dict[tuple[int, int], cp_model.IntVar] = {}
    ends: dict[tuple[int, int], cp_model.IntVar] = {}
    machine_intervals: dict[int, list] = {m: [] for m in range(n_machines)}

    for j, job in enumerate(jobs):
        for k, (m, d) in enumerate(job):
            s = model.new_int_var(0, horizon, f"s_{j}_{k}")
            e = model.new_int_var(0, horizon, f"e_{j}_{k}")
            iv = model.new_interval_var(s, d, e, f"i_{j}_{k}")
            starts[(j, k)] = s
            ends[(j, k)] = e
            machine_intervals[m].append(iv)
            if k > 0:                                  # operation k starts after k-1 ends
                model.add(s >= ends[(j, k - 1)])

    for m in range(n_machines):                        # one machine = one op at a time
        model.add_no_overlap(machine_intervals[m])

    makespan = model.new_int_var(0, horizon, "makespan")
    model.add_max_equality(makespan, [ends[(j, len(job) - 1)] for j, job in enumerate(jobs)])
    model.minimize(makespan)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = CP_TIME_LIMIT_S
    solver.parameters.num_search_workers = 1           # single worker => reproducible
    solver.parameters.random_seed = SEED
    status = solver.solve(model)
    status_name = {
        cp_model.OPTIMAL: "OPTIMAL",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
    }.get(status, "UNKNOWN")
    return int(solver.value(makespan)), status_name


def solve_lp() -> tuple[str, float, float, float]:
    """A 2-variable LP solved with GLOP (the same LP engine S11 uses for its blend).

        maximise   3 x + 5 y
        subject to   x          <= 4
                          2 y    <= 12
                     3 x + 2 y   <= 18
                     x, y >= 0

    Textbook optimum: x* = 2, y* = 6, objective = 36.
    Returns (status_name, objective, x*, y*).
    """
    solver = pywraplp.Solver.CreateSolver("GLOP")
    inf = solver.infinity()
    x = solver.NumVar(0.0, inf, "x")
    y = solver.NumVar(0.0, inf, "y")
    solver.Add(x <= 4)
    solver.Add(2 * y <= 12)
    solver.Add(3 * x + 2 * y <= 18)
    solver.Maximize(3 * x + 5 * y)

    status = solver.Solve()
    status_name = {
        pywraplp.Solver.OPTIMAL: "OPTIMAL",
        pywraplp.Solver.FEASIBLE: "FEASIBLE",
        pywraplp.Solver.INFEASIBLE: "INFEASIBLE",
    }.get(status, "UNKNOWN")
    return status_name, solver.Objective().Value(), x.solution_value(), y.solution_value()


def main() -> None:
    print("=== OR-Tools demo (deterministic, seed=42) ===\n")

    # --- Demo 1: CP-SAT job-shop -------------------------------------------
    print("[1] CP-SAT job-shop scheduling (minimise makespan)")
    ms_ft06, st_ft06 = solve_jobshop(FT06)
    print(f"    ft06 (6x6 benchmark): makespan = {ms_ft06}  status = {st_ft06}  "
          f"(known optimum = 55)")

    tiny = generate_jobshop(n_jobs=3, n_machines=3, seed=SEED)
    ms_tiny, st_tiny = solve_jobshop(tiny)
    print(f"    generated 3x3 instance: makespan = {ms_tiny}  status = {st_tiny}")
    print(f"    (instance = {tiny})\n")

    # --- Demo 2: GLOP linear program ---------------------------------------
    print("[2] GLOP linear program (maximise 3x + 5y)")
    st_lp, obj, x_opt, y_opt = solve_lp()
    print(f"    status = {st_lp}  optimum = {obj:.1f}  at  x* = {x_opt:.1f}, y* = {y_opt:.1f}")
    print("    (textbook optimum = 36 at x*=2, y*=6)")


if __name__ == "__main__":
    main()
