# S05 — Beer Game (Supply-Chain Bullwhip)

**Tool:** Mesa 3 (agent-based modeling) · **Method:** ABM · **Lane:** live · **Viz:** line chart

**The problem.** In a serial supply chain retailer → wholesaler → distributor → factory, each echelon sees
only its immediate customer's orders and, to cover a shipping lead time, replenishes with an *order-up-to*
(base-stock) policy on an exponentially-smoothed forecast. The classic result (Lee, Padmanabhan & Whang,
1997) is that a modest, one-off change in end-customer demand is **amplified** into ever-larger order swings
as it moves upstream — the **bullwhip effect**. The lab models the canonical MIT Beer Game (base demand 8
units/week, a step at week 6, 52 weeks) as four `mesa.Agent` echelons each running the order rule, and
measures the per-echelon bullwhip ratio `Bᵢ = Var(oᵢ)/Var(d)`. The bullwhip is *emergent*: nobody programs
it — it appears from the four agents interacting.

## Read in order

1. [01_assumptions.md](./05_s05_beergame/01_assumptions.md) — the canonical instance, plus scope &
   assumptions (what is and isn't modeled).
2. [02_formalization.md](./05_s05_beergame/02_formalization.md) — sets, parameters, decision/state
   variables, the model class, dynamics, objective/constraints, and KPIs.
3. [03_solvers-applied.md](./05_s05_beergame/03_solvers-applied.md) — Mesa 3 as the solver, the concrete
   API/wiring, why this tool, and the live-vs-precompute lane.
4. [04_results-and-reading.md](./05_s05_beergame/04_results-and-reading.md) — the ten variants/regimes,
   what the KPIs show, and how to read the chart.

## Related nodes

- Scenario source: [`../../simlab/scenarios/s05_beergame.py`](../../simlab/scenarios/s05_beergame.py)
- Manifest (lane + variants + KPIs): [`../../manifests/s05_beergame.json`](../../manifests/s05_beergame.json)
- Framework node — **Mesa 3**: [../frameworks/04_mesa.md](../frameworks/04_mesa.md)
- Problem-type guide — Agent-Based Modeling: [../problem-types/02_agent-based-modeling.md](../problem-types/02_agent-based-modeling.md)
- Live-lane mechanics: [../guides/02_live-lane-pyodide.md](../guides/02_live-lane-pyodide.md)
- Sibling ABM use cases (same engine): S02 Schelling · S03 SIR
