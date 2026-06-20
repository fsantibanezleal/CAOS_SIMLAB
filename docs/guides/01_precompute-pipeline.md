# 01 · The precompute pipeline — local `.venv` → committed trace → replay

This is the heart of CAOS_SIMLAB's reproducibility contract: **a run is a pure function of `(params, seed)`,
so the committed trace IS the source of truth and the web app only replays it** ("replay = truth"). Heavy
scenarios — native solvers (OR-Tools), large-state ABM (Mesa / Mesa-Geo), crowds (JuPedSim), road graphs
(OSMnx), the GPU lane — are computed **offline in the local `.venv`** and the compact seeded trace is
committed; the static site never simulates them at request time. The CLI is
[`simlab/pipeline.py`](../../simlab/pipeline.py).

The same `Scenario.run → Trace` code path serves both lanes, which is what makes the live/committed
byte-equality check meaningful — there is one engine, exercised two ways. Even **live** scenarios get
committed traces: the app replays a tiny one instantly on first paint while Pyodide warms up, and the learner
can compare every regime with zero compute.

## This node (read in order)

1. [01_setup.md](./01_precompute-pipeline/01_setup.md) — create the local `.venv` (Python 3.13) and install
   the three dependency layers (live core · dev · the dedicated precompute engines). The optional GPU lane is
   installed separately, CUDA-only.
2. [02_running-the-pipeline.md](./01_precompute-pipeline/02_running-the-pipeline.md) — the CLI: run one
   scenario or the whole registry, pin the seed, and read the JSON summary it prints.
3. [03_internals.md](./01_precompute-pipeline/03_internals.md) — what `precompute(scenario_id, seed)` does
   per variant (coerce → run+time → write trace → classify the lane → record), the manifest it assembles, the
   trace schema, and how the web build consumes both.
4. [04_outputs.md](./01_precompute-pipeline/04_outputs.md) — exactly what lands on disk: the per-variant trace
   files, the per-scenario manifest, the `simlab-sources.json` bundle, and the schema versions.
5. [05_gotchas.md](./01_precompute-pipeline/05_gotchas.md) — the determinism & honesty rules the pipeline
   enforces (seed everything, never commit raw data, label synthetic vs sourced) and the practical traps
   (BOM/encoding, stale traces, the live/precompute mislabel guard).

## Quick start

```powershell
# Windows / PowerShell
.\scripts\setup.ps1                  # .venv (3.13) + core + dev + precompute engines
.\scripts\precompute.ps1 s01_queue   # run one scenario; omit the id to run them all
```
```bash
# macOS / Linux / Git-Bash
./scripts/setup.sh
./scripts/precompute.sh s01_queue
```

## What it produces (at a glance)

```text
data/artifacts/<scenario_id>/<variant_id>-seed<seed>.json   # one compact seeded trace per variant
manifests/<scenario_id>.json                                # lane, seed, viz, gate thresholds, every
                                                            # variant with its MEASURED gate + KPIs
```

## See also

- [../guides.md](../guides.md) — the guides section index (this node, the live lane, the GPU lane).
- [02_live-lane-pyodide.md](./02_live-lane-pyodide.md) — the in-browser lane the committed traces are checked
  against (replay = truth).
- [03_gpu-lane.md](./03_gpu-lane.md) — the optional, local-only GPU exhibit and CPU fallback.
- [../architecture/05_precompute-pipeline.md](../architecture/05_precompute-pipeline.md) — the same pipeline
  in the deep architecture wiki, with the gate and trace cross-references.
- [../architecture/03_the-gate.md](../architecture/03_the-gate.md) — the measured live/precompute gate the
  pipeline applies and records.
