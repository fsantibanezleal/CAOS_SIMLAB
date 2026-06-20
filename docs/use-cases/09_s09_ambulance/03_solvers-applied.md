# 03 · Solvers applied — S09 Ambulance Dispatch

Which dedicated tools solve this scenario and **how** — the concrete API and approach, why each tool, and the
live-vs-precompute lane. This describes what the shipped code in
[`../../../simlab/scenarios/s09_ambulance.py`](../../../simlab/scenarios/s09_ambulance.py) actually does.

## The two solvers actually used

S09 is a **two-stage pipeline**: a graph layer computes the routes, and a discrete-event engine replays the
call stream and the dispatch decisions over those routes.

### NetworkX — the road / shortest-path layer

[10 · NetworkX](../../frameworks/10_networkx.md) builds a **real undirected road graph** over the shared
`GridNetwork` (`build_road_graph`): nodes and edges mirror `_geo` exactly, and every segment's weight is its
euclidean length. NetworkX then answers two distinct questions:

- **Dispatch metric** — the dispatcher needs, for each unit, the shortest-path *length* origin → scene. The
  scenario wraps NetworkX in a small `RoadRouter` that **memoises single-source Dijkstra per origin**
  (`nx.single_source_dijkstra`), caching both `lengths` and `paths`. Dispatch reads `router.length(node_i, c_k)`.
- **Committed geometry** — the chosen unit's trip needs the full node *path* for each leg
  (`base→scene`, `scene→hospital`, `hospital→home`). Dispatch reads `router.path(src, dst)` (also from the
  cache) and `timed_legs` (in `_geo.py`) expands each path into timed `{a,b,t0,t1}` legs for the trace.

**Why NetworkX.** It is the lab's pure-Python graph + shortest-path layer (Dijkstra / A\* / k-shortest), the
canonical *upstream* road layer that feeds both optimizers and simulators (see the framework node). On the
unit grid its distance-weighted Dijkstra reproduces the lab's earlier plain-distance Dijkstra **byte-for-byte**,
so adopting it changed the *mechanism*, not the committed trace. Single-source memoisation matters here because
dispatch evaluates *many* origin→scene lengths per call across the fleet.

### SimPy — the discrete-event replay of calls + dispatch

[01 · SimPy](../../frameworks/01_simpy.md) replays the call stream as a real **process-based DES**
(`_simulate`). The structure is deliberately minimal:

- A single **`arrivals` generator** walks the up-front call list and `yield env.timeout(t_k − prev)` to
  advance simulated time to each call's instant; then it calls `_dispatch(...)` **synchronously**.
- `_dispatch` is the formalization's argmin (see [02 · Formalization](./02_formalization.md)): it scores every
  unit by `max(t_k, free_i) + length(node_i, c_k)/v`, commits the best, expands the three legs, appends them
  to the agent trace and to the incident markers, and advances that unit's `free` clock and the run's
  `busy_time` / `responses` accumulators.
- `env.process(arrivals()); env.run()` drives the whole window.

**Why SimPy.** SimPy is the lab's primary DES engine — pure-Python, zero third-party deps, small enough to
load in the browser via Pyodide. It is the natural home for *entities flowing through activities under
randomness where the waiting is what you measure*. Here it provides the event clock and the time-ordered
dispatch loop that produce the response-time distribution, coverage and offered load.

> **A subtlety worth knowing.** Dispatch consumes **zero** simulated time and arrivals fire strictly in time
> order, so SimPy makes the **same** greedy decisions as a plain sequential sweep — the DES is the *mechanism*,
> not a behaviour change. And `_dispatch` is fed the recorded call instant `t_k` (the up-front draw), **not**
> the accumulated float `env.now`, so trip times are byte-identical to the committed trace while the SimPy
> clock still drives event ordering. This is the discipline that keeps "replay = truth" exact.

## On OR-Tools (and why it is *not* the solver here)

The lab's optimization & routing family is the **optimize-then-simulate** pattern, with
[08 · OR-Tools](../../frameworks/08_ortools.md) as the optimizer for its siblings (S07 haul routing, S08 VRP,
S11 mine-haul). Earlier drafts of the lab's index tables once sketched S09 in that family ("OR-Tools + SimPy +
graph", the aspirational shape of an EMS dispatch/relocation *plan*); the current summaries no longer do —
they list S09 as **SimPy + NetworkX**, matching the shipped code. **The shipped S09 scenario does not call
OR-Tools.** Its dispatch rule is an **exact nearest-available argmin** over the fleet — a one-line optimum
that needs no solver — and routing is NetworkX Dijkstra. The scenario declares
`wheels = ["numpy", "simpy", "networkx"]` and contains no OR-Tools import; it is the only optimize-then-simulate
*sibling* whose decision is closed-form rather than a search. If S09 ever grew a true **station-siting** or
**move-up relocation** plan (which units to pre-position where), *that* plan would be the OR-Tools job, with
SimPy then stress-testing it — but that is out of scope for the current instance (see
[01 · Assumptions](./01_assumptions.md)).

## Live vs precompute lane

S09 runs in the **live lane** — in the visitor's browser via Pyodide. It qualifies because all three live
gates hold: it is **pure-Python** (SimPy ✅ and NetworkX ✅ both load in Pyodide; `pure_python = True` in the
scenario), it is **fast**, and the route trace is **small**. `numpy` and `networkx` load via
`pyodide.loadPackage` and `simpy` via `micropip` — the live wheel closure (`LIVE_WHEELS`). This is exactly
why S09 is *not* a precompute scenario: it has no native dependency. (Its OR-Tools siblings S07/S08/S11 are
native C++ → precompute-only; the live test asserts `s09_ambulance` is in the live set and those siblings are
not.) Live and precomputed render through one code path, and the build verifies **byte-equality** between a
live Pyodide run and the committed trace for the default params — so "live" is the slider responsiveness, not
a different model. See [the live-lane guide](../../guides/02_live-lane-pyodide.md).

---

Next: [04 · Results & reading](./04_results-and-reading.md) · Back to the [node index](../09_s09_ambulance.md).
