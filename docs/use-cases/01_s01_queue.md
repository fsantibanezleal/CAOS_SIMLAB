# 01 · S01 — Bank / Clinic Queue (M/M/c)

> Use-case node for scenario **S01**. Customers arrive at a bank or clinic and wait for one of `c`
> identical servers sharing a single FCFS line; arrivals are Poisson (`λ`) and service is exponential
> (`μ`). The question is **how long people wait and why the wait explodes as the place gets busy** —
> the discrete-event-simulation "hello world", solved live with **SimPy**, checked against the
> closed-form **Erlang-C** theory, and confirmed by an independent **Ciw** replication study.

## Read in order

1. [01 · Assumptions](./01_s01_queue/01_assumptions.md) — the canonical instance, components, tunable
   parameters, and what is / isn't modelled (scope, stability).
2. [02 · Formalization](./01_s01_queue/02_formalization.md) — sets, parameters, state, the M/M/c model
   class, the Erlang-C closed form, dynamics and KPIs (kept consistent with the code).
3. [03 · Solvers applied](./01_s01_queue/03_solvers-applied.md) — SimPy (live simulator) + Erlang-C
   (oracle) + Ciw (independent cross-check), the concrete API of each, and the live lane.
4. [04 · Results & reading](./01_s01_queue/04_results-and-reading.md) — the 12 variants (load sweep,
   pooling sweep, special cases), what the KPIs show, and how to read the viz.

## The scenario & engines

- Scenario module: [`simlab/scenarios/s01_queue.py`](../../simlab/scenarios/s01_queue.py)
- Frameworks: [SimPy](../frameworks/01_simpy.md) (primary live engine) ·
  [Ciw](../frameworks/02_ciw.md) (queueing-network second engine + analytic anchor)
- Problem-type map: [Discrete-Event Simulation](../problem-types/01_discrete-event-simulation.md)
- Lane & design: [live-lane (Pyodide) guide](../guides/02_live-lane-pyodide.md) ·
  [architecture.md](../architecture.md)
