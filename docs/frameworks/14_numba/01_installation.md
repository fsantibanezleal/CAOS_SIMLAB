# 14 · Numba — 01 · Installation

Numba is a JIT (just-in-time) compiler for a numeric subset of Python. It compiles
decorated functions to native machine code via LLVM, and it ships a CUDA target that
compiles kernels for NVIDIA GPUs. In CAOS_SIMLAB it powers the **S10 GPU exhibit**: the
same Monte-Carlo replication written once for the CPU (`@njit`) and once for the GPU
(`@cuda.jit`), so the lab can *measure* where a GPU helps instead of asserting it.

← Back to the [Numba wiki node](../14_numba.md) · next: [02 · Usage](./02_usage.md).

## Which requirements file

Numba lives in the **optional GPU lane**, not the core runtime. It is listed in
[`requirements-gpu.txt`](../../../requirements-gpu.txt):

```
numba>=0.60        # JIT kernels / CUDA fallback
cupy-cuda12x>=13   # array Monte-Carlo on the GPU (CUDA 12.x)
```

It is **deliberately not** in [`requirements.txt`](../../../requirements.txt) (the base
runtime / Pyodide wheel closure) nor in
[`requirements-precompute.txt`](../../../requirements-precompute.txt). Reasons:

- The **live lane** runs in the browser via Pyodide. Numba compiles native code with
  LLVM at runtime; it cannot run inside Pyodide/WASM and would bloat the wheel closure.
  So it must never enter the base runtime.
- The **production host is GPU-less** and serves only the built SPA plus committed
  traces (see [`docs/architecture.md`](../../architecture.md)). Numba is **never** a
  deploy-path dependency.
- It is a **local-only, post-v1 exhibit**: install it on demand on a machine that has
  (or wants to demonstrate the CPU fallback for) the GPU lane.

## Exact install line and installed version

Numba is already installed in the repo's `.venv` (do not re-install). For a fresh GPU-lane
environment the line is:

```
pip install -r requirements-gpu.txt
```

which resolves Numba to (the version verified in this repo):

```
numba==0.65.1
```

## Key transitive dependencies (as installed here)

| Package            | Version   | Role |
|--------------------|-----------|------|
| `numba`            | 0.65.1    | the JIT compiler + `numba.cuda` target |
| `llvmlite`         | 0.47.0    | thin Python binding to LLVM; Numba's code-generation backend (the hard version pin — `numba` 0.65.x requires `llvmlite` 0.47.x) |
| `numpy`            | 2.4.6     | array layer Numba understands natively (`@njit` operates on NumPy arrays) |
| `cupy-cuda12x`     | 14.1.1    | companion GPU-array library for the same lane (CUDA 12.x) |
| `cuda-pathfinder`  | 1.5.5     | helper that locates the CUDA toolkit libraries at runtime |

Python here is **3.13.0** (64-bit). The `numba`/`llvmlite` pairing is the brittle part of
any Numba install: each `numba` release supports a narrow `llvmlite` range and a bounded
Python/NumPy range. Pin both together; do not bump one without the other. The failure mode
when they drift is a hard import error (`numba` refuses to load against an unsupported
`llvmlite` or an unsupported NumPy ABI), not a silent slowdown — so a green import is your
first integration test.

> Note on the CUDA RNG import path. In this `numba` version the CUDA target ships inside
> the `numba` package itself: `from numba import cuda` and
> `from numba.cuda.random import create_xoroshiro128p_states, xoroshiro128p_uniform_float32`.
> There is no separate `numba-cuda` package installed here. (Newer split-out layouts move
> the CUDA target to a standalone `numba-cuda` distribution; if you upgrade, re-check the
> import path before assuming `numba.cuda` exists.)

## Platform notes

- **Wheels.** `numba` and `llvmlite` ship as binary wheels for Windows / Linux / macOS on
  CPython; no compiler toolchain is needed just to install them. The bundled LLVM is what
  performs the JIT — you are not invoking a system compiler.
- **CPU path needs no GPU.** Everything `@njit` (CPU JIT) works on any machine. The
  example's checks 1 and 2 run anywhere.
- **First call is slow.** A JIT-compiled function pays a one-time compile cost on its
  first call (often hundreds of ms). `@njit(cache=True)` writes the compiled artifact to
  a `__pycache__`-adjacent cache so subsequent *process* starts skip recompilation. This
  is why a fair Numba benchmark always *warms up* the function once and times the second
  call — the first call's number is the compiler, not the kernel.

## CUDA notes (the GPU path)

- **An NVIDIA GPU + CUDA driver is required** for `cuda.is_available()` to return `True`
  and for `@cuda.jit` kernels to execute on hardware. The GPU lane targets a local
  RTX 4070 Laptop (8 GB) for precompute; it is never required to *use* the lab.
- **CUDA 12.x toolchain.** The companion `cupy-cuda12x` wheel targets CUDA 12.x; keep the
  driver new enough for CUDA 12. Numba's CUDA kernels are compiled via NVRTC at runtime.
- **8 GB VRAM ceiling.** On the target laptop, cap thread/replication counts and prefer
  `float32` over `float64` to avoid out-of-memory errors (a documented failure class on
  this 8 GB class of card). The example uses `float32` draws on the GPU for this reason.
- **Graceful fallback is mandatory.** Per the GPU research, the repo must run for GPU-less
  learners: every GPU path is guarded by `cuda.is_available()` and falls back to a CPU
  computation. [`example.py`](./example.py) follows this exactly — on this machine
  `cuda.is_available()` is `False`, so it runs the CPU fallback and still prints a result.

## Verify the install

A one-line smoke test that does not need a GPU (the CPU JIT and the import path):

```
.venv/Scripts/python.exe -c "import numba, llvmlite; from numba import cuda, njit; print(numba.__version__, llvmlite.__version__, 'cuda?', cuda.is_available())"
```

On this repo's environment that prints `0.65.1 0.47.0 cuda? False` — a green import and the
honest "no GPU here", which is exactly the state the CPU fallback is designed for. For the
full end-to-end check, run [`example.py`](./example.py) (see [02 · Usage](./02_usage.md)).

## Honest scope (why it is optional)

Per [the Monte-Carlo problem-type page](../../problem-types/04_monte-carlo-replications.md) and
the adversarial review, Numba/GPU is a **teaching exhibit, not a pillar**. A GPU accelerates
*thousands of independent Monte-Carlo replications* and *large-N agent models* — it does
**not** accelerate a small branch-heavy discrete-event loop, where it is measurably
slower. Numba is installed only so S10 can demonstrate that asymmetry honestly. The
deprecated frameworks **AgentPy** and **desmod** are not used anywhere in the lab; ignore
any older guide that suggests them.
