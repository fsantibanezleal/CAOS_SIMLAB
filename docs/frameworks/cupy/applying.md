# CuPy — applying it to a real problem

CuPy is the lab's **optional GPU exhibit** for *array Monte-Carlo*: thousands of independent stochastic
replications expressed as batched array math, run on the GPU. This page covers the scenario it serves, the
pattern to use, the **honest trade-offs from the research**, and when to pick it over the alternatives.

The conceptual backbone is [`docs/problem-types/monte-carlo-replications.md`](../../problem-types/monte-carlo-replications.md);
this page is the practitioner's "when and how".

---

## Which scenario uses it

- **S10 — Monte-Carlo Replication / CI Study → the GPU exhibit.** S10 runs `N` independent, seeded
  replications of the S01 M/M/c queue and turns them into a running mean + 95% CI (and, at high load, the
  finite-run-bias lesson). Its **default driver is CPU** (the running mean / CI converges in milliseconds to
  seconds on the laptop's CPU cores), and CuPy is the **optional "and here's the GPU version" appendix**: the
  same replication batch, drawn and reduced as array columns on the device.

S10 is the **only** scenario in the lab that uses CuPy. Every other scenario is CPU by design:
SimPy + Ciw (S01), Mesa 3 ABM (S02/S03/S05), SimPy (S04), and OR-Tools / PyVRP / NetworkX
(S06–S09, S11) — none of which a GPU helps (see the trade-offs below).

> **Reference-only neighbours.** For *large-N* GPU work the canonical engine is **FLAME GPU 2**, but it is
> documented as a **reference chapter, not a runtime dependency** — AGPL-3.0-only (copyleft), CUDA-version
> coupled, with documented 8 GB-VRAM OOM on the RTX 4070-Laptop class. **Numba CUDA** is the sibling exhibit
> for *custom per-thread kernels* (one replication per thread, `xoroshiro128p` RNG). **CuPy is the simplest,
> permissively-licensed (MIT) array option** and the one wired into S10.

---

## The pattern: estimate-the-batch, summarise-once

CuPy's idiom here is **not** "optimize-then-simulate" and **not** an event loop. It is **batched array
Monte-Carlo**:

1. **Express one replication's work as array arithmetic.** Replace the per-seed Python loop with vectorized
   ops over an array whose length (or width) is the number of replications/draws. In the example, π is
   estimated by `N` darts as a single `(x*x + y*y) <= 1` pass.
2. **Draw on the device with a seeded cuRAND generator.** `cp.random.default_rng(seed)` — same API as NumPy,
   so the code is backend-agnostic via an `xp` handle.
3. **Keep everything on the device; transfer once.** Do the reduction (`.sum()`, `.mean()`, `cp.histogram`,
   percentiles) on the GPU and pull back only the **small summary** (mean, CI half-width, a few KPIs). The
   PCIe round-trip is the cost; one trip at the end amortises it.
4. **Attach the statistics on the host.** The CI math (`z`/`t` critical values) is cheap and stays in
   `scipy.stats` on the CPU — never hand-rolled. See
   [`docs/problem-types/monte-carlo-replications.md`](../../problem-types/monte-carlo-replications.md) §3.
5. **Commit the summary as a replay artifact.** The GPU precompute writes the *same artifact shape* (CI
   envelope / KPIs) the CPU path writes, so the trace-player replays both transparently and the VPS carries
   no CUDA dependency.

A subtlety the lab keeps honest: the **batched-array** formulation (the GPU-friendly one) is great for KPIs
that are pure functions of array reductions (a mean wait via the earliest-free-server method, a hit-fraction,
a tail quantile). For a *true* event-by-event DES whose logic is branch-heavy and sequential, you do **not**
port the event loop to the GPU — you parallelise across **independent replications** instead (one column per
seed), each still computed with array ops. The GPU never accelerates the event scheduling itself.

---

## The research's honest trade-offs

Grounded in research dimension 07 (GPU acceleration) and adversarial critique 04 — read these before
reaching for a GPU.

- **A GPU does *not* accelerate a discrete-event loop.** Classic DES is asynchronous, branch-heavy event
  scheduling — the antithesis of the GPU's SIMT model. The only honest published DES-on-GPU result is
  **1.4×–3.21×** (SimPy-style manufacturing DES via TensorFlow, Hofmann et al., IEEE 2021) — a non-result
  that *confirms* DES is a poor GPU fit. On the small queues in this lab, a GPU is **slower** than one CPU
  core once you count kernel-launch + transfer overhead, and the CPU finishes in milliseconds anyway.
- **Where the GPU genuinely wins: thousands of *independent* replications.** This is the single highest-ROI
  GPU shape in the product — "give me a 95% CI on mean wait over 10,000 seeds" goes from minutes to a
  fraction of a second. Numba-CUDA Monte-Carlo shows **8–12× over CPU** for large ensembles (MDPI
  radiation-transport study, RTX 3080). CuPy reaches the same win with drop-in array code.
- **…but the CPU already delivers the *lesson*.** Adversarial critique 04 is blunt: 10k replications of a
  cheap model run in **seconds on the laptop's CPU cores via joblib**, and the *didactic* point (variance,
  CIs, design-of-experiments) is **identical**. **The GPU adds speed, not understanding.** That is precisely
  why S10 ships CPU-default and CuPy is an appendix.
