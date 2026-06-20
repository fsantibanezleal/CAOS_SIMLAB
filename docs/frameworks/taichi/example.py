"""Taichi minimal example for CAOS_SIMLAB — one heat-diffusion step on a 2D grid.

This is the smallest honest demonstration of why Taichi exists: write an
ordinary-looking Python function over a 2D field, decorate it as a Taichi
@ti.kernel, and Taichi JIT-compiles it to parallel native code. The same kernel
runs on CPU (ti.cpu, used here for portability) or GPU (ti.cuda / ti.vulkan /
ti.metal) by changing one argument to ti.init — nothing else in the code moves.

The model is the classic 5-point explicit finite-difference update of the 2D
heat equation (a stand-in for the fire/diffusion grid/CA niche in this lab):

    u_new[i, j] = u[i, j] + alpha * (u[i-1, j] + u[i+1, j]
                                     + u[i, j-1] + u[i, j+1] - 4 * u[i, j])

with a fixed-temperature hot source held at the centre and a zero (cold)
Dirichlet boundary on the grid edge. Each cell's update depends only on its four
neighbours from the *previous* step, so every interior cell can be computed
independently and in parallel — exactly the data-parallel, regular-grid shape
where a GPU would help (and where a small grid like this one runs fine on CPU).

Determinism: the initial field is built from a fixed numeric pattern (no RNG),
the update is a pure arithmetic stencil, and ti.init is given a fixed
random_seed, so the printed checksum is bit-stable across runs on this build.

Run (cwd = repo root):
    .venv/Scripts/python.exe docs/frameworks/taichi/example.py
"""

import numpy as np
import taichi as ti

# Portable, deterministic init. arch=ti.cpu so the example runs anywhere (no
# CUDA required); switch to ti.cuda to run the identical kernel on the GPU.
ti.init(arch=ti.cpu, random_seed=0, default_fp=ti.f32)

N = 64            # grid is N x N cells (small on purpose: CPU finishes instantly)
ALPHA = 0.20      # diffusion coefficient; < 0.25 keeps the explicit scheme stable
STEPS = 200       # number of diffusion steps to advance

# Two Taichi fields = device-resident 2D arrays. We ping-pong between them so we
# never read and write the same buffer within a single step.
u = ti.field(dtype=ti.f32, shape=(N, N))
u_next = ti.field(dtype=ti.f32, shape=(N, N))


@ti.kernel
def seed_field():
    """Deterministic initial condition: everything cold (0.0)."""
    for i, j in u:          # this loop is automatically parallelised by Taichi
        u[i, j] = 0.0


@ti.kernel
def apply_source():
    """Hold a hot square at the centre of the grid (a fixed Dirichlet source)."""
    c = N // 2
    for di, dj in ti.ndrange((-2, 3), (-2, 3)):   # 5x5 block around the centre
        u[c + di, c + dj] = 1.0


@ti.kernel
def diffuse_step():
    """One explicit 5-point heat-diffusion update, written into u_next."""
    for i, j in u_next:
        if 0 < i < N - 1 and 0 < j < N - 1:        # interior cells only
            lap = (u[i - 1, j] + u[i + 1, j]
                   + u[i, j - 1] + u[i, j + 1]
                   - 4.0 * u[i, j])
            u_next[i, j] = u[i, j] + ALPHA * lap
        else:
            u_next[i, j] = 0.0                      # cold Dirichlet boundary


def main():
    seed_field()
    for _ in range(STEPS):
        apply_source()        # re-impose the hot source each step
        diffuse_step()        # compute the next field from the current one
        u.copy_from(u_next)   # ping-pong: next becomes current

    # Pull the field back to the host as a NumPy array and summarise it. A
    # checksum (sum) plus a couple of point readings is enough to prove the
    # kernel actually ran and produced a stable, sensible result.
    field = u.to_numpy()
    total = float(field.sum())
    centre = float(field[N // 2, N // 2])
    corner = float(field[1, 1])

    print(f"Taichi {ti.__version__}  arch=cpu  grid={N}x{N}  steps={STEPS}")
    print(f"field checksum (sum)   = {total:.6f}")
    print(f"centre temperature     = {centre:.6f}")
    print(f"near-corner [1,1] temp = {corner:.6f}")
    print(f"min / max              = {field.min():.6f} / {field.max():.6f}")
    # Round the checksum so the printed value is stable across fp rounding noise.
    print(f"checksum (rounded 3dp) = {round(total, 3)}")


if __name__ == "__main__":
    main()
