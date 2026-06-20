# Taichi — installation

**Taichi** (`taichi`) is a Python-embedded domain-specific language for high-performance
**parallel numerical computation**. You write ordinary-looking Python functions over fields
(N-dimensional arrays), decorate them with `@ti.kernel`, and Taichi just-in-time compiles them to
native parallel code via LLVM — running the *same source* on CPU, CUDA, Vulkan or Metal by changing one
argument to `ti.init`. In CAOS_SIMLAB it is the **niche grid / cellular-automata engine**: regular 2D/3D
fields stepped by a stencil (heat/diffusion, fire spread, traffic CA), which is the one workload shape
where the GPU back-ends genuinely help.

- **Installed version in this lab:** `1.7.4`
- **License:** Apache-2.0 (permissive — safe for a public repo, unlike the AGPL-3.0 FLAME GPU 2)
- **Upstream:** <https://github.com/taichi-dev/taichi> · <https://www.taichi-lang.org/>

> New here? Read the [node landing page](../16_taichi.md) first for the one-paragraph "what + when",
> then come back here. After install, go to [`02_usage.md`](./02_usage.md) for the programming model and
> [`03_applying.md`](./03_applying.md) for where it fits in the lab.

## Which requirements lane

Taichi is an **optional, precompute-/GPU-lane** tool — it is **never** on the live web path and
**never** on the VPS. It belongs with the heavier engines used offline to generate committed traces, and
with the GPU lane:

- It is **not** in `requirements.txt` (the slim base/live runtime — that file is deliberately minimal so
  the Pyodide wheel closure stays small; Taichi has a native LLVM core and cannot be in the browser
  closure anyway).
- It sits in the **precompute / GPU lane** (`requirements-precompute.txt` / `requirements-gpu.txt`)
  alongside OR-Tools, joblib and the CuPy/Numba GPU exhibits — installed on demand for the local pipeline,
  never on deploy. Like every GPU-lane tool, its CUDA back-end must degrade gracefully to CPU
  (`arch=ti.cpu`) so GPU-less learners can still run every example. See the
  [GPU lane guide](../../guides/03_gpu-lane.md) for the lab-wide policy.

The four requirements lanes at a glance, and where Taichi lands:

| Lane | File | On deploy? | Taichi here? |
|---|---|---|---|
| Base / live runtime | `requirements.txt` | yes (VPS + Pyodide) | no — native LLVM core, cannot enter the browser closure |
| Precompute | `requirements-precompute.txt` | no (local only) | yes — offline frame generation |
| GPU | `requirements-gpu.txt` | no (local only) | yes — optional CUDA/Vulkan/Metal acceleration |
| Dev / tooling | `requirements-dev.txt` | no | no |

Exact install line (for reference only — **do not run pip in this task; it is already installed**):

```bash
pip install "taichi==1.7.4"
```

## Installed version (verified)

```text
Name: taichi
Version: 1.7.4
License: Apache Software License (http://www.apache.org/licenses/LICENSE-2.0)
Requires: colorama, dill, numpy, rich
Required-by:
```

At import, Taichi prints its build banner, which confirms the toolchain on this machine:

```text
[Taichi] version 1.7.4, llvm 15.0.1, commit b4b956fd, win, python 3.13.0
```

## Key transitive dependencies

Taichi ships its own LLVM-based JIT runtime in the wheel, so the Python-level dependency tree is small:

| Dependency | Role |
|---|---|
| `numpy` | host-side array exchange — `field.to_numpy()` / `field.from_numpy()` |
| `rich` | pretty console / diagnostics output |
| `colorama` | cross-platform coloured terminal output (the `[Taichi] …` banner) |
| `dill` | serialization used internally by Taichi's runtime |

The heavy machinery — the **LLVM 15.0.1** code generator and the per-backend runtimes (x64, CUDA,
Vulkan, Metal) — is bundled inside the `taichi` wheel itself, **not** pulled as separate pip packages.
That is why the install is a single self-contained wheel and why the Python dependency closure stays
tiny despite a full compiler living inside it.

## Platform notes

- **Python:** verified on **CPython 3.13.0** on Windows (`win`) in this lab's `.venv`. Taichi 1.7.x
  ships CPython wheels for Windows / Linux / macOS.
- **CPU back-end (`arch=ti.cpu`):** zero extra system requirements — uses the bundled LLVM x64 runtime.
  This is the default this lab uses for portable examples; it runs identically on a GPU-less machine.
  On Windows the concrete arch the banner reports is `x64` (the name `ti.cpu` is the portable alias).
- **First-run JIT cost:** the very first call into a kernel triggers LLVM compilation (a fraction of a
  second for the small example), then the compiled kernel is cached for the rest of the process. The
  printed timings/checksums are unaffected — only wall-clock-on-first-call is.
- **Determinism:** pass `random_seed=` to `ti.init` and avoid the (parallel, non-deterministic) reduction
  order pitfalls — a pure stencil that writes one output cell per thread (as in `example.py`) is
  bit-stable across runs.

## CUDA / GPU notes

The same kernels run on a GPU by switching the back-end at init — **no kernel code changes**:

```python
ti.init(arch=ti.cuda)     # NVIDIA GPU via CUDA
ti.init(arch=ti.vulkan)   # cross-vendor GPU via Vulkan
ti.init(arch=ti.metal)    # Apple GPU
ti.init(arch=ti.gpu)      # "best available GPU", else error
```

- **CUDA back-end** targets NVIDIA GPUs. On the lab's local RTX 4070 Laptop (8 GB) it works for the
  grid/CA niche, but the **8 GB VRAM ceiling** applies — keep grids and time-step batches bounded
  (`fp32`, not `fp64`) exactly as the GPU-acceleration research warns for this card class.
- **Portability over a hard GPU gate:** every Taichi example in this lab uses `arch=ti.cpu` by default and
  treats the GPU back-end as an optional accelerator selected by an env/CUDA detect — so the repo runs for
  learners with no GPU. This mirrors the CUDA-detect-with-CPU-fallback rule for the whole GPU lane.
- **Vulkan/Metal** give vendor-neutral GPU acceleration without the CUDA toolchain, which is why Taichi is
  attractive for the grid/CA niche specifically: portable GPU code with an Apache-2.0 license.

## Sanity check

```bash
.venv/Scripts/python.exe -c "import taichi as ti; ti.init(arch=ti.cpu); print('taichi', ti.__version__)"
```

Expected: the `[Taichi] version 1.7.4 … x64` banner followed by `taichi (1, 7, 4)`.

*Part of the CAOS_SIMLAB teaching repo — <https://github.com/fsantibanezleal/CAOS_SIMLAB>.*
