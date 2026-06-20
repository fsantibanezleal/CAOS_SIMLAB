"""S07 — Construction haul routing: optimize-then-simulate on three real frameworks.

A fixed fleet recirculates between a LOAD point (bottom) and a DUMP (top), separated by a RIDGE of high
ground with a low PASS. Elevation drives the loaded cost, so the optimal haul route is a genuine
trade-off: going straight over the crest is short but climbs hard; detouring to the pass is longer but
nearly flat. Because only climbing is penalized, the optimal route SWITCHES at a critical grade — below
it the direct climb wins, above it the route flips to the pass (a barrier can reroute it independent of
grade). The shared LOADER is the binding resource: trucks are a finite calling population (machine-repair
/ M/M/1//N queue), so throughput saturates at the loader rate — match the fleet to the loader (the "match
factor").

This scenario USES the tools it documents — no hand-rolled NumPy graph or event loop:

* **NetworkX** (``docs/frameworks/networkx``) builds a real directed road graph over the shared graded
  ``GridNetwork`` terrain in ``_geo.py`` (same nodes/edges/elevation/blocked cells) and finds the haul
  route with ``nx.dijkstra_path`` over the grade-weighted edges — the *optimize* step's geometry.
* **OR-Tools** CP-SAT (``docs/frameworks/ortools``) independently re-solves the SAME shortest path as a
  min-cost single-unit-flow ILP and confirms the route cost the optimizer commits to. CP-SAT is native
  code, so this scenario is precomputed (``pure_python = False``); the solver is made reproducible with a
  single worker + a fixed ``random_seed`` and a deterministic stopping rule, and its optimum cost is
  STABLE across runs (the path geometry is taken from NetworkX, which is byte-stable, because equal-cost
  optimal routes let the ILP tie-break arbitrarily).
* **SimPy** (``docs/frameworks/simpy``) replays the cycle as a real discrete-event simulation: each truck
  is a process that requests a shared ``simpy.Resource`` (the loaders), loads, hauls up the planned route,
  dumps, hauls back, and re-enters the queue — the *simulate* step. The closed finite-source queue makes
  throughput saturate at the loader rate exactly as the machine-repair model predicts.

Determinism: the route is a unique shortest path on a fixed graph (NetworkX) confirmed by a seeded CP-SAT
solve (OR-Tools); the DES has no stochastic variates in this variant family, so the replay is a fully
deterministic function of (params, seed) — the same input yields the same trace byte-for-byte. The emitted
artifact is the existing routetrace format (routes/agents/barriers/legend/kpis/analytic); nothing in the
trace schema or the frontend contract changes.
"""
from __future__ import annotations

from typing import Callable

import networkx as nx

from ..core.routetrace import RouteTrace
from ..core.scenario import ParamSpec, Scenario, Variant
from ._geo import GridNetwork, timed_legs

# OR-Tools CP-SAT confirmation of the optimal route cost. Native code => precompute lane.
CP_SCALE = 1000          # integer edge-cost scaling (mm) so CP-SAT stays exact on a real-valued cost
CP_RANDOM_SEED = 42      # fixed solver seed => reproducible search (machine-independent)
CP_TIME_LIMIT_S = 10.0   # deterministic stop guard; the ILP solves to OPTIMAL well inside this
CP_COST_TOL = 0.01       # NetworkX vs CP-SAT optimum agreement tolerance (>= 1/CP_SCALE quantization)


def build_road_graph(net: GridNetwork, cost: Callable[[int, int], float]) -> nx.DiGraph:
    """A real NetworkX directed road graph over the shared GridNetwork terrain.

    One directed arc per (undirected) road segment in each direction; the weight is the supplied edge cost
    (plain distance for an empty return, grade-penalised distance for a loaded climb). Nodes/edges mirror
    ``_geo`` exactly, so ``nx.dijkstra_path`` reproduces the lab's graded shortest path byte-for-byte.
    """
    g = nx.DiGraph()
    g.add_nodes_from(net.coords)
    for a, b in net.edges:
        g.add_edge(a, b, weight=cost(a, b))
        g.add_edge(b, a, weight=cost(b, a))
    return g


