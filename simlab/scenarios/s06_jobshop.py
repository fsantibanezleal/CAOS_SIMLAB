"""S06 — Job-shop scheduling (constraint optimization, OR-Tools CP-SAT).

Each job is an ordered sequence of operations, each needing a specific machine for a fixed time; a machine
does one operation at a time. The optimizer assigns start times to minimize the makespan (the time the
last job finishes). This is pure combinatorial OPTIMIZATION (not stochastic simulation) — what a solver
does, contrasted with the simulators elsewhere. OR-Tools is native code, so this scenario is precomputed;
the committed trace is the optimal schedule, rendered as a Gantt chart.

Includes the classic Fisher–Thompson ft06 benchmark (6×6, known optimal makespan 55) plus generated
instances. Deterministic: instances are seeded, and CP-SAT runs single-worker with a fixed seed.
"""
from __future__ import annotations

from typing import Any

from ..core.gantttrace import GanttTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant

# Fisher & Thompson (1963) ft06: per job, an ordered list of (machine, duration). Optimal makespan = 55.
FT06 = [
    [(2, 1), (0, 3), (1, 6), (3, 7), (5, 3), (4, 6)],
    [(1, 8), (2, 5), (4, 10), (5, 10), (0, 10), (3, 4)],
    [(2, 5), (3, 4), (5, 8), (0, 9), (1, 1), (4, 7)],
    [(1, 5), (0, 5), (2, 5), (3, 3), (4, 8), (5, 9)],
    [(2, 9), (1, 3), (4, 5), (5, 4), (0, 3), (3, 1)],
    [(1, 3), (3, 3), (5, 9), (0, 10), (4, 4), (2, 1)],
]


def _generate(n_jobs: int, n_machines: int, inst_seed: int) -> list[list[tuple[int, int]]]:
    rng = make_rng(inst_seed)
    jobs = []
    for _ in range(n_jobs):
        order = list(range(n_machines))
        rng.shuffle(order)
        jobs.append([(int(m), int(rng.integers(2, 10))) for m in order])
    return jobs


