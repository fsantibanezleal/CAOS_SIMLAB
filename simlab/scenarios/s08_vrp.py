"""S08 — Vehicle Routing Problem (capacitated VRP, OR-Tools).

A depot and N customers (each with a demand) on a synthetic road grid; route K capacity-limited vehicles
to serve every customer minimizing total travel distance. The classic optimize-then-route problem — and
the optimizer (OR-Tools routing) is native code, so it is precomputed; the committed trace holds the
optimal routes, which the web replays as vehicles driving the network. Distances are shortest paths on the
grid. Deterministic: instances are seeded; the solver runs single-thread with a short time limit.
"""
from __future__ import annotations

from ..core.routetrace import RouteTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant
from ._geo import GridNetwork, timed_legs

VEHICLE_COLORS = [
    "var(--color-accent)", "var(--color-magenta)", "var(--color-good)", "var(--color-warn)",
    "var(--color-accent-2)", "var(--color-bad)",
]


class VRPScenario(Scenario):
    id = "s08_vrp"
    title = "Vehicle Routing Problem (VRP)"
    method = "optimization"
    tier = 3
    viz = "route"
    engine = "ortools"
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
        from ortools.constraint_solver import pywrapcp, routing_enums_pb2  # lazy

        p = self.coerce(params)
        g, nc, nv, cap = int(p["grid"]), int(p["n_customers"]), int(p["n_vehicles"]), int(p["capacity"])
        rng = make_rng(int(p["inst_seed"]))
        net = GridNetwork(g, g, spacing=1.0)
        n_nodes = g * g
        depot = (g // 2) * g + (g // 2)
        choices = [n for n in range(n_nodes) if n != depot]
        rng.shuffle(choices)
        customers = choices[:nc]
        special = [depot] + customers
        demands = [0] + [int(rng.integers(1, 4)) for _ in range(nc)]

        SCALE = 100
        D = [[int(round(net.shortest_path(a, b)[1] * SCALE)) for b in special] for a in special]

        manager = pywrapcp.RoutingIndexManager(len(special), nv, 0)
        routing = pywrapcp.RoutingModel(manager)
        transit = routing.RegisterTransitCallback(lambda i, j: D[manager.IndexToNode(i)][manager.IndexToNode(j)])
        routing.SetArcCostEvaluatorOfAllVehicles(transit)
        dem_cb = routing.RegisterUnaryTransitCallback(lambda i: demands[manager.IndexToNode(i)])
        routing.AddDimensionWithVehicleCapacity(dem_cb, 0, [cap] * nv, True, "Capacity")
        # A distance dimension with a global-span cost balances route lengths (minimize the longest route),
        # so added vehicles are actually used — surfacing the total-distance vs longest-route trade-off.
        routing.AddDimension(transit, 0, 1_000_000, True, "Distance")
        routing.GetDimensionOrDie("Distance").SetGlobalSpanCostCoefficient(100)
        sp = pywrapcp.DefaultRoutingSearchParameters()
        sp.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        sp.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        sp.time_limit.FromSeconds(3)
        sol = routing.SolveWithParameters(sp)

        tr = RouteTrace(self.id, self.title, self.method, int(seed), p, bounds=net.bounds())
        kinds = {depot: "depot", **{c: "customer" for c in customers}}
        tr.nodes = net.nodes_list(kinds=kinds)
        tr.edges = net.edges
        tr.legend = [
            {"code": "depot", "label_en": "depot", "label_es": "depósito", "color": "var(--color-good)"},
            {"code": "customer", "label_en": "customer", "label_es": "cliente", "color": "var(--color-magenta)"},
        ]
        speed = 1.0
        total_dist = 0.0
        max_route_t = 0.0
        used = 0
        if sol:
            for vh in range(nv):
                idx = routing.Start(vh)
                seq = []  # special indices
                while not routing.IsEnd(idx):
                    seq.append(manager.IndexToNode(idx))
                    idx = sol.Value(routing.NextVar(idx))
                seq.append(0)  # return to depot
                if len(seq) <= 2:
                    continue  # unused vehicle
                used += 1
                color = VEHICLE_COLORS[vh % len(VEHICLE_COLORS)]
                full_path: list[int] = []
                legs: list[dict] = []
                t = 0.0
                for a, b in zip(seq, seq[1:]):
                    sub, dcost = net.shortest_path(special[a], special[b])
                    total_dist += dcost
                    if not full_path:
                        full_path.append(sub[0])
                    seg_legs, t = timed_legs(net, sub, t, speed)
                    legs.extend(seg_legs)
                    full_path.extend(sub[1:])
                max_route_t = max(max_route_t, t)
                tr.agents.append({"id": vh, "kind": "vehicle", "color": color, "legs": legs})
                tr.routes.append({"agent": vh, "path": full_path, "color": color})
        tr.t_end = round(max_route_t, 3)
        tr.kpis = {
            "total_distance": round(total_dist, 2),
            "vehicles_used": used,
            "customers": nc,
            "max_route_time": round(max_route_t, 2),
            "capacity": cap,
        }
        return tr
