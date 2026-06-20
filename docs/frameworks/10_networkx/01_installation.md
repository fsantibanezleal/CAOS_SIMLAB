# NetworkX — Installation

NetworkX is the pure-Python graph library that provides the lab's **graph data structure and
shortest-path algorithms** (Dijkstra, A\*, k-shortest paths). It is the road/network layer behind the
routing scenarios **S07** (construction haul routing) and **S09** (ambulance dispatch). See the
landing page [`../10_networkx.md`](../10_networkx.md) for the big picture; this page is just how to
get it installed and verified.

## Exact install line and version

```bash
pip install "networkx==3.6.1"
```

- **Installed version in this lab:** `3.6.1` (verified from this `.venv`)
- **Python:** 3.13 (the lab's `.venv`)
- **License:** `BSD-3-Clause` (from the distribution metadata `License-Expression`) — permissive,
  safe for a public repo, and compatible with MIT-licensed OSMnx.
- **Import name:** `networkx` (conventionally aliased `import networkx as nx`)

The base wheel is pure Python with **no compiled extensions**, so the install is a fast, single-file
download with nothing to build — see [Platform notes](#platform-notes).

## Which requirements file it belongs to

NetworkX lives in the **precompute** lane: `requirements-precompute.txt`.

It is listed there (commented in the lean MVP profile) alongside the other graph/routing tools:

```text
# networkx>=3.2     # graph algorithms
# osmnx>=1.9        # local road graphs (commit RENDERED GEOMETRY only — never raw .graphml)
```

Why **precompute** and not **core**:

- The *core* lane (`requirements.txt`) is the minimal set the live MVP loads in the browser via
  Pyodide. NetworkX is **pure Python and can run live**, but in this lab the heavy road-graph build
  (and the OSMnx download it pairs with) happens **offline in the precompute pipeline**, which then
  commits a compact replayable trace. NetworkX is therefore grouped with the precompute graph tools.
- It is **not** a GPU dependency. `requirements-gpu.txt` is reserved for CuPy/Numba (large-N ABM and
  Monte-Carlo) — NetworkX never touches the GPU lane.

> The pure-Python shortest-path code shown in [`02_usage.md`](./02_usage.md) is exactly the kind of
> small graph work that *could* also run in the live Pyodide tier; whether a given scenario runs it
> live or replays a precomputed trace is decided per-scenario by the 4-gate rule
> (see [`../../architecture.md`](../../architecture.md)), not by NetworkX itself.

## Key transitive dependencies

NetworkX has **zero hard runtime dependencies** — the base install is self-contained pure Python
(confirmed from the wheel: every declared requirement is gated behind an `extra ==` marker). Its
`pyproject.toml` declares numpy/scipy/matplotlib/pandas only under the **optional `default` extra**,
used to *accelerate* or *visualize* specific algorithms (e.g. linear-algebra-based metrics, drawing).
The algorithms this lab uses — `dijkstra_path`, `dijkstra_path_length`, `shortest_simple_paths`
(Yen's algorithm), `grid_2d_graph` — are **pure Python and need none of them**.

| Dependency | Status | Used for |
|---|---|---|
| (none) | required | base graph structures + path algorithms run with stdlib only |
| `numpy` (≥1.25) | optional (`default` extra) | adjacency-matrix / linear-algebra algorithms; already in this `.venv` |
| `scipy` (≥1.11.2) | optional (`default` extra) | sparse-matrix algorithms (e.g. some centralities); already present |
| `matplotlib` (≥3.8), `pandas` (≥2.0) | optional (`default` extra) | drawing / dataframe conversion (not used by the routing core) |
| `osmnx` (≥2.0) | optional (`example` extra) | the *companion* tool that downloads OSM road graphs into NetworkX |

To install the accelerated surface explicitly: `pip install "networkx[default]==3.6.1"`. Because numpy
and scipy are already installed in the lab `.venv` (they back other scenarios), NetworkX runs with its
full accelerated surface available anyway — but the routing example does **not** depend on it and runs
on a bare `pip install networkx`.

## Platform notes

- **OS:** Windows / macOS / Linux, identical. No compiler, no system libraries — it is a pure-Python
  wheel, so there is nothing to build and nothing to mismatch across platforms.
- **CUDA / GPU:** Not applicable. NetworkX is CPU-only and the routing scenarios need no GPU (the
  research is explicit: "No GPU is needed anywhere in this dimension — all of these are CPU
  solvers"). NetworkX does have an experimental `nx-cugraph` GPU backend, but the lab does **not** use
  it and it is out of scope for the routing scenarios.
- **Determinism across platforms:** because the algorithms are pure Python and deterministic on a
  fixed graph, the same graph yields the same path on every OS/Python build — the property the lab's
  seeded routing traces rely on (see [`02_usage.md` § Determinism](./02_usage.md#determinism)).
- **OSMnx pairing:** when NetworkX is fed real OpenStreetMap data via OSMnx, OSM data is **ODbL**
  (share-alike + attribution). Display "© OpenStreetMap contributors" wherever map data appears and
  commit only *rendered geometry*, never raw `.graphml` (see [`../../../ATTRIBUTION.md`](../../../ATTRIBUTION.md)).
  The synthetic grid in this folder's [`example.py`](./example.py) needs no attribution because it is
  generated, not downloaded.

## Verify the install

```bash
.venv/Scripts/python.exe -c "import networkx as nx; print(nx.__version__)"
# -> 3.6.1
```

Then confirm the routing example itself runs (full walk-through in [`02_usage.md`](./02_usage.md)):

```bash
.venv/Scripts/python.exe docs/frameworks/10_networkx/example.py
```

## Deprecated — do not use

`AgentPy` and `desmod` appear in older simulation tutorials but are **deprecated and excluded** from
this lab. They are unrelated to NetworkX (they are ABM/DES wrappers) and are mentioned here only so
you ignore any tutorial that pairs them with graph work. For graphs in this lab, use **NetworkX**.
