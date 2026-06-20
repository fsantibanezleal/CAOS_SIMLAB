# OR-Tools — Applying it to real problems and to our scenarios

OR-Tools answers a different question from the simulators in this lab. SimPy, Mesa and Ciw ask *"given a
policy and random events, what happens?"* OR-Tools asks *"what is the best decision?"* — it computes an
**optimum** (a schedule, a route, a blend), not a sample path. This contrast is itself a teaching point: the
optimization tab shows a plan that is optimal *on paper*; the simulation tabs then show that plan degrade
under uncertainty.

## Which scenarios use it, and which sub-solver

Per the scenario→tool map, OR-Tools is the optimization engine in five scenarios across three sub-solvers:

| Scenario | Sub-solver | What it optimises |
|---|---|---|
| **S06 — Job-Shop** | **CP-SAT** | Operation start times that minimise the makespan (disjunctive scheduling). |
| **S07 — Construction haul routing** | **Routing** (CP) | Truck routes / fleet assignment on a real road graph (paired with SimPy + OSMnx/NetworkX). |
| **S08 — Vehicle routing (VRP)** | **Routing** (CP) | CVRP/VRPTW plan; OR-Tools is the *teaching default*, PyVRP the SOTA contrast (paired with SimPy). |
| **S09 — Ambulance dispatch** | **Routing** (CP) | Base dispatch plan over a city graph, then DES replays stochastic calls (paired with SimPy + graph). |
| **S11 — Mine multi-destination haul** | **GLOP** (LP) | The plant-**blend** linear program: mix phase tonnages to hit a target grade subject to supply caps (paired with SimPy). |

CP-SAT and GLOP are demonstrated in `example.py`; the Routing solver in S07/S08/S09 is the same `pywrapcp`
family (a routing model is internally a constraint-programming model with index/arc variables).

## The core pattern: optimize-then-simulate

The single most valuable lesson the research identifies is **"an optimum on paper is fragile under
uncertainty."** The pattern that delivers it:

1. **Optimize** a plan with OR-Tools on *deterministic* inputs — e.g. solve a VRP with fixed travel times
   (S07/S08/S09), or solve the blend LP with nominal supplies (S11), or schedule the shop with fixed
   durations (S06).
2. **Simulate** that fixed plan under stochastic perturbations in a **SimPy DES** — inject travel-time noise,
   loader/dump-queue delays, stochastic call arrivals — and watch the "optimal" plan slip: missed time
   windows, queueing, idle resources, off-spec blend.
3. **Show the gap.** Display the optimizer's *planned* cost/finish next to the *simulated distribution* of
   actual outcomes. That gap is the whole point — it motivates simheuristics and robust optimization.

This is why OR-Tools and SimPy are paired in S07/S08/S09/S11: the optimizer produces the plan, the simulator
stress-tests it. (S06 is the pure-optimization anchor — a solver with no simulation, shown as a Gantt chart,
so students see clearly what "just optimizing" produces before the paired scenarios complicate it.)

## A second pattern: CP-SAT for scheduling, GLOP for continuous mixing

OR-Tools covers two modelling styles the lab teaches side by side:

- **Discrete / combinatorial** (CP-SAT, Routing): "which operation goes where, in what order" — integer and
  interval variables, `no_overlap`, precedence. S06, S07–S09.
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
  computed offline and committed as a compact trace; the VPS serves only the FastAPI API + replay artifacts.
  This is by design, not a limitation of the lab.
- **Determinism must be forced.** CP-SAT multi-worker search and stochastic metaheuristics are
  non-deterministic. For reproducible committed traces, pin a single worker and a fixed `random_seed`, and
  seed the SimPy RNG too. (Our demo and S06 both pin `num_search_workers=1, random_seed=42`.)
- **Don't over-claim what a variant demonstrates.** The S06 and S11 adversarial audits found narrative
  claims contradicted by the committed data (e.g. an S06 variant labelled "short makespan" was actually the
  second-longest; an S11 "plan met" variant read 66.7% adherence). The OR machinery was correct; the
  *prose around it* over-reached. Lesson for applying OR-Tools didactically: verify every claim against the
  actual solved numbers before shipping the explanation.

## When to pick OR-Tools vs alternatives

- **OR-Tools (default teaching choice).** Pick it when you want *one* permissive, pure-pip, CPU-only library
  that demonstrates routing *and* CP scheduling *and* LP with maximum documentation and clarity. It is the
  right tool to *teach* the structure of an optimization problem.
- **PyVRP (SOTA VRP contrast).** Pick it to show students what a *specialised, competition-winning* solver
  achieves — its Hybrid Genetic Search finds materially shorter routes than OR-Tools' first-solution +
  guided-local-search default on the same instance. Use it as the "this is what good looks like" exemplar,
  not the primary teaching object (its internals are less transparent than OR-Tools' explicit model).
- **OSMnx + NetworkX.** Not an optimizer — these build the road graph and the distance/time matrix that
  *feed* OR-Tools/PyVRP, and provide drawable route geometry. The live road layer for light scenarios.
- **OSRM / VROOM (precompute only).** Heavy Dockerised engines for fast all-pairs matrices and out-of-box VRP
  on large, geography-real instances. Excellent but black-box; keep them in the local pipeline, ship only
  their JSON output. Never host on the GPU-less VPS (OSM preprocessing is RAM/disk heavy and stateful).
- **Deprecated, do not use:** AgentPy and desmod are unmaintained and are *not* used anywhere in this lab.
  Mentioned only so nobody reintroduces them.

In short: **OR-Tools to teach and to set the deterministic baseline plan; PyVRP to show the SOTA gap;
OSMnx/NetworkX for the graph; OSRM/VROOM only offline; SimPy to stress-test the plan.**
