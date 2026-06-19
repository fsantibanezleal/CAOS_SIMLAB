# Licenses

CAOS_SIMLAB code is **MIT** ([LICENSE](LICENSE)). Third-party components keep their own licenses. This
file tracks them so the public repo's licensing story stays clean. Dataset/source attribution is in
[ATTRIBUTION.md](ATTRIBUTION.md).

## Runtime / engine dependencies

| Component | License | Use |
|---|---|---|
| SimPy | MIT | Discrete-event simulation core (live + teaching) |
| NumPy | BSD-3-Clause | seeded RNG + numerics |
| Mesa | Apache-2.0 | agent-based modeling (added with the ABM scenarios) |

## Precompute-lane dependencies (offline only, not shipped to the browser)

| Component | License | Use |
|---|---|---|
| Google OR-Tools | Apache-2.0 | CP-SAT / VRP solvers (precompute-only) |
| PyVRP | MIT | state-of-the-art VRP contrast |
| NetworkX | BSD-3-Clause | graph algorithms |
| OSMnx | MIT | local road graphs (we commit rendered geometry only) |
| Ciw | MIT | open queueing-network teaching |
| joblib | BSD-3-Clause | CPU-parallel replications |

## Deliberately NOT a dependency

- **FLAME GPU 2** — AGPL-3.0 and CUDA-version-coupled. Referenced for teaching only; never vendored,
  imported, or shipped. The optional GPU exhibit uses CuPy/Numba (BSD/permissive) instead.

## Frontend (web/, as it lands)

React, Vite, deck.gl, MapLibre GL, @xyflow/react, uPlot — all MIT/BSD/Apache. Pyodide is MPL-2.0.
Pinned versions and exact licenses will be listed here when the SPA is added.
