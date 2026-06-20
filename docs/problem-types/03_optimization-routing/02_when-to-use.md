# 02 · When to use it

> Node: [Optimization & Routing](../03_optimization-routing.md) · prev: [01 · What it is](./01_what-it-is.md) · next: [03 · Methods & KPIs](./03_methods-and-kpis.md)

This page answers two questions: **when does a problem belong to the optimization half of the lab at all**
(rather than DES or ABM), and **once it does, which model class** (LP, MILP, CP, routing) is the honest
choice. Every model class has a real limit; naming the limit is as important as naming the use, because in
this lab the limits are *pedagogical features*, not bugs.

## 1. Decide vs simulate — which half of the lab?

| You want to… | Half of the lab | Tool family |
|---|---|---|
| Compute the **best** plan (a schedule, route, blend) | **Optimization** (this node) | OR-Tools, PyVRP, NetworkX/OSMnx |
| See **what happens** to a plan under random events | [Discrete-Event Simulation](../01_discrete-event-simulation.md) | SimPy, Ciw, Salabim |
| See **emergent behaviour** from many interacting agents | [Agent-Based Modeling](../02_agent-based-modeling.md) | Mesa, Mesa-Geo |
| Quantify outcome **distributions** over many seeded runs | [Monte-Carlo](../04_monte-carlo-replications.md) | joblib, SciPy |

The lab's defining move is that these are **not exclusive**: the optimizer *proposes* a plan and the
simulator *disposes* of it under uncertainty. Almost every optimization scenario here is therefore an
**optimize-then-simulate** pair — see the bridge in
[03 · Methods & KPIs](./03_methods-and-kpis.md#the-optimize-then-simulate-bridge-simheuristics).

## 2. Picking the model class

The single most useful test is **"how much of each thing" vs "which discrete choice."**

### Use **LP (GLOP)** when…

…the decision is fundamentally *how much* of each continuous thing: allocate a fleet's hours across faces,
blend feed grades to hit a target, decide flow rates on a network. The feasible region is convex, so you get
an **exact optimum, fast**, with no combinatorial explosion.

> **Honest limit.** LP assumes everything is **divisible and deterministic**. You cannot say "use exactly 7
> trucks" in pure LP (that needs an integer variable → MILP), and the LP optimum says **nothing about
> variance**. In the lab, both gaps are the *point*: scenario **S11** computes a smooth LP allocation, then a
> SimPy DES injects breakdowns and queueing so the learner sees the lumpy reality the LP could not.

### Use **MILP (branch & bound)** when…

…the structure is "linear costs and constraints, **but** with indivisible / yes-no decisions": facility
location, fixed-charge network design, "open this depot or not", integer fleet sizing.

> **Don't use MILP when** the model is heavily logical/combinatorial (sequencing, no-overlap, alldifferent) —
> **CP-SAT** will usually express it more naturally and solve it faster.
>
> **Honest limit.** Branch & bound is *exact* but can be *exponential*. On small instances you get a proven
> optimum; on large ones you set a time limit and accept a **gap** (best bound vs best solution). That
> trade-off — proof of optimality vs wall-clock — is exactly what a learner should feel.

### Use **CP-SAT** when…

…the model is dominated by **logical, combinatorial constraints**: job-shop / flow-shop scheduling, crew and
machine assignment, rostering, sequencing — anything where "two tasks can't overlap on one machine" or "all
different" is the natural language. CP-SAT can *also* model routing (via `AddCircuit`), but for vehicle
routing the dedicated Routing layer is the better-trodden teaching path.

> **Honest limit.** CP-SAT returns the **best solution found within its time limit** plus a bound; for a hard
> instance it may stop *near* optimal without a proof. Always commit the **time limit, search parameters, and
> seed** so the replayed schedule is reproducible.

### Use **Routing (OR-Tools Routing / PyVRP)** when…

…vehicles must visit nodes: TSP, CVRP, VRPTW, PDPTW (the ladder is detailed in
[03 · Methods & KPIs](./03_methods-and-kpis.md#routing--tsp-cvrp-vrptw)). This is the lab's headline family
and the place where "fragile under uncertainty" bites hardest — a single delay in a VRPTW cascades into
downstream time-window violations.

> **Critical configuration — or the lesson lies.** Out of the box, OR-Tools Routing returns the *first
> feasible* solution and stops; that is **not** optimized, and comparing it to PyVRP would defame OR-Tools.
> Every routing scenario **must** set a first-solution strategy, `GUIDED_LOCAL_SEARCH`, a time limit, and a
> fixed seed. The detail is in [03 · Methods & KPIs](./03_methods-and-kpis.md#routing--tsp-cvrp-vrptw) and
> [04 · Tools](./04_tools.md#or-tools).

### Use **shortest paths (NetworkX + OSMnx)** when…

…you need the **cost matrix** that *feeds* a router, or a single best path across a road network (Dijkstra,
A\*, k-shortest paths). It is also the **only** optimization piece in the lab that is pure Python and can run
*live* in the browser — but only on **small** graphs.

> **Honest limit.** All-pairs shortest paths on a big OSMnx graph **does not scale** — the matrix, not the
> solver, is usually the real bottleneck. Keep *live* instances small (≈ ≤ 20–30 stops); for anything larger,
> **precompute** the matrix with OSRM and commit the JSON. See [04 · Tools](./04_tools.md#osrm--vroom).

## 3. The lane consequence

Because OR-Tools, PyVRP, and the OSRM/VROOM backends are **native code**, they fail the lab's
[live/precompute gate](../../architecture/03_the-gate.md) and **always precompute**. The only optimization
piece that can touch the live tier is NetworkX/OSMnx shortest paths on a small graph. This shapes *every*
"when to use" answer: if your instance is large or your solver is native, the answer is "use it offline and
commit a seeded trace" — see [04 · Tools](./04_tools.md#where-this-runs-precompute-only-never-live).

## Related

- [01 · What it is](./01_what-it-is.md) — the model anatomy and the fragility framing.
- [03 · Methods & KPIs](./03_methods-and-kpis.md) — each class in depth + the simheuristic bridge.
- [05 · Scenarios](./05_scenarios.md) — which scenario exercises which class.
