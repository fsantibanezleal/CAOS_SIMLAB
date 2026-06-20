# 02 · The live lane — SimPy / Mesa in the browser via Pyodide

The **live lane** runs the light, pure-Python scenarios *in the visitor's browser* — no server compute, no
abuse surface, effectively unbounded concurrency. The same `simlab` engine the offline pipeline runs is loaded
into [Pyodide](https://pyodide.org) (CPython compiled to WebAssembly) inside a **Web Worker**, so editing a
slider re-runs the **real** simulation and the UI animates the fresh trace. The implementation is
[`web/src/lib/pyodide.worker.ts`](../../web/src/lib/pyodide.worker.ts) (worker),
[`web/src/lib/pyodideClient.ts`](../../web/src/lib/pyodideClient.ts) (main-thread client), and
[`simlab/live.py`](../../simlab/live.py) (the in-browser Python entrypoint).

The contract underneath: a run is a pure function of `(params, seed)`, the committed **trace** is the source of
truth, and a live run must reproduce it byte-for-byte for the same inputs — **replay = truth**. Live and
precomputed therefore render through **one code path**; "live" is the slider responsiveness, not a different
model.

## What qualifies for the live lane

The measured **gate** ([`simlab/core/scenario.py`](../../simlab/core/scenario.py) `classify_lane`), recorded in
each manifest. A scenario is `live` only if **all** hold:

1. **pure-Python** — the engine imports in Pyodide/WASM. SimPy, Ciw, Mesa, joblib are pure-Python ✅; OR-Tools
   is native C++ ✗; CUDA libs ✗.
2. **wheels ⊆ `LIVE_WHEELS`** — its declared wheels are all in the closure the worker loads (`numpy, simpy, ciw,
   mesa, pandas, scipy, networkx, sqlite3, joblib`).
3. **fast** — a run completes in **< 3 s** in-Worker on a mid laptop.
4. **small** — the animatable trace is **< ~1 MB**.

The DES queues (SimPy) run live; the ABM scenarios run **live on real Mesa** (the measured fact:
Mesa 3 imports in Pyodide once `sqlite3` is loaded — a 20-step 2500-agent run is ~2.3 s, inside the gate). For
ABM there is also a zero-Pyodide alternative, **NetLogo Web** (client-side JS), for an even smaller cold start;
see [frameworks/07_netlogo-web.md](../frameworks/07_netlogo-web.md). Whatever does not clear the gate is
precomputed and replayed; optimization / routing and the heavy hybrids are always precomputed (native solvers —
see [the precompute pipeline](./01_precompute-pipeline.md)).

## This node (read in order)

1. [01_setup.md](./02_live-lane-pyodide/01_setup.md) — the two build-time inputs the lane depends on
   (`simlab-sources.json`, the committed traces/manifests), the single runtime pin, and the live wheel closure.
   No server, no per-visitor install.
2. [02_run.md](./02_live-lane-pyodide/02_run.md) — the boot phases (`loading-runtime` → `loading-packages` →
   `loading-simlab` → `ready`), how the closure is loaded, running a scenario, and the cold-start sequence
   (instant first paint, live after warm-up).
3. [03_internals.md](./02_live-lane-pyodide/03_internals.md) — the worker/client split, why a *classic* worker,
   the JSON-only message protocol, writing the real `simlab` into the in-browser FS, and `verify`
   (byte / numeric / differ).
4. [04_gotchas.md](./02_live-lane-pyodide/04_gotchas.md) — `sqlite3`-for-Mesa, the stale source comments vs the
   gate constant, classic-vs-module worker, the closure as a UX budget, no `PyProxy` across threads, lazy boot +
   teardown.

## At a glance

```ts
// boot (lazy, idempotent) → run → animate. Same engine the pipeline runs, in WASM.
await pyodide.loadPackage(["numpy", "pandas", "scipy", "networkx", "sqlite3", "micropip"]);
const micropip = pyodide.pyimport("micropip");
await micropip.install(["simpy", "ciw", "mesa", "joblib"]);   // the LIVE_WHEELS closure
// per slider change, on the main thread:
const { trace, runMs } = await runLive(scenarioId, params, seed);
```

```python
# inside the worker, the SAME run+serialise path as `python -m simlab.pipeline`:
from simlab.live import run_trace_json
run_trace_json(scenario_id, params, seed)   # -> Scenario.run(coerced, seed).to_json()
```

## See also

- [../guides.md](../guides.md) — the guides section index (precompute, this live lane, the GPU lane).
- [01_precompute-pipeline.md](./01_precompute-pipeline.md) — where the committed traces this lane is checked
  against come from (replay = truth).
- [03_gpu-lane.md](./03_gpu-lane.md) — the optional, local-only GPU exhibit (never on the deploy path, never in
  the browser closure).
- [../architecture/04_live-lane-pyodide.md](../architecture/04_live-lane-pyodide.md) — the same lane in the deep
  architecture wiki.
- [../architecture/03_the-gate.md](../architecture/03_the-gate.md) ·
  [../architecture/02_determinism-and-trace.md](../architecture/02_determinism-and-trace.md) — the measured gate
  and the determinism/trace contract this lane enforces.
- [../frameworks/01_simpy.md](../frameworks/01_simpy.md) · [../frameworks/04_mesa.md](../frameworks/04_mesa.md) ·
  [../frameworks/07_netlogo-web.md](../frameworks/07_netlogo-web.md) — the engines that run live.
