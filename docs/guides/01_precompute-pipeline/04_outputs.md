# 04 · Outputs — exactly what lands on disk

A pipeline run produces (or refreshes) three kinds of artifact. All paths are repo-relative; the pipeline
takes `out_root` (defaulting to the repo root) so it can also write to a scratch tree in tests.

## 1. The per-variant traces

```text
data/artifacts/<scenario_id>/<variant_id>-seed<seed>.json
```

One compact JSON trace per variant. The filename encodes the seed, so different seeds coexist instead of
overwriting. The file is written with compact separators (no spaces) to keep bytes small — the byte count is
what the gate measures.

Shape (`simlab.trace/v1`, from [`simlab/core/trace.py`](../../../simlab/core/trace.py)):

```json
{
  "schema": "simlab.trace/v1",
  "scenario": "s01_queue",
  "title": "...",
  "method": "DES",
  "seed": 42,
  "params": { "...": 0 },
  "kpis": { "...": 0 },
  "analytic": { "...": 0 },
  "timeline": { "t_end": 0.0, "events": [ { "t": 0.0, "kind": "arrival" } ] }
}
```

- `params` — the coerced params for this exact run.
- `kpis` — the headline numbers the app shows.
- `analytic` — an optional closed-form / second-engine reference (e.g. S01 carries the Erlang-C reference
  plus a Ciw replication check); empty for scenarios without one.
- `timeline.events` — the `{t, kind, ...payload}` stream the player animates; `t_end` is the last event time.

## 2. The per-scenario manifest

```text
manifests/<scenario_id>.json
```

One manifest per scenario (`simlab.manifest/v2`, from
[`simlab/core/manifest.py`](../../../simlab/core/manifest.py)). It is the auditable keystone: it carries the
scenario metadata, the `viz` binding, the live `wheel_closure`, the `param_specs` (which become the app's
sliders), the global `gate_thresholds`, the scenario-level `lane`, and the full `variants` list. Each variant
record includes its bilingual labels/notes, params, computed `lane`, the **measured** `gate` block
(`pure_python`, `run_ms`, `trace_bytes`, `reasons`), its `kpis` and `analytic`, and the relative `trace` path.

Sketch:

```json
{
  "schema": "simlab.manifest/v2",
  "id": "s01_queue",
  "title": "...", "method": "DES", "tier": 1, "engine": "simpy", "seed": 42,
  "viz": { "renderer": "queue-network", "dimensionality": "2d" },
  "wheel_closure": ["simpy", "ciw", "numpy"],
  "param_specs": [ { "key": "...", "label": "...", "default": 0, "min": 0, "max": 0, "step": 1, "kind": "int" } ],
  "lane": "live",
  "gate_thresholds": { "max_run_ms": 3000.0, "max_trace_bytes": 1000000 },
  "variants": [
    {
      "id": "light", "label_en": "...", "label_es": "...", "note_en": "...", "note_es": "...",
      "params": { "...": 0 },
      "lane": "live",
      "gate": { "pure_python": true, "run_ms": 12.3, "trace_bytes": 45678, "reasons": [] },
      "kpis": { "...": 0 }, "analytic": { "...": 0 },
      "trace": "data/artifacts/s01_queue/light-seed42.json"
    }
  ]
}
```

A `precomputed` variant carries non-empty `reasons` explaining why — e.g.
`"not pure-Python (cannot run in Pyodide/WASM)"`, `"run 4200ms > 3000ms gate"`,
`"trace 1500000B > 1000000B gate"`, or
`"needs wheels ['ortools'] not in the live worker (precompute + replay)"`.

## 3. The Pyodide source bundle (build-time, in `web/public`)

```text
web/public/pyodide/simlab-sources.json
```

Produced not by the pipeline but by the web build hook [`web/copy-data.mjs`](../../../web/copy-data.mjs). It
inlines every `simlab/**/*.py` (posix keys, `__pycache__` skipped) into one JSON the live lane writes to the
in-browser filesystem so it can `import simlab` and run the **same** engine code. The same hook also copies
`data/artifacts/` and `manifests/` into `web/public/` for the dev server.

## Schema versions (bump when the shape changes)

| Artifact | Schema id | Source |
|---|---|---|
| Trace | `simlab.trace/v1` | `simlab/core/trace.py` |
| Manifest | `simlab.manifest/v2` | `simlab/core/manifest.py` |

## What to commit

Commit `data/artifacts/` and `manifests/` **together** after a run — they are the deployable artifact
("git-as-data"). Do **not** commit raw upstream data (`.graphml`/`.osm`/`.pbf`); see
[05_gotchas.md](./05_gotchas.md).

Next: [05_gotchas.md](./05_gotchas.md) — the determinism & honesty rules and the practical traps.
