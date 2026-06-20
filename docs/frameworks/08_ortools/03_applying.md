# OR-Tools — Applying it to real problems and to our scenarios

> Wiki node: [08_ortools](../08_ortools.md) · prev: [02_usage.md](./02_usage.md) · problem-type guide: [Optimization & Routing](../../problem-types/03_optimization-routing.md)

OR-Tools answers a different question from the simulators in this lab. SimPy, Mesa and Ciw ask *"given a
policy and random events, what happens?"* OR-Tools asks *"what is the best decision?"* — it computes an
**optimum** (a schedule, a route, a blend), not a sample path. This contrast is itself a teaching point: the
optimization tab shows a plan that is optimal *on paper*; the simulation tabs then show that plan degrade
under uncertainty.

## How to formalize the problem (before reaching for the solver)

Every problem OR-Tools solves reduces to the same three-part shape. Naming these three pieces explicitly is
the whole skill — once you have them, the API call is mechanical:

1. **Decision variables** — what are you choosing? Integer/interval vars for *discrete* decisions ("when does
   operation *o* start", "which truck serves stop *s*"); continuous `NumVar`s for *quantity* decisions ("how
   many tonnes from source *i*").
2. **Constraints** — what makes a choice legal? Precedence (`s >= prev_end`), capacity (`sum(load) <= cap`),
   no-overlap on a shared resource (`add_no_overlap`), supply caps (`x_i <= avail_i`), time windows.
3. **Objective** — what are you minimising/maximising? Makespan, total distance, blend deviation from target
   grade, cost.

Then choose the solver by the *type* of the variables:

| Variable type | Constraint/objective type | Solver | Returns |
|---|---|---|---|
| Integer + interval | Disjunctive scheduling, no-overlap, precedence | **CP-SAT** | Proved-optimal schedule (small instances) |
| Index/arc (CP) | Routing: capacity, time windows, pickup-delivery | **Routing** (`pywrapcp`) | A route plan (quality depends on the configured strategy + budget) |
| Continuous (real) | Linear constraints + linear objective | **GLOP** | Proved-optimal LP solution |

## Which scenarios use it, and which sub-solver

Per the scenario→tool map, OR-Tools is the optimization engine in five scenarios across three sub-solvers
(the scenario code lives in `simlab/scenarios/`):

| Scenario | Sub-solver | What it optimises | Module |
|---|---|---|---|
| **S06 — Job-Shop** | **CP-SAT** | Operation start times that minimise the makespan (disjunctive scheduling). | `simlab/scenarios/s06_jobshop.py` |
| **S07 — Construction haul routing** | **CP-SAT** | A min-cost single-unit-flow ILP that **certifies the route cost** of the cheapest loaded haul (the route itself is found with NetworkX Dijkstra). Both live in the **offline** plan builder `_haul_plan.py`; the live module `s07_haul.py` loads the committed plan and runs a **deterministic** SimPy haul DES only. *(No OSMnx; no Routing solver.)* | `simlab/scenarios/_haul_plan.py` (offline plan) · `simlab/scenarios/s07_haul.py` (live SimPy replay) |
| **S08 — Vehicle routing (VRP)** | **Routing** (`pywrapcp`) | CVRP plan; OR-Tools is the *teaching default*, [PyVRP](../09_pyvrp.md) the SOTA contrast. Deterministic head-to-head; **no SimPy**. | `simlab/scenarios/s08_vrp.py` |
| **S11 — Mine multi-destination haul** | **GLOP** (LP) | The plant-**blend** linear program: mix phase tonnages to hit a target grade subject to supply caps. Paired with a **deterministic** SimPy fleet DES. | `simlab/scenarios/s11_minehaul.py` |

*Not OR-Tools:* **S09 — Ambulance dispatch** uses **SimPy + NetworkX** (nearest-available dispatch on
shortest paths), not OR-Tools at all — see [NetworkX applying](../10_networkx/03_applying.md).

CP-SAT and GLOP are demonstrated in [`example.py`](./example.py); the only scenario using the **Routing**
(`pywrapcp`) family is **S08**.

## The core pattern: optimize-then-simulate

The single most valuable lesson the research identifies is **"an optimum on paper is fragile under
uncertainty."** The *general* pattern that delivers it:

1. **Optimize** a plan with OR-Tools on *deterministic* inputs — e.g. certify a haul-route cost
   (S07, CP-SAT), or solve the blend LP with nominal supplies (S11, GLOP), or schedule the shop with fixed
   durations (S06, CP-SAT), or build a CVRP plan (S08, Routing).
2. **Simulate** that fixed plan in a **SimPy DES** and report the realised outcomes.
3. **Show the gap** between the optimizer's *planned* cost/finish and the *simulated* outcome.

> **Honest scope (what the shipped scenarios do).** The fully stochastic stress-test — injecting
> travel-time noise / call-arrival randomness and watching *missed time windows* appear — is the
> *aspirational* form of the pattern. The **shipped** SimPy legs (S07 and S11) are **deterministic**: fixed
> service times, inert seed; the gap they expose is **queueing at a shared finite resource** (e.g. the single
> loader), not random-variate slippage. There are **no time windows anywhere in the repo**. **S08 has no
> SimPy leg** (it is a deterministic OR-Tools-vs-PyVRP head-to-head), and **S09 is not an OR-Tools scenario**
> at all. So OR-Tools is paired with a SimPy DES in **S07 and S11 only**. (S06 is the pure-optimization
> anchor — a solver with no simulation, shown as a Gantt chart — so students see what "just optimizing"
> produces before the paired scenarios complicate it.)

## A second pattern: CP-SAT for scheduling, GLOP for continuous mixing

OR-Tools covers two modelling styles the lab teaches side by side:

- **Discrete / combinatorial** (CP-SAT, Routing): "which operation goes where, in what order" — integer and
  interval variables, `no_overlap`, precedence. S06 and S07 (CP-SAT); S08 (Routing).
- **Continuous / linear** (GLOP): "how much of each source to use" — real variables, linear constraints,
  a linear objective. S11's blend is a small LP with deviation variables `d+`/`d-` minimised to land the
  grade on target.

Teaching both from one library is precisely why the research picks OR-Tools as the default: *"one import
covers routing and constraint programming"* — maximum didactic surface for minimum infrastructure.

## Honest trade-offs (grounded in the research)

- **OR-Tools default ≠ optimal (for routing).** The Routing solver without a metaheuristic
  (`GUIDED_LOCAL_SEARCH`) and a time limit returns only the *first feasible* solution. You must set search
  parameters explicitly, or the "OR-Tools vs PyVRP" comparison misleads the student. (CP-SAT for S06's small
  instances *does* prove optimality — our verified ft06 run returns `OPTIMAL` makespan 55 — but routing
  quality depends entirely on the configured strategy and budget.)
- **The matrix is the real bottleneck, not the solver.** For N stops you need an N×N travel-time matrix;
  building it (OSMnx all-pairs on a big graph) dominates cost. The lab caps "live" routing instances small
  (≤~20–30 stops) and precomputes matrices for anything larger.
- **Native code → precompute only.** OR-Tools cannot run in the browser (Pyodide). Everything it produces is
  computed offline and committed as a compact trace; the static site (GitHub Pages, no backend) serves only the
  built SPA + the committed replay artifacts. This is by design, not a limitation of the lab.
- **Determinism must be forced.** CP-SAT multi-worker search and stochastic metaheuristics are
  non-deterministic. For reproducible committed traces, pin a single worker and a fixed `random_seed`, and
  seed the SimPy RNG too. (Our demo and S06 both pin `num_search_workers=1, random_seed=42`.)
- **Don't over-claim what a variant demonstrates.** The S06 and S11 adversarial audits found narrative claims
  contradicted by the committed data (e.g. an S06 variant labelled "short makespan" was actually the
  second-longest; the S11 6-truck "base" variant labelled near-target actually read 63.3% adherence with
  `in_band=0`). The OR machinery was correct; the *prose
  around it* over-reached. Lesson for applying OR-Tools didactically: verify every claim against the actual
  solved numbers before shipping the explanation.

## When to pick OR-Tools vs alternatives

- **OR-Tools (default teaching choice).** Pick it when you want *one* permissive, pure-pip, CPU-only library
  that demonstrates routing *and* CP scheduling *and* LP with maximum documentation and clarity. It is the
  right tool to *teach* the structure of an optimization problem.
- **[PyVRP](../09_pyvrp.md) (SOTA VRP contrast).** Pick it to show students what a *specialised,
  competition-winning* solver achieves — its Hybrid Genetic Search finds materially shorter routes than
  OR-Tools' first-solution + guided-local-search default on the same instance. Use it as the "this is what
  good looks like" exemplar, not the primary teaching object (its internals are less transparent than
  OR-Tools' explicit model).
- **[OSMnx](../11_osmnx.md) + [NetworkX](../10_networkx.md).** Not optimizers — these build the road graph and the
  distance/time matrix that *feed* OR-Tools/PyVRP, and provide drawable route geometry. The live road layer
  for light scenarios.
- **OSRM / VROOM (precompute only).** Heavy Dockerised engines for fast all-pairs matrices and out-of-box VRP
  on large, geography-real instances. Excellent but black-box; keep them in the local pipeline, ship only
  their JSON output. Never put them on the deploy runtime — the site is static GitHub Pages with no backend
  (OSM preprocessing is RAM/disk heavy and stateful).
- **Deprecated, do not use:** AgentPy and desmod are unmaintained and are *not* used anywhere in this lab.
  Mentioned only so nobody reintroduces them.

In short: **OR-Tools to teach and to set the deterministic baseline plan; PyVRP to show the SOTA gap;
OSMnx/NetworkX for the graph; OSRM/VROOM only offline; SimPy to stress-test the plan.**
