# Licenses

CAOS_SIMLAB code is **MIT** ([LICENSE](LICENSE)). Third-party components keep their own licenses. This
file tracks them so the public repo's licensing story stays clean. Dataset/source attribution is in
[ATTRIBUTION.md](ATTRIBUTION.md). Per-tool install/usage guides are in [docs/frameworks/](docs/frameworks/).

## Live / core (the wheels the browser loads via Pyodide and runs live)

The Pyodide worker loads NumPy / pandas / SciPy / NetworkX / sqlite3 via `loadPackage`, then micropip-installs
SimPy / Ciw / Mesa / joblib. So all of these run **live in the browser** (the `LIVE_WHEELS` set in
`simlab/core/scenario.py`). The native OR-Tools solvers are the only precompute-only engines (next section).

| Component | Version | License | Use |
|---|---|---|---|
| SimPy | 4.1.2 | MIT | discrete-event simulation engine (live) — S01, S04, S07 replay, S09, S11 DES leg |
| NumPy | 2.4.6 | BSD-3-Clause | seeded RNG + numerics (shared by every engine) |
| pandas | 3.0.3 | BSD-3-Clause | dataframes (Mesa dependency; loaded by the worker) |
| Mesa | 3.5.1 | Apache-2.0 | agent-based modeling framework — **S02 Schelling, S03 SIR, S05 Beer Game** (runs LIVE in Pyodide) |
| Ciw | 3.2.7 | MIT | queueing-network engine — S01 analytic M/M/c (Erlang-C) cross-check (runs LIVE) |
| NetworkX | 3.6.1 | BSD-3-Clause | graph algorithms (Dijkstra over the city graph) — S09 (runs LIVE) |
| joblib | 1.5.3 | BSD-3-Clause | CPU-parallel seeded replications — S10 Monte-Carlo / CI study (runs LIVE, threading backend) |
| SciPy | 1.18.0 | BSD-3-Clause | `scipy.stats` confidence intervals / distributions — S10 (runs LIVE) |

## Precompute lane (offline, local `.venv`, never shipped to the browser)

The **native OR-Tools solvers** generate the committed traces the S06/S08/S11 scenarios replay (and the S07
route plan), plus offline-render and documented-but-not-yet-shipped engines. Pinned in
`requirements-precompute.txt`.

| Component | Version | License | Use |
|---|---|---|---|
| Google OR-Tools | 9.15.6755 | Apache-2.0 | CP-SAT (S06 + the S07 route-plan builder), Routing (S08), GLOP LP (S11) — native, precompute-only |
| PyVRP | 0.13.4 | MIT | SOTA Hybrid Genetic Search VRP — S08 analytic contrast vs OR-Tools |
| Salabim | 26.0.6 | MIT | DES teaching counterpoint + offline `.mp4`/`.gif` render (desktop, not web-embeddable) |
| Mesa-Geo | 0.9.3 | Apache-2.0 | GeoAgents for map-based ABM — documented engine for a FUTURE geospatial variant (no shipped scenario) |
| JuPedSim | 1.4.2 | LGPL-3.0 | pedestrian crowd flow (social-force / collision-free-speed) — documented engine for a FUTURE egress variant (no shipped scenario) |
| OSMnx | 2.1.0 | MIT | OSM road graphs — **rendered geometry committed only**, never raw `.graphml` (ODbL) |
| GeoPandas | 1.1.3 | BSD-3-Clause | geospatial dataframes (OSMnx / Mesa-Geo dependency) |
| Shapely | 2.1.2 | BSD-3-Clause | geometry (OSMnx / Mesa-Geo dependency) |

## GPU lane (optional, local-only, never on the deploy path)

Pinned in `requirements-gpu.txt`; installed only on a CUDA machine (verified on an RTX 4070 Laptop).

| Component | Version | License | Use |
|---|---|---|---|
| CuPy | 14.1.1 (cuda12x) | MIT | GPU array Monte-Carlo (cuRAND-backed); CPU(numpy) fallback in code |
| Numba | 0.65.1 | BSD-2-Clause | `@njit` CPU + CUDA kernels (xoroshiro128p per-thread RNG); CPU fallback |
| Taichi | 1.7.4 | Apache-2.0 | portable kernels for grid/CA sims |
| JAX / jaxlib | 0.10.2 | Apache-2.0 | vmap+jit vectorized Monte-Carlo primitive |

## Frontend (`web/`)

SPA at https://simlab.fasl-work.com. Visualization is hand-rolled inline SVG + Canvas2D — no charting/map/
graph dependency (no deck.gl, MapLibre, @xyflow/react, d3, three, uPlot).

| Component | License | Use |
|---|---|---|
| React, React-DOM (19) | MIT | UI runtime |
| react-router-dom | MIT | client-side routing |
| zustand | MIT | state store |
| i18next, react-i18next | MIT | bilingual UI (EN default, ES) |
| KaTeX | MIT | math rendering on the Theory pages |
| lucide-react | ISC | icons |
| Vite | MIT | build / dev server |
| TypeScript | Apache-2.0 | typed source |
| Pyodide | MPL-2.0 | in-browser Python runtime for the live lane (loaded from CDN, not vendored) |

## Live ABM engine (client-side JS, optional)

| Component | License | Use |
|---|---|---|
| NetLogo Web / Tortoise | GPL-2.0+ (engine) | optional client-side ABM cards. Model code is mixed CC0 / CC-BY-NC-SA — prefer CC0 examples or author our own; record each embedded model's license. See [docs/frameworks/07_netlogo-web.md](docs/frameworks/07_netlogo-web.md). |

## Reference-only — documented, NOT installed or shipped

- **FLAME GPU 2** — AGPL-3.0, CUDA-coupled, no PyPI wheel. Million-agent GPU-ABM; teaching chapter only
  ([docs/frameworks/18_gpu-abm-chapter.md](docs/frameworks/18_gpu-abm-chapter.md)). The shipped GPU exhibit uses
  CuPy/Numba (permissive) instead.
- **ABMax** (JAX-ABM), **AMBER** (Polars) — reference only (ABMax does not pip-install on this Windows box).
- **JaamSim** (Apache-2.0, Java desktop), **AnyLogic** (proprietary) — conceptual references, not Python deps.

## Deprecated — intentionally NOT used

- **AgentPy**, **desmod** — deprecated upstream (AgentPy's authors point users to Mesa). The ABM scenarios
  use Mesa, not these. They appear in the docs only as "do not use".
