# 02 · When to use DES (and when not to)

> Part of the [Discrete-Event Simulation guide](../01_discrete-event-simulation.md). This page draws the
> boundaries: the conditions that make a problem a DES, and the neighbouring methods you should reach for
> instead when those conditions don't hold.

## When DES is the right tool

Reach for discrete-event simulation when **all** of these hold:

- the system is naturally described as **entities flowing through activities and queues**;
- **resources are limited** and contention (waiting) is the thing you care about;
- **randomness matters** — arrivals and service times are variable, not fixed;
- you want **operational KPIs over time** (throughput, waiting, utilization), not a single optimal
  decision.

If all four hold, DES is almost certainly the cheapest honest answer: it models the contention directly,
it handles the variability natively, and it produces exactly the operational distributions a manager
feels. The canonical examples are the lab's live scenarios — a [bank/clinic queue](../../use-cases/01_s01_queue.md)
and an [emergency-department patient flow](../../use-cases/04_s04_ed.md).

## When to reach for a different method

Reach for a **different method** when:

- the question is "what is the *best* schedule / route / allocation?" → that is **optimization**
  ([OR-Tools / PyVRP](../03_optimization-routing.md)). DES *evaluates* a plan under uncertainty; it does
  not search for the best one. The two combine in the **optimize-then-simulate** pattern — see
  [06 · Scenarios](./06_scenarios.md#the-optimize-then-simulate-bridge).
- the behaviour you care about **emerges from many peers interacting locally** (segregation, contagion,
  flocking) → that is **agent-based modeling** ([Mesa / NetLogo](../02_agent-based-modeling.md)). The tell
  is that there is no central queue or shared resource; the interesting pattern is a *global*
  consequence of *local* rules.
- the system has **no meaningful queues or discrete events** and is well described by aggregate rates
  and stocks → that is system dynamics / a differential-equation model, out of scope here. (The Beer
  Game's bullwhip is the borderline case: the lab models it as an [ABM](../../use-cases/05_s05_beergame.md)
  with policy/feedback rather than as a stock-and-flow model.)

## The quick tell

A useful tell: if you find yourself drawing boxes-and-arrows where things *wait in line for a shared
resource*, it is a DES.

Three follow-up questions sharpen the call:

1. **Is the wait the point?** If you mostly care about how long entities queue and how busy resources
   are, DES. If you care about *which* assignment minimises cost, optimization.
2. **Is there a central, contended resource?** If yes (servers, bays, machines), DES. If the dynamics
   come from peers reacting to each other with no shared scarce resource, ABM.
3. **Are the events discrete and sparse in time?** If the system spends most of its time idle and only
   changes at well-defined instants, the event-driven clock pays off. If everything changes
   continuously every instant, a time-stepped or continuous model fits better.

## DES and its neighbours are not exclusive

The strongest lab scenarios *combine* methods rather than pick one. Optimization proposes a plan on
deterministic inputs and DES stress-tests it under randomness (the
[optimize-then-simulate bridge](./06_scenarios.md#the-optimize-then-simulate-bridge)); Monte-Carlo
replication wraps a DES base model to turn one noisy run into an honest interval (the
[Monte-Carlo guide](../04_monte-carlo-replications.md)). Knowing the boundaries is not about staying in one
lane — it is about knowing which tool owns which question when you assemble a real solution.

## Next

- [03 · Methods & KPIs](./03_methods-and-kpis.md) — once you've decided it's a DES, what you measure and
  the model shape.
- [05 · The DES toolbox](./05_tools.md) — which engine for which job.
- Back to the [DES section index](../01_discrete-event-simulation.md).
