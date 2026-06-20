"""Offline haul-route PLAN builder for S07 (native: NetworkX geometry + OR-Tools CP-SAT cost certificate).

This is the OPTIMIZE half of S07's optimize-then-simulate split, and it is the ONLY part that needs native
code. It builds a haul-route plan over the graded ``_geo`` grid — the loaded climb + empty return node paths,
the OR-Tools CP-SAT route-cost certificate, the analytic ``g*`` references and the route-trace rendering
geometry (nodes/edges/elev/bounds/barriers) — and emits it as a small, JSON-serialisable dict of *rendered
data* (node ids + numbers, never a raw graph object).

It runs OFFLINE in the local ``.venv`` (it lazy-imports ``networkx`` and ``ortools``, neither of which has a
WASM build), and its output is committed to ``s07_plans.py`` by ``regenerate_committed_plans()``. The live
SimPy replay in ``s07_haul.py`` then loads those committed plans WITHOUT importing this module — so OR-Tools
is never reached in the Pyodide worker.

Determinism: NetworkX Dijkstra is byte-stable on the fixed graph; CP-SAT is pinned to a single worker + a
fixed seed + a bounded stop, and only CERTIFIES the cost (equal-cost optimal routes let the ILP tie-break the
path arbitrarily, so the path geometry is always taken from NetworkX). The committed plan is therefore a pure
function of the geometry params — reproducible across machines and runs.
"""
from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable

from ._geo import GridNetwork

if TYPE_CHECKING:  # type-checking only: NetworkX is a native-absent dep under Pyodide, imported lazily below
    import networkx as nx

# OR-Tools CP-SAT confirmation of the optimal route cost. Native code => offline (never imported in the worker).
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
    import networkx as nx  # lazy: native-absent under Pyodide, only needed in the offline plan builder

    g = nx.DiGraph()
    g.add_nodes_from(net.coords)
    for a, b in net.edges:
        g.add_edge(a, b, weight=cost(a, b))
        g.add_edge(b, a, weight=cost(b, a))
    return g


def nx_route(net: GridNetwork, cost: Callable[[int, int], float], src: int, dst: int) -> list[int]:
    """The cheapest haul route src->dst on the graded road graph (NetworkX Dijkstra)."""
    import networkx as nx  # lazy: native-absent under Pyodide, only needed in the offline plan builder

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
    from ortools.sat.python import cp_model  # lazy: native, offline-only (never reached in the worker)

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


def plan_key(grid: int, grade: float, pass_col: int, lift_col: int, barrier: int) -> str:
    """A stable string key for one geometry plan (grade quantised to the slider's 0.5 step)."""
    return f"g{int(grid)}_grade{float(grade):.1f}_pass{int(pass_col)}_lift{int(lift_col)}_bar{int(barrier)}"


def _make_net(grid: int, pass_col: int, lift_col: int, barrier: int) -> tuple[GridNetwork, int, int, set[int]]:
    """Build the shared graded ridge network + the load/dump nodes for one geometry (offline)."""
    g = int(grid)
    ridge_row = (g - 1) / 2.0
    rr = int(round(ridge_row))
    # A barrier walls the direct climb: block the two ridge-row cells in the lift column, forcing a detour
    # independent of grade. Deterministic from g/lift_col/ridge_row.
    blocked = {rr * g + lift_col, (rr + 1) * g + lift_col} if barrier else set()
    net = GridNetwork(g, g, spacing=1.0, terrain="ridge",
                      terrain_opts={"passes": [pass_col], "ridge_row": ridge_row}, blocked=blocked)
    load_node = 0 * g + lift_col          # bottom edge, lift column
    dump_node = (g - 1) * g + lift_col    # top edge, lift column
    return net, load_node, dump_node, blocked