def nx_route(net: GridNetwork, cost: Callable[[int, int], float], src: int, dst: int) -> list[int]:
    """The cheapest haul route src->dst on the graded road graph (NetworkX Dijkstra)."""
    g = build_road_graph(net, cost)
    return nx.dijkstra_path(g, src, dst, weight="weight")


def ortools_route_cost(net: GridNetwork, cost: Callable[[int, int], float], src: int, dst: int) -> float:
    """Confirm the optimal route COST with OR-Tools CP-SAT (a min-cost single-unit flow).

    Decision : x[a,b] in {0,1} selects each directed arc. Constraint: unit flow conservation — out-in is
    +1 at the source, -1 at the destination, 0 elsewhere, so the selected arcs form a single src->dst path.
    Objective: minimise the (integer-scaled) total route cost. Single worker + fixed ``random_seed`` make
    the optimum reproducible; equal-cost routes let CP-SAT tie-break the *path* arbitrarily, so the path
    geometry comes from NetworkX (byte-stable) while CP-SAT certifies the cost the optimizer committed to.
    """
    from ortools.sat.python import cp_model  # lazy: native, precompute-only

    arcs: list[tuple[int, int]] = []
    for a, b in net.edges:
        arcs.append((a, b))
        arcs.append((b, a))

    model = cp_model.CpModel()
    x = {arc: model.new_bool_var(f"x_{arc[0]}_{arc[1]}") for arc in arcs}
    out_arcs: dict[int, list[tuple[int, int]]] = {n: [] for n in net.coords}
    in_arcs: dict[int, list[tuple[int, int]]] = {n: [] for n in net.coords}
    for arc in arcs:
        out_arcs[arc[0]].append(arc)
        in_arcs[arc[1]].append(arc)
    for n in net.coords:
        rhs = 1 if n == src else (-1 if n == dst else 0)
        model.add(sum(x[a] for a in out_arcs[n]) - sum(x[a] for a in in_arcs[n]) == rhs)
    model.minimize(sum(int(round(cost(a, b) * CP_SCALE)) * x[(a, b)] for (a, b) in arcs))

    solver = cp_model.CpSolver()
    solver.parameters.num_search_workers = 1        # single worker => reproducible
    solver.parameters.random_seed = CP_RANDOM_SEED
    solver.parameters.max_time_in_seconds = CP_TIME_LIMIT_S
    solver.solve(model)
    return solver.objective_value / CP_SCALE


