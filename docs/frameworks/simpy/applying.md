# SimPy — Applying it to real problems

This page is about *judgement*: when SimPy is the right tool, the patterns it slots into, the honest
trade-offs the research surfaced, and exactly which CAOS_SIMLAB scenarios use it and how. The
mechanics live in [`usage.md`](./usage.md); the broader decision map is the
[Discrete-Event Simulation guide](../../problem-types/discrete-event-simulation.md).

## 1. When SimPy is the right tool

Reach for SimPy (discrete-event simulation) when **all** of these hold:

- the system is naturally described as **entities flowing through activities and queues** (customers,
  patients, trucks, jobs);
- **resources are limited**, and the contention — the *waiting* — is what you care about;
- **randomness matters**: arrivals and service times are variable, not fixed;
- you want **operational KPIs over time** (throughput, waiting, utilization), not a single decision.

A quick tell: if you keep drawing boxes-and-arrows where things *wait in line for a shared resource*,
it is a DES, and SimPy is the engine.

## 2. When to pick something else (and the alternatives)

SimPy is the lab's DES default, but it is one tool among several. The research draws the lines cleanly:

| If the question is… | Use… | Why not SimPy |
|---|---|---|
| "What is the **best** schedule / route / allocation?" | **OR-Tools** (CP-SAT, routing, GLOP) / **PyVRP** | DES *evaluates* a plan under uncertainty; it does not *search* for the best one. |
| Behaviour that **emerges from many peers interacting locally** (segregation, contagion, flocking) | **Mesa** (ABM) | SimPy has no spatial grid / neighbour model; ABM is the right paradigm. |
| A queueing model with a **known closed-form** answer (M/M/c, networks, blocking) | **Ciw** (alongside SimPy) | Ciw gives the analytic reference; SimPy drives the live animation. Use them *together* (S01). |
| **Heavy** DES: long horizons, large fleets, thousands of replications | SimPy **in the precompute lane** + `joblib` | Same engine — the *lane* changes, not the tool. Pure-Python DES is ~10–20× slower than C++, so heavy work is precomputed and replayed, never live. |
| A ready-made **animation video** for a heavy replay | **Salabim** (offline, local only) | Salabim's animation is tkinter (desktop); it cannot run in the browser. Use it only to export `.mp4`/`.gif` offline. |

> **Deprecated — do not use.** `desmod` (a thin, near-dormant SimPy structuring layer) and `AgentPy`
> (an ABM library) appear in older tutorials but are **excluded** from this lab. For DES use SimPy /
> Ciw / Salabim; for ABM use Mesa.

## 3. The patterns SimPy slots into

### Pattern A — Simulate-and-measure (the standalone DES)

