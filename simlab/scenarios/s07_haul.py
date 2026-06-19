"""S07 — Construction haul routing: a closed finite-source queue (optimize-then-simulate).

A fixed fleet recirculates between a LOAD point (bottom) and a DUMP (top), separated by a RIDGE of high
ground with a low PASS. Elevation drives the loaded cost, so the optimal haul route is a genuine
trade-off: going straight over the crest is short but climbs hard; detouring to the pass is longer but
nearly flat. Because only climbing is penalized, the optimal route SWITCHES at a critical grade — below
it the direct climb wins, above it the route flips to the pass (a barrier can reroute it independent of
grade). The route is solved exactly with Dijkstra (the *optimize* step); a seeded discrete-event loop then
*simulates* the cycle. The shared LOADER is the binding resource: trucks are a finite calling population
(machine-repair / M/M/1//N queue), so throughput saturates at the loader rate — match the fleet to the
loader (the "match factor").
"""
from __future__ import annotations

import heapq

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
        ParamSpec("grid", "Grid size", 12, 10, 14, 1, kind="int"),
        ParamSpec("n_trucks", "Trucks", 5, 1, 14, 1, kind="int"),
        ParamSpec("n_loaders", "Loaders", 1, 1, 4, 1, kind="int"),
        ParamSpec("grade", "Grade penalty", 3.0, 0.0, 8.0, 0.5),
        ParamSpec("pass_col", "Pass column", 2, 1, 10, 1, kind="int"),
        ParamSpec("lift_col", "Load/dump column", 4, 1, 10, 1, kind="int"),
        ParamSpec("barrier", "Wall on direct line", 0, 0, 1, 1, kind="int"),
        ParamSpec("horizon", "Shift length", 60.0, 20.0, 200.0, 5.0),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, *, nt=5, nl=1, grade=3.0, pc=2, lc=4, bar=0, ne="", ns=""):
            return Variant(vid, le, ls, {"grid": 12, "n_trucks": nt, "n_loaders": nl, "grade": grade,
                                         "pass_col": pc, "lift_col": lc, "barrier": bar, "horizon": 60.0}, ne, ns)

        return [
            # (A) route trade-off — sweep the grade across the switch, move the pass, drop a wall
            v("r_low", "Low grade · direct", "Pendiente baja · directo", grade=1.0,
              ne="Low grade: the short route straight over the crest wins.", ns="Pendiente baja: gana la ruta corta recta por la cima."),
            v("r_mid", "Grade 3 · at the edge", "Pendiente 3 · en el límite", grade=3.0,
              ne="Just below the switch (g*≈3.4): still direct over the ridge.", ns="Justo bajo el salto (g*≈3,4): aún directo por el cordón."),
            v("r_switch", "Grade 4 · flips to the pass", "Pendiente 4 · salta al paso", grade=4.0,
              ne="Just past the switch: the optimal route flips to the low pass.", ns="Pasado el salto: la ruta óptima salta al paso bajo."),
            v("r_steep", "Steep · long detour", "Empinado · desvío largo", grade=8.0,
              ne="Steep: climbing dominates, the long pass detour is clearly cheaper.", ns="Empinado: trepar domina, el desvío por el paso es claramente más barato."),
            v("r_passR", "Pass on the right", "Paso a la derecha", grade=6.0, pc=9, lc=7,
              ne="Pass moved right (col 9): the detour now goes the other way.", ns="Paso movido a la derecha (col 9): el desvío va al otro lado."),
            v("r_wall", "Wall on the direct line", "Muro en la línea directa", grade=1.0, bar=1,
              ne="A barrier across the direct climb reroutes the haul even at low grade.", ns="Una barrera en la subida directa redirige el acarreo aun a pendiente baja."),
            # (B) loader-bottleneck fleet sizing — route fixed, vary trucks/loaders
            v("f_t2", "2 trucks · 1 loader", "2 camiones · 1 cargador", nt=2,
              ne="Under-trucked: the loader idles, throughput is fleet-limited.", ns="Pocos camiones: el cargador se desocupa, lo limita la flota."),
            v("f_t6", "6 trucks · 1 loader", "6 camiones · 1 cargador", nt=6,
              ne="Loader busy; queues begin to form (MF approaching 1).", ns="Cargador ocupado; empiezan las colas (MF cerca de 1)."),
            v("f_t12", "12 trucks · 1 loader", "12 camiones · 1 cargador", nt=12,
              ne="Over-trucked: near-identical loads, the loader wait roughly doubles.", ns="Sobre-equipado: cargas casi iguales, la espera del cargador casi se duplica."),
            v("f_l2t12", "12 trucks · 2 loaders", "12 camiones · 2 cargadores", nt=12, nl=2,
              ne="A second loader lifts the throughput ceiling.", ns="Un segundo cargador sube el techo de rendimiento."),
            v("f_l3t12", "12 trucks · 3 loaders", "12 camiones · 3 cargadores", nt=12, nl=3,
              ne="Three loaders absorb the big fleet.", ns="Tres cargadores absorben la flota grande."),
            # (C) coupled grade × fleet
            v("x_steep2", "6 trucks · steep haul", "6 camiones · acarreo empinado", nt=6, grade=8.0,
              ne="Steep + matched-ish fleet: the long cycle lowers throughput.", ns="Empinado + flota casi pareja: el ciclo largo baja el rendimiento."),
            v("x_flat", "6 trucks · flat haul", "6 camiones · acarreo plano", nt=6, grade=0.0,
              ne="Flat haul: fast cycles, the route is trivially direct.", ns="Acarreo plano: ciclos rápidos, la ruta es trivialmente directa."),
        ]

    def run(self, params: dict, seed: int) -> RouteTrace:
        p = self.coerce(params)
        g, nt, nl = int(p["grid"]), int(p["n_trucks"]), int(p["n_loaders"])
        grade, horizon = float(p["grade"]), float(p["horizon"])
        pass_col, lift_col, barrier = int(p["pass_col"]), int(p["lift_col"]), int(p["barrier"])
        ridge_row = (g - 1) / 2.0

        # A barrier (numeric flag) walls the direct climb: block the two ridge-row cells in the lift column,
        # forcing a detour independent of grade. Deterministic from g/lift_col/ridge_row.
        rr = int(round(ridge_row))
        blocked = {rr * g + lift_col, (rr + 1) * g + lift_col} if barrier else set()

        net = GridNetwork(g, g, spacing=1.0, terrain="ridge",
                          terrain_opts={"passes": [pass_col], "ridge_row": ridge_row}, blocked=blocked)
        load_node = 0 * g + lift_col          # bottom edge, lift column
        dump_node = (g - 1) * g + lift_col    # top edge, lift column
        speed = 1.0
        load_time, dump_time = 4.0, 1.0       # a load takes minutes; the single loader is the binding constraint

        def loaded_cost(a: int, b: int) -> float:
            return net.dist(a, b) * (1.0 + grade * max(0.0, net.elev[b] - net.elev[a]))

        up_path, _ = net.shortest_path(load_node, dump_node, cost=loaded_cost)
        down_path, _ = net.shortest_path(dump_node, load_node)  # empty: plain distance
        if up_path[0] != load_node or up_path[-1] != dump_node:
            raise RuntimeError("haul: dump unreachable from load (barrier disconnected the graph)")

        tr = RouteTrace(self.id, self.title, self.method, int(seed), p, bounds=net.bounds())
        tr.nodes = net.nodes_list(kinds={load_node: "load", dump_node: "dump"})
        for nd in tr.nodes:
            nd["elev"] = round(net.elev[nd["id"]], 3)
        tr.edges = net.edges
        tr.barriers = [{"x": float(n % g), "y": float(n // g)} for n in sorted(blocked)]
        tr.legend = [
            {"code": "load", "label_en": "load point", "label_es": "carguío", "color": "var(--color-good)"},
            {"code": "dump", "label_en": "dump", "label_es": "botadero", "color": "var(--color-warn)"},
        ]
        agents = [{"id": k, "kind": "truck", "color": "var(--color-accent)", "legs": []} for k in range(nt)]
        loader_free = [0.0] * nl
        heapq.heapify(loader_free)
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
                heapq.heappush(loader_free, f)
                continue
            wait_time += start_load - t_arr
            load_end = start_load + load_time
            heapq.heappush(loader_free, load_end)
            loads += 1
            up_legs, t_dump = timed_legs(net, up_path, load_end, speed, cost=loaded_cost)
            t_dump_end = t_dump + dump_time
            down_legs, t_back = timed_legs(net, down_path, t_dump_end, speed)
            agents[truck]["legs"].extend(up_legs)
            agents[truck]["legs"].extend(down_legs)
            busy_time += (t_back - start_load)
            if t_back < horizon:
                heapq.heappush(evq, (t_back, truck))

        # analytic: where the route switches direct↔pass, and which way THIS variant routed
        def path_LC(path: list[int]) -> tuple[float, float]:
            length = sum(net.dist(a, b) for a, b in zip(path, path[1:]))
            climb = sum(max(0.0, net.elev[b] - net.elev[a]) for a, b in zip(path, path[1:]))
            return length, climb

        direct, _ = net.shortest_path(load_node, dump_node, cost=net.dist)          # grade 0
        detour, _ = net.shortest_path(load_node, dump_node,
                                      cost=lambda a, b: net.dist(a, b) * (1.0 + 50.0 * max(0.0, net.elev[b] - net.elev[a])))
        l_dir, c_dir = path_LC(direct)
        l_det, c_det = path_LC(detour)
        switch = (l_det - l_dir) / (c_dir - c_det) if (c_dir - c_det) > 1e-6 else None
        cross = min(up_path, key=lambda n: abs(net.coords[n][1] - ridge_row))
        via_col = int(round(net.coords[cross][0]))
        detoured = abs(via_col - lift_col) > 0.5

        tr.t_end = horizon
        cycle = (busy_time / loads) if loads else 0.0
        tr.agents = agents
        tr.routes = [{"agent": -1, "path": up_path, "color": "var(--color-fg-faint)"}]
        tr.kpis = {
            "loads_delivered": loads,
            "throughput_per_hr": round(loads / horizon * 60, 2),
            "mean_cycle_time": round(cycle, 2),
            "loader_wait_per_load": round(wait_time / loads, 2) if loads else 0.0,
            "switch_grade_est": round(switch, 2) if switch is not None else None,
            "n_trucks": nt,
            "n_loaders": nl,
        }
        tr.analytic = {
            "switch_grade_est": round(switch, 2) if switch is not None else None,
            "route_via": (f"pass at col {via_col}" if detoured else "direct over crest"),
            "cross_col": via_col,
            "lift_col": lift_col,
        }
        return tr
