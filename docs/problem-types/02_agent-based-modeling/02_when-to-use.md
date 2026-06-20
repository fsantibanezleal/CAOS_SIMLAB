# 02 · When to use ABM (and which lane it runs in)

← back to [Agent-Based Modeling](../02_agent-based-modeling.md)

Two decisions sit at the start of every ABM scenario, and getting either wrong wastes the build:

1. **Is this an ABM problem at all** — or is it really discrete-event simulation or optimization in disguise?
2. **Which execution lane** does it run in — **live** in the visitor's browser, or **precompute** offline with
   the trace replayed?

This page answers both.

---

## 1. Is it ABM? — the problem-type test

Use ABM when behavior is **distributed, heterogeneous, and adaptive**, and the question is *"what pattern will
these local rules produce?"* The macro outcome must be something you want to **observe emerge**, not something
you can write down in advance.

**Reach for ABM when:**

- The interesting object is a **global pattern that no individual intends** — segregation, an epidemic wave, a
  market crash, a traffic jam, the bullwhip effect.
- Agents are **heterogeneous** (different attributes / rules) and **local** (each sees only its neighborhood).
- Behavior is **adaptive** — an agent's action depends on what it currently perceives.
- You care about the **dynamics and the mechanism**, not a single optimal number.

**Do NOT reach for ABM when the model is really one of these:**

| If your model is really… | …then it's | Use instead |
|---|---|---|
| a **flow of entities through resources** (customers → tellers, patients → beds), advanced by an event calendar | Discrete-Event Simulation | **SimPy / Ciw / Salabim** — see [DES](../01_discrete-event-simulation.md) |
| a **prescriptive decision** (best routes, best schedule, best assignment) | Optimization | **OR-Tools / PyVRP** — see [Optimization & Routing](../03_optimization-routing.md) |
| **"how confident am I in this number across many seeds?"** | a replications study | **joblib + SciPy** — see [Monte-Carlo & Replications](../04_monte-carlo-replications.md) |

> **Not a methodology: "NumPy by hand."** Hand-rolling an agent loop in NumPy is fine as an *under-the-hood
> teaching aside* to show what a framework does for you, but it is **not** the lab's ABM approach. The lab uses
> real dedicated frameworks (Mesa / Mesa-Geo / NetLogo Web / JuPedSim) so the curriculum teaches transferable,
> real-world tools — see [04 · Tools](./04_tools.md).

### The boundary case: the Beer Game (S05)

The MIT **Beer Game** *looks* like a supply-chain queue — entities (orders, shipments) moving through
echelons with delays. So why is it [modeled as ABM](../../use-cases/05_s05_beergame.md), not as a DES queue
clone? Because **the interesting object is the feedback dynamic from local ordering policies**, not
entity-through-resource flow. Each echelon is an *agent* running a local order-up-to rule under information and
shipping **delays**; a modest one-off demand change is *amplified* into upstream oscillations — the **bullwhip
effect** — which is *emergent*. Nobody programs the bullwhip; it appears from the four agents interacting.
Model the object you care about: here that object is the policy/feedback loop, so it is ABM.

---

## 2. Which lane? — the two-lane fit

This is the architectural heart of ABM in this lab. There are **two lanes**, matching the product's two
execution modes, and each ABM scenario picks exactly one:

| | **LIVE lane** | **PRECOMPUTE lane** |
|---|---|---|
| **Engine** | [Mesa 3](../../frameworks/04_mesa.md) **in Pyodide** (the lab's ABM scenarios S02/S03/S05 — measured live), or [NetLogo Web](../../frameworks/07_netlogo-web.md) (Tortoise) | [Mesa 3](../../frameworks/04_mesa.md) (or [Mesa-Geo](../../frameworks/05_mesa-geo.md)) **headless** for heavy/large-N/geo ABM |
| **Where it runs** | the visitor's browser (Pyodide-WASM for Mesa, native JS for NetLogo) | offline, on the local box |
| **What ships** | the scenario code Pyodide runs live + a committed trace for instant first paint; or static NetLogo HTML | a committed **seeded trace** the SPA **replays** |
| **Server compute** | none | none (it only serves the trace) |
| **Best for** | light, canonical models the learner tunes live | heavy / large-N / geo / crowd models too costly per-visitor |
| **Gate** | must pass the 4-gate rule (below) | anything that fails a live gate |

### The 4-gate rule

A scenario ships **live only if all four gates hold**; failing any one routes it to **precompute**. The gate
verdict and the *measured* numbers are recorded per-scenario, and CI rejects a "live" scenario that breaches a
gate (this is the `classify_lane` AND in `simlab/core/scenario.py`):

1. **Pure-Python** (`pure_python = True`) — the engine must run client-side; native-code engines (OR-Tools)
   set this False because there is no WASM build (NetLogo Web is the JS alternative, off this Pyodide path).
2. **wheels ⊆ `LIVE_WHEELS`** — every wheel the scenario needs must be loadable by the live worker. Mesa
   qualifies: `mesa` (and `sqlite3`) are in `LIVE_WHEELS`, so the ABM scenarios import and run live.
3. **< 3 s** — a single run completes within the live time budget in the browser.
4. **trace < ~1 MB** — the artifact a learner would download/animate stays small.

See [the gate](../../architecture/03_the-gate.md) for the exact `classify_lane` check and the live wheel
closure (including the measured fact that Mesa itself runs in Pyodide with `sqlite3`).

### The restatement that resolves the most common confusion

> *Mesa's **SolaraViz server** is never served live* — what's never served is the per-visitor Python
> **process** SolaraViz would spawn. **Mesa itself runs live** in the visitor's browser via Pyodide-WASM (the
> ABM scenarios S02/S03/S05 — measured, inside the 3 s gate), and **also** ships a committed trace for instant
> first paint and offline replay. NetLogo Web is a second live engine (native JS, no Pyodide). Headless Mesa →
> trace → replay is reserved for **heavy / large-N / geo / crowd** ABM that fails a live gate (Mesa-Geo,
> JuPedSim). **All of these put zero simulation compute on the server.**

The same problem can be reached by *both* engines — Pyodide-Mesa running the real Python scenario live, and the
standalone NetLogo Web card for instant native-JS play (Schelling only today) — which reinforces that the
concept is **engine-independent**. (Why Mesa cannot be the live public *server* — the SolaraViz =
one-Python-process-per-visitor hazard, which is about the server, not the engine — is detailed in
[04 · Tools](./04_tools.md).)

---

## Next

- [03 · Methods & KPIs](./03_methods-and-kpis.md) — the canonical ABM methods and what each one measures.
- [04 · Tools](./04_tools.md) — pick the real engine for the lane you chose.
- [05 · Scenarios](./05_scenarios.md) — the three ABM scenarios + the build checklist.

## References (grounding)

- Architecture: [the gate](../../architecture/03_the-gate.md) · [live lane (Pyodide)](../../architecture/04_live-lane-pyodide.md) ·
  [precompute pipeline](../../architecture/05_precompute-pipeline.md) · [live-tool evaluation](../../architecture/06_live-tool-evaluation.md).
- Sibling problem-types: [DES](../01_discrete-event-simulation.md) · [Optimization & Routing](../03_optimization-routing.md) ·
  [Monte-Carlo & Replications](../04_monte-carlo-replications.md).
