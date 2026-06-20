# S07 — Construction Haul Routing (use case)

A fixed fleet of trucks endlessly recirculates between a **load** point on low ground and a **dump** on
high ground, over a synthetic road network where a **ridge** walls the two apart and **elevation drives the
loaded cost**. The optimal haul route is a genuine trade-off — going straight over the crest is short but
climbs hard, while detouring to a **low pass** is longer but nearly flat — so the route *switches* at a
critical grade `g*`. Behind the load sits a **shared loader**, the binding resource: trucks are a finite
calling population (a machine-repair / `M/M/1//N` queue), so throughput **saturates at the loader rate** and
the fleet must be **matched** to the loader. This node is the *optimize-then-simulate* archetype: the route
geometry is found exactly with **NetworkX** Dijkstra, its optimum cost is certified by **OR-Tools** CP-SAT,
and the closed haul cycle is replayed as a real **SimPy** discrete-event simulation.

## Read in order

1. [01 · Assumptions & scope](./07_s07_haul/01_assumptions.md) — the canonical instance, what is and is
   not modeled.
2. [02 · Formalization](./07_s07_haul/02_formalization.md) — sets, parameters, variables, the graded
   route cost, the route-switch grade `g*`, the finite-source queue, and the KPIs.
3. [03 · Solvers applied](./07_s07_haul/03_solvers-applied.md) — how NetworkX, OR-Tools CP-SAT and SimPy
   each solve their part, why each tool, and the live-vs-precompute lane.
4. [04 · Results & reading](./07_s07_haul/04_results-and-reading.md) — the variant families, what the
   KPIs show, and how to read the animation.

## Scenario & frameworks

- Scenario code: [`simlab/scenarios/s07_haul.py`](../../simlab/scenarios/s07_haul.py) ·
  manifest [`manifests/s07_haul.json`](../../manifests/s07_haul.json)
- Frameworks used: [NetworkX](../frameworks/10_networkx.md) (route geometry) ·
  [OR-Tools](../frameworks/08_ortools.md) (CP-SAT cost certificate) ·
  [SimPy](../frameworks/01_simpy.md) (DES replay)
- Problem-type guide: [Optimization & Routing](../problem-types/03_optimization-routing.md)
- Pipeline: [Precompute pipeline](../guides/01_precompute-pipeline.md)
