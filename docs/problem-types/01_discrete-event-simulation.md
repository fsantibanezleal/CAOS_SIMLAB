# 01 · Discrete-Event Simulation (DES) — the section index

> Part of the CAOS_SIMLAB problem-type guides. This node is the decision map for the **discrete-event
> simulation** half of the lab: what DES actually is, when to reach for it, which engine to use for
> what, and — the part most tutorials skip — how to read its results *honestly*, because a single
> simulation run is a noisy sample, not an answer.

Where the [Optimization & Routing](./03_optimization-routing.md) guide covers *deciding* something about a
system and the [Agent-Based Modeling](./02_agent-based-modeling.md) guide covers *emergence* from many
interacting agents, this guide covers the workhorse of operations research: modelling a system as a
stream of **events that change state at discrete instants in time** — a customer arrives, a server
becomes free, a machine breaks down — and measuring how the system behaves between those instants.

The single most important lesson on this page, and the reason every DES scenario in the lab carries a
replications-and-confidence-interval story rather than a single pretty animation, is this:

> **One run tells you almost nothing.** A discrete-event model is a *stochastic* machine: feed it a
> different random seed and the average waiting time, the maximum queue, the resource utilization all
> move. The job of DES is not to produce one number to animate; it is to produce a *distribution* you
> can reason about — with confidence intervals, and with the start-up transient removed.

## Read in order

1. [01 · What it is](./01_discrete-event-simulation/01_what-it-is.md) — the event-driven clock, the five
   concepts (entities, resources, events, the future-event list, the simulated clock), and the two
   worldviews (process-interaction vs event-scheduling) that decide how you *write* a model.
2. [02 · When to use it](./01_discrete-event-simulation/02_when-to-use.md) — the four conditions that
   make a problem a DES, the boundaries against optimization, agent-based modeling and system dynamics,
   and the quick boxes-and-arrows tell.
3. [03 · Methods & KPIs](./01_discrete-event-simulation/03_methods-and-kpis.md) — what a DES actually
   measures (utilization ρ, waiting, queue length, throughput), **Little's Law** as the cheapest sanity
   check, and the process-interaction shape in practice (the SimPy generator).
4. [04 · The honesty curriculum](./01_discrete-event-simulation/04_honesty-curriculum.md) — the spine of
   the DES half: a single run is a noisy sample → replications + confidence intervals → warm-up /
   initial-transient bias → determinism is the contract → an animation is a hypothesis generator, not
   evidence (with the STRESS-DES model card).
5. [05 · The DES toolbox](./01_discrete-event-simulation/05_tools.md) — SimPy (primary engine), Ciw
   (the queueing-theory anchor), Salabim (offline animation), the JaamSim / AnyLogic reference tools,
   the deprecated tools to avoid, and a full license summary.
6. [06 · Scenarios](./01_discrete-event-simulation/06_scenarios.md) — how the engines map onto the lab's
   scenarios (S01, S04, the DES legs of S07/S08/S09/S11, and the S10 Monte-Carlo study), the
   optimize-then-simulate bridge, and where DES runs live vs precomputed.

## The DES engines at a glance

| Tool | Role in the lab | Paradigm | Live in browser? | Node |
|---|---|---|---|---|
| **SimPy** | Primary engine + teaching default | Process-interaction (generators + `yield`) | **Yes** (Pyodide) | [01 · SimPy](../frameworks/01_simpy.md) |
| **Ciw** | Queueing-theory lesson + analytic validation | Event-scheduling, queueing networks | Yes (pure Python) | [02 · Ciw](../frameworks/02_ciw.md) |
| **Salabim** | Teaching counterpoint + offline animation/video | Process-interaction (no `yield`) + OO | No (tkinter desktop) | [03 · Salabim](../frameworks/03_salabim.md) |

> If you take one thing from this lab: **report a distribution with a CI, after a warm-up — never a
> single run.** Everything else is decoration. The full argument is in
> [04 · The honesty curriculum](./01_discrete-event-simulation/04_honesty-curriculum.md).

## Related

- Sibling problem-type guides: [Agent-Based Modeling](./02_agent-based-modeling.md) (emergence from peers) ·
  [Optimization & Routing](./03_optimization-routing.md) (best decision) ·
  [Monte-Carlo & Replications](./04_monte-carlo-replications.md) (interval, not point — DES is the base
  model it replicates).
- Per-framework deep dives: [SimPy](../frameworks/01_simpy.md) · [Ciw](../frameworks/02_ciw.md) ·
  [Salabim](../frameworks/03_salabim.md).
- The two-lane, replay-is-truth design that decides when a DES runs live vs precomputed:
  [architecture.md](../architecture.md) — in particular
  [determinism & trace](../architecture/02_determinism-and-trace.md),
  [the gate](../architecture/03_the-gate.md),
  [the live Pyodide lane](../architecture/04_live-lane-pyodide.md) and
  [the precompute pipeline](../architecture/05_precompute-pipeline.md).
- Use-cases that are DES: [S01 — Bank / Clinic Queue](../use-cases/01_s01_queue.md) ·
  [S04 — Emergency Department Flow](../use-cases/04_s04_ed.md) ·
  [S07 — Construction Haul Routing](../use-cases/07_s07_haul.md) ·
  [S08 — Vehicle Routing (VRP)](../use-cases/08_s08_vrp.md) ·
  [S09 — Ambulance Dispatch](../use-cases/09_s09_ambulance.md) ·
  [S10 — Monte-Carlo CI Study](../use-cases/10_s10_montecarlo.md) ·
  [S11 — Mine Multi-Destination Haul](../use-cases/11_s11_minehaul.md).
