# Mesa-Geo — Applying it

## What problem it solves

Mesa-Geo is for **agent-based models where geography is part of the state**:
agents have real coordinates, the environment is a map, and the answer depends
on distances, road geometry, or terrain. It keeps Mesa's didactic
`Agent`/`Model`/space abstractions — so the *concept* of an agent-based model is
unchanged — and only swaps grid coordinates for Shapely geometries on a CRS-aware
`GeoSpace`. That is exactly the right tool when you want to show emergence on a
**real map** rather than an abstract grid.

It is **not** a throughput engine. Mesa-Geo inherits Mesa's object-per-agent
ceiling (it bogs down past ~1e5 agents), so it is the *clear* geospatial ABM
engine for thousands of agents, not the million-agent one.

## Where it fits in CAOS_SIMLAB

| Scenario | Method | Mesa-Geo's role |
|---|---|---|
| **S07** — haul / earthmoving routing (geo variant) | OR-Tools + SimPy + OSMnx/NetworkX | Geospatial ABM layer: trucks as `GeoAgent`s moving over a real road/terrain map; renders the load-haul-dump cycle in true coordinates |
| **S10** — ambulance dispatch & coverage (geo variant) | OR-Tools + SimPy + graph | Geospatial ABM layer: ambulances and incidents as `GeoAgent`s on the city map; visualizes response-time vs. station-siting trade-offs spatially |

In both, Mesa-Geo is the **geospatial-ABM presentation/agent layer**, not the
optimizer or the queueing core. The scenario→tool map for these scenarios pairs
it with OR-Tools (the routing/siting decision) and SimPy (the discrete-event
cycle timing); OSMnx/NetworkX supply the road graph. Mesa-Geo is what makes the
agents live on the actual map.

## The pattern: optimize-then-simulate-then-replay

The geo routing scenarios follow a three-stage pipeline, all run **offline** in
the local precompute lane:

1. **Optimize** — OR-Tools decides the plan (vehicle routes for S07; dispatch +
   coverage for S10). This is native-code and solver-bound, so it can never run
   in the browser; it is precompute-only.
2. **Simulate** — SimPy times the discrete-event cycle (loading, hauling,
   dumping; or call → dispatch → on-scene → transport), and Mesa-Geo places the
   agents on the real map at each tick, computing positions/distances against the
   road graph and terrain.
3. **Replay** — each tick's state is exported (e.g. via
   `GeoSpace.get_agents_as_GeoDataFrame()` → GeoJSON/Arrow), committed as a
   compact artifact, and the static SPA **replays** it on a deck.gl / MapLibre
   map, labelled "precomputed due to cost; full details in the repo."

This mirrors CAOS_SEISMIC and CAOS_LDA_HSI exactly: local compute → committed
artifact → static viewer. No simulation process runs on the production VPS.

**Real maps, same code as the minimal example.** The only thing that changes
from `example.py` is the *source* of the geometries: instead of hand-built
`Point`s you load a `GeoDataFrame` (from OSMnx road geometry, GeoJSON, or a
DEM-derived layer) and bulk-build agents with `AgentCreator` /
`GeoAgent.from_dataframe`. The `GeoSpace` queries (`distance`,
`get_neighbors_within_distance`, `get_intersecting_agents`) are identical.

**3D terrain only where it earns its place.** Per the research, terrain
rendering is a value-add (not a gimmick) **only** for genuinely geospatial
scenarios where elevation changes the answer — S07 haul gradients (and
optionally S10). Mesa-Geo's `RasterLayer` can hold an SRTM/Copernicus DEM so
travel cost reflects slope; the SPA renders it with deck.gl `TerrainLayer`.

## Honest trade-offs (grounded in the research)

- **Strength — real maps with clean abstractions.** Mesa-Geo gives "medium-high"
  didactic value precisely because it puts standard ABM concepts on real
  geography (Apache-2.0, actively maintained alongside Mesa 3). For the geo
  routing scenarios that is the differentiator.
- **Weakness — object-per-agent ceiling.** It carries Mesa's scaling limit
  (~1e5 agents). For the one "wow-scale" large-ABM scenario the research routes
  work to FLAME GPU 2 (CUDA) / ABMax (JAX) / AMBER (Polars) instead — *not*
  Mesa-Geo.
- **Weakness — not a web-serving engine.** Like plain Mesa, its only first-class
  viz is a stateful Solara/Leaflet server on localhost. Running that behind nginx
  for public users is the **primary architectural risk** the research calls out;
  it does not scale on the shared VPS. We serve replays, never a live Solara
  process.
- **Constraint — native GIS stack, no Pyodide.** rasterio/GDAL/pyproj are native
  and not WASM-compiled, so Mesa-Geo cannot run in-browser. It is firmly a
  precompute-lane tool.
- **Data licensing.** The real-map inputs carry obligations: OSM road graphs are
  **ODbL** (attribution + share-alike on derived data); NYC TLC / EMS open data
  need recorded attribution + terms; SRTM/Copernicus DEM is open. Commit only
  **derived/rendered geometry** artifacts, never raw dumps, and record each
  source's license/attribution.

## When to pick Mesa-Geo vs. alternatives

| If you need… | Pick | Why |
|---|---|---|
| ABM on a **real map**, ~1e3–1e5 agents, didactic clarity | **Mesa-Geo** | Geospatial GeoAgent/GeoSpace on the canonical Python teaching engine |
| ABM on an **abstract grid/network** (Schelling, SIR, Wolf-Sheep) | **plain Mesa** | No geography needed; grid space is simpler and lighter (S02/S03/S05) |
| A pure **DES** model (queues, resource cycles) | **SimPy** | Event/resource DES, not agent geography (and it supplies the cycle timing for S07/S10) |
| The **routing/siting decision** itself | **OR-Tools** | CP-SAT / routing solver; Mesa-Geo only *shows* the result on the map |
| **Million-agent** scale / GPU "wow" runs | **FLAME GPU 2 / ABMax / AMBER** | Mesa-Geo's object-per-agent model can't reach that scale |
| In-browser, zero-server live ABM | **NetLogo Web** | Client-side JS; Mesa-Geo's native GIS deps can't go to WASM |

## Deprecated — do not use

- **AgentPy** — deprecated upstream; its own authors now point users to Mesa. Use
  Mesa / Mesa-Geo, never AgentPy.
- **desmod** — deprecated; not used in this lab.

Both are mentioned here only so the choice is explicit: this lab uses **real,
maintained tools** (Mesa, Mesa-Geo, SimPy, OR-Tools, …), not deprecated ones.
