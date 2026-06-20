"""S07 — Construction haul routing: optimize-then-simulate, with a NATIVE plan and a LIVE replay.

A fixed fleet recirculates between a LOAD point (bottom) and a DUMP (top), separated by a RIDGE of high
ground with a low PASS. Elevation drives the loaded cost, so the optimal haul route is a genuine
trade-off: going straight over the crest is short but climbs hard; detouring to the pass is longer but
nearly flat. Because only climbing is penalized, the optimal route SWITCHES at a critical grade — below
it the direct climb wins, above it the route flips to the pass (a barrier can reroute it independent of
grade). The shared LOADER is the binding resource: trucks are a finite calling population (machine-repair
/ M/M/1//N queue), so throughput saturates at the loader rate — match the fleet to the loader (the "match
factor").

This scenario USES the tools it documents — no hand-rolled NumPy graph or event loop — and it is split
honestly into a NATIVE plan and a LIVE replay:

* **The PLAN (offline, native).** **NetworkX** (``docs/frameworks/10_networkx``) builds a real directed road
  graph over the shared graded ``GridNetwork`` terrain in ``_geo.py`` and finds the haul route with
  ``nx.dijkstra_path``; **OR-Tools** CP-SAT (``docs/frameworks/08_ortools``) independently re-solves the SAME
  shortest path as a min-cost single-unit-flow ILP and CERTIFIES the route cost. Both are native (no WASM
  build), so the plan is built **offline** by ``_haul_plan.py`` and COMMITTED as small rendered data
  (``s07_plans.py``: the two route polylines as node-id lists + the cost certificate + the analytic g*).
* **The REPLAY (live).** **SimPy** (``docs/frameworks/01_simpy``) replays the cycle as a real discrete-event
  simulation over the FIXED committed plan: each truck is a process that requests a shared ``simpy.Resource``
  (the loaders), loads, hauls up the planned route, dumps, hauls back, and re-enters the queue. This is the
  interactive half — the fleet sliders (trucks, loaders, load/dump times, breakdown rate, seed) mutate the
  REPLAY over the fixed plan, never the plan itself. SimPy + NumPy are pure-Python wheels Pyodide loads, so
  this scenario runs **LIVE** (``pure_python = True``); OR-Tools is never imported in the worker.

The plan-vs-fleet split is itself the lesson: an optimal route PLAN is necessary but not sufficient — a
fixed fleet realizes a degraded version of it, and only the grade slider (which re-selects among committed
plans) flips the route, while the fleet sliders only change throughput/wait over the SAME route.

Determinism: the route is a unique shortest path on a fixed graph (NetworkX) confirmed by a seeded CP-SAT
solve (OR-Tools), both done offline; the DES has no stochastic variates in the deterministic variants, and
the optional breakdown stream is drawn from a single seeded NumPy RNG, so a run is a fully deterministic
function of (params, seed) — the same input yields the same trace byte-for-byte. The emitted artifact is the
existing routetrace format (routes/agents/barriers/legend/kpis/analytic); nothing in the schema changes.
"""
from __future__ import annotations

from typing import Callable

from ..core.routetrace import RouteTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant
from ._geo import GridNetwork, timed_legs
from .s07_plans import PLANS


def _plan_key(grid: int, grade: float, pass_col: int, lift_col: int, barrier: int) -> str:
    """Stable key for a committed geometry plan (must match ``_haul_plan.plan_key``)."""
    return f"g{int(grid)}_grade{float(grade):.1f}_pass{int(pass_col)}_lift{int(lift_col)}_bar{int(barrier)}"


def _network_for(grid: int, pass_col: int, lift_col: int, barrier: int) -> tuple[GridNetwork, int, int, set[int]]:
    """Rebuild the shared graded ridge network for a geometry (pure-Python: GridNetwork + numpy, no native).

    This reconstructs the SAME nodes/edges/elevation/blocked cells the offline plan builder saw, so the live
    render geometry matches the plan's route polylines exactly. ``_geo`` is untouched.
    """
    g = int(grid)
    ridge_row = (g - 1) / 2.0
    rr = int(round(ridge_row))
    blocked = {rr * g + lift_col, (rr + 1) * g + lift_col} if barrier else set()
    net = GridNetwork(g, g, spacing=1.0, terrain="ridge",
                      terrain_opts={"passes": [pass_col], "ridge_row": ridge_row}, blocked=blocked)
    load_node = 0 * g + lift_col
    dump_node = (g - 1) * g + lift_col
    return net, load_node, dump_node, blocked


