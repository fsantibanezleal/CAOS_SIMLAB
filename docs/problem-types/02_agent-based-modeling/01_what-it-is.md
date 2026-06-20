# 01 · What ABM is — the anatomy of a model

← back to [Agent-Based Modeling](../02_agent-based-modeling.md)

Agent-Based Modeling (ABM) is a **bottom-up** modeling style. Instead of writing an equation for the whole
system, you describe its **parts** — many autonomous **agents**, the **environment** they inhabit, and the
**local rule** each agent follows — then step time forward and *observe* the macro behavior that **emerges**.
The defining property is that the global pattern is **never written down**: it is *discovered* by running the
model. This is the single most important idea to internalize, because it inverts the usual modeling reflex —
you encode micro-behavior and you *read* macro-behavior off the simulation.

Every agent-based model — and every framework worth using — is organized around the same **four ingredients**
plus a fifth concern, **data collection**, that turns the run into something you can measure. In the canonical
Python framework, **[Mesa 3](../../frameworks/04_mesa.md)**, these are literally the classes and abstractions
you subclass, which is exactly why this lab teaches with it: *the abstractions are the curriculum.*

---

## 1. Agents

An **agent** is an autonomous decision-maker with two halves:

- **State** — the attributes it carries (a household's group label and tolerance; an individual's health
  status; a supply-chain echelon's demand forecast and order-up-to level).
- **Behavior** — a `step()` method that reads its *local* situation and acts.

Three properties distinguish ABM agents from cells in a plain cellular automaton or rows in a dataframe:

- **Heterogeneous** — agents can carry different attributes and even different rules.
- **Local** — an agent perceives only its neighborhood, never the whole world.
- **Adaptive** — its rule can depend on what it currently observes, so behavior changes with context.

In Mesa you subclass `Agent`; in NetLogo the agents are *turtles*. Concretely, in this lab's three scenarios:

| Scenario | The agent is… | Its state | Its `step()` rule (informal) |
|---|---|---|---|
| **S02 Schelling** | a household | group label, tolerance τ | move to an empty cell if too few neighbors share my group |
| **S03 SIR** | an individual | health status S/I/R | catch infection from infected neighbors; later recover |
| **S05 Beer Game** | a supply-chain echelon | smoothed demand forecast + order-up-to level (no physical inventory/backlog) | order up to my target given the demand I've seen |

---

## 2. Environment / space

Agents are situated **somewhere**, and "somewhere" determines **who is a neighbor**. The three spatial
topologies you will meet, in increasing realism:

| Space | What "neighbor" means | Use it for | In this lab |
|---|---|---|---|
| **Grid** (2D lattice) | adjacent cells (Moore / von Neumann) | abstract spatial emergence | [S02 Schelling](../../use-cases/02_s02_schelling.md), [S03 SIR](../../use-cases/03_s03_sir.md) |
| **Network** (graph) | nodes joined by an edge | contact networks, supply chains, infrastructure | SIR-on-a-network, [S05](../../use-cases/05_s05_beergame.md) echelons |
| **Geo** (real coordinates) | spatial proximity on a real map | anything where geography *is* the model | map scenarios (haul / dispatch) |

Mesa ships grid, network, and a newer **cell-space** abstraction first-class. For **real maps** you add
**[Mesa-Geo](../../frameworks/05_mesa-geo.md)**, which gives you **GeoAgents** backed by Shapely/GeoPandas
geometry over a Leaflet map. NetLogo uses *patches* (a grid of cells) plus *links* for networks.

> **Common beginner mistake — reaching for geo space when a grid is enough.** For abstract emergence models
> (Schelling, SIR) a grid **is** the right environment; a real map there is decoration, not insight. Use geo
> only when geography drives the answer. The spatial-graph work for routing/dispatch scenarios is typically
> done with [NetworkX/OSMnx](../../frameworks/10_networkx.md) and the agent layer kept simple — that lives in
> [Optimization & Routing](../03_optimization-routing.md), not here.

---

## 3. Local rules

The rules are where you spend your modeling thought. Each rule is **local** — written from one agent's point
of view, referencing only what that agent can perceive:

- *"If fewer than 30% of my neighbors share my group, I move."* (Schelling)
- *"If a neighbor is infected, I become infected with probability β."* (SIR)
- *"Order up to my target order-up-to level given what I've seen of demand."* (Beer Game)

The emergent macro-pattern — the segregation index climbing far above any agent's τ, the epidemic peak, the
upstream order swings — is **never written down**. It is *discovered* by running the model. Encode
micro-behavior; *read* macro-behavior.

---

## 4. Scheduler / activation regime

When you "step" the model, **in what order do the agents act?** This is the **activation regime**, and it
materially changes results — the same rules under different schedulers can give different dynamics, so it is a
**first-class modeling choice**, not an implementation detail.

- **Random activation** — shuffle agents each tick, act one at a time. Each agent sees the *partially
  updated* world (earlier movers' changes are visible to later movers). The common default; it breaks the
  artifacts of a fixed order.
- **Simultaneous activation** — every agent computes its next state from the *current* world, then all states
  update at once (read-all-then-write). Correct for synchronous systems — cellular-automaton-style rules,
  lockstep epidemics.
- **Staged activation** — agents perform phase A (e.g. "decide"), *then* all perform phase B (e.g. "move"),
  in stages within a tick. Use when a step has ordered sub-phases.

> **Mesa 3 note — do not copy old tutorials.** Mesa removed the old `Scheduler` / `RandomActivation` classes.
> In Mesa 3 you drive activation directly on the model's `AgentSet` — e.g. `self.agents.shuffle_do("step")`
> for random activation, `do("step")` for fixed order, and you compose stages explicitly. Tutorials written
> against the pre-3.0 `time.RandomActivation` API will **not run**. The *concepts* above are unchanged; only
> the call site moved into the `AgentSet` API. See the [Mesa framework node](../../frameworks/04_mesa.md)
> ([usage](../../frameworks/04_mesa/02_usage.md)).

The choice of regime is itself a KPI-affecting decision — see
[03 · methods & KPIs](./03_methods-and-kpis.md) for how it interacts with the dynamics.

---

## 5. Data collection — the output (and, here, the trace)

A simulation you cannot measure is a screensaver. You collect two kinds of series **every tick**:

- **Model-level** metrics — aggregates over all agents: the infected count, the segregation index, total
  backorders.
- **Agent-level** metrics — per-agent attributes over time: one household's happiness, one echelon's emitted
  order series.

Mesa offers a `DataCollector` that can do both and hand you tidy tables (pandas) at the end; the lab's
scenarios instead record the per-tick series directly (e.g. S05 has each echelon append to its own order list,
no `DataCollector`). Either way, **in this lab the recorded series *is* the replay artifact:** the headless run
captures a step-by-step trace (model- and agent-level series) to JSON/Arrow, and the web viewer animates that
trace. A run is therefore a pure function of
`(params, seed)`, and the committed trace is the source of truth — *replay = truth*. See the
[trace contract](../../architecture/02_determinism-and-trace.md).

---

## Next

- [02 · When to use ABM](./02_when-to-use.md) — is this even an ABM problem? And which lane does it run in?
- [03 · Methods & KPIs](./03_methods-and-kpis.md) — the canonical ABM methods and what they measure.
- [04 · Tools](./04_tools.md) — the honest tool map.

## References (grounding)

- Framework node: [Mesa](../../frameworks/04_mesa.md) — the four ingredients mapped onto real classes;
  the Mesa-2→3 activation break; seeding.
- Architecture: [determinism & trace](../../architecture/02_determinism-and-trace.md) — `run = f(params, seed)`
  and the trace schema both lanes produce.
