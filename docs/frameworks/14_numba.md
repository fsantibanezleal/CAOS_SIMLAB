# 14 · Numba — JIT-compiled kernels (CPU `@njit` + CUDA `@cuda.jit`)

**Numba** is a just-in-time (JIT) compiler for a numeric subset of Python. It turns a
decorated Python function into native machine code through LLVM, and ships a separate CUDA
target that compiles the same style of kernel for NVIDIA GPUs. You write an ordinary Python
loop, add `@njit` (CPU) or `@cuda.jit` (GPU), and get C-like speed on exactly the shape of
code a pure-Python interpreter is slowest at: tight scalar loops over arrays — the inner
loop of a Monte-Carlo replication. Numba's value here is not "faster Python in general"; it
is *one Python source compiled to two targets*, so a CPU result and a GPU result can be
compared on **identical arithmetic** rather than on two different programs.

In CAOS_SIMLAB, Numba is the engine of the **S10 GPU exhibit**. S10 (the Monte-Carlo / CI
study) runs its replications **on the CPU by default** via [joblib](./12_joblib.md); Numba is the
*optional GPU lane* that re-expresses the embarrassingly-parallel replication loop as an
`@njit` CPU kernel and a `@cuda.jit` GPU kernel, each thread carrying its own
`xoroshiro128p` RNG stream. Its job is to *measure* where a GPU helps — and, just as
importantly, to demonstrate honestly where it does **not** (a small branch-heavy
discrete-event loop, where a GPU is measurably slower). It lives in the optional **GPU
lane**, never in the browser (Pyodide) runtime and never on the GPU-less production host;
every GPU path falls back to a CPU computation behind `cuda.is_available()`, so the repo
runs end-to-end with no GPU. Reach for Numba only when you need a hand-written per-thread
Monte-Carlo kernel that runs on both CPU and GPU from one codebase; for array-style
GPU work use [CuPy](./15_cupy.md), for CPU-parallel replications use
[joblib](./12_joblib.md), and for the statistics on the reduced results use
[SciPy stats](./13_scipy-stats.md).

## Read in order

1. [01 · Installation](./14_numba/01_installation.md) — exact pip line, the GPU requirements
   lane, the brittle `numba`/`llvmlite`/NumPy/Python pinning, and CUDA platform notes.
2. [02 · Usage](./14_numba/02_usage.md) — the real API (`@njit`, `@cuda.jit`,
   `xoroshiro128p`, `cuda.is_available()`), the worked example walked step by step, and its
   real captured output.
3. [03 · Applying it](./14_numba/03_applying.md) — how to formalize a Monte-Carlo
   replication problem, how to solve it with Numba, the research trade-offs, and when to
   pick it vs the alternatives.

## Runnable example

- [`./14_numba/example.py`](./14_numba/example.py) — `@njit` CPU pi estimate, an `@njit`
  M/M/c Erlang-C check against the analytic value, and a `@cuda.jit` GPU pi kernel with a
  per-thread `xoroshiro128p` RNG (with an exact CPU fallback). Run from the repo root:

  ```
  .venv/Scripts/python.exe docs/frameworks/14_numba/example.py
  ```

## Where the lab uses it

- **Scenario S10 — Monte-Carlo CI Study** (the only scenario that uses Numba): code at
  [`../../simlab/scenarios/s10_montecarlo.py`](../../simlab/scenarios/s10_montecarlo.py).
- Problem-type background: [Monte-Carlo & Replications](../problem-types/04_monte-carlo-replications.md).
- Lane policy + CPU-fallback rule: [GPU lane guide](../guides/03_gpu-lane.md).
- Partner frameworks on the same S10 lane: [joblib](./12_joblib.md) (default CPU driver),
  [CuPy](./15_cupy.md) (array Monte-Carlo on GPU), [SciPy stats](./13_scipy-stats.md)
  (CIs / tests on the reduced array). Massive-N GPU agent models are documented but
  **not shipped** in the [GPU-ABM reference chapter](./18_gpu-abm-chapter.md).
