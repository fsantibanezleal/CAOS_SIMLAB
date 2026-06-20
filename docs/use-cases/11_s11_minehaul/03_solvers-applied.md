# 03 · Solvers applied — which tools, how, and the lane

This scenario is an **optimize-then-simulate** hybrid, so it uses **two dedicated tools**, one per stage,
each on its real framework. A third capability — graph shortest paths — is provided by the lab's own
`GridNetwork` (Dijkstra) and links the two stages.

| Stage | Question | Tool | Framework node |
|---|---|---|---|
| Plan (blend) | *what is the best tonnage mix?* | **OR-Tools GLOP** (LP simplex) | [08 · OR-Tools](../../frameworks/08_ortools.md) |
| Execution | *can a fixed fleet realize it?* | **SimPy** (process-based DES) | [01 · SimPy](../../frameworks/01_simpy.md) |
| Routing (link) | *how long is each haul?* | `GridNetwork.shortest_path` (Dijkstra) | `simlab/scenarios/_geo.py` |

## 1) The plan — OR-Tools GLOP (`pywraplp`)

**What it is.** GLOP is OR-Tools' **linear-programming** solver: Google's in-house primal-dual simplex,
reached through the `pywraplp` wrapper. It is the right tool because the blend problem is a *textbook LP* —
continuous non-negative tonnages, linear demand and availability constraints, and an objective that is the
**absolute** grade deviation made linear by a `d⁺/d⁻` slack split. GLOP returns the **provable optimum**
(or its determinism-friendly equivalent), not a sample path.

**The concrete API** (from `MineHaulScenario.run`):

```python
from ortools.linear_solver import pywraplp          # lazy import: native, precompute-only
solver = pywraplp.Solver.CreateSolver("GLOP")
inf = solver.infinity()
xs   = [solver.NumVar(0.0, s["supply"], f"x{i}") for i, s in enumerate(src)]  # 0 ≤ x_i ≤ a_i
dpos = solver.NumVar(0.0, inf, "dpos")             # d⁺
dneg = solver.NumVar(0.0, inf, "dneg")             # d⁻
solver.Add(sum(xs) == demand_eff)                                            # meet demand
solver.Add(sum(src[i]["grade"] * xs[i] for i in range(len(src)))
           - gt * demand_eff == dpos - dneg)                                 # grade balance
solver.Minimize(dpos + dneg)                                                 # min |deviation|
solver.Solve()
plan_x = [x.solution_value() for x in xs]          # the tonnage plan per source
```

This is exactly the GLOP usage pattern documented in the OR-Tools wiki node — see
[02 · Usage](../../frameworks/08_ortools/02_usage.md) (the GLOP linear program) and
[03 · Applying](../../frameworks/08_ortools/03_applying.md) (S11 is the GLOP blend-LP row in its scenario
table). The output `plan_x` becomes the **flows** the fleet must realize.

**Why GLOP and not CP-SAT or Routing.** The other two OR-Tools solvers in the lab fit different shapes:
**CP-SAT** is for discrete scheduling (S06 job-shop), **Routing** is for vehicle routing (S07/S08/S09).
The blend is continuous and linear, so the LP simplex is the natural — and fastest — fit.

## 2) The execution — SimPy

**What it is.** SimPy is the lab's **process-based discrete-event** engine: each entity's life-story is a
Python generator that `yield`s, and one event loop advances simulated time. It is the right tool because
the execution is about **shared-resource contention and timing** — trucks competing for loaders, queues,
and whether the planned tonnage fits inside the shift — which is precisely what a DES measures.

**The concrete API** (from `truck_proc` / the run body):

```python
import simpy
env = simpy.Environment()
loaders: dict[int, simpy.Resource] = {}            # one shared loader per source node

def loader_for(node):                               # capacity-1 Resource: trucks queue FIFO
    return loaders.setdefault(node, simpy.Resource(env, capacity=1))

def truck_proc(truck):
    yield env.timeout(0.03 * truck)                 # fixed staggered release (no RNG)
    while env.now < horizon:
        fl = pick_flow(a["node"], duty)             # dispatch decision
        ...                                         # drive empty to source
        with loader_for(fl["src"]).request() as req:
            yield req                               # WAIT for the shared loader
            yield env.timeout(LOAD_TIME)            # HOLD it while loading
        ...                                         # graded loaded haul, tip, re-decide
        yield env.timeout(TIP_TIME)

for k in range(n_trucks):
    env.process(truck_proc(k))
env.run()                                           # drain all events (no `until`)
```

Each load point is a genuine **`simpy.Resource`** (`capacity=1`), so two trucks aimed at the same phase
**queue for it** in arrival order — no hand-rolled event heap. This matches the SimPy node's description
of S11 as the *"simulate" leg* of an optimize-then-simulate hybrid (see
[01 · SimPy](../../frameworks/01_simpy.md) and its [03 · Applying](../../frameworks/01_simpy/03_applying.md)).

**An honesty note on determinism.** The SimPy framework node speaks generically of stress-testing a plan
"under uncertainty / stochastic" travel times. In **this** scenario there is **no stochastic sampling** —
SimPy is used purely for its **shared-resource queueing + event-timing** machinery, and the truck stagger
and dispatch are fixed functions of the inputs. The degradation comes from **structural** fleet shortage
(too few trucks for the far high-grade haul within `H`), not from random variates. The run is therefore a
pure function of `(params, seed)` and reproduces byte-for-byte (the seed is inert).

## 3) The link — Dijkstra over a graded cost

The two stages are joined by graph shortest paths. `GridNetwork.shortest_path(a, b, cost=…)` runs Dijkstra
over the grid; the **loaded** haul passes `loaded_cost` (uphill-only penalty `ρ`), the **empty** return
uses plain distance. Paths are cached per `(a, b, loaded)`. This is the same routing layer used by the
other haul scenarios — see the graph node [10 · NetworkX](../../frameworks/10_networkx.md) for the
shortest-path family (the lab uses a small in-repo Dijkstra here, identical in spirit).

## Live vs precompute lane

**This scenario is precompute-only — there is no live lane.** OR-Tools GLOP is **native C++** code that
cannot be loaded in the browser via Pyodide, so the scenario sets `pure_python = False`, `wheels = []`,
and `engine = "ortools"`. It therefore runs **offline** in the local `.venv`, and the committed,
deterministic trace is what the static web viewer **replays**.

The emitted artifact is the existing **routetrace** format (nodes / edges / agents / routes / barriers /
gauges / legend / kpis / analytic) — nothing in the trace schema or the frontend contract changes for this
scenario. See the [Precompute pipeline](../../guides/01_precompute-pipeline.md) guide (local `.venv` → seeded
trace → replay) and [architecture.md](../../architecture.md) for the two-lane, replay-is-truth design.

## Next

- What the regimes show and how to read the viz: [04 · Results & reading](./04_results-and-reading.md).
- The math behind both stages: [02 · Formalization](./02_formalization.md).
- Node index: [11 · S11](../11_s11_minehaul.md).
