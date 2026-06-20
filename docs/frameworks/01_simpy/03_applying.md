# SimPy — Applying it to real problems

This page is about *judgement*: how to **formalize** the kind of problem SimPy solves, when it is the
right tool, the patterns it slots into, the honest trade-offs the research surfaced, and exactly which
CAOS_SIMLAB scenarios use it and how. The mechanics live in [`02_usage.md`](./02_usage.md); the broader
decision map is the
[Discrete-Event Simulation guide](../../problem-types/01_discrete-event-simulation.md).

Read order for this node: **you are on 03 (last).** Previous: [`02_usage.md`](./02_usage.md).
Landing page: [`../01_simpy.md`](../01_simpy.md).

## 1. Formalizing the problem SimPy solves

Before reaching for the tool, write the problem down in the DES vocabulary. A discrete-event model is
fully specified by five things — if you can fill these in, you have a SimPy model:

1. **Entities** — what flows through the system (customers, patients, trucks, jobs). Each becomes one
   `env.process(...)` generator: a life-story.
2. **Resources** — the limited, shared servers entities compete for (tellers, beds, docks, vehicles).
   Each becomes a `simpy.Resource(capacity=c)` (or `PriorityResource` if some entities jump the queue).
3. **Stochastic timing** — the random variables: inter-arrival gaps and activity durations, with their
   distributions (Poisson arrivals → exponential gaps; service often exponential, log-normal, etc.).
   These become `rng.expovariate(...)` / `rng.lognormvariate(...)` feeding `yield env.timeout(...)`.
4. **Routing / logic** — the rules for which activity comes next, branching, balking, reneging,
   priority. This is ordinary Python between the yields.
5. **Measures of performance (KPIs)** — what you will report: waiting time, throughput, utilization,
   queue length, time-in-system, SLA-breach probability. These are what `Stats` accumulates.

> The discipline is: **state the five elements first, then translate.** Each entity → a generator;
> each resource → a `Resource`; each duration → a seeded sample; each KPI → an accumulator. The
> minimal [`example.py`](./example.py) is exactly this template with one entity type, one resource,
> two random variables (arrival gap, service time), FIFO routing, and two KPIs (Wq, ρ).

