# 04 · Tools — the honest map

← back to [Agent-Based Modeling](../02_agent-based-modeling.md)

There is no single "best" ABM tool; the right choice depends on **where the model runs** (a learner's browser
vs. an offline precompute box) and **how big** it is. This lab makes the choice explicitly and lives with the
trade-offs the research surfaced. Every verdict here (license, scale, maturity, the SolaraViz caveat, the
deprecations) comes from the project's ABM-frameworks research — see [References](#references-grounding).

---

## 1. The default: Mesa 3 (Python)

**[Mesa 3](../../frameworks/04_mesa.md)** is the canonical Python teaching framework and the lab's default ABM
engine.

- **License:** Apache-2.0. **Maturity:** the de-facto Python standard, actively maintained, JOSS-published
  (2025); the resolved version is **3.5.1**.
- **Why it teaches well:** its `Agent` / `Model` / space / `AgentSet` abstractions map one-to-one onto the
  four ingredients — so learning Mesa *is* learning ABM, not learning a framework's quirks.
- **Scale:** comfortable at **10³–10⁵ agents**. It is object-per-agent, so it bogs down past ~10⁵; if a
  scenario genuinely needs more, route it to the GPU/vectorized lane (§5) rather than fighting Mesa.

### The trade-off you must internalize: Mesa is not a web-serving engine

Mesa's only first-class visualization is **SolaraViz**, which is a *stateful Python (Solara) server bound to a
localhost port*. That is excellent for local teaching and notebooks and **wrong** for a public static site: it
would be **one live Python process per visitor** — impossible on the static deploy (GitHub Pages, no backend), and a scaling and abuse hazard anywhere.
**Do not run SolaraViz as a public live server.**

So Mesa is used in **two roles**, never as a live public server:

1. **The curriculum** — the from-zero ABM tutorials and the repo examples are written in Mesa because the
   abstractions are the lesson.
2. **Headless precompute** — heavy ABM scenarios run Mesa *headless* in the offline pipeline, record their
   trajectories to a compact seeded trace, and the SPA **replays** them. This is the same "local compute →
   committed artifact → static viewer" pattern as the rest of CAOS.

> Read more in the Mesa node: [installation](../../frameworks/04_mesa/01_installation.md) ·
> [usage](../../frameworks/04_mesa/02_usage.md) · [applying](../../frameworks/04_mesa/03_applying.md).

---

## 2. The live-in-browser engine: NetLogo Web (Tortoise)

For scenarios that must **run live in the visitor's browser** with editable sliders and real-time animation,
the lab uses **[NetLogo Web](../../frameworks/07_netlogo-web.md)** (the *Tortoise* engine).

- **Why it fits the architecture perfectly:** NetLogo compiles its Logo-family DSL **to JavaScript** and runs
  **entirely client-side**. You export a model to standalone HTML / the `netlogo-engine.js` runtime, strip the
  IDE chrome, and embed it. The static host serves files only — **zero server compute**, no Python process,
  effectively unbounded concurrency. This is the cleanest way to honor "enter → straight to a running
  simulator" on a no-server host.
- **Didactic depth:** NetLogo owns the world's largest curated teaching Models Library (Schelling, SIR,
  Wolf–Sheep, Fire, Flocking).
- **Scale:** ~10³–10⁴ agents in-browser — fine for canonical on-ramp models, not for large-N.
- **License nuance you must record:** the engine is open source, but the **Models Library is mixed** — *Code
  Examples* are CC0, while many full models are **CC BY-NC-SA** (noncommercial). House rule: record each
  embedded model's license in [ATTRIBUTION.md](../../../ATTRIBUTION.md), **prefer CC0 examples**, and **author
  our own NetLogo models** where a license is restrictive.

> **Pyodide-Mesa is an *alternative* live path** (run pure-Python Mesa in a Pyodide Web Worker, post frames to
> Canvas2D). NetLogo Web is preferred for the canonical cards because it is purpose-built for the browser and
> carries no Pyodide cold-start tax. Either way the rule is the same: **light + client-side**. See the
> [live-tool evaluation](../../architecture/06_live-tool-evaluation.md) for what was measured per engine.

---

## 3. Real maps: Mesa-Geo

When geography is part of the model — agents on a real road network, demand over a city — use
**[Mesa-Geo](../../frameworks/05_mesa-geo.md)** (Apache-2.0). It adds **GeoAgents** with real geometry
(Shapely/GeoPandas) and a Leaflet/Solara map. Unlike plain Mesa (which runs **live** in Pyodide — see below),
Mesa-Geo's GeoPandas/Shapely closure is heavier, so a geo ABM would **precompute** here: run it headless,
commit the rendered paths, and the SPA replays them on a deck.gl/MapLibre map (no scenario ships Mesa-Geo
yet). For the routing/dispatch scenarios, the *spatial
graph* work is typically done with [NetworkX](../../frameworks/10_networkx.md) /
[OSMnx](../../frameworks/11_osmnx.md) and the agent layer kept simple — see
[Optimization & Routing](../03_optimization-routing.md).

---

## 4. Crowd / pedestrian flow: JuPedSim

For **pedestrian and crowd dynamics** — emergency-department crowding, evacuation, flow through a floor plan —
use **[JuPedSim](../../frameworks/06_jupedsim.md)** (LGPLv3, pip-installable). It implements validated
**social-force** and **collision-free-speed** pedestrian models behind a clean **Python API**, so it drops
straight into the offline pipeline: run it headless, emit trajectories, replay them. It was chosen over Vadere
specifically because Vadere is a Java/GUI tool with integration friction, whereas JuPedSim is a library.
Pedestrian flow is a **precompute** scenario (trajectories → replay), never a live in-browser sim.

