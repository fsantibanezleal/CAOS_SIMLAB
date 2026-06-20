# 11 · S11 — Mine multi-destination haul (use-case node)

A mine ships ore from several **load phases** — each with its own ore grade — to three **destination
kinds**: a **plant** that must be fed at a target grade within a band, a **dump** for waste, and one or
more intermediate **stockpiles** (a node that is a sink and, once it holds material, a *source* for later
trips). The lesson is that **two optimization problems are coupled**: an LP picks how many tonnes to draw
from each phase so the blended plant feed hits the grade target (the *plan*), and a **fixed fleet** of
trucks must then *realize* that plan over real haul roads inside a shift (the *execution*). An optimal
plan is **necessary but not sufficient** — under an under-sized fleet the far, high-grade phase is starved
and the achieved plant blend **slips off target**. The plan is solved with **OR-Tools GLOP** (the
linear-programming simplex) and the execution is a real **SimPy** discrete-event simulation; because the
GLOP solver is native code, this is a **precompute-lane** scenario (no live lane).

## Read in order

1. [01 · Assumptions](./11_s11_minehaul/01_assumptions.md) — the canonical instance (the exact map,
   grades, demand, fleet) plus the scope: what *is* and what *isn't* modeled.
2. [02 · Formalization](./11_s11_minehaul/02_formalization.md) — the math: sets, parameters, decision &
   state variables, the model class, the blend LP, the graded route cost, the execution dynamics, and the
   KPIs — pulled verified from the scenario code and its Experiments Context block.
3. [03 · Solvers applied](./11_s11_minehaul/03_solvers-applied.md) — which dedicated tools solve it and
   *how* (the concrete `pywraplp` GLOP and `simpy` APIs), why these tools, and the live-vs-precompute lane.
4. [04 · Results & reading](./11_s11_minehaul/04_results-and-reading.md) — the twelve variants and what
   their KPIs show, plus how to read the viz (nodes, flows, stock fill bar, plant HUD).

## Scenario & frameworks

- **Scenario code:** [`../../simlab/scenarios/s11_minehaul.py`](../../simlab/scenarios/s11_minehaul.py)
  (`simlab/scenarios/s11_minehaul.py`) — the single source of truth; the shared road graph lives in
  `simlab/scenarios/_geo.py`.
- **Dedicated tools (framework nodes):**
  [08 · OR-Tools](../frameworks/08_ortools.md) (the **GLOP** linear-programming simplex solves the blend LP) ·
  [01 · SimPy](../frameworks/01_simpy.md) (the discrete-event engine executes the plan with a fixed fleet).
- **Problem-type guide:**
  [Optimization & Routing](../problem-types/03_optimization-routing.md) — the optimize-then-simulate half of
  the lab that this scenario lives in.
- **Lane:** [Precompute pipeline](../guides/01_precompute-pipeline.md) — local `.venv` → seeded trace →
  replay (OR-Tools GLOP is native, so there is no live lane).
