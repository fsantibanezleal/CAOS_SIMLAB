# JAX — installation

JAX is Google's array library: a NumPy-compatible API plus composable function
transformations (`jit`, `vmap`, `grad`, `pmap`) compiled to native code via XLA.
In CAOS_SIMLAB it is a **vectorization primitive for the precompute lane** — a
way to express "thousands of independent Monte-Carlo replications" or a
vectorized agent step as one fused, compiled kernel — **not** a simulation engine
and **never** a runtime dependency of the served web app.

## Version installed

| Field | Value |
|---|---|
| Package | `jax` |
| Version | `0.10.2` |
| Paired runtime | `jaxlib` `0.10.2` (must match `jax` minor version) |
| Backend used here | **CPU** (`jax.default_backend() == "cpu"`) |
| License | Apache-2.0 (permissive — safe for a public repo) |

`jax` and `jaxlib` are versioned together; a mismatched pair (e.g. `jax 0.10.x`
with an older `jaxlib`) raises an import-time error. They are already installed
in the project `.venv` at matching `0.10.2`.

## How to install (reference only — already installed)

Do **not** run this; the environment is provisioned. Recorded here so the doc is
self-contained and reproducible.

CPU-only wheel (the default for this lab — what is installed):

```
pip install "jax[cpu]==0.10.2"
```

`jax[cpu]` pulls a `jaxlib` wheel with the XLA CPU backend baked in. No CUDA, no
system toolkit, nothing to compile — it runs anywhere Python runs.

GPU wheel (NOT installed here; documented for completeness):

```
pip install "jax[cuda12]==0.10.2"
```

The `cuda12` extra pulls CUDA runtime libraries as pip wheels. **We do not use
it**, for two reasons grounded in the research: (1) JAX is documented as a
vectorization primitive, not a flagship GPU engine in this lab — joblib (CPU) is
the v1 replication driver and CuPy/Numba CUDA are the documented GPU appendix;
(2) the served app carries **zero** GPU dependency by architecture. The same
JAX code in [`example.py`](./example.py) runs unchanged on a GPU backend if one
is ever provisioned locally — only the wheel changes, not the code.

## Which requirements file it belongs to

**`requirements-gpu.txt` / `requirements-precompute.txt`** — the optional,
offline, local-only lanes. JAX is **never** in `requirements.txt` (the live MVP)
because:

- The browser/SPA never imports JAX; the deploy contract is the committed trace
  artifact, not a runtime simulator. JAX has no place on the VPS or GitHub Pages
  path (see [`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md)).
- JAX is a *precompute/vectorization* tool used to generate artifacts offline,
  alongside `ortools` (precompute) and the optional CuPy/Numba GPU exhibit (gpu).

It is the **CPU** wheel (`jax[cpu]`) that this lab pins, so it imposes no CUDA
toolchain gate — a GPU-less learner can run every JAX example here. It sits in
the gpu/precompute tier conceptually (vectorized batch compute), not because it
*needs* a GPU.

## Key transitive dependencies

`jax 0.10.2` declares these runtime requirements (all already present):

| Dependency | Installed version | Role |
|---|---|---|
| `jaxlib` | `0.10.2` | The compiled XLA runtime + device backends (the actual engine) |
| `numpy` | `2.4.6` | Host-side arrays + the API surface JAX mirrors |
| `scipy` | `1.18.0` | Backs `jax.scipy` (we use `jax.scipy.special.gammaincc` for the analytic check) |
| `ml_dtypes` | `0.5.4` | Extended dtypes (bfloat16, fp8) used by XLA |
| `opt_einsum` | `3.4.0` | Optimal contraction ordering for `einsum`/tensor ops |

## Platform notes

- **Windows / CPU backend works cleanly** — this is what the lab uses. The
  `jax[cpu]` wheel is self-contained; no compiler, no CUDA, no path-length
  issues. [`example.py`](./example.py) was verified on Windows on the CPU
  backend (see [`usage.md`](./usage.md) for captured output).
- **First call is slow, then fast.** XLA compiles a `jit`-ted function on its
  first invocation (tracing + compilation), so the first call pays a one-off
  cost; subsequent calls with the same input shapes/dtypes reuse the cached
  compiled kernel. Benchmark the *second* call, never the first.
- **64-bit is opt-in.** JAX defaults to 32-bit floats. We enable 64-bit with
  `jax.config.update("jax_enable_x64", True)` (must be set before array creation)
  so the Monte-Carlo estimate matches the analytic truth tightly and portably.
- **`ABMax` (the JAX-based ABM library) is NOT installed and is NOT usable
  here.** Its pip install **fails on Windows** with a path-length error
  (`MAX_PATH` overflow during the wheel build/unpack). This is exactly why JAX is
  documented as the bare **vectorization primitive** in this lab — `vmap` + `jit`
  over our own vectorized step — and not via the ABMax wrapper. Do not add ABMax
  to any requirements file.

## CUDA notes

**None required, and none used.** The CPU wheel has no CUDA dependency
whatsoever. If a CUDA backend were ever wanted on Felipe's RTX 4070 Laptop
(8 GB), the `jax[cuda12]==0.10.2` wheel bundles its own CUDA libraries as pip
packages (no system CUDA toolkit install), and the 8 GB VRAM ceiling from the
GPU research applies (cap batch sizes, prefer fp32). But per the architecture and
the adversarial review, **GPU stays off the ship path** and JAX stays CPU here.

## Related

- [`usage.md`](./usage.md) — the API, the worked example, and its verified output.
- [`applying.md`](./applying.md) — where this fits in our scenarios and the honest trade-offs.
- [`../../problem-types/monte-carlo-replications.md`](../../problem-types/monte-carlo-replications.md) — the methodology this tool serves.
