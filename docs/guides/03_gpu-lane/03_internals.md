# 03 · Internals — CPU-fallback pattern, wiring & reproducibility

This is the machinery behind the lane contract: how a GPU pipeline runs unchanged for a GPU-less learner, how
each framework plugs in, and how a stochastic GPU run still yields a trace that is **bit-reproducible from the
repo** on any machine.

## CUDA-detect with CPU fallback (mandatory)

Every GPU pipeline in the lab **must** run for a learner with no GPU. The rule is non-negotiable: a GPU path is
always guarded by a runtime detection probe, and the CPU branch is the real, shipping default — not a stub. The
canonical array-style pattern (used by [CuPy](../../frameworks/15_cupy.md)):

```python
try:
    import cupy as xp
    _ = xp.cuda.runtime.getDeviceCount()      # raises if no CUDA
    backend = "gpu"
except Exception:
    import numpy as xp                          # transparent CPU fallback
    backend = "cpu"
```

Because CuPy mirrors the NumPy API, a single Monte-Carlo function parameterised on `xp` runs unchanged on
whichever module was bound — the *same source*, two backends.

## Per-framework wiring

| Framework | GPU guard | CPU fallback path | RNG |
|---|---|---|---|
| [CuPy](../../frameworks/15_cupy.md) | `cupy.cuda.runtime.getDeviceCount()` in a `try/except` | bind `xp = numpy` | cuRAND-backed `default_rng` |
| [Numba](../../frameworks/14_numba.md) | `numba.cuda.is_available()` guards the `@cuda.jit` kernel | the `@njit` CPU kernel (identical arithmetic) | `xoroshiro128p` per-thread state |
| [Taichi](../../frameworks/16_taichi.md) | `ti.init(arch=ti.cuda)` vs `ti.init(arch=ti.cpu)` | `arch=ti.cpu` (the lab default) | seeded field init |
| [JAX](../../frameworks/17_jax.md) | wheel auto-selects device | the CPU backend of the same wheel | splittable `random.split` (explicit, no global state) |

For the pure-CPU default of the same study, the lane hands off to the
[joblib](../../frameworks/12_joblib.md) replication engine — the v1 driver that ships even without a GPU — and
[SciPy stats](../../frameworks/13_scipy-stats.md) for the confidence-interval math on the reduced array.

## Reproducibility (the seeding rule)

GPU thread-scheduling is **non-deterministic across runs**: the order threads finish, and the order their
partial results reduce, is not guaranteed. The lab neutralises this by seeding **per replication**, not
per run:

- **Numba:** one `xoroshiro128p` state per thread/replication, derived from the run seed.
- **CuPy:** cuRAND seeded so each replication column is an independent, fixed stream.
- **JAX:** `random.split` produces `n` independent, non-overlapping keys from the one run key — exactly the
  property a replication study needs.

Each replication is therefore a pure function of `(params, replication_seed)`, independent of scheduling. The
deterministic reduced state (mean + CI) is snapshotted into the committed trace, so the result reproduces from
the repo on any machine — **with or without a GPU**. This is the GPU-lane corollary of the lab-wide
`run = f(params, seed)` reproducibility contract described in the
[precompute pipeline guide](../01_precompute-pipeline.md).

## Why the GPU never reaches the deploy path

The detection probe and CPU fallback exist so the *codebase* runs everywhere; the seeding rule exists so the
*trace* is identical everywhere. Together they mean the GPU is only ever an offline trace-producer: the served
static site replays the committed reduced summary and never imports a GPU framework. See
[02 · Run](./02_run.md) for what that committed summary contains.

## Next

- [04 · Gotchas](./04_gotchas.md) — the platform and performance traps these internals have to survive.
- [01 · Setup](./01_setup.md) — the pins and the install these guards sit on top of.
