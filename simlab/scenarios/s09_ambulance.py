"""S09 — Ambulance dispatch (stochastic EMS, nearest-available), on **SimPy + NetworkX**.

Emergency calls arrive as a Poisson process at random locations on a city road grid. A fleet of ambulances
sits at stations; each call is served by the ambulance that can REACH the scene earliest (nearest-available,
accounting for whoever is still busy). The chosen ambulance drives to the scene, treats on-scene, transports
to a hospital, and returns to base. KPIs: response-time distribution, coverage within an 8-minute threshold,
fleet utilization — the canonical EMS fleet-sizing / station-siting question.

This scenario USES the tools it documents — no hand-rolled NumPy event loop or graph search:

* **NetworkX** (``docs/frameworks/10_networkx``) builds a real undirected road graph over the shared city
  ``GridNetwork`` in ``_geo.py`` (same nodes/edges/coordinates). Travel routes — base→scene, scene→hospital,
  hospital→base — are ``nx.dijkstra_path`` shortest paths on the distance-weighted graph, and the dispatch
  metric (earliest possible arrival across the fleet) reads ``nx`` path *lengths*. On the unit grid these
  reproduce the lab's previous Dijkstra byte-for-byte, so the committed trace is unchanged.
* **SimPy** (``docs/frameworks/01_simpy``) replays the call stream + dispatch as a real discrete-event
  simulation. A single arrival process injects each Poisson call at its event time; an instantaneous
  dispatcher then commits the nearest-available ambulance (the one with the earliest feasible scene arrival,
  honouring each unit's busy-until clock). Because dispatch consumes zero simulated time and the arrival
  process fires calls strictly in time order, SimPy makes the SAME greedy decisions as the original
  sequential sweep — the DES is the *mechanism*, not a behaviour change.

Determinism: every random variate (the inter-arrival gaps and the call locations) is drawn UP FRONT from a
single seeded NumPy ``Generator`` (``make_rng(seed)``) into a fixed call list, exactly as before, so the run
never depends on the event scheduler's interleaving. NetworkX shortest paths are deterministic on the fixed
graph. The same (params, seed) therefore yields the same trace byte-for-byte — the "replay = truth" contract
the lab depends on. The emitted artifact is the existing routetrace format (nodes/edges/agents/markers/
legend/kpis); nothing in the trace schema or the frontend contract changes. Pure-Python (SimPy + NetworkX),
so the scenario keeps its live lane. The shared ``_geo.py`` is untouched.
"""
from __future__ import annotations

import math
from typing import TYPE_CHECKING

from ..core.routetrace import RouteTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant
from ._geo import GridNetwork, timed_legs

if TYPE_CHECKING:  # type-checking only: NetworkX is a heavy dep absent under Pyodide, imported lazily below
    import networkx as nx

STATION_POS = [(0.2, 0.2), (0.8, 0.8), (0.8, 0.2), (0.2, 0.8), (0.5, 0.5)]


def build_road_graph(net: GridNetwork) -> nx.Graph:
    """A real NetworkX undirected road graph over the shared city GridNetwork.

    Nodes and edges mirror ``_geo`` exactly; each road segment's weight is its euclidean length, so
    ``nx.dijkstra_path`` reproduces the lab's plain-distance Dijkstra byte-for-byte on the unit grid.
    """
    import networkx as nx  # lazy: only needed to RUN (not to import the registry under Pyodide)

    g = nx.Graph()
    g.add_nodes_from(net.coords)
    for a, b in net.edges:
        g.add_edge(a, b, weight=net.dist(a, b))
    return g


class RoadRouter:
    """NetworkX shortest-path layer with memoised single-source results.

    Dispatch evaluates many (origin → scene) lengths and the committed route needs full node paths, so we
    cache NetworkX's single-source Dijkstra per origin (paths + lengths). Deterministic on the fixed graph.
    """

    def __init__(self, net: GridNetwork) -> None:
        self.net = net
        self.graph = build_road_graph(net)
        self._paths: dict[int, dict[int, list[int]]] = {}
        self._lengths: dict[int, dict[int, float]] = {}

    def _ensure(self, src: int) -> None:
        if src not in self._paths:
            import networkx as nx  # lazy: only needed to RUN (not to import the registry under Pyodide)

            lengths, paths = nx.single_source_dijkstra(self.graph, src, weight="weight")
            self._paths[src] = paths
            self._lengths[src] = lengths

    def path(self, src: int, dst: int) -> list[int]:
        self._ensure(src)
        return self._paths[src][dst]

    def length(self, src: int, dst: int) -> float:
        self._ensure(src)
        return self._lengths[src][dst]


