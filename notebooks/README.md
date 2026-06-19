# notebooks/ — the from-zero curriculum

The canonical teaching surface. Notebooks own the derivations, the math, and the parameter sweeps; the
web app is the explorable companion. Both import `simlab.scenarios`, so they cannot drift. Planned arc:

- **des/** — clock & event loop → entity/resource/queue → random arrivals & service (distributions,
  seeds) → KPIs & Little's Law → **replications & confidence intervals** → warm-up / initial transient →
  **verification & validation** (SimPy vs the closed-form M/M/c) → priorities / balking / reneging →
  optimize-then-simulate.
- **abm/** — agent + environment → rules / step → scheduler & activation order → space & neighbourhoods →
  **emergence** (Schelling, SIR) → data collection & sweeps.
- **optimization/** — OR-Tools VRP/VRPTW → PyVRP SOTA contrast → simulate the optimized route under
  stochastic delay (the optimize-then-simulate bridge).
- **pitfalls/** — *Common Simulation Mistakes* (single replication, no warm-up, one fixed seed, eyeballing
  one animation, conflating optimization with simulation) shown wrong-vs-corrected; and *When does GPU
  actually help?* (it is slower on small queueing DES).

> First notebooks land alongside the Phase 1 scenarios.
