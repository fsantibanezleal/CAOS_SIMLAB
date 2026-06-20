# Monte-Carlo replications & the simulation-methodology curriculum

A stochastic simulation is a random experiment, not a calculation. One run answers nothing on its own —
it answers *"what happened on this one seed?"*. This page is the methodological backbone of CAOS_SIMLAB:
why a single run is noisy, how to turn many runs into a defensible estimate with an honest confidence
interval, how to deal with the warm-up bias that quietly corrupts steady-state estimates, how to make each
run cheaper to trust (variance reduction), and how to sweep a parameter space without lying to yourself.

It is also where we give the **honest GPU verdict**: GPUs accelerate *thousands of independent
replications* and *large-N agent models* — they do **not** accelerate a small discrete-event loop, where
they are measurably *slower*. That asymmetry is itself a lesson, and we teach it rather than hide it.

This document is the conceptual reference. The runnable per-tool guides live under
[`docs/frameworks/`](../frameworks/) and the worked scenario is
[S10 — Monte-Carlo Replication / CI Study](../scenarios/s10-monte-carlo-ci.md), which runs replications
over the S01 bank-queue and S04 emergency-department base models.

---

## 1. Why a single run is noisy

Every CAOS_SIMLAB simulation is a pure function of `(params, seed)`: the same parameters and the same seed
always produce the same trace. Change the seed and you change the random draws — interarrival times,
service times, routing coin-flips — and therefore you change the output KPI (mean wait, utilisation,
makespan, response-time tail). So a KPI from one run is a **single observation of a random variable**, not
"the answer".

Concretely, run the S01 M/M/c queue once near saturation (utilisation ρ → 1) and the reported mean wait
can swing by a factor of two or more purely from seed luck, because the queue spends most of its mass in
rare long busy periods. Reporting that one number as "the mean wait" is the single most common
sin in applied simulation, and the whole point of this curriculum is to refuse it.

The fix is statistical, not computational: treat the simulation as a sampler, take **independent
replications**, and report an estimate *with* its uncertainty.

---

## 2. Replications: independent runs as i.i.d. samples

A **replication** is one full simulation run with an independent random-number stream. Run the model `n`
times with `n` distinct, non-overlapping seeds and you obtain `n` i.i.d. observations `X_1, …, X_n` of the
output KPI. Their sample mean `X̄` estimates the true expected KPI; their spread tells you how much you
can trust `X̄`.

Two non-negotiable rules:

