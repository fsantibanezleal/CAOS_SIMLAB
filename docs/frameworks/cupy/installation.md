# CuPy — installation

CuPy is **NumPy & SciPy for the GPU**: the same array API, executed on an NVIDIA CUDA device. In
CAOS_SIMLAB it is an **optional GPU exhibit only** — it belongs to the `gpu` requirements lane, is never on
the live (browser/Pyodide) or VPS deploy path, and every result it produces is reproducible on the CPU via
the fallback baked into the example. See [`docs/problem-types/monte-carlo-replications.md`](../../problem-types/monte-carlo-replications.md)
§8 for *why* (the honest "when does a GPU actually help?" verdict).

## Exact install line

CuPy ships **CUDA-version-specific wheels**. This repo targets CUDA 12.x, so the package name is
`cupy-cuda12x` (not the source-build `cupy` package):

```
pip install cupy-cuda12x==14.1.1
```

> Do **not** run this yourself in the CAOS_SIMLAB dev environment — it is already installed. The line is
> documented so the exact pin is on record.

## Installed version (verified)

| Field | Value |
|---|---|
| Import name | `cupy` |
| Distribution | `cupy-cuda12x` |
| Version | **14.1.1** |
| License | **MIT** (permissive — safe for the public repo) |
| `import cupy; cupy.__version__` | `14.1.1` |

## Which requirements file it belongs to

`requirements-gpu.txt` — the **optional, post-v1, local-only GPU lane**. The header of that file states the
contract plainly:

- it is **never a hard dependency**, and **never on the deploy path** (the app is static; the contract is
  the committed trace, not the GPU);
- a setup script detects CUDA and **falls back to CPU**;
- the honest verdict: GPU helps **large-N ABM** and **thousands of Monte-Carlo replications**, *not* small-N
  event-loop DES.

CuPy is therefore deliberately **absent** from the base [`requirements.txt`](../../../requirements.txt)
(the browser/Pyodide wheel closure: kept to `numpy` + `simpy`) and from
[`requirements-precompute.txt`](../../../requirements-precompute.txt) (the CPU pipeline: OR-Tools, joblib,
etc.). Keeping a native CUDA dependency out of the base lane is what lets a GPU-less learner clone and run
the whole lab.

## Key transitive dependencies

`cupy-cuda12x==14.1.1` declares only two install requirements (verified with `pip show`):

| Package | Installed version | Role |
|---|---|---|
| `numpy` | 2.4.6 | The host-side array library CuPy mirrors; arrays move between `numpy` (host) and `cupy` (device). |
| `cuda-pathfinder` | 1.5.5 (Apache-2.0) | Locates the CUDA runtime/driver libraries at import time. When it cannot find a CUDA install it is the source of the `CUDA path could not be detected` warning (see below). |

The actual CUDA runtime libraries (cuRAND for the RNG, NVRTC for just-in-time kernel compilation, cuBLAS,
etc.) are **not** Python packages — they come from the system CUDA toolkit / driver, which is exactly why a
machine without the toolkit can fail even though `pip install` succeeded.

## Platform notes

- **OS / arch:** `cupy-cuda12x` wheels are published for Windows x86-64 and Linux x86-64. This repo's GPU
  lane is exercised on Windows 11 (the local precompute machine) and is expected to behave identically on
  Linux. There is **no macOS / Apple-Silicon CUDA wheel** — on a Mac the example will simply take the NumPy
  fallback path.
- **The `CUDA path could not be detected` warning is expected here.** On *first import*, if the CUDA toolkit
  is not on the path, CuPy emits:

  ```
  UserWarning: CUDA path could not be detected. Set CUDA_PATH environment variable if CuPy fails to load.
  ```

  This is **informational, not fatal** — it means CuPy could not locate a CUDA install. The example treats
  it as the expected symptom of "no usable GPU on this machine" and falls back to NumPy. If you *do* have a
  working CUDA 12.x toolkit and still see it, set `CUDA_PATH` to the toolkit root (e.g.
  `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.x`).

## CUDA notes (GPU lane specifics)

- **Toolkit headers, not just a device, are required.** A subtle real-world failure (observed while
  verifying this guide): a machine can report a CUDA device — `cupy.cuda.runtime.getDeviceCount()`,
  cuRAND draws, and `getDeviceProperties()` all succeed — yet still lack the CUDA toolkit *headers* that
  CuPy needs to **JIT-compile elementwise kernels** (via NVRTC). The failure then surfaces only when the
  first array arithmetic op compiles:

  ```
  RuntimeError: Failed to find CUDA headers. Please install CUDA toolkit headers
  (e.g., pip install cupy-cuda12x[ctk]) or specify CUDA_PATH environment variable.
  ```

  The fix is either a full CUDA 12.x toolkit install (with headers) or the bundled-headers extra:
  `pip install cupy-cuda12x[ctk]`. Because of this, the example's GPU **probe deliberately runs a real
  elementwise op** before committing to the GPU backend — so the fallback decision is made up-front, on the
  same kind of operation the computation will use, rather than crashing mid-run.
- **Compute Capability:** CUDA 12.x supports NVIDIA GPUs of compute capability ≥ 5.0 (Maxwell and newer).
  The lab's reference local GPU is an RTX 4070 Laptop (8 GB) — comfortable for batched Monte-Carlo (fp32/fp64
  arrays of tens of millions of elements), with the usual **8 GB VRAM ceiling**: cap batch sizes and prefer
  `float32` over `float64` for the largest runs.
- **Driver vs toolkit:** the NVIDIA *driver* must be new enough for CUDA 12.x; the *toolkit* (headers +
  NVRTC) must be present for kernel JIT. The wheel ships the CUDA *runtime* libraries but relies on the
  system for the driver and (for JIT) the headers.

No secrets, no API keys, and no network access are involved in installing or running CuPy.
