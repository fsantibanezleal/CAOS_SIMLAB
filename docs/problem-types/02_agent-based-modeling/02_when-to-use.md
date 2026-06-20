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
| **Engine** | [NetLogo Web](../../frameworks/07_netlogo-web.md) (Tortoise), or Pyodide-Mesa | [Mesa 3](../../frameworks/04_mesa.md) (or [Mesa-Geo](../../frameworks/05_mesa-geo.md)) **headless** |
| **Where it runs** | the visitor's browser (client-side JS/WASM) | offline, on the local box |
| **What ships** | static HTML/JS the host serves | a committed **seeded trace** the SPA **replays** |
| **Server compute** | none | none (it only serves the trace) |
| **Best for** | light, canonical models the learner tunes live | heavy / large-N / geo / crowd models too costly per-visitor |
| **Gate** | must pass the 4-gate rule (below) | anything that fails a live gate |

### The 4-gate rule

A scenario ships **live only if all three gates hold**; failing any one routes it to **precompute**. The gate
verdict and the *measured* numbers are recorded per-scenario, and CI rejects a "live" scenario that breaches a
gate:

1. **Pure-Python** (or NetLogo-JS) — the engine must run client-side (Pyodide wheels ⊆ the live closure, or a
   NetLogo model compiled to JS).
2. **< 3 s** — a single run completes within the live time budget in the browser.
3. **trace < ~1 MB** — the artifact a learner would download/animate stays small.

See [the gate](../../architecture/03_the-gate.md) for the exact `classify_lane` check and the live wheel
closure (including the measured fact that Mesa itself runs in Pyodide with `sqlite3`).

### The restatement that resolves the most common confusion

> *Mesa is never served live.* Mesa runs **headless → trace → replay**. NetLogo Web runs **live in the
> browser**. **Both put zero simulation compute on the server.**

The same model can appear in *both* lanes — an in-browser NetLogo card for instant play **and** a Mesa
notebook in the repo for "how to build it yourself" — which reinforces that the concept is **engine-
independent**. The house rule is to **pair each live card with its Mesa equivalent** so the two-engine setup
*teaches* rather than confuses. (Why Mesa cannot be the live public server at all — the SolaraViz =
one-Python-process-per-visitor hazard — is detailed in [04 · Tools](./04_tools.md).)

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
