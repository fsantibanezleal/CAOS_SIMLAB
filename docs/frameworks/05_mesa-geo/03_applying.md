# Mesa-Geo — 03 · Applying it

← Prev: [`02_usage.md`](02_usage.md) ·
Wiki node: [`../05_mesa-geo.md`](../05_mesa-geo.md) ·
First: [`01_installation.md`](01_installation.md)

## How to formalize the problem

Reach for Mesa-Geo when your problem has this shape:

1. **The state of each actor includes a real-world location** — a coordinate, a
   road segment, a parcel — not an abstract grid cell or a node index.
2. **The answer depends on geography** — Euclidean/road distance, proximity,
   intersection with a region, or terrain slope changes what happens.
3. **You want to *show emergence on a map*** for thousands (not millions) of
   agents, with clean, didactic ABM abstractions intact.

Formally, you model: a set of agents `A`, each with a Shapely geometry
`g_a ∈ CRS` and local state; a `GeoSpace` `S` that indexes those geometries; and
a per-tick update rule `step(a)` that reads spatial relations on `S`
(`distance`, `within_distance`, `intersects`) and rewrites `g_a` and state. The
*model output* is the per-tick `GeoDataFrame` of all `g_a` — the trajectory you
serialize and replay. If geography is **not** part of the answer, this is the
wrong tool — use plain [Mesa](../04_mesa.md) on a grid/network instead.

## How to solve it with Mesa-Geo

1. **Load geometries** with `AgentCreator` / `GeoAgent.from_dataframe` from a
   `GeoDataFrame` (OSMnx road graph, a GeoJSON of stations/incidents, or a
   DEM-derived layer). For the smoke-test you hand-build `Point`s — see
   [`example.py`](example.py).
2. **Attach a `GeoSpace`** with a single CRS (`epsg:3857` for metres) and
   register the agents (`space.add_agents(...)`).
3. **Write `step()` against spatial queries** — `space.distance`,
   `get_neighbors_within_distance`, `get_intersecting_agents` — and move agents
   by reassigning `self.geometry`.
4. **Advance deterministically** with `self.agents.shuffle_do("step")` under a
   fixed `rng` seed.
5. **Export each tick** via `space.get_agents_as_GeoDataFrame()` →
   GeoJSON/Arrow, commit the artifact, and let the static SPA replay it.

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

**No shipped scenario uses Mesa-Geo today.** This is the same honest pattern as OSMnx: Mesa-Geo is the
*documented engine* for a **future geospatial variant**, not a layer behind any current scenario. The shipped
routing/dispatch scenarios deliberately stay on abstract graphs:

- **S07** (construction haul routing) runs a native OR-Tools CP-SAT route plan committed offline, replayed by
  a pure-Python SimPy DES — over an in-repo road graph, **not** Mesa-Geo GeoAgents.
- **S09** (ambulance dispatch & coverage) runs SimPy + NetworkX (closed-form nearest-available dispatch over
  an in-repo `GridNetwork`), with **no** Mesa-Geo and **no** OR-Tools.

If a **geospatial variant** of one of these were added later, Mesa-Geo *would supply* the agent-on-a-real-map
layer — trucks or ambulances as `GeoAgent`s with Shapely geometries on a CRS-aware `GeoSpace`, moving over an
OSMnx road graph — while OR-Tools / SimPy / NetworkX kept their current roles (the routing/siting decision and
the discrete-event cycle timing). That variant *would be* the natural place Mesa-Geo earns its keep; until one
ships, this guide documents the engine, not a live use.

## The pattern a future geo variant would follow

*No scenario ships this pipeline today.* If a geospatial ABM variant were added,
it would follow a three-stage pipeline run **offline** in the local precompute
lane (see
[`../../guides/01_precompute-pipeline.md`](../../guides/01_precompute-pipeline.md)):

1. **Optimize** — OR-Tools *would* decide the plan (vehicle routes; dispatch +
   coverage). The CP-SAT/routing solve is native-code and solver-bound, so it can
   never run in the browser; it is precompute-only.
2. **Simulate** — SimPy *would* time the discrete-event cycle (loading, hauling,
   dumping; or call → dispatch → on-scene → transport), and Mesa-Geo *would*
   place the agents on the real map at each tick, computing positions/distances
   against the road graph and terrain.
3. **Replay** — each tick's state *would* be exported (e.g. via
   `GeoSpace.get_agents_as_GeoDataFrame()` → GeoJSON/Arrow), committed as a
   compact artifact, and the static SPA *would* **replay** it on a deck.gl /
   MapLibre map, labelled "precomputed due to cost; full details in the repo."

