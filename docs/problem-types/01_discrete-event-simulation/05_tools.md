# 05 · The DES toolbox (what to use for what)

> Part of the [Discrete-Event Simulation guide](../01_discrete-event-simulation.md). This page is the
> tool selector: which engine for which job, the honest limits of each, the reference-only tools, the
> deprecated ones to avoid, and the license summary.

Every tool below is a real, dedicated DES library — none of this is "advance a clock with a `for`-loop
and a list by hand". The recommendations and trade-offs come directly from the CAOS_SIMLAB DES-frameworks
research dimension and the healthcare-DES dimension.

| Tool | Role in the lab | Paradigm | License | Built-in viz | Live in browser? |
|---|---|---|---|---|---|
| [**SimPy**](../../frameworks/01_simpy.md) | **Primary engine + teaching default** | Process-interaction (generators + `yield`) | MIT | None (headless by design) | **Yes** — pure Python, runs in Pyodide |
| [**Ciw**](../../frameworks/02_ciw.md) | The queueing-theory lesson + analytic validation | Event-scheduling, queueing networks | MIT | None | Yes (pure Python) — used for the theory panel |
| [**Salabim**](../../frameworks/03_salabim.md) | Teaching counterpoint **+ offline animation/video** | Process-interaction (no `yield` needed) + OO | MIT | **Yes, 2D/3D** (tkinter desktop + mp4/gif export) | **No** (tkinter desktop GUI) → local/offline only |

Reference-only (great to know, not dependencies of this lab):

| Tool | What it is | Why reference-only |
|---|---|---|
| **JaamSim** | Excellent open-source (Apache-2.0) drag-drop block/flow DES with interactive 3D (OpenGL) | Java desktop app, not Python-embeddable; needs a JVM + GPU/driver. A good *reference* for "what a commercial-grade GUI looks like", but it cannot run in our browser/Pyodide stack. |
| **AnyLogic** | The commercial gold standard — unifies DES + ABM + System Dynamics with polished 2D/3D | Proprietary, heavy, Java desktop. It is the conceptual *bar* (multi-method + slick 3D), not something we ship. |

> **Deprecated — do not use.** `desmod` (a thin SimPy structuring layer, near-dormant since ~2019) and
> `AgentPy` (an ABM library) show up in older simulation tutorials but are deprecated and excluded from
> this lab. If you see them recommended elsewhere, ignore it. For DES use **SimPy / Ciw / Salabim**; for
> ABM use **Mesa / Mesa-Geo / NetLogo Web** (see the [ABM guide](../02_agent-based-modeling.md)).

## Why SimPy is the primary engine

