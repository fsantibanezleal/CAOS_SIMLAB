# 16 · Taichi — the grid / cellular-automata engine

**Taichi** (`taichi`, v1.7.4, Apache-2.0) is a Python-embedded DSL for high-performance **parallel
numerical computation**. You write ordinary-looking Python functions over *fields* (N-dimensional arrays),
decorate them `@ti.kernel`, and Taichi JIT-compiles them to native parallel code via LLVM — and the *same
source* runs on CPU, CUDA, Vulkan or Metal by changing one argument to `ti.init`. In CAOS_SIMLAB it is the
**niche grid / cellular-automata engine**: a regular 2D/3D field stepped by a local stencil — heat /
contaminant **diffusion**, **fire spread**, **traffic CA** — which is the one workload shape in this lab
where a GPU back-end genuinely helps.

It is deliberately **not** a pillar of the lab. The flagship value here is small-N didactic clarity
(queueing DES, emergent ABM) where a GPU is pointless; Taichi earns its place only in the one workload
where regular-grid arithmetic dominates, and even there it stays an **optional precompute/GPU-lane
exhibit** — never on the live web path, never on the VPS. The lab uses it `arch=ti.cpu` by default so every
example runs on a GPU-less machine, precomputes frames locally, commits a compact trace, and replays it
statically in the browser (which cannot run Taichi's native LLVM core). Pick it when — and only when — your
state is a regular lattice updated synchronously from its neighbours and you want one piece of Python that
scales from CPU to GPU under a permissive license. For everything else (DES, emergent ABM, optimisation,
plain GPU arrays) a CPU tool or CuPy/JAX is the better choice.

## Read in order

1. [`01_installation.md`](./16_taichi/01_installation.md) — exact pip line + version, the requirements
   lane, dependency tree, platform/CUDA notes, sanity check.
2. [`02_usage.md`](./16_taichi/02_usage.md) — the fields + kernels model, the real API, the worked example
   walked through step by step, and its **real captured output**.
3. [`03_applying.md`](./16_taichi/03_applying.md) — how to formalise the stencil-on-a-grid problem and
   solve it with Taichi, which lab scenarios touch it, the honest GPU trade-offs, and when to pick it vs the
   alternatives.

## Run the example

```bash
.venv/Scripts/python.exe docs/frameworks/16_taichi/example.py
```

[`example.py`](./16_taichi/example.py) advances the 2D heat equation with the explicit 5-point stencil on a
64×64 grid for 200 steps and prints a **bit-stable checksum** (`226.791031`) — the smallest honest demo of
why Taichi exists.

## Related in the lab

- [Monte-Carlo / GPU verdict](../problem-types/04_monte-carlo-replications/02_when-to-use.md#which-compute-the-honest-gpu-verdict)
  — the "when does GPU actually help?" decision table that classifies grids/CA as *"Sometimes — verify the
  crossover."*
- [Agent-based modeling](../problem-types/02_agent-based-modeling.md) — the grid-environment ABMs (S02
  Schelling, S03 SIR) that are Taichi's closest conceptual cousins but ship on CPU via Mesa.
- [GPU lane guide](../guides/03_gpu-lane.md) — the lab-wide CPU-fallback / precompute-only policy Taichi obeys.
- Sibling GPU-lane nodes: [CuPy](./15_cupy.md) · [Numba](./14_numba.md) · [JAX](./17_jax.md) · [joblib](./12_joblib.md) ·
  GPU-ABM reference chapter [FLAME GPU 2 / ABMax / AMBER](./18_gpu-abm-chapter.md).

*Part of the CAOS_SIMLAB teaching repo — <https://github.com/fsantibanezleal/CAOS_SIMLAB>.*
