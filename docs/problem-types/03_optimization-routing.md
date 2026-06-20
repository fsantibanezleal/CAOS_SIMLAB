# Optimization & Routing (Operations Research) — problem-type node

> Part of the CAOS_SIMLAB problem-type guides. This node is the **decision map** for the
> *optimization* half of the lab: which solver to reach for, what each one is honestly good at, and how an
> optimized plan is handed to a discrete-event simulation so a learner can watch it survive — or fail —
> under uncertainty.

Where the [DES](./01_discrete-event-simulation.md) and [ABM](./02_agent-based-modeling.md) guides cover
*simulating* a system, this guide covers *deciding* something about it: the best machine schedule, the
cheapest set of delivery routes, the fastest path across a road network. Operations Research (OR) is the
discipline of computing those decisions, and CAOS_SIMLAB treats it as the natural partner of simulation —
not a competitor.

The single most important lesson in this whole node, and the reason every optimization scenario in the lab
is paired with a simulator, is this:

> **An optimum on paper is fragile under uncertainty.** A route plan that is provably minimal on
> *deterministic* travel times can violate every time window the moment real traffic, breakdowns, or
> stochastic demand arrive. The job of OR here is not to produce a number to admire; it is to produce a
> *plan to stress-test*.

## Read in order

1. [01 · What it is](./03_optimization-routing/01_what-it-is.md) — what optimization/OR is, the model
   anatomy (decision variables + constraints + objective), the LP → MILP → CP → routing ladder, and the
   one non-negotiable framing (the optimum is fragile).
2. [02 · When to use it](./03_optimization-routing/02_when-to-use.md) — *decide* vs *simulate*, the
   "how much" vs "which discrete choice" test, the honest limits of each model class, and what makes a
   problem belong to this half of the lab rather than DES/ABM.
3. [03 · Methods & KPIs](./03_optimization-routing/03_methods-and-kpis.md) — the five model families in
   depth (LP/GLOP, MILP branch & bound, CP-SAT, the TSP→CVRP→VRPTW→PDPTW routing ladder, shortest paths),
   the optimize-then-simulate bridge (simheuristics), and the KPIs each one reports.
4. [04 · Tools](./03_optimization-routing/04_tools.md) — the optimization toolbox (OR-Tools, PyVRP,
   NetworkX + OSMnx, OSRM/VROOM), the mandatory OR-Tools routing configuration, the precompute-only gate,
   the deprecated tools to avoid, and the license/attribution summary.
5. [05 · Scenarios](./03_optimization-routing/05_scenarios.md) — how the tools map onto the lab's
   scenarios (S06, S07, S08, S09, S11), with links to each use-case node.

## Sibling problem-type guides

- [Discrete-Event Simulation](./01_discrete-event-simulation.md) — SimPy · Ciw · Salabim (the simulator that
  stress-tests every optimized plan).
- [Agent-Based Modeling](./02_agent-based-modeling.md) — Mesa · Mesa-Geo · NetLogo Web · JuPedSim.
- [Monte-Carlo & Replications](./04_monte-carlo-replications.md) — joblib · CuPy/Numba · SciPy.

## Frameworks behind this node

- [OR-Tools](../frameworks/08_ortools.md) — Routing, CP-SAT, GLOP LP (the teaching default).
- [PyVRP](../frameworks/09_pyvrp.md) — Hybrid Genetic Search (the state-of-the-art VRP contrast).
- [NetworkX](../frameworks/10_networkx.md) · [OSMnx](../frameworks/11_osmnx.md) — road graph, shortest
  paths, travel-time matrix.
- [SimPy](../frameworks/01_simpy.md) — the DES that replays optimized plans under uncertainty.

## Lane & data policy

- [Precompute pipeline](../guides/01_precompute-pipeline.md) — local `.venv` → seeded trace → replay.
- [The gate](../architecture/03_the-gate.md) — why OR-Tools / PyVRP are precompute-only (native code).
- [Determinism & trace](../architecture/02_determinism-and-trace.md) — replay = truth; seed the solver
  *and* the simulator.
- License & attribution: [`../../LICENSES.md`](../../LICENSES.md) · [`../../ATTRIBUTION.md`](../../ATTRIBUTION.md).
