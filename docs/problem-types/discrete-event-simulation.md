# Discrete-Event Simulation (DES)

> Part of the CAOS_SIMLAB problem-type guides. This page is the decision map for the **discrete-event
> simulation** half of the lab: what DES actually is, when to reach for it, which engine to use for
> what, and — the part most tutorials skip — how to read its results *honestly*, because a single
> simulation run is a noisy sample, not an answer.

Where the [Optimization & Routing](./optimization-routing.md) guide covers *deciding* something about a
system and the [Agent-Based Modeling](./agent-based-modeling.md) guide covers *emergence* from many
interacting agents, this guide covers the workhorse of operations research: modelling a system as a
stream of **events that change state at discrete instants in time** — a customer arrives, a server
becomes free, a machine breaks down — and measuring how the system behaves between those instants.

The single most important lesson on this page, and the reason every DES scenario in the lab carries a
replications-and-confidence-interval story rather than a single pretty animation, is this:

> **One run tells you almost nothing.** A discrete-event model is a *stochastic* machine: feed it a
> different random seed and the average waiting time, the maximum queue, the resource utilization all
> move. The job of DES is not to produce one number to animate; it is to produce a *distribution* you
> can reason about — with confidence intervals, and with the start-up transient removed.

---

## 1. What discrete-event simulation is

A discrete-event simulation advances time by **jumping from event to event**, not by ticking a fixed
clock. Nothing in the model changes *between* events, so there is no reason to simulate the gaps — you
leap straight to the next thing that happens. This is what makes DES efficient for systems that are
mostly "waiting": queues, service desks, hospitals, factories, road networks.

Five concepts make up the whole vocabulary:

- **Entities** — the things that flow through the system and carry state: customers, patients, trucks,
  jobs, parts. They are created (arrive), move between activities, and eventually leave (depart).
- **Resources** — the limited things entities compete for: tellers, nurses, treatment bays, machines,
  loaders. An entity that needs a busy resource must **wait in a queue**.
- **Events** — instantaneous state changes scheduled at a specific simulated time: "arrival", "service
  complete", "breakdown", "shift change". Each event can schedule future events.
- **The future-event list (FEL)** — the engine's beating heart: a time-ordered queue of all events that
  are scheduled but have not yet happened. The simulation loop is simply *pop the earliest event,
  advance the clock to its time, execute it (which may schedule more events), repeat* until the clock
  reaches the horizon or the list empties.
- **The simulated clock** — a single number holding "now" in simulated time. It has nothing to do with
  wall-clock time: a model can simulate a 24-hour hospital day in milliseconds, or a millisecond-scale
  network in minutes, depending on event density.

### Two worldviews: process-interaction vs event-scheduling

There are two classic ways to *write* a DES model, and the engine you pick effectively chooses one for
you:

- **Process-interaction** — you describe the **life-story of one entity** as a procedure that
  alternates *doing things* and *waiting*: "arrive, request a nurse, hold for the treatment time,
  release the nurse, depart". The engine runs many such processes concurrently and handles the FEL
  bookkeeping invisibly. This is by far the more readable, teachable style, and it is exactly what
  **SimPy** gives you with Python generators and the `yield` keyword — each `yield` is a point where
  the process *waits* (for a timeout, for a resource) and hands control back to the engine.
- **Event-scheduling** — you describe the system as a set of **event handlers** (an "arrival routine",
  a "departure routine") that directly insert future events into the FEL. It is lower-level and closer
  to the engine mechanics; it can be faster and is natural for pure **queueing networks**, which is the
  style **Ciw** uses internally.

CAOS_SIMLAB teaches the **process-interaction** worldview first (it reads like a story and matches how
people describe systems), and uses the event-scheduling view as the bridge to queueing *theory* in the
Ciw lesson. Both produce identical dynamics; they are two ways of writing the same FEL-driven clock.

---

## 2. When to use DES (and when not to)

Reach for discrete-event simulation when **all** of these hold:

- the system is naturally described as **entities flowing through activities and queues**;
- **resources are limited** and contention (waiting) is the thing you care about;
- **randomness matters** — arrivals and service times are variable, not fixed;
- you want **operational KPIs over time** (throughput, waiting, utilization), not a single optimal
  decision.

Reach for a **different method** when:

- the question is "what is the *best* schedule / route / allocation?" → that is **optimization**
  ([OR-Tools / PyVRP](./optimization-routing.md)). DES *evaluates* a plan under uncertainty; it does not
  search for the best one. The two combine in the **optimize-then-simulate** pattern (§7).
