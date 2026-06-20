# Architecture — deterministic-replay public simulation viewer

CAOS_SIMLAB is a **static** web product: there is no application server. Every simulation either runs **live
in the visitor's browser** or is **precomputed offline and replayed**. The contract underneath it all: a run
is a pure function of `(params, seed)`, the committed **trace** is the source of truth, and the front end only
animates it — *replay = truth*. Which plane a scenario uses is **measured**, recorded per manifest, and
re-checked by CI, so "live mislabeling" cannot ship.

This folder is the deep architecture wiki. Read it in order, or jump to the file you need.

## The wiki (read in order)

1. [01_overview.md](./architecture/01_overview.md) — the two-plane design, why static (cost, abuse,
   concurrency, reproducibility), and one render path for both producers.
2. [02_determinism-and-trace.md](./architecture/02_determinism-and-trace.md) — `run = f(params, seed)`, the
   single seeded RNG, and the trace schema (`simlab/core/trace.py`) both lanes produce.
3. [03_the-gate.md](./architecture/03_the-gate.md) — the measured live/precompute gate `classify_lane`:
   pure-Python **AND** wheels ⊆ `LIVE_WHEELS` **AND** run < 3 s **AND** trace < ~1 MB, recorded per manifest.
4. [04_live-lane-pyodide.md](./architecture/04_live-lane-pyodide.md) — the Pyodide Web Worker, the wheel
   closure (incl. the measured fact that Mesa runs in Pyodide with `sqlite3`), and NetLogo Web as the alt
   live ABM engine.
5. [05_precompute-pipeline.md](./architecture/05_precompute-pipeline.md) — `simlab.pipeline` → seeded trace +
   manifest, and how the web build consumes them.
6. [06_live-tool-evaluation.md](./architecture/06_live-tool-evaluation.md) — what was tested in-browser per
   engine, what is / isn't Pyodide-viable, and the honest fallback policy.
7. [07_deploy.md](./architecture/07_deploy.md) — GitHub Pages, the deploy workflow, and CI (tests + gate
   enforcement + public-repo guards).

## See also

- [README.md](./README.md) — documentation index.
- [problem-types/](./problem-types/) — the dedicated tool per problem type.
- [frameworks/](./frameworks/) — install / usage / applying per engine.
- [guides.md](./guides.md) — the runtime how-tos: [precompute pipeline](./guides/01_precompute-pipeline.md),
  live lane, GPU lane.
