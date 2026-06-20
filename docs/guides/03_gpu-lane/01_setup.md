# 01 · Setup — installing the GPU lane (CUDA machine only)

The GPU lane is a **separate requirements set**, installed by hand on a CUDA machine. It is *not* part of
`scripts/setup` — that only installs the live core, dev tools, and the CPU precompute engines (see the
[precompute pipeline guide](../01_precompute-pipeline.md)). On a GPU-less box you simply never run this step and
every scenario still runs end-to-end on the CPU fallback.

## Install

From the repo root, into the project `.venv`:

```powershell
# Windows / PowerShell
.\.venv\Scripts\python.exe -m pip install -r requirements-gpu.txt
```
```bash
# macOS / Linux / Git-Bash
.venv/bin/python -m pip install -r requirements-gpu.txt
```

## The lane file

`requirements-gpu.txt` (repo root) is the **only** place these wheels are declared. Its header states the lane
contract verbatim: *optional, local-only, never a hard dependency, never on the deploy path; setup detects CUDA
and falls back to CPU.* The installed wheels:

| Wheel | Role in the lab | Fallback |
|---|---|---|
| `cupy-cuda12x` | array Monte-Carlo on the GPU (cuRAND-backed `default_rng`) | `numpy` (same array API) |
| `numba` | `@njit` CPU kernels **and** `@cuda.jit` GPU kernels (`xoroshiro128p` per-thread RNG) | the `@njit` CPU kernel |
| `taichi` | portable kernels for grid / cellular-automata sims (fire / diffusion) | `ti.init(arch=ti.cpu)` |
| `jax` (+ `jaxlib`) | `vmap`+`jit` vectorized Monte-Carlo primitive | the CPU backend of the same wheel |

## Exact pins (verified)

Pinned and verified together on an **RTX 4070 Laptop (8 GB VRAM, CUDA 12)** on 2026-06-19:

```
cupy-cuda12x==14.1.1
numba==0.65.1
taichi==1.7.4
jax==0.10.2
jaxlib==0.10.2
```

These are pinned because the GPU stack is brittle across CUDA/driver/Python combinations — see
[04 · Gotchas](./04_gotchas.md) for the specific version-coupling traps. Treat the table above as the *verified
combination*, not a floor.

## Confirm the lane is live (or correctly a no-op)

The lane is designed so that a *failed* GPU detection is not an error — it just selects the CPU path. A quick
device check:

```python
import cupy
print(cupy.cuda.runtime.getDeviceCount())   # >0 → CUDA visible; raises/0 → CPU fallback engages
```

If CuPy emits `CUDA path could not be detected`, point `CUDA_PATH` at your CUDA 12 toolkit. Device detection
(`getDeviceCount()`) may still succeed for basic array ops even when that warning fires; a kernel that needs
JIT compilation will not (see [04 · Gotchas](./04_gotchas.md), "headers required for kernel JIT").

## Next

- [02 · Run](./02_run.md) — run the lane against S10 and see what it commits.
- [03 · Internals](./03_internals.md) — the CUDA-detect-with-CPU-fallback pattern these wheels sit behind.