[**SimPy**](https://simpy.readthedocs.io/) (MIT, latest 4.1.2) is the de-facto standard for DES in
Python, and it is the right choice here for reasons that stack up perfectly with the lab's architecture:

- **Pure Python, zero dependencies.** It runs trivially on a GPU-less machine and — critically — it
  **runs inside Pyodide in a Web Worker**, so light DES scenarios are genuinely *live in the browser*.
- **The canonical teaching style.** Its process-interaction model (a Python generator that `yield`s a
  `timeout` or a resource `request`) reads like the entity's life-story; it is the most-cited, most-
  tutorialised DES engine, so what the learner masters here transfers everywhere. The shape is on the
  [Methods & KPIs page](./03_methods-and-kpis.md#process-interaction-in-practice-the-simpy-shape).
- **It has no built-in animation — and that is a feature.** SimPy emits a structured **event trace**
  `[{t, entity, kind, from, to, state}]`; the *pixels* are owned by the front end (React over the
  shared `<VizCanvas>`, using a queue-network renderer for DES). The engine stays the headless physics;
  the browser owns the animation. This keeps the teaching code idiomatic and the rendering modern.

> **Honest limit — the speed ceiling.** Pure-Python DES is roughly **10–20× slower than a C++ engine**
> on a heavy benchmark (e.g. M/M/1 with ~500k arrivals), and it degrades further as queues grow. This
> is *fine* for light, interactive scenarios (seconds of compute, thousands of events) and is precisely
> why heavy work — long horizons, large fleets, many replications — goes to the **precompute lane** and
> ships as a committed trace, never as a live in-browser run. The
> [gate](../../architecture/03_the-gate.md) (pure-Python AND < 3 s AND < ~1 MB trace) enforces this
> automatically; CI fails the build if a scenario tagged "live" breaches a gate.

## Why Ciw for the queueing lesson

[**Ciw**](https://ciw.readthedocs.io/) (MIT) is a dedicated **queueing-network** simulator built around
the event-scheduling worldview, with first-class support for multi-class networks, routing between
nodes, and **blocking** (finite buffers). Its unique didactic value is that the canonical queueing
models it simulates have **closed-form analytical solutions** — so you can run the simulation *and* the
math side-by-side and watch them converge.

That is the strongest "**does my sim match theory?**" move available, and it is exactly what scenario
[**S01**](../../use-cases/01_s01_queue.md) uses: a SimPy M/M/c queue is overlaid with the **closed-form
M/M/c** waiting-time and queue-length (the Erlang-C result), so the learner literally sees the simulated
average converge to the theoretical one as replications accumulate. Ciw provides the analytic reference;
SimPy drives the live animation. Pairing a simulation against an exact answer is the most credible
validation a learner can witness — when one *exists*, which is precisely the queueing-theory regime Ciw
covers.

> **Honest limit.** Closed-form queueing results only exist for idealised assumptions (Poisson arrivals,
> exponential service, specific disciplines). The moment a model adds priority classes, non-stationary
> arrivals, or multi-stage flow with shared resources (i.e. the real [**S04**](../../use-cases/04_s04_ed.md)
> ED model), *no* closed form exists and replicated simulation becomes the only honest measure. That
> transition — from "check against theory" to "theory ran out, now trust the CI" — is itself a deliberate
> lesson in the ramp from S01 to S04.

## Why Salabim is desktop-only (and where it still earns its place)

[**Salabim**](https://www.salabim.org/) (MIT) is a capable process-interaction DES whose headline
feature is **built-in 2D/3D animation**. Two honest facts decide its role here:

- **Its animation is rendered with tkinter (a desktop GUI).** It produces a live desktop window or an
  exported video — it **cannot be embedded in a web app**, and there is no display server on a static
  host. So Salabim's animation *does not* and *cannot* replace the React viewer for the live lane.
- **It is an excellent offline movie-maker.** Salabim can export `.mp4` / `.gif` (including headless via
  `blind_animation=True` / a virtual display), which is a clean fit for the **precomputed lane**: render
  a ready-made replay video offline on the local machine for a heavy scenario, alongside the committed
  trace.

So Salabim earns a **teaching chapter** (zero-to-animation in pure Python, fast visual feedback for the
modeller) and an **offline-render utility** — but it never touches the live web build. The recurring
question — "does Salabim's built-in animation change the live build?" — resolves to: **no for live (it
can't go in the browser), yes for offline videos.**

## Per-framework deep dives

This page is the selector; the implementation detail for each engine lives in its own node:

- [SimPy](../../frameworks/01_simpy/02_usage.md) — the process-interaction model, `Resource` /
  `PriorityResource`, emitting the event trace, seeding, and running live under Pyodide.
- [Ciw](../../frameworks/02_ciw/02_usage.md) — building a queueing network, the closed-form M/M/c
  reference, and the sim-vs-theory validation panel.
- [Salabim](../../frameworks/03_salabim/02_usage.md) — the teaching counterpoint and the **offline**
  `.mp4` / `.gif` render pipeline (desktop/headless only — never the web build).

## License & attribution summary

All DES tools used in the lab are permissive and mutually compatible:

| Tool | License |
|---|---|
| SimPy | MIT |
| Ciw | MIT |
| Salabim | MIT |
| JaamSim *(reference-only)* | Apache-2.0 |
| AnyLogic *(reference-only)* | Proprietary |

See [`LICENSES.md`](../../../LICENSES.md) and [`ATTRIBUTION.md`](../../../ATTRIBUTION.md). Repo:
<https://github.com/fsantibanezleal/CAOS_SIMLAB>.

## Next

- [06 · Scenarios](./06_scenarios.md) — how these three engines map onto the lab's scenarios, the
  optimize-then-simulate bridge, and the live-vs-precomputed verdict per scenario.
- Back to the [DES section index](../01_discrete-event-simulation.md).

### Sources

This selector is grounded in the CAOS_SIMLAB research and synthesis:

- SimPy (MIT, 4.1.2, pure Python): <https://simpy.readthedocs.io/> · PyPI:
  <https://pypi.org/project/simpy/>
- Ciw (MIT, queueing networks + blocking): <https://ciw.readthedocs.io/> · paper (J. Simulation, 2018):
  <https://www.tandfonline.com/doi/full/10.1080/17477778.2018.1473909>
- Salabim (MIT, 2D/3D animation via tkinter + mp4/gif export): <https://www.salabim.org/> ·
  Animation manual (headless `blind_animation`): <https://www.salabim.org/manual/Animation.html> ·
  JOSS paper: <https://joss.theoj.org/papers/10.21105/joss.00767>
- JaamSim (Apache-2.0, Java desktop, interactive 3D): <https://jaamsim.com/>
- AnyLogic (commercial, multi-method bar): <https://www.anylogic.com/>
- SimPy-vs-C++ performance discussion (the 10–20× speed ceiling):
  <https://www.linkedin.com/posts/harry-king-6987a61a_this-result-confirms-that-simpy-is-too-slow-activity-7108307584100564992-JV6a>
