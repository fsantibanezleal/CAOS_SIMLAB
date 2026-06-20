# Taichi — applying it to real problems and to our scenarios

## What Taichi is *for* in this lab

Taichi is the lab's **niche grid / cellular-automata engine**: a single computational shape — a regular 2D
or 3D field stepped by a local stencil — written once in Python and run on CPU or GPU by flipping
`ti.init(arch=…)`. The canonical examples are **diffusion** (heat, contaminant), **fire spread**, and
**traffic / cellular automata**, all of which reduce to "update every cell from its neighbours, in
parallel, every step."

It is deliberately **not** a core pillar of CAOS_SIMLAB. The research is explicit that this product's value
is small-N didactic clarity (queueing DES, emergent ABM), where a GPU is pointless — the work is
event-scheduling and branch-heavy logic, not parallel arithmetic. Taichi earns a place only in the **one
workload where regular-grid arithmetic dominates**, and even there it is an *optional* exhibit on the
precompute/GPU lane, never on the live or VPS path.

## Which scenario(s) use it

| Scenario | Role of Taichi |
|---|---|
| **Grid / CA niche (fire spread, diffusion)** — *optional* | The only place Taichi is the right tool. A fire-spread or diffusion field is a regular grid stepped by a stencil; Taichi expresses it cleanly and the *same code* scales to a GPU when the grid is large. This is a candidate "show scale on a grid" exhibit, gated to the precompute lane. |

None of the lab's **flagship** scenarios use Taichi. The scenario→tool map keeps the spine on dedicated,
permissive CPU tools:

- **S01** SimPy + Ciw · **S02 / S03 / S05** Mesa · **S04** SimPy · **S06** OR-Tools CP-SAT
- **S07** OR-Tools + SimPy + OSMnx/NetworkX · **S08** OR-Tools + PyVRP + SimPy
- **S09** OR-Tools + SimPy + graph · **S10** joblib + CuPy/Numba + SciPy · **S11** OR-Tools GLOP + SimPy

Taichi is reserved for the **grid/CA niche** that sits *outside* this flagship set — a teaching exhibit for
the "large spatial grids / cellular models" branch of the GPU decision tree, not a scenario you must ship.

## The pattern: precompute-then-replay (grid edition)

Taichi follows the same lane discipline as every heavy engine in this lab (mirroring CAOS_SEISMIC):

1. **Precompute locally.** Run the Taichi stencil over a grid for the scenario's time horizon on the local
   machine — `arch=ti.cpu` for portability, `arch=ti.cuda` only when the grid is large enough to clear the
   GPU crossover.
2. **Commit a compact artifact.** Snapshot selected frames (or a downsampled field) to a compact
   Arrow/JSON trace — the *same artifact shape* every other scenario emits.
3. **Replay in the browser.** The static web viewer animates the committed frames. The browser never runs
   Taichi: it has a native LLVM core, so it cannot enter the Pyodide wheel closure, and the VPS carries no
   compute dependency at all.

For the grid/CA niche specifically, the pattern is **simulate-the-field-then-replay**: there is no
optimisation step (unlike OR-Tools scenarios) — the value is watching a spatial process evolve under
editable parameters (diffusion coefficient, ignition points, wind), with the heavy frames precomputed and
the light ones potentially re-runnable.

## The research's honest trade-offs

Grounded in the GPU-acceleration research (dimension 07) and its adversarial critique (adv-04):

- **Permissive license — a real advantage.** Taichi is **Apache-2.0**, safe to vendor in a public repo.
  This is the contrast that matters versus **FLAME GPU 2 (AGPL-3.0-only, copyleft)**, which the research
  cuts from the runtime stack precisely because of its license plus a brittle CUDA toolchain. If you want a
  GPU grid demo in a public teaching repo, Taichi is the *clean* choice.
- **Portable back-ends without a CUDA gate.** Taichi runs CPU / CUDA / Vulkan / Metal from one source.
  Vulkan/Metal give vendor-neutral GPU acceleration without the CUDA toolchain coupling, and `arch=ti.cpu`
  guarantees the example runs for GPU-less learners — satisfying the lab's CUDA-detect-with-CPU-fallback
  rule for the whole GPU lane.
