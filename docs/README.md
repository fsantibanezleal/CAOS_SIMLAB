# CAOS_SIMLAB — documentation

This lab is a **guide for implementing real simulation/optimization solutions**: for each problem type it
shows the *dedicated, state-of-the-art* tool, how to install it, how to use it, and how to apply it — with a
runnable, verified example. Two planes: a lightweight **live** lane in the browser and a no-restriction
**local precompute** lane that runs the heavy dedicated engines and commits a seeded trace the app replays.

## Architecture
- [ARCHITECTURE.md](ARCHITECTURE.md) — the deterministic-replay, two-lane design + the 3-gate rule.

## By problem type (start here)
- [Discrete-Event Simulation](problem-types/discrete-event-simulation.md) — SimPy · Ciw · Salabim
- [Agent-Based Modeling](problem-types/agent-based-modeling.md) — Mesa · Mesa-Geo · NetLogo Web · JuPedSim
- [Optimization & Routing](problem-types/optimization-routing.md) — OR-Tools · PyVRP · NetworkX · OSMnx
- [Monte-Carlo & Replications](problem-types/monte-carlo-replications.md) — joblib · CuPy/Numba · SciPy

## By framework (install / usage / applying + a verified `example.py`)
**DES:** [SimPy](frameworks/simpy/) · [Ciw](frameworks/ciw/) · [Salabim](frameworks/salabim/)
**ABM:** [Mesa](frameworks/mesa/) · [Mesa-Geo](frameworks/mesa-geo/) · [JuPedSim](frameworks/jupedsim/) · [NetLogo Web](frameworks/netlogo-web/)
**Optimization/routing:** [OR-Tools](frameworks/ortools/) · [PyVRP](frameworks/pyvrp/) · [NetworkX](frameworks/networkx/) · [OSMnx](frameworks/osmnx/)
**Monte-Carlo/GPU:** [joblib](frameworks/joblib/) · [SciPy stats](frameworks/scipy-stats/) · [Numba](frameworks/numba/) · [CuPy](frameworks/cupy/) · [Taichi](frameworks/taichi/) · [JAX](frameworks/jax/)
**GPU-ABM (reference chapter, not shipped):** [FLAME GPU 2 / ABMax / AMBER](frameworks/gpu-abm-chapter/)

## Pipeline guides
- [Precompute pipeline](guides/precompute-pipeline.md) — local `.venv` → seeded trace → replay
- [Live lane (Pyodide)](guides/live-lane-pyodide.md) — SimPy/Mesa in the browser; replay = truth
- [GPU lane](guides/gpu-lane.md) — optional CuPy/Numba/Taichi/JAX, local-only, CPU fallback

## Scenario → tool map
| # | Scenario | Tool(s) | Lane |
|---|---|---|---|
| S01 | Bank/Clinic Queue (M/M/c) | SimPy + Ciw (analytic validation) | live |
| S02 | Schelling Segregation | Mesa (+ NetLogo Web) | live |
| S03 | SIR Epidemic | Mesa (+ NetLogo Web) | live |
| S04 | Emergency Department Flow | SimPy (multi-stage priority) | live |
| S05 | Beer Game (bullwhip) | Mesa (policy/feedback) | live |
| S06 | Job-Shop Scheduling | OR-Tools CP-SAT | precompute |
| S07 | Construction Haul Routing | OR-Tools + SimPy + OSMnx/NetworkX | precompute |
| S08 | Vehicle Routing (VRP) | OR-Tools + PyVRP + SimPy | precompute |
| S09 | Ambulance Dispatch | OR-Tools + SimPy + graph | precompute |
| S10 | Monte-Carlo CI Study | joblib (+ CuPy/Numba) + SciPy | precompute |
| S11 | Mine Multi-Destination Haul | OR-Tools GLOP LP + SimPy | precompute |

## Honesty
Deprecated tools (AgentPy, desmod) are intentionally **not** used. Synthetic scenarios are labeled; the one
real external dataset (OR-Library `ft06`, S06) is cited. Data policy + licenses:
[../ATTRIBUTION.md](../ATTRIBUTION.md) · [../LICENSES.md](../LICENSES.md).
