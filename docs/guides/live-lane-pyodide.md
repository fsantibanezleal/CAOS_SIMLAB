# Guide — the live lane (SimPy/Mesa in the browser via Pyodide)

The **live lane** runs the light, pure-Python scenarios *in the visitor's browser* — no server compute, no
abuse surface, effectively unbounded concurrency. The same `simlab` engine that the local pipeline runs is
loaded into [Pyodide](https://pyodide.org) (CPython compiled to WASM) inside a **Web Worker**, so editing a
slider re-runs the real simulation and the UI animates the result.

## What qualifies for the live lane

The 3-gate rule (`simlab/core/scenario.py` `classify_lane`), measured by the pipeline and recorded in each
manifest. A scenario is `live` only if **all three** hold:

1. **pure-Python** — the engine loads in Pyodide/WASM. SimPy ✅ and Mesa ✅ are pure-Python. OR-Tools is
   native C++ → ✗ → precompute. CUDA → ✗ → precompute.
2. **fast** — a run completes in **< 3 s** in-Worker on a mid laptop.
3. **small** — the animatable trace is **< ~1 MB**.

The DES queues (SimPy) are live. For the ABM grids the live option is **either** Mesa-in-Pyodide **or** the
zero-Python **NetLogo Web** (client-side JS) — *which one a scenario ships is decided empirically by the
gate* (whether Mesa + its deps load fast enough in Pyodide to clear the < 3 s bar); the verdict is recorded
in the scenario's manifest. Whatever does not clear the gate is precomputed and replayed. Optimization/
routing and the heavy hybrids are always precomputed (native solvers; see
[precompute-pipeline.md](precompute-pipeline.md)). NetLogo Web is documented in
[docs/frameworks/netlogo-web/](../frameworks/netlogo-web/).

## How it works

1. The Worker boots Pyodide (pinned UMD build) via `importScripts`.
2. `numpy` and `networkx` are loaded with `pyodide.loadPackage`; `simpy` and `ciw` via `micropip` — the live
   wheel closure (`LIVE_WHEELS`). Heavy engines (Mesa, OR-Tools, joblib/SciPy) never load here; their
   scenarios are precomputed and replayed.
3. The `simlab` Python sources are inlined into a generated `simlab-sources.json` and written into the
   Pyodide virtual filesystem, so the browser runs the **exact same engine code** as the local pipeline.
4. A run posts state frames to the main thread; React animates them. The RNG is seeded, so a given
   `(params, seed)` reproduces the same run.

## replay = truth (the invariant we enforce)

Because a run is a pure function of `(params, seed)`, the live result must equal the committed trace for the
same inputs. The build verifies **byte-equality** between a live Pyodide run and the committed
`data/artifacts/...` trace for the default params — if they ever diverge, the lane is wrong and the check
fails. Live and precomputed therefore render through **one code path**; "live" is the slider responsiveness,
not a different model.

## Cold start

Pyodide is a ~multi-MB download. The landing scenario plays a tiny **precomputed** trace instantly on first
paint while Pyodide prefetches in the background Worker; once warm, slider changes run live. So "enter →
straight to a running simulator" holds without blocking on the WASM cold start.

## Keeping the live wheel closure small

Every dependency in `requirements.txt` is a wheel Pyodide must fetch, so the live core is deliberately tiny
(numpy + simpy). The heavy dedicated engines (OR-Tools, Mesa-Geo, OSMnx, GPU libs) live in
`requirements-precompute.txt` / `requirements-gpu.txt` and **never** enter the browser — their work is
precomputed and replayed.
