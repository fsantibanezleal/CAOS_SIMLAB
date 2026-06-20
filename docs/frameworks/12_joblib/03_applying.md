# 12 · joblib — applying it to a real problem

[← back to the joblib wiki node](../12_joblib.md) · [← 02 Usage](./02_usage.md)

## The problem joblib solves here

A stochastic simulation is a *random experiment*, not a calculation: one run answers only "what happened on
this one seed?". The honest deliverable is a **mean with a confidence interval**, computed from many
**independent replications**. But the standard error of that mean only shrinks like `1/√n` — to halve the
interval you need **4×** the runs. That `√n` wall is what makes a fast way to run *thousands* of cheap,
independent replications valuable.

Those replications are **embarrassingly parallel**: each is a fully independent run with its own RNG stream,
sharing nothing. That is the canonical fit for joblib — fan the replications across every CPU core, collect
the per-run KPIs, and turn them into a CI. No GPU, no inter-process communication, no boilerplate.

## How to formalize it

Cast the question as estimating a single scalar functional `θ = E[g(X)]` of a stochastic model, where one
run produces `g(X; seed_r)`. Then:

1. **Define the atomic replication** — a pure function `replication(params, seed) -> KPI` that owns *all* of
   its randomness (build the RNG from the seed inside the function). This is the picklable unit joblib ships
   to workers.
2. **Choose a disjoint seed plan** — `seed_r = base_seed + r` for `r in 0..K-1`. Disjoint, recorded, and
   regenerable.
3. **Fan-out / fan-in** — run all K with `Parallel`, collect the per-run KPIs *in order*, then aggregate:
   `θ̂ = mean`, with a 95% CI `θ̂ ± z·s/√K` (or the `t` interval for small K — see
   [SciPy stats](../13_scipy-stats.md)).
4. **State the validity contract** — the estimate is correct only if the replications are i.i.d. *and*
   unbiased; joblib guarantees the first (independent seeded streams), but bias (e.g. warm-up transient) is
   a model-level concern it cannot fix.

## The pattern: *replicate-then-aggregate* (a.k.a. fan-out / fan-in)

```
for r in 0..K-1:   replication(base_seed + r)   # fan-out: K independent seeded runs, in parallel
                   ↓ collect K per-run KPIs (in submission order)
aggregate:         mean ± 1.96·s/√K              # fan-in: one estimate + its uncertainty
```

The three invariants that make it *correct*:

1. **One seed per replication, generator built inside the worker** (`base_seed + r`, matching the lab's
   `make_rng` RNG contract). Streams are independent; the study is reproducible.
2. **Order-preserving collection** — joblib returns results in submission order, so seed→result is stable.
3. **Worker-count independence** — the mean is identical for `n_jobs=1` and `n_jobs=-1` (verified in
   [02 Usage](./02_usage.md)). Parallelism is an implementation detail, never a source of randomness.

This generalises to **design-of-experiments (DOE) sweeps**: each grid cell (e.g. arrival-multiplier ×
servers) is its own replication batch with its own CI, and the whole grid is again embarrassingly parallel —
joblib over the flattened `(cell, rep)` list, then aggregate per cell. Keep the seed plan disjoint across
cells and record it in the manifest so the whole surface is regenerable.

## Which scenarios use it

