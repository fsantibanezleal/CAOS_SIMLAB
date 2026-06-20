# 14 · Numba — 03 · Applying it to a real problem

This page is the "when and how" for Numba in CAOS_SIMLAB: how to **formalize** the kind of
problem it solves, how to **solve** it with this tool, which scenario uses it, the honest
trade-offs from the research, and when to pick it over the alternatives.

← Previous: [02 · Usage](./02_usage.md) · node: [Numba](../14_numba.md).

## Formalizing the problem Numba solves

The problem class is the **Monte-Carlo replication study**: you have a stochastic model
M(θ; ω) — a queue, an epidemic, an agent model — parameterised by inputs θ and driven by a
random seed/stream ω. You want a *distribution* of some output statistic, not a single run:

> Estimate E[g(M(θ; ω))] and a 95% confidence interval for it, by running R independent
> replications ω₁ … ω_R and reducing the per-replication outputs.

This has three structural properties that decide the tooling:

1. **Embarrassingly parallel.** Replication r depends only on its own stream ω_r — no shared
   state, no communication between replications. Formally the work is a `map` over
   independent seeds followed by a `reduce` (mean, variance, CI).
2. **Cheap, regular inner loop.** Each replication is a tight numeric loop with little
   branching (draw, accumulate, compare) — the SIMT-friendly shape a GPU thread is happy
   with, and the shape an interpreter is slowest at.
3. **Estimator must be validatable.** Where a closed form exists (Erlang-C P(wait), pi),
   the estimate must converge to it; that is your correctness test before trusting the
   estimator where no closed form exists.

When *all three* hold, Numba is a candidate. When the inner "replication" is instead a
small, branch-heavy, asynchronous **discrete-event** loop (event-list pops, conditional
routing), property 2 fails and a GPU is the wrong tool — that is the asymmetry S10 teaches.

## Solving it with Numba: the precompute-then-replay recipe

Numba fits the lab's standard offline pattern, specialised for Monte-Carlo:

1. **Make each replication independent.** Give thread `t` its own RNG stream via
   `create_xoroshiro128p_states(R, seed)[t]`. No shared state, no locks — the canonical
   "embarrassingly parallel" shape, and the only way the per-replication results are truly
   i.i.d. (so the CI is honest).
2. **Run the batch.** `@njit(parallel=True)` across CPU cores, or `@cuda.jit` across GPU
   threads when `cuda.is_available()`. Same Python source, two targets.
3. **Reduce on the host.** Sum per-thread counts/means into the point estimate + a
   confidence band ([SciPy](../13_scipy-stats.md) does the t-interval / tests on the small
   reduced array).
4. **Commit the trace.** Write the same compact JSON trace/summary shape every scenario
   uses, so the static SPA replays the GPU result exactly like a CPU one. The GPU never
   touches the runtime; only its committed output does.

This mirrors the lab architecture ([`docs/architecture.md`](../../architecture.md)):
deterministic core is the truth, the front end only renders it. Pinning the seed +
xoroshiro states makes the "precomputed on local GPU" artifact regenerable by anyone — the
reproducibility promise the research insists on. The worked Numba code for steps 1–3 lives **only** in
this framework's [`example.py`](./example.py) — a standalone GPU/CPU kernel appendix wired into no
scenario. The shipped Monte-Carlo scenario driver
[`s10_montecarlo.py`](../../../simlab/scenarios/s10_montecarlo.py) imports **no** Numba: its replication
driver is **joblib + SciPy** on the CPU (the full precompute-and-commit). Numba would only enter S10 as
the optional GPU lane sketched in `example.py`, never as a runtime dependency.

## Where it fits: the optional GPU appendix for S10 (no scenario imports it)

| Scenario | Role of Numba |
|---|---|
| **S10 — Monte-Carlo Replication / CI Study** | The **documented optional GPU lane**, wired into no scenario. The shipped S10 model (replications of the S01 M/M/c queue, with running mean + 95% CI) runs **live on the CPU** via **joblib + SciPy** and imports **no** Numba. Numba is the *appendix* — sketched only in this framework's [`example.py`](./example.py) — that re-expresses the embarrassingly-parallel replication loop as `@njit` (CPU) and `@cuda.jit` (GPU) kernels, with per-thread `xoroshiro128p` RNG streams. Its job is to **measure** the GPU crossover, never to be on the hot path. |

**No shipped scenario imports Numba** — a grep of `simlab/` finds zero Numba/CuPy references. Numba lives
only in this framework's [`example.py`](./example.py); S10's actual driver is joblib + SciPy on the CPU
(source: [`../../../simlab/scenarios/s10_montecarlo.py`](../../../simlab/scenarios/s10_montecarlo.py)).
Every scenario maps to a different dedicated tool — that mapping is the whole didactic
point of the lab:

- S01 → SimPy (live engine) + Ciw (cross-check) · S02/S03/S05 → Mesa (live) · S04 → SimPy · S06 → OR-Tools CP-SAT
- S07 → OR-Tools CP-SAT + NetworkX + SimPy (deterministic) · S08 → OR-Tools Routing + PyVRP (no SimPy)
- S09 → SimPy + NetworkX (no OR-Tools) · **S10 → joblib + SciPy** (CuPy/Numba are an optional GPU appendix, imported by no scenario) · S11 → OR-Tools GLOP + SimPy (deterministic)