Then **solve it** the DES way: run the model over a horizon, *discard a warm-up*, and — because one
run is a noisy sample — repeat across many seeds and report a **confidence interval**, not a point. If
a closed-form answer exists (idealised queues), validate the simulation against it first (the
example's theory check); once the model outgrows theory, the replicated CI *is* the answer.

## 2. When SimPy is the right tool

Reach for SimPy (discrete-event simulation) when **all** of these hold:

- the system is naturally described as **entities flowing through activities and queues** (customers,
  patients, trucks, jobs);
- **resources are limited**, and the contention — the *waiting* — is what you care about;
- **randomness matters**: arrivals and service times are variable, not fixed;
- you want **operational KPIs over time** (throughput, waiting, utilization), not a single decision.

A quick tell: if you keep drawing boxes-and-arrows where things *wait in line for a shared resource*,
it is a DES, and SimPy is the engine.

## 3. When to pick something else (and the alternatives)

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

## 4. The patterns SimPy slots into

### Pattern A — Simulate-and-measure (the standalone DES)

The plain pattern: model the system, run it, report KPIs. This is S01 and S04 — both single seeded SimPy
runs in the live lane (S01 a ~300-customer run, S04 one ED run). The honest lesson "one run is a noisy
sample, so report a distribution (mean + CI), not a point" is carried by the replicated studies, not by
these single runs: in **S01** the Ciw in-run cross-check runs 10 capped warmed-up replications and records
`theory_in_ci` + `rel_err`; the full replicated-CI study across many seeds is **S10** (joblib). (See the
[honesty curriculum](../../problem-types/01_discrete-event-simulation/04_honesty-curriculum.md).)

### Pattern B — Optimize-then-simulate (the lab's headline hybrid)

This is the spine of the hybrid scenarios and the reason DES and optimization sit in the same lab. The
*general* pattern is:

> An optimizer (**OR-Tools / PyVRP / CP-SAT / GLOP**) proposes a plan on **deterministic** inputs; a
> **SimPy** DES then runs that plan and reports the *distribution* of real outcomes. **The optimizer
> proposes; the simulator disposes.**

> **Honest scope (what the shipped scenarios actually do).** The fully stochastic stress-test above —
> injecting travel-time noise and watching *missed time windows* appear — is the *aspirational* form of the
> pattern; it is **not** instantiated by the shipped legs. In the code, the SimPy legs of **S07** and
> **S11** are **deterministic** (fixed service times, inert seed; the saturation comes from a shared finite
> resource, e.g. the single loader, not from random variates). There are **no time windows anywhere in the
> repo**. **S08 has no SimPy leg at all** — it is a deterministic OR-Tools-vs-PyVRP head-to-head replayed
> from a committed trace. So SimPy is the simulate leg of **S07 and S11 only**. Determinism is the contract
> on *both* legs: seed the solver and the SimPy RNG so every committed run reproduces exactly.

### Pattern C — Base model for a Monte-Carlo CI study

S10 takes the **M/M/c model** (same model *class* as S01, but implemented as a fast NumPy heap-based
earliest-free-server estimator — a *different engine* from S01's SimPy `Resource` run) and runs it across
many seeds (CPU via `joblib`; an optional CuPy/Numba GPU exhibit) to draw confidence-interval envelopes
*beside* the naive single-run answer — making "one run lies" visible and quantified. The replication
machinery wraps the model; S10 itself is **live** (numpy + joblib + scipy ⊆ `LIVE_WHEELS`).

## 5. Where SimPy runs — live vs precomputed

Because SimPy is **pure Python**, light DES scenarios run **live in the Pyodide Web Worker**: move a
slider, SimPy re-runs in the browser, the React queue-network animates. A scenario falls back to the
**precompute lane** only when it breaches a gate (long horizon, large entity count, or many
replications). The lab's **3-gate rule** (pure-Python AND < 3 s AND < ~1 MB trace) enforces this
structurally — CI fails the build if a scenario tagged "live" breaches a gate, so a heavy run can never
accidentally ship as live.

- **Live (in-browser):** S01, S04, S09 (SimPy + NetworkX), and S10's replicated CI study (numpy + joblib +
  scipy all ⊆ `LIVE_WHEELS`).
- **Precomputed (committed trace, replayed):** the SimPy legs of S07 and S11 — **not** because the SimPy is
  heavy, but because each is paired with a **native OR-Tools** optimizer (CP-SAT / GLOP) that cannot run in
  WASM, so the whole scenario is computed offline and replayed. (S08 has no SimPy leg.)

## 6. Honest trade-offs (grounded in the research)

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
  and replicated simulation with a CI is the only honest measure *in principle*. The S01→S04 ramp teaches
  this transition — from "check against theory" to "theory ran out." (The shipped S04 is a single seeded
  run; the explicit replicated-CI demonstration — "one run lies" with an envelope — is **S10**.)
- **A single run is not evidence.** An animation is a hypothesis generator; the *claim* must come from
  replicated statistics after a warm-up, never from "it looked busy." Each scenario carries a
  **STRESS-DES model card** (a 20-item DES reporting checklist) so assumptions and outputs are auditable.
- **Educational, not operational.** The hospital/EMS models are synthetic-by-default (optionally shaped
  by public NHS A&E distributions); they are labelled educational and must not imply clinical or service
  validity.

## 7. Scenario map — exactly where SimPy is used

| Scenario | SimPy's role | Paired tools | Lane |
|---|---|---|---|
| **S01 — Bank / Clinic Queue (M/M/c)** | Live engine: arrivals, server pool, queue, ρ, Little's Law — a single ~300-customer run (no replications, no CI). The lab's "hello world" and the basis of [`example.py`](./example.py). | **Ciw** in-run cross-check (10 capped warmed-up reps → `theory_in_ci` + `rel_err` vs Erlang-C) | live |
| **S04 — Emergency Department Patient Flow** | Live engine: non-stationary Poisson arrivals, priority triage, multi-stage resource-limited flow (triage → treatment → disposition). No closed form. (A single seeded run; the replicated-CI lesson lives in **S10**, not here.) | — | live |
| **S07 — Construction Haul Routing** *(DES leg)* | The *simulate* leg of optimize-then-simulate: a **deterministic** SimPy DES of the closed finite-source haul cycle (fixed load/dump times, inert seed) over the CP-SAT-certified route. Saturation comes from the shared finite loader, not random variates. | **OR-Tools CP-SAT** (route-cost certificate) + NetworkX (graph) | precomputed |
| **S08 — Last-Mile Delivery VRP** | **No SimPy leg.** A deterministic two-solver head-to-head (OR-Tools vs PyVRP) rendered from a committed trace with a scrubber. | **OR-Tools** + **PyVRP** (no SimPy) | precomputed |
| **S09 — Ambulance Dispatch** | Live engine: one seeded Poisson call stream over a city graph drives nearest-available dispatch; response-time / coverage KPIs. The DES is the event-ordering mechanism (variates drawn up front), **not** replicated or a stochastic stress-test. No OR-Tools. | **NetworkX** (shortest paths) | **live** |
| **S10 — Monte-Carlo Replication / CI Study** | Base model = the M/M/c (a fast heap-based estimator, same model *class* as S01 but a different engine — not the S01 SimPy run), replicated across seeds to draw CI envelopes vs the naive single run. | **joblib** (CPU); optional **CuPy/Numba** GPU exhibit | live |
| **S11 — (LP/GLOP leg) hybrid** *(DES leg)* | A **deterministic** SimPy DES of the haul system under the GLOP-optimized allocation (no stochastic variates). | **OR-Tools GLOP** (LP leg) | precomputed |

> The shipped DES legs of S07/S11 are **deterministic** pure SimPy (the same engine as the minimal example,
> in the precompute lane because their optimizer is native OR-Tools). S09 is live pure SimPy + NetworkX.
> S08 has no SimPy leg.

## 8. A worked mini-decision

*"I have an optimized truck-haul plan from OR-Tools and want to see how the fleet saturates the shared
loader."* → This is **Pattern B (optimize-then-simulate)**, scenario **S07**. The route is found with
NetworkX and its optimum cost is certified by an **OR-Tools CP-SAT** min-cost-flow ILP, fixed offline; a
SimPy model then replays the closed finite-source haul cycle over that route. In the shipped S07 this DES is
**deterministic** by default (`breakdown=0`, fixed load/dump times) — so the queueing at the single loader,
not random noise, is what saturates the fleet; it reports one run, not a CI. Setting `breakdown>0` adds
seeded-RNG delays (still reproducible per seed). S07 runs in the **live lane**: its OR-Tools/NetworkX route
plan is precomputed offline and **committed** (`s07_plans.py`) because OR-Tools is native and can't run in
Pyodide, while the pure-Python **SimPy replay over that fixed plan runs live** in the browser — the
fleet/load/dump/breakdown sliders mutate the replay; the grade slider re-selects a committed plan.

## Sources

- DES-frameworks research (SimPy as primary; speed ceiling; no-viz-by-design; live vs precompute):
  research report 01.
- Healthcare-DES research (ED model, STRESS-DES, warm-up/replications, synthetic-by-default):
  research report 04.
- SimPy docs: <https://simpy.readthedocs.io/>
- The Little Book of DES (healthcare DES pedagogy): <https://des.hsma.co.uk/>
- STRESS-DES reporting checklist (Monks et al., 2019):
  <https://www.tandfonline.com/doi/full/10.1080/17477778.2018.1442155>
