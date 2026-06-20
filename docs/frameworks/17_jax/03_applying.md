# 17 · JAX — applying it to real problems

This page is the judgement layer: *when* to reach for JAX in CAOS_SIMLAB, the
pattern to use it with, the honest trade-offs from the research, and when to pick
something else instead. For the version and wheel see
[`01_installation.md`](./01_installation.md); for the API and the worked example
see [`02_usage.md`](./02_usage.md). The short version: **JAX is a vectorization
primitive for the offline precompute lane, used in the vectorized ABM /
Monte-Carlo context — not a simulation engine, and not on the ship path.**

---

## 1. Formalizing the problem JAX solves

A stochastic simulation KPI is a **random variable**, and the defensible answer is
never one run — it is the *mean over many independent replications, reported with a
confidence interval* (see the
[Monte-Carlo methodology](../../problem-types/04_monte-carlo-replications.md)).
Formally: you want to estimate `θ = E[g(X)]` where `X` is the (seeded) random
state of one simulation and `g` is the KPI. The Monte-Carlo estimator is
`θ̂ = (1/n) Σ g(Xᵢ)` over `n` independent draws, with standard error `σ/√n`.

That workload has two structural properties JAX exploits:

1. It is **embarrassingly parallel** — the `n` runs never talk to each other.
2. It hits the **`1/√n` precision wall** — you need 4× the runs to halve the
   interval — so batching *thousands* of replications is where the effort pays off.

JAX expresses that batch as **vectorized compute**: write one replication (or one
agent step) as a *pure* function of `(key, params)`, `vmap` it over a batch of
independent RNG keys, and `jit`-compile the whole thing into one fused XLA kernel.
The Python replication loop disappears; the interpreter is out of the hot path.

This is the **"vectorized ABM / MC context"** the framework is mapped to: any model
whose per-element step can be written as array arithmetic (a Monte-Carlo trial, a
synchronous agent update over a fixed-shape population, a cellular / grid step) can
be batched with `vmap` and compiled with `jit`.

---

## 2. The pattern: vectorize-then-replicate (and optimize-then-simulate)

The dominant JAX pattern here is **vectorize-then-replicate**:

1. **Vectorize one element.** Write the per-replication (or per-agent) logic as a
   pure function of `(key, params)`. No loops over the batch, no global RNG.
2. **Batch it.** `vmap` over an axis of independent RNG keys (replications) or over
   the agent axis (ABM step). `in_axes` picks the batched argument.
3. **Compile it.** `jit` the batched function so XLA fuses the whole kernel;
   shape-changing args go in `static_argnums`.
4. **Replicate / reduce.** Run the compiled batch, then reduce — `jnp.mean` for the
   estimate, plus the standard error → a confidence interval. Hand the *final* CI
   math to [`scipy.stats`](../13_scipy-stats.md) per the methodology page; the toy
   Bernoulli SEM in [`example.py`](./example.py) is only for self-containment.

It also slots into the lab's broader **optimize-then-simulate** pattern as the
*simulate-many* half: an optimizer ([OR-Tools](../08_ortools.md)) picks a
configuration, then a vectorized JAX Monte-Carlo stress-tests that configuration
under thousands of seeds to produce a CI on its KPI — the optimizer *chooses*, the
vectorized replication batch *validates with uncertainty*.

---

## 3. Which scenarios use it

JAX is **not the primary engine for any single scenario** — the scenario→tool map
assigns concrete engines elsewhere (S01 SimPy+Ciw; S02/S03/S05 Mesa; S04 SimPy;
S06/S11 OR-Tools; S07–S09 OR-Tools+SimPy+graph/PyVRP; S10 joblib+CuPy/Numba+SciPy).
JAX is the **vectorization primitive that backs the Monte-Carlo / batched-ABM
*context*** that cuts across them:

- **S10 — Monte-Carlo Replication / CI study** is the natural home. S10's v1 driver
  is **[joblib](../12_joblib.md)** (CPU-parallel) with an optional
  **[CuPy](../15_cupy.md) / Numba CUDA** GPU exhibit. **JAX is the documented
  vectorized-functional alternative** to that GPU exhibit: the same "thousands of
  independent seeded replications → mean + CI" computation, written as
  `jit(vmap(one_replication))`, runnable on the CPU backend today and on GPU/TPU
  unchanged. [`example.py`](./example.py) is exactly this shape (200k replications
  → tail probability → 95% CI vs analytic truth).
- **Any vectorized ABM step** (the S02/S03/S05 [Mesa](../04_mesa.md) scenarios, *as
  a precompute variant*): when an agent update can be written as fixed-shape array
  arithmetic — Schelling on a lattice, SIR on a population vector, a synchronous
  flocking step — `vmap` over the agent axis turns the per-agent rule into a
  batched kernel. This is a **precompute-lane acceleration of a model whose
  canonical teaching engine is still Mesa**, never a replacement for Mesa's
  didactic abstractions on the live path.

It does **not** apply to event-loop DES (S01/S04 [SimPy](../01_simpy.md) /
[Ciw](../02_ciw.md)) or combinatorial optimization (S06/S11
[OR-Tools](../08_ortools.md)): those are asynchronous / branch-heavy or native C++
search, neither of which is data-parallel array arithmetic (see §4).

---

## 4. Honest trade-offs (grounded in the research)

