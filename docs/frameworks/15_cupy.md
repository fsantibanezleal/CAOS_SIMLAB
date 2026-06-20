# 15 · CuPy — NumPy/SciPy on the GPU (optional Monte-Carlo exhibit)

**CuPy is NumPy & SciPy for the GPU**: the exact same array API (`arange`, `sum`, `histogram`, ufuncs,
broadcasting, a cuRAND-backed `default_rng`), but the arrays live in GPU memory and the arithmetic executes on
thousands of CUDA cores in parallel. The appeal is that code written for `xp = numpy` runs unchanged for
`xp = cupy` — so a single Monte-Carlo function, parameterised on the array module, runs on whichever backend is
available. CuPy is **MIT-licensed**, pinned here at `cupy-cuda12x==14.1.1`.

In CAOS_SIMLAB, CuPy is an **optional GPU exhibit, never a runtime dependency**. It lives only in the
[`gpu` requirements lane](../guides/03_gpu-lane.md) — out of the browser/Pyodide live lane and off the VPS/Pages
deploy path — behind a **CUDA-detect-with-CPU-fallback** probe, so a GPU-less learner can clone and run the
whole lab unchanged. The one scenario that uses it is **S10 (Monte-Carlo CI Study)**, where the *default*
driver is CPU [joblib](./12_joblib.md) and CuPy is the "and here's the GPU version" appendix: the same batch of
thousands of seeded replications, drawn and reduced as array columns on the device, returning only a small
summary (mean + 95% CI) that becomes the committed replay artifact. Reach for it only when the parallel
arithmetic (millions of draws / thousands of replications) genuinely dwarfs the host↔device transfer — for a
small event-loop DES a GPU is *slower*, and the CPU already delivers the didactic lesson. CuPy proves the code
is GPU-ready and the scaling crossover is real; it is never a correctness requirement.

## Read in order

1. [`./15_cupy/01_installation.md`](./15_cupy/01_installation.md) — exact pin (`cupy-cuda12x==14.1.1`), the
   `requirements-gpu.txt` lane, transitive deps (`numpy`, `cuda-pathfinder`), and the platform / CUDA caveats
   (CUDA-12 wheels, the `CUDA path could not be detected` warning, the "headers required for kernel JIT" trap,
   the 8 GB VRAM ceiling).
2. [`./15_cupy/02_usage.md`](./15_cupy/02_usage.md) — the real API and the four concepts that matter (device
   arrays, the host↔device cost, cuRAND RNG, JIT kernel compile), the example walked through step by step, and
   its **real captured output**.
3. [`./15_cupy/03_applying.md`](./15_cupy/03_applying.md) — how to *formalize* an array-Monte-Carlo problem and
   solve it with CuPy, the research trade-offs (the honest "GPU adds speed, not understanding"), and the
   pick-vs-alternatives table.
4. [`./15_cupy/example.py`](./15_cupy/example.py) — a runnable, seeded π-by-darts Monte-Carlo with a graceful
   CPU fallback. Run from the repo root: `.venv/Scripts/python.exe docs/frameworks/15_cupy/example.py`.

## How the lab uses it

- **Scenario:** [S10 — Monte-Carlo & Replications](../problem-types/04_monte-carlo-replications.md) (the only
  scenario that wires in CuPy; its default driver is CPU joblib). Scenario code:
  [`../../simlab/scenarios/s10_montecarlo.py`](../../simlab/scenarios/s10_montecarlo.py).
- **Lane contract:** [GPU lane guide](../guides/03_gpu-lane.md) — local-only, CUDA-detect with CPU fallback.

## Siblings & alternatives

- **CPU default for the same study:** [joblib](./12_joblib.md) (the v1 default) +
  [SciPy stats](./13_scipy-stats.md) for the CI math.
- **Other GPU exhibits:** [Numba](./14_numba.md) (custom per-thread kernels, `xoroshiro128p` RNG),
  [Taichi](./16_taichi.md) (portable field/grid kernels), [JAX](./17_jax.md) (XLA-compiled array programs).
- **Large-N GPU-ABM (reference chapter, not shipped):** [FLAME GPU 2 / ABMax / AMBER](./18_gpu-abm-chapter.md).
