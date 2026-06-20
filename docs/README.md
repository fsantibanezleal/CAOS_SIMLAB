# CAOS_SIMLAB — documentation

This lab is a **guide for implementing real simulation/optimization solutions**: for each problem type it
shows the *dedicated, state-of-the-art* tool, how to install it, how to use it, and how to apply it — with a
runnable, verified example. Two planes: a lightweight **live** lane in the browser and a no-restriction
**local precompute** lane that runs the heavy dedicated engines and commits a seeded trace the static site
replays. The contract underneath everything: a run is a pure function of `(params, seed)`, the committed
**trace** is the source of truth, and the front end only animates it — *replay = truth*.

## How to read this wiki

- **The wiki is numbered for reading order.** Every section's nodes are prefixed `01_`, `02_`, … and that is
  the order they are meant to be read in. Read a section top to bottom for the full curriculum, or jump
  straight to the node you need.
- **Every node is a folder *and* a sibling index file.** A node `X` is documented by an index file `X.md` and
  a folder `X/` next to it holding the in-order pages. The index file is the entry point; it links into its
  folder and ends with cross-links to siblings and related sections.
- **All links are relative.** No single file unifies the others; you navigate by the section indexes below and
  the per-node "See also" / "Related" links.

## The four sections + architecture

- [**Problem types**](./problem-types.md) — the decision map per problem type: which kind of modelling a
  question needs and which dedicated tool answers it (DES · ABM · Optimization & Routing · Monte-Carlo).
- [**Frameworks**](./frameworks.md) — the 18 framework nodes: install / usage / applying for the dedicated
  state-of-the-art tool of each problem type, with a verified `example.py` where the framework is Python.
- [**Use cases**](./use-cases.md) — the 11 worked scenarios (S01–S11), each solved end to end: assumptions →
  formalization → solvers applied → results and reading.
- [**Guides**](./guides.md) — the runtime how-tos: the precompute pipeline, the live (Pyodide) lane, and the
  optional GPU lane.
- [**Architecture**](./architecture.md) — the deterministic-replay, two-plane design and the measured
  live/precompute gate (deep wiki: overview, determinism/trace, the gate, live Pyodide lane, precompute
  pipeline, live-tool evaluation, deploy).

## Scenario → tool map

| # | Scenario | Tool(s) | Lane |
|---|---|---|---|
| [S01](./use-cases/01_s01_queue.md) | Bank/Clinic Queue (M/M/c) | SimPy + Ciw (analytic validation) | live |
| [S02](./use-cases/02_s02_schelling.md) | Schelling Segregation | Mesa (+ NetLogo Web) | live |
| [S03](./use-cases/03_s03_sir.md) | SIR Epidemic | Mesa (+ NetLogo Web) | live |
| [S04](./use-cases/04_s04_ed.md) | Emergency Department Flow | SimPy (multi-stage priority) | live |
| [S05](./use-cases/05_s05_beergame.md) | Beer Game (bullwhip) | Mesa (policy/feedback) | live |
| [S06](./use-cases/06_s06_jobshop.md) | Job-Shop Scheduling | OR-Tools CP-SAT | precompute |
| [S07](./use-cases/07_s07_haul.md) | Construction Haul Routing | OR-Tools + SimPy + OSMnx/NetworkX | precompute |
| [S08](./use-cases/08_s08_vrp.md) | Vehicle Routing (VRP) | OR-Tools + PyVRP + SimPy | precompute |
| [S09](./use-cases/09_s09_ambulance.md) | Ambulance Dispatch | SimPy + OR-Tools-class dispatch + graph | live |
| [S10](./use-cases/10_s10_montecarlo.md) | Monte-Carlo CI Study | joblib (+ CuPy/Numba) + SciPy | precompute |
| [S11](./use-cases/11_s11_minehaul.md) | Mine Multi-Destination Haul | OR-Tools GLOP LP + SimPy | precompute |

The tools behind each scenario are documented in [frameworks.md](./frameworks.md); the problem type each one
belongs to is in [problem-types.md](./problem-types.md).

## Honesty

Deprecated tools (AgentPy, desmod) are intentionally **not** used. Synthetic scenarios are labeled; the one
real external dataset (OR-Library `ft06`, S06) is cited. Data policy + licenses:
[../ATTRIBUTION.md](../ATTRIBUTION.md) · [../LICENSES.md](../LICENSES.md).
