"""CuPy GPU Monte-Carlo demo — vectorized, seeded, with a graceful CPU fallback.

What it teaches (the S10 "GPU exhibit" pattern):
- A Monte-Carlo estimate is a *random experiment*: thousands of independent replications, summarised
  by a mean and a 95% confidence interval that narrows like 1/sqrt(N).
- CuPy is "NumPy on the GPU": the SAME array code runs on the device. The whole replication batch is
  drawn and reduced as array operations (no Python loop over seeds), which is exactly the shape a GPU
  accelerates. Here we estimate pi by the classic unit-quarter-circle dart throw, batched over
  N independent draws.
- HONEST FALLBACK: if no working CUDA device is present (the common case on a laptop / CI box), the
  `import cupy` line itself prints a "CUDA path could not be detected" UserWarning and any device call
  raises. We catch that, fall back to NumPy on the CPU, and run the identical math. The numbers are the
  point; the device is an exhibit. We report WHICH backend actually ran.

Determinism: a fixed seed (12345) is used for whichever backend runs, so the printed estimate is
reproducible on that backend. (NumPy's Generator and CuPy's cuRAND-backed Generator are seeded the same
way; bit-exact equality ACROSS backends is not guaranteed — different RNG implementations — but each
backend is reproducible with itself.)

Run (cwd = repo root):
    .venv/Scripts/python.exe docs/frameworks/15_cupy/example.py
"""
from __future__ import annotations

import math
import warnings

SEED = 12345          # fixed -> reproducible on a given backend
N = 20_000_000        # independent Monte-Carlo draws (one "dart" each)
Z95 = 1.959963984540054   # standard-normal 95% critical value


def select_backend():
    """Return (xp_module, backend_name). Try CuPy on a real GPU; fall back to NumPy on the CPU.

    Importing cupy on a machine with no detectable CUDA toolkit emits:
        UserWarning: CUDA path could not be detected. Set CUDA_PATH environment variable ...
    That warning is expected and harmless here — it just means CuPy could not find a CUDA install, so we
    will fall back. We surface it so the learner sees exactly why the GPU path was skipped.
    """
    try:
        # The import below may emit the "CUDA path could not be detected" UserWarning. We let it through
        # (it is informative) but record whether it fired.
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            import cupy as cp  # noqa: PLC0415  (intentional: import only when probing GPU)
        cuda_path_warning = any("CUDA path could not be detected" in str(w.message) for w in caught)

        # A successful import is NOT proof of a USABLE GPU. A machine can report a CUDA device yet lack the
        # CUDA toolkit *headers* CuPy needs to JIT-compile elementwise kernels — in which case array math
        # (e.g. x*x) raises only when the first kernel compiles. So the probe must exercise the SAME kind
        # of operation the real computation uses: allocate, draw with cuRAND, run an elementwise arithmetic
        # op (forces kernel compilation), AND synchronise. Any failure here -> fall back to NumPy.
        dev_count = cp.cuda.runtime.getDeviceCount()
        if dev_count < 1:
            raise RuntimeError("no CUDA device reported")
        probe = cp.random.default_rng(0).random(8, dtype=cp.float64)
        probe = (probe * probe) <= 1.0          # elementwise op -> triggers JIT kernel compile
        _ = int(probe.sum())                    # device->host sync; raises if the device is not really usable
        name = cp.cuda.runtime.getDeviceProperties(0)["name"]
        dev_name = name.decode() if isinstance(name, bytes) else str(name)
        if cuda_path_warning:
            print("note: CuPy emitted 'CUDA path could not be detected' but a device was still usable.")
        return cp, f"CuPy (GPU: {dev_name})"
    except Exception as exc:  # noqa: BLE001  (any CUDA failure -> CPU is a valid, documented outcome)
        print(f"note: GPU path unavailable ({type(exc).__name__}: {exc}); falling back to NumPy on CPU.")
        print("note: the 'CUDA path could not be detected' UserWarning above is the expected symptom of "
              "no CUDA toolkit / no GPU on this machine.")
        import numpy as np  # noqa: PLC0415
        return np, "NumPy (CPU fallback)"


def estimate_pi(xp, n: int, seed: int) -> tuple[float, float]:
    """Vectorized Monte-Carlo estimate of pi and its 95% CI half-width, fully on `xp`.

    Throw `n` darts uniformly into the unit square [0,1)x[0,1). The fraction inside the quarter unit
    circle (x^2 + y^2 <= 1) estimates pi/4, so pi_hat = 4 * p_hat. Each dart is an i.i.d. Bernoulli(p)
    trial with p = pi/4, so the CI half-width on pi_hat is 4 * Z * sqrt(p_hat(1-p_hat)/n).
    """
    rng = xp.random.default_rng(seed)          # same API on NumPy and CuPy
    x = rng.random(n, dtype=xp.float64)        # one big array, drawn on-device under CuPy
    y = rng.random(n, dtype=xp.float64)
    inside = (x * x + y * y) <= 1.0            # elementwise; a single fused pass on the GPU
    hits = int(inside.sum())                   # device->host reduction (one scalar transfer)
    p_hat = hits / n
    pi_hat = 4.0 * p_hat
    half = 4.0 * Z95 * math.sqrt(p_hat * (1.0 - p_hat) / n)
    return pi_hat, half


def main() -> None:
    xp, backend = select_backend()
    pi_hat, half = estimate_pi(xp, N, SEED)
    err = abs(pi_hat - math.pi)
    inside_ci = err <= half
    print("=" * 64)
    print("CuPy GPU Monte-Carlo exhibit  (estimate pi by N seeded dart throws)")
    print("=" * 64)
    print(f"backend         : {backend}")
    print(f"draws (N)       : {N:,}")
    print(f"seed            : {SEED}")
    print(f"pi estimate     : {pi_hat:.6f}")
    print(f"95% CI          : [{pi_hat - half:.6f}, {pi_hat + half:.6f}]  (half-width {half:.6f})")
    print(f"true pi         : {math.pi:.6f}")
    print(f"abs error       : {err:.6f}")
    print(f"true pi in CI?  : {inside_ci}")
    print("-" * 64)
    print("lesson: the SAME array code runs on GPU (CuPy) or CPU (NumPy). The GPU win is real only when")
    print("the parallel arithmetic (millions of independent draws) dwarfs host<->device transfer -- i.e.")
    print("big batched Monte-Carlo, NOT a small event-loop DES. See docs/frameworks/15_cupy/03_applying.md.")


if __name__ == "__main__":
    main()
