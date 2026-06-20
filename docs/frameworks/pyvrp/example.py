"""Minimal CVRP solved with PyVRP (state-of-the-art Hybrid Genetic Search).

A tiny Capacitated Vehicle Routing Problem: one depot plus eight clients on an
integer grid, each client with a delivery demand. A small homogeneous fleet of
capacity-limited vehicles must serve every client, each vehicle running one
depot -> clients -> depot tour, minimising total travelled distance.

We build the instance with PyVRP's high-level ``Model`` API, add an explicit
edge for every ordered pair of locations (rounded Euclidean distance, scaled to
integers so PyVRP's integer engine stays exact and deterministic), then solve
under a short runtime budget with a fixed seed. The script prints the total
cost, whether the solution is feasible, and the per-vehicle routes.

Deterministic: coordinates/demands are hand-coded, distances are integer, and
``Model.solve`` is given a fixed ``seed``. Re-running yields identical output.

Run from the repository root:
    .venv/Scripts/python.exe docs/frameworks/pyvrp/example.py
"""

from __future__ import annotations

import math

from pyvrp import Model
from pyvrp.stop import MaxRuntime

# --- Hand-coded instance --------------------------------------------------
# Location 0 is the depot; locations 1..8 are clients. Coordinates are integer
# grid points; demand is the delivery quantity per client (depot demand = 0).
DEPOT = (35, 35)
CLIENTS = [
    # (x,  y,  demand)
    (20, 22, 3),
    (25, 50, 2),
    (45, 52, 1),
    (55, 30, 2),
    (48, 18, 3),
    (30, 12, 1),
    (60, 60, 2),
    (15, 45, 2),
]

NUM_VEHICLES = 3
CAPACITY = 6          # tight enough to force >1 vehicle (total demand = 16)
SCALE = 100           # integer scaling so rounding does not lose precision
SEED = 42
RUNTIME_S = 2.0       # short, fixed time budget


def euclidean(a: tuple[int, int], b: tuple[int, int]) -> int:
    """Scaled, rounded Euclidean distance -> non-negative integer."""
    return int(round(math.hypot(a[0] - b[0], a[1] - b[1]) * SCALE))


def build_model() -> Model:
    m = Model()
    depot = m.add_depot(x=DEPOT[0], y=DEPOT[1])
    # One vehicle type: NUM_VEHICLES identical vehicles, each capacity CAPACITY.
    m.add_vehicle_type(num_available=NUM_VEHICLES, capacity=CAPACITY)

    clients = [
        m.add_client(x=x, y=y, delivery=d) for (x, y, d) in CLIENTS
    ]

    # Explicit symmetric edges for every ordered pair (depot + clients). PyVRP
    # would derive Euclidean distances on its own, but supplying integer edges
    # makes the cost matrix exact and the run fully reproducible.
    locations = [depot] + clients
    coords = [DEPOT] + [(x, y) for (x, y, _) in CLIENTS]
    for i, frm in enumerate(locations):
        for j, to in enumerate(locations):
            if i == j:
                continue
            m.add_edge(frm, to, distance=euclidean(coords[i], coords[j]))
    return m


def main() -> None:
    model = build_model()
    # display=False keeps stdout clean and deterministic (no live iteration log).
    result = model.solve(stop=MaxRuntime(RUNTIME_S), seed=SEED, display=False)

    best = result.best
    print(f"feasible            : {result.is_feasible()}")
    print(f"total cost (scaled) : {result.cost()}")
    print(f"total distance (u)  : {best.distance() / SCALE:.2f}")
    print(f"routes (vehicles)   : {best.num_routes()}")
    print()

    for k, route in enumerate(best.routes(), start=1):
        # route.visits() are LOCATION indices in PyVRP's ProblemData numbering:
        # the depot is index 0 and the clients are indices 1..N in the order they
        # were added. So a visit value `idx` is client number `idx` (CLIENTS[idx-1]).
        stops = list(route.visits())
        names = " -> ".join(f"c{idx}" for idx in stops)
        load = route.delivery()[0]
        dist = route.distance() / SCALE
        print(
            f"vehicle {k}: depot -> {names} -> depot"
            f"  | load {load}/{CAPACITY}  dist {dist:.2f}"
        )


if __name__ == "__main__":
    main()
