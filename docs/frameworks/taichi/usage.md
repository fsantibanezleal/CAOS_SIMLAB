# Taichi — usage

This guide teaches the core Taichi programming model through the lab's runnable example
([`example.py`](./example.py)): **one explicit heat-diffusion step on a small 2D grid**, run on the CPU
back-end for portability, finishing with a deterministic checksum of the field.

## The mental model: fields + kernels

Taichi has two ideas you need and almost nothing else:

1. **Fields** (`ti.field`) are device-resident N-dimensional arrays — the data your computation lives in.
   A `ti.field(dtype=ti.f32, shape=(N, N))` is a 2D float grid that may sit in CPU or GPU memory depending
   on the active back-end. You move data to/from the host with `field.to_numpy()` and
   `field.from_numpy(arr)`, and copy between fields with `field.copy_from(other)`.

2. **Kernels** (`@ti.kernel`) are the functions Taichi JIT-compiles to parallel native code. The crucial
   rule: **the outermost `for` loop in a kernel is automatically parallelised.** Writing
   `for i, j in u:` launches one parallel task per cell of field `u`. There is no thread bookkeeping,
   no block/grid sizing — Taichi maps the loop onto whatever back-end is active (`x64` cores, CUDA threads,
   Vulkan invocations).

A typical Taichi program is therefore: `ti.init(arch=…)` once, declare your fields, write kernels that
loop over fields, then call the kernels in a Python loop. That is the whole skeleton.

### Key API used in the example

| Call | What it does |
|---|---|
| `ti.init(arch=ti.cpu, random_seed=0, default_fp=ti.f32)` | Initialise the runtime: pick the back-end, set the seed (determinism) and the default float type. Call once. |
| `ti.field(dtype=ti.f32, shape=(N, N))` | Allocate a 2D float field (our grid). |
| `@ti.kernel` | Mark a function for JIT compilation + auto-parallelisation. |
| `for i, j in u:` | Parallel loop over every cell of field `u` (one task per cell). |
| `ti.ndrange((-2, 3), (-2, 3))` | Compile-time-friendly explicit loop bounds (here a 5×5 block). |
| `u.copy_from(u_next)` | Ping-pong: copy the freshly computed field back into the current one. |
| `u.to_numpy()` | Pull the field to the host as a NumPy array for summary / plotting. |

## The model in the example

The example advances the **2D heat equation** with the standard explicit 5-point stencil — the simplest
member of the grid/CA family this tool serves (heat/diffusion is the same arithmetic shape as a smoothed
fire-spread or contaminant-diffusion grid):

```
u_new[i, j] = u[i, j] + alpha * (u[i-1, j] + u[i+1, j] + u[i, j-1] + u[i, j+1] - 4 * u[i, j])
```

Boundary and source conditions:

- A **hot source** (a 5×5 block at the grid centre) is re-imposed every step at temperature `1.0`
  (a fixed Dirichlet source).
- The grid edge is held **cold** (`0.0`) — a zero Dirichlet boundary.
- `alpha = 0.20` keeps the explicit scheme **stable** (the 2D stability limit for this stencil is
  `alpha < 0.25`).

Each cell's new value depends only on its four neighbours *from the previous step*, so we **ping-pong**
between two fields (`u`, `u_next`) — never read and write the same buffer in one step — and the entire
interior updates in parallel. That data-parallel, neighbour-only structure is exactly what a GPU eats for
breakfast (and what a small CPU grid still finishes instantly).

## Walk-through, step by step

1. **`ti.init(arch=ti.cpu, random_seed=0, default_fp=ti.f32)`** — start Taichi on the portable CPU
   back-end, fix the seed (so the run is reproducible) and default floats to `f32` (GPU-friendly, and all
   we need).
2. **Declare fields** — `u` (current temperature grid) and `u_next` (next grid), both `N×N` `f32`.
3. **`seed_field()`** — a kernel that sets every cell to `0.0` (cold start). The `for i, j in u:` loop is
   parallel.