def build_plan(grid: int, grade: float, pass_col: int, lift_col: int, barrier: int) -> dict[str, Any]:
    """Build ONE committed haul plan (NetworkX geometry + OR-Tools cost certificate + render geometry).

    Returns a JSON-serialisable dict of rendered data only — node ids, numeric coords/elevations and the two
    route polylines as node-id lists. No graph object is serialised. Raises if the dump is unreachable or if
    OR-Tools disagrees with NetworkX on the route cost.
    """
    g = int(grid)
    grade = round(float(grade), 1)
    pass_col, lift_col, barrier = int(pass_col), int(lift_col), int(barrier)
    ridge_row = (g - 1) / 2.0
    net, load_node, dump_node, blocked = _make_net(g, pass_col, lift_col, barrier)

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

    # analytic: where the route switches direct<->pass, and which way THIS geometry routed
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
    # With a barrier the "direct" reference is itself forced onto a detour by the blocked cells, so the
    # closed-form g* reference is ill-defined; report it undefined (None). The route flip is still correct.
    if barrier:
        switch = None
    cross = min(up_path, key=lambda n: abs(net.coords[n][1] - ridge_row))
    via_col = int(round(net.coords[cross][0]))
    detoured = abs(via_col - lift_col) > 0.5

    # The plan stores ONLY what is native to compute: the two route polylines (NetworkX geometry), the
    # OR-Tools cost certificate and the analytic g* reference. The render geometry (nodes/edges/elev/bounds/
    # barriers) is a pure-Python function of the geometry params and is rebuilt live from ``GridNetwork`` in
    # the worker — so the committed data is small and free of any duplicated grid render.
    return {
        "key": plan_key(g, grade, pass_col, lift_col, barrier),
        "grid": g,
        "grade": grade,
        "pass_col": pass_col,
        "lift_col": lift_col,
        "barrier": barrier,
        "load_node": load_node,
        "dump_node": dump_node,
        "up_path": list(up_path),
        "down_path": list(down_path),
        "up_cost": round(up_cost_nx, 4),
        "up_cost_certified": round(up_cost_or, 4),
        "analytic": {
            "switch_grade_est": round(switch, 2) if switch is not None else None,
            "route_via": (f"pass at col {via_col}" if detoured else "direct over crest"),
            "cross_col": via_col,
            "lift_col": lift_col,
        },
    }


def enumerate_plan_geometries() -> list[tuple[int, float, int, int, int]]:
    """The deterministic set of geometries to precompute: every grade slider step at the default geometry
    (so the route-flip lesson is fully live across the grade slider), plus the off-default geometries the
    committed variants use (r_passR's right pass, r_wall's barrier). (grid, grade, pass_col, lift_col, barrier).
    """
    geoms: list[tuple[int, float, int, int, int]] = []
    # grade slider: 0.0 .. 8.0 step 0.5 at the default geometry (grid 12, pass 2, lift 4, no wall)
    for i in range(17):  # 0.0 .. 8.0 inclusive
        geoms.append((12, round(i * 0.5, 1), 2, 4, 0))
    # variant-specific geometries
    geoms.append((12, 6.0, 9, 7, 0))   # r_passR — pass moved right
    geoms.append((12, 1.0, 2, 4, 1))   # r_wall  — barrier on the direct climb
    # de-dup, preserve order
    seen: set[tuple[int, float, int, int, int]] = set()
    out: list[tuple[int, float, int, int, int]] = []
    for geo in geoms:
        if geo not in seen:
            seen.add(geo)
            out.append(geo)
    return out


def build_all_plans() -> dict[str, dict[str, Any]]:
    """Build every committed plan (offline). Keyed by ``plan_key``; deterministic across runs/machines."""
    plans: dict[str, dict[str, Any]] = {}
    for grid, grade, pass_col, lift_col, barrier in enumerate_plan_geometries():
        plan = build_plan(grid, grade, pass_col, lift_col, barrier)
        plans[plan["key"]] = plan
    return plans


_HEADER = '''"""Committed S07 haul-route PLANS — GENERATED, do not edit by hand.

Each entry is one haul-route plan (loaded climb + empty return node paths, the OR-Tools CP-SAT cost
certificate, the analytic g* reference, and the route-trace render geometry) for one fixed geometry. They are
*rendered data only* — node ids + numbers, never a raw graph — so they ship safely in the public repo and the
live SimPy replay (``s07_haul.py``) loads them WITHOUT importing OR-Tools/NetworkX (no WASM build).

Regenerate with:  python -m simlab.scenarios._haul_plan   (runs the native NetworkX+OR-Tools builder offline).
"""
from __future__ import annotations

'''


def regenerate_committed_plans(path: str | Path | None = None) -> Path:
    """Rebuild every plan offline and (re)write the committed ``s07_plans.py`` data module deterministically."""
    import pprint

    plans = build_all_plans()
    target = Path(path) if path is not None else Path(__file__).resolve().parent / "s07_plans.py"
    # A stable, diff-friendly VALID-PYTHON literal (sort_dicts keeps key order deterministic across runs).
    body = "PLANS = " + pprint.pformat(plans, indent=1, width=110, sort_dicts=True) + "\n"
    target.write_text(_HEADER + body, encoding="utf-8")
    return target


if __name__ == "__main__":  # pragma: no cover - offline regeneration entrypoint
    out = regenerate_committed_plans()
    print(f"wrote {len(build_all_plans())} plans -> {out}")
