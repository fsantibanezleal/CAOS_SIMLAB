# 04 · The honesty curriculum (the part most demos skip)

> Part of the [Discrete-Event Simulation guide](../01_discrete-event-simulation.md). This is the spine of
> the whole DES half of CAOS_SIMLAB. Every KPI from [03 · Methods & KPIs](./03_methods-and-kpis.md) is a
> random variable; this page is the discipline for reporting it honestly.

This curriculum follows directly from the healthcare-DES research the lab is grounded in: the *classic
beginner bug* is reporting a single run, with one seed, and no warm-up. The lab refuses to ship that.

## 1. A single run is a noisy sample

Each simulated day is one draw from a random process. Change the seed and every KPI moves. Reporting one
run's average waiting time as "the answer" is like reporting one coin-flip as "the probability of
heads". The animation you watch is *one* such draw — vivid, persuasive, and statistically almost
meaningless on its own.

## 2. Replications + confidence intervals

The honest output is **N independent replications** (each with its own seed), summarised as a **mean with
a confidence interval**. The CI width tells you how much you can trust the number; halving it costs ~4×
the replications (the CI shrinks like `1/√N`). The lab bakes this in from day one — see scenario
[**S10**](../../use-cases/10_s10_montecarlo.md), which takes the
[S01](../../use-cases/01_s01_queue.md)/[S04](../../use-cases/04_s04_ed.md) models and runs **thousands of
seeds** to draw CI envelopes *beside* the naive single-run answer, so the learner sees exactly how
misleading one run can be. The mechanics of turning a sample of replications into an interval — and the
parallel driver that produces them — live in the [Monte-Carlo & Replications guide](../04_monte-carlo-replications.md).

## 3. Transient (initialization) bias

A simulation usually starts **empty and idle** — no queue, all resources free — which is *not* the
steady state it converges to. The early measurements are biased low. The fix is a **warm-up period**:
discard the initial transient and only start collecting statistics once the system has settled. Choosing
the warm-up cut length (e.g. by Welch's method, or simply by eyeballing when the running mean flattens)
is itself a taught skill. Forgetting it is the second-most-common beginner bug after reporting a single
run — and it interacts with Little's Law: a warm-up mismatch between how you measure `L` and `W` is the
classic way to make [the law](./03_methods-and-kpis.md#littles-law--the-one-identity-to-know) fail.

## 4. Determinism is the contract

The same `(params, seed)` must reproduce the same trace, exactly. That is what makes a committed
precomputed run trustworthy and what lets the front end *replay* rather than *recompute* — the lab's
[replay = truth](../../architecture/02_determinism-and-trace.md) discipline. Determinism is not a nicety:
without it, a committed trace is unverifiable, a CI cannot be reproduced by a reviewer, and "it worked on
my machine" replaces evidence. Every scenario seeds *every* source of randomness (arrivals, service
times, routing) so the published numbers are exactly regenerable.

## 5. An animation is a hypothesis generator, not evidence

Watching entities flow is invaluable for building intuition and catching gross modelling errors, but the
*claim* must come from the replicated statistics, never from "it looked busy". Each scenario carries a
**STRESS-DES model card** (a 20-item DES reporting checklist) so its assumptions and outputs are
auditable. The card forces the modeller to state the warm-up, the number of replications, the seeds, the
distributions, and the data sources up front — turning a pretty demo into a reproducible experiment.

> If you take one thing from this lab: **report a distribution with a CI, after a warm-up — never a
> single run.** Everything else is decoration.

## How the architecture enforces it

These rules are not left to discipline alone — the architecture makes the dishonest path structurally
hard:

- **Determinism** is enforced by the seeded trace schema — see
  [determinism & trace](../../architecture/02_determinism-and-trace.md).
- **The live/precompute split** ([the gate](../../architecture/03_the-gate.md)) means a heavy
  replication study *cannot* masquerade as a single live run; it is computed offline and shipped as a
  CI-envelope artifact under an honest banner — see [06 · Scenarios](./06_scenarios.md#where-des-runs-mostly-live-sometimes-precomputed).
- **The STRESS-DES card** ships in each scenario's manifest alongside its seed, parameters and warm-up
  cut.

## Next

- [05 · The DES toolbox](./05_tools.md) — the engines that produce these honest distributions, including
  Ciw for the rare cases where a closed-form answer exists to check against.
- [06 · Scenarios](./06_scenarios.md) — where this curriculum is taught (S04's results-honesty beat,
  S10's replication study).
- Back to the [DES section index](../01_discrete-event-simulation.md).
