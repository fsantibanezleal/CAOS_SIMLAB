# Mesa-Geo — 01 · Installation

Mesa-Geo is the **geospatial extension of Mesa**: it adds `GeoAgent` (an agent
whose state includes a Shapely geometry) and `GeoSpace` (a CRS-aware spatial
container backed by an R-tree index) on top of the standard Mesa
`Agent`/`Model` ABM core. In CAOS_SIMLAB it powers the **map-based variants** of
the routing scenarios — the construction-haul and ambulance-dispatch geo cases —
where agents live on real coordinates and travel cost depends on geography.

← Back to the wiki node: [`../05_mesa-geo.md`](../05_mesa-geo.md) ·
Next: [`02_usage.md`](02_usage.md) → [`03_applying.md`](03_applying.md)

## Version & lane

| Field | Value |
|---|---|
| Package | `mesa-geo` |
| Installed version | **0.9.3** |
| Import name | `mesa_geo` (commonly aliased `import mesa_geo as mg`) |
| License | Apache-2.0 |
| Requirements file | **`requirements-precompute.txt`** (precompute lane) |
| Runs in browser? | No — native GIS deps (rasterio/GDAL) are not WASM-friendly |
| Role | Offline geospatial ABM precompute → committed GeoJSON/Arrow → static replay |

Mesa-Geo belongs to the **precompute lane**, not the live lane. Like the rest of
that lane, it is run **offline** in the local pipeline to generate a compact,
committed trajectory artifact, which the static web viewer then replays. It is
never executed on the no-GPU production VPS, and its native GIS stack
(rasterio/GDAL, pyproj, rtree) rules out the in-browser Pyodide path. See
[`../../guides/01_precompute-pipeline.md`](../../guides/01_precompute-pipeline.md) for
the lane it lives in and [`../../architecture.md`](../../architecture.md) for the
two-lane / deterministic-replay design.

## Install line

It is already installed in the project `.venv`. The exact line that installs the
pinned version is:

```bash
pip install "mesa-geo==0.9.3"
```

In the precompute requirements file it sits next to its parent engine, e.g.:

```text
mesa>=3.0          # ABM precompute + local SolaraViz (local-only, never served)
mesa-geo>=0.9      # geospatial ABM: GeoAgent + GeoSpace (S07/S09 geo variants)
```

Do **not** run pip as part of using this lab — the environment is already
provisioned. The line above is documentation of what produced the installed
state, not a step to execute.

## Key transitive dependencies (as installed in this `.venv`)

Mesa-Geo pulls in a full GIS stack. The versions resolved here are:

| Package | Installed | Why Mesa-Geo needs it |
|---|---|---|
| `mesa` | 3.5.1 | The ABM core: `Agent`, `Model`, `AgentSet` scheduling |
| `shapely` | 2.1.2 | Geometry objects (`Point`, `LineString`, `Polygon`) held by each `GeoAgent` |
| `geopandas` | 1.1.3 | `GeoDataFrame` I/O — bulk agent creation and export |
| `pyproj` | 3.7.2 | CRS transforms (e.g. WGS84 ↔ Web-Mercator) |
| `rtree` | 1.4.1 | The spatial index behind `GeoSpace` neighbour/intersection queries |
| `rasterio` | 1.5.0 | Raster layers (`RasterLayer`) — DEM/elevation rasters |
| `libpysal` | 4.14.1 | Spatial-weights helpers used by some space relations |
| `folium` | 0.20.0 | Leaflet map export (local inspection only) |
| `ipyleaflet` | 0.20.0 | Notebook map widget (local inspection only) |
| `xyzservices` | 2026.3.0 | Tile-provider registry for basemap tiles |
| `numpy` | 2.4.6 | Numeric backbone under shapely/geopandas |
| `pandas` | 3.0.3 | Tabular backbone under geopandas |

Mesa-Geo is a **thin** layer in lines of code, but a **heavy** one in installed
footprint: most of the wheels above are the GIS native stack (GEOS/PROJ/GDAL),
not Mesa-Geo itself. That footprint is exactly why it is precompute-only and not
a browser/live-lane tool.

Confirm the two headline versions inside the `.venv` with:

```bash
python -c "import mesa_geo, mesa; print(mesa_geo.__version__, mesa.__version__)"
# -> 0.9.3 3.5.1
```

## Platform notes

- **Windows (this machine).** The GIS dependencies (`shapely`, `pyproj`,
  `rasterio`, `rtree`) ship as binary wheels that bundle their native libraries
  (GEOS, PROJ, GDAL) — no system GDAL install is required, which is why a plain
  `pip install` resolves cleanly here. On Linux CI the same wheels resolve; the
  manylinux builds also bundle the native libs.
- **Geometry-only use needs no rasters.** The example in this folder uses only
  `shapely.Point` + `GeoSpace`, so the `rasterio`/GDAL path is never exercised;
  it stays a transitive dependency. Pulling a DEM (`RasterLayer`) is what would
  exercise GDAL, and only the S07 slope variant needs it.
- **CRS default is `epsg:3857`** (Web-Mercator, metres). `GeoSpace(...)` defaults
  to it; pass `warn_crs_conversion=False` to silence the conversion warning when
  every agent already shares that CRS. Mixing CRSs without converting is the most
  common Mesa-Geo footgun — keep one CRS per `GeoSpace`.

## CUDA / GPU notes

**None — Mesa-Geo is CPU-only.** It inherits Mesa's object-per-agent model and
has no CUDA path. There is no GPU acceleration to configure, and it does not
belong in `requirements-gpu.txt` (see [`../../guides/03_gpu-lane.md`](../../guides/03_gpu-lane.md)).
For the rare "wow-scale" million-agent ABM the research routes work to FLAME
GPU 2 / ABMax instead (see the reference chapter
[`../18_gpu-abm-chapter.md`](../18_gpu-abm-chapter.md)) — Mesa(-Geo) is the **clear,
didactic** geospatial engine for thousands-of-agents map scenarios, not the
large-scale-throughput one.
