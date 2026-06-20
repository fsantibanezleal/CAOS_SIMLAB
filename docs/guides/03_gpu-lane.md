# 03 · Guide — the GPU lane (optional, local-only)

GPU acceleration in CAOS_SIMLAB is an **optional, local-only precompute exhibit** — never a hard dependency
and never on the deploy path. The served site is static; the contract it ships is the **committed
deterministic trace**, not the GPU that may (or may not) have produced it. The lane exists to teach one thing
honestly: *when a GPU actually helps a simulation, and when it does not.*

This node is the **lane contract** — the policy every GPU framework in the lab obeys. The per-framework
installs, APIs, and runnable examples live in the framework nodes
([CuPy](../frameworks/15_cupy.md) · [Numba](../frameworks/14_numba.md) ·
[Taichi](../frameworks/16_taichi.md) · [JAX](../frameworks/17_jax.md)); this guide is the shared rule they
point back to.

## The honest verdict (teach this, don't oversell it)

GPUs help two workload shapes that appear in this lab, and *hurt* a third:

| Workload | GPU? | Why |
|---|---|---|
| **Thousands of independent Monte-Carlo replications** | ✅ big win | embarrassingly parallel; each thread owns a seeded RNG stream |
| **Large-N ABM / regular-grid CA** (1e5–1e6 lightweight agents or cells) | ✅ win | parallel arithmetic over many agents/cells |
| **Small-N event-loop DES** (a queue, an ED) | ❌ *slower* | async, branch-heavy event scheduling fights the SIMT model |

Do **not** show a GPU "speedup" on a small queueing DES — it would be slower and would misteach. The GPU lane
is scoped to the **S10 Monte-Carlo / CI study** (run thousands of seeded replications in parallel), which is
also the lab's "When does GPU actually help?" teaching page
([Monte-Carlo & Replications](../problem-types/04_monte-carlo-replications.md)). The research punchline:
**replications, not population size, is the high-ROI parallel workload here.**

## Read in order

1. [`./03_gpu-lane/01_setup.md`](./03_gpu-lane/01_setup.md) — installing the lane on a CUDA machine: the
   `requirements-gpu.txt` set, the exact verified pins, and the CUDA-detect probe so the lane is a no-op on a
   GPU-less box.
2. [`./03_gpu-lane/02_run.md`](./03_gpu-lane/02_run.md) — running the lane: which scenario uses it (S10), the
   CPU default vs the GPU appendix, and what the run actually commits (a small reduced summary, not the GPU).
3. [`./03_gpu-lane/03_internals.md`](./03_gpu-lane/03_internals.md) — the mandatory CUDA-detect-with-CPU-fallback
   pattern, per-framework wiring (CuPy / Numba / Taichi / JAX), and the per-replication seeding rule that keeps
   a committed trace reproducible with or without a GPU.
4. [`./03_gpu-lane/04_gotchas.md`](./03_gpu-lane/04_gotchas.md) — the traps (transfer overhead, JIT-header
   requirement, VRAM ceiling, non-determinism) and the **reference-only** heavy-ABM engines that are documented
   but deliberately not installed.

## Where the lab uses it

- **Scenario:** [S10 — Monte-Carlo & Replications](../problem-types/04_monte-carlo-replications.md) — the only
  scenario wired to the GPU lane. Its **default** driver is CPU [joblib](../frameworks/12_joblib.md); the GPU
  path is the optional "and here is the GPU version" appendix.
- **Default CPU engines for the same study:** [joblib](../frameworks/12_joblib.md) (the v1 driver) +
  [SciPy stats](../frameworks/13_scipy-stats.md) (the CI / test math on the reduced array).
- **Reference chapter (not shipped):** [Heavy / GPU ABM](../frameworks/18_gpu-abm-chapter.md) — million-agent
  engines (FLAME GPU 2 · ABMax · AMBER) documented, deliberately not installed.

## See also

- [Precompute pipeline](./01_precompute-pipeline.md) — the offline `.venv` → committed trace → replay engine the
  GPU lane plugs into (the GPU only ever produces a trace; it is never on the deploy path).
- [Live lane (Pyodide)](./02_live-lane-pyodide.md) — the in-browser runtime, which can *never* run any GPU
  framework; the GPU lane is strictly its offline counterpart.
- [docs/README.md](../README.md) — documentation home + the scenario → tool map.