The plain pattern: model the system, run it, report KPIs **with a warm-up and replications**. This is
S01 and S04. The deliverable is never one pretty animation — it is a *distribution* (mean + confidence
interval), because one run is a noisy sample. (See the
[honesty curriculum](../../problem-types/discrete-event-simulation.md#4-the-honesty-curriculum-the-part-most-demos-skip).)

### Pattern B — Optimize-then-simulate (the lab's headline hybrid)

This is the spine of the hybrid scenarios and the reason DES and optimization sit in the same lab:

> An optimizer (**OR-Tools / PyVRP / CP-SAT / GLOP**) proposes a plan on **deterministic** inputs; a
> **SimPy** DES then runs that plan under **stochastic** conditions and reports the *distribution* of
> real outcomes. **The optimizer proposes; the simulator disposes.**

The teaching payload is that *an optimum on paper is fragile under uncertainty* — the optimized route /
schedule / dispatch is re-run with injected noise, and the SimPy replay exposes the time-window
violations, cycle-time spread, or response-time tail the deterministic optimum hid. SimPy is the
**simulate leg** of S07, S08, S09, S11. Determinism is the contract on *both* legs: seed the solver and
the SimPy RNG so every committed run reproduces exactly.

### Pattern C — Base model for a Monte-Carlo CI study

S10 takes the S01/S04 SimPy models and runs them across **thousands of seeds** (CPU via `joblib`; an
optional CuPy/Numba GPU exhibit) to draw confidence-interval envelopes *beside* the naive single-run
answer — making "one run lies" visible and quantified. SimPy is the base model; the replication
machinery wraps it.

## 4. Where SimPy runs — live vs precomputed

Because SimPy is **pure Python**, light DES scenarios run **live in the Pyodide Web Worker**: move a
slider, SimPy re-runs in the browser, the React queue-network animates. A scenario falls back to the
**precompute lane** only when it breaches a gate (long horizon, large entity count, or many
replications). The lab's **3-gate rule** (pure-Python AND < 3 s AND < ~1 MB trace) enforces this
structurally — CI fails the build if a scenario tagged "live" breaches a gate, so a heavy run can never
accidentally ship as live.

- **Live (in-browser):** S01, S04, and the DES base model inside S10.
- **Precomputed (committed trace, replayed):** the heavy SimPy legs of S07 / S09 / S11, and S10's
  thousands-of-replications study — computed offline and committed as a CI-envelope artifact, then
  replayed under the *"precomputed due to cost; full pipeline in the repo"* banner.

## 5. Honest trade-offs (grounded in the research)

The DES-frameworks and healthcare-DES research dimensions surface these honestly:

- **The speed ceiling is real.** Pure-Python DES is ~**10–20× slower** than a C++ engine on a heavy
  benchmark (e.g. M/M/1 with ~500k arrivals), and degrades as queues grow. This is *fine* for light,
  interactive scenarios and is exactly why heavy work goes to precompute. It is a deliberate accepted
  cost: idiomatic, teachable, browser-runnable code beats raw speed for a didactic product.
- **No built-in animation — on purpose.** SimPy emits a structured event trace
  `[{t, entity, kind, from, to, state}]`; the React front end owns the pixels (queue-network renderer
  for DES). This keeps the teaching code idiomatic and the rendering modern, and is *why* SimPy fits the
  "files not a runtime DB" architecture.
- **Theory runs out.** Closed-form queueing results exist only for idealised assumptions (Poisson
  arrivals, exponential service, simple disciplines). The moment a model adds priority classes,
  non-stationary arrivals, or multi-stage shared resources (the real S04 ED), **no closed form exists**
  and replicated simulation with a CI becomes the only honest measure. The S01→S04 ramp teaches exactly
  this transition — from "check against theory" to "theory ran out, now trust the CI."
- **A single run is not evidence.** An animation is a hypothesis generator; the *claim* must come from
  replicated statistics after a warm-up, never from "it looked busy." Each scenario carries a
  **STRESS-DES model card** (a 20-item DES reporting checklist) so assumptions and outputs are auditable.
- **Educational, not operational.** The hospital/EMS models are synthetic-by-default (optionally shaped
  by public NHS A&E distributions); they are labelled educational and must not imply clinical or service
  validity.

## 6. Scenario map — exactly where SimPy is used

| Scenario | SimPy's role | Paired tools | Lane |
|---|---|---|---|
| **S01 — Bank / Clinic Queue (M/M/c)** | Primary engine: arrivals, server pool, queue, ρ, Little's Law. The lab's "hello world" — and the basis of [`example.py`](./example.py). | **Ciw** closed-form M/M/c overlay (sim converges to theory) | live |
| **S04 — Emergency Department Patient Flow** | Primary engine: non-stationary Poisson arrivals, priority triage, multi-stage resource-limited flow (triage → treatment → disposition). No closed form → replications + CI + warm-up. | — | live |
| **S07 — Construction Haul Routing** *(DES leg)* | The *simulate* leg of optimize-then-simulate: SimPy replays trucks under stochastic load/dump/delay on a fixed plan. | **OR-Tools** + OSMnx/NetworkX (plan leg) | precomputed |
| **S08 — Last-Mile Delivery VRP** *(DES leg)* | SimPy replays optimized routes with travel-time noise; reports time-window violations ("optimum on paper is fragile"). | **OR-Tools** + **PyVRP** (plan leg) | precomputed |
| **S09 — Ambulance Dispatch** *(DES leg)* | SimPy drives many stochastic call streams over a city graph; response-time distributions & coverage from replicated runs. | **OR-Tools** + graph (plan/siting leg) | precomputed |
| **S10 — Monte-Carlo Replication / CI Study** | SimPy is the **base model** (reuses S01/S04), run across thousands of seeds to draw CI envelopes vs the naive single run. | **joblib** (CPU); optional **CuPy/Numba** GPU exhibit | precomputed |
| **S11 — (LP/GLOP leg) hybrid** *(DES leg)* | SimPy simulates the system under the GLOP-optimized allocation to report realised outcomes under uncertainty. | **OR-Tools GLOP** (LP leg) | precomputed |

> The DES leg of S07/S09/S11 and the S10 base model are all **pure SimPy** — the same engine you see in
> the minimal example, scaled up and moved to the precompute lane.

## 7. A worked mini-decision

*"I have an optimized truck-haul schedule from OR-Tools and want to know how it holds up when load and
dump times vary."* → This is **Pattern B (optimize-then-simulate)**, scenario **S07**. The OR-Tools plan
is fixed offline; a SimPy model replays the trucks with stochastic load/haul/dump/delay over the road
graph; you run N replications and report the cycle-time distribution and fleet-utilization CI. Because
the graph is large and you want many replications, it runs in the **precompute lane** and ships as a
committed replay artifact — not live. SimPy is the engine for the replay; OR-Tools never touches the
browser (native code, not Pyodide-runnable).

## Sources

- DES-frameworks research (SimPy as primary; speed ceiling; no-viz-by-design; live vs precompute):
  research report 01.
- Healthcare-DES research (ED model, STRESS-DES, warm-up/replications, synthetic-by-default):
  research report 04.
- SimPy docs: <https://simpy.readthedocs.io/>
- The Little Book of DES (healthcare DES pedagogy): <https://des.hsma.co.uk/>
- STRESS-DES reporting checklist (Monks et al., 2019):
  <https://www.tandfonline.com/doi/full/10.1080/17477778.2018.1442155>