- **GPU helps grids only "sometimes" — verify the crossover.** The research's decision table rates large
  spatial grids / CA as **"Sometimes"** for GPU: "regular grid arithmetic maps well to GPU; *verify the
  crossover vs CPU first*." On a small grid (like the 64×64 in our example) the GPU is **slower** than CPU
  because host↔device transfer and kernel-launch overhead dwarf the tiny arithmetic. The GPU only wins when
  the grid is large and the run is long. **Never demo a GPU "speedup" on a small grid — it would be slower
  and would misteach** (the same anti-pattern the curriculum refuses for small-N DES).
- **8 GB VRAM ceiling.** On the lab's RTX 4070 Laptop (8 GB), keep grids and frame batches bounded and use
  `fp32`, not `fp64` — the research documents CUDA OOM on this exact card class for heavy scenes.
- **Determinism for replay.** GPU thread-scheduling is non-deterministic; for a committed, frame-by-frame
  artifact, seed the run and prefer per-cell writes (the example's stencil) over in-kernel reductions, or do
  the reduction on the host — so the trace is reproducible regardless of scheduling.
- **Niche, not pillar — scope discipline.** Both the research and the adversarial review classify Taichi as
  **"Niche (CA/grid scenarios)"** / "document, don't depend." It is not a v1 ship gate. If the grid/CA
  exhibit slips, the lab still ships its full curriculum without it.

## When to pick Taichi vs the alternatives

| Situation | Pick | Why |
|---|---|---|
| **Regular 2D/3D grid stepped by a stencil** (diffusion, fire, CA) — want one source for CPU *and* GPU, permissive license | **Taichi** | Its sweet spot: clean field+kernel idiom, Apache-2.0, portable back-ends. |
| Array-shaped **Monte-Carlo replications** of a cheap model (CI study) | **joblib** (default) → **CuPy / Numba CUDA** (optional GPU) | The highest-ROI GPU use (S10). Drop-in NumPy on GPU; no need for Taichi's DSL. |
| **Discrete-event simulation** (queues, ED flow, ambulance/haul cycles) | **SimPy / Ciw** on CPU | Event-loop DES fights the GPU's SIMT model (only ~1.4–3.21× even when forced); never Taichi/GPU. |
| **Emergent agent-based models** at 10³–10⁴ agents (Schelling, SIR, wolf-sheep) | **Mesa** on CPU | Emergence is visible at small N and runs live; no GPU. |
| **Combinatorial optimisation** (scheduling, routing) | **OR-Tools / PyVRP** on CPU | Native C++ search, no SIMD-parallel core for a GPU to exploit. |
| **Massively parallel ABM at 10⁵–10⁶ agents** | **FLAME GPU 2** — *reference chapter only* | The canonical large-N GPU-ABM engine, but cut from the runtime: AGPL-3.0, brittle CUDA, 8 GB OOM. |
| Custom GPU **physics/geometry** (DEM, SPH, FEM) | (out of scope) NVIDIA Warp | Off-domain for this lab; documented, not used. |

**Deprecated — do not use:** **AgentPy** and **desmod** are deprecated upstream and are listed across the
lab only so they are recognised and avoided; they are never adopted.

## Bottom line

Reach for Taichi **only** when you have a regular-grid stencil (the fire/diffusion/CA niche) and want one
piece of Python that runs portably on CPU and scales to a GPU under a permissive license. Run it
`arch=ti.cpu` by default, precompute frames locally, commit a compact trace, replay statically. Verify the
GPU crossover before claiming any speedup, respect the 8 GB ceiling, and treat the whole exhibit as a niche
teaching asset — not a pillar, and never on the live or VPS path.

## References (from research dimension 07 / adv-04)

- Taichi Lang (Apache-2.0, particle/field/CA grids): <https://github.com/taichi-dev/taichi> ·
  <https://www.taichi-lang.org/>
- GPU-acceleration decision table and "Sometimes" verdict for grids/CA — research dimension 07
  (GPU-Accelerated Simulation for caos-simlab).
- Adversarial critique 04 (frameworks & GPU): Taichi classified "document, don't depend"; FLAME GPU 2 cut
  for AGPL-3.0 + CUDA coupling.
- RTX 4070 Laptop 8 GB VRAM ceiling (CUDA OOM on this class):
  <https://www.tech360.tv/rtx-4070-laptop-gpu-has-only-8gb-vram>
- GPU-accelerated DES, SimPy + TensorFlow (only 1.4×–3.21× — DES is a poor GPU fit):
  <https://ieeexplore.ieee.org/document/9631514/>

*Part of the CAOS_SIMLAB teaching repo — <https://github.com/fsantibanezleal/CAOS_SIMLAB>.*
