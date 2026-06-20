# 05 · The precompute pipeline — local `.venv` → seeded trace + manifest

The precompute lane is where the **heavy / native / SOTA** engines run: native solvers (OR-Tools), large-
state ABM (Mesa / Mesa-Geo), crowds (JuPedSim), road graphs (OSMnx), the GPU lane. They run **offline in the
local `.venv`** (no restriction — the local plane runs every engine), and the compact **seeded** trace is
committed; the static site never simulates them at request time, it replays them. Even **live** scenarios get
committed traces — the app replays a tiny one instantly on first paint while Pyodide warms up, and the learner
can compare ≥10 regimes with zero compute. The CLI is [`simlab/pipeline.py`](../../simlab/pipeline.py).

## The same code path serves both lanes

The pipeline runs the **exact** `Scenario.run → Trace` path the browser's `simlab.live` runs. That is
deliberate: it is what makes the live/committed byte-equality check (replay = truth) meaningful — there is
one engine, exercised two ways.

## Running it

```text
python -m simlab.pipeline                 # run every scenario in the registry
python -m simlab.pipeline s01_queue       # run one
python -m simlab.pipeline s06_jobshop --seed 7
```

The local environment installs three layers (live core in `requirements.txt`, dev tooling, and the dedicated
precompute engines in `requirements-precompute.txt`; the GPU lane is separate and CUDA-only). See
[../guides/01_precompute-pipeline.md](../guides/01_precompute-pipeline.md) for setup scripts and the GPU lane.

## What `precompute(scenario_id, seed)` does, per scenario

For each scenario the pipeline iterates **every variant** it declares (the ≥10 preset regimes a learner can
compare side by side — light queue vs near-saturated vs unstable), and for each variant:

1. **Coerce** params (`sc.coerce(var.params)`) — merge with defaults, cast `int` knobs.
2. **Run + time** it:
   ```python
   t0 = time.perf_counter()
   trace = sc.run(params, seed)              # deterministic given (params, seed)
   run_ms = (time.perf_counter() - t0) * 1000.0
   ```
3. **Write the compact trace** and capture its byte size:
   ```python
   rel = Path("data")/"artifacts"/sc.id/f"{var.id}-seed{seed}.json"
   trace_bytes = trace.write(out_root / rel)
   ```
4. **Classify the lane from measurement** with the 4-gate
   ([03_the-gate.md](./03_the-gate.md)):
   ```python
   gate = classify_lane(sc.pure_python, run_ms, trace_bytes, sc.wheels)
   ```
5. **Record** the variant: its bilingual label/note, params, `lane`, the **measured** `gate` block
   (`pure_python`, `run_ms`, `trace_bytes`, `reasons`), KPIs, analytic reference, and the trace path.

Then it builds **one manifest** for the scenario and writes it.

## What it writes

```text
data/artifacts/<scenario_id>/<variant_id>-seed<seed>.json   # one compact seeded trace per variant
manifests/<scenario_id>.json                                # lane, seed, viz, gate thresholds, and every
                                                            # variant with its measured gate + KPIs
```

The manifest (`simlab/core/manifest.py`, `simlab.manifest/v2`) carries the scenario's `viz`
renderer + dimensionality, the `wheel_closure`, the `param_specs` (which become the app's sliders), the
global `gate_thresholds`, and the per-variant list. The scenario `lane` is `"live"` only if **all** variants
cleared the gate; otherwise `"precomputed"`. The app reads the manifest to populate the variant selector and
to know whether to run live or replay; CI reads it to enforce that nothing tagged "live" breaches a gate.

## How the web build consumes it

[`web/copy-data.mjs`](../../web/copy-data.mjs) (the `predev` / `prebuild` hook) overlays `data/artifacts/` +
`manifests/` into the Vite build, and also inlines the `simlab/**/*.py` source into
`pyodide/simlab-sources.json` for the live lane. So `npm run build` ships the committed traces alongside
`dist/`. Deploy is GitHub Pages — committing a new trace and pushing re-publishes the site ("git-as-data").
No backend, no runtime DB. See [07_deploy.md](./07_deploy.md).

## Determinism & honesty rules the pipeline enforces

- **Seed everything.** Every stochastic engine is fed the seeded NumPy generator
  ([02_determinism-and-trace.md](./02_determinism-and-trace.md)); re-running the pipeline must reproduce the
  committed bytes.
- **Never commit raw data.** Road/graph work commits only **rendered geometry** (plain JSON), never raw
  `.graphml` / `.osm` / `.pbf` — CI blocks those extensions (ODbL; see `ATTRIBUTION.md`).
- **Label synthetic vs sourced.** Synthetic scenarios say so; the one real external dataset (OR-Library
  `ft06`, S06) is cited.

## Per-scenario engines (summary)

S01 SimPy + Ciw · S02/S03/S05 Mesa · S04 SimPy · S06 OR-Tools CP-SAT · S07 OR-Tools + SimPy + OSMnx ·
S08 OR-Tools + PyVRP + SimPy · S09 SimPy + NetworkX (closed-form nearest-available dispatch, no OR-Tools) · S10 joblib (+ optional CuPy/Numba) + SciPy ·
S11 OR-Tools GLOP + SimPy. Detail per problem type in [../problem-types/](../problem-types/) and per tool in
[../frameworks/](../frameworks/).

## Read next

- [03_the-gate.md](./03_the-gate.md) — the gate the pipeline applies and records.
- [07_deploy.md](./07_deploy.md) — how committed traces reach GitHub Pages.
