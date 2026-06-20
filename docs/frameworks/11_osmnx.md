# 11 · OSMnx — real OpenStreetMap street networks as routable graphs

**OSMnx** (Boeing, MIT) downloads, models, analyses and visualises real street networks from
**OpenStreetMap** as [NetworkX](https://networkx.org/) graphs. In CAOS_SIMLAB it is the
**road layer** that sits *underneath* the optimizers and simulators: it turns a city (or a small
neighbourhood) into a `networkx.MultiDiGraph` with metres-per-edge, imputes per-edge speeds and
travel times, computes the **shortest-path cost matrix** the routing solver consumes, and emits
the **drawable route polylines** that get animated on a map. It is pure-Python and CPU-only, with
a native geospatial stack (GEOS/PROJ/GDAL via geopandas/shapely) underneath.

Use OSMnx when you need *real geography* — actual road geometry, one-way streets, speed limits —
rather than an abstract distance matrix, and the instance is small enough to route in pure Python
(roughly ≤ 20–30 stops). For larger geography-real instances you precompute the matrix with a
compiled engine (OSRM) and commit only its output; for zero external data and perfect determinism
the lab today uses a synthetic `GridNetwork` that mimics the OSMnx graph contract, so OSMnx is a
**drop-in upgrade**, not a rewrite. **Honest status:** no scenario ingests live OpenStreetMap yet —
OSMnx is the documented, installed (2.1.0), planned road layer for S07/S09. Because OSM data is
**ODbL** (share-alike + attribution), the lab's hard rule is *commit rendered geometry only, never
raw `.graphml`/`.osm`/`.pbf`*, and credit "© OpenStreetMap contributors" wherever map data appears
— see [`../../ATTRIBUTION.md`](../../ATTRIBUTION.md).

## Read in order

1. [`01_installation.md`](./11_osmnx/01_installation.md) — pinned version (2.1.0), the precompute
   requirements lane, the native geospatial deps it pulls in, platform/CUDA notes, verify snippet.
2. [`02_usage.md`](./11_osmnx/02_usage.md) — the OSMnx 2.x API and graph contract, the worked
   example walked line by line, and its **real captured output**.
3. [`03_applying.md`](./11_osmnx/03_applying.md) — how to *formalize* a routing problem and *solve*
   it with OSMnx, which scenarios use it, the research trade-offs, and OSMnx vs OSRM/VROOM/synthetic.

## Runnable example

- [`example.py`](./11_osmnx/example.py) — minimal, **offline, deterministic**: builds a 3×3 road
  graph by hand in the exact shape OSMnx produces, then drives every OSMnx *consumer* utility
  (enrich → snap → shortest path → k-shortest paths → render geometry). No network call, no raw OSM
  written. Run it from the repo root:

  ```bash
  .venv/Scripts/python.exe docs/frameworks/11_osmnx/example.py
  ```

## Where it is used

- **Problem type:**
  [Optimization & Routing](../problem-types/03_optimization-routing.md) — OR-Tools · PyVRP ·
  NetworkX · **OSMnx**.
- **Scenarios:** **S07 — Construction haul routing** and **S09 — Emergency / ambulance dispatch**
  (road graph + travel-time matrix + route geometry, paired with OR-Tools for the plan and SimPy
  for the stochastic replay). S08 (VRP) uses the same graph/matrix role when a real network is
  wired in.

## Related framework nodes

- **NetworkX** — the graph + shortest-path engine OSMnx wraps.
- **OR-Tools** / **PyVRP** — the optimizers that consume the OSMnx cost matrix.
- **SimPy** — the stochastic replay that stress-tests the optimized plan.

## At a glance

| | |
|---|---|
| Package / version | `osmnx` 2.1.0 (MIT) |
| Lane | precompute (CPU-only; native GEOS/PROJ/GDAL → not browser/WASM) |
| Role in the lab | road layer: cost matrix + drawable route geometry |
| Data licence | OpenStreetMap is **ODbL** — commit rendered geometry only, attribute always |
