# Guide — the precompute pipeline (local → committed trace → replay)

This is the heart of CAOS_SIMLAB's reproducibility contract: **a run is a pure function of `(params, seed)`,
so the committed trace IS the source of truth and the web app only replays it** ("replay = truth"). Heavy
scenarios — native solvers (OR-Tools), ABM frameworks (Mesa), large state — are computed **offline in the
local `.venv`** and the compact seeded trace is committed; the static site never simulates them at
request time.

## 1. Set up the local environment

```powershell
# Windows / PowerShell
.\scripts\setup.ps1            # creates .venv (Python 3.13) + installs core + dev + precompute engines
```
```bash
# macOS / Linux / Git-Bash
./scripts/setup.sh
```

`setup` installs three layers:
- `requirements.txt` — the **live core** (numpy, simpy) — the only wheels Pyodide must load in the browser.
- `requirements-dev.txt` — pytest, ruff.
- `requirements-precompute.txt` — the **dedicated engines the scenarios actually use** to generate traces:
  SimPy, Ciw, Salabim · Mesa, Mesa-Geo, JuPedSim · OR-Tools, PyVRP, NetworkX, OSMnx · joblib, SciPy.

The optional **GPU lane** (`requirements-gpu.txt`: CuPy, Numba, Taichi, JAX) is installed separately on a
CUDA machine — see [gpu-lane.md](gpu-lane.md).

## 2. Run the pipeline

```powershell
.\scripts\precompute.ps1 s01_queue          # one scenario
.\scripts\precompute.ps1                     # (no arg) every scenario in the registry
.\.venv\Scripts\python.exe -m simlab.pipeline s06_jobshop --seed 7
```

The CLI is [`simlab/pipeline.py`](../../simlab/pipeline.py). For each scenario it:

1. Iterates every **variant** the scenario declares (the ≥10 preset regimes a learner can compare).
2. Runs it: `trace = scenario.run(params, seed)` — deterministic given `(params, seed)`.
3. Measures wall-clock `run_ms` and the serialized `trace_bytes`.
4. Classifies the lane with the **3-gate rule** ([`simlab/core/scenario.py`](../../simlab/core/scenario.py)
   `classify_lane`): `live` only if **pure-Python AND run_ms < 3000 AND trace_bytes < ~1 MB`; otherwise
   `precompute`. Native engines (OR-Tools) set `pure_python = False` → always precompute.
5. Writes the compact seeded trace and a per-scenario manifest.

## 3. What it writes

```
data/artifacts/<scenario_id>/<variant_id>-seed<seed>.json   # one compact trace per variant
manifests/<scenario_id>.json                                # lane, seed, params, measured gate numbers,
                                                            # KPIs, analytic reference, viz binding
```

Even **live** scenarios get committed traces: the app replays a tiny one instantly on first paint while
Pyodide warms up, and the learner can compare all regimes with zero compute. The trace schema is versioned
(`simlab.<kind>trace/v1`); the same render path animates a live re-run and a replayed trace identically.

## 4. How the web app consumes it

`web/copy-data.mjs` (the `predev`/`prebuild` hook) overlays `data/artifacts/` + `manifests/` into the Vite
build, so `npm run build` ships the committed traces alongside `dist/`. Deploy is GitHub Pages — committing
a new trace and pushing re-publishes the site ("git-as-data"). No backend, no runtime DB.

## 5. Determinism & honesty rules

- **Seed everything.** Every stochastic engine (SimPy RNG, Mesa, PyVRP/HGS, Monte-Carlo streams) is seeded
  so a committed trace is exactly reproducible from the repo. Re-running the pipeline must reproduce the
  committed bytes.
- **Never commit raw data.** OSMnx/road work commits only **rendered geometry** (plain JSON), never raw
  `.graphml`/`.osm`/`.pbf` (CI blocks them; ODbL — see [ATTRIBUTION.md](../../ATTRIBUTION.md)).
- **Label synthetic vs sourced.** Synthetic scenarios say so; the one real external dataset (OR-Library
  `ft06` for S06) is cited.

## 6. Per-scenario engines

Which dedicated tool each scenario uses is documented in
[docs/problem-types/](../problem-types/) and per tool in [docs/frameworks/](../frameworks/). Summary:
S01 SimPy + Ciw · S02/S03/S05 Mesa · S04 SimPy · S06 OR-Tools CP-SAT · S07 OR-Tools + SimPy + OSMnx ·
S08 OR-Tools + PyVRP + SimPy · S09 OR-Tools + SimPy + graph · S10 joblib (+ CuPy/Numba) + SciPy ·
S11 OR-Tools GLOP + SimPy.