**Where it genuinely wins.** The GPU / Monte-Carlo research is explicit that the
single highest-ROI parallel use in this product is *thousands of independent
replications* of a cheap model — embarrassingly parallel, one stream per
replication. JAX expresses precisely that, with first-class **splittable RNG**
(independent, non-overlapping streams — the trustworthy-replications property) and
**backend portability**: identical code runs on CPU now and GPU/TPU later without
edits. License is **Apache-2.0** (permissive, public-repo-safe), unlike FLAME
GPU 2's AGPL-3.0 copyleft.

**Where it is the wrong tool — and we say so:**

- **Event-loop DES gets *no* benefit.** Classic discrete-event simulation is
  asynchronous, branch-heavy event scheduling — the antithesis of XLA's
  data-parallel model. The only honest published DES-on-accelerator result is
  ~1.4×–3.21×, i.e. a non-result, and on the lab's small queues a CPU run finishes
  in milliseconds. **Do not** vectorize SimPy / Ciw with JAX.
- **Combinatorial optimization is not array arithmetic.** CP-SAT / VRP are native
  C++ search with no SIMD-parallel core; JAX adds nothing. Keep OR-Tools / PyVRP on
  CPU.
- **Object-per-agent / irregular models fight `vmap`.** JAX needs **fixed-shape,
  immutable** computation. Agents that spawn / die, ragged neighbourhoods, or
  data-dependent control flow are awkward (you pad to a max shape and mask, or use
  `lax.cond` / `lax.scan`) — exactly the friction the research flags for vectorized
  ABM. Mesa's object model is clearer to *teach*; JAX is an *acceleration* of an
  already-understood model, not the teaching surface.
- **CPU replications are often enough.** The research is blunt: 10k replications of
  a cheap model run in seconds on the CPU cores via joblib, and the *didactic*
  point (variance, CIs, DoE) is identical — the accelerator adds speed, not
  understanding. So JAX/GPU is an **appendix**, never a gate.
- **Compile + transfer overhead.** `jit` pays a one-off compilation cost and
  benefits only when the parallel arithmetic dwarfs launch / transfer overhead —
  the same crossover rule as the GPU verdict. Tiny batches are slower than plain
  NumPy.
- **`ABMax` (JAX-based ABM) is unusable here.** Its pip install **fails on Windows**
  with a path-length error, so JAX is used as the bare `vmap`+`jit` primitive over
  our own vectorized step, not via the ABMax wrapper. Don't add it.

**Determinism caveat for replay.** JAX on a fixed backend with fixed seeds is
deterministic (the example reproduces byte-for-byte). Across *different* backends
(CPU vs GPU) reductions may reorder floating-point ops and shift the last digits;
for any committed replay artifact, fix the backend and snapshot deterministic
state, exactly as the methodology page requires.

---

## 5. When to pick JAX vs the alternatives

| You want… | Pick | Why |
|---|---|---|
| The v1 replication / CI study, simplest path | **[joblib](../12_joblib.md)** (CPU) | Default driver; embarrassingly parallel across cores; no toolchain gate; the research's v1 choice |
| The CI / `t` / `z` math | **[SciPy `scipy.stats`](../13_scipy-stats.md)** | Canonical, tested; never hand-roll critical values |
| A GPU array Monte-Carlo exhibit, drop-in NumPy | **[CuPy](../15_cupy.md)** | cuRAND-backed, MIT; least new mental model on a GPU |
| GPU custom per-thread kernels + per-thread RNG | **[Numba](../14_numba.md) CUDA** | `xoroshiro128p` streams (BigCrush), BSD; one replication per thread |
| **A vectorized-functional Monte-Carlo / batched-ABM step, portable CPU→GPU/TPU, differentiable-ready** | **JAX** (this page) | `vmap`+`jit`+splittable RNG; Apache-2.0; same code on any backend |
| The teaching ABM engine (live + canonical) | **[Mesa](../04_mesa.md)** | Clean Agent/Model abstractions; the curriculum, not an accelerator |
| Event-loop DES (queues, ED, haul cycles) | **[SimPy](../01_simpy.md) / [Ciw](../02_ciw.md)** | DES is a poor fit for *any* SIMD/array accelerator |
| Million-agent GPU-ABM (reference only) | **FLAME GPU 2** | Documented chapter only — AGPL-3.0, brittle CUDA, 8 GB OOM; not a dependency |

**Deprecated — do not use:** **AgentPy** and **desmod** are deprecated; listed only
so they are recognised and avoided. (And **ABMax** is excluded here for the Windows
install failure above.)

**Rule of thumb:** reach for JAX only when the work is genuinely *vectorized array
arithmetic over many independent elements* and you value backend portability or
future differentiability. For the v1 ship, **joblib on CPU is the default** and JAX
is the documented vectorized alternative — never on the served app's runtime path.

---

## Related

- [`01_installation.md`](./01_installation.md) — version, CPU wheel, requirements tier.
- [`02_usage.md`](./02_usage.md) — the API + the worked example + its verified output.
- [`../../problem-types/04_monte-carlo-replications.md`](../../problem-types/04_monte-carlo-replications.md) — the methodology and the honest GPU verdict.
- [`../../guides/03_gpu-lane.md`](../../guides/03_gpu-lane.md) — the CPU-fallback / precompute-only lane policy.