That mirrors CAOS_SEISMIC and CAOS_LDA_HSI: local compute → committed artifact →
static viewer. No simulation process runs on the live (Pages) deploy (the architecture
rule; see [`../../architecture.md`](../../architecture.md)).

**Real maps, same code as the minimal example.** The only thing that would change
from [`example.py`](example.py) is the *source* of the geometries: instead of
hand-built `Point`s you load a `GeoDataFrame` (from OSMnx road geometry, GeoJSON,
or a DEM-derived layer) and bulk-build agents with `AgentCreator` /
`GeoAgent.from_dataframe`. The `GeoSpace` queries (`distance`,
`get_neighbors_within_distance`, `get_intersecting_agents`) are identical.

**3D terrain only where it would earn its place.** Per the research, terrain
rendering is a value-add (not a gimmick) **only** for a genuinely geospatial
variant where elevation changes the answer — e.g. haul gradients on a future geo
S07. Mesa-Geo's `RasterLayer` *would* hold an SRTM/Copernicus DEM so travel cost
reflects slope, and the SPA *would* render it with deck.gl `TerrainLayer`.

## Honest trade-offs (grounded in the research)

- **Strength — real maps with clean abstractions.** Mesa-Geo gives "medium-high"
  didactic value precisely because it puts standard ABM concepts on real
  geography (Apache-2.0, actively maintained alongside Mesa 3). For a future geo
  routing/dispatch variant that would be the differentiator (none ships today).
- **Weakness — object-per-agent ceiling.** It carries Mesa's scaling limit
  (~1e5 agents). For the one "wow-scale" large-ABM scenario the research routes
  work to FLAME GPU 2 (CUDA) / ABMax (JAX) / AMBER (Polars) instead — *not*
  Mesa-Geo (see [`../18_gpu-abm-chapter.md`](../18_gpu-abm-chapter.md)).
- **Weakness — not a web-serving engine.** Like plain Mesa, its only first-class
  viz is a stateful Solara/Leaflet server on localhost. Running that as a public
  live server is the **primary architectural risk** the research calls out;
  it does not scale, and GitHub Pages only serves static files (zero server compute). We serve replays, never a live Solara
  process.
- **Constraint — native GIS stack, no Pyodide.** rasterio/GDAL/pyproj are native
  and not WASM-compiled, so Mesa-Geo cannot run in-browser. It is firmly a
  precompute-lane tool (contrast the live lane,
  [`../../guides/02_live-lane-pyodide.md`](../../guides/02_live-lane-pyodide.md)).
- **Data licensing.** The real-map inputs carry obligations: OSM road graphs are
  **ODbL** (attribution + share-alike on derived data); NYC TLC / EMS open data
  need recorded attribution + terms; SRTM/Copernicus DEM is open. Commit only
  **derived/rendered geometry** artifacts, never raw dumps, and record each
  source's license/attribution in [`../../../ATTRIBUTION.md`](../../../ATTRIBUTION.md).

## When to pick Mesa-Geo vs. alternatives

| If you need… | Pick | Why |
|---|---|---|
| ABM on a **real map**, ~1e3–1e5 agents, didactic clarity | **Mesa-Geo** | Geospatial GeoAgent/GeoSpace on the canonical Python teaching engine |
| ABM on an **abstract grid/network** (Schelling, SIR, Beer Game) | **[plain Mesa](../04_mesa.md)** | No geography needed; grid space is simpler and lighter (S02/S03/S05) |
| A pure **DES** model (queues, resource cycles) | **[SimPy](../01_simpy.md)** | Event/resource DES, not agent geography (and it supplies the cycle timing for S07/S09) |
| The **routing/siting decision** itself | **[OR-Tools](../08_ortools.md)** | CP-SAT / routing solver; Mesa-Geo only *shows* the result on the map |
| **Million-agent** scale / GPU "wow" runs | **[FLAME GPU 2 / ABMax / AMBER](../18_gpu-abm-chapter.md)** | Mesa-Geo's object-per-agent model can't reach that scale |
| In-browser, zero-server live ABM | **[NetLogo Web](../07_netlogo-web.md)** | Client-side JS; Mesa-Geo's native GIS deps can't go to WASM |
| The **road graph** behind the map | **[OSMnx](../11_osmnx.md)** / **[NetworkX](../10_networkx.md)** | Build/route the graph; Mesa-Geo consumes it as agent geometry |

## Deprecated — do not use

- **AgentPy** — deprecated upstream; its own authors now point users to Mesa. Use
  Mesa / Mesa-Geo, never AgentPy.
- **desmod** — deprecated; not used in this lab.

Both are mentioned here only so the choice is explicit: this lab uses **real,
maintained tools** (Mesa, Mesa-Geo, SimPy, OR-Tools, …), not deprecated ones.