- the behaviour you care about **emerges from many peers interacting locally** (segregation, contagion,
  flocking) → that is **agent-based modeling** ([Mesa / NetLogo](./agent-based-modeling.md)).
- the system has **no meaningful queues or discrete events** and is well described by aggregate rates
  and stocks → that is system dynamics / a differential-equation model, out of scope here.

A useful tell: if you find yourself drawing boxes-and-arrows where things *wait in line for a shared
resource*, it is a DES.

---

## 3. KPIs — what a DES actually measures

A DES is only as good as the quantities you pull out of it. The canonical operational KPIs:

- **Utilization (ρ)** — the fraction of time a resource is busy. For a server pool of `c` servers with
  arrival rate λ and per-server service rate μ, `ρ = λ / (c·μ)`. The system is only stable when ρ < 1;
  as **ρ → 1 the queue blows up nonlinearly** — this is the headline lesson of scenario **S01**.
- **Waiting time / time in system** — how long an entity queues before service (`Wq`) and total
  sojourn time (`W`). These are the numbers a manager actually feels.
- **Queue length** — entities waiting (`Lq`) and entities in the system (`L`).
- **Throughput** — completed entities per unit time; in steady state it equals the effective arrival
  rate.

### Little's Law — the one identity to know

For any stable system in steady state, regardless of the arrival or service distribution:

```text
L = λ · W            (entities in system = arrival rate × time in system)
Lq = λ · Wq          (the same, restricted to the queue)
```

Little's Law is the cheapest sanity check in all of simulation: measure any two of `L`, `λ`, `W` and the
third is forced. If your simulated `L` and `λ·W` disagree, your model — or your measurement window — is
wrong. The lab uses it as a built-in validation gate in **S01**.

---

## 4. The honesty curriculum (the part most demos skip)

This is the spine of the whole DES half of CAOS_SIMLAB, and it follows directly from the healthcare-DES
research: the *classic beginner bug* is reporting a single run, with one seed, and no warm-up. The lab
refuses to ship that.

1. **A single run is a noisy sample.** Each simulated day is one draw from a random process. Change the
   seed and every KPI moves. Reporting one run's average waiting time as "the answer" is like reporting
   one coin-flip as "the probability of heads".

2. **Replications + confidence intervals.** The honest output is **N independent replications** (each
   with its own seed), summarised as a **mean with a confidence interval**. The CI width tells you how
   much you can trust the number; halving it costs ~4× the replications. The lab bakes this in from day
   one — see scenario **S10**, which takes the **S01/S04** models and runs **thousands of seeds** to
   draw CI envelopes *beside* the naive single-run answer, so the learner sees exactly how misleading
   one run can be.

3. **Transient (initialization) bias.** A simulation usually starts **empty and idle** — no queue, all
   resources free — which is *not* the steady state it converges to. The early measurements are biased
   low. The fix is a **warm-up period**: discard the initial transient and only start collecting
   statistics once the system has settled. Choosing the warm-up cut length (e.g. by Welch's method, or
   simply by eyeballing when the running mean flattens) is itself a taught skill.

4. **Determinism is the contract.** The same `(params, seed)` must reproduce the same trace, exactly.
   That is what makes a committed precomputed run trustworthy and what lets the front end *replay*
   rather than *recompute* — the lab's [replay = truth](../ARCHITECTURE.md) discipline.

5. **An animation is a hypothesis generator, not evidence.** Watching entities flow is invaluable for
   building intuition and catching gross modelling errors, but the *claim* must come from the
   replicated statistics, never from "it looked busy". Each scenario carries a **STRESS-DES model card**
   (a 20-item DES reporting checklist) so its assumptions and outputs are auditable.

> If you take one thing from this lab: **report a distribution with a CI, after a warm-up — never a
> single run.** Everything else is decoration.

---

## 5. The DES toolbox (what to use for what)

Every tool below is a real, dedicated DES library — none of this is "advance a clock with a `for`-loop
and a list by hand". The recommendations and trade-offs come directly from the CAOS_SIMLAB DES-frameworks
research dimension (research report 01) and the healthcare-DES dimension (research report 04).

| Tool | Role in the lab | Paradigm | License | Built-in viz | Live in browser? |
|---|---|---|---|---|---|
| **SimPy** | **Primary engine + teaching default** | Process-interaction (generators + `yield`) | MIT | None (headless by design) | **Yes** — pure Python, runs in Pyodide |
| **Ciw** | The queueing-theory lesson + analytic validation | Event-scheduling, queueing networks | MIT | None | Yes (pure Python) — used for the theory panel |
| **Salabim** | Teaching counterpoint **+ offline animation/video** | Process-interaction (no `yield` needed) + OO | MIT | **Yes, 2D/3D** (tkinter desktop + mp4/gif export) | **No** (tkinter desktop GUI) → local/offline only |

