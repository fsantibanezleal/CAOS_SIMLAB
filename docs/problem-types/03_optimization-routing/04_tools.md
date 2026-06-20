# 04 · Tools

> Node: [Optimization & Routing](../03_optimization-routing.md) · prev: [03 · Methods & KPIs](./03_methods-and-kpis.md) · next: [05 · Scenarios](./05_scenarios.md)

The methods in [03 · Methods & KPIs](./03_methods-and-kpis.md) map onto a small set of real, dedicated
solvers. Every tool below is a genuine OR engine — none of this is "minimize a loss with a `for`-loop by
hand." The recommendations and trade-offs come directly from the CAOS_SIMLAB optimization & routing research
dimension.

## The optimization toolbox (what to use for what)

| Tool | Role in the lab | Problems it solves | License | Live in browser? |
|---|---|---|---|---|
| **OR-Tools** (Routing + CP-SAT + GLOP) | **Teaching default** | LP (GLOP), MILP (CBC / branch & bound), CP-SAT scheduling/assignment, TSP, CVRP, VRPTW, PDPTW | Apache-2.0 | **No** (native C++) → precompute |
| **PyVRP** | The "what *good* looks like" contrast | CVRP, VRPTW, PD, MDVRP, prize-collecting, heterogeneous/multi-trip | MIT | No (C++/Python) → precompute |
| **NetworkX + OSMnx** | Road graph + shortest paths + travel-time matrix | Dijkstra, A\*, k-shortest paths, graph download | MIT | **Yes** (pure Python, small graphs) |
| **OSRM / VROOM** | Heavy precompute backends: fast all-pairs matrix + out-of-the-box VRP | `Table` (matrix), `Route`, TSP, CVRP, VRPTW, PDPTW | BSD-2 | No — **local-only**, commit JSON |

> **Deprecated — do not use.** `AgentPy` and `desmod` show up in older OR/simulation tutorials but are
> deprecated and excluded from this lab. If you see them recommended elsewhere, ignore it. For ABM use
> **Mesa / Mesa-Geo**; for DES use **SimPy / Ciw / Salabim** (see the sibling guides:
> [DES](../01_discrete-event-simulation.md) · [ABM](../02_agent-based-modeling.md)).

---

## OR-Tools

[**OR-Tools**](../../frameworks/08_ortools.md) (Google, Apache-2.0) is the teaching default for one reason: a
single `pip install ortools` gives you almost the entire OR curriculum in one importable library — linear
programming (GLOP), mixed-integer programming (CBC), constraint programming (CP-SAT), *and* a dedicated
vehicle-routing layer. That breadth is exactly what a didactic lab wants: the maximum number of teachable
problem types for the minimum infrastructure, CPU-only, on Windows/macOS/Linux.

### The mandatory routing template

