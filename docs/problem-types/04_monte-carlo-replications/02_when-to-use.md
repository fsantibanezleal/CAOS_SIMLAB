# 02 — When to use it: regimes & the CPU/GPU decision

> Part of [Monte-Carlo replications & the simulation-methodology curriculum](../04_monte-carlo-replications.md).
> Prev: [01 — What it is](./01_what-it-is.md) · Next: [03 — Methods & KPIs](./03_methods-and-kpis.md).

You *always* report an interval, not a point, for any stochastic KPI — that part is unconditional (see
[03 — Methods & KPIs](./03_methods-and-kpis.md)). What this page decides is **which regime your model is in**
(terminating vs steady-state, which determines whether warm-up deletion even applies) and **which compute
fans the replications** (CPU by default; GPU only above a measured crossover).

## Which regime: terminating vs steady-state

The first question is *what KPI are you even estimating?* — and the answer dictates whether the
initial-transient (warm-up) correction in [03 — Methods & KPIs](./03_methods-and-kpis.md) applies at all.

- **Steady-state models** answer "what is the long-run average once the system has filled up?" — e.g. the
  mean wait in an always-open M/M/c queue. A simulation almost always starts *empty-and-idle*, which is not
  representative, so the early observations bias the steady-state estimate **downward**. These models need
  **warm-up deletion** (Welch's method) before the KPI is computed.
- **Terminating models** have a natural start and stop where the transient *is* the system — a bank that
  opens at 9:00 and closes at 17:00, a single emergency-department shift. There is **no steady state to
  estimate**, so you must **not** apply warm-up deletion; you estimate the full-horizon KPI instead.

Knowing which regime you are in is part of the lesson. The dedicated exhibit
[S10](../../use-cases/10_s10_montecarlo.md) replicates a steady-state queue and shows the warm-up correction;
the [S04 emergency-department](../../use-cases/04_s04_ed.md) flagship is a terminating shift where the
transient is the answer.

## Which compute: the honest GPU verdict

Once you know you need many replications, the next decision is CPU vs GPU. **Most of the time the answer is
CPU**, and the reasoning is the part most write-ups get wrong, so we state it bluntly: **a GPU does not speed
up a discrete-event simulation's event loop.** Classic DES is asynchronous, branch-heavy event scheduling —
the antithesis of the GPU's SIMT (single-instruction, many-thread) model. The only honest published
DES-on-GPU result we found is a **1.4×–3.21×** speedup for SimPy-style manufacturing DES accelerated via
TensorFlow (Hofmann et al., IEEE 2021) — a small payoff that *confirms* event-scheduling DES is a poor GPU
fit. On the **small** queueing models in this lab ([S01](../../use-cases/01_s01_queue.md),
[S04](../../use-cases/04_s04_ed.md)), a GPU is *slower* than a single CPU core once you count host↔device
transfer and kernel-launch overhead, and a CPU run finishes in milliseconds anyway.

Where the GPU genuinely wins is **massive data-parallel arithmetic**, which shows up in this product in two
shapes:

1. **Thousands of *independent* replications** of an otherwise-cheap model — one replication per GPU thread,
   each with its own RNG stream. This is the single highest-ROI GPU use here: "give me a 95% CI on mean wait
   over 10,000 seeds" goes from minutes to a fraction of a second. Numba-CUDA Monte-Carlo shows **8–12× over
   CPU** for large ensembles (MDPI radiation-transport study, RTX 3080).
2. **Large-N agent-based / grid models** — tens of thousands to millions of lightweight agents stepping in
   parallel (crowd egress, epidemic spread, cellular automata). FLAME GPU 2 reports **3.5× and 10×**
   ensemble/concurrency speedups on million-agent models (Richmond et al. 2023) — but note that win is over
   *CPU ABM*, not over CPU queueing.

### Decision table — when does GPU actually help?

| Workload shape | GPU verdict | Why | Tool in this lab |
|---|---|---|---|
| Small-N event-loop DES (M/M/c, ED flow, ambulance/haul cycles) | **No — GPU is *slower*** | Asynchronous, branch-heavy event scheduling fights SIMT; only ~1.4–3.21× even when forced; CPU finishes in ms | [SimPy](../../frameworks/01_simpy.md) / [Ciw](../../frameworks/02_ciw.md) on CPU |
| **Thousands of independent replications** of a cheap model (a CI study) | **Yes — strongest fit** | Embarrassingly parallel; one thread per seed, independent RNG streams; 8–12× over CPU on large ensembles | [**joblib (default)**](../../frameworks/12_joblib.md), optional [CuPy](../../frameworks/15_cupy.md) / [Numba CUDA](../../frameworks/14_numba.md) |
| Large-N ABM (10⁴–10⁶ lightweight agents) | **Yes** | Data-parallel agent stepping; 3.5×/10× over CPU ABM | [FLAME GPU 2](../../frameworks/18_gpu-abm-chapter.md) (*reference chapter only*) |
| Large spatial grids / cellular automata (diffusion, fire, traffic CA) | **Sometimes** | Regular grid arithmetic maps well to GPU; verify the crossover vs CPU first | [Taichi](../../frameworks/16_taichi.md) or CuPy (niche) |
| Combinatorial optimisation (CP-SAT, VRP) | **No** | Native C++ search, no SIMD-parallel arithmetic core | OR-Tools / PyVRP on CPU (see [Optimization & Routing](../03_optimization-routing.md)) |

**The crossover rule of thumb:** GPU wins only when the *parallel arithmetic* dwarfs both the host↔device
transfer and the kernel-launch overhead — i.e. many thousands of independent threads each doing real work.
Below that, **stay on the CPU.** A "GPU speedup" demo on a small queueing DES would be *slower than CPU and
would misteach*; we refuse to show one.

### What this means for CAOS_SIMLAB v1

- **No GPU dependency is on the ship path.** The "10k-replications CI study"
  ([S10](../../use-cases/10_s10_montecarlo.md)) — the highest-ROI GPU use — runs in **seconds on CPU cores
  via [joblib](../../frameworks/12_joblib.md)**, so it ships as **CPU precompute** and delivers the full
  replications / warm-up / CI curriculum without a GPU gate.
- **GPU is one *optional* exhibit, never on the VPS / Pages runtime path.** [CuPy](../../frameworks/15_cupy.md)
  / [Numba](../../frameworks/14_numba.md) Monte-Carlo lives in a separate `requirements-gpu.txt` behind a
  **CUDA-detect-with-CPU-fallback** so GPU-less learners reproduce every result on CPU. See the
  [GPU lane guide](../../guides/03_gpu-lane.md).
- **FLAME GPU 2 is a reference chapter, not a runtime dependency** — AGPL-3.0-only (copyleft), a real CUDA
  toolchain learning curve, and documented 8 GB-VRAM OOM on the exact RTX 4070-Laptop class. We document it
  as the canonical large-N GPU-ABM engine and cut it from the critical path
  ([18 — GPU-ABM chapter](../../frameworks/18_gpu-abm-chapter.md)).

## Next

- [03 — Methods & KPIs](./03_methods-and-kpis.md) — the CI math, warm-up deletion, variance reduction, DOE.
- [04 — Tools](./04_tools.md) — the dedicated tool for each job and the per-backend RNG recipes.
