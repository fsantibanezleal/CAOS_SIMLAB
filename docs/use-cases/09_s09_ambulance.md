# 09 · S09 — Ambulance Dispatch (use-case node)

Emergency calls arrive at **unpredictable** times and places across a grid-city; a finite fleet of
ambulances must respond fast from their stations. Each call is served by the unit that can **reach it
earliest** (nearest-available, accounting for those still busy): the unit drives to the scene, treats
on-site, transports to a single central hospital, and returns to base. The canonical fleet-sizing /
station-siting question is *how many ambulances, at which stations, to cover what fraction of calls within a
threshold?* The model is a **spatial multi-server queue with state-dependent service** (an M/G/c EMS system)
solved as a seeded discrete-event simulation: **[SimPy](../frameworks/01_simpy.md)** replays the call stream
and the dispatch decisions over a real road graph built with **[NetworkX](../frameworks/10_networkx.md)**.
Because both engines are pure-Python, the scenario runs **live** in the browser; being seeded, its route
trace replays exactly.

## Read in order

1. [01 · Assumptions](./09_s09_ambulance/01_assumptions.md) — the canonical instance (grid, fleet, stations,
   call stream) plus the scope: what *is* and what *isn't* modeled.
2. [02 · Formalization](./09_s09_ambulance/02_formalization.md) — the math: sets, parameters, decision &
   state variables, the model class, the Poisson arrivals, the nearest-available argmin, the service-cycle
   dynamics, and the KPIs — pulled verified from the scenario code and its Experiments Context block.
3. [03 · Solvers applied](./09_s09_ambulance/03_solvers-applied.md) — which dedicated tools solve it and
   *how* (the concrete NetworkX `single_source_dijkstra` router and the SimPy event loop), why these tools,
   the honest note on OR-Tools, and the live-vs-precompute lane.
4. [04 · Results & reading](./09_s09_ambulance/04_results-and-reading.md) — the ten variants/regimes, what
   their KPIs (mean / p90 response, coverage, offered load) show, and how to read the route viz.

## Scenario & frameworks

- **Scenario code:** [`../../simlab/scenarios/s09_ambulance.py`](../../simlab/scenarios/s09_ambulance.py) —
  the single source of truth; the shared road graph lives in
  [`../../simlab/scenarios/_geo.py`](../../simlab/scenarios/_geo.py).
- **Dedicated tools (framework nodes):**
  [01 · SimPy](../frameworks/01_simpy.md) (the discrete-event engine replays the call stream + dispatch) ·
  [10 · NetworkX](../frameworks/10_networkx.md) (the road graph + shortest-path layer for routing & the
  dispatch metric).
- **Companion optimizer (not used by this instance):** [08 · OR-Tools](../frameworks/08_ortools.md) — the
  optimizer for S09's optimize-then-simulate siblings (S07/S08/S11); here dispatch is an exact closed-form
  argmin, so no solver is called (see [03 · Solvers applied](./09_s09_ambulance/03_solvers-applied.md)).
- **Problem-type guide:** [Optimization & Routing](../problem-types/03_optimization-routing.md) — the road /
  routing half of the lab this scenario sits in; the [DES guide](../problem-types/01_discrete-event-simulation.md)
  covers the simulate leg.
- **Lane:** [Live lane (Pyodide)](../guides/02_live-lane-pyodide.md) — SimPy + NetworkX both load in the browser,
  so S09 runs live; replay = truth.
