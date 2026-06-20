# 02 · Run — using the GPU lane (S10 only)

The GPU lane is wired to exactly **one** scenario: **S10 — Monte-Carlo & Replications**
([problem type](../../problem-types/04_monte-carlo-replications.md)). Every other scenario is small-N or
event-loop-shaped, where a GPU is pointless or actively slower (see the
[honest verdict](../03_gpu-lane.md#the-honest-verdict-teach-this-dont-oversell-it)), so the lane stays scoped
to S10 on purpose.

## CPU is the default; the GPU is the appendix

S10's *default* driver is **CPU [joblib](../../frameworks/12_joblib.md)** — K seeded replications fanned across
CPU cores and reduced to a mean with a 95% CI, compared against the closed-form Erlang-C reference. That CPU
path is what `scripts/setup` installs, what the pipeline runs out of the box, and what produces the committed
trace on any machine.

The GPU lane re-expresses the *same* embarrassingly-parallel replication batch on the device:

- [CuPy](../../frameworks/15_cupy.md) — the replications drawn and reduced as **array columns** in GPU memory,
  returning only the small summary.
- [Numba](../../frameworks/14_numba.md) — the replication inner loop as a hand-written `@cuda.jit` kernel, each
  thread carrying its own `xoroshiro128p` RNG stream (with an exact `@njit` CPU twin for comparison).
- [JAX](../../frameworks/17_jax.md) — the documented vectorized-functional alternative,
  `jit(vmap(one_replication))`, runnable on the CPU backend today and GPU/TPU where present.

The GPU version is the "and here is the GPU version" exhibit, not a replacement for the CPU default.

## Running it

The lane runs through the ordinary precompute pipeline — there is no separate GPU entry point. From the repo
root:

```powershell
.\scripts\precompute.ps1 s10_montecarlo
.\.venv\Scripts\python.exe -m simlab.pipeline s10_montecarlo --seed 7
```

When the GPU wheels are installed and CUDA is visible, the GPU path engages behind the detection probe (see
[03 · Internals](./03_internals.md)); when they are not, the identical run produces the identical result on the
CPU fallback. The pipeline mechanics — variant iteration, lane classification, manifest writing — are exactly
those described in the [precompute pipeline guide](../01_precompute-pipeline.md).

## What the run commits

The artifact is **not** the GPU and **not** the raw replication draws. The device draws thousands of seeded
replications and reduces them to a **small summary** — a mean and a 95% confidence interval — and *that* tiny
reduced result is what becomes the committed replay artifact:

```
data/artifacts/s10_montecarlo/<variant_id>-seed<seed>.json   # the reduced summary (mean + CI), per variant
manifests/s10_montecarlo.json                                # lane, seed, params, KPIs, analytic reference
```

The static site replays that committed summary; it never re-runs the replications, and it certainly never
touches a GPU. This is the whole point of the lane: the GPU is an *offline accelerator for producing a trace*,
fully inside the [precompute pipeline](../01_precompute-pipeline.md) — never a runtime dependency, never on the
deploy path.

## When (not) to reach for it

Reach for the GPU lane only when the parallel arithmetic — thousands of replications, millions of draws —
genuinely dwarfs the host↔device transfer and launch overhead. For a small event-loop DES, the CPU already
delivers the didactic lesson *and* is faster. The lane proves the code is GPU-ready and that the scaling
crossover is real; it is never a correctness requirement.

## Next

- [03 · Internals](./03_internals.md) — how the CPU/GPU selection and per-replication seeding actually work.
- [04 · Gotchas](./04_gotchas.md) — the traps that bite when you turn the GPU path on.
