# 01 · Setup — what the live lane needs to exist

The live lane has **no setup step a visitor performs** — it boots itself in the browser the first time a
scenario is run live. "Setup" here means the two build-time inputs the lane depends on, both produced by the
web build, plus the single runtime pin you would touch to upgrade it. Nothing is installed on a server; the
site is static (see [the precompute pipeline](../01_precompute-pipeline.md) and
[architecture/07_deploy.md](../../architecture/07_deploy.md)).

## The two build-time inputs

The lane is "the real `simlab` engine, in WebAssembly". For that to be true, two artifacts must be present in
the published site, both written by [`web/copy-data.mjs`](../../../web/copy-data.mjs) (the `predev` / `prebuild`
hook):

1. **`pyodide/simlab-sources.json`** — the entire `simlab/**/*.py` tree inlined into one JSON
   (`{ package: "simlab", files: { "simlab/…": "<source>" } }`). The worker fetches this, writes each file into
   Pyodide's virtual filesystem, and `import simlab`. This is *why* a live run executes the **exact same code**
   the offline pipeline ran — it is the same source bytes, not a re-implementation. `__pycache__` is skipped and
   keys are normalised to POSIX paths so the in-browser FS is happy on every host OS.
2. **`data/artifacts/` + `manifests/`** — the committed traces and per-scenario manifests. The live lane needs
   these for two reasons: the **first-paint** trace it replays while Pyodide warms up (see
   [02 · Run](./02_run.md)), and the **committed text** the `verify` path compares a live run against (see
   [03 · Internals](./03_internals.md)).

If `simlab-sources.json` is missing the worker throws a `network` error on boot (it checks the HTTP status and
content-type before parsing); if the manifests/traces are missing the page has nothing to replay on first paint.
Both are produced automatically by the build hook — there is no manual copy step.

## The runtime pin (the one knob)

The Pyodide runtime version is centralised in
[`web/src/lib/pyodide-config.ts`](../../../web/src/lib/pyodide-config.ts):

```ts
export const PYODIDE_VERSION = "0.28.3";
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PYODIDE_JS_URL = `${PYODIDE_INDEX_URL}pyodide.js`;
```

`0.28.x` ships **Python 3.13 + numpy 2.2.x**. Bumping the one constant upgrades the whole runtime; flipping the
base URL away from the jsDelivr CDN is how the project would later **self-host** the WASM runtime. The worker
also reports the live `numpy` and Python versions back to the main thread on `ready`, so the UI can show exactly
what runtime is in use.

## The live wheel closure (and where it is defined)

On boot the worker loads a fixed set of wheels — the **live wheel closure**. The closure must match the
canonical gate constant `LIVE_WHEELS` in
[`simlab/core/scenario.py`](../../../simlab/core/scenario.py):

```python
LIVE_WHEELS = frozenset({
    "numpy", "simpy", "ciw", "mesa", "pandas", "scipy", "networkx", "sqlite3", "joblib",
})
```

The worker realises this closure as two calls (see [02 · Run](./02_run.md) for why it is split):

```ts
await pyodide.loadPackage(["numpy", "pandas", "scipy", "networkx", "sqlite3", "micropip"]);
const micropip = pyodide.pyimport("micropip");
await micropip.install(["simpy", "ciw", "mesa", "joblib"]);
```

This closure is the **only** thing the browser fetches as engine code — every wheel in it is cold-start bytes,
which is why it is kept tight. Native engines (OR-Tools) and the GPU libraries are **never** in this set; their
scenarios are `pure_python = False`, the gate keeps them precompute-only, and
[`simlab/live.py`](../../../simlab/live.py) refuses them as a hard guard. See
[04 · Gotchas](./04_gotchas.md) for the one place the source comments still describe an older, smaller closure.

## What you do NOT need

- **No server.** There is no application backend; the lane is client-side WASM.
- **No local install for visitors.** Pyodide and the wheels are fetched from the CDN at first live use.
- **No build flag to "enable" it.** As long as the two build-time inputs above are emitted (default), the lane
  is live.

## Related

- [02 · Run](./02_run.md) — booting, loading the closure, running, the cold-start sequence.
- [03 · Internals](./03_internals.md) — the worker/client split, the message protocol, `replay = truth`.
- [04 · Gotchas](./04_gotchas.md) — classic-worker, `sqlite3`-for-Mesa, the stale source comments.
- [precompute pipeline](../01_precompute-pipeline.md) — where the committed traces and manifests come from.
- [architecture/04_live-lane-pyodide.md](../../architecture/04_live-lane-pyodide.md) — the architecture-level
  treatment of the same lane.
