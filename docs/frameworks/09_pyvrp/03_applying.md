# PyVRP — 03 · Applying it

> Read [`01_installation.md`](./01_installation.md) and [`02_usage.md`](./02_usage.md)
> first. This page is about *modelling decisions*: how to formalize a routing
> problem, how to solve it with PyVRP, which lab scenario uses it, and when to
> reach for it versus the alternatives.

## What problem it is for

PyVRP solves the **Vehicle Routing Problem** and its mainstream variants — CVRP
(capacities), VRPTW (time windows), pickup-and-delivery, multi-depot,
multi-trip, heterogeneous fleet, prize-collecting — to **near-optimal quality**
within a time/iteration budget. It is a *dedicated* combinatorial optimiser:
unlike a general constraint solver, it is purpose-built for routing and is among
the strongest open-source VRP solvers available (its HGS lineage won the 2021
DIMACS VRPTW challenge and the static EURO-NeurIPS 2022 competition).

Reach for PyVRP when the task **is** routing — "which vehicle visits which stops,
in what order, respecting capacity / time windows, to minimise distance or cost?"
— and solution quality matters.

## How to formalize the problem (then solve it)

Routing problems become solvable once you pin down five things; PyVRP's `Model`
maps onto them one-to-one:

1. **Locations + a distance/time matrix.** Pick the entities to visit (the depot
   and the clients) and build a matrix of costs between them. In the lab this
   matrix is **shortest paths on a road/grid graph**, not raw straight lines —
   built with NetworkX/OSMnx — then **scaled to integers** so the solver's
   integer engine stays exact (the `SCALE=100` move from
   [`02_usage.md`](./02_usage.md)).
2. **Demand + capacity.** Each client carries a `delivery` (and/or `pickup`)
   demand; each `VehicleType` carries a `capacity`. This turns a TSP into a CVRP.
3. **Time windows / service (optional).** Add `tw_early` / `tw_late` /
   `service_duration` on clients and `duration` on edges to make it a VRPTW.
4. **Objective.** Total distance, optionally plus `fixed_cost` per vehicle used or
   unit distance/duration costs — all folded into the single cost PyVRP minimises.
5. **A deterministic stop + seed.** `MaxIterations(n)` (portable) or
   `MaxRuntime(s)`, plus `seed=...`, so a committed run reproduces.

Solving is then one call: `Model.solve(stop=..., seed=...)`, and you read
`result.best.routes()` back out (mind the depot-is-index-0 numbering).

## The pattern in this lab: a SOTA contrast (and where simheuristics fit)

The lab's broader didactic move for routing is **optimize-then-simulate** (a
"simheuristic"): optimise routes on *deterministic* travel times, then replay the
plan in a SimPy DES. The full write-up lives in the problem-type guide:
[Optimization & routing](../../problem-types/03_optimization-routing.md).

> **Honest scope for S08 (the PyVRP scenario).** S08 does **not** instantiate the
> stochastic simulate leg: it has **no SimPy replay**, no injected delays, and no
> time windows. S08 is a **deterministic two-solver head-to-head** — OR-Tools vs
> PyVRP on the identical instance — rendered from a committed trace with a scrubber.
> The lesson S08 actually teaches is the *quality gap between a general and a
> specialised solver*, not "the optimum degrades under uncertainty" (that fragility
> lesson is carried by the deterministic-but-saturating haul DES in S07/S11). So
> read the simheuristic pattern above as the *general* technique, explicitly **not**
> wired into S08.

Within that catalog PyVRP plays a specific role — the **state-of-the-art
contrast**:

- **OR-Tools is the teaching default** for the optimisation step. One library
  spans CVRP/VRPTW/PDPTW *and* CP-SAT scheduling — maximum didactic surface, and
  its first-solution + guided-local-search behaviour is easy to explain.
- **PyVRP is the "what good looks like" exemplar.** On the *same* instance, a
  specialised HGS solver finds materially shorter routes than a general solver's
  default settings. Showing both side by side teaches the difference between a
  *general-purpose* optimiser and a *competition-grade specialised* one — without
  changing the problem.

So the flow for S08 is: build one instance → solve with OR-Tools (default) → solve
with PyVRP → compare total distance / longest route, rendered as both plans driving
the network from a committed deterministic trace. (Feeding a chosen plan into a
stochastic SimPy replay is the *general* simheuristic extension — it is not part of
the shipped S08.)

## Which scenario uses it

