# Agent-Based Modeling (ABM) — problem-type node

> **Problem-type guide.** What ABM is, how the pieces fit together, when to reach for it, and — concretely —
> which real tool to use, with the honest trade-offs. This is a guide for someone implementing a real
> solution, not a survey. Every tool claim here is grounded in the project's ABM-frameworks research and the
> stack decision (see the per-page references).

Agent-Based Modeling builds a system **bottom-up**: you describe many autonomous **agents**, the
**environment** they live in, and the **local rules** each agent follows — then you run time forward and
watch the **global behavior emerge**. You never program the macro outcome. Segregated neighborhoods,
epidemic peaks, supply-chain oscillations: these appear because of the interactions, not because anyone
coded them in. That is the whole point of ABM, and it is why ABM is the right lens for systems where *the
whole is not the sum of the parts*.

This contrasts with [Discrete-Event Simulation](./01_discrete-event-simulation.md) (where the model is a flow
of **entities through resources**, advanced by an event calendar) and with
[Optimization & Routing](./03_optimization-routing.md) (where you *prescribe* the best decision rather than
*observe* dynamics). ABM is the tool when behavior is **distributed, heterogeneous, and adaptive**, and the
question is "what pattern will these local rules produce?"

## Read in order

1. [01_what-it-is.md](./02_agent-based-modeling/01_what-it-is.md) — the four ingredients (agents, environment,
   local rules, scheduler) plus data collection; the abstractions that *are* the curriculum, and the
   Mesa-2→3 activation break you must not copy from old tutorials.
2. [02_when-to-use.md](./02_agent-based-modeling/02_when-to-use.md) — when ABM is the right problem type and
   when it is not (DES vs. Optimization), the Beer-Game boundary case, and the two-lane (live vs. precompute)
   decision with the 4-gate rule that drives everything.
3. [03_methods-and-kpis.md](./02_agent-based-modeling/03_methods-and-kpis.md) — the canonical ABM methods
   (emergence, contact/threshold dynamics, feedback/delay), spatial topologies, activation regimes as a
   modeling choice, and the KPIs each method reads off the trace.
4. [04_tools.md](./02_agent-based-modeling/04_tools.md) — the honest tool map: Mesa 3 (default), NetLogo Web
   (live in-browser), Mesa-Geo (real maps), JuPedSim (crowds), the heavy/GPU lane, and what is **deprecated**
   or **not for ABM**.
5. [05_scenarios.md](./02_agent-based-modeling/05_scenarios.md) — the three ABM scenarios in this lab (S02
   Schelling, S03 SIR, S05 Beer Game), each with its live engine, its in-repo Mesa equivalent, and a build
   checklist.

## Scenario map (ABM in this lab)

| # | Scenario | Tool(s) | Method | Lane |
|---|---|---|---|---|
| **S02** | [Schelling Segregation](../use-cases/02_s02_schelling.md) | Mesa 3 (+ NetLogo Web) | emergence from preference | live |
| **S03** | [SIR / SEIR Epidemic](../use-cases/03_s03_sir.md) | Mesa 3 (+ NetLogo Web) | contact / threshold dynamics | live |
| **S05** | [Beer Game (bullwhip)](../use-cases/05_s05_beergame.md) | Mesa 3 | feedback / delay (policy) | live |

## Related nodes

- **Framework (tool) nodes:** [Mesa](../frameworks/04_mesa.md) · [Mesa-Geo](../frameworks/05_mesa-geo.md) ·
  [JuPedSim](../frameworks/06_jupedsim.md) · [NetLogo Web](../frameworks/07_netlogo-web.md) ·
  [NetworkX](../frameworks/10_networkx.md) · [OSMnx](../frameworks/11_osmnx.md) ·
  [GPU-ABM chapter](../frameworks/18_gpu-abm-chapter.md) (reference only).
- **Architecture:** [overview](../architecture/01_overview.md) · [determinism & trace](../architecture/02_determinism-and-trace.md) ·
  [the gate](../architecture/03_the-gate.md) · [live lane (Pyodide)](../architecture/04_live-lane-pyodide.md) ·
  [precompute pipeline](../architecture/05_precompute-pipeline.md).
- **Sibling problem-types:** [Discrete-Event Simulation](./01_discrete-event-simulation.md) ·
  [Optimization & Routing](./03_optimization-routing.md) ·
  [Monte-Carlo & Replications](./04_monte-carlo-replications.md).
- **Repo:** <https://github.com/fsantibanezleal/CAOS_SIMLAB>
