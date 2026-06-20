# 03 · Solvers applied

S07 is the *optimize-then-simulate* archetype, and it genuinely **uses the three frameworks it documents** —
no hand-rolled NumPy graph or event loop. Each tool owns one well-defined part of the pipeline:
**graph → route geometry (NetworkX) → cost certificate (OR-Tools) → DES replay (SimPy)**. All code references
are to [`simlab/scenarios/s07_haul.py`](../../../simlab/scenarios/s07_haul.py).

## NetworkX — the route geometry (the *optimize* step's shape)

**What it does.** `build_road_graph(net, cost)` constructs a real `nx.DiGraph` over the shared graded
`GridNetwork` terrain (same nodes/edges/elevation/blocked cells as `_geo.py`), adding one directed arc per
segment in each direction with `weight = cost(a, b)`. `nx_route(net, cost, src, dst)` then calls
`nx.dijkstra_path(g, src, dst, weight="weight")`. It is called three ways in `run()`:

- the **loaded climb** `up_path` — weighted by `loaded_cost` (the graded cost);
- the **empty return** `down_path` — weighted by plain `net.dist`;
- two **reference paths** for `g*` — a grade-0 `direct` and a grade-50 `detour`, from which `ΔL/ΔC` is read.

**Why NetworkX.** It is the in-process, readable shortest-path layer; its edge weights mirror the lab's
graded `_geo` grid **byte-for-byte**, so the seeded routing trace replays exactly ("replay = truth"). It is
intentionally not a fleet optimizer (that is OR-Tools) and not a simulator (that is SimPy) — it sits upstream
of both, producing the route polylines the simulator animates. See
[NetworkX framework node](../../frameworks/10_networkx.md).

## OR-Tools CP-SAT — the route-cost certificate (the native optimizer)

**What it does.** `ortools_route_cost(net, cost, src, dst)` independently re-solves the **same** shortest
path as a **min-cost single-unit-flow ILP**:

- **Decision:** `x[a,b] ∈ {0,1}` selects each directed arc (`model.new_bool_var`).
- **Constraint:** unit flow conservation — `out − in = +1` at the source, `−1` at the destination, `0`
  elsewhere — so the selected arcs form a single src→dst path.
- **Objective:** minimize the integer-scaled total route cost
  `Σ round(cost(a,b)·CP_SCALE)·x[a,b]`, with `CP_SCALE = 1000` (mm) keeping CP-SAT exact on a real-valued
  cost.

The run computes the NetworkX path cost (`up_cost_nx`) and asserts CP-SAT's optimum agrees within
`CP_COST_TOL = 0.01` (≥ the `1/CP_SCALE` quantization), raising `RuntimeError` if they disagree.

**Why OR-Tools, and why it certifies cost but not geometry.** CP-SAT is the lab's native optimizer; using it
is what correctly makes the scenario `pure_python = False` (native C++ → precompute). Multiple **equal-cost**
optimal routes exist (e.g. `r_switch`, `r_passR`, `r_wall`), so CP-SAT may tie-break the **path** arbitrarily
— only the **cost** is well-defined. Therefore the **path geometry comes from NetworkX** (byte-stable,
matches `_geo`), while CP-SAT **certifies the optimum cost** the planner commits to. Determinism is forced
with `num_search_workers = 1`, `random_seed = 42` (`CP_RANDOM_SEED`), and a bounded
`max_time_in_seconds = 10.0` (`CP_TIME_LIMIT_S`) — the ILP solves to OPTIMAL well inside the limit and the
optimum cost is **stable across runs**. See [OR-Tools framework node](../../frameworks/08_ortools.md).

## SimPy — the DES replay (the *simulate* step)

**What it does.** `_simulate(...)` replays the closed finite-source haul cycle as a real discrete-event
simulation. Each truck is a SimPy process that:

1. staggers its start slightly (`env.timeout(0.02·k)`) so the fleet does not hit the loader in lockstep;
2. requests a shared `simpy.Resource(env, capacity=n_loaders)` and **waits** (FIFO over the finite fleet);
3. **holds** a loader for `load_time` — unless `start_load + load_time > horizon`, in which case it stops;
4. **hauls up** the planned `up_path` (timed by `loaded_cost` via `timed_legs`), **dumps** (`dump_time`),
   then **hauls back** the `down_path`;
5. re-enters the queue until `env.now ≥ horizon`.

It accumulates `loads`, `busy_time` and `wait_time`, and the per-truck `legs` that drive the animation.

**Why SimPy.** The shared loader is the binding resource; with one loader, adding trucks only lengthens the
queue, so throughput saturates at the loader rate exactly as the machine-repair / `M/M/1//N` model predicts.
SimPy is the "simulate" leg of the optimize-then-simulate hybrids — *the optimizer proposes, the simulator
disposes*. Here the FIFO `Resource` exactly reproduces an earliest-free-loader policy, and with **no
stochastic variates** the trace is a pure function of (params, seed). See
[SimPy framework node](../../frameworks/01_simpy.md).

## Live vs precompute lane

This scenario runs in the **precompute lane** (`pure_python = False`, `engine = "ortools"`, `wheels = []`):
OR-Tools CP-SAT is native C++ and cannot run in the browser (Pyodide), so it never enters the live wheel
closure. Instead the pipeline runs offline in the local `.venv`, certifies the route, runs the SimPy replay,
and commits a deterministic [route trace](../../../manifests/s07_haul.json) the web viewer replays. Because
both the optimization (unique shortest path + seeded CP-SAT) and the DES (fixed service times) are
deterministic, the committed artifacts are **byte-identical across runs** — the deterministic-replay contract.

See the [Precompute pipeline guide](../../guides/01_precompute-pipeline.md) and the
[Optimization & Routing problem-type guide](../../problem-types/03_optimization-routing.md) for the broader lane
design.
