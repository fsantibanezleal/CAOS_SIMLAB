# 03 · Internals — what `precompute(scenario_id, seed)` does

The entry point is `precompute(scenario_id, seed=42, out_root=REPO_ROOT)` in
[`simlab/pipeline.py`](../../../simlab/pipeline.py). It resolves the scenario from the registry, runs and
measures **every variant** it declares, writes a compact trace per variant, classifies each variant's lane
from the measurement, assembles one manifest, and returns a summary dict.

## Why every variant

Each scenario ships a *family* of variants — the `Variant` dataclass in
[`simlab/core/scenario.py`](../../../simlab/core/scenario.py) — typically the preset regimes a learner
compares side by side (a light queue vs a near-saturated one vs an unstable one). Each variant carries
bilingual labels (`label_en` / `label_es`), a one-line `note_*` ("what this variant shows"), and its
parameter dict. The pipeline iterates `sc.variants()` so the app can offer a selector with every regime
already simulated — zero compute on the client to switch regimes.

## The per-variant loop

For each variant the pipeline does five things:

1. **Coerce params** — `params = sc.coerce(var.params)` merges the variant params over the scenario defaults
   and casts `int` knobs (the UI sends floats; `ParamSpec.kind == "int"` knobs are rounded back to `int`).

2. **Run + time** — the deterministic core:
   ```python
   t0 = time.perf_counter()
   trace = sc.run(params, seed)              # deterministic given (params, seed)
   run_ms = (time.perf_counter() - t0) * 1000.0
   ```
   `sc.run` returns a `Trace`; this is the **exact** call the browser's live lane makes, which is what makes
   the byte-equality check (replay = truth) meaningful.

3. **Write the compact trace + capture its size**:
   ```python
   rel = Path("data")/"artifacts"/sc.id/f"{var.id}-seed{seed}.json"
   trace_bytes = trace.write(out_root / rel)
   ```
   `Trace.write` ([`simlab/core/trace.py`](../../../simlab/core/trace.py)) serialises with compact separators
   (`","`, `":"`) — small bytes matter because the byte count feeds the gate — and returns the file size.

4. **Classify the lane from measurement** — `classify_lane(sc.pure_python, run_ms, trace_bytes, sc.wheels)`.

5. **Record the variant** — id, bilingual labels/notes, coerced params, the computed `lane`, the **measured**
   `gate` block (`pure_python`, `run_ms`, `trace_bytes`, `reasons`), the trace's `kpis` and `analytic`
   reference, and the relative trace path (with `\` normalised to `/` for cross-platform manifests).

Then it builds **one manifest** for the scenario (`build_scenario_manifest`) and writes it
(`write_manifest`).

## The gate (applied here, defined per the gate node)

`classify_lane` is an **AND** rule — a variant is `live` only if *all four* hold, otherwise it is forced to
`precomputed` and the failing conditions are recorded as human-readable `reasons`:

| Condition | Threshold | Source |
|---|---|---|
| pure-Python | `Scenario.pure_python is True` | native engines (OR-Tools) set this `False` → always precompute |
| fast | `run_ms ≤ GATE_MAX_RUN_MS` (`3000` ms) | measured in step 2 |
| small | `trace_bytes ≤ GATE_MAX_TRACE_BYTES` (`1_000_000`) | measured in step 3 |
| live wheels | `set(wheels) ⊆ LIVE_WHEELS` | the scenario's wheel closure must be loadable in Pyodide |

`LIVE_WHEELS` is the **measured** set the Pyodide worker can load:
`{numpy, simpy, ciw, mesa, pandas, scipy, networkx, sqlite3, joblib}`. Notably `mesa` is in it — Mesa 3 was
verified to run in Pyodide (cold start ~3 s for the numpy+pandas+scipy+networkx+sqlite3+mesa closure; a
20-step 2500-agent run ~2.3 s), so the ABM scenarios run **live on real Mesa**, not a stand-in. Only native
engines (OR-Tools, C++/no WASM) stay precompute-only. The deep treatment is in
[../architecture/03_the-gate.md](../../architecture/03_the-gate.md).

The scenario-level lane is then derived in `build_scenario_manifest`: `"live"` only if **all** variants
cleared the gate (`lanes == {"live"}`), otherwise `"precomputed"`.

## The manifest it assembles

`build_scenario_manifest` ([`simlab/core/manifest.py`](../../../simlab/core/manifest.py), schema
`simlab.manifest/v2`) wraps the variant list with the scenario metadata the app and CI need:

- `id`, `title`, `method`, `tier`, `engine`, `seed`
- `viz` — `{renderer, dimensionality}` (drives which player component renders the trace)
- `wheel_closure` — the live wheels this scenario would need
- `param_specs` — the tunable knobs, which become the app's sliders/steppers
- `lane` — the scenario-level verdict
- `gate_thresholds` — `{max_run_ms, max_trace_bytes}` echoed so the manifest is self-describing
- `variants` — the per-variant records from the loop (each with its measured `gate`)

The app reads the manifest to populate the variant selector and to know whether to run live or replay; **CI
reads it to enforce that nothing tagged `live` actually breaches a gate.**

## The trace schema

A `Trace` (schema `simlab.trace/v1`) is the single artifact both lanes produce and the player consumes:
`scenario`, `title`, `method`, `seed`, `params`, `kpis`, an optional `analytic` reference (for validation
scenarios like S01's Erlang-C), and a `timeline` of `{t, kind, ...payload}` events the front end animates.
Because the same object comes out of a live Pyodide run and an offline pipeline run, **one render path serves
both lanes** — see [../architecture/02_determinism-and-trace.md](../../architecture/02_determinism-and-trace.md).

## How the web build consumes it

[`web/copy-data.mjs`](../../../web/copy-data.mjs) is the `predev` / `prebuild` hook. It:

1. Copies `data/artifacts/` → `web/public/data/artifacts/` and `manifests/` → `web/public/manifests/` so the
   dev server and local build serve the committed traces. (In CI the Pages workflow overlays the same files
   into `dist/` directly.)
2. Inlines every `simlab/**/*.py` source into `web/public/pyodide/simlab-sources.json` (posix keys), which the
   Pyodide live lane writes into the in-browser filesystem and `import simlab` — so the browser runs the
   **exact same engine code** the pipeline ran.

Deploy is GitHub Pages: committing a new trace and pushing re-publishes the site ("git-as-data"). No backend,
no runtime DB. The deploy chain is in [../architecture/07_deploy.md](../../architecture/07_deploy.md).

Next: [04_outputs.md](./04_outputs.md) — the exact files on disk.
