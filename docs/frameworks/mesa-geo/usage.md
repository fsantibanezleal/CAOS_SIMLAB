# Mesa-Geo — Usage

This is a hands-on walkthrough of the Mesa-Geo geospatial-ABM core, ending with
the **real captured output** of `example.py` in this folder. The example builds
its geometries by hand (no network or tile download), so it runs anywhere the
`.venv` is present.

## Mental model: GeoAgent + GeoSpace on top of Mesa

Mesa-Geo does not replace Mesa — it specializes two pieces of it:

| Plain Mesa | Mesa-Geo equivalent | What changes |
|---|---|---|
| `mesa.Agent` | `mesa_geo.GeoAgent` | The agent carries a Shapely `geometry` and a `crs`; "position" is a geometry, not grid coordinates |
| grid / network space | `mesa_geo.GeoSpace` | A CRS-aware container with an R-tree index for fast spatial queries (neighbours, intersections, distance) |
| `mesa.Model` | `mesa.Model` (unchanged) | You still subclass `mesa.Model`; you just attach a `GeoSpace` to it |

Everything else is standard Mesa 3: you seed the model RNG, you advance it with
the `AgentSet` API (`self.agents.shuffle_do("step")`), and you collect results.

### Key API surface (Mesa-Geo 0.9.3)

- **`GeoAgent(model, geometry, crs)`** — construct an agent. `geometry` is any
  Shapely object (`Point`, `LineString`, `Polygon`); `crs` is its coordinate
  reference system. Move the agent by reassigning `self.geometry`.
- **`GeoSpace(crs="epsg:3857", *, warn_crs_conversion=True)`** — the spatial
  container. Default CRS is Web-Mercator (metres).
  - `space.add_agents(agents)` — register one agent or a list.
  - `space.agents` — the registered agents.
  - `space.distance(a, b)` — distance between two agents (in CRS units).
  - `space.get_neighbors_within_distance(agent, distance, center=False)` —
    generator of agents whose geometry is within `distance` of `agent`'s
    geometry. **Includes the agent itself** (its own geometry intersects the
    buffer). Pass `center=True` to measure from the agent's centroid.
  - `space.get_intersecting_agents(agent)` — agents whose geometry intersects.
  - `space.get_agents_as_GeoDataFrame()` — export live state as a GeoPandas
    `GeoDataFrame` (this is the artifact shape you serialize for replay).
- **`AgentCreator`** — a helper (not used in the minimal example) for bulk-
  building GeoAgents from a `GeoDataFrame` or GeoJSON; this is how real maps get
  loaded in the full scenarios.

## The minimal example, step by step

Source: [`example.py`](./example.py). It models two `Truck` GeoAgents that each
take one seeded random step, then reports positions and spatial queries.

1. **Pick a CRS and a seed.** `CRS = "epsg:3857"` (metres) and `SEED = 42`. The
   seed makes the run deterministic.

2. **Define the agent.** `Truck(mg.GeoAgent)` overrides `step()`. Each tick it
   draws `dx, dy` from `self.random.uniform(...)` (Mesa's seeded RNG) and moves
   by replacing `self.geometry` with a new `Point`. Reassigning the geometry is
   the canonical way to move a point GeoAgent.

3. **Build the model.** `FleetModel(mesa.Model)` calls `super().__init__(rng=seed)`
   (Mesa 3.5 prefers `rng=` over the deprecated `seed=`), creates a
   `GeoSpace(crs=CRS, warn_crs_conversion=False)`, hand-builds two start
   `Point`s ~150 m apart, wraps them in `Truck`s, and registers them with
   `space.add_agents(...)`.

4. **Step the model.** `FleetModel.step()` calls `self.agents.shuffle_do("step")`
   — the Mesa 3 `AgentSet` API that shuffles agents with the model RNG and calls
   each one's `step()`. Determinism is preserved because the shuffle uses the
   seeded RNG.

5. **Query the space.** Before and after the step the example calls
   `space.distance(a0, a1)`, then `space.get_neighbors_within_distance(a0, 200)`,
   then exports `space.get_agents_as_GeoDataFrame()` to show the serializable
   artifact shape.

## Run it

From the repository root:

```bash
.venv/Scripts/python.exe docs/frameworks/mesa-geo/example.py
```

## Verified output

The following is the **actual stdout** captured by running the command above
against the project `.venv` (`mesa-geo==0.9.3`, `mesa==3.5.1`). The run is
deterministic — repeating it reproduces these numbers exactly.

```text
Mesa 3.5.1 | Mesa-Geo 0.9.3 | CRS epsg:3857
Agents in GeoSpace: 2

Initial positions (metres, EPSG:3857):
  agent 1: (    0.00,     0.00)
  agent 2: (  120.00,    90.00)

Distance agent 1 <-> agent 2: 150.00 m

Positions after 1 step:
  agent 1: (  -27.68,    23.65)
  agent 2: (   72.50,    67.50)

Distance after step: 109.36 m
Within 200 m of agent 1 (incl. self): [1, 2]

GeoDataFrame rows=2, columns=['unique_id', 'geometry'], crs=epsg:3857
```

### Reading the output

- **`Agents in GeoSpace: 2`** — the two trucks registered via `add_agents`.
- **Initial positions** — the hand-built `Point(0,0)` and `Point(120,90)`; their
  Euclidean separation is exactly `sqrt(120² + 90²) = 150.00 m`, confirming
  `space.distance` works in CRS metres.
- **After 1 step** — both trucks moved by a seeded `uniform(-50, 50)` offset in
  x and y; with `SEED=42` agent 1 lands at `(-27.68, 23.65)` and the pair is now
  `109.36 m` apart.
- **`Within 200 m of agent 1 (incl. self): [1, 2]`** — both trucks fall inside a
  200 m buffer; note `get_neighbors_within_distance` returns the centre agent
  itself, which is why `1` appears in the list.
- **`GeoDataFrame rows=2, columns=['unique_id', 'geometry']`** — the export is a
  standard GeoPandas frame in `epsg:3857`; serializing it to GeoJSON/Arrow per
  tick is exactly how the precompute pipeline produces a replayable trajectory.

## Local interactive viz (optional, never served)

Mesa-Geo can render agents on a Leaflet basemap via Solara/`ipyleaflet` for
**local** inspection in a notebook. As with plain Mesa's SolaraViz, this is a
stateful Python server bound to localhost — useful while building a scenario,
but **not** the production path. CAOS_SIMLAB serves precomputed replays, not a
live Solara server (architecture rule). Use the `GeoDataFrame` export above as
the bridge to the static viewer.