OR-Tools Routing returns the *first feasible solution* and stops unless told otherwise — which would make the
OR-Tools-vs-PyVRP comparison dishonest (see
[03 · Methods & KPIs](./03_methods-and-kpis.md#routing--tsp-cvrp-vrptw)). Every routing scenario therefore
sets, explicitly and committed into the manifest:

- a **first-solution strategy** (e.g. `PATH_CHEAPEST_ARC`),
- the **`GUIDED_LOCAL_SEARCH`** metaheuristic for local-search improvement,
- a **time limit**, and
- a **fixed random seed**.

For reproducible CP-SAT / GLOP traces the lab also forces determinism: a single CP-SAT search worker, a fixed
`random_seed`, and a bounded time limit. Deep dive: [OR-Tools framework node](../../frameworks/08_ortools.md)
(Routing API, CP-SAT modelling, GLOP LP, the full `GUIDED_LOCAL_SEARCH` + time-limit + seed template).

## PyVRP

[**PyVRP**](../../frameworks/09_pyvrp.md) (MIT) is the deliberate counterweight: a single-purpose,
competition-winning **Hybrid Genetic Search** solver. It exists in the lab *so the learner can see the gap*
between a capable general-purpose solver running with default settings and a specialised state-of-the-art
solver on the **same instance**. Showing only OR-Tools would teach "this is what an optimizer produces";
showing both teaches "solution quality is a choice you make." PyVRP's HGS is **stochastic**, so its run must
be **seeded** for reproducible committed routes. Deep dive: [PyVRP framework node](../../frameworks/09_pyvrp.md)
(Hybrid Genetic Search, seeding, the fair-comparison setup against OR-Tools).

## NetworkX + OSMnx

[**OSMnx**](../../frameworks/11_osmnx.md) (Boeing, MIT) downloads a real road network from OpenStreetMap as a
[**NetworkX**](../../frameworks/10_networkx.md) (MIT) graph; NetworkX provides Dijkstra, A\*, and k-shortest
paths. Because the stack is **pure Python**, small road graphs *can* run live in the Pyodide Worker, and it is
the readable way to build the distance/time matrix that feeds OR-Tools or PyVRP plus the drawable road
polylines for the map. Deep dives: [NetworkX](../../frameworks/10_networkx.md) ·
[OSMnx](../../frameworks/11_osmnx.md) (building the road graph, Dijkstra/A\*, the travel-time matrix, ODbL
attribution).

> **Attribution is mandatory.** OpenStreetMap data is **ODbL** (share-alike + attribution). Wherever map data
> appears, display **"© OpenStreetMap contributors"**, and per the public-repo hygiene rules commit only
> *rendered geometry* (a pruned OSM graph is a derivative database) — never raw `.graphml`. See
> [`../../../ATTRIBUTION.md`](../../../ATTRIBUTION.md).

## OSRM / VROOM

For large, geography-real instances, an all-pairs matrix from OSMnx/NetworkX is *slow* — and **the matrix, not
the solver, is usually the real bottleneck.** For N stops you need an N×N travel-time matrix, and OSMnx
all-pairs on a big graph does not scale.

**OSRM / VROOM (Docker precompute backends — local-only, not a pip pipeline)** run via Docker on the local
precompute machine only:

- [**OSRM**](https://github.com/Project-OSRM/osrm-backend) (BSD-2) is a high-performance C++ engine over
  OpenStreetMap; its `Table` service returns all-pairs durations/distances fast, and it also yields real road
  geometry. Preprocessing an OSM extract is RAM- and disk-heavy and stateful.
- [**VROOM**](https://github.com/VROOM-Project/vroom) (BSD-2) is an out-of-the-box VRP engine that wraps OSRM
  for real matrices and solves CVRP/VRPTW/PDPTW in milliseconds — convenient, but a *black box* relative to
  OR-Tools/PyVRP, so it teaches less.

Neither belongs on the host: this is a static GitHub Pages site with no application server (see the
[precompute pipeline](../../architecture/05_precompute-pipeline.md)). **Commit only their JSON output** — the
matrices, the routes, the geometry — never the running service.

> **Rule of thumb:** keep *live* instances small (≈ ≤ 20–30 stops) using OSMnx/NetworkX; **precompute the
> matrix** for anything larger using OSRM, and commit the JSON.

---

## Where this runs: precompute-only, never live

OR-Tools is **native C++ with a Python wrapper** — it cannot be compiled to WASM and therefore **never runs
live** in the Pyodide Worker. PyVRP (C++/Python) and the OSRM/VROOM backends are in the same boat. Per the
lab's [measured live/precompute gate](../../architecture/03_the-gate.md):

- **Engine gate:** must be pure-Python to run live. OR-Tools / PyVRP fail this → **always precompute**.
- The optimized plan is solved **offline** on the local pipeline, emitted as a **seeded JSON/Arrow trace +
  manifest**, and the front end only **replays** it with a scrubber under the *"precomputed due to cost; full
  pipeline in the repo"* banner.
- **Live knobs over a precomputed plan:** the editable parameters in routing scenarios mutate only the SimPy
  stochastic-delay replay over a fixed optimized plan (or a toy ≤ 20-stop heuristic in Pyodide) — they do
  **not** re-solve OR-Tools in the browser.

The only pure-Python optimization piece that *can* touch the live tier is **NetworkX/OSMnx shortest paths on a
small graph**.

---

## License & attribution summary

All optimization/routing tools here are permissive and mutually compatible:

| Tool | License |
|---|---|
| OR-Tools | Apache-2.0 |
| PyVRP | MIT |
| NetworkX, OSMnx | MIT |
| OSRM, VROOM | BSD-2-Clause |
| **OpenStreetMap data** | **ODbL** — display "© OpenStreetMap contributors", commit rendered geometry only |
| Benchmark instances (Solomon, Gehring-Homberger, CVRPLIB, OR-Library) | cite the originating papers |

See [`../../../LICENSES.md`](../../../LICENSES.md) and [`../../../ATTRIBUTION.md`](../../../ATTRIBUTION.md).
Repo: <https://github.com/fsantibanezleal/CAOS_SIMLAB>.

## Per-framework deep dives

This node is the map; the implementation detail for each tool lives in its own framework node:

- [OR-Tools](../../frameworks/08_ortools.md) — Routing API, CP-SAT modelling, GLOP LP, the mandatory
  `GUIDED_LOCAL_SEARCH` + time-limit + seed template.
- [PyVRP](../../frameworks/09_pyvrp.md) — Hybrid Genetic Search, seeding, the fair-comparison setup against
  OR-Tools.
- [NetworkX](../../frameworks/10_networkx.md) · [OSMnx](../../frameworks/11_osmnx.md) — the road graph,
  Dijkstra/A\*, the travel-time matrix, ODbL attribution.
- [SimPy](../../frameworks/01_simpy.md) — the DES that replays optimized plans under uncertainty.

## Sources

This node is grounded in the CAOS_SIMLAB research and synthesis:

- OR-Tools (Apache-2.0): <https://github.com/google/or-tools> · VRPTW guide:
  <https://developers.google.com/optimization/routing/vrptw> · CP-SAT primer:
  <https://d-krupke.github.io/cpsat-primer/04B_advanced_modelling.html>
- PyVRP (MIT): <https://github.com/PyVRP/PyVRP> · HGS paper: <https://arxiv.org/abs/2403.13795>
- VROOM (BSD-2): <https://github.com/VROOM-Project/vroom>
- OSRM (BSD-2, self-host + `Table`): <https://talos.tools/selfhosted/open-source-routing-machine-osrm>
- OSMnx (MIT): <https://github.com/gboeing/osmnx>
- Simheuristics / agile-optimization survey: <https://www.mdpi.com/2076-3417/13/1/101>
- Sim-optimization for stochastic location-routing: <https://link.springer.com/article/10.1057/jos.2015.15>
- CVRPLIB / Solomon / Gehring-Homberger: <https://github.com/junhua/CVRPLIB>
