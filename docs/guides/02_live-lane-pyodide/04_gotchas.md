# 04 · Gotchas — the non-obvious constraints

The traps and load-bearing decisions behind the live lane. Each one is here because getting it wrong silently
breaks the lane.

## `sqlite3` must be loaded for Mesa

Mesa 3 imports `sqlite3` (via `mesa.experimental`). If `sqlite3` is not loaded with `loadPackage`, the
`import mesa` step throws. That is why the closure loads it explicitly:
`["numpy", "pandas", "scipy", "networkx", "sqlite3", "micropip"]`. `pandas / scipy / networkx` are Mesa's (and
Ciw's) dependencies — they are in the closure to satisfy those engines, not because the DES queues need them.
**Measured fact:** with `sqlite3` present, Mesa 3 imports and runs in Pyodide; cold start for
`numpy + pandas + scipy + networkx + sqlite3 + mesa` is ~3–5 s, and a 20-step 2500-agent run is ~2.3 s — inside
the 3 s gate. So the ABM scenarios run **live on real Mesa**, not a simplified re-implementation.

## The source comments describe an older, smaller closure — trust the gate constant

There are two stale comments in the source that pre-date the measured Mesa-in-Pyodide result. The
**authoritative** definition of what runs live is the `LIVE_WHEELS` frozenset in
[`simlab/core/scenario.py`](../../../simlab/core/scenario.py) plus `_is_live` in
[`simlab/live.py`](../../../simlab/live.py) — read those, not the prose comments:

- [`requirements.txt`](../../../requirements.txt) keeps the live **base** install minimal (`numpy`, `simpy`).
  Its comment now states the truth explicitly — *"Mesa/Ciw are NOT pinned here even though the ABM scenarios
  DO run live on real Mesa 3: the worker loads mesa (+ pandas/scipy/networkx/sqlite3) and ciw at runtime via
  loadPackage/micropip"* — so do **not** read its short pin list as "no Mesa in the browser". That file is the
  *local pip base*, not the browser closure: it is intentionally small because every line is also cold-start
  weight. The browser loads `mesa` (and friends) at runtime via `loadPackage` + `micropip`, so a tiny
  `requirements.txt` and a live Mesa lane are **not** a contradiction. The authoritative list of what runs
  live is `LIVE_WHEELS` (= `numpy, simpy, ciw, mesa, pandas, scipy, networkx, sqlite3, joblib`), below.
- The single source of truth for what runs live is `LIVE_WHEELS` + `_is_live`
  (`sc.pure_python and set(sc.wheels) <= LIVE_WHEELS`) in
  [`simlab/core/scenario.py`](../../../simlab/core/scenario.py) / [`simlab/live.py`](../../../simlab/live.py) —
  not prose. `LIVE_WHEELS` **includes** `mesa, joblib, scipy, networkx`, so those engines run live. If any
  comment or doc ever disagrees with the constant, the constant wins — ask the gate at runtime via
  `simlab.live.live_lanes()`.

When in doubt, ask the gate at runtime: `simlab.live.live_lanes()` returns exactly the scenario ids the browser
is allowed to run.

## Classic worker, not a module worker

The worker uses `importScripts` to load the **UMD** `pyodide.js`. Do not "modernise" it to a module worker:
that makes Vite try to bundle the remote ESM, and it re-exposes the Firefox module-worker `indexURL` bug
(pyodide #5923). `indexURL` is passed explicitly in either case, but the classic-worker form is the supported
path here. See [03 · Internals](./03_internals.md#why-a-classic-worker-not-a-module-worker).

## The wheel closure is a UX budget — keep it tight

Every wheel in the closure is bytes Pyodide must fetch on cold start. The closure is deliberately the **minimum**
the live scenarios need; the heavy/native engines (OR-Tools, Mesa-Geo, OSMnx, the GPU libraries) live in
`requirements-precompute.txt` / `requirements-gpu.txt` and **never** enter the browser. The native **OR-Tools**
work is precomputed and replayed (S06/S08/S11 plans, S07's route plan; see
[the precompute pipeline](../01_precompute-pipeline.md)). Mesa-Geo, OSMnx and the GPU libraries have **no
shipped scenario** — they are documented as the engines for *future* geospatial / road-graph / GPU variants,
not because anything precomputed currently uses them (see [the GPU lane](../03_gpu-lane.md), reference-only).
Adding a wheel to `LIVE_WHEELS` to make one scenario live taxes the cold start of **every** visitor — weigh it
against just precomputing that scenario.

## No `PyProxy` may cross the worker boundary

The trace is serialised to a JSON **string** inside the worker and `JSON.parse`d on the main thread; the protocol
is JSON-only. Returning a `PyProxy` (a live handle into the WASM heap) across `postMessage` would either fail to
clone or leak memory. Keep the boundary at `Trace.to_json()` → string.

## Boot is lazy and one-shot-per-failure

- The worker is created **only when the live lane is first used**, so visitors who never run live never download
  Pyodide. `warmUp()` caches its promise, so it is safe to call before every `run` / `verify`.
- On **boot failure** the client disposes the worker and resets the ready latch. A dead Pyodide worker never
  replies, so without teardown a retry would hang forever waiting on the old worker. Always go through
  `warmUp()` (which `runLive` / `verifyLive` do) rather than holding a stale worker reference.

## The two build inputs must actually ship

The lane silently degrades if the build hook output is missing:

- No `pyodide/simlab-sources.json` → the worker raises a `network` error on boot (it checks status +
  content-type), and live runs never start — the page only ever shows the first-paint replay.
- No `data/artifacts/` / `manifests/` → nothing to replay on first paint, and `verify` has no committed text to
  compare against.

Both come from [`web/copy-data.mjs`](../../../web/copy-data.mjs) via `predev` / `prebuild`; if you bypass those
hooks (e.g. a hand-rolled build), copy the artifacts yourself. See [01 · Setup](./01_setup.md).

## `verify = differ` means the lane is wrong, not the data

A `differ` result is not "the live run is approximate". Both lanes are the *same* deterministic code; a real
divergence means the committed trace is stale, the seed/params drifted, or the engine changed without
re-precomputing. Re-run the pipeline to regenerate the committed trace, do not relax the tolerance. The
1e-9 `numeric` band exists only for float **formatting** drift, not for model differences. See
[03 · Internals](./03_internals.md#verify-replay-is-truth-enforced).

## Related

- [01 · Setup](./01_setup.md) · [02 · Run](./02_run.md) · [03 · Internals](./03_internals.md)
- [architecture/06_live-tool-evaluation.md](../../architecture/06_live-tool-evaluation.md) — the honest, per-engine
  record of what is / isn't Pyodide-viable.
- [frameworks/04_mesa.md](../../frameworks/04_mesa.md) · [frameworks/07_netlogo-web.md](../../frameworks/07_netlogo-web.md)
  — the two live ABM engines (Mesa-in-Pyodide and the zero-Pyodide NetLogo Web alternative).
