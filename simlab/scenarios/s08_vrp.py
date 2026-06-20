"""S08 — Vehicle Routing Problem (capacitated VRP) — two real solvers, side by side.

A depot and N customers (each with a demand) on a synthetic road grid; route K capacity-limited vehicles
to serve every customer minimizing total travel distance. The classic optimize-then-route problem. Both
solvers here are real, native-code optimizers, so the scenario is precomputed; the committed trace holds
the plans, which the web replays as vehicles driving the network.

This scenario runs the SAME capacitated instance through TWO state-of-the-art VRP solvers and exposes BOTH
plans so the lab can show the contrast:

* **OR-Tools routing** (Google) — the *primary* plan, carried in the trace's ``routes``/``agents``/``kpis``
  exactly as the app already renders. Configured with ``PATH_CHEAPEST_ARC`` + ``GUIDED_LOCAL_SEARCH`` and,
  critically, a *deterministic* stopping rule — a fixed ``solution_limit`` on a single search thread (the
  OR-Tools Routing layer exposes no generic random_seed; determinism comes from single-thread GLS + the
  solution-count cap) — rather than a wall-clock ``time_limit``. A wall-clock limit makes the optimum machine-dependent (a fast
  laptop explores more); a solution-count limit makes the committed trace byte-stable on any machine —
  the "replay = truth" contract the lab depends on. OR-Tools also carries a *global-span* cost so it
  balances route lengths (it minimises the longest route, keeping every vehicle busy).

* **PyVRP** (Hybrid Genetic Search, the current open VRP state of the art) — solved on the *identical*
  scaled-integer distance matrix for a fair comparison, with ``MaxIterations`` (a deterministic stop, not
  wall time) and a fixed ``seed``. PyVRP minimises *pure total distance*, so its plan is typically shorter
  in total but less balanced than OR-Tools'. The full PyVRP plan (per-vehicle grid polylines, loads, and
  KPIs) is exposed under the trace's ``analytic`` field — a free-form schema slot — so the frontend can
  overlay or toggle the SOTA contrast without any change to the route-trace schema.

Both solvers see one instance built from one seeded NumPy RNG; distances are shortest paths on the grid,
scaled to integers so both integer engines stay exact. Deterministic from (params, seed): re-running yields
the same trace. Reference: ``docs/frameworks/09_pyvrp/example.py`` (the verified PyVRP Model API).
"""
from __future__ import annotations

from dataclasses import dataclass

from ..core.routetrace import RouteTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant
from ._geo import GridNetwork, timed_legs

VEHICLE_COLORS = [
    "var(--color-accent)", "var(--color-magenta)", "var(--color-good)", "var(--color-warn)",
    "var(--color-accent-2)", "var(--color-bad)",
]

SCALE = 100  # integer scaling so both solvers' integer engines stay exact and reproducible
OR_SOLUTION_LIMIT = 200  # deterministic OR-Tools stop (machine-independent, unlike a wall-clock limit)
PYVRP_ITERS = 200        # deterministic PyVRP stop (MaxIterations, not MaxRuntime)
SOLVER_SEED = 42         # fixed solver seed for PyVRP (HGS is stochastic); OR-Tools determinism comes from single-thread GLS + solution_limit


@dataclass
class Instance:
    """One capacitated VRP instance, shared verbatim by both solvers (a fair, reproducible comparison)."""
    net: GridNetwork
    depot: int                 # grid node id of the depot
    customers: list[int]       # grid node ids of the customers
    special: list[int]         # [depot] + customers — the rows/cols of the distance matrix
    demands: list[int]         # demand per `special` index (depot = 0)
    dmat: list[list[int]]      # scaled-integer shortest-path distance matrix over `special`
    n_vehicles: int
    capacity: int


