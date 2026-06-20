# OSMnx — 02 · Usage

OSMnx turns OpenStreetMap into a **routable NetworkX graph**. This page covers the concepts and
API you actually need for the road layer of the routing scenarios, walks through the lab's
minimal runnable example line by line, and shows its **real captured output**.

For install details and the requirements-file placement, see
[`01_installation.md`](./01_installation.md). For how this plugs into our scenarios and when to
pick it, see [`03_applying.md`](./03_applying.md). The runnable script lives at
[`example.py`](./example.py).

---

## 1. The mental model

OSMnx is best understood as three layers stacked on top of NetworkX:

1. **Acquire** — `ox.graph_from_point / graph_from_place / graph_from_bbox` query the
   OpenStreetMap Overpass API and return a `networkx.MultiDiGraph`.
2. **Enrich** — `ox.add_edge_speeds` and `ox.add_edge_travel_times` impute a speed (km/h) and
   a travel time (seconds) onto every edge, so you can route on *time*, not just *length*.
3. **Route & render** — `ox.routing.shortest_path`, `ox.routing.k_shortest_paths`,
   `ox.distance.nearest_nodes`, and `ox.routing.route_to_gdf` query paths and convert them to
   drawable geometry.

The graph contract is the key thing to internalise, because it is what lets you build or mock a
graph by hand (which the lab's offline example does):

| Where | Attribute | Meaning |
|---|---|---|
| graph | `crs` | coordinate reference system (OSM graphs are WGS84 `EPSG:4326`, lon/lat) |
| node | `x`, `y` | longitude (`x`) and latitude (`y`) |
| edge | `length` | segment length in **metres** |
| edge | `highway` | OSM road class (`residential`, `primary`, …) — drives imputed speed |
| edge (after enrich) | `speed_kph`, `travel_time` | km/h and seconds |

Any `networkx.MultiDiGraph` carrying these attributes is, to OSMnx's *consumer* functions,
indistinguishable from a downloaded one. This is the whole reason the lab's offline example and
the synthetic `GridNetwork` can stand in for a real download with zero code changes downstream.

---

## 2. Key API (OSMnx 2.x)

> **Version note.** OSMnx 2.x reorganised the namespace. The routing helpers now live under
> `ox.routing.*` and distance helpers under `ox.distance.*`. Old 1.x calls like
> `ox.shortest_path` or `ox.get_nearest_node` are gone. These docs target the installed **2.1.0**.

```python
import osmnx as ox

# --- acquire (NETWORK CALL — not used in the offline example) ---
G = ox.graph_from_point((lat, lon), dist=150, network_type="drive")  # tiny radius!
G = ox.graph_from_place("Antofagasta, Chile", network_type="drive")  # whole place

# --- enrich ---
G = ox.add_edge_speeds(G, fallback=30)   # km/h where OSM 'maxspeed' is missing
G = ox.add_edge_travel_times(G)          # edge 'travel_time' in seconds

# --- snap a coordinate to the graph ---
node = ox.distance.nearest_nodes(G, X=lon, Y=lat)   # note: X=lon, Y=lat

# --- route ---
route  = ox.routing.shortest_path(G, orig, dest, weight="travel_time")  # list of node ids
routes = ox.routing.k_shortest_paths(G, orig, dest, k=3, weight="length")  # generator

# --- render (the ONLY thing we ever commit) ---
gdf = ox.routing.route_to_gdf(G, route, weight="length")  # GeoDataFrame of LineStrings

# --- geodesic distance helper (no graph needed) ---
metres = ox.distance.great_circle(lat1, lon1, lat2, lon2)
```

Three gotchas worth stating up front:

- **`nearest_nodes` takes `X=lon, Y=lat`** (not lat,lon). Mixing these up silently snaps to the
  wrong node — and produces no error, just a wrong route.
- **`shortest_path` returns a list of node ids**, not geometry. Use `route_to_gdf` to get the
  drawable LineString(s) — that GeoDataFrame, exported to plain JSON, is the *rendered geometry*
  the public repo is allowed to commit (a raw graph is not — see §5).
- **`k_shortest_paths` returns a generator**, not a list. Wrap it (`itertools.islice` or
  `list(...)`) and it will lazily yield routes in increasing cost; it can be expensive on a big
  graph, so always bound `k`.

---

## 3. The lab's minimal example, walked through

The runnable script is [`example.py`](./example.py). It is deliberately **offline and
deterministic**: it does **not** download anything and produces byte-for-byte identical output on
every machine. Instead of calling OpenStreetMap it builds a tiny 3×3 lattice of junctions by hand
in the exact shape OSMnx produces, then drives every OSMnx *consumer* utility on it. The real OSM
download call is shown in a commented `live_osmnx_example()` block for reference only.

Step by step:

1. **`build_hand_graph()`** creates a `networkx.MultiDiGraph(crs="EPSG:4326")` and adds 9 nodes
   on a grid, each with `x` (lon) and `y` (lat). For each adjacency it adds a **two-way** road
   pair (OSM streets are usually bidirectional → both `(a,b)` and `(b,a)`), setting `length` from
   **`ox.distance.great_circle`** — OSMnx's own geodesic helper — so the metric lengths are real.
   The anchor is a fixed coordinate (Antofagasta, Chile) with a `0.004°` grid step; **no
   randomness anywhere**, so the output is reproducible.

2. **Enrich.** `ox.add_edge_speeds(G, fallback=30)` imputes 30 km/h on every edge (none carry an
   OSM `maxspeed`), and `ox.add_edge_travel_times(G)` derives `travel_time` in seconds.

3. **Snap.** `ox.distance.nearest_nodes(G, X=..., Y=...)` snaps the map centre coordinate to the
   nearest junction — node 4, the centre of the grid, as expected. (Note `X=lon, Y=lat`.)

4. **Route.** `ox.routing.shortest_path` is run from node 0 (SW corner) to node 8 (NE corner),
   once weighting by `length` and once by `travel_time`. Because all edges share the same imputed
   speed, both weightings pick the same path here — a deliberately clean teaching case that shows
   the API surface without the answer changing.

5. **Alternatives.** `ox.routing.k_shortest_paths(..., k=3)` yields three increasingly-long
   routes — the basis for showing route diversity / detours in a viewer.

6. **Render.** `ox.routing.route_to_gdf` converts the chosen node path into a GeoDataFrame of
   road segments; summing `length` and `travel_time` gives the route's total distance and time.
   This GeoDataFrame (as JSON) is the *only* artifact a public scenario commits.

The script prints `OK` once it has demonstrated the full acquire-shape → enrich → route → render
pipeline without a single network call or raw-graph write.

---

## 4. Verified output

Run from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/11_osmnx/example.py
```

Real captured stdout (OSMnx 2.1.0, NetworkX 3.6.1):

```text
hand-built road graph: 9 nodes, 24 directed edges, crs=EPSG:4326
nearest node to map centre (-70.3960, -23.6460): node 4
shortest path 0->8 by length      : [0, 1, 2, 5, 8]
shortest path 0->8 by travel_time : [0, 1, 2, 5, 8]
k=3 shortest paths 0->8: [[0, 1, 2, 5, 8], [0, 1, 4, 5, 8], [0, 1, 4, 7, 8]]
route geometry: 4 segments, 1704.4 m, 204.5 s (at 30 km/h)
OK - no network used, no raw OSM committed; rendered geometry only.
```

Reading it: 9 junctions, 24 directed edges (12 two-way roads); the map centre snaps to node 4;
the SW→NE shortest path is `0→1→2→5→8` (an L along the south then east edge — equivalent in cost
to the staircase, the solver picks one); the three alternatives differ only in where they turn
north; and the rendered route is 4 segments totalling **1704.4 m / 204.5 s** at the imputed
30 km/h. No `graph_from_*` call ran, so no Overpass query and no raw OSM data touched disk.

---

## 5. Public-repo rules you must follow (ODbL + rendered-geometry-only)

OpenStreetMap data is licensed **ODbL** (Open Database License) — *share-alike + attribution*.
Two non-negotiable consequences for this repo:

1. **Commit rendered geometry only, never raw OSM.** A pruned OSM road graph is a *Derivative
   Database*; committing `.graphml` / `.osm` / `.pbf` would impose ODbL share-alike on the whole
   work. Commit only the **Produced Work** — route/line geometry as plain JSON (what
   `route_to_gdf` gives you, serialised). Do **not** call `ox.save_graphml`. CI blocks raw graph
   files. See [`ATTRIBUTION.md`](../../../ATTRIBUTION.md).
2. **Attribute wherever map data appears.** Any UI showing OSM-derived geometry must display:
   > Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).

Plus the lab-wide network hygiene: **never download a large area**. Use the smallest radius that
demonstrates the point (the reference block uses `dist=150` m), do it once in the local precompute
pipeline, and commit only the compact rendered result.

---

## 6. Deprecated — do not use

`AgentPy` and `desmod` appear in older simulation/routing tutorials. They are **deprecated and
excluded** from this lab — ignore any recommendation to use them. For the road layer use
**OSMnx + NetworkX**; for DES use **SimPy / Ciw**; for ABM use **Mesa**.

---

**Next:** [`03_applying.md`](./03_applying.md) — formalising the problem, the scenarios that use
this, the trade-offs, and the pick-vs-alternatives ladder.
