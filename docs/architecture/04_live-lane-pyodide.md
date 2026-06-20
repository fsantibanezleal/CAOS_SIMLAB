# 04 · The live lane — Pyodide in a Web Worker

The live lane runs the **real `simlab` Python package in the visitor's browser** via
[Pyodide](https://pyodide.org) (CPython compiled to WebAssembly), inside a **Web Worker**. Editing a slider
re-runs the *same* engine the offline pipeline runs and the UI animates the fresh trace — no server compute,
no abuse surface, effectively unbounded concurrency. The implementation is
[`web/src/lib/pyodide.worker.ts`](../../web/src/lib/pyodide.worker.ts) (worker) and
[`web/src/lib/pyodideClient.ts`](../../web/src/lib/pyodideClient.ts) (main-thread client).

## Why a Web Worker, and why a classic worker

- **Worker, not main thread** — a Pyodide run can take a second or more; running it off the UI thread keeps
  the page responsive while the simulation computes.
- **Classic worker (`importScripts`), not a module worker** — the worker pulls the Pyodide **UMD**
  `pyodide.js` from the CDN via `importScripts`. This avoids Vite trying to bundle a remote ESM, and
  sidesteps the Firefox module-worker `indexURL` bug (pyodide #5923); `indexURL` is passed explicitly
  regardless. The runtime pin is centralised in
  [`web/src/lib/pyodide-config.ts`](../../web/src/lib/pyodide-config.ts) (`PYODIDE_VERSION = "0.28.3"`,
  which ships Python 3.13 + numpy 2.2.x); bumping one constant upgrades the runtime, and flipping the base
  URL is how self-hosting would later replace the CDN.

## The wheel closure (must match `LIVE_WHEELS`)

On first use the worker boots Pyodide, then loads exactly the live wheel closure — and **only** that closure.
This list is the runtime mirror of `simlab.core.scenario.LIVE_WHEELS`
([03_the-gate.md](./03_the-gate.md)):

```ts
await pyodide.loadPackage(["numpy", "pandas", "scipy", "networkx", "sqlite3", "micropip"]);
const micropip = pyodide.pyimport("micropip");
await micropip.install(["simpy", "ciw", "mesa", "joblib"]);
```

The split (`loadPackage` vs `micropip.install`) is just how each wheel is published for Pyodide:
numpy/pandas/scipy/networkx/sqlite3 ship as Pyodide packages; simpy/ciw/mesa/joblib install as pure-Python
wheels via micropip. The **measured fact** this list encodes:

- **Mesa 3 runs in Pyodide.** Mesa imports `sqlite3` (via `mesa.experimental`); once `sqlite3` is loaded with
  `loadPackage`, Mesa imports and runs. pandas/scipy/networkx are Mesa's (and Ciw's) deps. So the ABM
  scenarios (S02 Schelling, S03 SIR, S05 beer-game) run **live on real Mesa** — not a simplified
  re-implementation. Cold start is ~3–5 s (paid once, in the background; see below); a 20-step 2500-agent
  Mesa run is ~2.3 s, inside the 3 s gate.
- **DES + Monte-Carlo live too.** numpy + simpy for the DES queues, ciw for the M/M/c analytic validation,
  joblib for the Monte-Carlo replications.
- **Native engines never reach here.** OR-Tools (and the GPU libs) are `pure_python=False`; the gate keeps
  them precompute-only, and `simlab/live.py` refuses them as a hard guard, so the lazy `ortools` import is
  never attempted in WASM.

Keeping this closure tight is a deliberate UX lever — every wheel is bytes Pyodide must fetch on cold start.
The heavy/native engines live in `requirements-precompute.txt` / `requirements-gpu.txt` and **never** enter
the browser.

## How a live run works, step by step

1. **Boot** (`init`): `importScripts(PYODIDE_JS_URL)`, then `loadPyodide({ indexURL })`.
2. **Load the closure**: the `loadPackage` + `micropip.install` calls above.
3. **Write the real `simlab` source into the in-browser FS.** The whole `simlab/**/*.py` tree is inlined by
   [`web/copy-data.mjs`](../../web/copy-data.mjs) into one `pyodide/simlab-sources.json`. The worker fetches
   it, writes each file into Pyodide's virtual filesystem (`WRITE_SOURCES`), `sys.path.insert(0, cwd)`,
   `importlib.invalidate_caches()`, then `import simlab.registry` / `import simlab.live`. The browser now
   holds the **exact same engine code** the pipeline ran — not a port.
4. **Run** (`run`): the worker sets `scenario_id`, `params_json`, `seed_val` as globals and executes
   `simlab.live.run_trace_json(...)`, which calls `Scenario.run(coerced, seed) → Trace.to_json()` — the same
   run + serialise path the pipeline uses. The compact JSON comes back across the worker boundary
   (JSON-only; no PyProxy ever crosses threads — see
   [`web/src/lib/pyodideProtocol.ts`](../../web/src/lib/pyodideProtocol.ts)), is `JSON.parse`d, and React
   animates it.

## replay = truth, enforced (`verify`)

Because a run is a pure function of `(params, seed)`, a **live** run must equal the **committed** trace for
the same inputs. The worker's `verify` path re-runs the scenario live and compares its serialised JSON to the
committed trace text:

- **`byte`** — the live JSON string is identical to the committed string. The strong result.
- **`numeric`** — strings differ but `firstNumericDiff` finds no difference beyond a 1e-9 relative tolerance
  on any number (and structures match). Acceptable float-formatting drift.
- **`differ`** — a real divergence; the worker reports `firstDiffPath` + `firstDiffDelta`. This means the lane
  is wrong, and CI/the verify check treats it as a failure.

So live and precomputed render through **one code path**; "live" is slider responsiveness, not a different
model. If they ever diverge, the build catches it.

## Cold start: instant first paint, live after warm-up

Pyodide is a multi-MB download. The client (`pyodideClient.ts`) creates the worker **lazily** — only when the
live lane is first used — so visitors who never run live never pay the download. While Pyodide warms in the
background, the scenario page replays a tiny **committed** trace instantly on first paint; once warm, slider
changes run live. So "enter → straight to a running simulator" holds without blocking on the WASM cold start.
The client exposes a progress subscription (`loading-runtime` → `loading-packages` → `loading-simlab` →
`ready`) so the UI can show the one-time download, and tears the worker down on boot failure so a retry boots
a fresh one.

## NetLogo Web — the alternate live ABM engine

For ABM there is a second live engine that needs **no Pyodide at all**: **NetLogo Web** (the NetLogo language
compiled to JavaScript by the Tortoise runtime). A model is exported to a **self-contained HTML file**
(`web/public/netlogo/…`, e.g. `schelling.html`) that simulates entirely in the browser as native JS — a
smaller cold-start than the WASM runtime, which is why it carries the "enter → a running simulator, instantly"
on-ramp. Each NetLogo card has a twin **Mesa** precompute-and-replay card, so the lesson is *the concept is
engine-independent; NetLogo is for instant play, Python + Mesa is for how to build and trace it yourself*.
NetLogo model licenses are mixed (Code Examples CC0; most Models-Library models CC BY-NC-SA), so the lab
prefers CC0 or authors its own. Full detail:
[../frameworks/07_netlogo-web.md](../frameworks/07_netlogo-web.md).

## Read next

- [06_live-tool-evaluation.md](./06_live-tool-evaluation.md) — the honest record of what is / isn't
  Pyodide-viable, per engine.
- [05_precompute-pipeline.md](./05_precompute-pipeline.md) — the offline lane and where committed traces come
  from.