def build_instance(g: int, nc: int, nv: int, cap: int, inst_seed: int) -> Instance:
    """Build the synthetic instance from ONE seeded RNG (the only source of randomness)."""
    rng = make_rng(int(inst_seed))
    net = GridNetwork(g, g, spacing=1.0)
    n_nodes = g * g
    depot = (g // 2) * g + (g // 2)
    choices = [n for n in range(n_nodes) if n != depot]
    rng.shuffle(choices)
    customers = choices[:nc]
    special = [depot] + customers
    demands = [0] + [int(rng.integers(1, 4)) for _ in range(nc)]
    dmat = [[int(round(net.shortest_path(a, b)[1] * SCALE)) for b in special] for a in special]
    return Instance(net, depot, customers, special, demands, dmat, nv, cap)


def _plan_from_special_seqs(inst: Instance, seqs: list[list[int]], speed: float = 1.0) -> dict:
    """Expand per-vehicle `special`-index sequences (each depot..customers..depot) into a render plan.

    Returns {routes, agents, total_distance, max_route_time, max_route_dist, vehicles_used, loads}, where
    `routes`/`agents` follow the RouteTrace schema (grid-node polylines + timed legs). Shared by both
    solvers so the OR-Tools and PyVRP plans are rendered identically.
    """
    net, special, demands = inst.net, inst.special, inst.demands
    routes: list[dict] = []
    agents: list[dict] = []
    loads: list[int] = []
    total_dist = 0.0
    max_route_t = 0.0
    max_route_dist = 0.0
    used = 0
    for vh, seq in enumerate(seqs):
        if len(seq) <= 2:  # depot -> depot only: unused vehicle
            continue
        used += 1
        color = VEHICLE_COLORS[vh % len(VEHICLE_COLORS)]
        full_path: list[int] = []
        legs: list[dict] = []
        t = 0.0
        route_dist = 0.0
        for a, b in zip(seq, seq[1:]):
            sub, dcost = net.shortest_path(special[a], special[b])
            total_dist += dcost
            route_dist += dcost
            if not full_path:
                full_path.append(sub[0])
            seg_legs, t = timed_legs(net, sub, t, speed)
            legs.extend(seg_legs)
            full_path.extend(sub[1:])
        max_route_t = max(max_route_t, t)
        max_route_dist = max(max_route_dist, route_dist)
        loads.append(sum(demands[s] for s in seq))
        agents.append({"id": vh, "kind": "vehicle", "color": color, "legs": legs})
        routes.append({"agent": vh, "path": full_path, "color": color})
    return {
        "routes": routes,
        "agents": agents,
        "total_distance": round(total_dist, 2),
        "max_route_time": round(max_route_t, 3),
        "max_route_dist": round(max_route_dist, 2),
        "vehicles_used": used,
        "loads": loads,
    }


def solve_ortools(inst: Instance) -> list[list[int]]:
    """Solve with OR-Tools routing (GUIDED_LOCAL_SEARCH) + a DETERMINISTIC stop. Returns per-vehicle
    `special`-index sequences (each depot..customers..depot)."""
    from ortools.constraint_solver import pywrapcp, routing_enums_pb2  # lazy: native, precompute-only

    D, nv, cap, demands = inst.dmat, inst.n_vehicles, inst.capacity, inst.demands
    manager = pywrapcp.RoutingIndexManager(len(inst.special), nv, 0)
    routing = pywrapcp.RoutingModel(manager)
    transit = routing.RegisterTransitCallback(lambda i, j: D[manager.IndexToNode(i)][manager.IndexToNode(j)])
    routing.SetArcCostEvaluatorOfAllVehicles(transit)
    dem_cb = routing.RegisterUnaryTransitCallback(lambda i: demands[manager.IndexToNode(i)])
    routing.AddDimensionWithVehicleCapacity(dem_cb, 0, [cap] * nv, True, "Capacity")
    # A distance dimension with a global-span cost balances route lengths (minimize the longest route),
    # so added vehicles are actually used — surfacing the total-distance vs longest-route trade-off, and
    # the contrast with PyVRP (which minimises pure total distance).
    routing.AddDimension(transit, 0, 1_000_000, True, "Distance")
    routing.GetDimensionOrDie("Distance").SetGlobalSpanCostCoefficient(100)
    sp = pywrapcp.DefaultRoutingSearchParameters()
    sp.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    sp.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    # Deterministic stop + fixed seed: a solution-count limit is machine-independent (unlike a wall-clock
    # time_limit, where a faster CPU would explore more), so the committed trace is byte-stable everywhere.
    sp.solution_limit = OR_SOLUTION_LIMIT
    sol = routing.SolveWithParameters(sp)

    seqs: list[list[int]] = []
    if sol:
        for vh in range(nv):
            idx = routing.Start(vh)
            seq: list[int] = []
            while not routing.IsEnd(idx):
                seq.append(manager.IndexToNode(idx))
                idx = sol.Value(routing.NextVar(idx))
            seq.append(0)  # return to depot
            seqs.append(seq)
    return seqs


def solve_pyvrp(inst: Instance) -> list[list[int]]:
    """Solve the SAME instance with PyVRP (Hybrid Genetic Search) + a DETERMINISTIC stop (MaxIterations)
    and a fixed seed. Returns per-vehicle `special`-index sequences (each depot..customers..depot)."""
    from pyvrp import Model  # lazy: native, precompute-only
    from pyvrp.stop import MaxIterations

    net, depot, customers, demands = inst.net, inst.depot, inst.customers, inst.demands
    D, nv, cap = inst.dmat, inst.n_vehicles, inst.capacity

    m = Model()
    # Use the same grid coordinates so PyVRP's own bookkeeping matches the instance; the explicit edges
    # below (the SAME scaled shortest-path matrix OR-Tools uses) are what actually drive the cost, making
    # the comparison fair and the run reproducible.
    dx, dy = net.coords[depot]
    dep = m.add_depot(x=dx, y=dy)
    m.add_vehicle_type(num_available=nv, capacity=cap)
    clients = []
    for i, cnode in enumerate(customers):
        cx, cy = net.coords[cnode]
        clients.append(m.add_client(x=cx, y=cy, delivery=demands[i + 1]))
    locs = [dep] + clients  # PyVRP location order == `special` order (depot = index 0)
    for i, frm in enumerate(locs):
        for j, to in enumerate(locs):
            if i == j:
                continue
            m.add_edge(frm, to, distance=D[i][j])
    # display=False keeps the run quiet + deterministic; MaxIterations is a count, not wall time.
    result = m.solve(stop=MaxIterations(PYVRP_ITERS), seed=SOLVER_SEED, display=False)

    seqs: list[list[int]] = []
    for route in result.best.routes():
        # route.visits() are LOCATION indices in `special` numbering (depot = 0, clients = 1..N), exactly
        # the indices our distance matrix uses. Wrap with the depot to close the tour.
        seqs.append([0, *route.visits(), 0])
    return seqs


class VRPScenario(Scenario):
    id = "s08_vrp"
    title = "Vehicle Routing Problem (VRP)"
    method = "optimization"
    tier = 3
    viz = "route"
    engine = "ortools+pyvrp"  # primary plan from OR-Tools; PyVRP SOTA contrast carried in `analytic`
    pure_python = False
    wheels = []
    param_specs = [
        ParamSpec("grid", "Grid size", 7, 4, 10, 1, kind="int"),
        ParamSpec("n_customers", "Customers", 12, 4, 18, 1, kind="int"),
        ParamSpec("n_vehicles", "Vehicles", 3, 1, 6, 1, kind="int"),
        ParamSpec("capacity", "Vehicle capacity", 12, 4, 40, 1, kind="int"),
        ParamSpec("inst_seed", "Instance seed", 1, 0, 9999, 1, kind="int"),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, g, nc, nv, cap, isd, ne, ns):
            return Variant(vid, le, ls, {"grid": g, "n_customers": nc, "n_vehicles": nv, "capacity": cap, "inst_seed": isd}, ne, ns)

        return [
            v("small", "8 customers · 2 vehicles", "8 clientes · 2 vehículos", 6, 8, 2, 14, 21, "A small instance: two clean routes.", "Instancia pequeña: dos rutas limpias."),
            v("base", "12 customers · 3 vehicles", "12 clientes · 3 vehículos", 7, 12, 3, 12, 22, "The baseline: three balanced routes.", "El caso base: tres rutas balanceadas."),
            v("tightcap", "12 customers · tight capacity", "12 clientes · capacidad ajustada", 7, 12, 3, 8, 22, "Tighter capacity forces more back-and-forth.", "Menor capacidad obliga a más idas y vueltas."),
            v("fewveh", "12 customers · 2 vehicles", "12 clientes · 2 vehículos", 7, 12, 2, 18, 22, "Fewer vehicles: longer individual routes.", "Menos vehículos: rutas individuales más largas."),
            v("manyveh", "12 customers · 4 vehicles", "12 clientes · 4 vehículos", 7, 12, 4, 9, 22, "More vehicles: shorter routes, more total distance?", "Más vehículos: rutas más cortas, ¿más distancia total?"),
            v("c15", "15 customers · 3 vehicles", "15 clientes · 3 vehículos", 8, 15, 3, 14, 23, "More customers per vehicle.", "Más clientes por vehículo."),
            v("c15v4", "15 customers · 4 vehicles", "15 clientes · 4 vehículos", 8, 15, 4, 12, 23, "Spread across four vehicles.", "Repartido en cuatro vehículos."),
            v("c18", "18 customers · 4 vehicles", "18 clientes · 4 vehículos", 9, 18, 4, 14, 24, "A larger instance on a bigger grid.", "Una instancia mayor en una grilla más grande."),
            v("dense", "10 customers · dense grid", "10 clientes · grilla densa", 6, 10, 3, 10, 25, "Customers packed on a small grid.", "Clientes apretados en una grilla pequeña."),
            v("spread", "12 customers · large grid", "12 clientes · grilla grande", 10, 12, 3, 14, 26, "Customers spread over a large grid: long legs.", "Clientes dispersos en una grilla grande: tramos largos."),
        ]

    def run(self, params: dict, seed: int) -> RouteTrace:
        p = self.coerce(params)
        g, nc, nv, cap = int(p["grid"]), int(p["n_customers"]), int(p["n_vehicles"]), int(p["capacity"])
        inst = build_instance(g, nc, nv, cap, int(p["inst_seed"]))
        net, depot, customers = inst.net, inst.depot, inst.customers

        # --- solve the SAME instance with both engines ---------------------------------------------
        or_plan = _plan_from_special_seqs(inst, solve_ortools(inst))
        pv_plan = _plan_from_special_seqs(inst, solve_pyvrp(inst))

        tr = RouteTrace(self.id, self.title, self.method, int(seed), p, bounds=net.bounds())
        kinds = {depot: "depot", **{c: "customer" for c in customers}}
        tr.nodes = net.nodes_list(kinds=kinds)
        tr.edges = net.edges
        tr.legend = [
            {"code": "depot", "label_en": "depot", "label_es": "depósito", "color": "var(--color-good)"},
            {"code": "customer", "label_en": "customer", "label_es": "cliente", "color": "var(--color-magenta)"},
        ]

        # Primary plan = OR-Tools, carried in routes/agents/kpis exactly as the app renders today.
        tr.agents = or_plan["agents"]
        tr.routes = or_plan["routes"]
        tr.t_end = or_plan["max_route_time"]
        tr.kpis = {
            "total_distance": or_plan["total_distance"],
            "vehicles_used": or_plan["vehicles_used"],
            "customers": nc,
            "max_route_time": round(or_plan["max_route_time"], 2),
            "capacity": cap,
        }

        # PyVRP SOTA contrast carried in the free-form `analytic` slot (no schema change). The frontend can
        # toggle/overlay these polylines + show the head-to-head distance gap. `solver`/`compare` make the
        # comparison explicit for the app and for CI.
        gap = round(or_plan["total_distance"] - pv_plan["total_distance"], 2)
        gap_pct = round(100.0 * gap / or_plan["total_distance"], 2) if or_plan["total_distance"] else 0.0
        tr.analytic = {
            "primary_solver": "ortools",
            "ortools": {
                "engine": "OR-Tools routing (GLS, deterministic solution_limit)",
                "total_distance": or_plan["total_distance"],
                "vehicles_used": or_plan["vehicles_used"],
                "max_route_dist": or_plan["max_route_dist"],
                "loads": or_plan["loads"],
            },
            "pyvrp": {
                "engine": "PyVRP (Hybrid Genetic Search, MaxIterations)",
                "total_distance": pv_plan["total_distance"],
                "vehicles_used": pv_plan["vehicles_used"],
                "max_route_dist": pv_plan["max_route_dist"],
                "loads": pv_plan["loads"],
                "routes": pv_plan["routes"],   # grid-node polylines, same shape as tr.routes
                "agents": pv_plan["agents"],   # timed legs, same shape as tr.agents
            },
            # Head-to-head: PyVRP minimises pure total distance; OR-Tools balances the longest route.
            "compare": {
                "distance_gap": gap,             # OR-Tools − PyVRP (>0 ⇒ PyVRP shorter total)
                "distance_gap_pct": gap_pct,
                "ortools_max_route_dist": or_plan["max_route_dist"],
                "pyvrp_max_route_dist": pv_plan["max_route_dist"],
            },
        }
        return tr
