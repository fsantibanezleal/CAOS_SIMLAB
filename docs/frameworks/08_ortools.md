# OR-Tools — wiki node

**Google OR-Tools** is the lab's **optimization** engine: a single pip package (Apache-2.0, pure-pip,
CPU-only) that bundles three solvers used across the scenarios — **CP-SAT** (constraint programming /
discrete scheduling), **Routing** (vehicle routing on top of CP), and **GLOP** (a linear-programming
simplex). Where the simulators (SimPy, Mesa, Ciw) answer *"given a policy and random events, what happens?"*,
OR-Tools answers the complementary question *"what is the best decision?"* — it computes an **optimum** (a
schedule, a route, a blend), not a sample path. Reach for it when you can write a problem as decision
variables + constraints + an objective and you want the *best* plan rather than an observed one.

In this lab OR-Tools is a **precompute-lane** tool. It is native C++ code that cannot run in the browser
(Pyodide), so it never enters the live wheel closure; instead it runs **offline** in the local `.venv` and
commits deterministic traces (optimal schedules, blend plans) that the web viewer replays. The defining
teaching pattern is **optimize-then-simulate**: OR-Tools produces a plan that is optimal *on paper* under
deterministic inputs, then a paired SimPy simulation stress-tests it under uncertainty so the learner can
watch the "optimum" degrade. Five scenarios use it — **S06** (CP-SAT job-shop), **S07/S08/S09** (Routing,
paired with SimPy + a road graph), and **S11** (GLOP blend LP). For reproducible committed traces the lab
deliberately forces determinism: one CP-SAT search worker, fixed `random_seed=42`, bounded time.

## Read in order

1. [01_installation.md](./08_ortools/01_installation.md) — exact pip line + version (9.15.6755), the
   precompute requirements lane, deps, platform notes, why it is CPU-only / no CUDA.
2. [02_usage.md](./08_ortools/02_usage.md) — the real API for all three solvers (CP-SAT, GLOP, Routing), the
   runnable example walked through step by step, the determinism knobs, and its **verified captured output**.
3. [03_applying.md](./08_ortools/03_applying.md) — how to *formalize* an optimization problem and *solve* it
   with this tool, the optimize-then-simulate pattern, the scenarios that use it, honest trade-offs, and when
   to pick OR-Tools vs alternatives.

## Runnable example

- [example.py](./08_ortools/example.py) — two tiny deterministic demos: a CP-SAT job-shop (the proven-optimal
  Fisher & Thompson **ft06**, makespan 55) and a GLOP linear program (textbook optimum 36 at (2, 6)). Run it
  from the repo root:

  ```bash
  .venv/Scripts/python.exe docs/frameworks/08_ortools/example.py
  ```

## Scenarios that use this framework

The scenario code lives in `simlab/scenarios/`:

- **S06 — Job-Shop Scheduling** (`simlab/scenarios/s06_jobshop.py`) — CP-SAT; the pure-optimization anchor.
- **S07 — Construction Haul Routing** (`simlab/scenarios/s07_haul.py`) — Routing + SimPy + OSMnx/NetworkX.
- **S08 — Vehicle Routing (VRP)** (`simlab/scenarios/s08_vrp.py`) — Routing (teaching default) + PyVRP (SOTA
  contrast) + SimPy.
- **S09 — Ambulance Dispatch** (`simlab/scenarios/s09_ambulance.py`) — Routing + SimPy + graph.
- **S11 — Mine Multi-Destination Haul** (`simlab/scenarios/s11_minehaul.py`) — GLOP blend LP + SimPy.

## Related

- Problem-type guide: [Optimization & Routing](../problem-types/03_optimization-routing.md) — the decision map
  for the whole optimization half of the lab.
- Alternatives & companions: [PyVRP](./09_pyvrp.md) (SOTA VRP) · [NetworkX](./10_networkx.md) ·
  [OSMnx](./11_osmnx.md) (road graph + matrices) · [SimPy](./01_simpy.md) (the simulator that stress-tests the plan).
- Pipeline: [Precompute pipeline](../guides/01_precompute-pipeline.md) — local `.venv` → seeded trace → replay.