- **S10 — Monte-Carlo Replication / CI Study (primary).** joblib is the **replication driver**, used
  directly in the shipped scenario. S10 runs K independent replications of the M/M/c base model
  (`mmc_mean_wait`, an M/M/c heap-based estimator — same model *class* as S01 but a different engine from
  S01's SimPy run), builds the running mean and the 95% CI band, and compares it to the closed-form
  Erlang-C `Wq`. The actual loop in `s10_montecarlo.py` is **already joblib** (not a serial comprehension):
  `Parallel(n_jobs=-1, backend="threading")(delayed(mmc_mean_wait)(lam, mu, c, n, int(seed) + r) for r in range(reps))`.
  Note the worker takes a **seed int** (`int(seed) + r`), not an RNG `Generator` — it builds its own RNG
  inside. The `threading` backend is deliberate: it avoids the loky process-pool cold-start tax and is the
  only joblib backend that works under Pyodide/WASM, so S10 keeps its **live** lane. The
  [`example.py`](./example.py) shows the same pattern in isolation. See the
  [scenario → tool map](../../README.md#scenario--tool-map).
- **Cross-cutting "report an interval, not a point" beat.** The replicate-then-aggregate pattern is the
  house standard for the results-honesty step: a single noisy run beside the replicated, CI-banded answer.
  In the shipped lab the **replicated, CI-banded study is S10** (the S04 ED is a single seeded run, not a
  replicated CI study). joblib is the engine whenever that ensemble is big enough to want multiple cores.

## Honest trade-offs (grounded in the research)

From the GPU-acceleration research dimension and the
[Monte-Carlo methodology page](../../problem-types/04_monte-carlo-replications.md):

- **CPU-via-joblib is the *intended* path for S10, not a fallback.** The highest-ROI "give me a 95% CI over
  thousands of seeds" study runs in **seconds on the workstation's CPU cores via joblib**, so it ships as
  CPU precompute with no GPU gate. The GPU is reserved for cases where the parallel arithmetic genuinely
  dwarfs host↔device transfer and kernel-launch overhead.
- **GPU only wins above a crossover.** Numba-CUDA Monte-Carlo shows **8–12× over CPU** *for large ensembles*
  (MDPI radiation-transport study, RTX 3080). Below that — and for the small queueing models here — a GPU is
  *slower* than a CPU core once you count transfer + launch overhead, and a single run finishes in
  milliseconds anyway. joblib is the right tool right up to the point where you are running so many heavy
  replications that the GPU's data-parallel throughput pays for its overhead.
- **GPU does NOT accelerate the event loop.** Classic discrete-event simulation is asynchronous,
  branch-heavy scheduling — the antithesis of SIMT. The only honest published DES-on-GPU result is
  **1.4×–3.21×** (SimPy-style DES via TensorFlow, Hofmann et al., IEEE 2021). So you never put the *model*
  on the GPU; if you go parallel at all, you parallelise *across replications* — which is precisely what
  joblib does on the CPU.
- **Replications cure variance, not bias.** joblib makes K large cheaply, which tightens the CI — but a
  tight CI around a biased estimator is "a precise lie". At high load (ρ≈0.9, ~600 customers/run) the
  empty-and-idle warm-up transient biases each run's mean ~16% low; more replications converge *precisely
  onto the wrong value*, and the Erlang-C line falls outside the band (the S10 audit finding). Fix bias with
  warm-up deletion / longer runs *before* spending cores on more replications. joblib is a variance tool,
  full stop.
- **Parallel overhead has a floor.** Process dispatch + pickling cost is real; for microsecond tasks,
  serial is faster. joblib pays off when each replication is at least milliseconds (true for our models) or
  when `batch_size` is raised so workers grab many tasks at once.
- **Determinism is preserved, not threatened.** Unlike GPU thread-scheduling (which is non-deterministic and
  forces per-replication seed-snapshotting for replay), joblib's order-preserving, seed-per-task model keeps
  the study bit-reproducible across any worker count — verified in [02 Usage](./02_usage.md). This fits the
  lab's "replay = truth" contract directly.

## When to pick joblib vs the alternatives

| Situation | Pick | Why |
|---|---|---|
| K independent seeded replications of a cheap CPU model; want a CI | **joblib (default)** | Embarrassingly parallel, no GPU, seconds on all cores, deterministic, one-line API |
| A DOE sweep (grid of parameter cells, each replicated) | **joblib** | Each cell is an independent batch; flatten `(cell, rep)` and fan out |
| The CI / `t` / `z` math itself | **[SciPy `scipy.stats`](../13_scipy-stats.md)** | `t.interval`, `t.ppf`, `norm.ppf`, `sem` — never hand-roll critical values; joblib runs the reps, SciPy turns them into the interval |
| Tens of thousands+ of heavy, arithmetic-dense replications where CPU is the bottleneck | **[CuPy](../15_cupy.md) / [Numba](../14_numba.md) CUDA** (optional GPU exhibit, CPU fallback) | Above the crossover the GPU's data-parallel throughput beats all CPU cores (8–12×) |
| Large-N agent model (10⁴–10⁶ agents stepping together) | **[FLAME GPU 2](../18_gpu-abm-chapter.md)** (reference chapter only) | Data-parallel agent stepping; *not* a replication problem and *not* joblib's shape |
| The base DES/ABM *model* itself (one run) | **[SimPy](../01_simpy.md) / [Ciw](../02_ciw.md) / [Mesa](../04_mesa.md)** on CPU | joblib parallelises *across* runs; it never replaces the simulation engine, and the model never goes on the GPU |

**Do not use** the deprecated **AgentPy** or **desmod** for any of this — they are listed in the research
only so they are recognised and avoided; this lab uses the real, maintained tools above.

### One-line rule of thumb

> Use **joblib** to run *many independent seeded replications across CPU cores* and **SciPy** to turn them
> into an honest confidence interval. Reach for a **GPU** only when you are running so many heavy
> replications that its data-parallel throughput out-earns the transfer/launch overhead — and never put the
> event-loop *model* itself on the GPU.

## References

- [Monte-Carlo & Replications](../../problem-types/04_monte-carlo-replications.md) — the conceptual backbone
  (replications, CIs, warm-up bias, variance reduction, DOE, the honest GPU verdict).
- S10 implementation: `simlab/scenarios/s10_montecarlo.py`; RNG contract: `simlab/core/rng.py`.
- Numba + CuPy Monte-Carlo, 8–12× over CPU (RTX 3080): <https://www.mdpi.com/2079-3197/12/3/61>
- GPU-accelerated DES, SimPy + TensorFlow, only 1.4×–3.21×: <https://ieeexplore.ieee.org/document/9631514/>
