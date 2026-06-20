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

ROAD_GRADE = 6.0   # fixed terrain penalty on loaded climbs (strong, so routes visibly wind around hills)
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
        def v(vid, le, ls, *, nt=6, dem=60.0, gt=2.9, tol=0.15, ns=1, init=0.0, sg=3.0, bar=0, hz=145.0, ne="", nse=""):
            return Variant(vid, le, ls, {"grid": 14, "n_trucks": nt, "plant_demand": dem, "grade_target": gt,
                                         "grade_tol": tol, "n_stocks": ns, "init_stock": init, "stock_grade": sg,
                                         "barrier": bar, "horizon": hz}, ne, nse)

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
            v("surge12", "Surge · bigger fleet", "Alza · flota mayor", nt=16, dem=120.0, hz=200.0,
              ne="More trucks absorb the surge and restore the blend.", nse="Más camiones absorben el alza y recuperan la mezcla."),
            v("stock_source", "Stock as a source", "Stock como origen", nt=6, init=40.0, sg=3.2,
              ne="A pre-built high-grade stock feeds the plant — the stock DRAINS as a source.", nse="Un stock rico pre-armado alimenta la planta — el stock se VACÍA como origen."),
            v("two_phase_rich", "High target · rich far phase", "Meta alta · fase rica lejana", nt=4, gt=3.2,
              ne="A high target needs lots of the distant rich phase; a small fleet can't deliver it.", nse="Una meta alta exige mucha fase rica lejana; una flota chica no la entrega."),
            v("dump_heavy", "Low plant demand", "Baja demanda de planta", nt=6, dem=25.0,
              ne="Little goes to the plant; most production routes to the dump.", nse="Poco va a la planta; casi toda la producción va al botadero."),
            v("barrier", "Wall on a haul road", "Muro en una ruta", nt=6, bar=1,
              ne="A barrier lengthens the rich phase's haul road, worsening the slip.", nse="Una barrera alarga la ruta de la fase rica, agravando el desvío."),
            v("low_target", "Low grade target", "Meta de ley baja", nt=6, gt=1.75,
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

        # Places sit at opposite CORNERS/edges (spread across the whole map) so haul routes are long and
        # cross varied terrain; the high-grade phase is the FAR corner from the plant (it starves first).
        plant_node = at(0.88, 0.84)        # top-right corner
        phase_nodes = [at(0.14, 0.86), at(0.86, 0.16), at(0.10, 0.12)]  # low (top-left), mid (bot-right), high (FAR bot-left)
        dump_node = at(0.50, 0.08)         # bottom edge
        stock_node = at(0.30, 0.40) if n_stocks else None  # interior, off the central wall

        # A DISTRIBUTED, irregular hills field. Broad TALL hills sit ON the corridors between the corner
        # stations (a central wall + a top-corridor + a right-corridor block) so the straight line is
        # expensive and each O-D pair winds a DIFFERENT way; medium scattered bumps + one basin (amp<0)
        # add irregular relief everywhere. (fx, fy, amp, sigma) as grid-coord fractions.
        raw_bumps = [
            (0.52, 0.52, 2.3, 0.19), (0.54, 0.78, 1.7, 0.13), (0.80, 0.48, 1.6, 0.13),
            (0.66, 0.28, 1.3, 0.11), (0.24, 0.66, 1.3, 0.12), (0.70, 0.70, 1.4, 0.12),
            (0.40, 0.24, 1.1, 0.10), (0.64, 0.58, -1.3, 0.14), (0.20, 0.52, 1.1, 0.10),
            (0.84, 0.70, 1.1, 0.10), (0.44, 0.66, 1.2, 0.11), (0.34, 0.16, 1.0, 0.10),
        ]
        bumps = [(fx * (g - 1), fy * (g - 1), amp, sf * (g - 1)) for fx, fy, amp, sf in raw_bumps]
        # A wall placed ON the realized HIGH→plant haul road ONLY (so it bites the rich phase, not the
        # near phases). The high phase (top-left) reaches the plant (bottom-right) down the left edge,
        # through the low-elevation valley around row 5, then up the right side. low→plant runs along the
        # bottom row and mid→plant up the right edge — neither touches this corner. The wall is an L
        # (row 8 cols 0..6 seals the bottom-left escape; col 6 rows 2..8 seals the valley exit), forcing
        # the loaded high haul up and over higher ground (cost ~34.4 → ~36.9) while low/mid are unchanged.
        # Net effect: the rich phase's cycle lengthens, fewer high-grade loads land, the blend slips MORE.
        blocked = ({(8 * g + c) for c in range(0, 7)} | {(r * g + 6) for r in range(2, 9)}) if barrier else set()
        net = GridNetwork(g, g, spacing=1.0, terrain="hills",
                          terrain_opts={"bumps": bumps}, blocked=blocked)

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
        # DUMP = the low-grade waste/excess. The low phase is mined at a roughly fixed production rate; the
        # share NOT pulled into the plant blend is wasted to the dump. So the dump target is the slack
        # between a nominal production level and the plant demand — when plant demand is LOW the dump
        # target is LARGE (most production routes to the dump), when demand is high the dump shrinks to a
        # floor. nominal_production is a fixed reference (not demand) so dump_heavy genuinely dumps more.
        nominal_production = 80.0
        dump_target = max(10.0, nominal_production - demand)
        flows.append({"src": phase_nodes[0], "dst": dump_node, "grade": PHASE_GRADES[0],
                      "target": dump_target, "kind": "dump", "from_stock": False, "done": 0.0})

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
        # When plant demand is LOW the plant needs only a couple of trucks; the rest of the fleet mines the
        # low-grade ore to the DUMP. Devote most trucks to dump duty so the dump genuinely takes the bulk
        # of production (the "low plant demand" story). Keep >=1 plant truck so the plant plan still runs.
        plant_plan_t = sum(fl["target"] for fl in flows if fl["kind"] == "plant")
        if plant_plan_t <= 0.45 * nominal_production and n_trucks >= 3:
            n_aux = max(n_aux, n_trucks - 2)

        def pick_flow(cur: int, duty: str) -> dict | None:
            # PLANT trucks feed the plant first; once the plant plan is served they help the housekeeping
            # flows. AUX trucks own the housekeeping flows (dump + stock) and only backstop the plant once
            # those are done. Within the housekeeping tier an aux truck takes whichever flow is FURTHEST
            # BEHIND (lowest done/target ratio), so the dump AND the stock both progress — the dump is
            # always serviced (loads_dump > 0 everywhere) and a buffer-build still fills the stock.
            if duty == "plant":
                tiers = (("plant",), ("dump", "stock"))
            else:
                tiers = (("dump", "stock"), ("plant",))
            for kinds in tiers:
                cands = [fl for fl in flows if fl["kind"] in kinds and feasible(fl)]
                if not cands:
                    continue
                if len(kinds) > 1:
                    # housekeeping tier: serve the most-behind flow, breaking ties by reachability
                    return min(cands, key=lambda fl: (fl["done"] / fl["target"] if fl["target"] else 1.0,
                                                      reach_time(cur, fl)))
                return min(cands, key=lambda fl: (reach_time(cur, fl), flows.index(fl)))
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
        # plan_adherence measures the PLANT FEED PLAN — the real "plan" the LP committed to. Buffer
        # (stock) and waste (dump) flows are housekeeping, not the production plan, so they don't dilute
        # the metric (else a fully-served plant could still read low because the dump lagged).
        plan_total = sum(fl["target"] for fl in flows if fl["kind"] == "plant")
        done_total = sum(fl["done"] for fl in flows if fl["kind"] == "plant")
        tr.t_end = horizon
        tr.kpis = {
            "plant_tons": round(plant_tons, 1),
            "plant_demand": round(demand, 1),
            "grade_achieved": round(achieved, 3),
            "grade_target": round(gt, 3),
            "grade_dev": round(abs(achieved - gt), 3),
            "in_band": 1 if abs(achieved - gt) <= tol else 0,
            "plan_adherence_pct": round(min(100.0, 100 * done_total / plan_total), 1) if plan_total else 0.0,
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