- **The 8 GB VRAM ceiling is real.** Use `float32` over `float64` for the largest batches, cap batch size,
  and chunk very large replication counts. Documented CUDA-OOM reports exist for this exact 4070-Laptop-8GB
  class.
- **Determinism vs animation.** GPU thread-scheduling is non-deterministic; for any replayed trace, fix the
  per-replication seed and snapshot deterministic state so the committed artifact is reproducible regardless
  of scheduling.
- **License & deploy hygiene.** CuPy is **MIT** (safe). But **no GPU dependency goes on the VPS / Pages
  runtime path** — prod serves only `dist` + precomputed artifacts (ADR-0002). CuPy lives strictly in
  `requirements-gpu.txt` behind a CUDA-detect-with-CPU-fallback.

---

## When to pick CuPy vs the alternatives

| You have… | Pick | Why |
|---|---|---|
| A small event-loop DES (M/M/c, ED flow, ambulance/haul cycles) | **SimPy / Ciw on CPU** — *not* a GPU | DES fights SIMT; GPU is slower; CPU finishes in ms |
| Thousands of independent replications for a CI study — *teaching* | **joblib (CPU, the v1 default)** | Same lesson in seconds, zero CUDA gate, runs for everyone |
| Thousands of independent replications — *array math, want the GPU exhibit* | **CuPy** | Drop-in NumPy on GPU, cuRAND RNG, MIT licence, simplest GPU code; one column per seed |
| Per-replication logic that needs a *custom kernel* / per-thread RNG control | **Numba CUDA** | Explicit `xoroshiro128p` per-thread streams; finer control than array ops |
| Confidence-interval / `t`/`z` math | **SciPy `scipy.stats`** | Canonical, tested; never hand-roll critical values |
| Large-N ABM (10⁴–10⁶ lightweight agents) | **FLAME GPU 2 — reference only** | The canonical GPU-ABM engine, but AGPL-3.0 + brittle CUDA → documented, not vendored |
| Combinatorial optimisation (CP-SAT, VRP) | **OR-Tools / PyVRP on CPU** | Native C++ search; no SIMD-parallel arithmetic core to exploit |

**Decision rule (the crossover):** reach for CuPy only when the *parallel arithmetic* (many millions of
independent draws / many thousands of replications) dwarfs both the host↔device transfer and the
kernel-launch + first-JIT cost. Below that line, **stay on the CPU** — and for *teaching*, prefer joblib so
the result reproduces for a GPU-less reader. CuPy is an exhibit that shows the code is GPU-ready and that the
scaling crossover is real; it is never a correctness requirement.

> **Do not use:** **AgentPy** and **desmod** — both deprecated upstream; named here only so they are
> recognised and avoided.

---

## References (research dimension 07 / adversarial critique 04)

- CuPy (drop-in NumPy on GPU, cuRAND-backed, MIT): <https://cupy.dev/>
- Numba + CuPy Monte-Carlo (8–12× over CPU, RTX 3080): <https://www.mdpi.com/2079-3197/12/3/61>
- GPU-accelerated DES, SimPy + TensorFlow (only 1.4×–3.21× — DES is a poor GPU fit):
  <https://ieeexplore.ieee.org/document/9631514/>
- Queuing-network simulation on GPU (asynchronous DES fights SIMT):
  <https://dl.acm.org/doi/10.1145/1921598.1921602>
- FLAME GPU 2 (large-N GPU-ABM, AGPL-3.0; 3.5×/10× over CPU ABM), Richmond et al. 2023:
  <https://onlinelibrary.wiley.com/doi/full/10.1002/spe.3207> · repo <https://github.com/FLAMEGPU/FLAMEGPU2>
- Numba CUDA RNG (`xoroshiro128p`, period 2¹²⁸−1, BigCrush): <https://nvidia.github.io/numba-cuda/user/random.html>
- RTX 4070 Laptop 8 GB VRAM ceiling (CUDA OOM on this class): <https://www.tech360.tv/rtx-4070-laptop-gpu-has-only-8gb-vram>