Reference-only (great to know, not dependencies of this lab):

| Tool | What it is | Why reference-only |
|---|---|---|
| **JaamSim** | Excellent open-source (Apache-2.0) drag-drop block/flow DES with interactive 3D (OpenGL) | Java desktop app, not Python-embeddable; needs a JVM + GPU/driver. A good *reference* for "what a commercial-grade GUI looks like", but it cannot run in our browser/Pyodide stack. |
| **AnyLogic** | The commercial gold standard — unifies DES + ABM + System Dynamics with polished 2D/3D | Proprietary, heavy, Java desktop. It is the conceptual *bar* (multi-method + slick 3D), not something we ship. |

> **Deprecated — do not use.** `desmod` (a thin SimPy structuring layer, near-dormant since ~2019) and
> `AgentPy` (an ABM library) show up in older simulation tutorials but are deprecated and excluded from
> this lab. If you see them recommended elsewhere, ignore it. For DES use **SimPy / Ciw / Salabim**; for
> ABM use **Mesa / Mesa-Geo / NetLogo Web** (see the [ABM guide](./agent-based-modeling.md)).

### Why SimPy is the primary engine

[**SimPy**](https://simpy.readthedocs.io/) (MIT, latest 4.1.2) is the de-facto standard for DES in
Python, and it is the right choice here for reasons that stack up perfectly with the lab's architecture:

- **Pure Python, zero dependencies.** It runs trivially on a GPU-less machine and — critically — it
  **runs inside Pyodide in a Web Worker**, so light DES scenarios are genuinely *live in the browser*.
- **The canonical teaching style.** Its process-interaction model (a Python generator that `yield`s a
  `timeout` or a resource `request`) reads like the entity's life-story; it is the most-cited, most-
  tutorialised DES engine, so what the learner masters here transfers everywhere.
- **It has no built-in animation — and that is a feature.** SimPy emits a structured **event trace**
  `[{t, entity, kind, from, to, state}]`; the *pixels* are owned by the front end (React over the
  shared `<VizCanvas>`, using a queue-network renderer for DES). The engine stays the headless physics;
  the browser owns the animation. This keeps the teaching code idiomatic and the rendering modern.

> **Honest limit — the speed ceiling.** Pure-Python DES is roughly **10–20× slower than a C++ engine**
> on a heavy benchmark (e.g. M/M/1 with ~500k arrivals), and it degrades further as queues grow. This
> is *fine* for light, interactive scenarios (seconds of compute, thousands of events) and is precisely
> why heavy work — long horizons, large fleets, many replications — goes to the **precompute lane** and
> ships as a committed trace, never as a live in-browser run. The [3-gate
> rule](../ARCHITECTURE.md#the-3-gate-rule-simlabcorescenariopy) (pure-Python AND < 3 s AND < ~1 MB
> trace) enforces this automatically; CI fails the build if a scenario tagged "live" breaches a gate.

### Why Ciw for the queueing lesson

[**Ciw**](https://ciw.readthedocs.io/) (MIT) is a dedicated **queueing-network** simulator built around
the event-scheduling worldview, with first-class support for multi-class networks, routing between
nodes, and **blocking** (finite buffers). Its unique didactic value is that the canonical queueing
models it simulates have **closed-form analytical solutions** — so you can run the simulation *and* the
math side-by-side and watch them converge.

That is the strongest "**does my sim match theory?**" move available, and it is exactly what scenario
**S01** uses: a SimPy M/M/c queue is overlaid with the **closed-form M/M/c** waiting-time and
queue-length (the Erlang-C result), so the learner literally sees the simulated average converge to the
theoretical one as replications accumulate. Ciw provides the analytic reference; SimPy drives the live
animation. Pairing a simulation against an exact answer is the most credible validation a learner can
witness — when one *exists*, which is precisely the queueing-theory regime Ciw covers.

> **Honest limit.** Closed-form queueing results only exist for idealised assumptions (Poisson arrivals,
> exponential service, specific disciplines). The moment a model adds priority classes, non-stationary
> arrivals, or multi-stage flow with shared resources (i.e. the real **S04** ED model), *no* closed
> form exists and replicated simulation becomes the only honest measure. That transition — from "check
> against theory" to "theory ran out, now trust the CI" — is itself a deliberate lesson in the ramp from
> S01 to S04.

### Why Salabim is desktop-only (and where it still earns its place)

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
modeller) and an **offline-render utility** — but it never touches the live web build. The brief's
recurring question — "does Salabim's built-in animation change the live build?" — resolves to: **no for
live (it can't go in the browser), yes for offline videos.**

---

## 6. Process-interaction in practice (the SimPy shape)

The whole process-interaction worldview fits in a few lines, and reading them is the fastest way to
internalise the FEL/clock model. A SimPy process is a Python generator; each `yield` is a point where
the entity *waits* and the engine advances the clock:

```python
import simpy

def patient(env, name, nurses, treat_time):
    arrive = env.now
    with nurses.request() as req:      # join the queue for a nurse (a Resource)
        yield req                      # WAIT here until a nurse is free  (FEL handles it)
        wait = env.now - arrive        # measured waiting time
        yield env.timeout(treat_time)  # HOLD the nurse for the treatment duration
    # leaving the `with` block releases the nurse; the next waiting patient is served
```

`nurses` is a `simpy.Resource(env, capacity=c)` — the limited resource that creates the queue. The two
`yield`s are the only places the entity gives time back to the engine; everything else is instantaneous
state change. Many `patient` processes run "concurrently", but the FEL serialises them onto a single
simulated clock. This is the entire mental model — the lab's engine wraps it with seeding, a trace
schema, and the live/precompute gate (`simlab/core/`), and each scenario module
(`simlab/scenarios/sNN_*.py`) is a variation on it.

---

## 7. The optimize-then-simulate bridge

DES is the *evaluation* half of the lab's headline pattern. An optimizer (OR-Tools, PyVRP, CP-SAT, GLOP)
proposes a plan on **deterministic** inputs; a **SimPy** DES then runs that plan under **stochastic**
conditions and reports the *distribution* of real outcomes. The optimizer proposes; the simulator
disposes.

This is where DES forms the "simulate" leg of the hybrid scenarios:

- **S07 (construction haul routing)** and **S09 (ambulance dispatch)** — an OR-Tools plan over a road
  graph is fixed offline; a **SimPy** model then replays trucks / ambulances under stochastic
  load/dump/delay and stochastic call streams, producing cycle-time and response-time distributions. The
  *DES leg* of each is pure SimPy.
- **S08 (VRP/VRPTW)** — optimized routes are handed to a SimPy replay that injects travel-time noise and
  reports time-window violations: "an optimum on paper is fragile under uncertainty."

The full optimization side, the mandatory `GUIDED_LOCAL_SEARCH` + time-limit + seed template, and the
simheuristic story live in the [Optimization & Routing guide](./optimization-routing.md). Determinism is
the contract on both legs: seed the solver *and* the SimPy RNG so every committed run reproduces exactly.

---

## 8. Where DES runs: mostly live, sometimes precomputed

Unlike the optimization tools (native C++ → always precompute), **SimPy is pure Python and clears the
engine gate**, so light DES scenarios run **live in the Pyodide Web Worker** with editable params and
real-time animation. A DES scenario falls back to the precompute lane only when it breaches the **time**
or **trace** gate — long horizons, large entity counts, or many replications:

- **Live (in-browser):** S01 (bank/clinic queue), S04 (ED patient flow), and the *DES base model* used
  inside S10. Move a slider, SimPy re-runs in the Worker, the queue-network animates.
- **Precomputed (committed trace, replayed):** the heavy SimPy legs of S07/S09 (large graphs, many
  trucks/calls), and S10's **thousands-of-replications** Monte-Carlo study — computed offline (CPU via
  joblib; an optional CuPy/Numba GPU exhibit) and committed as a CI-envelope artifact, then replayed
  under the *"precomputed due to cost; full pipeline in the repo"* banner.

The verdict and the measured numbers for each scenario live in its manifest; the gate is structural, so
a heavy run can never accidentally ship as "live".

---

## 9. Scenario map

How the DES tools above map onto the lab's scenarios. See the full [scenarios catalog](../scenarios.md)
for the complete set.

| Scenario | DES engine | Validation / theory | Lane | What it teaches |
|---|---|---|---|---|
| **S01 — Bank / Clinic Queue (M/M/c)** | **SimPy** (process-interaction) | **Ciw** closed-form M/M/c overlay (Erlang-C) | live | The DES "hello world": arrivals, a server pool, a queue, utilization ρ, Little's Law, and **sim-converges-to-theory** validation. Folds in the ρ→1 utilization blow-up. |
| **S04 — Emergency Department Patient Flow** | **SimPy** (multi-stage, priority queue) | no closed form → **replications + CI** | live | Non-stationary Poisson arrivals, priority triage, resource-limited multi-stage flow (triage → treatment → disposition), and the **results-honesty** beat (single run vs N replications + CI, warm-up). |
| **S07 — Construction Haul Routing** *(DES leg)* | **SimPy** replay under stochastic load/dump/delay | — | precomputed (heavy graph) | The *simulate* leg of optimize-then-simulate; how a fixed plan degrades under uncertainty. |
| **S09 — Ambulance Dispatch** *(DES leg)* | **SimPy** many stochastic call streams | — | precomputed | Stochastic demand over a city graph; response-time distributions and coverage from replicated runs. |
| **S10 — Monte-Carlo Replication / CI Study** | **SimPy** base model (reuses S01/S04) | — | precomputed (CPU joblib; optional GPU) | The non-negotiable curriculum: **replications, confidence intervals, warm-up / initial transient**, and the wrong-vs-corrected pitfall (single run, one seed, no warm-up). |

Each scenario commits its **seed, parameters, warm-up cut, and measured gate numbers** into the manifest
so the replayed run is reproducible — and carries a **STRESS-DES model card**.

---

## 10. Per-framework deep dives

This page is the map; the implementation detail for each engine lives in its own guide:

- [SimPy](../frameworks/simpy/usage.md) — the process-interaction model, `Resource` / `PriorityResource`,
  emitting the event trace, seeding, and running live under Pyodide.
- [Ciw](../frameworks/ciw/usage.md) — building a queueing network, the closed-form M/M/c reference, and the
  sim-vs-theory validation panel.
- [Salabim](../frameworks/salabim/usage.md) — the teaching counterpoint and the **offline** `.mp4` / `.gif`
  render pipeline (desktop/headless only — never the web build).

---

## 11. License & attribution summary

All DES tools used in the lab are permissive and mutually compatible:

| Tool | License |
|---|---|
| SimPy | MIT |
| Ciw | MIT |
| Salabim | MIT |
| JaamSim *(reference-only)* | Apache-2.0 |
| AnyLogic *(reference-only)* | Proprietary |
| NHS A&E distributions (used to shape S04 arrivals) | Open Government Licence — attribute |

See [`LICENSES.md`](../../LICENSES.md) and [`ATTRIBUTION.md`](../../ATTRIBUTION.md). Repo:
<https://github.com/fsantibanezleal/CAOS_SIMLAB>.

---

### Sources

This guide is grounded in the CAOS_SIMLAB research and synthesis:

- SimPy (MIT, 4.1.2, pure Python): <https://simpy.readthedocs.io/> · PyPI:
  <https://pypi.org/project/simpy/>
- Ciw (MIT, queueing networks + blocking): <https://ciw.readthedocs.io/> · paper (J. Simulation, 2018):
  <https://www.tandfonline.com/doi/full/10.1080/17477778.2018.1473909>
- Salabim (MIT, 2D/3D animation via tkinter + mp4/gif export): <https://www.salabim.org/> ·
  Animation manual (headless `blind_animation`): <https://www.salabim.org/manual/Animation.html> ·
  JOSS paper: <https://joss.theoj.org/papers/10.21105/joss.00767>
- JaamSim (Apache-2.0, Java desktop, interactive 3D): <https://jaamsim.com/>
- AnyLogic (commercial, multi-method bar): <https://www.anylogic.com/>
- The Little Book of DES (healthcare DES pedagogy, PenCHORD/HSMA): <https://des.hsma.co.uk/>
- `treat_sim` (STARS reusable ED model, MIT): <https://github.com/TomMonks/treat_sim_streamlit> ·
  Zenodo: <https://doi.org/10.5281/zenodo.11102678>
- STRESS-DES reporting checklist (Monks et al., 2019):
  <https://www.tandfonline.com/doi/full/10.1080/17477778.2018.1442155>
- NHS A&E activity (Open Government Licence) — arrival-by-hour / day-of-week shaping for S04:
  <https://digital.nhs.uk/data-and-information/publications/statistical/hospital-accident--emergency-activity>
- SimPy-vs-C++ performance discussion (the 10–20× speed ceiling):
  <https://www.linkedin.com/posts/harry-king-6987a61a_this-result-confirms-that-simpy-is-too-slow-activity-7108307584100564992-JV6a>