class JobShopScenario(Scenario):
    id = "s06_jobshop"
    title = "Job-Shop Scheduling (CP-SAT)"
    method = "optimization"
    tier = 2
    viz = "gantt"
    engine = "ortools"
    pure_python = False  # native solver — always precomputed
    wheels = []
    param_specs = [
        ParamSpec("instance", "Instance (1 = ft06 benchmark, 0 = generated)", 1, 0, 1, 1, kind="int"),
        ParamSpec("n_jobs", "Jobs", 5, 2, 8, 1, kind="int"),
        ParamSpec("n_machines", "Machines", 5, 2, 8, 1, kind="int"),
        ParamSpec("inst_seed", "Instance seed", 1, 0, 9999, 1, kind="int"),
    ]

    def variants(self) -> list[Variant]:
        def g(vid, le, ls, nj, nm, isd, ne, ns):
            return Variant(vid, le, ls, {"instance": 0, "n_jobs": nj, "n_machines": nm, "inst_seed": isd}, ne, ns)

        return [
            Variant("ft06", "Fisher–Thompson ft06 (6×6)", "Fisher–Thompson ft06 (6×6)",
                    {"instance": 1, "n_jobs": 6, "n_machines": 6, "inst_seed": 0},
                    "The classic 1963 benchmark — proven optimal makespan 55.",
                    "El benchmark clásico de 1963 — makespan óptimo probado de 55."),
            g("j3m3", "3 jobs × 3 machines", "3 trabajos × 3 máquinas", 3, 3, 11, "A tiny instance, instantly optimal.", "Una instancia diminuta, óptima al instante."),
            g("j4m3", "4 jobs × 3 machines", "4 trabajos × 3 máquinas", 4, 3, 12, "More jobs than machines: contention rises.", "Más trabajos que máquinas: sube la contención."),
            g("j4m4", "4 jobs × 4 machines", "4 trabajos × 4 máquinas", 4, 4, 13, "Balanced small shop.", "Taller pequeño balanceado."),
            g("j5m4", "5 jobs × 4 machines", "5 trabajos × 4 máquinas", 5, 4, 14, "Machines become the constraint.", "Las máquinas son la restricción."),
            g("j5m5", "5 jobs × 5 machines", "5 trabajos × 5 máquinas", 5, 5, 15, "A square 5×5 shop.", "Un taller cuadrado 5×5."),
            g("j6m4", "6 jobs × 4 machines", "6 trabajos × 4 máquinas", 6, 4, 16, "Heavy contention on few machines.", "Fuerte contención en pocas máquinas."),
            g("j6m6", "6 jobs × 6 machines", "6 trabajos × 6 máquinas", 6, 6, 17, "A 6×6 generated instance.", "Una instancia 6×6 generada."),
            g("j8m4", "8 jobs × 4 machines", "8 trabajos × 4 máquinas", 8, 4, 18, "Many jobs queue for few machines.", "Muchos trabajos en cola por pocas máquinas."),
            g("j4m6", "4 jobs × 6 machines", "4 trabajos × 6 máquinas", 4, 6, 19, "More machines than jobs: short makespan.", "Más máquinas que trabajos: makespan corto."),
        ]

    def run(self, params: dict, seed: int) -> GanttTrace:
        from ortools.sat.python import cp_model  # lazy: only needed to RUN (not to import the registry)

        p = self.coerce(params)
        if int(p["instance"]) == 1:
            jobs = FT06
        else:
            jobs = _generate(int(p["n_jobs"]), int(p["n_machines"]), int(p["inst_seed"]))
        n_machines = 1 + max(m for job in jobs for (m, _) in job)
        horizon = sum(d for job in jobs for (_, d) in job)

        model = cp_model.CpModel()
        starts: dict[tuple[int, int], Any] = {}  # type: ignore[name-defined]
        ends: dict[tuple[int, int], Any] = {}  # type: ignore[name-defined]
        machine_intervals: dict[int, list] = {m: [] for m in range(n_machines)}
        for j, job in enumerate(jobs):
            for k, (m, d) in enumerate(job):
                s = model.new_int_var(0, horizon, f"s_{j}_{k}")
                e = model.new_int_var(0, horizon, f"e_{j}_{k}")
                iv = model.new_interval_var(s, d, e, f"i_{j}_{k}")
                starts[(j, k)] = s
                ends[(j, k)] = e
                machine_intervals[m].append(iv)
                if k > 0:
                    model.add(s >= ends[(j, k - 1)])
        for m in range(n_machines):
            model.add_no_overlap(machine_intervals[m])
        makespan = model.new_int_var(0, horizon, "makespan")
        model.add_max_equality(makespan, [ends[(j, len(job) - 1)] for j, job in enumerate(jobs)])
        model.minimize(makespan)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10.0
        solver.parameters.num_search_workers = 1
        solver.parameters.random_seed = 42
        status = solver.solve(model)
        status_name = {cp_model.OPTIMAL: "OPTIMAL", cp_model.FEASIBLE: "FEASIBLE"}.get(status, "UNKNOWN")

        ops = []
        for j, job in enumerate(jobs):
            for k, (m, d) in enumerate(job):
                ops.append({"job": j, "machine": int(m), "start": int(solver.value(starts[(j, k)])), "dur": int(d)})
        ms = int(solver.value(makespan))

        tr = GanttTrace(self.id, self.title, self.method, int(seed), p,
                        machines=[{"id": m, "label": f"M{m + 1}"} for m in range(n_machines)],
                        jobs=len(jobs), ops=ops, makespan=ms)
        tr.kpis = {
            "makespan": ms,
            "optimal": status_name == "OPTIMAL",
            "n_jobs": len(jobs),
            "n_machines": n_machines,
            "n_operations": len(ops),
            "utilization": round(sum(d for job in jobs for (_, d) in job) / (ms * n_machines), 3) if ms else 0.0,
        }
        return tr
