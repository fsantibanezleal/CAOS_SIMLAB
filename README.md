# CAOS_SIMLAB

**A public, didactic lab for Discrete-Event Simulation (DES), Agent-Based Modeling (ABM), and
Optimization / Operations Research.**
Learn how to model a system from zero — *define a case → write the rules → run it → read the dynamics* —
across worked scenarios you can tune and watch run, with a companion web app and a from-scratch
curriculum.

> **Status:** v0.15.002 — live. All **11 scenarios** ship and run in the
> [web app](https://simlab.fasl-work.com) (S01–S11), eight of them **live in the browser**. The shared
> engine, the deterministic-replay viewer, and the Theory/Methodology pages (Queueing · DES · ABM ·
> Optimization) are all in. Built in the open — see the [changelog](CHANGELOG.md).

## Why this exists

Most simulation tutorials stop at a toy script; most simulation *tools* hide the model behind a GUI.
CAOS_SIMLAB does both halves honestly: a **readable curriculum** that teaches the real **dedicated,
state-of-the-art tools** — SimPy · Ciw · Salabim (DES) · Mesa · Mesa-Geo · NetLogo Web · JuPedSim (ABM) ·
OR-Tools · PyVRP · NetworkX/OSMnx (optimization & routing) · joblib · SciPy · CuPy/Numba (Monte-Carlo) —
their utility, their pitfalls, and *when each method actually applies* (full per-tool install/usage/apply
guides + runnable examples in [`docs/`](docs/README.md)) —
and a **modern web app** where you land straight in a running simulation, move the sliders, and watch
the dynamics change. The same engine drives both, so what you learn is what runs.

## The two-lane design (read this first)

Simulation cost varies enormously, so scenarios run in one of two lanes — and the choice is **measured,
not guessed**:

- **Live** — light, pure-Python scenarios run **in your browser** (via [Pyodide](https://pyodide.org)).
  Edit parameters, re-run, watch it animate in real time. No server, nothing to install.
- **Precomputed** — heavy scenarios (native solvers like OR-Tools, large state) are run **offline** by a
  local pipeline into a compact, **seeded trace**, which the app **replays** with a timeline scrubber under
  a clear *"precomputed due to cost"* banner. The full recipe lives in this repo.

A scenario qualifies for the live lane only if it is **pure-Python AND runs in < 3 s AND its trace is
< ~1 MB** (the [3-gate rule](simlab/core/scenario.py)). The verdict, with the measured numbers, is
recorded in each scenario's manifest. Because a run is fully determined by `(params, seed)`, **the trace
is the source of truth and replay is exact** — live and precomputed render through one code path.

## Quickstart (local)

Python **3.13** recommended (3.11+ works). Parallel PowerShell + bash scripts (run either):

```powershell
# Windows / PowerShell
.\scripts\setup.ps1                       # create .venv + install
.\.venv\Scripts\python.exe -m pytest      # run the test suite
.\scripts\precompute.ps1 s01_queue        # run the M/M/c queue, write a trace + manifest
```

```bash
# macOS / Linux / Git-Bash
./scripts/setup.sh
.venv/bin/python -m pytest
./scripts/precompute.sh s01_queue
```

`precompute` prints the gate verdict (live vs precomputed), the measured run-time and trace size, the
simulated KPIs, and the closed-form reference. Artifacts land in `data/artifacts/<id>/` and
`manifests/<id>.json`.

## Scenarios

A progression from a 30-line live queue to map-scale optimize-then-simulate. All 11 ship in the app today;
**Lane** is the *measured* verdict (live = runs in your browser, precomputed = replayed from a seeded trace).

| # | Scenario | Method | Lane | Teaches |
|---|---|---|---|---|
| S01 | Bank / Clinic Queue (M/M/c) | DES | live | arrivals, servers, queue, ρ, Little's Law, **validation vs theory** |
| S02 | Schelling Segregation | ABM | live | emergence from simple local rules |
| S03 | SIR Epidemic | ABM | live | contagion, R₀, epidemic peak, herd immunity |
| S04 | Emergency Department Patient Flow | DES | live | priority triage, non-stationary (hour-of-day) arrivals, multi-stage flow |
| S05 | Beer Game (Supply-Chain Bullwhip) | ABM | live | feedback + lead time amplify oscillations |
| S06 | Job-Shop Scheduling (CP-SAT) | optimization | precomputed | combinatorial scheduling — what an optimizer does |
| S07 | Construction Haul Routing | hybrid | live | optimize-then-simulate: the OR-Tools/NetworkX plan is precomputed + committed, the SimPy stochastic replay runs **live** over it (sliders mutate the replay) |
| S08 | Vehicle Routing (VRP) | optimization | precomputed | routing & fleet sizing with OR-Tools |
| S09 | Ambulance Dispatch | hybrid | live | stochastic demand over a city graph; coverage |
| S10 | Monte-Carlo Replication / CI Study | hybrid | live | replications, confidence intervals, finite-run bias |
| S11 | Mine Multi-Destination Haul | optimization + DES | precomputed | blend LP → fixed-fleet haul DES; plan-vs-fleet grade slip |

## How it's organized

```
simlab/            the shared engine (imported by tests, the pipeline, and — via Pyodide — the app)
  core/            RNG seeding · trace schema · Scenario interface + the live/precompute gate · manifest
  scenarios/       one module per scenario (s01–s11) + _geo (the graded-terrain grid network)
  pipeline.py      run a scenario → write a trace + manifest (the CLI)
notebooks/         the from-zero curriculum (DES, ABM, optimization, common mistakes) — roadmap; the web
                   app is the live teaching surface today
data/              data policy + committed compact artifacts (traces). No raw data in git.
manifests/         per-scenario manifests (lane, seed, params, measured gate numbers, viz binding)
web/               the React 19 + Vite single-page viewer (Pyodide live + trace replay) — deployed
tests/             reproducibility, theory-validation, and gate checks
```

## Honest simulation

This lab teaches the parts most demos skip: a single run is noisy, so results come from **replications +
confidence intervals**; steady-state metrics carry a **finite-run (initial-transient) bias**; the same
`seed` must reproduce the same result; and an animation is a *hypothesis generator*, not evidence. Each
scenario validates against theory or a baseline where one exists (S01 vs the closed-form M/M/c). Numbers
are sourced or labeled synthetic; the scenarios are **educational**, not tuned for real-world service
planning.

## License & attribution

Code: [MIT](LICENSE). Dependencies and any datasets keep their own licenses — see
[LICENSES.md](LICENSES.md) and [ATTRIBUTION.md](ATTRIBUTION.md). We commit only compact, redistributable
artifacts (never raw datasets or raw OpenStreetMap extracts); the pipelines show how to fetch + preprocess
the originals yourself.
