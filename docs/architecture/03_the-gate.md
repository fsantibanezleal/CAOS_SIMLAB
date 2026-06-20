# 03 · The gate — the measured live/precompute decision (`classify_lane`)

A scenario may run **live in the browser** only if a four-part gate holds; failing **any** part forces it to
the **precompute + replay** lane. The gate is not a label a human types — it is computed **from
measurement** by the pipeline and recorded in every manifest, and CI re-checks it. This is what prevents
"live mislabeling" (e.g. tagging an OR-Tools scenario "live" when native code cannot run in WASM).

The gate lives in [`simlab/core/scenario.py`](../../simlab/core/scenario.py) as `classify_lane`.

## The rule (an AND of four conditions)

```
live  iff  pure_python
      AND  wheels ⊆ LIVE_WHEELS
      AND  run_ms < 3000          (GATE_MAX_RUN_MS)
      AND  trace_bytes < 1_000_000 (GATE_MAX_TRACE_BYTES, ~1 MB)
```

```python
GATE_MAX_RUN_MS = 3000.0          # must finish a run in-Worker on a mid laptop in < 3 s
GATE_MAX_TRACE_BYTES = 1_000_000  # animatable trace must be < ~1 MB

LIVE_WHEELS = frozenset({
    "numpy", "simpy", "ciw", "mesa", "pandas", "scipy", "networkx", "sqlite3", "joblib",
})

def classify_lane(pure_python, run_ms, trace_bytes, wheels=()) -> GateResult:
    reasons = []
    if not pure_python:
        reasons.append("not pure-Python (cannot run in Pyodide/WASM)")
    if run_ms > GATE_MAX_RUN_MS:
        reasons.append(f"run {run_ms:.0f}ms > {GATE_MAX_RUN_MS:.0f}ms gate")
    if trace_bytes > GATE_MAX_TRACE_BYTES:
        reasons.append(f"trace {trace_bytes}B > {GATE_MAX_TRACE_BYTES}B gate")
    heavy = sorted(set(wheels) - LIVE_WHEELS)
    if heavy:
        reasons.append(f"needs wheels {heavy} not in the live worker (precompute + replay)")
    lane = "live" if not reasons else "precomputed"
    return GateResult(pure_python, round(float(run_ms), 1), int(trace_bytes), lane, reasons)
```

### 1. `pure_python` — can the engine even import in WASM?

A `Scenario` declares `pure_python: bool`. Native-code engines set it `False`: OR-Tools is C++ with no WASM
build, so S06 (CP-SAT), S07/S08/S09 (Routing) and S11 (GLOP) all carry `pure_python = False` and can never
be live regardless of how fast they are. The same holds for the GPU lane (CUDA). This is the *cheapest*
fail-fast check.

### 2. `wheels ⊆ LIVE_WHEELS` — is the dependency closure loadable in the browser?

Each scenario declares `wheels: list[str]` — the minimal closure its engine needs. A scenario is live only if
**every** wheel is in `LIVE_WHEELS`, the set the browser worker actually loads. `LIVE_WHEELS` is **measured,
not assumed**: it contains `mesa` and `sqlite3` precisely because Mesa 3 was verified to run in Pyodide once
`sqlite3` is loaded via `loadPackage` (cold start ~3 s for numpy+pandas+scipy+networkx+sqlite3+mesa; a
20-step 2500-agent run ~2.3 s, in a real browser). So **ABM runs LIVE on real Mesa, not a stand-in.** A
scenario whose closure includes a heavy/native wheel outside the set (anything OR-Tools, Mesa-Geo, OSMnx,
PyVRP, the GPU libs) is forced to precompute, with the offending wheel named in `reasons`. Examples from the
registry:

| Scenario | `wheels` | `pure_python` | wheels ⊆ LIVE_WHEELS? |
|---|---|---|---|
| S01 queue | `["simpy","ciw","numpy"]` | ✓ | ✓ → live-eligible |
| S02 Schelling | `["numpy","mesa"]` | ✓ | ✓ → live-eligible |
| S10 Monte-Carlo | `["numpy","joblib","scipy"]` | ✓ | ✓ → live-eligible (subject to time/bytes) |
| S06 job-shop | `[]` (OR-Tools) | ✗ | n/a → precompute (fails part 1) |
| S11 mine-haul | `[]` (OR-Tools GLOP) | ✗ | n/a → precompute (fails part 1) |

### 3. `run_ms < 3000` — does a single run finish fast enough?

The pipeline times the actual `scenario.run(params, seed)` wall-clock per variant. If any variant exceeds the
3 s in-Worker budget, the scenario is precomputed. The 3 s number is the threshold for "edit a slider →
animation, with no perceptible stall" on a mid laptop.

### 4. `trace_bytes < ~1 MB` — is the animatable artifact small enough?

`Trace.write` returns the on-disk byte count; if a variant's compact trace exceeds ~1 MB it would be both
slow to ship and slow to animate, so the scenario is precomputed. This is why the trace schema is so
deliberately compact (see [02_determinism-and-trace.md](./02_determinism-and-trace.md)).

## The verdict is recorded, per variant, in the manifest

`GateResult` carries the boolean inputs, the **measured** `run_ms` and `trace_bytes`, the `lane`, and the
list of `reasons` (empty ⇒ live). The pipeline writes that result for **every variant** into the scenario
manifest (`manifests/<id>.json`), under each variant's `gate` block, alongside the global
`gate_thresholds`. A scenario's top-level `lane` is `"live"` only if **all** its variants cleared the gate
(`lanes == {"live"}`); otherwise the whole scenario is `"precomputed"` (see
[`simlab/core/manifest.py`](../../simlab/core/manifest.py) `build_scenario_manifest`).

So the manifest is auditable: it does not merely *assert* a scenario is live — it shows the numbers that made
it live, and if it's precomputed it shows exactly which gate it tripped.

## Defence in depth at the browser boundary

The gate is enforced a second time at runtime. `simlab/live.py`'s `_is_live(sc)` recomputes
`sc.pure_python and set(sc.wheels) <= LIVE_WHEELS`, and `run_trace_json` **raises** if a precompute-only
scenario is ever asked to run live — so even a UI bug cannot reach the lazy `ortools` import inside the WASM
runtime. The UI gates first; this is the hard guard behind it.

## Read next

- [04_live-lane-pyodide.md](./04_live-lane-pyodide.md) — the worker that loads `LIVE_WHEELS` and runs live.
- [05_precompute-pipeline.md](./05_precompute-pipeline.md) — where the gate numbers are produced + recorded.
- [06_live-tool-evaluation.md](./06_live-tool-evaluation.md) — the in-browser tests behind `LIVE_WHEELS`.
