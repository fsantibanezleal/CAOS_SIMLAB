# OSMnx — Installation

OSMnx (Boeing, MIT) downloads, models, analyses and visualises real street networks from
OpenStreetMap as [NetworkX](https://networkx.org/) graphs. In CAOS_SIMLAB it is the **road
layer** for the geospatial routing scenarios — see [`usage.md`](./usage.md) and
[`applying.md`](./applying.md).

## Pinned version

- **Package:** `osmnx`
- **Installed version (this lab):** `2.1.0`
- **License:** MIT
- **Import name:** `osmnx` (conventionally `import osmnx as ox`)

> **Already installed — do not re-install.** The lab's virtual environment already has
> OSMnx 2.1.0. This page documents *how it was/should be installed* and what it pulls in; you
> do not need to run `pip` to use it here.

## Which requirements file it belongs to

OSMnx is a **precompute-lane** dependency. It is listed in `requirements-precompute.txt` —
the heavier, offline engines used to generate committed traces, **not** loaded by the browser
and **not** part of the live MVP:

```text
# requirements-precompute.txt
# osmnx>=1.9   # local road graphs (commit RENDERED GEOMETRY only — never raw .graphml; see ATTRIBUTION.md)
```

Honesty note: in the current repo this line is **commented out**, because **no scenario uses
real OpenStreetMap data yet** — the routing scenarios run on a self-contained synthetic
`GridNetwork` (`simlab/scenarios/_geo.py`). OSMnx is installed and documented here as the
*planned* road layer for S07/S09 (and the contrast to the synthetic graph). When a scenario
first ingests OSM, uncomment this line and pin it. The installed version (2.1.0) is newer than
the `>=1.9` floor and is the one these docs target. It is **not** in `requirements.txt` (core,
live/browser tier) nor `requirements-gpu.txt` (CUDA) — OSMnx is pure-Python and CPU-only, but
its native geospatial dependencies (GEOS/PROJ/GDAL via geopandas) cannot run in the Pyodide/
WASM browser tier, which is the other reason it lives in the precompute lane.

## The exact pip line

To install the same release into a fresh local precompute environment:

```bash
pip install "osmnx==2.1.0"
```

(or, matching the requirements floor, `pip install "osmnx>=1.9"` and let it resolve to 2.1.0).

## Key transitive dependencies

OSMnx is pure Python but stands on a **native geospatial stack**. `pip install osmnx` pulls in
(versions are what this lab resolved):

| Dependency | Installed | Role |
|---|---|---|
| `networkx` | 3.6.1 | the graph data structure + shortest-path algorithms OSMnx wraps |
| `geopandas` | 1.1.3 | spatial dataframes (nodes/edges as GeoDataFrames, `route_to_gdf`) |
| `shapely` | 2.1.2 | geometry objects (LineString/Point) — binds native **GEOS** |
| `numpy` | 2.4.6 | numerics underlying pandas/geopandas |
| `pandas` | 3.0.3 | tabular backbone of geopandas |
| `requests` | 2.34.2 | HTTP client used to query the Overpass / Nominatim APIs |
| `scipy` | 1.18.0 | spatial KD-tree behind `nearest_nodes` (and the `entropy` extra) |

`geopandas`/`shapely` in turn link the compiled **GEOS**, **PROJ** and (transitively) **GDAL**
libraries. These ship as binary wheels, so on a normal desktop `pip` handles them; you do **not**
need a system GDAL install for the wheels.

Optional OSMnx extras exist (`osmnx[all]` adds `matplotlib` for `plot_graph`, `rasterio`/
`rio-vrt` for raster, `scikit-learn` for `nearest_neighbors`). The lab does **not** require them —
the road layer only needs the core graph + routing utilities. For plotting in a local notebook
you may additionally have `matplotlib`, but it is not a hard dependency of the road layer.

## Platform notes

- **Windows / macOS / Linux** are all supported; OSMnx itself is pure Python and the native
  dependencies (GEOS/PROJ/GDAL) ship as wheels for all three. The lab's environment is Windows
  (`.venv/Scripts/python.exe`).
- **No compiler needed** for the standard wheel install. If `pip` ever tries to build
  `shapely`/`pyproj` from source (rare, on an unusual platform), install via `conda-forge`
  instead, which provides prebuilt GEOS/PROJ/GDAL.
- **Network access at runtime, not install time.** Installing OSMnx needs no network beyond
  PyPI. *Using* `ox.graph_from_*` to download a real area hits the public **Overpass API**
  (and Nominatim for place lookups). The lab's example does **not** download anything — see
  the offline strategy in [`usage.md`](./usage.md).

## CUDA / GPU notes

**None — OSMnx is CPU-only and has no GPU path.** It is not in `requirements-gpu.txt`, needs no
CUDA, and the RTX-4070 precompute box gives it nothing. Road-graph shortest paths are sparse
graph traversals (Dijkstra/A\*) that run on the CPU; the GPU lane in this lab is reserved for the
large agent-based / physics scenarios, not routing.

## Verify the install

```bash
.venv/Scripts/python.exe -c "import osmnx as ox; print('osmnx', ox.__version__)"
# -> osmnx 2.1.0
```

Then run the worked example (no network required):

```bash
.venv/Scripts/python.exe docs/frameworks/osmnx/example.py
```

Expected output is captured verbatim in [`usage.md`](./usage.md#verified-output).
