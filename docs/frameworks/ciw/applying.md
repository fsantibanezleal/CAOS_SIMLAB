# Ciw — Applying it to a real problem

## What Ciw is for

Ciw answers questions about **queueing networks**: given an arrival process, a service
process, a number of servers, and how customers route between stations (with optional
blocking, baulking, reneging, priorities and server schedules), **what are the waits,
queue lengths, utilisations and throughput?** It is the right tool when the system is
naturally described as "customers flowing through stations with limited servers" *and*
you want results you can **validate against queueing theory**.

Its distinguishing strength for a teaching lab is precisely that last point: classical
queues (M/M/1, M/M/c, networks of them) have **closed-form** answers, so a Ciw run can be
checked against analytics. That makes Ciw the canonical engine for the "does my simulation
match theory?" lesson.

## The pattern: simulate-then-validate

For S01 the workflow is **simulate-then-validate** (a sibling of the broader
"optimize-then-simulate" pattern used elsewhere in the lab):

1. **Derive the analytical truth** — compute the closed-form quantity (here Erlang-C `Wq`).
2. **Simulate** the same system in Ciw across several **seeded replications**.
3. **Estimate with a CI** — average post-warm-up `waiting_time`, build a confidence
   interval, and check that theory lands inside it.
4. **Publish the agreement** as the didactic artifact (a number + CI + a "PASS" the web
   app can render). Because Ciw is in the **precompute** lane, this runs offline and the
   live site serves the committed result.

This pattern generalises: once a student trusts the simulator on a case with a known
answer, they can extend the *same* model to regimes with **no** closed form (general
service-time distributions, finite buffers, customer impatience, time-varying staffing) —
where simulation is the only practical tool. That progression "validate on the solvable,
then explore the unsolvable" is the whole point of the chapter.

## Which scenario(s) use it

| Scenario | Use of Ciw |
|---|---|
| **S01 — Bank / Clinic Teller Queue** | **Analytic M/M/c validation.** Ciw runs the teller queue; the result is benchmarked against the closed-form Erlang-C `Wq` (see [`example.py`](./example.py)). This is the validation anchor for the queueing block. |

S01 is also the lab's **landing simulator** — the first thing a visitor sees. Pairing the
live SimPy queue animation with a Ciw-validated theory number gives the on-ramp both
*motion* and *rigour*.

## Honest trade-offs (grounded in the research)

The DES-frameworks research (`research/01-des-frameworks-2026-06-18.md`) places Ciw very
deliberately:

- **Adopted for the queueing lesson, not as the live engine.** The research recommends
  **SimPy** for live, light scenarios (it is the de-facto standard, pure-Python, MIT,
  most-cited) and **Ciw** specifically for "the queueing-theory teaching block (M/M/c,
  networks, blocking) where analytical results validate the simulation — strongest
  pedagogy for 'does my sim match theory?'". Ciw is a **secondary teaching chapter**, with
  SimPy as the primary depth engine.

- **Headless by design — and that is correct here.** Like SimPy, Ciw has **no built-in
  visualization**. In this lab the browser owns the pixels (React/SVG/Canvas/deck.gl
  replaying an event trace); the engine stays the headless physics. So Ciw's lack of viz
  is a *fit*, not a gap.

- **Pure-Python speed ceiling.** Pure-Python DES is roughly **10–20× slower than C++** on
  large M/M/1-style runs and degrades as queues grow. That is fine for the small,
  validation-sized runs S01 needs (thousands of events, sub-second), and it is exactly why
  anything heavy is pushed to the **precompute lane and replayed** rather than run live on
  the single, GPU-less VPS. To speed up *many* replications, parallelise runs across CPU
  cores with `joblib` — you do not make a single Ciw run faster.

- **License hygiene.** Ciw is **MIT**, safe for a public repo (record it in the
  attribution file alongside SimPy, also MIT).

## When to pick Ciw vs the alternatives

- **Pick Ciw when** the problem *is* a queueing network and you want **analytical
  validation** (M/M/c, Jackson networks, blocking, multiple classes). Its declarative
  network API expresses these in a few lines, and the field's queueing vocabulary maps
  directly onto its objects. This is its sweet spot and why it owns the validation lesson.

- **Pick SimPy instead when** you need **custom process logic** that does not fit the
  queue-network mould — multi-stage resource grabs with arbitrary control flow, hybrid
  DES+optimization, or anything you want to keep consistent across the rest of the lab's
  live scenarios (S04 SimPy; S05 ED flow; the hybrids S07/S08/S09/S11 pair SimPy with
  OR-Tools). SimPy's `yield`-based processes are more general; Ciw trades that generality
  for queueing-specific power and conciseness. The research makes SimPy the **primary**
  engine and Ciw the **specialist**.

- **Pick Salabim only for offline movies.** The research keeps Salabim as a teaching
  counterpoint and an **offline `.mp4`/`.gif` maker** for heavy precomputed replays — its
  animation is tkinter (desktop), so it **cannot be embedded in the web app**. Not a live
  engine.

- **Reference-only, do not adopt:** JaamSim (excellent Java desktop GUI, not
  Python-embeddable) and AnyLogic (the commercial multi-method bar).

- **Deprecated — do not use:** **desmod** (a near-dormant SimPy structuring layer, last
  meaningful activity ~2019, adds dependency risk for little gain) and **AgentPy**. They
  appear here only as a "don't use" signpost; this lab uses real, maintained tools.

## Extending S01 beyond the closed form

Once the M/M/c validation passes, the same Ciw model extends naturally to cases theory
cannot easily reach — and this is where Ciw earns its place over a pure formula:

- **M/M/c/K (finite waiting room):** set `queue_capacities`/`system_capacity` and study
  blocking / lost customers.
- **Impatient customers:** add `reneging_time_distributions` or `baulking_functions`.
- **Non-exponential service (M/G/c):** swap `Exponential` for `Gamma`, `Lognormal`,
  `Deterministic`, etc., and compare against approximations.
- **Time-varying staffing:** attach a server `Schedule` to model shift changes.
- **Networks of queues:** add nodes and a `routing` matrix (e.g. triage → doctor →
  imaging) — the bridge to the multi-stage ED-flow ideas in S05.

Each of these keeps the *validated* core and adds one realistic complication, which is the
didactic arc the lab is built around.
