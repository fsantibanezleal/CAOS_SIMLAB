# 01 · JuPedSim — Installation

JuPedSim (Jülich Pedestrian Simulator) is an open-source **microscopic pedestrian
dynamics** library: a compiled C++ core with a clean Python API. In CAOS_SIMLAB it powers
the **crowd / evacuation flow** family of scenarios (Emergency-Department egress,
room/corridor evacuation) where we care about *space, geometry and collision-free movement
of individuals* — something a queueing or discrete-event model cannot represent.

- **Project:** <https://github.com/PedestrianDynamics/jupedsim>
- **Docs:** <https://www.jupedsim.org/>
- **PyPI:** <https://pypi.org/project/jupedsim/>
- **License:** LGPLv3 (weak copyleft — see "License note" below)
- **Documented & installed version here:** `jupedsim` **1.4.2** (Python 3.13)

> Reading order: this page (install) → [02_usage.md](02_usage.md) (API + the runnable
> example) → [03_applying.md](03_applying.md) (how to formalize and solve the problem).
> The landing page for this node is [../06_jupedsim.md](../06_jupedsim.md).

## Which requirements lane

JuPedSim belongs to the **precompute** lane (`requirements-precompute.txt`), **not** the
core/live lane. Two reasons, both grounded in the architecture research:

1. It ships **native code** (a compiled C++ engine plus VTK/PySide6 for its visual
   tooling), so it **cannot** run in the browser / Pyodide live lane — only pure-Python
   wheels work there.
2. Pedestrian runs are heavier than the cheap live scenarios; we run them **offline** on
   the local machine, record trajectories, commit a compact artifact, and the SPA
   **replays** it (the same local-compute → committed-artifact → static-viewer pattern
   used across the lab; see [../../guides/01_precompute-pipeline.md](../../guides/01_precompute-pipeline.md)).

This mirrors the ABM-frameworks decision: *"Crowd/pedestrian flow → JuPedSim (LGPLv3,
pip-installable, social-force + collision-free-speed models) … because JuPedSim is a clean
Python library that drops into our pipeline."*

## Install

The project virtual environment already has JuPedSim installed in the precompute lane.
The exact pinned line is:

```text
# requirements-precompute.txt
jupedsim==1.4.2       # pedestrian / ED crowd flow (social-force / collision-free-speed)
```

To install just this package (documented for reproducibility — the env is already
provisioned):

```bash
pip install "jupedsim==1.4.2"
```

To install the whole precompute lane at once (the supported way):

```bash
pip install -r requirements-precompute.txt
```

Installed version in this environment: **1.4.2** on **Python 3.13**.

> Do **not** run `pip install` as part of running the examples — the environment is
> already provisioned. The commands above are documented for reproducibility only.

## Key transitive dependencies

`pip show jupedsim` reports `Requires: deprecated, numpy, pyside6, shapely, vtk`.
What each is for and the version pinned here:

| Dependency | Installed here | Role |
|---|---|---|
| **numpy** | 2.x | array math; trajectory / position data |
| **shapely** | 2.1.x | geometry primitives — you can pass `Polygon` / `MultiPolygon` directly as the walkable area and as exit / waypoint stages |
| **pyside6** | 6.11.x | Qt bindings used by JuPedSim's optional visual / replay tooling (**not** needed for headless precompute) |
| **vtk** | 9.6.x | 3D visualization toolkit used by the optional viewers (**not** needed for headless precompute) |
| **deprecated** | — | decorator helper for marking deprecated API surface |

For our **headless precompute** use (the only way we use it) you only really touch
`jupedsim`, `shapely` and `numpy`; `pyside6` / `vtk` are pulled in transitively but the
pipeline never imports them.

## Platform notes

- **Pure pip wheel.** JuPedSim 1.4.2 installs from a binary wheel — no system C++
  compiler, no CMake, no Conda channel required. This is the main reason the research
  picks it over **Vadere** (Java/GUI, heavier toolchain friction).
- **Windows / Linux / macOS** all have wheels on PyPI for current CPython. This repo's
  environment is Python 3.13 on Windows and installs cleanly.
- **Headless servers.** Because `pyside6` / `vtk` are GUI / visualization stacks, on a
  headless box you may see Qt/X11 warnings *if* you import the viewer modules. The
  precompute pipeline never imports them, so headless runs are unaffected. Use the SQLite
  trajectory writer (`jupedsim.SqliteTrajectoryWriter`) or your own serializer to persist
  results, then replay elsewhere.

## CUDA / GPU notes

**None — JuPedSim is CPU-only.** It does **not** use CUDA and is **not** in the GPU
requirements lane (`requirements-gpu.txt`, see [../../guides/03_gpu-lane.md](../../guides/03_gpu-lane.md)).
The collision-free-speed and social-force models run on the CPU. If a scenario ever needs
*million-agent* GPU scale, that is a different tool entirely (FLAME GPU 2, documented in
the [GPU-ABM reference chapter](../18_gpu-abm-chapter.md)), **not** JuPedSim. For ED-egress and
room/corridor evacuation, hundreds-to-low-thousands of agents on CPU is the right and
sufficient scale.

## License note (important for a public repo)

JuPedSim is **LGPLv3** — weak copyleft. We use it only as an **offline precompute tool**
that produces data artifacts (trajectories); we do **not** redistribute or statically link
the library into the public web bundle. That keeps it cleanly isolated from the MIT/Apache
code we ship to the browser. This is recorded in the repo's license inventory
([../../../ATTRIBUTION.md](../../../ATTRIBUTION.md) · [../../../LICENSES.md](../../../LICENSES.md))
alongside the other copyleft precompute tools.
