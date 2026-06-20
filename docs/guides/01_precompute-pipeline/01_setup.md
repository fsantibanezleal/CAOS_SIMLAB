# 01 · Setup — the local `.venv` and its three dependency layers

The precompute lane runs **offline in a local Python 3.13 virtual environment**. The setup scripts create
that `.venv` once and install three layers of dependencies. The browser never sees any of this — it only
loads the tiny live core (see [05_gotchas.md](./05_gotchas.md) on why that matters).

## One command

```powershell
# Windows / PowerShell
.\scripts\setup.ps1
```
```bash
# macOS / Linux / Git-Bash
./scripts/setup.sh
```

Both scripts ([`scripts/setup.ps1`](../../../scripts/setup.ps1) ·
[`scripts/setup.sh`](../../../scripts/setup.sh)) do the same thing:

1. Create `.venv` if it does not exist — `py -3.13 -m venv .venv` on Windows, `python3 -m venv .venv`
   elsewhere (override the interpreter with `PYTHON=...` on the shell script).
2. Upgrade `pip`.
3. Install **all three requirement files in one call**:

   ```text
   pip install -r requirements.txt -r requirements-dev.txt -r requirements-precompute.txt
   ```

The shell script also resolves the venv Python at `.venv/bin/python`, falling back to
`.venv/Scripts/python.exe` so it works under Git-Bash on Windows.

## The three layers

| File | Layer | What it is | Loaded by the browser? |
|---|---|---|---|
| [`requirements.txt`](../../../requirements.txt) | **live core** | `numpy>=1.26`, `simpy>=4.1` — the only wheels Pyodide must fetch for the live lane | yes (kept deliberately tiny) |
| [`requirements-dev.txt`](../../../requirements-dev.txt) | **dev / CI** | `pytest>=8.0`, `ruff>=0.6` | no |
| [`requirements-precompute.txt`](../../../requirements-precompute.txt) | **precompute engines** | the dedicated SOTA engines the scenarios use to generate traces | no (native and/or heavy) |

### The precompute engines (pinned, verified to import & run)

Versions are pinned to exactly what was installed and verified here (Python 3.13, Windows, 2026-06-19). The
full per-framework install notes, usage, and a runnable `example.py` live under
[`../../frameworks/`](../../frameworks.md).

- **DES:** `simpy==4.1.2` (also the live core) · `ciw==3.2.7` (Erlang-C M/M/c validation) ·
  `salabim==26.0.6` (offline mp4/gif render — desktop tkinter, not web-embeddable).
- **ABM:** `mesa==3.5.1` (S02 Schelling, S03 SIR, S05 Beer Game) · `mesa-geo==0.9.3` (map-based GeoAgents) ·
  `jupedsim==1.4.2` (pedestrian / ED crowd flow).
- **Optimization & routing:** `ortools==9.15.6755` (CP-SAT, Routing, GLOP — native, never live) ·
  `pyvrp==0.13.4` (Hybrid Genetic Search VRP) · `networkx==3.6.1` (Dijkstra/A*/k-shortest) ·
  `osmnx==2.1.0` (OSM road graphs) · `geopandas==1.1.3`, `shapely==2.1.2` (geospatial deps).
- **Monte-Carlo / statistics (CPU):** `joblib==1.5.3` (parallel seeded replications — S10 v1 default) ·
  `scipy==1.18.0` (`scipy.stats` confidence intervals).

> Deprecated tools (`agentpy`, `desmod`) are intentionally **not** installed — the ABM scenarios are real
> Mesa, not stand-ins.

## The optional GPU lane (separate, CUDA-only)

The setup scripts print, but do **not** run, the GPU install. It is an optional local-only exhibit, never on
the deploy path:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-gpu.txt
```

Pinned and verified on an RTX 4070 Laptop (8 GB, CUDA 12): `cupy-cuda12x==14.1.1`, `numba==0.65.1`,
`taichi==1.7.4`, `jax==0.10.2`. Full detail, the CUDA-detect-with-CPU-fallback pattern, and the honest
"when does a GPU actually help" verdict are in [../03_gpu-lane.md](../03_gpu-lane.md).

## Verify the install

```powershell
.\.venv\Scripts\python.exe -m pytest          # the test suite
.\scripts\precompute.ps1 s01_queue            # run the M/M/c queue end to end
```

If both succeed you have a working precompute lane. Next:
[02_running-the-pipeline.md](./02_running-the-pipeline.md).
