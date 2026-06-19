# CAOS_SIMLAB

**A public, didactic lab for Discrete-Event Simulation (DES) and Agent-Based Modeling (ABM).**
Learn how to model a system from zero — *define a case → write the rules → run it → read the dynamics* —
across worked scenarios you can tune and watch run, with a companion web app and a from-scratch
curriculum.

> **Status:** v0.01.000 — early build. The shared engine + the first scenario (M/M/c queue) are in; the
> web app and the remaining scenarios are landing phase by phase (see the roadmap). Built in the open.

## Why this exists

Most simulation tutorials stop at a toy script; most simulation *tools* hide the model behind a GUI.
CAOS_SIMLAB does both halves honestly: a **readable curriculum** that teaches the real libraries
(SimPy, Mesa, OR-Tools, …) — their utility, their pitfalls, and *when each method actually applies* —
and a **modern web app** where you land straight in a running simulation, move the sliders, and watch
the dynamics change. The same engine drives both, so what you learn is what runs.

## The two-lane design (read this first)

Simulation cost varies enormously, so scenarios run in one of two lanes — and the choice is **measured,
not guessed**:

- **Live** — light, pure-Python scenarios run **in your browser** (via [Pyodide](https://pyodide.org)).
  Edit parameters, re-run, watch it animate in real time. No server, nothing to install.
- **Precomputed** — heavy scenarios (large agent counts, native solvers like OR-Tools, GPU work) are run
  **offline** by a local pipeline into a compact, **seeded trace**, which the app **replays** with a
  timeline scrubber under a clear *"precomputed due to cost"* banner. The full recipe lives in this repo.

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

## Scenarios (planned set)

A progression from a 30-line live queue to map-scale optimize-then-simulate. ✅ = available now.

| # | Scenario | Method | Lane | Teaches |
|---|---|---|---|---|
| ✅ S01 | Bank / Clinic Queue (M/M/c) | DES | live | arrivals, servers, queue, ρ, Little's Law, **validation vs theory** |
| S02 | Schelling Segregation | ABM | live | emergence from simple local rules |
| S03 | SIR / SEIR Epidemic | ABM | live | contagion, R₀, epidemic peak, herd immunity |
| S04 | Emergency Department Patient Flow | DES | live | priority triage, non-stationary arrivals, replications & CIs |
| S05 | Beer Game (bullwhip) | ABM | live | feedback + lead time amplify oscillations |
| S06 | Job-Shop Scheduling (CP-SAT) | optimization | precomputed | combinatorial scheduling — what an optimizer does |
| S07 | Construction Haul Routing | hybrid | precomputed | optimize-then-simulate; elevation drives cost |
| S08 | Vehicle Routing (VRP/VRPTW) | optimization | precomputed | routing under time windows; OR-Tools vs PyVRP |
| S09 | Emergency / Ambulance Dispatch | hybrid | precomputed | stochastic demand over a city graph; coverage |
| S10 | Monte-Carlo Replication / CI Study | hybrid | precomputed | replications, confidence intervals, warm-up |

## How it's organized

```
simlab/            the shared engine (imported by tests, the pipeline, and — via Pyodide — the app)
  core/            RNG seeding · trace schema · Scenario interface + the live/precompute gate · manifest
  scenarios/       one module per scenario
  pipeline.py      run a scenario → write a trace + manifest (the CLI)
notebooks/         the from-zero curriculum (DES, ABM, optimization, common mistakes)
data/              data policy + committed compact artifacts (traces). No raw data in git.
manifests/         per-scenario manifests (lane, seed, params, measured gate numbers, viz binding)
web/               the React/Vite single-page viewer (Pyodide live + trace replay) — building
tests/             reproducibility, theory-validation, and gate checks
```

## Honest simulation

This lab teaches the parts most demos skip: a single run is noisy, so results come from **replications +
confidence intervals**; steady-state metrics need a **warm-up** cut; the same `seed` must reproduce the
same result; and an animation is a *hypothesis generator*, not evidence. Each scenario validates against
theory or a baseline where one exists (S01 vs the closed-form M/M/c). The scenarios are **educational**,
not tuned for real-world service planning.

## License & attribution

Code: [MIT](LICENSE). Dependencies and any datasets keep their own licenses — see
[LICENSES.md](LICENSES.md) and [ATTRIBUTION.md](ATTRIBUTION.md). We commit only compact, redistributable
artifacts (never raw datasets or raw OpenStreetMap extracts); the pipelines show how to fetch + preprocess
the originals yourself.
