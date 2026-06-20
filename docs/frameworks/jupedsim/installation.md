# JuPedSim — Installation

JuPedSim (Jülich Pedestrian Simulator) is an open-source **microscopic pedestrian
dynamics** library: a C++ core with a clean Python API. In CAOS_SIMLAB it powers the
**crowd / evacuation flow** scenarios (Emergency-Department egress, room/corridor
evacuation) where we care about *space, geometry and collision-free movement of
individuals* — something a queueing or discrete-event model cannot represent.

- **Project:** <https://github.com/PedestrianDynamics/jupedsim>
- **PyPI:** <https://pypi.org/project/jupedsim/>
- **License:** LGPLv3 (copyleft — see "License note" below)
- **Documented version here:** `jupedsim` **1.4.2**

## Which requirements file

JuPedSim belongs to the **precompute** lane (`requirements-precompute.txt`), **not**
the core/live lane. Two reasons, both grounded in the architecture research:

1. It ships **native code** (a compiled C++ engine plus VTK/PySide6 for its visual
   tooling), so it cannot run in the browser/Pyodide live lane — only pure-Python
   wheels work there.
2. Pedestrian runs are heavier than the cheap live scenarios; we run them **offline**
   on the local machine, record trajectories, commit a compact artifact, and the SPA
   **replays** it (the same local-compute -> committed-artifact -> static-viewer
   pattern used across the lab).

This mirrors the ABM-frameworks decision: *"Crowd/pedestrian flow -> JuPedSim
(LGPLv3, pip-installable, social-force + collision-free-speed models) ... because
JuPedSim is a clean Python library that drops into our pipeline."*

## Install

Everything is already installed in the project virtual environment. The exact line
that installs JuPedSim into the precompute lane is:

```bash
pip install "jupedsim>=1.4,<2"
```

Installed version in this environment: **1.4.2** (Python 3.13).

To install the whole precompute lane at once (the supported way):

```bash
pip install -r requirements-precompute.txt
```

> Do not run `pip install` as part of running the examples — the environment is
> already provisioned. The command above is documented for reproducibility only.

## Key transitive dependencies

`pip show jupedsim` reports `Requires: deprecated, numpy, pyside6, shapely, vtk`.
What each is for:

| Dependency | Installed here | Role |
|---|---|---|
| **numpy** | 2.4.6 | array math; trajectory/position data |
| **shapely** | 2.1.2 | geometry primitives — you can pass `Polygon`/`MultiPolygon` directly as the walkable area and as exit/waypoint stages |
| **pyside6** | 6.11.1 | Qt bindings used by JuPedSim's optional visual/replay tooling (not needed for headless precompute) |
| **vtk** | 9.6.2 | 3D visualization toolkit used by the optional viewers (not needed for headless precompute) |
| **deprecated** | — | decorator helper for marking deprecated API surface |

For our **headless precompute** use (the only way we use it), you only really touch
`jupedsim`, `shapely` and `numpy`; `pyside6`/`vtk` are pulled in transitively but the
pipeline does not import them.

## Platform notes

- **Pure pip wheel.** JuPedSim 1.4.2 installs from a binary wheel — no system C++
  compiler, no CMake, no Conda channel required. This is the main reason the research
  picks it over **Vadere** (Java/GUI, heavier toolchain friction).
- **Windows / Linux / macOS** all have wheels on PyPI for current CPython. This repo's
  environment is Python 3.13 on Windows and installs cleanly.
- **Headless servers.** Because `pyside6`/`vtk` are GUI/visualization stacks, on a
  headless box you may see Qt/X11 warnings *if* you import the viewer modules. The
  precompute pipeline never imports them, so headless runs are unaffected. Use the
  SQLite trajectory writer (`jupedsim.SqliteTrajectoryWriter`) or your own
  serializer to persist results, then replay elsewhere.

## CUDA / GPU notes

**None — JuPedSim is CPU-only.** It does **not** use CUDA and is **not** in the GPU
requirements lane (`requirements-gpu.txt`). The collision-free-speed and social-force
models run on the CPU. If a scenario ever needs *million-agent* GPU scale, that is a
different tool entirely (FLAME GPU 2 in the GPU lane), not JuPedSim. For ED-egress and
room/corridor evacuation, hundreds-to-low-thousands of agents on CPU is the right and
sufficient scale.

## License note (important for a public repo)

JuPedSim is **LGPLv3** — weak copyleft. We use it only as an **offline precompute
tool** that produces data artifacts (trajectories); we do **not** redistribute or
statically link the library into the public web bundle. That keeps it cleanly isolated
from the MIT/Apache code we ship to the browser. Record this in the repo's
`ATTRIBUTION.md` / license inventory alongside the other copyleft precompute tools.
