# 05 · Mesa-Geo — geospatial agent-based modeling

**Mesa-Geo** is the geospatial extension of [Mesa](./04_mesa.md): it adds `GeoAgent`
(an agent whose position *is* a Shapely geometry on a coordinate reference
system) and `GeoSpace` (a CRS-aware container with an R-tree spatial index) on
top of Mesa's standard `Agent`/`Model`/`AgentSet` ABM core. Everything else
about Mesa is unchanged — you still seed the RNG, step with
`self.agents.shuffle_do("step")`, and collect results — so the *concept* of an
agent-based model stays didactic; only the space becomes geographic. Use it when
each actor has a **real-world location** and the answer depends on geography
(distance, road geometry, proximity, terrain slope), and you want to show
emergence on a **real map** for thousands-to-~1e5 agents rather than on an
abstract grid. It is **not** a throughput engine — past ~1e5 agents its
object-per-agent model bogs down, and its native GIS stack (rasterio/GDAL/pyproj)
cannot compile to WASM, so it is firmly a precompute-lane tool, never a
browser/live engine.

In CAOS_SIMLAB the lab uses Mesa-Geo as the **geospatial-ABM presentation/agent
layer** of the map-based routing scenarios: it places trucks and ambulances on
the real road network at each tick, computing positions and distances, while
OR-Tools makes the routing/siting decision and SimPy times the discrete-event
cycle. Each tick's state is exported as a `GeoDataFrame` → GeoJSON/Arrow,
committed as a compact artifact, and the static SPA replays it on a deck.gl /
MapLibre map (optimize → simulate → replay, all offline; nothing runs on the
live (Pages) deploy). This mirrors the deterministic-replay design used across the
CAOS labs.

## Read in order

1. [01 · Installation](./05_mesa-geo/01_installation.md) — pinned version
   (`mesa-geo==0.9.3`, `mesa==3.5.1`), the precompute requirements lane, the full
   GIS dependency stack, platform/CRS notes, and why there is no GPU/CUDA path.
2. [02 · Usage](./05_mesa-geo/02_usage.md) — the GeoAgent/GeoSpace mental model,
   the real API surface, the minimal example walked through step by step, and its
   **verified captured output**.
3. [03 · Applying it](./05_mesa-geo/03_applying.md) — how to formalize and solve a
   geospatial-ABM problem, which lab scenarios use it, the honest research
   trade-offs, and when to pick it vs. alternatives.

- Runnable example: [`./05_mesa-geo/example.py`](./05_mesa-geo/example.py)
  — run from the repo root with
  `.venv/Scripts/python.exe docs/frameworks/05_mesa-geo/example.py`.

## Scenarios that use it

- **S07 — Construction Haul Routing** (geo variant): trucks as `GeoAgent`s on a
  real road/terrain map rendering the load-haul-dump cycle.
- **S09 — Ambulance Dispatch** (geo variant): ambulances and incidents as
  `GeoAgent`s on the city map, visualizing response-time vs. station-siting
  trade-offs spatially.

See the full [scenario → tool map](./../README.md) for context.

## Related nodes

- Problem-type primer: [Agent-Based Modeling](./../problem-types/02_agent-based-modeling.md)
- The base engine: [Mesa](./04_mesa.md) · the road graph:
  [OSMnx](./11_osmnx.md) / [NetworkX](./10_networkx.md) · the decision:
  [OR-Tools](./08_ortools.md) · the cycle timing: [SimPy](./01_simpy.md)
- Million-agent / GPU alternative (reference, not shipped):
  [FLAME GPU 2 / ABMax / AMBER](./18_gpu-abm-chapter.md)
- Pipeline: [Precompute pipeline](./../guides/01_precompute-pipeline.md) ·
  [Architecture](./../architecture.md)
