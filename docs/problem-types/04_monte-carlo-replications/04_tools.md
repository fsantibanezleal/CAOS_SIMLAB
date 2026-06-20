# 04 — Tools: which dedicated tool for which job

> Part of [Monte-Carlo replications & the simulation-methodology curriculum](../04_monte-carlo-replications.md).
> Prev: [03 — Methods & KPIs](./03_methods-and-kpis.md) · Next: [05 — Scenarios](./05_scenarios.md).

Mapped from research dimension 07 (GPU acceleration) and the stack decision. **Use the real dedicated tools
below.** Do **not** treat "NumPy by hand" as a methodology, and do **not** use the deprecated **AgentPy** or
**desmod** (both deprecated — listed here only so they are recognised and avoided).

## The tool table

| Concern | Tool | License | Role in CAOS_SIMLAB | Guide |
|---|---|---|---|---|
| **CPU-parallel replications** | **joblib** | BSD-3 | **The v1 default** replication driver — fan replications across CPU cores; embarrassingly parallel, no GPU needed | [12 — joblib](../../frameworks/12_joblib.md) |
| **GPU array Monte-Carlo** | **CuPy** | MIT | Optional GPU exhibit — drop-in NumPy on GPU, cuRAND-backed; draw whole replication batches as array columns | [15 — CuPy](../../frameworks/15_cupy.md) |
| **GPU custom kernels + per-thread RNG** | **Numba CUDA** | BSD | Optional GPU exhibit — one replication per thread via `create_xoroshiro128p_states` (`xoroshiro128p`, period 2¹²⁸−1, BigCrush); CUDA-detect with CPU fallback | [14 — Numba](../../frameworks/14_numba.md) |
| **Confidence-interval math** | **SciPy (`scipy.stats`)** | BSD | The CI / `t` / `z` math — `t.interval`, `t.ppf`, `norm.ppf`, `sem`; never hand-roll critical values | [13 — `scipy.stats`](../../frameworks/13_scipy-stats.md) |
| **Grid / cellular-automata GPU** | **Taichi** | Apache-2.0 | Niche — particle/field/CA grids (diffusion, fire, traffic CA); portable CUDA/Vulkan/Metal | [16 — Taichi](../../frameworks/16_taichi.md) |
| **Large-N GPU-ABM (reference only)** | **FLAME GPU 2** | AGPL-3.0-only | **Reference chapter, not a dependency** — the canonical million-agent GPU-ABM engine; cut from runtime (copyleft, brittle CUDA, 8 GB OOM) | [18 — GPU-ABM chapter](../../frameworks/18_gpu-abm-chapter.md) |
| Base DES models being replicated | **SimPy** (+ **Ciw** for M/M/c analytics) | MIT | The S01 / S04 models that S10 replicates; run on CPU (live or precompute), never on GPU | [01 — SimPy](../../frameworks/01_simpy.md), [02 — Ciw](../../frameworks/02_ciw.md) |

**Do not use:** **AgentPy**, **desmod** — both deprecated; mentioned only so they are not adopted by mistake.

A complete replication study therefore looks like: [**joblib**](../../frameworks/12_joblib.md) (or
[CuPy](../../frameworks/15_cupy.md)/[Numba](../../frameworks/14_numba.md) on GPU) fans `n` seeded replications
of a [**SimPy**](../../frameworks/01_simpy.md)/[**Ciw**](../../frameworks/02_ciw.md) model → collect per-run
KPIs → [**`scipy.stats`**](../../frameworks/13_scipy-stats.md) turns them into a mean + confidence interval
(with warm-up deletion applied first) → commit the CI-envelope artifact for replay.

## RNG-stream discipline per backend

Independence is an RNG property, not an accident — the whole i.i.d. argument in
[01 — What it is](./01_what-it-is.md) collapses if streams overlap. The per-backend recipes:

- **CPU (joblib / SimPy / Ciw / Mesa):** give each replication a distinct seed and use NumPy's modern
  `SeedSequence` / `default_rng` spawning so the per-run streams are provably non-overlapping. Pass a seed
  per worker; never let parallel workers share or re-derive the same global RNG. This is also what makes
  joblib runs **bit-reproducible across any worker count** — one seed per task, RNG built inside the worker.
- **GPU (Numba CUDA):** each GPU thread owns its own counter-based stream via
  `numba.cuda.random.create_xoroshiro128p_states` + `xoroshiro128p_uniform_float32`. The `xoroshiro128p`
  generator has period `2^128 − 1` and passes the BigCrush battery, so tens of thousands of per-thread
  streams stay independent — this is precisely what makes "one replication per GPU thread" valid.
- **GPU (CuPy):** array RNG is cuRAND-backed; seed the generator and draw whole replication batches as array
  columns.

For **Common Random Numbers** (the variance-reduction technique in
[03 — Methods & KPIs](./03_methods-and-kpis.md)), this same separable-stream property is what lets you align
*per-source* streams across two variants so the shared noise cancels in the difference.

## What ships in CAOS_SIMLAB v1

- **No GPU dependency is on the ship path.** The highest-ROI GPU use — the 10k-replications CI study
  ([S10](../../use-cases/10_s10_montecarlo.md)) — runs in **seconds on CPU cores via joblib**, so it ships as
  **CPU precompute** and delivers the full curriculum without a GPU gate.
- **GPU is one *optional* exhibit, never on the VPS / Pages runtime path.** CuPy / Numba Monte-Carlo lives in
  a separate `requirements-gpu.txt` behind a **CUDA-detect-with-CPU-fallback** so GPU-less learners reproduce
  every result on CPU. See the [GPU lane guide](../../guides/03_gpu-lane.md) and the
  [precompute pipeline](../../guides/01_precompute-pipeline.md).
- **FLAME GPU 2 is a reference chapter, not a runtime dependency** — AGPL-3.0-only (copyleft), a real CUDA
  toolchain learning curve, and documented 8 GB-VRAM OOM on the exact RTX 4070-Laptop class. It is the
  canonical large-N GPU-ABM engine, documented and cut from the critical path
  ([18 — GPU-ABM chapter](../../frameworks/18_gpu-abm-chapter.md)).

Licenses and data policy: [ATTRIBUTION](../../../ATTRIBUTION.md) · [LICENSES](../../../LICENSES.md).

## Next

- [05 — Scenarios](./05_scenarios.md) — where this methodology is exercised in the lab, and the references.
