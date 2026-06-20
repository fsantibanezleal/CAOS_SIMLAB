# 05 — Scenarios: where this is exercised + references

> Part of [Monte-Carlo replications & the simulation-methodology curriculum](../04_monte-carlo-replications.md).
> Prev: [04 — Tools](./04_tools.md).

This methodology is not confined to one exhibit. There is a dedicated worked scenario (S10) that *is* the
Monte-Carlo curriculum, and a **results-honesty beat** — single run vs `n` replications + CI, plus warm-up —
that is a first-class part of every stochastic scenario in the lab.

## S10 — the dedicated worked exhibit

The dedicated worked exhibit is [**S10 — Monte-Carlo Replication / CI Study**](../../use-cases/10_s10_montecarlo.md):

- **Reuses** the [S01 bank/clinic M/M/c](../../use-cases/01_s01_queue.md) and
  [S04 emergency-department](../../use-cases/04_s04_ed.md) models as the base sampler — no new model logic,
  just the methodology layered on top.
- **Default engine:** [joblib](../../frameworks/12_joblib.md) CPU-parallel replications. **Optional:**
  [CuPy](../../frameworks/15_cupy.md) / [Numba CUDA](../../frameworks/14_numba.md) GPU batch with a CPU
  fallback, so every result is reproducible without a GPU.
- **Shows the wrong-vs-right contrast:** the naive single-run / one-seed / no-warm-up answer beside the
  replicated, warm-up-corrected, CI-banded answer — the bias and the noise removed in the same view. The CI
  is compared against the closed-form Erlang-C reference.
- **Exposed presets:** number of replications, warm-up cut length, which base model (S01 or S04), confidence
  level.
- **Doubles as the "When does GPU actually help?" teaching page** — including the decision table in
  [02 — When to use it](./02_when-to-use.md), with the GPU-is-slower-on-small-DES result presented as a
  feature of the curriculum, not an omission.

## The house standard across every stochastic scenario

The methodology is not confined to S10. The **results-honesty beat** — single run vs `n` replications + CI,
plus warm-up — is a first-class part of the [S04 emergency-department](../../use-cases/04_s04_ed.md) flagship
as well, and the [lab scenario map](../../README.md#scenario--tool-map) treats "report an interval, not a
point" as the **house standard** across every stochastic scenario.

## References (from research dimension 07)

- FLAME GPU 2 (3.5×/10× ensemble & concurrency over CPU ABM): Richmond et al. 2023, *Software: Practice and
  Experience* 53(8) — <https://onlinelibrary.wiley.com/doi/full/10.1002/spe.3207>; repo
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

---

*This node is part of the CAOS_SIMLAB teaching repo. It is conceptual reference; the runnable code lives in
the framework guides ([12 — joblib](../../frameworks/12_joblib.md),
[13 — `scipy.stats`](../../frameworks/13_scipy-stats.md)) and the
[S10 scenario](../../use-cases/10_s10_montecarlo.md).*
