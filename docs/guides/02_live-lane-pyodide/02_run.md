# 02 · Run — booting Pyodide and running a live scenario

This is the lifecycle of a live run, from a cold page to an animating slider. The entry points are
[`web/src/lib/pyodideClient.ts`](../../../web/src/lib/pyodideClient.ts) (main thread) and
[`web/src/lib/pyodide.worker.ts`](../../../web/src/lib/pyodide.worker.ts) (the Web Worker). The deeper
mechanics — protocol, FS write, byte-equality — are in [03 · Internals](./03_internals.md).

## The four phases of a boot

The worker boots **lazily**: the client creates it only when the live lane is first used, so a visitor who
never runs live never pays the multi-MB download. `warmUp()` is idempotent (it caches the ready promise), and
both `runLive(...)` and `verifyLive(...)` call it first. The boot reports progress so the UI can show the
one-time download:

1. **`loading-runtime`** — `importScripts(PYODIDE_JS_URL)` then `loadPyodide({ indexURL })`. The UMD
   `pyodide.js` is pulled from the CDN.
2. **`loading-packages`** — load the live wheel closure (below).
3. **`loading-simlab`** — fetch `pyodide/simlab-sources.json`, write each file into the in-browser FS, and
   `import simlab.registry` / `import simlab.live`.
4. **`ready`** — the worker reports the live `numpy` and Python versions back; the client resolves `warmUp()`.

The phase names are the `PyPhase` union in
[`web/src/lib/pyodideProtocol.ts`](../../../web/src/lib/pyodideProtocol.ts); subscribe with
`onPyodideProgress(cb)`.

## Loading the wheel closure

The closure is loaded as two calls, because each wheel is published differently for Pyodide:

```ts
// Pyodide-built packages (loadPackage):
await pyodide.loadPackage(["numpy", "pandas", "scipy", "networkx", "sqlite3", "micropip"]);
// pure-Python wheels (micropip from PyPI):
const micropip = pyodide.pyimport("micropip");
await micropip.install(["simpy", "ciw", "mesa", "joblib"]);
```

- `numpy / pandas / scipy / networkx / sqlite3` ship as **Pyodide packages**, so `loadPackage` fetches the
  pre-built WASM-compatible builds.
- `simpy / ciw / mesa / joblib` are **pure-Python wheels** installed from PyPI via `micropip`.
- `sqlite3` is loaded **for Mesa** — Mesa 3 imports it via `mesa.experimental`; without it the import fails. It
  is the single non-obvious member of the closure; see [04 · Gotchas](./04_gotchas.md).

This realises the canonical `LIVE_WHEELS` set in
[`simlab/core/scenario.py`](../../../simlab/core/scenario.py). It is the only engine code the browser fetches,
so it is kept tight: native engines (OR-Tools) and the GPU libraries never appear here.

## Running a scenario

Once warm, a run is a single round-trip:

```ts
const { trace, runMs } = await runLive(scenarioId, params, seed);
```

Inside the worker, `run` sets `scenario_id`, `params_json`, `seed_val` as Python globals and executes:

```python
import json
from simlab.live import run_trace_json
run_trace_json(scenario_id, json.loads(params_json), int(seed_val))
```

`run_trace_json` (in [`simlab/live.py`](../../../simlab/live.py)) coerces the params, calls
`Scenario.run(coerced, seed)`, and returns `Trace.to_json()` — the **same run + serialise path the offline
pipeline uses**. The compact JSON string crosses the worker boundary, is `JSON.parse`d on the main thread, and
React animates it. The worker times the run with `performance.now()` and returns `runMs`.

Because the run is a pure function of `(params, seed)` and the RNG is seeded, the same inputs always reproduce
the same trace — which is exactly what makes [the verify path](./03_internals.md#verify-replay-is-truth-enforced)
meaningful.

## Cold start: instant first paint, live after warm-up

Pyodide is a multi-MB download, so the page does **not** block on it:

1. On first paint the scenario page **replays a tiny committed trace** instantly (from
   `data/artifacts/…`, produced by [the precompute pipeline](../01_precompute-pipeline.md)).
2. Meanwhile the worker warms in the background (`loading-runtime` → `loading-packages` → `loading-simlab` →
   `ready`).
3. Once warm, moving a slider runs the scenario **live** for the new params.

So "enter → straight to a running simulator" holds without waiting on the WASM cold start. If the boot fails, the
client tears the worker down (a dead worker never replies) so a retry boots a fresh one — see
[04 · Gotchas](./04_gotchas.md).

## Related

- [01 · Setup](./01_setup.md) — the build-time inputs and the runtime pin the boot depends on.
- [03 · Internals](./03_internals.md) — the worker/client split, the JSON-only protocol, the FS write, and
  `verify` (byte / numeric / differ).
- [04 · Gotchas](./04_gotchas.md) — classic vs module worker, `sqlite3`, boot-failure teardown, stale comments.
- [architecture/04_live-lane-pyodide.md](../../architecture/04_live-lane-pyodide.md) — the same lifecycle in the
  architecture wiki.
