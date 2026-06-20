# Heavy / GPU ABM — applying it (the million-agent decision)

This is the judgement layer for the heavy-ABM chapter: **when** million-agent
scale genuinely justifies FLAME GPU 2 / ABMax / AMBER, the pattern they fit, the
research's honest trade-offs, and — the punchline — **why none of CAOS_SIMLAB's
ten scenarios reaches for them**. The whole point of this chapter is to teach the
*discipline of not over-reaching for a GPU* as clearly as the rest of the lab
teaches reaching for the right dedicated tool.

> **Reference / post-v1 only.** These engines are mapped to **no scenario**. They
> are documented so a learner can recognise the threshold at which they *would*
> become correct — and see that our problems sit below it.

---

## 1. The decision rule: when does a heavy-ABM engine pay off?

Object-per-agent **Mesa** ([guide](../../problem-types/agent-based-modeling.md)
§2.1) is comfortable at **10³–10⁵ agents** and is the lab's teaching default. It
bogs down past ~10⁵ because every agent is a Python object stepped in a Python
loop. The heavy engines exist for exactly the regime above that line:

| Population size | Right tool | Lane |
|---|---|---|
| 10³–10⁵ agents | **Mesa** (headless → trace → replay) | precompute (ships) |
| 10⁵–10⁸ agents, homogeneous, CPU-bound | **AMBER** (Polars columnar) | reference |
| 10⁵–10⁸ agents, vectorizable, want CPU→GPU portability / gradients | **ABMax** (JAX `vmap`) | reference |
| 10⁶–10⁸ agents, message-passing, single big GPU | **FLAME GPU 2** (CUDA) | reference |

Two more conditions must *also* hold before the jump is worth it — both straight
from the research:

1. **The model must actually be vectorizable.** Fixed-shape, homogeneous agent
   state with regular interaction (a lattice SIR, a flocking field) vectorizes;
   spawning/dying agents, ragged neighbourhoods, and data-dependent branching
   fight every one of these engines (you pad+mask, or you lose the speedup).
2. **The parallel arithmetic must dwarf the overhead.** GPU launch + host↔device
   transfer (and JIT compile) is a fixed tax; below the crossover it is *slower*
   than CPU. This is the same crossover verdict as the
   [Monte-Carlo GPU section](../../problem-types/monte-carlo-replications.md).

If any of the three fails — sub-10⁵ agents, irregular model, or overhead-bound —
the heavy engine is the wrong call and Mesa-headless (or joblib replications)
wins.

---

## 2. The pattern they fit: precompute-only, trace-then-replay

Every one of these is **precompute-only** in this lab's architecture. None can
ever run on the public host (static site, GPU-less, few vCPU — see
[ARCHITECTURE.md](../../ARCHITECTURE.md)). So the only admissible pattern is the
lab's universal one, with an extra-strict reproducibility clause:

> **simulate-offline → commit a seeded trace → SPA replays it.**

For FLAME GPU 2 especially, the research is explicit: *because the host can never
recompute a GPU run*, any result that ships **must** be a fully reproducible
committed artifact (fixed seed, fixed device, snapshot of deterministic state).
This is the same "local compute → committed artifact → static viewer" contract as
every other precompute scenario — just with the determinism bar raised because
the compute is non-reproducible on the serving side.

It is **not** the live lane (NetLogo Web / Pyodide-Mesa). A heavy-ABM run is, by
definition, too costly to run per-visitor in a browser — it fails the 3-gate rule
on the first gate.

---

## 3. Which of our scenarios use them — none (and why that's correct)

The scenario→tool map assigns every one of S01–S11 to engines that **install and
run cleanly here**:

| Scenario | Assigned engine(s) | Heavy-ABM? |
|---|---|---|
| S01 | SimPy + Ciw | no |
| S02 / S03 / S05 | **Mesa** (≤10⁵ agents) | no — within Mesa's comfort zone |
| S04 | SimPy | no |
| S06 | OR-Tools CP-SAT | no |
| S07 | OR-Tools + SimPy + OSMnx/NetworkX | no |
| S08 | OR-Tools + PyVRP + SimPy | no |
| S09 | OR-Tools + SimPy + graph | no |
| S10 | joblib + CuPy/Numba + SciPy | no — *replications*, not one big population |
| S11 | OR-Tools GLOP + SimPy | no |

The ABM scenarios (**S02 Schelling, S03 SIR, S05 Beer Game**) are the only ones
that *could* in principle scale to millions of agents — but didactically they do
not need to. Schelling segregates on a ~50×50 grid; SIR's epidemic curve and R₀
are visible at thousands of agents; the Beer Game has **four** echelons. Pushing
any of them to 10⁷ agents adds compute cost and *zero* pedagogical insight — the
emergence, the threshold, the bullwhip are all already legible at Mesa scale.

