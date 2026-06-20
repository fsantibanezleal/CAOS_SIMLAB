# 17 · JAX — installation

JAX is Google's array library: a NumPy-compatible API plus composable function
transformations (`jit`, `vmap`, `grad`, `pmap`) lowered to native code through the
**XLA** compiler. In CAOS_SIMLAB it is a **vectorization primitive for the
precompute lane** — a way to express "thousands of independent Monte-Carlo
replications" or a vectorized agent step as one fused, compiled kernel — and
**never** a runtime dependency of the served web app. This page pins the exact
version, says which requirements lane it belongs to, lists the dependency tree,
and records the platform / CUDA realities (including one wheel that *fails* on
Windows). Read [`02_usage.md`](./02_usage.md) next for the API and the worked
example, and [`03_applying.md`](./03_applying.md) for the judgement layer.

## Version installed

| Field | Value |
|---|---|
| Package | `jax` |
| Version | `0.10.2` |
| Paired runtime | `jaxlib` `0.10.2` (must match `jax`'s minor version exactly) |
| Backend used here | **CPU** (`jax.default_backend() == "cpu"`) |
| License | Apache-2.0 (permissive — safe for a public repo) |

`jax` and `jaxlib` are versioned **together**; a mismatched pair (e.g. `jax`
`0.10.x` against an older `jaxlib`) raises an import-time error. Both are already
installed in the project `.venv` at matching `0.10.2`.

## How to install (reference only — already provisioned)

Do **not** run these; the environment is already set up. They are recorded so the
doc is self-contained and reproducible.

CPU-only wheel — the default for this lab, and exactly what is installed:

```bash
pip install "jax[cpu]==0.10.2"
```

`jax[cpu]` pulls a `jaxlib` wheel with the XLA **CPU** backend baked in. No CUDA,
no system toolkit, nothing to compile — it runs anywhere Python runs, including a
GPU-less laptop or a CI runner.

GPU wheel — **NOT** installed here; documented only for completeness:

```bash
pip install "jax[cuda12]==0.10.2"
```

The `cuda12` extra pulls the CUDA runtime libraries as pip wheels (no system CUDA
toolkit install). **We do not use it**, for two reasons grounded in the research:

1. JAX is documented as a *vectorization primitive*, not a flagship GPU engine in
   this lab — [joblib](../12_joblib.md) (CPU) is the v1 replication driver and
   [CuPy](../15_cupy.md) / Numba CUDA are the documented GPU appendix.
2. The served app carries **zero** GPU dependency by architecture.

The same JAX code in [`example.py`](./example.py) runs **unchanged** on a GPU/TPU
backend if one is ever provisioned locally — only the wheel changes, not the code.

## Which requirements file it belongs to

**`requirements-gpu.txt` / `requirements-precompute.txt`** — the optional,
offline, local-only lanes. JAX is **never** in `requirements.txt` (the live MVP),
because:

- The browser / SPA never imports JAX. The deploy contract is the committed trace
  artifact, **not** a runtime simulator, so JAX has no place on the
  GitHub Pages deploy runtime (see [`../../architecture.md`](../../architecture.md) and the
  [GPU-lane guide](../../guides/03_gpu-lane.md)).
- JAX is a *precompute / vectorization* tool used to generate artifacts offline,
  alongside `ortools` (precompute) and the optional CuPy / Numba GPU exhibit.

It is the **CPU** wheel (`jax[cpu]`) that this lab pins, so it imposes **no** CUDA
toolchain gate — a GPU-less learner can run every JAX example here. It sits in the
gpu/precompute tier *conceptually* (vectorized batch compute), not because it
*needs* a GPU.

## Key transitive dependencies

`jax 0.10.2` declares these runtime requirements (all already present in the
`.venv`):

| Dependency | Installed version | Role |
|---|---|---|
| `jaxlib` | `0.10.2` | The compiled XLA runtime + device backends (the actual engine) |
| `numpy` | `2.4.6` | Host-side arrays + the API surface JAX mirrors |
| `scipy` | `1.18.0` | Backs `jax.scipy` (the example uses `jax.scipy.special.gammaincc` for the analytic check) |
| `ml_dtypes` | `0.5.4` | Extended dtypes (bfloat16, fp8) used by XLA |
| `opt_einsum` | `3.4.0` | Optimal contraction ordering for `einsum` / tensor ops |

## Sanity check

After install (or to confirm the provisioned env), this one-liner prints the
version and the backend — it should report `0.10.2` and `cpu`:

```bash
.venv/Scripts/python.exe -c "import jax; print(jax.__version__, jax.default_backend())"
```

Expected:

```text
0.10.2 cpu
```

## Platform notes

- **Windows / CPU backend works cleanly** — this is what the lab uses. The
  `jax[cpu]` wheel is self-contained: no compiler, no CUDA, no path-length issues.
  [`example.py`](./example.py) was verified on Windows on the CPU backend (see
  [`02_usage.md`](./02_usage.md) for the captured output).
- **First call is slow, then fast.** XLA compiles a `jit`-ted function on its
  *first* invocation (tracing + compilation), so the first call pays a one-off
  cost; subsequent calls with the same input shapes/dtypes reuse the cached
  compiled kernel. Benchmark the **second** call, never the first, and call
  `.block_until_ready()` when timing (JAX dispatches asynchronously).
- **64-bit is opt-in.** JAX defaults to 32-bit floats. We enable 64-bit with
  `jax.config.update("jax_enable_x64", True)` (it must be set **before** any array
  is created) so the Monte-Carlo estimate matches the analytic truth tightly and
  portably.
- **`ABMax` (the JAX-based ABM library) is NOT installed and is NOT usable here.**
  Its pip install **fails on Windows** with a path-length error (`MAX_PATH`
  overflow during the wheel build/unpack). This is exactly why JAX is documented
  as the bare **vectorization primitive** in this lab — `vmap` + `jit` over our
  own vectorized step — and **not** via the ABMax wrapper. Do not add ABMax to any
  requirements file.

## CUDA notes

**None required, and none used.** The CPU wheel has no CUDA dependency whatsoever.
If a CUDA backend were ever wanted on the local RTX 4070 Laptop (8 GB), the
`jax[cuda12]==0.10.2` wheel bundles its own CUDA libraries as pip packages (no
system CUDA toolkit install), and the 8 GB VRAM ceiling from the GPU research
applies (cap batch sizes, prefer fp32). But per the architecture and the
adversarial review, **GPU stays off the ship path** and JAX stays CPU here.

## Related

- [`02_usage.md`](./02_usage.md) — the API, the worked example, and its verified output.
- [`03_applying.md`](./03_applying.md) — where this fits in our scenarios and the honest trade-offs.
- [`../../problem-types/04_monte-carlo-replications.md`](../../problem-types/04_monte-carlo-replications.md) — the methodology this tool serves.
- [`../../guides/03_gpu-lane.md`](../../guides/03_gpu-lane.md) — the lab-wide CPU-fallback / precompute-only policy JAX obeys.
