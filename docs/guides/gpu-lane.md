# Guide — the GPU lane (optional, local-only)

GPU acceleration is an **optional, local-only precompute exhibit** — never a hard dependency and never on
the deploy path (the site is static; the contract is the committed trace, not the GPU). It exists to teach
*when GPU actually helps*, with an honest answer.

## The honest verdict (teach this, don't oversell it)

GPUs help two shapes that appear in this lab, and hurt a third:

| Workload | GPU? | Why |
|---|---|---|
| **Thousands of independent Monte-Carlo replications** | ✅ big win | embarrassingly parallel; each thread owns a seeded RNG stream |
| **Large-N ABM** (1e5–1e6 lightweight agents) | ✅ win | parallel arithmetic over many agents |
| **Small-N event-loop DES** (a queue, an ED) | ❌ *slower* | async, branch-heavy event scheduling fights the SIMT model |

Do **not** show a GPU "speedup" on a small queueing DES — it would be slower and misteach. The GPU lane is
scoped to the **S10 Monte-Carlo / CI study** (run thousands of seeded replications in parallel), which is
also the "When does GPU actually help?" teaching page.

## Install (only on a CUDA machine)

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-gpu.txt
```

Pinned, verified on an **RTX 4070 Laptop (8 GB, CUDA 12)** on 2026-06-19:
`cupy-cuda12x==14.1.1` · `numba==0.65.1` · `taichi==1.7.4` · `jax==0.10.2`.

If CuPy warns `CUDA path could not be detected`, set `CUDA_PATH` to your CUDA 12 toolkit; device detection
(`cupy.cuda.runtime.getDeviceCount()`) may still succeed for basic ops.

## CUDA-detect with CPU fallback (mandatory)

Every GPU pipeline must run for GPU-less learners. The pattern, used in
[docs/frameworks/cupy/](../frameworks/cupy/) and [docs/frameworks/numba/](../frameworks/numba/):

```python
try:
    import cupy as xp
    _ = xp.cuda.runtime.getDeviceCount()      # raises if no CUDA
    backend = "gpu"
except Exception:
    import numpy as xp                          # transparent CPU fallback
    backend = "cpu"
```

For Numba CUDA, guard kernels with `numba.cuda.is_available()`; for the CPU path use the `joblib` replication
engine ([docs/frameworks/joblib/](../frameworks/joblib/)) — the v1 default that ships even without a GPU.

## Reproducibility

GPU thread-scheduling is non-deterministic across runs; fix the seed **per replication** (xoroshiro128p
states for Numba, cuRAND for CuPy) and snapshot deterministic state into the committed trace so the result
is reproducible from the repo on any machine, with or without a GPU.

## Reference-only (not installed here)

`FLAME GPU 2` (million-agent GPU-ABM; AGPL-3.0; no PyPI wheel — conda/source + CUDA only) and `ABMax`
(JAX-ABM; pip install fails on Windows via an orbax path-length error) are documented as a chapter in
[docs/frameworks/gpu-abm-chapter/](../frameworks/gpu-abm-chapter/), not shipped as pipelines.
