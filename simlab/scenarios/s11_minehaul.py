"""S11 — Mine multi-destination haul: an optimal flow plan vs a fixed fleet (plan-then-simulate).

A mine sends ore from several PHASES (load points, each with an ore grade) to three destination KINDS:
a PLANT (final sink with a target grade), a DUMP (waste sink) and intermediate STOCKS (a node that is a
sink AND, once it holds material, a source for later trips). Two coupled OR problems:

  1. PLANT BLEND (LP, OR-Tools GLOP, precompute) — choose how many tonnes to draw from each source so the
     blended feed hits the plant grade target within demand. The sources' grades straddle the target, so a
     single phase can't satisfy it: the plan is a genuine blend.
  2. EXECUTION (seeded discrete-event sim) — a FIXED fleet runs haul cycles (load → graded climb → tip →
     return), dispatching to whichever planned flow is furthest behind. The far, high-grade phase needs
     longer hauls, so an under-sized fleet can't deliver its planned tonnage in the shift — and the
     achieved plant blend SLIPS off target. An optimal plan is necessary but not sufficient.

Stocks rise as trucks tip into them and fall as trucks draw from them (fill bars in the viz). OR-Tools is
native, so this is a precompute-lane scenario (no live lane) — the committed trace replays the plan + the
fleet realizing a degraded version of it.
"""
from __future__ import annotations

import heapq

from ..core.routetrace import RouteTrace
from ..core.scenario import ParamSpec, Scenario, Variant
from ._geo import GridNetwork, timed_legs

ROAD_GRADE = 2.5   # fixed terrain penalty on loaded climbs (the ore grade is a separate thing)
TRUCK_CAP = 2.0    # tonnes per trip
LOAD_TIME = 1.5
TIP_TIME = 0.5
SPEED = 1.0
PHASE_GRADES = [1.6, 2.5, 3.4]  # low / mid / high ore grade


