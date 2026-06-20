# 03 · Methods & KPIs

← back to [Agent-Based Modeling](../02_agent-based-modeling.md)

ABM is one problem type, but it covers a small family of **canonical methods**, each defined by *what kind of
local rule produces the emergence* and *what KPI you read off the trace*. This lab's three ABM scenarios were
chosen precisely because together they cover this canon without redundancy:

| Method | The local mechanism | The emergent macro-pattern | Canonical scenario |
|---|---|---|---|
| **Emergence from preference** | each agent has a mild positional/relational preference and acts on it | a strongly-ordered global state nobody intended | [S02 Schelling](../../use-cases/02_s02_schelling.md) |
| **Contact / threshold dynamics** | a state spreads stochastically between neighbors with a rate | an outbreak that takes off above a threshold, then peaks and decays | [S03 SIR](../../use-cases/03_s03_sir.md) |
| **Feedback / delay (policy)** | each agent runs a control policy under information & shipping delay | a signal amplified as it propagates through the chain | [S05 Beer Game](../../use-cases/05_s05_beergame.md) |

> Schelling teaches **emergence from preference**; SIR teaches **thresholds and the agent↔compartment
> bridge**; the Beer Game teaches **feedback and delay**. (Wolf–Sheep predator–prey is intentionally a
> repo-only bonus — it adds no new *method* beyond S02/S03's agent-grid + charts.)

---

## 1. The methods in detail

### 1.1 Emergence from preference (Schelling)

Households on a lattice each hold a *very mild* same-group preference; a household relocates to an empty cell
whenever fewer than a tolerance fraction τ of its eight (Moore) neighbors share its group. The striking
result is that a **global** segregation pattern emerges that *no individual intended* — the system-level
segregation rises far above the τ any agent demands. This is the cleanest demonstration that **micro-rules ≠
macro-pattern**.

- **Tunable:** tolerance threshold τ, fraction empty, group ratio, grid size.
- **Space:** grid (Moore neighborhood). **Activation:** typically random.

### 1.2 Contact / threshold dynamics (SIR / SEIR)

Spatial agents in health states S/I/R infect neighbors stochastically. A susceptible cell catches the disease
from each infected Moore-neighbor with probability β; an infected cell recovers with probability γ per step
and is then immune. This is the **Kermack–McKendrick (1927)** SIR model in its **agent-based** form — a
probabilistic cellular automaton, the discrete spatial analogue of the classic compartmental ODE model.

The didactic hook is the **contrast**: the live grid animates *beside* a real-time S/I/R curve, so the learner
sees the **agent-level mechanism** and the **aggregate compartment view** together — the agent↔compartment
bridge. Teaches R₀, the epidemic peak, the herd-immunity threshold.

- **Tunable:** infection probability β, recovery time / γ, initial infected, contact radius, (optional) latent
  period (the **E** in SEIR).
- **Space:** grid. **Activation:** often simultaneous (synchronous epidemic step).

### 1.3 Feedback / delay — policy ABM (Beer Game)

Four echelons (retailer → wholesaler → distributor → factory) each run a local **order-up-to (base-stock)**
policy on an exponentially-smoothed forecast, under shipping/information **delays**. A modest one-off change in
end-customer demand is **amplified** into ever-larger order swings upstream — the **bullwhip effect** (Lee,
Padmanabhan & Whang, 1997). This is **policy/feedback ABM**, not a DES queue clone (see the boundary case in
[02 · When to use](./02_when-to-use.md)).

- **Tunable:** base-stock / target inventory, lead time, demand-shock size/timing, number of echelons.
- **Space:** a serial chain (line graph). **Activation:** a fixed-order serial cascade over the four echelons
  (downstream → upstream); each echelon runs its observe → forecast → order rule in turn — a single ordered
  pass over the AgentSet, not a synchronous batch.

---

## 2. Spatial topology as a modeling choice

The **space** decides who is a neighbor, and it changes the method's character:

- **Grid (lattice)** — local neighborhoods, the natural home of emergence and contact models (S02, S03).
- **Network (graph)** — neighbors defined by edges; contact networks, infrastructure, and serial supply chains
  (S05 is a degenerate line graph).
- **Geo (real coordinates)** — only when geography drives the answer; uses
  [Mesa-Geo](../../frameworks/05_mesa-geo.md) GeoAgents over a real map, and the spatial graph is built with
  [NetworkX/OSMnx](../../frameworks/10_networkx.md).

The same method can change behavior dramatically between topologies — "SIR on a grid" and "SIR on a
scale-free network" have very different peak timing and attack rates, which is itself worth teaching.

---

## 3. Activation regime as a KPI-affecting choice

The activation regime (introduced in [01 · What it is](./01_what-it-is.md)) is **not** an implementation
detail — the same rules under different schedulers give different dynamics:

| Regime | Each agent sees… | Fits | Example |
|---|---|---|---|
| **Random** | a *partially updated* world | breaking fixed-order artifacts; the common default | Schelling moves |
| **Simultaneous** | the *current* world; all update at once | synchronous systems (cellular-automaton epidemics) | SIR step |
| **Staged** | phase-ordered sub-steps within a tick | a step with ordered sub-phases | ordered observe→decide→act sub-phases (the lab's Beer Game uses a simpler fixed-order serial cascade) |

In Mesa 3 this is expressed on the `AgentSet` (`shuffle_do` / `do` / explicit stages), **not** the removed
pre-3.0 `Scheduler` classes — see [Mesa usage](../../frameworks/04_mesa/02_usage.md).

---

## 4. KPIs — what each method reads off the trace

ABM KPIs come in two levels (both collected every tick via Mesa's `DataCollector`; see
[01 · What it is §5](./01_what-it-is.md)):

| Method | Model-level KPI(s) | Agent-level KPI(s) |
|---|---|---|
| **Schelling** | segregation index *S* (mean fraction of like-neighbors), fraction unhappy, steps to convergence | per-household happiness, number of moves |
| **SIR** | infected count I(t), **peak height & time**, **attack rate** (final fraction recovered), did-it-take-off | per-cell time-to-infection / time-to-recovery |
| **Beer Game** | per-echelon **bullwhip ratio** Bᵢ = Var(oᵢ)/Var(d) (retailer/wholesaler/distributor/factory) + peak factory order | per-echelon inventory & order series over time |

Because every KPI is computed over the **committed seeded trace**, the numbers are **reproducible**: a given
`(params, seed)` always yields the same KPIs, and the viewer reads them back exactly. For confidence intervals
*across* seeds you switch problem type to a [Monte-Carlo replications study](../04_monte-carlo-replications.md).

---

## Next

- [04 · Tools](./04_tools.md) — the real engine for each method and lane.
- [05 · Scenarios](./05_scenarios.md) — the three scenarios with their committed KPIs and how to read them.

## References (grounding)

- Use-case nodes (the math, the canonical instance, the committed KPIs):
  [S02 Schelling](../../use-cases/02_s02_schelling.md) · [S03 SIR](../../use-cases/03_s03_sir.md) ·
  [S05 Beer Game](../../use-cases/05_s05_beergame.md).
- Framework: [Mesa usage](../../frameworks/04_mesa/02_usage.md) — `DataCollector`, the `AgentSet` activation API.
- Architecture: [determinism & trace](../../architecture/02_determinism-and-trace.md) — why the KPIs are reproducible.
