# 04 · Gotchas — traps & the reference-only engines

The GPU stack is the most fragile part of the lab. This page collects the traps that bite when the lane is
turned on, and records the heavy-ABM engines that are **documented but deliberately not installed** — so the
"why not" is captured honestly rather than rediscovered.

## Performance traps (the verdict, made concrete)

- **Don't put the DES model on the GPU.** A small, branch-heavy discrete-event loop (a queue, an ED) is
  *measurably slower* on a GPU — async event scheduling fights the SIMT execution model. The GPU lane is scoped
  to S10's data-parallel replications precisely to avoid misteaching this. See the
  [honest verdict](../03_gpu-lane.md#the-honest-verdict-teach-this-dont-oversell-it).
- **Transfer/launch overhead can erase the win.** Below the crossover, host↔device copy and kernel-launch cost
  outweigh the parallel arithmetic. Reach for the GPU only when millions of draws / thousands of replications
  genuinely dwarf that overhead.
- **GPU adds speed, not understanding.** The CPU [joblib](../../frameworks/12_joblib.md) default already
  delivers the didactic lesson and the same mean + CI; the GPU is the scaling appendix, not the teacher.

## Platform / install traps

- **`CUDA path could not be detected`.** Set `CUDA_PATH` to your CUDA 12 toolkit. Basic array ops
  (`getDeviceCount()`, elementwise) may still work, but anything that JITs a kernel will not — see next.
- **Headers required for kernel JIT.** CuPy compiles custom kernels at runtime; without the CUDA toolkit
  *headers* present, kernel-JIT paths fail even when simple ops succeed. A full CUDA 12 toolkit (not just the
  driver) is needed for the kernel exhibits.
- **8 GB VRAM ceiling.** The verified box is an RTX 4070 Laptop with 8 GB. Size replication batches / array
  columns so the working set fits; out-of-memory is a sizing bug, not a code bug.
- **Brittle version coupling.** `numba` / `llvmlite` / NumPy / Python are tightly co-pinned, as are
  `jax` / `jaxlib`. Use the verified combination in [01 · Setup](./01_setup.md) as a unit; bumping one wheel in
  isolation is the usual cause of an import-time failure.

## Determinism trap

GPU thread-scheduling is non-deterministic across runs. **Never** rely on run-order reproducibility — seed
**per replication** and snapshot the deterministic reduced state into the trace, as detailed in
[03 · Internals](./03_internals.md#reproducibility-the-seeding-rule). A "GPU result that won't reproduce" is
almost always a missing per-replication seed, not a hardware issue.

## Reference-only — documented, not installed

Three heavy / GPU agent-based-modeling engines were evaluated for the *million-agent* case and deliberately
**not** shipped. They live as a reference chapter — [Heavy / GPU ABM](../../frameworks/18_gpu-abm-chapter.md) —
not as pipelines:

| Engine | What it is | Why not installed |
|---|---|---|
| **FLAME GPU 2** | CUDA message-passing million-agent GPU-ABM | AGPL-3.0, CUDA-coupled, **no PyPI wheel** (conda/source only) |
| **ABMax** | JAX `vmap`-over-population ABM | pip install **fails on Windows** (WinError 206 — path too long, via orbax) |
| **AMBER** | Polars-columnar big-ABM accelerator (CPU) | niche packaging, no payoff at this lab's scale |

The discipline behind not installing them is the lab's own: the ABM scenarios (S02 Schelling, S03 SIR, S05 Beer
Game) are already legible at [Mesa](../../frameworks/04_mesa.md) scale, and the one genuinely "heavy" scenario,
S10, is a Monte-Carlo replication study that is embarrassingly parallel on plain CPU cores via
[joblib](../../frameworks/12_joblib.md). The research punchline holds: **replications, not population size, are
the high-ROI parallel workload here** — reach for a heavy-ABM engine only when you are *provably* above ~10⁵
agents, the model is vectorizable, and the arithmetic dwarfs the overhead.

## Next

- Back to the [GPU lane index](../03_gpu-lane.md).
- The deploy-side context: [precompute pipeline](../01_precompute-pipeline.md) (where the trace goes) and
  [live lane (Pyodide)](../02_live-lane-pyodide.md) (which can never run any of this).