class MineHaulScenario(Scenario):
    id = "s11_minehaul"
    title = "Mine Multi-Destination Haul"
    method = "hybrid"
    tier = 3
    viz = "route"
    engine = "ortools"
    pure_python = False
    wheels = []
    param_specs = [
        ParamSpec("grid", "Grid size", 14, 12, 18, 1, kind="int"),
        ParamSpec("n_trucks", "Trucks", 6, 1, 16, 1, kind="int"),
        ParamSpec("plant_demand", "Plant demand (t)", 60.0, 10.0, 160.0, 5.0),
        ParamSpec("grade_target", "Plant grade target", 2.9, 1.5, 3.4, 0.1),
        ParamSpec("grade_tol", "Grade band ±", 0.15, 0.05, 0.5, 0.05),
        ParamSpec("n_stocks", "Stocks", 1, 0, 1, 1, kind="int"),
        ParamSpec("init_stock", "Initial stock (t)", 0.0, 0.0, 60.0, 5.0),
        ParamSpec("stock_grade", "Stock ore grade", 3.0, 1.5, 3.4, 0.1),
        ParamSpec("barrier", "Wall on a haul road", 0, 0, 1, 1, kind="int"),
        ParamSpec("horizon", "Shift length", 90.0, 30.0, 240.0, 10.0),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, *, nt=6, dem=60.0, gt=2.9, tol=0.15, ns=1, init=0.0, sg=3.0, bar=0, ne="", nse=""):
            return Variant(vid, le, ls, {"grid": 14, "n_trucks": nt, "plant_demand": dem, "grade_target": gt,
                                         "grade_tol": tol, "n_stocks": ns, "init_stock": init, "stock_grade": sg,
                                         "barrier": bar, "horizon": 130.0}, ne, nse)

        return [
            v("base", "Matched fleet", "Flota equilibrada", nt=6,
              ne="A matched fleet roughly realizes the plan: blend near target.", nse="Una flota equilibrada realiza el plan: mezcla cerca de la meta."),
            v("undertrucked", "Under-trucked · grade slips", "Sub-equipado · la ley se desajusta", nt=3,
              ne="Too few trucks: the far high-grade phase lags, the blend slips below target.", nse="Pocos camiones: la fase rica lejana se atrasa, la mezcla cae bajo la meta."),
            v("overtrucked", "Over-trucked · plan met", "Sobre-equipado · plan cumplido", nt=12,
              ne="Ample fleet: every planned flow completes, the blend lands on target.", nse="Flota amplia: todos los flujos se completan, la mezcla da en la meta."),
            v("tight_grade", "Tight grade band", "Banda de ley estrecha", nt=6, tol=0.08,
              ne="A narrow band: small fleet-driven deviations now miss spec.", nse="Banda angosta: pequeñas desviaciones por flota ya salen de especificación."),
            v("surge", "Demand surge", "Alza de demanda", nt=6, dem=120.0,
              ne="High plant demand stresses the same fleet: adherence drops.", nse="Alta demanda de planta exige a la misma flota: cae la adherencia."),
            v("surge12", "Surge · bigger fleet", "Alza · flota mayor", nt=12, dem=120.0,
              ne="More trucks absorb the surge and restore the blend.", nse="Más camiones absorben el alza y recuperan la mezcla."),
            v("stock_source", "Stock as a source", "Stock como origen", nt=6, init=40.0, sg=3.2,
              ne="A pre-built high-grade stock feeds the plant — the stock DRAINS as a source.", nse="Un stock rico pre-armado alimenta la planta — el stock se VACÍA como origen."),
            v("two_phase_rich", "High target · rich far phase", "Meta alta · fase rica lejana", nt=4, gt=3.2,
              ne="A high target needs lots of the distant rich phase; a small fleet can't deliver it.", nse="Una meta alta exige mucha fase rica lejana; una flota chica no la entrega."),
            v("dump_heavy", "Low plant demand", "Baja demanda de planta", nt=6, dem=25.0,
              ne="Little goes to the plant; most production routes to the dump.", nse="Poco va a la planta; casi toda la producción va al botadero."),
            v("barrier", "Wall on a haul road", "Muro en una ruta", nt=6, bar=1,
              ne="A barrier lengthens the rich phase's haul road, worsening the slip.", nse="Una barrera alarga la ruta de la fase rica, agravando el desvío."),
            v("low_target", "Low grade target", "Meta de ley baja", nt=6, gt=2.2,
              ne="A low target leans on the near phases — easy to hit on grade.", nse="Meta baja se apoya en las fases cercanas — fácil de lograr en ley."),
            v("stock_buffer", "Stock buffer building", "Stock acumulando", nt=8, init=10.0,
              ne="The stock fills from a phase while the plant runs — watch the bar rise.", nse="El stock se llena desde una fase mientras corre la planta — mira subir la barra."),
        ]

    def run(self, params: dict, seed: int) -> RouteTrace:
        from ortools.linear_solver import pywraplp  # lazy: native, precompute-only

        p = self.coerce(params)
        g = int(p["grid"])
        n_trucks = int(p["n_trucks"])
        demand = float(p["plant_demand"])
        gt = float(p["grade_target"])
        tol = float(p["grade_tol"])
        n_stocks = int(p["n_stocks"])
        init_stock = float(p["init_stock"])
        stock_grade = float(p["stock_grade"])
        barrier = int(p["barrier"])
        horizon = float(p["horizon"])

        # Places sit in the INTERIOR, spread out (fractions of the grid) so haul routes wind through the
        # terrain instead of hugging the border. Index 0=low, 1=mid, 2=high to match PHASE_GRADES: low &
        # mid sit NEAR the plant; the high-grade phase sits FAR across the map — an undersized fleet
        # starves it and the blend slips.
        def at(fx: float, fy: float) -> int:
            return int(round(fy * (g - 1))) * g + int(round(fx * (g - 1)))

        plant_node = at(0.82, 0.80)
        phase_nodes = [at(0.74, 0.26), at(0.26, 0.82), at(0.13, 0.13)]  # low (near), mid (near), high (FAR)
        dump_node = at(0.50, 0.22)
        stock_node = at(0.52, 0.56) if n_stocks else None
        # a richly varied landscape (Gaussian hills); routes wind through the valleys between peaks
        bumps = [(0.34 * (g - 1), 0.54 * (g - 1), 1.5), (0.64 * (g - 1), 0.40 * (g - 1), 1.4),
                 (0.50 * (g - 1), 0.78 * (g - 1), 1.2), (0.80 * (g - 1), 0.58 * (g - 1), 1.2),
                 (0.24 * (g - 1), 0.32 * (g - 1), 1.1), (0.44 * (g - 1), 0.44 * (g - 1), 1.3)]
        sigma = 0.16 * (g - 1)
        # a wall at a chokepoint on the high→plant line (forces a reroute) for the barrier variant
        blocked = {at(0.45, 0.47), at(0.48, 0.51)} if barrier else set()
        net = GridNetwork(g, g, spacing=1.0, terrain="hills",
                          terrain_opts={"bumps": bumps, "sigma": sigma}, blocked=blocked)

        def loaded_cost(a: int, b: int) -> float:
            return net.dist(a, b) * (1.0 + ROAD_GRADE * max(0.0, net.elev[b] - net.elev[a]))

        _pcache: dict[tuple[int, int], tuple[list[int], float]] = {}

        def path(a: int, b: int, loaded: bool) -> tuple[list[int], float]:
            key = (a, b, loaded)
            if key not in _pcache:
                _pcache[key] = net.shortest_path(a, b, cost=loaded_cost if loaded else None)
            return _pcache[key]

        # ── PLANT BLEND LP (GLOP) ──
        # sources that can feed the plant: the 3 phases (generous supply) + the stock if pre-built
        src = [{"node": phase_nodes[i], "grade": PHASE_GRADES[i], "supply": demand * 0.7} for i in range(3)]
        if stock_node is not None and init_stock > 0:
            src.append({"node": stock_node, "grade": stock_grade, "supply": init_stock, "is_stock": True})
        total_supply = sum(s["supply"] for s in src)
        demand_eff = min(demand, total_supply)
        solver = pywraplp.Solver.CreateSolver("GLOP")
        inf = solver.infinity()
        xs = [solver.NumVar(0.0, s["supply"], f"x{i}") for i, s in enumerate(src)]
        dpos = solver.NumVar(0.0, inf, "dpos")
        dneg = solver.NumVar(0.0, inf, "dneg")
        solver.Add(sum(xs) == demand_eff)
        solver.Add(sum(src[i]["grade"] * xs[i] for i in range(len(src))) - gt * demand_eff == dpos - dneg)
        solver.Minimize(dpos + dneg)
        solver.Solve()
        plan_x = [x.solution_value() for x in xs]
        plan_grade = sum(src[i]["grade"] * plan_x[i] for i in range(len(src))) / demand_eff if demand_eff else 0.0

        # ── flows the fleet must realize ──
        # plant-feed flows from each source with a positive plan
        flows: list[dict] = []
        for i, s in enumerate(src):
            if plan_x[i] > 1e-6:
                flows.append({"src": s["node"], "dst": plant_node, "grade": s["grade"], "target": plan_x[i],
                              "kind": "plant", "from_stock": s.get("is_stock", False), "done": 0.0})
        # stock-fill (build a buffer from the high-grade phase) + a dump flow (low-grade excess)
        stock_cap = 60.0
        # build a buffer from the near mid phase — UNLESS the stock is already pre-built (then it only
        # sources to the plant, showing the drain role cleanly).
        if stock_node is not None and init_stock < 0.4 * stock_cap:
            fill_target = min(stock_cap - init_stock, 0.5 * stock_cap)
            if fill_target > 1e-6:
                flows.append({"src": phase_nodes[1], "dst": stock_node, "grade": PHASE_GRADES[1],
                              "target": fill_target, "kind": "stock", "from_stock": False, "done": 0.0})
        flows.append({"src": phase_nodes[0], "dst": dump_node, "grade": PHASE_GRADES[0],
                      "target": max(10.0, 0.4 * demand), "kind": "dump", "from_stock": False, "done": 0.0})

        # ── EXECUTION DES ──
        agents = [{"id": k, "kind": "truck", "color": "var(--color-accent)", "legs": [], "node": plant_node} for k in range(n_trucks)]
        loader_free: dict[int, float] = {}
        stock_level = init_stock
        stock_frames: list[list[float]] = [[0.0, round(init_stock, 2)]] if stock_node is not None else []
        plant_tons = 0.0
        plant_grade_accum = 0.0
        loads_by_kind = {"plant": 0, "dump": 0, "stock": 0}
        busy_time = 0.0
        total_graded = 0.0

        evq = [(0.03 * k, k) for k in range(n_trucks)]
        heapq.heapify(evq)

        def feasible(fl: dict) -> bool:
            if fl["done"] >= fl["target"] - 1e-9:
                return False
            if fl["from_stock"] and stock_level < TRUCK_CAP - 1e-9:
                return False  # a stock can only source once it holds material
            if fl["dst"] == stock_node and stock_level + TRUCK_CAP > stock_cap + 1e-9:
                return False  # stock full
            return True

        def reach_time(cur: int, fl: dict) -> float:
            ps, _ = path(cur, fl["src"], loaded=False)
            t_src = sum(net.dist(x, y) for x, y in zip(ps, ps[1:])) / SPEED
            _, dcost = path(fl["src"], fl["dst"], loaded=True)
            return t_src + LOAD_TIME + dcost / SPEED

        # Route assignment: most trucks feed the plant; 1-2 auxiliary trucks run dump+stock concurrently
        # (with fallback either way). The PLANT fleet = n_trucks - n_aux drives the slip: too few and the
        # far high-grade phase is starved, so the blend misses target; enough and the plan is realized.
        n_aux = 0 if n_trucks <= 2 else (1 if n_trucks <= 6 else 2)

        def pick_flow(cur: int, duty: str) -> dict | None:
            # plant trucks feed the plant first; aux trucks build the stock first, then the dump
            pref = (("plant",), ("stock",), ("dump",)) if duty == "plant" else (("stock",), ("dump",), ("plant",))
            for kinds in pref:
                cands = [(i, fl) for i, fl in enumerate(flows) if fl["kind"] in kinds and feasible(fl)]
                if cands:
                    return min(cands, key=lambda it: (reach_time(cur, it[1]), it[0]))[1]
            return None

        while evq:
            t_arr, truck = heapq.heappop(evq)
            if t_arr >= horizon:
                continue
            a = agents[truck]
            fl = pick_flow(a["node"], "aux" if truck < n_aux else "plant")
            if fl is None:
                continue
            # drive to the source (empty, plain distance)
            to_src, _ = path(a["node"], fl["src"], loaded=False)
            src_legs, t_at_src = timed_legs(net, to_src, t_arr, SPEED)
            lf = loader_free.get(fl["src"], 0.0)
            start_load = max(t_at_src, lf)
            if start_load + LOAD_TIME >= horizon:
                continue
            load_end = start_load + LOAD_TIME
            loader_free[fl["src"]] = load_end
            if fl["from_stock"]:
                stock_level -= TRUCK_CAP
                stock_frames.append([round(load_end, 2), round(stock_level, 2)])
            # loaded haul to the destination (graded)
            to_dst, dcost = path(fl["src"], fl["dst"], loaded=True)
            total_graded += dcost
            haul_legs, t_at_dst = timed_legs(net, to_dst, load_end, SPEED, cost=loaded_cost)
            a["legs"].extend(src_legs + haul_legs)
            a["node"] = fl["dst"]
            fl["done"] += TRUCK_CAP
            loads_by_kind[fl["kind"]] += 1
            if fl["kind"] == "plant":
                plant_tons += TRUCK_CAP
                plant_grade_accum += TRUCK_CAP * fl["grade"]
            elif fl["dst"] == stock_node:
                stock_level += TRUCK_CAP
                stock_frames.append([round(t_at_dst, 2), round(stock_level, 2)])
            busy_time += t_at_dst - t_arr
            t_done = t_at_dst + TIP_TIME
            if t_done < horizon:
                heapq.heappush(evq, (t_done, truck))

        # ── trace + KPIs ──
        tr = RouteTrace(self.id, self.title, self.method, int(seed), p, bounds=net.bounds())
        kinds = {plant_node: "plant", dump_node: "dump"}
        for pn in phase_nodes:
            kinds[pn] = "phase"
        if stock_node is not None:
            kinds[stock_node] = "stock"
        labels = {phase_nodes[0]: "phase·low", phase_nodes[1]: "phase·mid", phase_nodes[2]: "phase·high"}
        tr.nodes = net.nodes_list(kinds=kinds, labels=labels)
        for nd in tr.nodes:
            nd["elev"] = round(net.elev[nd["id"]], 3)
        tr.edges = net.edges
        tr.barriers = [{"x": float(n % g), "y": float(n // g)} for n in sorted(blocked)]
        tr.legend = [
            {"code": "phase", "label_en": "load phase", "label_es": "fase de carguío", "color": "var(--color-accent)"},
            {"code": "plant", "label_en": "plant (grade target)", "label_es": "planta (meta de ley)", "color": "var(--color-good)"},
            {"code": "dump", "label_en": "dump", "label_es": "botadero", "color": "var(--color-warn)"},
            {"code": "stock", "label_en": "stockpile", "label_es": "acopio", "color": "var(--color-magenta)"},
        ]
        tr.agents = agents
        tr.routes = []
        for fl in flows:
            pth, _ = path(fl["src"], fl["dst"], loaded=True)
            col = {"plant": "var(--color-good)", "dump": "var(--color-warn)", "stock": "var(--color-magenta)"}[fl["kind"]]
            tr.routes.append({"agent": -1, "path": pth, "color": col})
        if stock_node is not None:
            sx, sy = net.coords[stock_node]
            tr.gauges = [{"x": round(sx, 3), "y": round(sy, 3), "capacity": stock_cap,
                          "label_en": "stockpile", "label_es": "acopio", "color": "var(--color-magenta)",
                          "frames": stock_frames}]
        achieved = plant_grade_accum / plant_tons if plant_tons else 0.0
        plan_total = sum(fl["target"] for fl in flows)
        done_total = sum(fl["done"] for fl in flows)
        tr.t_end = horizon
        tr.kpis = {
            "plant_tons": round(plant_tons, 1),
            "plant_demand": round(demand, 1),
            "grade_achieved": round(achieved, 3),
            "grade_target": round(gt, 3),
            "grade_dev": round(abs(achieved - gt), 3),
            "in_band": 1 if abs(achieved - gt) <= tol else 0,
            "plan_adherence_pct": round(100 * done_total / plan_total, 1) if plan_total else 0.0,
            "loads_plant": loads_by_kind["plant"],
            "loads_dump": loads_by_kind["dump"],
            "loads_stock": loads_by_kind["stock"],
            "n_trucks": n_trucks,
        }
        tr.analytic = {
            "plan_grade": round(plan_grade, 3),
            "plan_x": [round(x, 1) for x in plan_x],
            "demand_eff": round(demand_eff, 1),
            "stock_peak": round(max((f[1] for f in stock_frames), default=0.0), 1),
            "stock_end": round(stock_level, 1) if stock_node is not None else 0.0,
        }
        return tr