---

## 5. Heavy / GPU lane (advanced chapter, not v1 runtime)

When a model genuinely needs **10⁵–10⁸ agents**, object-per-agent Mesa is the wrong tool and you move to a
vectorized or GPU engine. The research evaluated three; all are **precompute-only** (they produce artifacts the
lab replays — none ever runs on the live (Pages) deploy). The full write-up is the
**[GPU-ABM chapter](../../frameworks/18_gpu-abm-chapter.md)**:

- **FLAME GPU 2** — CUDA message-passing on a single GPU, Python bindings, million-agent scale. The most
  powerful but the most brittle (CUDA/driver pinning required; documented 8 GB-VRAM OOM on laptop-class GPUs).
  It is **cut from the v1 runtime stack and kept as a teaching chapter** — its results, if used, must ship as
  fully reproducible committed artifacts because the static deploy (GitHub Pages, no backend) can never recompute them.
- **ABMax (JAX)** — vectorized `vmap` + JIT; a lighter GPU/CPU alternative when CUDA setup is painful.
- **AMBER (Polars)** — columnar **CPU** accelerator (reported up to ~1000× Mesa on large SIR); big sims
  without a GPU at all.

> **The honest verdict on "heavy."** The highest-ROI heavy use of compute is **not** one giant agent
> population but **thousands of independent seeded replications** (a Monte-Carlo / confidence-interval study),
> which runs in seconds on ordinary CPU cores via `joblib`. So large-N GPU ABM is a post-v1 stretch, while the
> replications study ships as CPU precompute. See [Monte-Carlo & Replications](../04_monte-carlo-replications.md).

---

## 6. Deprecated — do not use

- **AgentPy** — *deprecated; do not adopt.* Its own authors now point users to Mesa. It has pleasant Jupyter
  ergonomics, but building on it is a dead end. Cite it only as historical context.
- **desmod** — unmaintained; **do not use.** (It is a DES helper, listed here only because it sometimes appears
  in ABM/DES tooling lists.)

> **Also not a methodology — "NumPy by hand."** Hand-rolling an agent loop in NumPy is fine as an
> *under-the-hood teaching aside* to show what a framework does for you, but it is **not** the lab's ABM
> approach. The lab uses real dedicated frameworks (Mesa / Mesa-Geo / NetLogo Web / JuPedSim) so the
> curriculum teaches transferable, real-world tools.

---

## 7. Tools NOT for ABM (use the right problem-type)

ABM models *agents and emergence*. If your model is really a flow of entities through resources, that is DES —
use **SimPy** / **Ciw** / **Salabim** (see [DES](../01_discrete-event-simulation.md)). If it is a prescriptive
decision (best routes, best schedule), that is optimization — use **OR-Tools** / **PyVRP** (see
[Optimization & Routing](../03_optimization-routing.md)). The **Beer Game (S05)** is the useful boundary case: it
*looks* like a supply-chain queue but is modeled as **ABM**, because the interesting object is the *feedback
dynamics from local ordering policies*, not entity-through-resource flow — see
[02 · When to use](./02_when-to-use.md).

---

## Tool-at-a-glance

| Tool | Lane here | Scale | License | Use it for |
|---|---|---|---|---|
| [Mesa 3](../../frameworks/04_mesa.md) | **live** (Pyodide) | 10³–10⁵ | Apache-2.0 | the ABM curriculum (s02/s03/s05 run live) + headless heavy ABM |
| [NetLogo Web](../../frameworks/07_netlogo-web.md) | live (default) | 10³–10⁴ | OSS (models mixed CC0 / CC BY-NC-SA) | instant in-browser classic cards |
| [Mesa-Geo](../../frameworks/05_mesa-geo.md) | precompute | 10³–10⁵ | Apache-2.0 | real-map / GeoAgent models |
| [JuPedSim](../../frameworks/06_jupedsim.md) | precompute | crowd-scale | LGPLv3 | pedestrian / evacuation flow |
| [GPU-ABM chapter](../../frameworks/18_gpu-abm-chapter.md) | precompute (reference) | 10⁵–10⁸ | mixed | large-N reference only, not v1 runtime |
| AgentPy / desmod | — | — | — | **deprecated — do not use** |

---

## Next

- [05 · Scenarios](./05_scenarios.md) — the three ABM scenarios + the build checklist.

## References (grounding)

Authoritative tool facts (license, scale, maturity, the SolaraViz-is-a-server caveat, the deprecation of
AgentPy) come from the ABM-frameworks research dimension; key upstream sources include Mesa (JOSS 2025,
<https://github.com/projectmesa/mesa>), Mesa-Geo (<https://github.com/projectmesa/mesa-geo>), NetLogo Web /
Tortoise (<https://github.com/NetLogo/Tortoise>), JuPedSim (<https://github.com/PedestrianDynamics/jupedsim>),
FLAME GPU 2 (<https://github.com/FLAMEGPU/FLAMEGPU2>), and the AgentPy deprecation note
(<https://agentpy.readthedocs.io/>). Lane verdicts follow the [architecture wiki](../../architecture/01_overview.md);
data-policy and embedded-model licenses are recorded in [ATTRIBUTION.md](../../../ATTRIBUTION.md) /
[LICENSES.md](../../../LICENSES.md).
