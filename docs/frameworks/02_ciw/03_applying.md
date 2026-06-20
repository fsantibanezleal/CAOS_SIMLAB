# Ciw — 03 · Applying it to a real problem

> Wiki node: [02_ciw](../02_ciw.md) · prev: [02 · Usage](./02_usage.md) · also see: [01 · Installation](./01_installation.md)

## 1. What kind of problem Ciw formalizes

Ciw answers questions about **queueing networks**: given an arrival process, a service
process, a number of servers, and how customers route between stations (with optional
blocking, baulking, reneging, priorities and server schedules), **what are the waits,
queue lengths, utilisations and throughput?**

To *formalize* a problem for Ciw, frame it in the five DES primitives (see the
[DES guide](../../problem-types/01_discrete-event-simulation.md)) and then ask whether it
maps onto a **queueing network**:

1. **Entities** = the things that flow and wait (customers, patients, trucks, jobs).
2. **Resources** = the limited servers they compete for (tellers, nurses, bays).
3. **Arrival process** = a `ciw.dists.*` inter-arrival sampler per node.
4. **Service process** = a `ciw.dists.*` service-time sampler per node.
5. **Routing** = how entities move between nodes (a matrix, for multi-station networks).

Ciw is the right tool when the system is naturally described as *"customers flowing
through stations with limited servers"* **and** you want results you can **validate
against queueing theory**. That last clause is its distinguishing strength for a teaching
lab: classical queues (M/M/1, M/M/c, Jackson networks) have **closed-form** answers, so a
Ciw run can be checked against analytics. That makes Ciw the canonical engine for the
"does my simulation match theory?" lesson.

---

## 2. How to solve it — the simulate-then-validate pattern

For S01 the workflow is **simulate-then-validate** (a sibling of the broader
*optimize-then-simulate* pattern used elsewhere in the lab):

