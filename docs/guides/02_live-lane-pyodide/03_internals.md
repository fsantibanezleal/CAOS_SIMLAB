# 03 · Internals — worker/client split, protocol, FS write, and `verify`

How the live lane is actually wired. Three files implement it:

- [`web/src/lib/pyodide.worker.ts`](../../../web/src/lib/pyodide.worker.ts) — the Web Worker: boots Pyodide,
  loads the closure, writes the `simlab` sources, runs / verifies scenarios.
- [`web/src/lib/pyodideClient.ts`](../../../web/src/lib/pyodideClient.ts) — the main-thread client: a lazily
  created singleton worker, promise-based `runLive` / `verifyLive`, and a progress subscription.
- [`web/src/lib/pyodideProtocol.ts`](../../../web/src/lib/pyodideProtocol.ts) — the message types that cross the
  boundary.

The Python side is [`simlab/live.py`](../../../simlab/live.py) (`run_trace_json`, `live_lanes`, `_is_live`).

## Why a Web Worker

A Pyodide run can take a second or more. Running it on the **Worker** keeps the UI thread responsive while the
simulation computes; the main thread only posts requests and animates the JSON that comes back. This is also why
the client is a **singleton** — one warm runtime is reused across runs rather than re-booting per slider move.

## Why a *classic* worker (not a module worker)

The worker pulls the Pyodide **UMD** `pyodide.js` from the CDN via `importScripts`. A classic worker is used on
purpose:

- It avoids Vite trying to **bundle a remote ESM** (the module-worker path would try to resolve the CDN URL at
  build time).
- It sidesteps the **Firefox module-worker `indexURL` bug** (pyodide #5923). The worker passes `indexURL`
  explicitly regardless, so the runtime always knows where to find its assets.

## The message protocol (JSON only)

The worker ↔ main-thread boundary is **JSON only** — plain objects via structured clone. **No `PyProxy` ever
crosses threads**; the Python trace is serialised to a JSON string inside the worker and `JSON.parse`d on the
main thread. The shapes (`PyRequest` / `PyResponse` in
[`pyodideProtocol.ts`](../../../web/src/lib/pyodideProtocol.ts)):

| Direction | Message | Carries |
|---|---|---|
| → worker | `init` | `sourcesUrl` |
| → worker | `run` | `id, scenario, params, seed` |
| → worker | `verify` | `id, scenario, params, seed, committed` (the committed trace text) |
| → main | `progress` | `phase` (`loading-runtime` → `loading-packages` → `loading-simlab` → `ready`) |
| → main | `ready` | `numpy`, `python` versions |
| → main | `result` | `id, trace, runMs` |
| → main | `verified` | `id, trace, runMs, match, firstDiffPath?, firstDiffDelta?` |
| → main | `error` | `id?, phase?, message, kind` (`runtime` / `python` / `network`) |

Each `run` / `verify` carries an incrementing `id`; the client keeps a `pending` map of `id → {resolve, reject}`
so concurrent requests resolve to the right promise.

## Writing the real `simlab` into the in-browser FS

The "same engine, not a port" guarantee lives here. On `init` the worker:

1. `fetch`es `pyodide/simlab-sources.json` (the inlined `simlab/**/*.py`, built by
   [`web/copy-data.mjs`](../../../web/copy-data.mjs)). It guards the fetch: a non-OK status or a non-JSON
   content-type raises a `network` error rather than parsing garbage.
2. Sets the bundle as a Python global and runs the `WRITE_SOURCES` snippet, which for each file makes the parent
   directory, writes the file into Pyodide's virtual filesystem, then:

   ```python
   if os.getcwd() not in sys.path:
       sys.path.insert(0, os.getcwd())
   importlib.invalidate_caches()
   import simlab.registry
   import simlab.live
   ```

After this the browser holds the **exact same engine code** the offline pipeline ran — the registry and the live
entrypoint are imported from the freshly written tree, not from a bundled JS re-implementation.

## verify (replay is truth, enforced)

Because a run is a pure function of `(params, seed)`, a **live** run must equal the **committed** trace for the
same inputs. The `verify` path re-runs the scenario live and compares its serialised JSON string to the committed
text (`firstNumericDiff` in the worker), producing a tri-state `match`:

- **`byte`** — the live JSON string is **identical** to the committed string. The strong result.
- **`numeric`** — the strings differ, but no number differs beyond a **1e-9 relative tolerance** and the
  structures match (key counts and array lengths equal). Acceptable float-formatting drift.
- **`differ`** — a real divergence. The worker reports `firstDiffPath` + `firstDiffDelta`. This means the lane is
  **wrong**, and CI / the verify check treats it as a failure.

`firstNumericDiff` recurses structurally: numbers compare within relative tolerance; arrays must match length
then element-wise; objects must match key count then key-wise; anything else compares by strict equality. So
**live and precomputed render through one code path** — "live" is the slider responsiveness, not a different
model. If they ever diverge, the build catches it. The same contract at the architecture level:
[architecture/02_determinism-and-trace.md](../../architecture/02_determinism-and-trace.md).

## The Python guard: `_is_live`

[`simlab/live.py`](../../../simlab/live.py) is defence-in-depth. `run_trace_json` refuses any scenario that is
not live, so even if the UI mis-routes a request the WASM runtime will not attempt a native import:

```python
def _is_live(sc) -> bool:
    return sc.pure_python and set(sc.wheels) <= LIVE_WHEELS
```

A scenario is live only if its engine is **pure-Python** *and* its declared `wheels` are all in the canonical
`LIVE_WHEELS` set (in [`simlab/core/scenario.py`](../../../simlab/core/scenario.py)). Native-engine scenarios
(OR-Tools) are `pure_python = False` and are rejected before any `ortools` import is reached. `live_lanes()`
returns the list of ids the browser may run, matching each manifest's lane verdict.

## Error handling & teardown

- **Run-time Python errors** come back as `error` with `kind: "python"` and the exception message, scoped to the
  request `id`, so a single bad run rejects only its own promise.
- **Boot failures** (no `id`) reject the `warmUp()` promise *and* tear the worker down (`disposeWorker()`), so a
  retry boots a fresh worker — a dead worker would otherwise never reply.
- **`worker.onerror`** rejects all pending requests and disposes the worker.

## Related

- [02 · Run](./02_run.md) — the boot phases and the run round-trip from the caller's side.
- [04 · Gotchas](./04_gotchas.md) — the non-obvious constraints behind these choices.
- [the precompute pipeline](../01_precompute-pipeline.md) — where the committed traces `verify` compares against
  come from.
- [architecture/03_the-gate.md](../../architecture/03_the-gate.md) — the measured gate `_is_live` mirrors.