Note S10's *default* replication driver is **[joblib](../12_joblib.md)** (CPU-parallel
across cores). Numba + [CuPy](../15_cupy.md) are the **optional GPU appendix** layered on
top — never a hard dependency, never on the deploy path.

## The honest trade-offs (grounded in the research)

From [the Monte-Carlo problem-type page](../../problem-types/04_monte-carlo-replications.md) and
the adversarial review:

- **Numba CUDA wins on large Monte-Carlo ensembles: ~8–12× over CPU** (MDPI
  radiation-transport study, RTX 3080). The win comes from running *thousands of
  independent replications simultaneously*, each on its own thread with its own RNG stream
  — turning "give me a 95% CI over 10,000 seeds" from a minute into a fraction of a second.
- **Numba CUDA wins nothing on small discrete-event simulation.** Classic event-scheduling
  DES (truck haulage, ED flow, ambulances) is branch-heavy and asynchronous; the only
  honest DES-on-GPU result found is **1.4×–3.21×** (Hofmann et al., IEEE 2021), i.e. a
  non-result. On a *small* queueing DES the GPU is measurably **slower** than the CPU.
  Showing a GPU "speedup" there would misteach — so the lab teaches the asymmetry instead.
- **The GPU adds speed, not understanding.** The adversarial review is blunt: 10k
  replications of a cheap SimPy/Mesa model run in seconds-to-a-minute on the laptop's CPU
  cores via joblib, and the *didactic* point (variance, CIs, design-of-experiments) is
  identical. So the lab ships the replication study as a **CPU/joblib** default and offers
  the Numba/CuPy kernel as an *appendix* — permissive licenses (BSD/MIT), no toolchain gate
  on shipping.
- **Scope-creep is the primary risk.** GPU here is a "look how it scales" exhibit, not a
  performance mandate. The heavier copyleft, CUDA-coupled option (FLAME GPU 2, AGPL-3.0)
  was **cut** from v1 for exactly this reason; Numba/CuPy stay because they are the
  lowest-learning-curve, permissively-licensed, drop-in option.
- **8 GB VRAM ceiling.** On the target RTX 4070 Laptop, cap thread/replication counts and
  use `float32` not `float64` (the example uses `float32` GPU draws). OOM on this card class
  is a documented failure mode for over-large batches.
- **Determinism vs GPU non-determinism.** GPU thread scheduling can perturb the *order* of
  a floating-point reduction, so a GPU sum can differ in the last ULP across drivers. Fix
  seeds per replication and snapshot deterministic state into the replay artifact; treat the
  last digit of a GPU reduction as noise, not signal.

## When to pick Numba — vs the alternatives

| Need | Pick | Why |
|---|---|---|
| **Custom per-thread Monte-Carlo kernel, GPU + CPU from one codebase** | **Numba** | `@njit` and `@cuda.jit` share Python source; `xoroshiro128p` gives proper per-thread streams. Lowest learning curve for hand-written kernels. |
| **Vectorised array Monte-Carlo (drop-in NumPy on GPU)** | **[CuPy](../15_cupy.md)** | If the work is array ops (no custom per-element control flow), CuPy is cuRAND-backed NumPy-on-GPU with near-zero code change. Pair it *with* Numba — CuPy for arrays, Numba for custom kernels. |
| **CPU-parallel replications of a pure-Python model (the v1 default)** | **[joblib](../12_joblib.md)** | No GPU, no compile gate; runs anywhere including the dev laptop's cores. The lab's default S10 driver. |
| **Confidence intervals / distributions / stats on the reduced results** | **[SciPy](../13_scipy-stats.md)** | Numba computes the raw samples fast; SciPy does the t-intervals, KS tests, etc. on the small reduced array. |
| **Massive-N agent-based model (millions of agents)** | *[FLAME GPU 2 — documented, NOT used](../18_gpu-abm-chapter.md)* | Cut from v1: AGPL-3.0 copyleft, CUDA-version coupling, OOM risk on 8 GB. Reference-only chapter. |
| **Speed up a small discrete-event loop** | **Neither GPU nor Numba — just SimPy on CPU** | Branch-heavy event scheduling is a poor SIMT fit; GPU is slower. This is the lesson, not a tooling gap. |

**Deprecated, do not use:** AgentPy and desmod are deprecated upstream and are not part of
this lab. If an older guide suggests them for ABM/DES, ignore it — Mesa (ABM) and SimPy
(DES) are the dedicated tools.

## One-paragraph takeaway

Reach for Numba in CAOS_SIMLAB only for the optional GPU appendix attached to S10's Monte-Carlo theme
(no scenario imports it; S10 itself runs on joblib + SciPy), and only to *demonstrate* the
Monte-Carlo crossover: `@njit` makes a CPU replication loop fast, `@cuda.jit` +
`xoroshiro128p` makes thousands of independent replications run at once on a GPU, and
`cuda.is_available()` keeps the whole thing optional so the repo runs without a GPU. The
research verdict it exists to teach is simple and honest: a GPU accelerates many independent
replications and large-N agent models — it does not accelerate a small event-driven
simulation, where it is slower.
