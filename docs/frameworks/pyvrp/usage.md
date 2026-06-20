# PyVRP — Usage

PyVRP solves the Vehicle Routing Problem with **Hybrid Genetic Search (HGS)**: it
evolves a population of solutions, repairs and improves each with a fast local
search, and keeps a diverse, high-quality pool. You describe the instance, hand
it a **stopping criterion**, and read back the **best** solution found within that
budget. There is no "first feasible then maybe improve" trap — given more time it
keeps tightening the routes, which is exactly why it is the lab's SOTA exemplar.

## Key concepts and API

PyVRP exposes two layers; this lab uses the high-level `Model`.

| Object | What it is |
|---|---|
| `Model` | High-level builder. You `add_depot`, `add_client`, `add_vehicle_type`, optionally `add_edge`, then `.solve(...)`. |
| `Depot` | A start/end location for vehicles. |
| `Client` | A location to serve, with `delivery`/`pickup` demand, optional time window (`tw_early`/`tw_late`), `service_duration`, `prize`, `required`. |
| `VehicleType` | A fleet of identical vehicles: `num_available`, `capacity`, optional `fixed_cost`, depots, time windows, distance/duration unit costs. |
| `Edge` | An explicit arc with integer `distance` (and optional `duration`). If you omit edges, PyVRP derives Euclidean distances from coordinates. |
| `stop` criteria | `MaxRuntime(seconds)` or `MaxIterations(n)` (in `pyvrp.stop`) — the budget that bounds `solve`. |
| `Result` | What `solve` returns: `.cost()`, `.is_feasible()`, `.best` (the best `Solution`), `.summary()`. |
| `Solution` / `Route` | `solution.routes()` yields `Route`s; each route exposes `.visits()` (location indices), `.distance()`, `.delivery()`, `.duration()`, feasibility flags. |

**Integer engine — the single most important practical detail.** PyVRP works in
**integers** (distances, demands, capacities, times). Continuous coordinates are
fine as input, but the cost matrix it uses must be integer. To keep things exact
and reproducible, **scale** real distances by a constant (e.g. ×100) and round to
`int` when you supply edges. This avoids silent precision loss and makes runs
byte-stable.

**Determinism.** `Model.solve(..., seed=<int>)` fixes HGS's RNG. With a fixed
instance, integer edges, and a fixed seed, repeated runs produce identical
solutions. (A *runtime* budget can in principle vary with machine load; an
*iteration* budget, `MaxIterations`, is the most portable for exact replay. The
example below uses a short runtime budget and still reproduces exactly on this
machine.)

**Index numbering gotcha.** In the `Model`, locations are numbered with the
**depot as index 0** and clients as indices **1..N** in the order added. So
`route.visits()` returns values in `1..N`, and a visit value `idx` corresponds to
the `idx`-th client you added. Label your output accordingly (see the example).

## Minimal runnable example, walked through

The script lives next to this file: [`example.py`](./example.py). It solves a
tiny CVRP: a depot plus eight clients on an integer grid, total demand 16, a
fleet of three vehicles each with capacity 6 (so at least three vehicles are
needed), minimising total distance.

Step by step:

1. **Hand-code the instance.** A depot coordinate, then eight `(x, y, demand)`
   clients. `CAPACITY=6` is deliberately tight (total demand 16 > 2×6) so the
   capacity constraint actually binds and the solver must use 3 vehicles.

2. **Scaled integer distances.**
   `euclidean(a, b) = round(hypot(dx, dy) * 100)` returns a non-negative integer.
   The ×100 `SCALE` preserves two decimals of the real Euclidean distance inside
   PyVRP's integer engine.

3. **Build the model.**
   - `m.add_depot(x, y)` — the single depot (location 0).
   - `m.add_vehicle_type(num_available=3, capacity=6)` — one homogeneous fleet.
   - `m.add_client(x, y, delivery=d)` for each client (locations 1..8).
   - `m.add_edge(frm, to, distance=...)` for **every ordered pair** of locations,
     using the scaled integer distance. Supplying edges explicitly makes the cost
     matrix exact and the run fully reproducible (PyVRP would otherwise compute
     Euclidean distances itself).

4. **Solve.** `model.solve(stop=MaxRuntime(2.0), seed=42, display=False)` runs HGS
   for ~2 seconds with a fixed seed. `display=False` suppresses the live
   iteration log so stdout stays clean and deterministic.

5. **Read the result.** `result.is_feasible()`, `result.cost()` (in **scaled**
   units), and `result.best` for the routes. We divide distances back by `SCALE`
   to report human-readable units, and print each route as
   `depot -> clients -> depot` with its load and distance.

### Run it

From the repository root:

```
.venv/Scripts/python.exe docs/frameworks/pyvrp/example.py
```

### Verified output

This is the **actual captured stdout** from running the script in the project
`.venv` (PyVRP 0.13.4, Python 3.13.0). It is reproducible: running the script a
second time produced byte-identical output.

```
feasible            : True
total cost (scaled) : 22998
total distance (u)  : 229.98
routes (vehicles)   : 3

vehicle 1: depot -> c2 -> c3 -> c7 -> depot  | load 5/6  dist 90.49
vehicle 2: depot -> c6 -> c1 -> c8 -> depot  | load 6/6  dist 83.58
vehicle 3: depot -> c4 -> c5 -> depot  | load 5/6  dist 55.91
```

How to read it:

- **feasible: True** — every client is served and no vehicle exceeds capacity.
- **total cost (scaled) 22998** — the objective PyVRP minimises, in the ×100
  integer space. Dividing by `SCALE` gives **229.98** distance units, the sum of
  the three route distances (90.49 + 83.58 + 55.91 = 229.98).
- **3 routes**, each respecting capacity 6: loads 5, 6, 5 — total 16 = the full
  demand. Vehicle 2 is packed to the cap (6/6), which is the constraint binding as
  intended. Every client `c1..c8` appears exactly once across the routes.

This is the kind of high-quality, balanced solution HGS produces on a small
instance almost instantly; the value of PyVRP shows on larger instances where a
default first-solution heuristic leaves a lot of distance on the table.