And the genuinely "heavy" scenario, **S10**, is deliberately framed as a
**Monte-Carlo replication study**, not a giant population: thousands of
*independent seeded runs* of a cheap model, which is embarrassingly parallel
across CPU cores via **joblib** (the v1 default), with CuPy/Numba as the optional
GPU exhibit. That is the research's central verdict made concrete:
**replications, not population size, is the high-ROI parallel workload here.**

---

## 4. Honest trade-offs (grounded in the research)

**FLAME GPU 2 — most powerful, most brittle.**
- *Wins:* genuine million-agent scale on a single GPU; mature message-passing
  model; Python bindings over a fast CUDA core.
- *Costs:* **AGPL-3.0** copyleft (a real reason not to vendor it into a permissive
  public repo); **no PyPI wheel** (conda/source + pinned CUDA 12 toolchain);
  documented **8 GB-VRAM OOM** on laptop-class GPUs; results are
  **non-reproducible on the host**, so they must ship as frozen traces. Verdict:
  *cut from the v1 runtime stack, kept as a teaching chapter.*

**ABMax (JAX) — portable and differentiable, but won't install here.**
- *Wins:* permissive **Apache-2.0**; same code runs **CPU→GPU/TPU**;
  differentiable simulation; lighter than CUDA when GPU setup is painful.
- *Costs:* `pip install abmax` **fails on this Windows box** (`WinError 206`,
  path-too-long via the transitive `orbax` dependency — see
  [installation.md](./installation.md)); inherits JAX's **fixed-shape/immutable**
  constraint (spawn/die and ragged neighbourhoods need pad+mask). Verdict: we use
  the **bare `vmap`+`jit` primitive** ([JAX guide](../jax/applying.md), verified
  and runnable) instead of the wrapper — same idiom, no failing install.

**AMBER (Polars) — no GPU needed, but no need for us either.**
- *Wins:* **CPU-only** big-ABM (reported up to ~1000× over Mesa on large SIR); no
  CUDA, no driver pinning; "big sims without a GPU at all."
- *Costs:* niche / thin upstream packaging; forces **dataframe thinking** (rules
  as column expressions, losing the readable `Agent.step()`); and — decisively —
  our models top out at ~10⁵ agents, where headless Mesa is already fast enough.
  Verdict: documented, not adopted.

**The meta trade-off (all three).** The research is blunt that the *didactic*
payoff of ABM — emergence, thresholds, feedback — is identical at 10⁴ agents and
10⁷ agents. A heavy engine buys **scale**, not **understanding**. Since the lab's
job is to teach which dedicated tool fits which problem, the right lesson about
these three is *recognising the threshold and declining to cross it for our
scenarios.*

---

## 5. When to pick which — and what to pick instead (for us)

| You actually have… | Pick | Instead, for our scale we use |
|---|---|---|
| 10⁶–10⁸ message-passing agents, a big GPU, AGPL OK | **FLAME GPU 2** | — (no such scenario) |
| 10⁵–10⁸ vectorizable agents, want CPU→GPU portability / gradients | **ABMax** | bare **JAX** `vmap`+`jit` ([guide](../jax/applying.md)) |
| 10⁵–10⁸ homogeneous agents, **no GPU available** | **AMBER** | headless **Mesa** ([guide](../mesa/applying.md)) |
| 10³–10⁵ agents, a curriculum to teach | **Mesa** | **Mesa** (S02/S03/S05) — the actual choice |
| thousands of independent seeded runs (the real heavy job) | **joblib** (+CuPy/Numba exhibit) | **joblib** (S10) — the actual choice |

**Deprecated — do not use:** **AgentPy** and **desmod** are deprecated /
unmaintained. They are *not* in this comparison as viable heavy engines; they are
listed across the lab only so they are recognised and avoided
([ABM guide §2.7](../../problem-types/agent-based-modeling.md)).

**Rule of thumb.** Reach for a heavy-ABM engine only when you are *provably* above
~10⁵ agents **and** the model is vectorizable **and** the arithmetic dwarfs the
overhead — and even then prefer the path that ships a reproducible trace and
carries a permissive license. For CAOS_SIMLAB's ten scenarios, **none of those
conditions is met**, so all three stay in this chapter and the work ships on
Mesa (ABM) and joblib (replications) on plain CPU.

## Related

- [`installation.md`](./installation.md) — how each would be installed; why none is shipped.
- [`usage.md`](./usage.md) — the three idioms (message-passing / `vmap` / columnar).
- [`../../problem-types/agent-based-modeling.md`](../../problem-types/agent-based-modeling.md)
  §2.6–2.7 — the heavy/GPU lane and the deprecated tools, in curriculum context.
- [`../../problem-types/monte-carlo-replications.md`](../../problem-types/monte-carlo-replications.md)
  — the "replications, not population size" verdict.
- [`../mesa/applying.md`](../mesa/applying.md) · [`../joblib/applying.md`](../joblib/applying.md) ·
  [`../jax/applying.md`](../jax/applying.md) — the engines we *actually* use instead.
