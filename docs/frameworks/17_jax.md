# 17 · JAX — the vectorized Monte-Carlo / batched-ABM primitive

**JAX** (`jax`, v0.10.2, Apache-2.0) is Google's array library: a NumPy-compatible
API plus composable function transformations — `jit` (compile), `vmap`
(auto-vectorize), `grad` (autodiff), `pmap` (multi-device) — lowered to native code
through the **XLA** compiler. You write a computation once for a *single* element
as a pure function, `vmap` rewrites it to run over a whole batched axis with no
Python loop, and `jit` fuses the whole thing into one compiled kernel. Its RNG is
**explicit and splittable** (no global state), so `n` independent, non-overlapping
streams come from one `random.split` — exactly the property a replication study
needs. The same source runs unchanged on CPU, GPU or TPU; only the wheel changes.

In CAOS_SIMLAB, JAX is a **vectorization primitive for the offline precompute
lane**, used in the *vectorized ABM / Monte-Carlo context* — **not** a simulation
engine, and **never** a runtime dependency of the served web app. The flagship
value of this lab is small-N didactic clarity (queueing DES, emergent ABM) where a
GPU is pointless; JAX earns its place as the **documented vectorized-functional
alternative** to the [S10 Monte-Carlo](../problem-types/04_monte-carlo-replications.md)
GPU exhibit — "thousands of independent seeded replications → mean + CI" written as
`jit(vmap(one_replication))`, runnable on the **CPU backend** today and on GPU/TPU
unchanged. The default v1 replication driver is still CPU [joblib](./12_joblib.md);
JAX precomputes artifacts locally, commits the compact trace, and the browser
replays it statically (it cannot run XLA). Pick JAX when — and only when — the work
is genuinely *vectorized array arithmetic over many independent elements* and you
value backend portability or future differentiability. For event-loop DES,
combinatorial optimisation, or object-per-agent models, a CPU tool is the better
choice (see [`./17_jax/03_applying.md`](./17_jax/03_applying.md) §4).

## Read in order

1. [`./17_jax/01_installation.md`](./17_jax/01_installation.md) — exact pin
   (`jax[cpu]==0.10.2`, matched `jaxlib`), the `requirements-gpu` /
   `requirements-precompute` lane, the dependency tree (`jaxlib`, `numpy`, `scipy`,
   `ml_dtypes`, `opt_einsum`), the sanity check, and the platform / CUDA notes
   (CPU-clean on Windows, x64 opt-in, first-call compile, and the **ABMax** wheel
   that fails on Windows).
2. [`./17_jax/02_usage.md`](./17_jax/02_usage.md) — the four concepts that matter
   (`jax.numpy`, splittable `jax.random`, `vmap`, `jit`/`static_argnums`), the
   worked example walked through step by step, and its **real captured output**.
3. [`./17_jax/03_applying.md`](./17_jax/03_applying.md) — how to *formalize* the
   "estimate `E[g(X)]` with a CI" problem and solve it with the
   vectorize-then-replicate pattern, which lab scenarios touch JAX, the honest GPU
   trade-offs, and the pick-vs-alternatives table.

## Run the example

```bash
.venv/Scripts/python.exe docs/frameworks/17_jax/example.py
```

[`./17_jax/example.py`](./17_jax/example.py) estimates `P(Gamma(5,1) > 8)` from
**200,000** independent `jit(vmap(...))` replications on the CPU backend and checks
the estimate (`0.100425`, 95% CI `[0.099108, 0.101742]`) against the analytic truth
(`0.099632`) — the smallest honest demo of why JAX exists here: many independent
replications → mean + verifiable CI, as one fused kernel with no Python loop.

## How the lab uses it

- **Scenario:** [S10 — Monte-Carlo & Replications](../problem-types/04_monte-carlo-replications.md)
  (the only scenario JAX touches; its default driver is CPU joblib, JAX is the
  documented vectorized-functional alternative to the GPU exhibit).
- **Lane contract:** [GPU-lane guide](../guides/03_gpu-lane.md) — local-only,
  precompute-only, CPU-fallback; off the live web path and the VPS / Pages deploy.

## Siblings & alternatives

- **CPU default for the same study:** [joblib](./12_joblib.md) (the v1 default) +
  [SciPy stats](./13_scipy-stats.md) for the CI math.
- **Other GPU-lane exhibits:** [CuPy](./15_cupy.md) (drop-in NumPy on cuRAND),
  [Numba](./14_numba.md) (custom per-thread CUDA kernels), [Taichi](./16_taichi.md)
  (portable field / grid kernels).
- **The teaching engines JAX never replaces:** [Mesa](./04_mesa.md) (ABM),
  [SimPy](./01_simpy.md) / [Ciw](./02_ciw.md) (DES), [OR-Tools](./08_ortools.md)
  (optimisation).
- **Large-N GPU-ABM (reference chapter, not shipped):**
  [FLAME GPU 2 / ABMax / AMBER](./18_gpu-abm-chapter.md).

*Part of the CAOS_SIMLAB teaching repo — <https://github.com/fsantibanezleal/CAOS_SIMLAB>.*
