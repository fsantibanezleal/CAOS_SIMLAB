"""OSMnx (2.1.0) — minimal, deterministic, offline example for CAOS_SIMLAB.

WHAT THIS SHOWS
---------------
OSMnx's job in this lab is the *road layer* for the geospatial routing scenarios
(S07 construction haul, S09 ambulance dispatch): download a real street network from
OpenStreetMap as a NetworkX graph, then run shortest-path / k-shortest-path queries on
it and turn the result into drawable geometry.

WHY THIS SCRIPT BUILDS THE GRAPH BY HAND
----------------------------------------
This is a PUBLIC repo and a NETWORK-FREE, deterministic example:

  1. We never download a large area, and we NEVER commit raw OpenStreetMap data
     (`.graphml` / `.osm` / `.pbf`). A pruned OSM graph is an ODbL *Derivative Database*;
     committing it would put a share-alike obligation on the whole repo. See ATTRIBUTION.md.
  2. CI / a reviewer must be able to run this with no internet and get the SAME bytes.

So instead of calling OpenStreetMap, we build a tiny 3x3 lattice of junctions by hand as a
`networkx.MultiDiGraph` carrying exactly the attributes OSMnx expects (node `x`/`y`,
edge `length`, a graph-level `crs`). Every OSMnx *consumer* utility then runs on it
unchanged: `add_edge_speeds`, `add_edge_travel_times`, `routing.shortest_path`,
`routing.k_shortest_paths`, `routing.route_to_gdf`, `distance.nearest_nodes`,
`distance.great_circle`.

The commented `live_osmnx_example()` below is the REAL OSMnx download call you would use in
the local precompute pipeline (smallest possible radius). It is intentionally not executed.

Run from the repo root:
    .venv/Scripts/python.exe docs/frameworks/11_osmnx/example.py
"""
from __future__ import annotations

import itertools

import networkx as nx
import osmnx as ox

# A fixed coordinate anchor (Antofagasta, Chile) and grid step. No randomness anywhere ->
# the output is byte-for-byte deterministic. These are just numbers; no map data is fetched.
LON0, LAT0 = -70.400, -23.650
SPACING = 0.004  # degrees; ~ a few hundred metres in lon/lat at this latitude
ROWS = COLS = 3


def build_hand_graph() -> tuple[nx.MultiDiGraph, dict[int, tuple[float, float]]]:
    """Build a tiny grid road graph in the exact shape OSMnx produces.

    OSMnx graphs are `networkx.MultiDiGraph`s with:
      * a graph attribute  `crs`            (here WGS84 lon/lat, EPSG:4326)
      * node attributes    `x` (lon), `y` (lat)
      * edge attributes    `length` (metres)  and usually `highway`
    Reproducing that contract lets every OSMnx utility treat our hand graph as a real one.
    """
    G = nx.MultiDiGraph(crs="EPSG:4326")
    coords: dict[int, tuple[float, float]] = {}
    for r in range(ROWS):
        for c in range(COLS):
            nid = r * COLS + c
            lon, lat = LON0 + c * SPACING, LAT0 + r * SPACING
            coords[nid] = (lon, lat)
            G.add_node(nid, x=lon, y=lat)

    def add_road(a: int, b: int) -> None:
        # `great_circle` is OSMnx's own geodesic helper; we use it to set real metric lengths.
        length_m = ox.distance.great_circle(coords[a][1], coords[a][0],
                                            coords[b][1], coords[b][0])
        for u, v in ((a, b), (b, a)):  # OSM streets are usually 2-way -> both directions
            G.add_edge(u, v, length=length_m, highway="residential")

    for r in range(ROWS):
        for c in range(COLS):
            nid = r * COLS + c
            if c + 1 < COLS:
                add_road(nid, nid + 1)      # east neighbour
            if r + 1 < ROWS:
                add_road(nid, nid + COLS)   # north neighbour
    return G, coords


def live_osmnx_example() -> None:  # pragma: no cover - NOT executed; reference only
    """How OSMnx WOULD be used in the local precompute pipeline. Intentionally not run.

    Uses the smallest sensible radius (~150 m), keeps the raw graph in memory, and commits
    ONLY rendered geometry (route line as JSON) — never the raw graph. ODbL credit required.
    """
    # G = ox.graph_from_point((-23.650, -70.400), dist=150, network_type="drive")
    # G = ox.add_edge_speeds(G, fallback=30)          # km/h where OSM lacks maxspeed
    # G = ox.add_edge_travel_times(G)                 # edge "travel_time" in seconds
    # orig = ox.distance.nearest_nodes(G, X=-70.4005, Y=-23.6505)
    # dest = ox.distance.nearest_nodes(G, X=-70.3995, Y=-23.6495)
    # route = ox.routing.shortest_path(G, orig, dest, weight="travel_time")
    # gdf = ox.routing.route_to_gdf(G, route, weight="travel_time")  # <- commit THIS (geometry)
    # NOTE: do NOT ox.save_graphml(G); raw OSM is ODbL share-alike. Credit in any UI:
    #   "Map data (c) OpenStreetMap contributors, ODbL."
    raise NotImplementedError("Reference only — see ATTRIBUTION.md before enabling.")


def main() -> None:
    G, coords = build_hand_graph()
    print(f"hand-built road graph: {G.number_of_nodes()} nodes, "
          f"{G.number_of_edges()} directed edges, crs={G.graph['crs']}")

    # 1) Enrich edges the OSMnx way: imputed speeds -> travel times (seconds).
    G = ox.add_edge_speeds(G, fallback=30)      # 30 km/h fallback where speed is unknown
    G = ox.add_edge_travel_times(G)

    # 2) Snap an arbitrary lon/lat to the nearest graph node (what real queries need).
    mid_lon = LON0 + 0.5 * (COLS - 1) * SPACING
    mid_lat = LAT0 + 0.5 * (ROWS - 1) * SPACING
    snapped = ox.distance.nearest_nodes(G, X=mid_lon, Y=mid_lat)
    print(f"nearest node to map centre ({mid_lon:.4f}, {mid_lat:.4f}): node {snapped}")

    # 3) Shortest path from the SW corner (node 0) to the NE corner (node 8).
    orig, dest = 0, ROWS * COLS - 1
    by_length = ox.routing.shortest_path(G, orig, dest, weight="length")
    by_time = ox.routing.shortest_path(G, orig, dest, weight="travel_time")
    print(f"shortest path {orig}->{dest} by length      : {by_length}")
    print(f"shortest path {orig}->{dest} by travel_time : {by_time}")

    # 4) k alternative routes (route diversity, useful for showing detours).
    alts = list(itertools.islice(
        ox.routing.k_shortest_paths(G, orig, dest, k=3, weight="length"), 3))
    print(f"k=3 shortest paths {orig}->{dest}: {alts}")

    # 5) Turn the chosen route into drawable geometry (the ONLY thing we'd ever commit).
    gdf = ox.routing.route_to_gdf(G, by_length, weight="length")
    total_m = float(gdf["length"].sum())
    total_s = float(gdf["travel_time"].sum())
    print(f"route geometry: {len(gdf)} segments, "
          f"{total_m:.1f} m, {total_s:.1f} s (at 30 km/h)")

    print("OK - no network used, no raw OSM committed; rendered geometry only.")


if __name__ == "__main__":
    main()
