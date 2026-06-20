# PyVRP — Applying it

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

## The pattern in this lab: optimize-then-simulate, with a SOTA contrast

The lab's core didactic move for routing is **optimize-then-simulate** (a
"simheuristic"): first optimise routes on *deterministic* travel times, then
**replay the plan under stochastic delays in a SimPy DES** and watch the
"optimal" plan degrade (missed windows, depot/loader queues, idle vehicles). The
lesson is blunt and valuable: *an optimum on paper is fragile under uncertainty.*

Within that pattern PyVRP plays a specific role — the **state-of-the-art
contrast**:

- **OR-Tools is the teaching default** for the optimisation step. One library
  spans CVRP/VRPTW/PDPTW *and* CP-SAT scheduling — maximum didactic surface, and
  its first-solution + guided-local-search behaviour is easy to explain.
- **PyVRP is the "what good looks like" exemplar.** On the *same* instance, a
  specialised HGS solver finds materially shorter routes than a general solver's
  default settings. Showing both side by side teaches the difference between a
  *general-purpose* optimiser and a *competition-grade specialised* one — without
  changing the problem.

So the flow is: build one instance → solve with OR-Tools (default) → solve with
PyVRP → compare total distance / longest route → then feed the chosen plan into
the SimPy replay.

## Which scenario uses it

- **S08 — Vehicle Routing Problem.** S08's shipped engine is OR-Tools (the
  capacitated VRP baseline). **PyVRP is the SOTA contrast** that demonstrates how
  much tighter a dedicated routing metaheuristic can get on the identical
  instance. Both are **precompute-lane, native code** (they cannot run in the
  browser), so S08 is a precomputed scenario: the solver runs offline and the web
  app replays the committed routes as vehicles driving the network. The honesty
  gate is recorded in the manifest (`pure_python=False`, `lane=precomputed`).

(PyVRP is also a natural fit for the heavier ambulance/dispatch routing scenario
families — research dimension 03 lists it as the SOTA option alongside OR-Tools —
but in this catalog its concrete home is the S08 contrast.)

## Honest trade-offs (grounded in the research)

From research dimension 03 (Optimization & Routing) and the S08 adversarial
audit:

- **Specialised quality vs. general flexibility.** PyVRP almost always finds
  shorter routes than OR-Tools' *default* settings on the same VRP, and that gap
  is the whole point of the contrast. But it only does *routing* variants — it has
  no constraint-programming / scheduling side. OR-Tools' breadth (Routing **and**
  CP-SAT) is why it remains the teaching default; PyVRP is the sharper but
  narrower tool.

- **Fair comparisons require care.** OR-Tools without a metaheuristic and a time
  limit returns a *first feasible* solution, which would make any "PyVRP wins"
  claim misleading. To compare honestly, give OR-Tools `GUIDED_LOCAL_SEARCH` and
  an equal time budget; on small instances both may reach the same (optimal)
  answer, and the PyVRP advantage only becomes visible as instances grow. Don't
  oversell the gap on toy instances.

- **Integer engine = scale your inputs.** PyVRP minimises an **integer** cost.
  Real-valued distances must be scaled (e.g. ×100) and rounded, or precision is
  silently lost. The reported cost is in that scaled space — divide back out for
  human units. (The lab's S08 code makes the symmetric mistake worth flagging:
  its KPI reports an *unscaled* distance while the objective is ×100 — keep the
  number you *show* and the number you *minimise* explicitly related.)

- **Determinism for committed replays.** Seed the solver so committed precomputed
  runs reproduce from the repo. A `MaxIterations` budget is the most portable for
  exact replay across machines; a `MaxRuntime` budget can drift with machine
  load. (The lab seeds both the solver and the downstream SimPy RNG.)

- **Single-route-per-vehicle by default.** Standard CVRP gives each vehicle one
  depot→customers→depot tour. Tightening capacity does **not** create "more trips
  back to the depot" per vehicle — it forces *more vehicles*. The S08 audit caught
  exactly this conceptual slip in the prose; PyVRP's `Route` model makes the
  one-tour structure explicit (multi-trip is a separate opt-in feature).

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