class HaulScenario(Scenario):
    id = "s07_haul"
    title = "Construction Haul Routing"
    method = "hybrid"
    tier = 3
    viz = "route"
    engine = "ortools"          # OR-Tools certifies the route; NetworkX geometry + SimPy DES replay
    pure_python = False         # CP-SAT is native code -> precompute lane (matches the docs)
    wheels = []                 # native solver: no live wheel closure
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

        # ── OPTIMIZE: the haul route (NetworkX geometry, OR-Tools CP-SAT cost certificate) ──
        up_path = nx_route(net, loaded_cost, load_node, dump_node)        # loaded climb (graded)
        down_path = nx_route(net, net.dist, dump_node, load_node)          # empty return (plain distance)
        if up_path[0] != load_node or up_path[-1] != dump_node:
            raise RuntimeError("haul: dump unreachable from load (barrier disconnected the graph)")
        # CP-SAT certifies the optimum the planner commits to (stable across runs; geometry from NetworkX).
        up_cost_nx = sum(loaded_cost(a, b) for a, b in zip(up_path, up_path[1:]))
        up_cost_or = ortools_route_cost(net, loaded_cost, load_node, dump_node)
        if abs(up_cost_or - up_cost_nx) > CP_COST_TOL:
            raise RuntimeError(f"haul: OR-Tools route cost {up_cost_or:.4f} disagrees with NetworkX {up_cost_nx:.4f}")

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

        # ── SIMULATE: the closed finite-source haul cycle as a real SimPy DES ──
        agents, loads, busy_time, wait_time = self._simulate(
            net, nt, nl, horizon, up_path, down_path, loaded_cost, load_time, dump_time, speed)

        # analytic: where the route switches direct↔pass, and which way THIS variant routed
        def path_LC(path: list[int]) -> tuple[float, float]:
            length = sum(net.dist(a, b) for a, b in zip(path, path[1:]))
            climb = sum(max(0.0, net.elev[b] - net.elev[a]) for a, b in zip(path, path[1:]))
            return length, climb

        direct = nx_route(net, net.dist, load_node, dump_node)            # grade 0 reference
        detour = nx_route(net, lambda a, b: net.dist(a, b) * (1.0 + 50.0 * max(0.0, net.elev[b] - net.elev[a])),
                          load_node, dump_node)
        l_dir, c_dir = path_LC(direct)
        l_det, c_det = path_LC(detour)
        switch = (l_det - l_dir) / (c_dir - c_det) if (c_dir - c_det) > 1e-6 else None
        # When a barrier is active, the "direct" reference path is itself forced onto a detour by the
        # blocked cells, so it no longer represents the true crest geometry and the closed-form g*
        # reference is ill-defined. The route flip is still correct; only the g* number is wrong, so
        # report it as undefined (None) for barrier variants. Non-barrier g* is unaffected.
        if barrier:
            switch = None
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

    @staticmethod
    def _simulate(net: GridNetwork, nt: int, nl: int, horizon: float, up_path: list[int],
                  down_path: list[int], loaded_cost: Callable[[int, int], float],
                  load_time: float, dump_time: float, speed: float):
        """SimPy discrete-event replay of the closed finite-source haul cycle.

        Each truck is a SimPy process competing for a shared ``Resource`` of ``nl`` loaders. A truck joins
        the loader queue, holds a loader for ``load_time``, hauls up the planned (loaded) route, dumps,
        hauls back the (empty) route, and re-enters the queue — until starting a load would run past the
        shift ``horizon``. The shared loader is the binding resource: with one loader, adding trucks only
        lengthens the queue, so throughput saturates at the loader rate (the machine-repair / M/M/1//N
        result). Fully deterministic from the fixed plan + the staggered start; the route trace's per-truck
        legs and the throughput/cycle/wait KPIs are a pure function of (params, seed).
        """
        import simpy

        env = simpy.Environment()
        loaders = simpy.Resource(env, capacity=nl)
        agents = [{"id": k, "kind": "truck", "color": "var(--color-accent)", "legs": []} for k in range(nt)]
        stats = {"loads": 0, "busy": 0.0, "wait": 0.0}

        def truck(k: int):
            yield env.timeout(0.02 * k)  # slight stagger so the fleet doesn't hit the loader in lockstep
            while True:
                t_arr = env.now
                with loaders.request() as req:
                    yield req                         # WAIT for a free loader (FIFO over the finite fleet)
                    start_load = env.now
                    if start_load + load_time > horizon:
                        break                          # no time left to load before the shift ends
                    stats["wait"] += start_load - t_arr
                    yield env.timeout(load_time)       # HOLD the loader for the load
                    load_end = env.now
                    stats["loads"] += 1
                # loaded haul up the planned route, dump, then empty haul back
                up_legs, t_dump = timed_legs(net, up_path, load_end, speed, cost=loaded_cost)
                yield env.timeout(t_dump - load_end)
                yield env.timeout(dump_time)
                t_dump_end = env.now
                down_legs, t_back = timed_legs(net, down_path, t_dump_end, speed)
                yield env.timeout(t_back - t_dump_end)
                agents[k]["legs"].extend(up_legs)
                agents[k]["legs"].extend(down_legs)
                stats["busy"] += t_back - start_load
                if env.now >= horizon:
                    break

        for k in range(nt):
            env.process(truck(k))
        env.run()
        return agents, stats["loads"], stats["busy"], stats["wait"]