1. **Derive the analytical truth** — compute the closed-form quantity (here Erlang-C
   `Wq`; cross-checked with Little's Law `Lq = λ·Wq`).
2. **Simulate** the same system across **seeded replications**. In the shipped S01 this is
   the **Ciw in-run cross-check** (`ciw_xcheck`): 10 capped, warmed-up replications run
   *inside* the live gate, alongside the SimPy animation run. (The standalone
   [`example.py`](./example.py) in this folder is a richer 30-replication demo of the same
   idea.)
3. **Estimate with a CI** — average post-warm-up `waiting_time`, build a 95% confidence
   interval, and check whether the analytic value lands inside it.
4. **Record the agreement** as the didactic artifact. The S01 `ciw_xcheck` dict records
   `theory_in_ci` (a boolean — does the Erlang-C value fall inside the CI?), `rel_err`,
   `reps`, and the CI half-width — **not** a "PASS" string. Because S01's lane is `live`,
   this cross-check runs **in the browser inside the live gate**, not as an offline
   precompute artifact. (Heavier *standalone* Ciw network studies that exceed the live gate
   would instead use the precompute lane and ship a committed result.)

This pattern generalises. Once a learner *trusts* the simulator on a case with a known
answer, they can extend the **same** model to regimes with **no** closed form (general
service-time distributions, finite buffers, customer impatience, time-varying staffing) —
where simulation is the only practical tool. That progression — *validate on the solvable,
then explore the unsolvable* — is the whole point of the chapter, and the explicit ramp
from **S01** (theory exists) to **S04** (theory ran out, now trust the CI).

---

## 3. Which scenario(s) use it

| Scenario | Use of Ciw |
|---|---|
| **S01 — Bank / Clinic Teller Queue** | **Analytic M/M/c cross-check.** SimPy runs the live, animated teller queue; Ciw is the in-run cross-check (`ciw_xcheck`, 10 capped warmed-up replications) whose mean wait is benchmarked against the closed-form Erlang-C `Wq` (see the richer 30-rep [`example.py`](./example.py)). This is the validation anchor for the queueing block. The live SimPy queue animation provides the *motion*; the Ciw `theory_in_ci` / `rel_err` numbers provide the *rigour*. Both run in the live lane. |

S01 is also the lab's **landing simulator** — the first thing a visitor sees — so pairing
a live animation with a theory-anchored number sets the honesty tone for the whole site.
The scenario module is `simlab/scenarios/s01_queue.py`; the engine seam (seeding, trace
schema, the live/precompute gate) lives in `simlab/core/`.

---

## 4. Honest trade-offs (grounded in the research)

The DES-frameworks research places Ciw very deliberately:

- **Adopted for the queueing lesson, not as the live engine.** The research recommends
  [**SimPy**](../01_simpy.md) for live, light scenarios (the de-facto standard, pure-Python,
  MIT, most-cited) and **Ciw** specifically for "the queueing-theory teaching block
  (M/M/c, networks, blocking) where analytical results validate the simulation — strongest
  pedagogy for 'does my sim match theory?'". Ciw is a **secondary teaching chapter**; SimPy
  is the primary depth engine.

- **Headless by design — and that is correct here.** Like SimPy, Ciw has **no built-in
  visualization**. In this lab the browser owns the pixels (React / SVG / Canvas / deck.gl
  replaying an event trace); the engine stays the headless physics. So Ciw's lack of viz is
  a *fit*, not a gap.

- **Pure-Python speed ceiling.** Pure-Python DES is roughly **10–20× slower than C++** on
  large M/M/1-style runs and degrades as queues grow. That is fine for the small,
  validation-sized runs S01 needs (thousands of events, sub-second), and it is exactly why
  anything heavy is pushed to the **precompute lane and replayed** rather than run live on
  the static deploy (GitHub Pages, no backend). To speed up *many* replications, parallelise runs across CPU
  cores with [`joblib`](../12_joblib.md) — you do not make a single Ciw run faster.

- **License hygiene.** Ciw is **MIT**, safe for a public repo (recorded in the
  attribution file alongside SimPy, also MIT).

---

## 5. When to pick Ciw vs the alternatives

- **Pick Ciw when** the problem *is* a queueing network and you want **analytical
  validation** (M/M/c, Jackson networks, blocking, multiple classes). Its declarative
  network API expresses these in a few lines, and the field's queueing vocabulary maps
  directly onto its objects. This is its sweet spot and why it owns the validation lesson.

- **Pick [SimPy](../01_simpy.md) instead when** you need **custom process logic** that does not
  fit the queue-network mould — multi-stage resource grabs with arbitrary control flow,
  hybrid DES+optimization, or anything you want to keep consistent across the rest of the
  lab's other scenarios (S04 SimPy ED flow; the hybrids S07/S11 pair a deterministic SimPy
  DES with native [OR-Tools](../08_ortools.md); S09 is SimPy + NetworkX, no OR-Tools).
  SimPy's `yield`-based processes are more general; Ciw trades
  that generality for queueing-specific power and conciseness. The research makes SimPy the
  **primary** engine and Ciw the **specialist**.

- **Pick [Salabim](../03_salabim.md) only for offline movies.** The research keeps Salabim as a
  teaching counterpoint and an **offline `.mp4` / `.gif` maker** for heavy precomputed
  replays — its animation is tkinter (desktop), so it **cannot be embedded in the web
  app**. Not a live engine.

- **Reference-only, do not adopt:** JaamSim (excellent Java desktop GUI, not
  Python-embeddable) and AnyLogic (the commercial multi-method bar).

- **Deprecated — do not use:** **desmod** (a near-dormant SimPy structuring layer, last
  meaningful activity ~2019, adds dependency risk for little gain) and **AgentPy**. They
  appear here only as a "don't use" signpost; this lab uses real, maintained tools.

---

## 6. Extending S01 beyond the closed form

Once the M/M/c validation passes, the *same* Ciw model extends naturally to cases theory
cannot easily reach — and this is where Ciw earns its place over a pure formula:

- **M/M/c/K (finite waiting room):** set `queue_capacities` / `system_capacity` and study
  blocking / lost customers.
- **Impatient customers:** add `reneging_time_distributions` or `baulking_functions`.
- **Non-exponential service (M/G/c):** swap `Exponential` for `Gamma`, `Lognormal`,
  `Deterministic`, etc., and compare against approximations.
- **Time-varying staffing:** attach a server `Schedule` to model shift changes.
- **Networks of queues:** add nodes and a `routing` matrix (e.g. triage → doctor →
  imaging) — the bridge to the multi-stage ED-flow ideas in **S04**.

Each of these keeps the *validated* core and adds one realistic complication — the
didactic arc the lab is built around: validate on the solvable, then explore the
unsolvable.
