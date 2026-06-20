# notebooks/ — the from-zero curriculum (roadmap, not yet started)

> **Status: empty.** This directory holds only this README — there are **no `.ipynb` files yet.**
> The notebook curriculum is a planned, still-unstarted roadmap item. The **live teaching surface
> today is the web app** at [simlab.fasl-work.com](https://simlab.fasl-work.com), which already ships
> all 11 scenarios (S01–S11) on the shared `simlab` engine.

## The plan

Notebooks are meant to own the *derivations* — the math, the step-by-step builds, and the parameter
sweeps that don't fit in a slider-driven UI — while the web app stays the explorable companion. The
intent is for both to import `simlab.scenarios`, so the worked code in a notebook is the same code that
runs in the browser. None of that exists yet; treat the arc below as a target, not a description of
shipped content.

## Planned arc

- **des/** — clock & event loop → entity/resource/queue → random arrivals & service (distributions,
  seeds) → KPIs & Little's Law → **replications & confidence intervals** → finite-run / initial-transient
  bias → **verification & validation** (SimPy vs the closed-form M/M/c) → priorities / balking / reneging →
  optimize-then-simulate.
- **abm/** — agent + environment → rules / step → scheduler & activation order → space & neighbourhoods →
  **emergence** (Schelling, SIR) → data collection & sweeps. (ABM is hand-rolled on NumPy in `simlab`, not
  Mesa-based.)
- **optimization/** — OR-Tools VRP/VRPTW → PyVRP SOTA contrast → simulate the optimized route under
  stochastic delay (the optimize-then-simulate bridge).
- **pitfalls/** — *Common Simulation Mistakes* (single replication, one fixed seed, eyeballing
  one animation, conflating optimization with simulation) shown wrong-vs-corrected; and *When does GPU
  actually help?* (it is slower on small queueing DES).

> The web app shipped first (Phase 1), so these notebooks did **not** land alongside the Phase 1
> scenarios as originally planned. They remain on the backlog.
