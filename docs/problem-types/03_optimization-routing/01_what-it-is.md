# 01 · What it is

> Node: [Optimization & Routing](../03_optimization-routing.md) · next: [02 · When to use it](./02_when-to-use.md)

**Operations Research (OR)** is the discipline of *computing a decision*: given a set of choices, the costs
and benefits of each, and the rules they must respect, OR finds the choice that is **best** by a stated
measure. Where a simulator answers *"given a policy and random events, what happens?"*, an optimizer answers
the complementary question *"what is the best plan?"* — it returns an **optimum** (a schedule, a route, a
blend), not a sample path.

In CAOS_SIMLAB the optimization half is deliberately the *partner* of the simulation half. The lab never
ships an optimizer as a number to admire; it ships an optimizer whose output is **a plan to stress-test** in
a downstream discrete-event simulation. That framing is the spine of this whole node — see
[02 · When to use it](./02_when-to-use.md) and the optimize-then-simulate bridge in
[03 · Methods & KPIs](./03_methods-and-kpis.md).

## 1. The anatomy of an optimization model

Every OR model in this lab is built from the same three parts. Naming them explicitly is the first skill the
node teaches, because *recognising* this shape in a messy real problem is what lets you reach for a dedicated
solver instead of a hand-rolled loop.

| Part | What it is | Examples in the lab |
|---|---|---|
| **Decision variables** | The choices the solver controls | how many trucks on a route (continuous or integer), which job runs first on a machine, whether a depot is open (0/1), the order of customer visits |
| **Constraints** | The rules a feasible plan must respect | vehicle capacity, customer time windows, "two operations can't use one machine at once", flow conservation, precedence |
| **Objective** | The single number to minimize or maximize | total travel distance, schedule makespan, total cost, throughput |

> **None of this is "minimize a loss with a `for`-loop by hand."** Each model class below maps to a *real,
> dedicated solver* — see [04 · Tools](./04_tools.md). The art is formalizing the problem into variables +
> constraints + an objective; the solver does the search.

## 2. The model-class ladder

OR problems form a ladder of difficulty. Climbing it is the structure of
[03 · Methods & KPIs](./03_methods-and-kpis.md); here is the map of the rungs.

1. **Linear Programming (LP)** — continuous variables, a linear objective, linear constraints. The feasible
   region is a convex polytope, so an LP is solved *exactly and quickly* — no combinatorial explosion. The
   "how much of each thing" model.
2. **Mixed-Integer Linear Programming (MILP)** — an LP where *some* variables must be **integer** (a count, a
   yes/no). Integrality makes it NP-hard; the exact method is branch & bound. The "which discrete choice"
   model.
3. **Constraint Programming (CP)** — instead of forcing everything into linear inequalities, state high-level
   combinatorial constraints directly (`NoOverlap`, `AllDifferent`, interval variables, precedence) and let a
   propagation + SAT-learning search do the rest. The strongest tool for **scheduling and combinatorial
   feasibility**.
4. **Routing (TSP → CVRP → VRPTW → PDPTW)** — a specialised, heavily-studied branch of combinatorial
   optimization for vehicles visiting nodes. The lab's headline OR family.
5. **Shortest paths & the road graph** — the layer *under* routing: before any router can optimize, it needs
   a **cost matrix** (travel time/distance between every pair of locations), which comes from a graph.

Each rung is genuinely harder than the one below, and each has an honest limit — see
[02 · When to use it](./02_when-to-use.md) for when each is the right tool and where it stops being honest.

## 3. The one non-negotiable framing: the optimum is fragile

> **An optimum on paper is fragile under uncertainty.** A route plan that is provably minimal on
> *deterministic* travel times can violate every time window the moment real traffic, breakdowns, or
> stochastic demand arrive.

This is why **no routing or scheduling scenario in the lab ships as "just an optimizer."** Every optimized
plan is handed to a **SimPy** discrete-event simulation that injects the uncertainty the optimizer assumed
away, so the learner *watches* a provably-good plan slip. The visceral "the optimum was fragile" moment is
the whole pedagogical payload, and it motivates everything downstream (robust optimization, scenario-based
planning, safety margins). The mechanics of that bridge — the **simheuristic** pattern — are in
[03 · Methods & KPIs](./03_methods-and-kpis.md#the-optimize-then-simulate-bridge-simheuristics).

## Related

- [02 · When to use it](./02_when-to-use.md) — *decide* vs *simulate*, and the honest limits of each class.
- [03 · Methods & KPIs](./03_methods-and-kpis.md) — each model family in depth + the simheuristic bridge.
- Sibling problem types: [DES](../01_discrete-event-simulation.md) · [ABM](../02_agent-based-modeling.md) ·
  [Monte-Carlo](../04_monte-carlo-replications.md).