class AmbulanceScenario(Scenario):
    id = "s09_ambulance"
    title = "Ambulance Dispatch"
    method = "des"
    tier = 3
    viz = "route"
    engine = "simpy"            # SimPy DES drives the call stream + dispatch; NetworkX routes the network
    pure_python = True          # SimPy + NetworkX are pure-Python → keeps the live lane
    wheels = ["numpy", "simpy", "networkx"]
    param_specs = [
        ParamSpec("grid", "Grid size", 8, 5, 11, 1, kind="int"),
        ParamSpec("n_ambulances", "Ambulances", 4, 1, 10, 1, kind="int"),
        ParamSpec("n_stations", "Stations", 2, 1, 5, 1, kind="int"),
        ParamSpec("call_rate", "Calls per hour", 12.0, 2.0, 40.0, 1.0),
        ParamSpec("threshold", "Response target", 8.0, 2.0, 20.0, 0.5),
        ParamSpec("horizon", "Window (min)", 90.0, 30.0, 300.0, 10.0),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, na, ns, lam, ne, nse):
            return Variant(vid, le, ls, {"grid": 8, "n_ambulances": na, "n_stations": ns, "call_rate": lam, "threshold": 8.0, "horizon": 90.0}, ne, nse)

        return [
            v("a2", "2 ambulances · 1 station", "2 ambulancias · 1 base", 2, 1, 12.0, "Under-resourced: long waits, low coverage.", "Recursos escasos: esperas largas, baja cobertura."),
            v("a3", "3 ambulances · 1 station", "3 ambulancias · 1 base", 3, 1, 12.0, "Still centralized: travel from one base hurts.", "Aún centralizado: viajar desde una sola base penaliza."),
            v("a4", "4 ambulances · 2 stations", "4 ambulancias · 2 bases", 4, 2, 12.0, "Two stations cut travel times.", "Dos bases reducen los tiempos de viaje."),
            v("a4s1", "4 ambulances · 1 station", "4 ambulancias · 1 base", 4, 1, 12.0, "Same fleet, one base: worse coverage.", "Misma flota, una base: peor cobertura."),
            v("a6", "6 ambulances · 2 stations", "6 ambulancias · 2 bases", 6, 2, 12.0, "Comfortable fleet for this demand.", "Flota holgada para esta demanda."),
            v("a4s4", "4 ambulances · 4 stations", "4 ambulancias · 4 bases", 4, 4, 12.0, "Spread thin: great siting, less surge capacity.", "Repartidas: buena ubicación, menos capacidad de pico."),
            v("surge", "4 ambulances · high demand", "4 ambulancias · alta demanda", 4, 2, 22.0, "A demand surge overwhelms the fleet.", "Un alza de demanda supera a la flota."),
            v("surge6", "6 ambulances · high demand", "6 ambulancias · alta demanda", 6, 2, 22.0, "More units absorb the surge.", "Más unidades absorben el alza."),
            v("quiet", "3 ambulances · low demand", "3 ambulancias · baja demanda", 3, 2, 6.0, "Low demand: even a small fleet covers well.", "Baja demanda: hasta una flota chica cubre bien."),
            v("big", "8 ambulances · 4 stations", "8 ambulancias · 4 bases", 8, 4, 22.0, "A large, well-sited system under heavy load.", "Un sistema grande y bien ubicado bajo carga alta."),
        ]

    def _station_node(self, g: int, fx: float, fy: float) -> int:
        return int(round(fy * (g - 1))) * g + int(round(fx * (g - 1)))

    def run(self, params: dict, seed: int) -> RouteTrace:
        p = self.coerce(params)
        g, na, ns = int(p["grid"]), int(p["n_ambulances"]), int(p["n_stations"])
        lam, threshold, horizon = float(p["call_rate"]), float(p["threshold"]), float(p["horizon"])
        rng = make_rng(seed)
        net = GridNetwork(g, g, spacing=1.0)
        router = RoadRouter(net)  # NetworkX shortest paths over the city graph
        speed = 1.3
        on_scene = 2.0
        rate_per_min = lam / 60.0

        stations = []
        for k in range(ns):
            node = self._station_node(g, *STATION_POS[k % len(STATION_POS)])
            if node not in stations:
                stations.append(node)
        hospital = self._station_node(g, 0.5, 0.5)

        # ambulances: round-robin across stations
        amb = [{"home": stations[k % len(stations)], "node": stations[k % len(stations)],
                "free": 0.0, "legs": []} for k in range(na)]

        # Poisson calls — drawn UP FRONT from the single seeded RNG (determinism is independent of the
        # event scheduler's interleaving; SimPy then replays this fixed stream).
        calls = []
        t = 0.0
        while True:
            t += float(rng.exponential(1.0 / rate_per_min))
            if t >= horizon:
                break
            cn = int(rng.integers(0, g * g))
            calls.append((round(t, 3), cn))

        tr = RouteTrace(self.id, self.title, self.method, int(seed), p, bounds=net.bounds())
        kinds = {hospital: "hospital"}
        for s in stations:
            kinds[s] = "station"
        tr.nodes = net.nodes_list(kinds=kinds)
        tr.edges = net.edges
        tr.legend = [
            {"code": "station", "label_en": "station", "label_es": "base", "color": "var(--color-accent)"},
            {"code": "hospital", "label_en": "hospital", "label_es": "hospital", "color": "var(--color-good)"},
            {"code": "incident", "label_en": "emergency call", "label_es": "llamado", "color": "var(--color-bad)"},
        ]

        stats = self._simulate(net, router, amb, calls, hospital, speed, on_scene, tr)

        for k, a in enumerate(amb):
            tr.agents.append({"id": k, "kind": "ambulance", "color": "var(--color-magenta)", "legs": a["legs"], "home": a["home"]})

        tr.t_end = round(max([horizon] + [a["free"] for a in amb]), 3)
        responses = sorted(stats["responses"])
        n = len(responses)
        p90 = responses[min(n - 1, int(0.9 * n))] if n else 0.0
        within = sum(1 for r in responses if r <= threshold)
        tr.kpis = {
            "calls": len(calls),
            "mean_response": round(sum(responses) / n, 2) if n else 0.0,
            "p90_response": round(p90, 2),
            "coverage_pct": round(100 * within / n, 1) if n else 0.0,
            # offered load ρ = total service time / fleet capacity; >100% means demand outstrips the fleet.
            "load_pct": round(100 * stats["busy_time"] / (na * horizon), 1) if horizon else 0.0,
            "n_ambulances": na,
        }
        return tr

    @staticmethod
    def _simulate(net: GridNetwork, router: RoadRouter, amb: list[dict], calls: list[tuple[float, int]],
                  hospital: int, speed: float, on_scene: float, tr: RouteTrace) -> dict:
        """SimPy discrete-event replay of the call stream + nearest-available dispatch.

        A single ``arrivals`` process advances simulated time to each call's event instant (drawn up front),
        then dispatches synchronously: it scores every unit by its earliest feasible scene arrival —
        ``max(call_time, unit.free) + travel_time / speed`` over the NetworkX road graph — and commits the
        best one. The chosen unit drives base→scene (NetworkX path), treats on-scene, transports to the
        hospital, returns to base, and its busy-until clock advances. Dispatch consumes zero simulated time
        and arrivals fire in time order, so the DES reproduces the original greedy sweep exactly; results are
        a pure function of (params, seed).
        """
        import simpy

        env = simpy.Environment()
        stats = {"responses": [], "served": 0, "busy_time": 0.0}

        def arrivals():
            prev = 0.0
            for tc, cn in calls:
                yield env.timeout(tc - prev)  # advance simulated time to the call's event instant
                prev = tc
                # Dispatch at the recorded call instant `tc` (the up-front draw), not the accumulated
                # float `env.now`, so the trip times are byte-identical to the committed trace; the SimPy
                # clock still drives event ordering, which is all the DES needs to reproduce the sweep.
                AmbulanceScenario._dispatch(net, router, amb, tc, cn, hospital, speed, on_scene, tr, stats)

        env.process(arrivals())
        env.run()
        return stats

    @staticmethod
    def _dispatch(net: GridNetwork, router: RoadRouter, amb: list[dict], tc: float, cn: int,
                  hospital: int, speed: float, on_scene: float, tr: RouteTrace, stats: dict) -> None:
        """Commit the nearest-available ambulance to one call and append its trip to the trace."""
        # nearest-available: earliest possible arrival across the fleet (honours each unit's busy clock)
        best_i, best_arr, best_ready = -1, math.inf, 0.0
        for i, a in enumerate(amb):
            ready = max(tc, a["free"])
            arr = ready + router.length(a["node"], cn) / speed
            if arr < best_arr:
                best_arr, best_i, best_ready = arr, i, ready
        a = amb[best_i]
        to_scene = router.path(a["node"], cn)
        scene_legs, t_scene = timed_legs(net, to_scene, best_ready, speed)
        t_treat_end = t_scene + on_scene
        to_hosp = router.path(cn, hospital)
        hosp_legs, t_hosp = timed_legs(net, to_hosp, t_treat_end, speed)
        to_base = router.path(hospital, a["home"])
        base_legs, t_back = timed_legs(net, to_base, t_hosp, speed)
        a["legs"].extend(scene_legs + hosp_legs + base_legs)
        a["node"] = a["home"]
        a["free"] = t_back
        stats["busy_time"] += t_back - best_ready
        stats["responses"].append(t_scene - tc)
        stats["served"] += 1
        cx, cy = net.coords[cn]
        tr.markers.append({"x": round(cx, 3), "y": round(cy, 3), "t0": tc, "t1": round(t_scene, 3), "kind": "incident"})
