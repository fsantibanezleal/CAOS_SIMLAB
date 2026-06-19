"""S07 — Construction haul routing (optimize-then-simulate, hybrid).

A fleet of trucks cycles between a LOAD point (low ground) and a DUMP point (uphill), over a road grid
where elevation drives cost: loaded trucks climb slowly toward the dump, return fast empty. A shared
LOADER is the bottleneck — beyond a point, adding trucks just makes them queue at the loader (the classic
match-the-fleet-to-the-loader lesson). Pure-Python event sim, seeded; elevation handled via a graded
shortest-path cost. The optimize-then-simulate framing: pick the haul route by graded cost, then simulate
the cycle throughput.
"""
from __future__ import annotations

from ..core.routetrace import RouteTrace
from ..core.scenario import ParamSpec, Scenario, Variant
from ._geo import GridNetwork, timed_legs


class HaulScenario(Scenario):
    id = "s07_haul"
    title = "Construction Haul Routing"
    method = "hybrid"
    tier = 3
    viz = "route"
    engine = "numpy"
    pure_python = True
    wheels = ["numpy"]
    param_specs = [
        ParamSpec("grid", "Grid size", 7, 4, 9, 1, kind="int"),
        ParamSpec("n_trucks", "Trucks", 5, 1, 14, 1, kind="int"),
        ParamSpec("n_loaders", "Loaders", 1, 1, 4, 1, kind="int"),
        ParamSpec("grade", "Grade penalty", 3.0, 0.0, 8.0, 0.5),
        ParamSpec("horizon", "Shift length", 60.0, 20.0, 200.0, 5.0),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, nt, nl, grade, ne, ns):
            return Variant(vid, le, ls, {"grid": 7, "n_trucks": nt, "n_loaders": nl, "grade": grade, "horizon": 60.0}, ne, ns)

        return [
            v("t2", "2 trucks · 1 loader", "2 camiones · 1 cargador", 2, 1, 3.0, "Under-trucked: the loader idles, low throughput.", "Pocos camiones: el cargador se desocupa, bajo rendimiento."),
            v("t4", "4 trucks · 1 loader", "4 camiones · 1 cargador", 4, 1, 3.0, "Approaching a matched fleet.", "Acercándose a una flota equilibrada."),
            v("t6", "6 trucks · 1 loader", "6 camiones · 1 cargador", 6, 1, 3.0, "The loader is busy; queues start to form.", "El cargador está ocupado; empiezan las colas."),
            v("t9", "9 trucks · 1 loader", "9 camiones · 1 cargador", 9, 1, 3.0, "Over-trucked: trucks queue, throughput saturates.", "Demasiados camiones: hacen cola, el rendimiento se satura."),
            v("t12", "12 trucks · 1 loader", "12 camiones · 1 cargador", 12, 1, 3.0, "Heavy over-trucking: a long loader queue, no gain.", "Mucho exceso de camiones: cola larga, sin ganancia."),
            v("l2t9", "9 trucks · 2 loaders", "9 camiones · 2 cargadores", 9, 2, 3.0, "A second loader lifts the throughput ceiling.", "Un segundo cargador sube el techo de rendimiento."),
            v("l2t12", "12 trucks · 2 loaders", "12 camiones · 2 cargadores", 12, 2, 3.0, "Two loaders absorb a bigger fleet.", "Dos cargadores absorben una flota mayor."),
            v("flat", "6 trucks · flat haul", "6 camiones · acarreo plano", 6, 1, 0.0, "No grade: fast cycles, higher throughput.", "Sin pendiente: ciclos rápidos, mayor rendimiento."),
            v("steep", "6 trucks · steep haul", "6 camiones · acarreo empinado", 6, 1, 6.0, "Steep grade: slow loaded climb dominates the cycle.", "Pendiente fuerte: la subida cargada domina el ciclo."),
            v("l3t12", "12 trucks · 3 loaders", "12 camiones · 3 cargadores", 12, 3, 3.0, "Three loaders, big fleet: high throughput.", "Tres cargadores, flota grande: alto rendimiento."),
        ]

    def run(self, params: dict, seed: int) -> RouteTrace:
        p = self.coerce(params)
        g, nt, nl, grade, horizon = int(p["grid"]), int(p["n_trucks"]), int(p["n_loaders"]), float(p["grade"]), float(p["horizon"])
        net = GridNetwork(g, g, spacing=1.0)
        load_node = 0  # bottom-left, low elevation
        dump_node = g * g - 1  # top-right, high elevation (uphill)
        speed = 1.0
        load_time, dump_time = 4.0, 1.0  # a load takes minutes; the single loader is the binding constraint

        def loaded_cost(a: int, b: int) -> float:
            return net.dist(a, b) * (1.0 + grade * max(0.0, net.elev[b] - net.elev[a]))

        up_path, _ = net.shortest_path(load_node, dump_node, cost=loaded_cost)
        down_path, _ = net.shortest_path(dump_node, load_node)  # empty: plain distance

        tr = RouteTrace(self.id, self.title, self.method, int(seed), p, bounds=net.bounds())
        tr.nodes = net.nodes_list(kinds={load_node: "load", dump_node: "dump"})
        for nd in tr.nodes:
            nd["elev"] = round(net.elev[nd["id"]], 3)
        tr.edges = net.edges
        tr.legend = [
            {"code": "load", "label_en": "load point", "label_es": "carguío", "color": "var(--color-good)"},
            {"code": "dump", "label_en": "dump (uphill)", "label_es": "botadero (cuesta arriba)", "color": "var(--color-warn)"},
        ]
        agents = [{"id": k, "kind": "truck", "color": "var(--color-accent)", "legs": []} for k in range(nt)]
        loader_free = [0.0] * nl
        import heapq
        heapq.heapify(loader_free)
        # event queue of (arrival_at_loader, truck)
        evq = [(0.02 * k, k) for k in range(nt)]  # slight stagger
        heapq.heapify(evq)
        loads = 0
        busy_time = 0.0
        wait_time = 0.0

        while evq:
            t_arr, truck = heapq.heappop(evq)
            f = heapq.heappop(loader_free)
            start_load = max(t_arr, f)
            if start_load + load_time > horizon:
                heapq.heappush(loader_free, f)  # loader stays free
                continue
            wait_time += start_load - t_arr
            load_end = start_load + load_time
            heapq.heappush(loader_free, load_end)
            loads += 1
            # loaded climb to dump
            up_legs, t_dump = timed_legs(net, up_path, load_end, speed, cost=loaded_cost)
            t_dump_end = t_dump + dump_time
            down_legs, t_back = timed_legs(net, down_path, t_dump_end, speed)
            agents[truck]["legs"].extend(up_legs)
            agents[truck]["legs"].extend(down_legs)
            busy_time += (t_back - start_load)
            if t_back < horizon:
                heapq.heappush(evq, (t_back, truck))

        tr.t_end = horizon
        cycle = (busy_time / loads) if loads else 0.0
        tr.agents = agents
        tr.routes = [{"agent": -1, "path": up_path, "color": "var(--color-fg-faint)"}]  # the haul route
        tr.kpis = {
            "loads_delivered": loads,
            "throughput_per_hr": round(loads / horizon * 60, 2),
            "mean_cycle_time": round(cycle, 2),
            "loader_wait_per_load": round(wait_time / loads, 2) if loads else 0.0,
            "n_trucks": nt,
            "n_loaders": nl,
        }
        return tr
