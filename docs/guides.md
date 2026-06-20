# Guides — the runtime how-tos (section index)

The three operational guides for CAOS_SIMLAB's two-plane design: how the heavy engines run **offline** and
commit a seeded trace, how the light engines run **live** in the browser, and the optional **GPU** exhibit.
The contract underneath all of them: a run is a pure function of `(params, seed)`, the committed trace is the
source of truth, and the front end only animates it — *replay = truth*.

## The guides

1. [**Precompute pipeline**](./guides/01_precompute-pipeline.md) — local `.venv` → seeded trace → replay. A
   deep node: [setup](./guides/01_precompute-pipeline/01_setup.md) ·
   [running it](./guides/01_precompute-pipeline/02_running-the-pipeline.md) ·
   [internals](./guides/01_precompute-pipeline/03_internals.md) ·
   [outputs](./guides/01_precompute-pipeline/04_outputs.md) ·
   [gotchas](./guides/01_precompute-pipeline/05_gotchas.md).
2. [**Live lane (Pyodide)**](./guides/02_live-lane-pyodide.md) — SimPy/Mesa in the browser via a Pyodide Web
   Worker; the byte-equality check that makes replay = truth.
3. [**GPU lane**](./guides/03_gpu-lane.md) — optional, local-only CuPy/Numba/Taichi/JAX exhibit with mandatory
   CPU fallback; the honest "when does a GPU actually help" verdict.

## See also

- [README.md](./README.md) — documentation home + the scenario → tool map.
- [architecture.md](./architecture.md) — the deterministic-replay, two-plane design and the measured gate.
- [frameworks.md](./frameworks.md) — install / usage / applying per engine.
- [problem-types/](./problem-types/) — the dedicated tool per problem type.