4. **Time loop (Python side), `STEPS` times:**
   - **`apply_source()`** — re-impose the hot centre block.
   - **`diffuse_step()`** — the parallel stencil: for every interior cell compute the 5-point Laplacian and
     write `u_next`; force the boundary cells to `0.0`.
   - **`u.copy_from(u_next)`** — promote `u_next` to `u` for the next iteration.
5. **Summarise** — `u.to_numpy()` brings the field to the host; we print a **checksum** (the field sum)
   plus a few point readings as proof the kernel ran and the result is sensible (centre pinned at `1.0`,
   corner cold at `0.0`, everything in `[0, 1]`).

## Run it

From the repository root:

```bash
.venv/Scripts/python.exe docs/frameworks/taichi/example.py
```

## Verified output

Captured by actually running the command above from the repo root (Taichi 1.7.4, CPU back-end, Windows,
CPython 3.13.0). The checksum is **bit-stable across repeated runs** (verified — the same `226.791031`
every time), because the initial condition is fixed and the stencil is a pure per-cell write with no
RNG and no order-dependent reduction:

```text
[Taichi] version 1.7.4, llvm 15.0.1, commit b4b956fd, win, python 3.13.0
[Taichi] Starting on arch=x64
Taichi (1, 7, 4)  arch=cpu  grid=64x64  steps=200
field checksum (sum)   = 226.791031
centre temperature     = 1.000000
near-corner [1,1] temp = 0.000000
min / max              = 0.000000 / 1.000000
checksum (rounded 3dp) = 226.791
```

Reading the result:

- **`arch=x64`** in the banner confirms Taichi compiled the kernels for the CPU back-end (despite the
  argument being named `ti.cpu`, the concrete arch on this Windows box is `x64`).
- **`Taichi (1, 7, 4)`** — note `ti.__version__` is a **version tuple**, not a string; printed verbatim.
- **`centre = 1.000000`** — the hot source held its value (re-imposed each step), as designed.
- **`near-corner [1,1] = 0.000000`** — heat has not yet diffused from the centre out to the corner after
  200 steps with `alpha=0.20` and a 64×64 grid; the corner is still cold. Consistent with a diffusion
  front spreading slowly from the centre.
- **`min / max = 0 / 1`** — the field stayed within the source/boundary bounds, confirming the scheme is
  **stable** (no overshoot/oscillation, which is what would happen if `alpha ≥ 0.25`).
- **`checksum (sum) = 226.791031`** — the single number that proves the whole pipeline ran deterministically.

## Running the identical kernel on a GPU

To move this computation to an NVIDIA GPU, change **one line** and nothing else:

```python
ti.init(arch=ti.cuda, random_seed=0, default_fp=ti.f32)   # was ti.cpu
```

The fields now live in VRAM and the `for i, j in …` loops launch CUDA threads. On a 64×64 grid this is
*slower* than CPU (transfer + launch overhead dwarfs the tiny arithmetic) — the GPU only pays off on much
larger grids / longer runs. That crossover caveat is the whole point of the
[GPU verdict](../problem-types/monte-carlo-replications.md#8-the-honest-gpu-verdict--when-does-gpu-actually-help)
and is covered in [`applying.md`](./applying.md).

## Pitfalls

- **Don't read and write one field in a single kernel for a stencil** — neighbouring cells would read
  half-updated values. Ping-pong between two fields (as here).
- **Keep `alpha < 0.25`** for the 2D explicit heat stencil, or the scheme blows up (you'd see `max`
  exceed the source value and oscillate).
- **Top-level loop = parallel.** If you need a *sequential* inner loop inside a kernel, nest it; only the
  outermost loop is parallelised. Don't assume iteration order inside a parallel loop.
- **Reductions can be non-deterministic on GPU** due to floating-point summation order. The per-cell write
  here avoids that; if you need a reduction inside a kernel for a reproducible artifact, compute the sum on
  the host (`to_numpy().sum()`) as the example does.

*Part of the CAOS_SIMLAB teaching repo — <https://github.com/fsantibanezleal/CAOS_SIMLAB>.*