- **S08 — Vehicle Routing Problem.** S08's shipped engine is OR-Tools (the
  capacitated VRP baseline). **PyVRP is the SOTA contrast** that demonstrates how
  much tighter a dedicated routing metaheuristic can get on the identical
  instance. Both are **precompute-lane, native code** (they cannot run in the
  browser), so S08 is a precomputed scenario: the solver runs offline and the web
  app replays the committed routes as vehicles driving the network. The honesty
  gate is recorded in the manifest (`pure_python=false`, `lane=precomputed`,
  `engine: ortools+pyvrp`). Both engines see one instance built from one seeded
  NumPy RNG, on the *same* scaled-integer shortest-path matrix, and PyVRP is
  stopped with **`MaxIterations`** (not wall time) so its committed trace replays
  byte-for-byte. The scenario source is
  [`simlab/scenarios/s08_vrp.py`](../../../simlab/scenarios/s08_vrp.py) and its
  manifest is [`manifests/s08_vrp.json`](../../../manifests/s08_vrp.json).

(PyVRP is also a natural fit for the heavier ambulance/dispatch routing scenario
families — the optimization-routing problem-type page lists it as the SOTA option
alongside OR-Tools — but in this catalog its concrete home is the S08 contrast.)

## Honest trade-offs (grounded in the research)

From research dimension 03 (Optimization & Routing) and the S08 adversarial
audit:

- **Specialised quality vs. general flexibility.** PyVRP almost always finds
  shorter routes than OR-Tools' *default* settings on the same VRP, and that gap
  is the whole point of the contrast. But it only does *routing* variants — it has
  no constraint-programming / scheduling side. OR-Tools' breadth (Routing **and**
  CP-SAT) is why it remains the teaching default; PyVRP is the sharper but
  narrower tool.

- **Balanced vs. shortest.** PyVRP minimises *pure total distance*, so its plan is
  typically shorter in total but **less balanced** across vehicles than OR-Tools'.
  When you show both, name this explicitly — "shorter overall, but one vehicle
  carries more" — rather than declaring a flat winner.

- **Fair comparisons require care.** OR-Tools without a metaheuristic and a time
  limit returns a *first feasible* solution, which would make any "PyVRP wins"
  claim misleading. To compare honestly, give OR-Tools `GUIDED_LOCAL_SEARCH` and
  an equal budget; on small instances both may reach the same (optimal) answer,
  and the PyVRP advantage only becomes visible as instances grow. Don't oversell
  the gap on toy instances.

- **Integer engine = scale your inputs.** PyVRP minimises an **integer** cost.
  Real-valued distances must be scaled (e.g. ×100) and rounded, or precision is
  silently lost. The reported cost is in that scaled space — divide back out for
  human units, and keep the number you *show* explicitly related to the number you
  *minimise*.

- **Determinism for committed replays.** Seed the solver so committed precomputed
  runs reproduce from the repo. A `MaxIterations` budget is the most portable for
  exact replay across machines; a `MaxRuntime` budget can drift with machine load.
  (The lab seeds both the solver and the downstream SimPy RNG.)

- **Single-route-per-vehicle by default.** Standard CVRP gives each vehicle one
  depot→customers→depot tour. Tightening capacity does **not** create "more trips
  back to the depot" per vehicle — it forces *more vehicles*. PyVRP's `Route` model
  makes the one-tour structure explicit (multi-trip is a separate opt-in feature).

- **CPU-only, no GPU.** HGS is a CPU metaheuristic; there is no GPU path. This is
  fine for the lab — all routing is CPU precompute, the GPU is reserved for
  ABM/physics scenarios.

- **Licensing is clean for a public repo.** PyVRP is **MIT**; OR-Tools is
  Apache-2.0; both compatible. If real road data is ever used, remember OSM data
  is ODbL (attribute "© OpenStreetMap contributors"), and cite CVRPLIB/Solomon
  papers for benchmark instances.

## When to pick PyVRP vs alternatives

| Situation | Pick |
|---|---|
| Pure routing (CVRP/VRPTW/PD/MD/multi-trip) and **quality matters** | **PyVRP** |
| You want **one** library for routing **and** scheduling/assignment (CP-SAT), or the clearest teaching default | **OR-Tools** |
| You need an out-of-the-box VRP engine wired to real OSRM road matrices, JSON-in/JSON-out | VROOM (precompute only; less to *teach*) |
| You need the road graph / shortest paths / drawable geometry feeding the matrix | OSMnx + NetworkX |
| You want to **stress-test a plan** under stochastic delays | SimPy DES replay (the optimize-then-simulate second half) |

Rule of thumb: **OR-Tools to teach the model, PyVRP to show the best the model
can do, SimPy to show it break under uncertainty.**

> Note on deprecated tools: this lab deliberately uses real, maintained
> libraries. The deprecated ABM frameworks **AgentPy** and **desmod** are *not*
> used anywhere — mentioned only so you don't reach for them.

---

Back to the node landing page: [`../09_pyvrp.md`](../09_pyvrp.md).
