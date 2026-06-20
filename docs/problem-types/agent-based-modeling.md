# Agent-Based Modeling (ABM)

> **Problem-type guide.** What ABM is, how the pieces fit together, and — concretely — which real tool to
> reach for, with the honest trade-offs. This is a guide for someone implementing a real solution, not a
> survey. Every tool claim here is grounded in the project's ABM-frameworks research and the stack
> decision (see [References](#references-grounding)).

Agent-Based Modeling builds a system **bottom-up**: you describe many autonomous **agents**, the
**environment** they live in, and the **local rules** each agent follows — then you run time forward and
watch the **global behavior emerge**. You never program the macro outcome. Segregated neighborhoods,
epidemic peaks, supply-chain oscillations: these appear because of the interactions, not because anyone
coded them in. That is the whole point of ABM, and it is why ABM is the right lens for systems where *the
whole is not the sum of the parts*.

This contrasts with [Discrete-Event Simulation](./discrete-event-simulation.md) (where the model is a flow
of **entities through resources**, advanced by an event calendar) and with
[Optimization](./optimization.md) (where you *prescribe* the best decision rather than *observe* dynamics).
ABM is the tool when behavior is **distributed, heterogeneous, and adaptive**, and the question is "what
pattern will these local rules produce?"

---

## 1. The four ingredients of an ABM

Every agent-based model — and every framework worth using — is organized around the same four concepts.
In the canonical Python framework, **Mesa 3**, these are literally the classes and abstractions you
subclass, which is exactly why this lab teaches with it: *the abstractions are the curriculum.*

### 1.1 Agents

An **agent** is an autonomous decision-maker with **state** (attributes it carries) and **behavior** (a
`step()` method that reads its local situation and acts). In Schelling, the agent is a household with a
group label and a tolerance; in SIR, an individual with a health status; in the Beer Game, an echelon with
an inventory level and an ordering policy.

Agents are **heterogeneous** (different attributes), **local** (they see only their neighborhood, not the
whole world), and often **adaptive** (their rule depends on what they observe). In Mesa you subclass
`Agent`; in NetLogo they are *turtles*.

### 1.2 Environment / space

Agents are situated **somewhere**, and "somewhere" determines who is a neighbor. The three spatial
topologies you will meet, in increasing realism:

| Space | What "neighbor" means | Use it for | In this lab |
|---|---|---|---|
| **Grid** (2D lattice) | adjacent cells (Moore / von Neumann) | abstract spatial models | S02 Schelling, S03 SIR |
| **Network** (graph) | nodes connected by an edge | contact networks, supply chains, infrastructure | SIR-on-a-network, S05 echelons |
| **Geo** (real coordinates) | spatial proximity on a real map | anything where geography is the model | map scenarios (haul/dispatch) |

Mesa ships grid, network and a newer **cell-space** abstraction first-class. For **real maps** you add
**[Mesa-Geo](../frameworks/mesa-geo.md)**, which gives you **GeoAgents** backed by Shapely/GeoPandas
geometry over a Leaflet map. NetLogo uses *patches* (a grid of cells) plus *links* for networks.

> A frequent beginner mistake is reaching for geo space when a grid is enough. For abstract emergence
> models (Schelling, SIR) a grid **is** the right environment; a real map there is decoration, not insight.
> Use geo only when geography drives the answer.

### 1.3 Local rules

The rules are where you spend your modeling thought. Each rule is **local** — written from one agent's
point of view, referencing only what that agent can perceive. "If fewer than 30% of my neighbors share my
group, I move" (Schelling). "If a neighbor is infected, I become infected with probability *p*" (SIR).
"Order up to my target inventory given what I've seen of demand" (Beer Game).

The emergent macro-pattern is **never written down** — it is *discovered* by running the model. This is the
single most important idea to communicate to a learner: you encode micro-behavior and you *read* macro-
behavior off the simulation.

### 1.4 Scheduler / activation regime

When you "step" the model, **in what order do the agents act?** This is the **activation regime**, and it
materially changes results — the same rules under different schedulers can give different dynamics, so it
is a first-class modeling choice, not an implementation detail.

- **Random activation** — shuffle agents each tick, act one at a time. Each agent sees the *partially
  updated* world (earlier movers' changes are visible to later movers). The common default; it breaks the
  artifacts of a fixed order.
- **Simultaneous activation** — every agent computes its next state from the *current* world, then all
  states update at once (read-all-then-write). Correct for synchronous systems (e.g. cellular-automaton-
  style rules, lockstep epidemics).
- **Staged activation** — agents perform phase A (e.g. "decide"), *then* all perform phase B (e.g.
  "move"), in stages within a tick. Use when a step has ordered sub-phases.

> **Mesa 3 note (do not copy old tutorials).** Mesa removed the old `Scheduler`/`RandomActivation` classes.
> In Mesa 3 you drive activation directly on the model's `AgentSet` — e.g. `self.agents.shuffle_do("step")`
> for random activation, or `do("step")` for fixed-order, and you compose stages explicitly. Tutorials
> written against the `time.RandomActivation` API are pre-3.0 and will not run. The *concepts* above are
> unchanged; only the call site moved into the `AgentSet` API. See [frameworks/mesa.md](../frameworks/mesa.md).

### 1.5 Data collection (the output)

A simulation you cannot measure is a screensaver. You collect two kinds of series every tick:

- **Model-level** metrics — aggregates over all agents (the infected count, the segregation index, total
  backorders).
- **Agent-level** metrics — per-agent attributes over time (one household's happiness, one echelon's
  inventory).

Mesa's `DataCollector` does both and hands you tidy tables (pandas) at the end. In this lab the collected
series **is** the replay artifact: the headless run records a step-by-step trace (model- and agent-level
deltas) to JSON/Arrow, and the web viewer animates that trace. See
[the trace contract in ARCHITECTURE.md](../ARCHITECTURE.md).

---

## 2. Choosing a tool — the honest map

There is no single "best" ABM tool; the right choice depends on **where the model runs** (a learner's
browser vs. an offline precompute box) and **how big** it is. This lab makes the choice explicitly and
lives with the trade-offs the research surfaced.

### 2.1 The default: Mesa 3 (Python)

**[Mesa 3](../frameworks/mesa.md)** is the canonical Python teaching framework and the lab's default ABM
engine.

- **License:** Apache-2.0. **Maturity:** the de-facto Python standard, actively maintained, JOSS-published
  (2025).
- **Why it teaches well:** its `Agent` / `Model` / space / scheduler abstractions map one-to-one onto the
  four ingredients above — so learning Mesa *is* learning ABM, not learning a framework's quirks.
- **Scale:** comfortable at **10³–10⁵ agents**. It is object-per-agent, so it bogs down past ~10⁵; if a
  scenario genuinely needs more, route it to the GPU/vectorized lane (§2.5) rather than fighting Mesa.
- **The trade-off you must internalize:** **Mesa is not a web-serving engine.** Its only first-class
  visualization is **SolaraViz**, which is a *stateful Python (Solara) server bound to a localhost port*.
  That is excellent for local teaching and notebooks and **wrong** for a public static site: it would be
  one live Python process per visitor on a GPU-less, few-vCPU host — a scaling and abuse hazard. **Do not
  run SolaraViz behind nginx for public users.**

So in this lab Mesa is used in **two roles**, never as a live public server:

1. **The curriculum** — the from-zero ABM tutorials and the repo examples are written in Mesa because the
   abstractions are the lesson.
2. **Headless precompute** — heavy ABM scenarios run Mesa *headless* in the offline pipeline, record their
   trajectories to a compact seeded trace, and the SPA **replays** them. This is the same
   "local compute → committed artifact → static viewer" pattern as the rest of CAOS.

### 2.2 The live-in-browser engine: NetLogo Web (Tortoise)

For scenarios that must **run live in the visitor's browser** with editable sliders and real-time
animation, the lab uses **[NetLogo Web](../frameworks/netlogo-web.md)** (the *Tortoise* engine).

- **Why it fits the architecture perfectly:** NetLogo compiles its Logo-family DSL **to JavaScript** and
  runs **entirely client-side**. You export a model to standalone HTML / the `netlogo-engine.js` runtime,
  strip the IDE chrome, and embed it. The static host serves files only — **zero server compute**, no
  Python process, effectively unbounded concurrency. This is the cleanest way to honor "enter → straight
  to a running simulator" on a no-server host.
- **Didactic depth:** NetLogo owns the world's largest curated teaching Models Library (Schelling, SIR,
  Wolf-Sheep, Fire, Flocking).
- **Scale:** ~10³–10⁴ agents in-browser — fine for canonical on-ramp models, not for large-N.
- **License nuance you must record:** the engine is open source, but the **Models Library is mixed** —
  *Code Examples* are CC0, while many full models are **CC BY-NC-SA** (noncommercial). House rule: record
  each embedded model's license in [ATTRIBUTION.md](../../ATTRIBUTION.md), **prefer CC0 examples**, and
  **author our own NetLogo models** where a license is restrictive.

> Pyodide-Mesa is an *alternative* live path (run pure-Python Mesa in a Pyodide Web Worker, post frames to
> Canvas2D). NetLogo Web is preferred for the canonical cards because it is purpose-built for the browser
> and carries no Pyodide cold-start tax. Either way the rule is the same: **light + client-side**.

### 2.3 The two-lane fit (the decision that drives everything)

This is the architectural heart of ABM in this lab. There are **two lanes**, matching the product's two
execution modes, and each ABM scenario picks one:

| | **LIVE lane** | **PRECOMPUTE lane** |
|---|---|---|
| **Engine** | NetLogo Web (Tortoise), or Pyodide-Mesa | Mesa 3 (or Mesa-Geo) **headless** |
| **Where it runs** | the visitor's browser (client-side JS/WASM) | offline, on the local box |
| **What ships** | static HTML/JS the host serves | a committed **seeded trace** the SPA **replays** |
| **Server compute** | none | none (it only serves the trace) |
| **Best for** | light, canonical models the learner tunes live | heavy / large-N / geo models too costly to run per-visitor |
| **Gate** | must pass the 3-gate rule: pure-Python (or NetLogo-JS) **AND** < 3 s **AND** trace < ~1 MB | anything that fails a live gate |

A scenario ships **live only if all three gates hold**; failing any one routes it to precompute (the gate
verdict and measured numbers are recorded per-scenario; CI rejects a "live" scenario that breaches a
gate). See [ARCHITECTURE.md §the 3-gate rule](../ARCHITECTURE.md).

**Restated, because it is the most common point of confusion:** *Mesa is never served live.* Mesa runs
**headless → trace → replay**. NetLogo Web runs **live in the browser**. Both put **zero** simulation
compute on the server. The same model can appear in *both* lanes — an in-browser NetLogo card for instant
play and a Mesa notebook in the repo for "how to build it yourself" — which reinforces that the concept is
engine-independent. Pair each live card with its Mesa equivalent so the two-engine setup teaches rather
than confuses.

### 2.4 Real maps: Mesa-Geo

When geography is part of the model — agents on a real road network, demand over a city — use
**[Mesa-Geo](../frameworks/mesa-geo.md)** (Apache-2.0). It adds **GeoAgents** with real geometry
(Shapely/GeoPandas) and a Leaflet/Solara map. Like Mesa, it is a **precompute** engine here: run it
headless, commit the rendered paths, and the SPA replays them on a deck.gl/MapLibre map. The same
non-public-server caveat applies (it shares Mesa's Solara visualization model). For the routing/dispatch
scenarios, the *spatial graph* work is typically done with [NetworkX/OSMnx](../frameworks/networkx-osmnx.md)
and the agent layer kept simple — see [Optimization](./optimization.md).

### 2.5 Crowd / pedestrian flow: JuPedSim

For **pedestrian and crowd dynamics** — emergency-department crowding, evacuation, flow through a floor
plan — use **[JuPedSim](../frameworks/jupedsim.md)** (LGPLv3, pip-installable). It implements validated
**social-force** and **collision-free-speed** pedestrian models behind a clean **Python API**, so it drops
straight into the offline pipeline: run it headless, emit trajectories, replay them. It was chosen over
Vadere specifically because Vadere is a Java/GUI tool with integration friction, whereas JuPedSim is a
library. Pedestrian flow is a **precompute** scenario (trajectories → replay), never a live in-browser sim.

### 2.6 Heavy / GPU lane (advanced chapter, not v1 runtime)

When a model genuinely needs **10⁵–10⁸ agents**, object-per-agent Mesa is the wrong tool and you move to a
vectorized or GPU engine. The research evaluated three; all are **precompute-only** (they produce artifacts
the lab replays — none ever runs on the public host):

- **FLAME GPU 2** — CUDA message-passing on a single GPU, Python bindings, million-agent scale. The most
  powerful but the most brittle (CUDA/driver pinning required; documented 8 GB-VRAM OOM on laptop-class
  GPUs). It is **cut from the v1 runtime stack and kept as a teaching chapter** — its results, if used,
  must ship as fully reproducible committed artifacts because the host can never recompute them.
- **ABMax (JAX)** — vectorized `vmap` + JIT; a lighter GPU/CPU alternative when CUDA setup is painful.
- **AMBER (Polars)** — columnar **CPU** accelerator (reported up to ~1000× Mesa on large SIR); big sims
  without a GPU at all.

For this lab's purposes, the honest verdict is that **the highest-ROI "heavy" use of compute is not one
giant agent population but thousands of independent seeded replications** (a Monte-Carlo / confidence-
interval study), which runs in seconds on ordinary CPU cores via `joblib`. So large-N GPU ABM is a
post-v1 stretch, while the replications study ships as CPU precompute. See
[Optimization & methodology](./optimization.md) and the Monte-Carlo scenario.

### 2.7 Deprecated — do not use

- **AgentPy** — *deprecated; do not adopt.* Its own authors now point users to Mesa. It has pleasant
  Jupyter ergonomics, but building on it is a dead end. Cite it only as historical context.
- **desmod** — unmaintained; **do not use**. (It is a DES helper, listed here only because it sometimes
  appears in ABM/DES tooling lists.)

> **Also not a methodology:** "NumPy by hand." Hand-rolling an agent loop in NumPy is fine as an *under-
> the-hood teaching aside* to show what a framework does for you, but it is **not** the lab's ABM approach.
> The lab uses real dedicated frameworks (Mesa / Mesa-Geo / NetLogo Web / JuPedSim) so the curriculum
> teaches transferable, real-world tools.

### 2.8 Tools NOT for ABM (use the right problem-type)

ABM models *agents and emergence*. If your model is really a flow of entities through resources, that is
DES — use **SimPy** / **Ciw** / **Salabim** (see [DES](./discrete-event-simulation.md)). If it is a
prescriptive decision (best routes, best schedule), that is optimization — use **OR-Tools** / **PyVRP**
(see [Optimization](./optimization.md)). The Beer Game (S05) is a useful boundary case: it *looks* like a
supply-chain queue but is modeled as **ABM**, because the interesting object is the *feedback dynamics from
local ordering policies*, not entity-through-resource flow.

---

## 3. Scenario map (ABM in this lab)

The catalog assigns three scenarios to ABM. Each links its live engine and its in-repo Mesa equivalent.

### S02 — Schelling Segregation · live
The canonical emergence model: households with a mild same-group preference relocate when too few
neighbors match; a *global* segregation pattern emerges that *no individual intended*. Tunable: tolerance
threshold, fraction empty, group ratio, grid size. **Engine:** NetLogo Web for the live card (or
Pyodide-Mesa replaying frames to Canvas2D); a **Mesa** equivalent in the repo teaches engine-independence.
A ~50×50 grid stepping at 5–10 Hz needs only Canvas2D (no Pixi). → [Schelling scenario](../scenarios/s02-schelling.md).

### S03 — SIR / SEIR Epidemic · live
Spatial agents infect neighbors stochastically; the live grid animates **beside** a real-time S/I/R curve,
so the learner sees the agent-level mechanism *and* the aggregate compartment view together (the didactic
hook is exactly that contrast). Teaches R₀, the epidemic peak, herd-immunity threshold. Tunable: infection
probability, recovery time, initial infected, contact radius, (optional) latent period. **Engine:** NetLogo
Web live + **Mesa** in the repo. → [SIR scenario](../scenarios/s03-sir.md).

### S05 — Beer Game (Supply-Chain Bullwhip) · ABM policy / feedback
Four echelons (retailer → wholesaler → distributor → factory) each run a local **ordering policy** under
shipping/information **delays**; small demand changes amplify into upstream oscillations — the **bullwhip
effect**. This is modeled as **ABM (policy / feedback loop)**, not a DES queue clone: the object of study
is the feedback dynamic. **Engine:** **Mesa** (policy/feedback). Tunable: base-stock / target inventory,
lead time, demand-shock size/timing, number of echelons. → [Beer Game scenario](../scenarios/s05-beer-game.md).

> **Why these three are good ABM on-ramps:** Schelling teaches emergence from preference; SIR teaches
> thresholds and the agent↔compartment bridge; the Beer Game teaches feedback and delay. Together they
> cover the ABM canon without redundancy. (Wolf-Sheep predator-prey is intentionally a repo-only bonus —
> it adds no new *method* beyond S02/S03's agent-grid + charts.)

---

## 4. Implementation checklist

When you build a real ABM scenario in this lab:

1. **Identify the four ingredients** — agents (state + `step()`), space (grid / network / geo), local
   rules, activation regime. Write them down before coding.
2. **Pick the lane** — light and tunable → **live** (NetLogo Web, or Pyodide-Mesa). Heavy / large-N / geo
   / pedestrian → **precompute** (Mesa / Mesa-Geo / JuPedSim headless → trace → replay). Run it past the
   3-gate rule and record the verdict.
3. **Use the real framework** — Mesa for Python (Mesa-Geo for maps), NetLogo Web for live cards, JuPedSim
   for crowds. Not AgentPy (deprecated), not desmod, not a bespoke NumPy loop as the methodology.
4. **Use the Mesa 3 `AgentSet` API** for activation (`shuffle_do` / `do` / staged), not the removed
   pre-3.0 `Scheduler` classes.
5. **Collect both levels** of data (model + agent) via `DataCollector`; that series **is** your trace.
6. **Seed the RNG** so `(params, seed)` reproduces exactly — the trace is the source of truth.
7. **Pair live with Mesa** — give each live card its Mesa equivalent in the repo so the two engines teach
   engine-independence instead of confusing the learner.
8. **Record licenses** — every embedded NetLogo model and any dataset goes into
   [ATTRIBUTION.md](../../ATTRIBUTION.md) / [LICENSES.md](../../LICENSES.md); prefer CC0; author your own
   model when a license is restrictive.

---

## References (grounding)

This guide is grounded in the project's research and stack decisions. Tool-to-scenario mapping and the
two-lane fit follow the synthesis documents; the framework verdicts follow the ABM-frameworks research.

- **Frameworks (forward links):** [Mesa](../frameworks/mesa.md) · [Mesa-Geo](../frameworks/mesa-geo.md) ·
  [NetLogo Web](../frameworks/netlogo-web.md) · [JuPedSim](../frameworks/jupedsim.md) ·
  [NetworkX / OSMnx](../frameworks/networkx-osmnx.md)
- **Scenarios:** [S02 Schelling](../scenarios/s02-schelling.md) · [S03 SIR](../scenarios/s03-sir.md) ·
  [S05 Beer Game](../scenarios/s05-beer-game.md)
- **Architecture:** [ARCHITECTURE.md](../ARCHITECTURE.md) (two-lane design, 3-gate rule, trace contract).
- **Sibling problem-types:** [Discrete-Event Simulation](./discrete-event-simulation.md) ·
  [Optimization](./optimization.md).
- **Repo:** <https://github.com/fsantibanezleal/CAOS_SIMLAB>

Authoritative tool facts (license, scale, maturity, the SolaraViz-is-a-server caveat, the deprecation of
AgentPy) come from the ABM-frameworks research dimension; key upstream sources include Mesa (JOSS 2025,
<https://github.com/projectmesa/mesa>), Mesa-Geo (<https://github.com/projectmesa/mesa-geo>), NetLogo Web /
Tortoise (<https://github.com/NetLogo/Tortoise>), JuPedSim (<https://github.com/PedestrianDynamics/jupedsim>),
FLAME GPU 2 (<https://github.com/FLAMEGPU/FLAMEGPU2>), and the AgentPy deprecation note
(<https://agentpy.readthedocs.io/>).