class HaulScenario(Scenario):
    id = "s07_haul"
    title = "Construction Haul Routing"
    method = "hybrid"
    tier = 3
    viz = "route"
    engine = "simpy"            # LIVE SimPy DES replays the committed NetworkX+OR-Tools plan
    pure_python = True          # the replay is pure-Python (SimPy + NumPy); the native PLAN is precomputed
    wheels = ["numpy", "simpy"]  # the live worker's closure (the native plan ships as committed data)
    param_specs = [
        ParamSpec("grid", "Grid size", 12, 12, 12, 1, kind="int"),
        ParamSpec("n_trucks", "Trucks", 5, 1, 14, 1, kind="int"),
        ParamSpec("n_loaders", "Loaders", 1, 1, 4, 1, kind="int"),
        ParamSpec("grade", "Grade penalty", 3.0, 0.0, 8.0, 0.5),
        ParamSpec("pass_col", "Pass column", 2, 2, 2, 1, kind="int"),
        ParamSpec("lift_col", "Load/dump column", 4, 4, 4, 1, kind="int"),
        ParamSpec("barrier", "Wall on direct line", 0, 0, 1, 1, kind="int"),
        ParamSpec("load_time", "Load time", 4.0, 1.0, 8.0, 0.5),
        ParamSpec("dump_time", "Dump time", 1.0, 0.5, 4.0, 0.5),
        ParamSpec("breakdown", "Breakdown rate", 0.0, 0.0, 0.5, 0.05),
        ParamSpec("horizon", "Shift length", 60.0, 20.0, 200.0, 5.0),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, *, nt=5, nl=1, grade=3.0, pc=2, lc=4, bar=0, ne="", ns=""):
            return Variant(vid, le, ls, {"grid": 12, "n_trucks": nt, "n_loaders": nl, "grade": grade,
                                         "pass_col": pc, "lift_col": lc, "barrier": bar,
                                         "load_time": 4.0, "dump_time": 1.0, "breakdown": 0.0,
                                         "horizon": 60.0}, ne, ns)

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

    def _load_plan(self, grid: int, grade: float, pass_col: int, lift_col: int, barrier: int) -> dict:
        """Fetch the COMMITTED plan for this geometry (built offline by NetworkX+OR-Tools).

        Live mode tunes the fleet over a FIXED plan, so the geometry must match a committed one. The two free
        geometry sliders — grade (route flips live) and the wall toggle — both re-select among committed plans
        across their whole range; the pass/lift columns are pinned to the committed defaults by their
        param_specs (the r_passR variant's right-pass plan is committed and reached via the variant, not the
        sliders). An off-grid geometry has no committed plan, which is a native-plan miss (it would need
        OR-Tools/NetworkX, absent in the worker) — reported honestly.
        """
        key = _plan_key(grid, grade, pass_col, lift_col, barrier)
        plan = PLANS.get(key)
        if plan is None:  # pragma: no cover - guarded by committed grade×wall grid + pinned pass/lift columns
            raise RuntimeError(
                f"s07_haul: no committed plan for geometry '{key}'. The OR-Tools/NetworkX route plan is "
                f"native (no WASM build); regenerate plans offline with `python -m simlab.scenarios._haul_plan`."
            )
        return plan

    def run(self, params: dict, seed: int) -> RouteTrace:
        p = self.coerce(params)
        g, nt, nl = int(p["grid"]), int(p["n_trucks"]), int(p["n_loaders"])
        grade, horizon = float(p["grade"]), float(p["horizon"])
        pass_col, lift_col, barrier = int(p["pass_col"]), int(p["lift_col"]), int(p["barrier"])
        load_time, dump_time = float(p["load_time"]), float(p["dump_time"])
        breakdown = float(p["breakdown"])

        # ── PLAN (committed, native NetworkX+OR-Tools) ──
        plan = self._load_plan(g, grade, pass_col, lift_col, barrier)
        up_path: list[int] = list(plan["up_path"])
        down_path: list[int] = list(plan["down_path"])

        # ── render geometry rebuilt live from the SAME GridNetwork (pure-Python; matches the plan) ──
        net, load_node, dump_node, blocked = _network_for(g, pass_col, lift_col, barrier)
        speed = 1.0

        def loaded_cost(a: int, b: int) -> float:
            return net.dist(a, b) * (1.0 + grade * max(0.0, net.elev[b] - net.elev[a]))

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

        # ── REPLAY: the closed finite-source haul cycle as a real SimPy DES over the fixed plan ──
        agents, loads, busy_time, wait_time = self._simulate(
            net, nt, nl, horizon, up_path, down_path, loaded_cost, load_time, dump_time, speed,
            breakdown, int(seed))

        # analytic comes straight from the committed plan (computed offline by the native builder)
        plan_analytic = dict(plan["analytic"])
        switch = plan_analytic["switch_grade_est"]
        via_col = int(plan_analytic["cross_col"])
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
            "switch_grade_est": switch,
            "n_trucks": nt,
            "n_loaders": nl,
        }
        tr.analytic = {
            "switch_grade_est": switch,
            "route_via": (f"pass at col {via_col}" if detoured else "direct over crest"),
            "cross_col": via_col,
            "lift_col": lift_col,
        }
        return tr

    @staticmethod
    def _simulate(net: GridNetwork, nt: int, nl: int, horizon: float, up_path: list[int],
                  down_path: list[int], loaded_cost: Callable[[int, int], float],
                  load_time: float, dump_time: float, speed: float,
                  breakdown: float, seed: int):
        """SimPy discrete-event replay of the closed finite-source haul cycle over the FIXED plan.

        Each truck is a SimPy process competing for a shared ``Resource`` of ``nl`` loaders. A truck joins
        the loader queue, holds a loader for ``load_time``, hauls up the planned (loaded) route, dumps,
        hauls back the (empty) route, and re-enters the queue — until starting a load would run past the
        shift ``horizon``. The shared loader is the binding resource: with one loader, adding trucks only
        lengthens the queue, so throughput saturates at the loader rate (the machine-repair / M/M/1//N
        result). When ``breakdown`` > 0 each loaded haul suffers an independent delay with that probability
        (a fixed-magnitude stoppage), drawn from a single seeded NumPy RNG so the replay stays a pure
        function of (params, seed); at ``breakdown = 0`` the run is byte-identical to the deterministic plan.
        The route trace's per-truck legs and the throughput/cycle/wait KPIs are the simulated output.
        """
        import simpy

        rng = make_rng(seed)
        # All stochastic delays are drawn UP FRONT into a fixed per-truck stream, so determinism is
        # independent of the SimPy scheduler's interleaving (same seed -> same delays -> same trace).
        DELAY_MAG = 6.0            # a breakdown adds this many minutes to a loaded haul (fixed magnitude)
        MAX_CYCLES = 200           # plenty of headroom for the longest shift; bounds the up-front draw
        delays = [[(DELAY_MAG if (breakdown > 0.0 and rng.random() < breakdown) else 0.0)
                   for _ in range(MAX_CYCLES)] for _ in range(nt)]

        env = simpy.Environment()
        loaders = simpy.Resource(env, capacity=nl)
        agents = [{"id": k, "kind": "truck", "color": "var(--color-accent)", "legs": []} for k in range(nt)]
        stats = {"loads": 0, "busy": 0.0, "wait": 0.0}

        def truck(k: int):
            yield env.timeout(0.02 * k)  # slight stagger so the fleet doesn't hit the loader in lockstep
            cyc = 0
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
                # loaded haul up the planned route, optional breakdown delay, dump, then empty haul back
                up_legs, t_dump = timed_legs(net, up_path, load_end, speed, cost=loaded_cost)
                yield env.timeout(t_dump - load_end)
                delay = delays[k][cyc] if cyc < MAX_CYCLES else 0.0
                if delay:
                    yield env.timeout(delay)
                yield env.timeout(dump_time)
                t_dump_end = env.now
                down_legs, t_back = timed_legs(net, down_path, t_dump_end, speed)
                yield env.timeout(t_back - t_dump_end)
                agents[k]["legs"].extend(up_legs)
                agents[k]["legs"].extend(down_legs)
                stats["busy"] += t_back - start_load
                cyc += 1
                if env.now >= horizon:
                    break

        for k in range(nt):
            env.process(truck(k))
        env.run()
        return agents, stats["loads"], stats["busy"], stats["wait"]