- **Streams must be independent.** Reusing the same seed, or seeds whose streams overlap, secretly
  correlates your "independent" runs and collapses your real sample size. Use a well-specified RNG with
  guaranteed stream separation (see [§7](#7-rng-streams-the-foundation-of-trustworthy-replications)).
- **More replications shrink the interval, not the noise.** The standard error of the mean falls like
  `1/√n`. Going from 10 to 1000 replications narrows the confidence interval by ~10×; it does **not** make
  any single run less variable. This `√n` wall is exactly why batching thousands of cheap replications is
  attractive, and exactly where parallel hardware (CPU cores, then GPU threads) earns its keep.

In CAOS_SIMLAB the replication driver for v1 is **joblib** (CPU-parallel, the default), with an **optional
GPU exhibit** (CuPy / Numba CUDA) for the embarrassingly-parallel case. See
[§9](#9-tooling-which-tool-for-which-job) and the framework guides.

---

## 3. Confidence intervals: the honest answer

The deliverable of a replication study is not a point estimate — it is an **interval** that, over repeated
studies, would contain the true value a stated fraction of the time (e.g. 95%).

### Normal-approximation (large `n`)

For a reasonably large number of replications (a common rule of thumb is `n ≥ 30`, and our GPU/joblib
studies run hundreds-to-thousands), the Central Limit Theorem justifies a normal-based interval on the
sample mean:

```
X̄ ± z_(1−α/2) · s / √n
```

- `X̄` — sample mean of the per-replication KPI
- `s` — sample standard deviation (with the `n−1` divisor; this is `numpy.std(..., ddof=1)`)
- `n` — number of replications
- `z_(1−α/2)` — the standard-normal critical value (≈ 1.96 for 95%)

### Student-`t` (small `n`, unknown variance)

When `n` is small you do **not** know the variance — you estimate it from the same small sample — so the
normal critical value `z` is too optimistic and the interval is too narrow. Use the **Student-`t`**
distribution with `n−1` degrees of freedom:

```
X̄ ± t_(1−α/2, n−1) · s / √n
```

`t` is wider than `z` for small `n` and converges to `z` as `n → ∞` (by `n ≈ 30` they are within ~2%). The
honest default in this lab is: **use `t` unless you have a genuinely large `n` and a strongly normal
sampling distribution.** It costs nothing and never under-covers.

### How to compute it (don't hand-roll the math)

We do **not** type critical values from a table or reimplement the formula. The interval math comes from
**`scipy.stats`** — `scipy.stats.norm.ppf` / `scipy.stats.t.ppf` for the critical values, or
`scipy.stats.t.interval(confidence, df, loc=mean, scale=sem)` and `scipy.stats.sem` for the standard
error directly. This is the canonical, tested implementation; see
[`docs/frameworks/scipy-stats.md`](../frameworks/scipy-stats.md).

### Honesty caveats the curriculum insists on

- **A 95% CI is not "95% probability the truth is in this interval."** It is a statement about the
  long-run coverage of the *procedure*. Teach the frequentist reading explicitly.
- **The CI captures Monte-Carlo (sampling) error only.** It says nothing about *model* error — a wrong
  arrival process or a missing failure mode is not in the interval. A tight CI around a wrong model is a
  precise lie.
- **Means can be the wrong target.** For heavy-tailed KPIs (queue waits near saturation, response-time
  tails) report quantiles (p90/p95) and their intervals too, not just the mean — the mean alone hides the
  tail that operations actually care about.

---

## 4. The initial-transient (warm-up) bias

Most operational questions are about **steady state** — the long-run average wait once the system has
"filled up". But a simulation almost always starts from an *empty-and-idle* state, which is not
representative: the first patients walk into an empty ED, the first trucks face no queue. Including those
early, atypically-low observations **biases the steady-state estimate downward**. This is the
**initial-transient** or **warm-up** problem.

Critically, **more replications do not fix this.** Averaging 10,000 biased runs gives a very precise
estimate of the *wrong* number — a tight confidence interval centred off-target. Bias and variance are
different diseases; replications cure variance, not bias.

The standard remedy is **deletion / truncation (Welch's method)**: discard the first `w` time units (or
the first `w` events) of every run before computing the KPI, so the average is taken only over the
steady-state portion. Choosing `w`:

- Plot the **ensemble average** of the KPI over time across replications (Welch's moving-average plot) and
  cut where it visibly flattens.
- When in doubt, cut more rather than less — over-truncation costs a little variance; under-truncation
  leaves bias.
- For **terminating** simulations (a bank that opens at 9:00 and closes at 17:00, a single ED shift) there
  *is* no steady state — the transient *is* the system. Do **not** apply warm-up deletion to terminating
  models; estimate the full-horizon KPI instead. Knowing which regime you are in is part of the lesson.

S10 makes this concrete: it shows the naive single-run, no-warm-up answer **beside** the
replicated-with-warm-up answer so the learner sees the bias and the noise removed in the same view. The
warm-up cut length is an exposed preset on that scenario.

---

## 5. Variance reduction: a tighter interval for the same compute

Because precision improves only as `1/√n`, halving a confidence interval naively costs **4× the runs**.
Variance-reduction techniques (VRTs) buy precision more cheaply by engineering the randomness. The two we
teach because they are simple and broadly safe:

- **Common Random Numbers (CRN)** — when *comparing two configurations* (e.g. 4 vs 5 treatment bays), feed
  both the *same* random streams so they face the same arrival pattern and service draws. The shared noise
  cancels in the difference, sharpening the estimate of *which is better* dramatically. CRN requires
  disciplined per-source stream alignment, which is exactly why an RNG with separable streams matters.
- **Antithetic Variates** — pair each run using draws `U` with a mirror run using `1−U`; negatively
  correlated pairs average to a lower-variance estimate of the mean.

Two warnings the curriculum states plainly: CRN helps *comparisons* but can mislead if streams aren't
properly synchronised across the variants, and antithetics can *backfire* (raise variance) if the response
isn't monotone in the inputs. VRTs are an optimisation, never a correctness requirement — a plain
replicated CI is always a valid baseline.

---

## 6. Design of experiments: sweeping the parameter space

Often the question isn't "what's the KPI here?" but "how does the KPI move across the parameter space?" —
e.g. mean wait as a function of arrival multiplier × number of servers. A **design-of-experiments (DOE)**
sweep evaluates a grid (or a smarter design) of parameter points, each with its **own replicated CI**, so
you can see effects and interactions *with their uncertainty*, not as single noisy dots.

Practical guidance:

- Each grid cell is an independent replication batch → the whole sweep is **embarrassingly parallel** and
  maps directly onto joblib (CPU) or a GPU batch.
- Keep **seeds reproducible and disjoint** across cells; record the seed plan in the manifest so the whole
  surface is regenerable.
- Plot effects with uncertainty (CI ribbons over a sweep line, or a response surface with error shown) —
  never a bare best-fit curve through noisy point estimates.
- A full factorial grid explodes combinatorially; for many factors prefer a fractional/Latin-hypercube
  design over a dense grid. (v1 ships small explicit grids; larger designs are a documented extension.)

The S10 3D cost/response surface (an optional Plotly exhibit) is exactly a DOE sweep visualised — and a
reminder that a surface of point estimates without shown uncertainty is decoration, not evidence.

---

## 7. RNG streams: the foundation of trustworthy replications

Everything above assumes the `n` replications are *genuinely independent*. That is an RNG property, not an
accident:

- **CPU (joblib / SimPy / Ciw / Mesa):** give each replication a distinct seed and use NumPy's modern
  `SeedSequence` / `default_rng` spawning so the per-run streams are provably non-overlapping. Pass a seed
  per worker; never let parallel workers share or re-derive the same global RNG.
- **GPU (Numba CUDA):** each GPU thread owns its own counter-based stream via
  `numba.cuda.random.create_xoroshiro128p_states` + `xoroshiro128p_uniform_float32`. The `xoroshiro128p`
  generator has period `2^128 − 1` and passes the BigCrush battery, so tens of thousands of per-thread
  streams stay independent — this is precisely what makes "one replication per GPU thread" valid.
- **GPU (CuPy):** array RNG is cuRAND-backed; seed the generator and draw whole replication batches as
  array columns.

Determinism is also a *replay* requirement here: GPU thread-scheduling is non-deterministic, so for any
trace we replay frame-by-frame we **fix the per-replication seed and snapshot deterministic state**, so the
committed artifact is reproducible regardless of scheduling. (See the architecture's "replay = truth"
contract in [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).)

---

## 8. The honest GPU verdict — "when does GPU actually help?"

This is the part most write-ups get wrong, so we state it bluntly: **a GPU does not speed up a
discrete-event simulation's event loop.** Classic DES is asynchronous, branch-heavy event scheduling —
the antithesis of the GPU's SIMT (single-instruction, many-thread) model. The only honest published
DES-on-GPU result we found is a **1.4×–3.21×** speedup for SimPy-style manufacturing DES accelerated via
TensorFlow (Hofmann et al., IEEE 2021) — a small payoff that *confirms* event-scheduling DES is a poor GPU
fit. On the **small** queueing models in this lab (S01, S04), a GPU is *slower* than a single CPU core
once you count host↔device transfer and kernel-launch overhead, and a CPU run finishes in milliseconds
anyway.

Where the GPU genuinely wins is **massive data-parallel arithmetic**, which shows up in this product in
two shapes:

1. **Thousands of *independent* replications** of an otherwise-cheap model — one replication per GPU
   thread, each with its own RNG stream. This is the single highest-ROI GPU use here: "give me a 95% CI on
   mean wait over 10,000 seeds" goes from minutes to a fraction of a second. Numba-CUDA Monte-Carlo shows
   **8–12× over CPU** for large ensembles (MDPI radiation-transport study, RTX 3080).
2. **Large-N agent-based / grid models** — tens of thousands to millions of lightweight agents stepping in
   parallel (crowd egress, epidemic spread, cellular automata). FLAME GPU 2 reports **3.5× and 10×**
   ensemble/concurrency speedups on million-agent models (Richmond et al. 2023) — but note that win is over
   *CPU ABM*, not over CPU queueing.

### Decision table — when does GPU actually help?

| Workload shape | GPU verdict | Why | Tool in this lab |
|---|---|---|---|
| Small-N event-loop DES (M/M/c, ED flow, ambulance/haul cycles) | **No — GPU is *slower*** | Asynchronous, branch-heavy event scheduling fights SIMT; only ~1.4–3.21× even when forced; CPU finishes in ms | SimPy / Ciw on CPU |
| **Thousands of independent replications** of a cheap model (a CI study) | **Yes — strongest fit** | Embarrassingly parallel; one thread per seed, independent RNG streams; 8–12× over CPU on large ensembles | **joblib (default)**, optional **CuPy / Numba CUDA** |
| Large-N ABM (10⁴–10⁶ lightweight agents) | **Yes** | Data-parallel agent stepping; 3.5×/10× over CPU ABM | FLAME GPU 2 (*reference chapter only*) |
| Large spatial grids / cellular automata (diffusion, fire, traffic CA) | **Sometimes** | Regular grid arithmetic maps well to GPU; verify the crossover vs CPU first | Taichi or CuPy (niche) |
| Combinatorial optimisation (CP-SAT, VRP) | **No** | Native C++ search, no SIMD-parallel arithmetic core | OR-Tools / PyVRP on CPU |

**The crossover rule of thumb:** GPU wins only when the *parallel arithmetic* dwarfs both the
host↔device transfer and the kernel-launch overhead — i.e. many thousands of independent threads each
doing real work. Below that, **stay on the CPU.** A "GPU speedup" demo on a small queueing DES would be
*slower than CPU and would misteach*; we refuse to show one.

### What this means for CAOS_SIMLAB v1

- **No GPU dependency is on the ship path.** The "10k-replications CI study" (S10) — the highest-ROI GPU
  use — runs in **seconds on the 4070's CPU cores via joblib**, so it ships as **CPU precompute** and
  delivers the full replications / warm-up / CI curriculum without a GPU gate.
- **GPU is one *optional* exhibit, never on the VPS / Pages runtime path.** CuPy / Numba Monte-Carlo lives
  in a separate `requirements-gpu.txt` behind a **CUDA-detect-with-CPU-fallback** so GPU-less learners
  reproduce every result on CPU.
- **FLAME GPU 2 is a reference chapter, not a runtime dependency** — AGPL-3.0-only (copyleft), a real CUDA
  toolchain learning curve, and documented 8 GB-VRAM OOM on the exact RTX 4070-Laptop class. We document
  it as the canonical large-N GPU-ABM engine and cut it from the critical path.

---

## 9. Tooling — which tool for which job

Mapped from research dimension 07 (GPU acceleration) and the stack decision. **Use the real dedicated
tools below.** Do **not** treat "NumPy by hand" as a methodology, and do **not** use the deprecated
**AgentPy** or **desmod** (both deprecated — listed here only so they are recognised and avoided).

| Concern | Tool | License | Role in CAOS_SIMLAB | Guide |
|---|---|---|---|---|
| **CPU-parallel replications** | **joblib** | BSD-3 | **The v1 default** replication driver — fan replications across CPU cores; embarrassingly parallel, no GPU needed | [`docs/frameworks/joblib.md`](../frameworks/joblib.md) |
| **GPU array Monte-Carlo** | **CuPy** | MIT | Optional GPU exhibit — drop-in NumPy on GPU, cuRAND-backed; draw whole replication batches as array columns | [`docs/frameworks/cupy.md`](../frameworks/cupy.md) |
| **GPU custom kernels + per-thread RNG** | **Numba CUDA** | BSD | Optional GPU exhibit — one replication per thread via `create_xoroshiro128p_states` (`xoroshiro128p`, period 2¹²⁸−1, BigCrush); CUDA-detect with CPU fallback | [`docs/frameworks/numba-cuda.md`](../frameworks/numba-cuda.md) |
| **Confidence-interval math** | **SciPy (`scipy.stats`)** | BSD | The CI / `t` / `z` math — `t.interval`, `t.ppf`, `norm.ppf`, `sem`; never hand-roll critical values | [`docs/frameworks/scipy-stats.md`](../frameworks/scipy-stats.md) |
| **Grid / cellular-automata GPU** | **Taichi** | Apache-2.0 | Niche — particle/field/CA grids (diffusion, fire, traffic CA); portable CUDA/Vulkan/Metal | [`docs/frameworks/taichi.md`](../frameworks/taichi.md) |
| **Large-N GPU-ABM (reference only)** | **FLAME GPU 2** | AGPL-3.0-only | **Reference chapter, not a dependency** — the canonical million-agent GPU-ABM engine; cut from runtime (copyleft, brittle CUDA, 8 GB OOM) | [`docs/frameworks/flamegpu2.md`](../frameworks/flamegpu2.md) |
| Base DES models being replicated | **SimPy** (+ **Ciw** for M/M/c analytics) | MIT | The S01 / S04 models that S10 replicates; run on CPU (live or precompute), never on GPU | [`docs/frameworks/simpy.md`](../frameworks/simpy.md), [`docs/frameworks/ciw.md`](../frameworks/ciw.md) |

**Do not use:** **AgentPy**, **desmod** — both deprecated; mentioned only so they are not adopted by
mistake.

A complete replication study therefore looks like: **joblib** (or CuPy/Numba on GPU) fans `n` seeded
replications of a **SimPy/Ciw** model → collect per-run KPIs → **`scipy.stats`** turns them into a mean +
confidence interval (with warm-up deletion applied first) → commit the CI-envelope artifact for replay.

---

## 10. Where this is exercised — S10 and the rest of the lab

The dedicated worked exhibit is **[S10 — Monte-Carlo Replication / CI Study](../scenarios/s10-monte-carlo-ci.md)**:

- **Reuses** the S01 bank/clinic M/M/c and S04 emergency-department models as the base sampler — no new
  model logic, just the methodology layered on top.
- **Default engine:** joblib CPU-parallel replications. **Optional:** CuPy / Numba CUDA GPU batch with a
  CPU fallback, so every result is reproducible without a GPU.
- **Shows the wrong-vs-right contrast:** the naive single-run / one-seed / no-warm-up answer beside the
  replicated, warm-up-corrected, CI-banded answer.
- **Exposed presets:** number of replications, warm-up cut length, which base model (S01 or S04),
  confidence level.
- **Doubles as the "When does GPU actually help?" teaching page** — including the decision table above,
  with the GPU-is-slower-on-small-DES result presented as a feature of the curriculum, not an omission.

But the methodology is not confined to S10. The **results-honesty beat** — single run vs `n` replications
+ CI, plus warm-up — is a first-class part of the S04 ED flagship as well, and the
[scenarios catalog](../scenarios/README.md) treats "report an interval, not a point" as the house standard
across every stochastic scenario.

---

## References (from research dimension 07)

- FLAME GPU 2 (3.5×/10× ensemble & concurrency over CPU ABM): Richmond et al. 2023, *Software: Practice
  and Experience* 53(8) — <https://onlinelibrary.wiley.com/doi/full/10.1002/spe.3207>; repo
  <https://github.com/FLAMEGPU/FLAMEGPU2>
- Numba CUDA RNG (`xoroshiro128p`, period 2¹²⁸−1, BigCrush):
  <https://nvidia.github.io/numba-cuda/user/random.html>
- Numba + CuPy Monte-Carlo (8–12× over CPU, RTX 3080): <https://www.mdpi.com/2079-3197/12/3/61>
- CuPy (drop-in NumPy on GPU, cuRAND-backed): <https://cupy.dev/>
- GPU-accelerated DES, SimPy + TensorFlow (only 1.4×–3.21× — DES is a poor GPU fit):
  <https://ieeexplore.ieee.org/document/9631514/>
- Queuing-network simulation on GPU (asynchronous DES fights SIMT):
  <https://dl.acm.org/doi/10.1145/1921598.1921602>
- Taichi Lang (Apache-2.0, particle/field/CA grids): <https://github.com/taichi-dev/taichi>
- RTX 4070 Laptop 8 GB VRAM ceiling (CUDA OOM on this class):
  <https://www.tech360.tv/rtx-4070-laptop-gpu-has-only-8gb-vram>

*This page is part of the CAOS_SIMLAB teaching repo —
<https://github.com/fsantibanezleal/CAOS_SIMLAB>. It is conceptual reference; the runnable code lives in
the [framework guides](../frameworks/) and the [S10 scenario](../scenarios/s10-monte-carlo-ci.md).*
