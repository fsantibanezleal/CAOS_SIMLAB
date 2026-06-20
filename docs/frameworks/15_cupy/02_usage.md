# CuPy — usage

> One-line mental model: **CuPy is NumPy whose arrays live on the GPU.** You write the same array code; it
> executes on thousands of CUDA cores in parallel. The art is in *what* you batch.

This guide walks the key concepts, a minimal runnable example, and its **real captured output** (the example
genuinely ran in this repo's `.venv`). For *when* to reach for CuPy versus the CPU default, see
[`03_applying.md`](./03_applying.md); for the installed pin and the CUDA caveats, see
[`01_installation.md`](./01_installation.md).

---

## 1. Key API and concepts

### `cupy` is a drop-in NumPy namespace

```python
import numpy as np
import cupy as cp

a = cp.arange(10)            # lives in GPU memory (a cupy.ndarray)
b = cp.random.default_rng(0).random(10)
c = (a * b).sum()           # elementwise + reduction, all on the device
```

The function and method names mirror NumPy (`cp.arange`, `cp.sum`, `cp.exp`, `cp.histogram`, slicing,
broadcasting, ufuncs). This is the whole appeal: code written for `xp = numpy` runs unchanged for
`xp = cupy`. CAOS_SIMLAB exploits this with an **`xp` indirection** — the same Monte-Carlo function takes the
array module as an argument and runs on whichever backend is available.

### The four concepts that actually matter

1. **Device arrays.** A `cupy.ndarray` lives in **GPU (device) memory**, not host (CPU) RAM. Operations on it
   run on the GPU. NumPy arrays live on the host.
2. **The host↔device boundary is the cost.** Moving data across PCIe is expensive relative to arithmetic.
   - `cp.asarray(host_np_array)` → host → device (upload).
   - `cupy_array.get()` or `np.asarray(cupy_array)` → device → host (download).
   - Calling `float(...)`/`int(...)` on a device scalar, or `.item()`, forces a device→host transfer **and** a
     synchronisation. Do this **once at the end** (pull back a small summary), never inside a loop.
   - **The rule:** keep data on the device for the whole computation; only the final small result returns.
3. **cuRAND-backed RNG.** `cp.random.default_rng(seed)` mirrors NumPy's `Generator` API but draws on the GPU
   via cuRAND. Seeding makes a given backend reproducible. (Bit-exact equality *across* NumPy and CuPy is
   **not** guaranteed — different RNG implementations — but each backend is reproducible with itself.)
4. **JIT kernel compilation.** The first time an elementwise expression like `x*x + y*y` runs, CuPy compiles a
   fused CUDA kernel (via NVRTC) and caches it. This needs the CUDA toolkit *headers* present — the source of
   the "Failed to find CUDA headers" error documented in [`01_installation.md`](./01_installation.md). It also
   means the *first* kernel call carries a one-time compile cost; the win shows up on large/repeated work.

### The CUDA-detect-with-fallback pattern (house standard)

Because the GPU lane must never block a GPU-less learner, the standard is to **probe the GPU up front and fall
back to NumPy** if anything fails — and to probe with the *same kind of operation* the real work uses (an
elementwise op that triggers kernel compilation), so a half-installed CUDA can't crash mid-run:

```python
def select_backend():
    try:
        import cupy as cp
        cp.cuda.runtime.getDeviceCount()                 # is a device present?
        probe = cp.random.default_rng(0).random(8)       # cuRAND draw
        probe = (probe * probe) <= 1.0                   # elementwise -> JIT-compiles a kernel
        int(probe.sum())                                 # forces device->host sync; raises if unusable
        return cp, "CuPy (GPU)"
    except Exception:
        import numpy as np
        return np, "NumPy (CPU fallback)"
```

This same probe ships in [`numba`](../14_numba.md) and the rest of the GPU lane — see the
[GPU-lane guide](../../guides/03_gpu-lane.md) for the shared contract.

---

## 2. Minimal runnable example, step by step

The full script is [`example.py`](./example.py). It estimates **π** by the classic Monte-Carlo dart throw —
the simplest honest stand-in for the S10 "thousands of independent replications → mean + 95% CI" pattern,
expressed entirely as **vectorized array ops** (no Python loop over draws), which is exactly the shape a GPU
accelerates.

**Step 1 — choose a backend (GPU if usable, else CPU).** `select_backend()` imports CuPy, then forces a real
device touch including an elementwise op; any failure falls back to NumPy. It also reports *which* backend ran
and notes the `CUDA path could not be detected` warning when it fires.

**Step 2 — draw the batch on the device.** With `xp` bound to the chosen module:

```python
rng = xp.random.default_rng(seed)        # same call on NumPy and CuPy
x = rng.random(n, dtype=xp.float64)      # n uniform draws in [0,1) -- on-device under CuPy
y = rng.random(n, dtype=xp.float64)
```

**Step 3 — reduce on the device, transfer once.** Throw `n` darts into the unit square; the fraction inside
the quarter unit circle estimates `π/4`:

```python
inside = (x * x + y * y) <= 1.0          # one fused elementwise pass
hits = int(inside.sum())                 # single device->host scalar transfer
p_hat = hits / n
pi_hat = 4.0 * p_hat
```

**Step 4 — attach an honest confidence interval.** Each dart is an i.i.d. Bernoulli(p) trial with `p = π/4`,
so the 95% CI half-width on `pi_hat` is `4 · z · sqrt(p_hat·(1−p_hat)/n)` with `z ≈ 1.95996`. The CI narrows
like `1/√n` — the central lesson of the Monte-Carlo curriculum.

**Step 5 — report.** Print the backend, the estimate, the CI, the absolute error, and whether true π falls
inside the interval.

Run it from the repo root:

```
.venv/Scripts/python.exe docs/frameworks/15_cupy/example.py
```

---

## 3. Verified output

The script was actually run in this repo's `.venv` (Python 3.13, `cupy-cuda12x==14.1.1`). On the verification
machine CuPy imported and a CUDA device was detected, **but the CUDA toolkit headers were absent**, so kernel
JIT-compilation failed during the probe and the script fell back to NumPy on the CPU — exercising the fallback
path end-to-end. This is the honest, expected outcome on a box without a full CUDA toolkit; on a machine with
the toolkit installed the `backend` line would instead read `CuPy (GPU: <device name>)` with the same
(backend-reproducible) statistics. The captured stdout/stderr:

```text
note: GPU path unavailable (RuntimeError: Failed to find CUDA headers. Please install CUDA toolkit headers (e.g., pip install cupy-cuda12x[ctk]) or specify CUDA_PATH environment variable.); falling back to NumPy on CPU.
note: the 'CUDA path could not be detected' UserWarning above is the expected symptom of no CUDA toolkit / no GPU on this machine.
================================================================
CuPy GPU Monte-Carlo exhibit  (estimate pi by N seeded dart throws)
================================================================
backend         : NumPy (CPU fallback)
draws (N)       : 20,000,000
seed            : 12345
pi estimate     : 3.141370
95% CI          : [3.140650, 3.142090]  (half-width 0.000720)
true pi         : 3.141593
abs error       : 0.000223
true pi in CI?  : True
----------------------------------------------------------------
lesson: the SAME array code runs on GPU (CuPy) or CPU (NumPy). The GPU win is real only when
the parallel arithmetic (millions of independent draws) dwarfs host<->device transfer -- i.e.
big batched Monte-Carlo, NOT a small event-loop DES. See docs/frameworks/15_cupy/03_applying.md.
```

**Reading the result:**

- The estimate **3.141370** lands within **0.000223** of true π (3.141593), and true π is **inside** the 95%
  CI `[3.140650, 3.142090]` — the interval did its job. (A 95% CI is expected to *miss* roughly 1 run in 20;
  that it covers here is the common, not the guaranteed, case.)
- The run is **deterministic**: re-running prints the identical estimate (seed-fixed), so the artifact is
  reproducible — the architecture's "replay = truth" contract.
- The two `note:` lines show the fallback firing for the documented reason. The `CUDA path could not be
  detected` `UserWarning` referenced there is emitted by CuPy on import (via `cuda-pathfinder`) when no CUDA
  install is found — see [`01_installation.md`](./01_installation.md).

That the GPU path was *skipped here* is itself the lesson the lab teaches: the **code** is GPU-ready, but a
GPU is an optional accelerator, never a correctness requirement. The numbers above were produced by the exact
same array code that would run on the device.

---

**Next:** [`03_applying.md`](./03_applying.md) — how to formalize the problem CuPy solves, which scenario uses
it, and when to pick it over the alternatives.
