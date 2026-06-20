# 18 · Heavy / GPU ABM — the million-agent reference chapter (FLAME GPU 2 · ABMax · AMBER)

This node is **not a framework we ship** — it is a *reference chapter* documenting the three heavy
agent-based-modeling engines the research evaluated for the *million-agent* case: **FLAME GPU 2** (CUDA
message-passing agents, AGPL-3.0), **ABMax** (JAX `vmap` over the population, Apache-2.0), and **AMBER**
(Polars-columnar CPU big-ABM). Each is a different answer to one question: *object-per-agent
[Mesa](./04_mesa.md) bogs down past ~10⁵ agents — how do you go bigger?* The chapter teaches the **idiom**
each forces on you (message lists / pure-function batching / dataframe ticks) so you can recognise which one
a 10⁶–10⁸-agent problem *would* want, and records — honestly — **why none of them is installed in this
repo**: no PyPI wheel + AGPL for FLAME GPU 2, a Windows long-path install failure for ABMax, and niche
packaging with no payoff at our scale for AMBER.

The lab uses this node as the **discipline-of-not-over-reaching** exhibit. CAOS_SIMLAB's flagship value is
small-N didactic clarity (queueing DES, emergent ABM) where a GPU is pointless, and its deploy contract is a
committed deterministic trace replayed by a static site — a host that can *never* run any of these engines.
So all three are mapped to **no scenario**: the ABM scenarios (S02 Schelling, S03 SIR, S05 Beer Game) are
already legible at Mesa scale, and the one genuinely "heavy" scenario, **S10**, is a *Monte-Carlo replication
study* (thousands of cheap independent seeded runs) that is embarrassingly parallel on plain CPU cores via
[joblib](./12_joblib.md). The chapter's punchline, straight from the research: **replications, not population
size, is the high-ROI parallel workload here** — reach for a heavy-ABM engine only when you are *provably*
above ~10⁵ agents, the model is vectorizable, and the arithmetic dwarfs the overhead. For our ten scenarios,
none of those conditions holds.

## Read in order

1. [`01_installation.md`](./18_gpu-abm-chapter/01_installation.md) — how each engine *would* be installed
   (conda/source FLAME GPU 2, `pip install abmax`, Polars + AMBER), the exact reasons each is **absent** from
   every requirements lane, platform/CUDA notes, and a sanity check that confirms their intentional absence.
2. [`02_usage.md`](./18_gpu-abm-chapter/02_usage.md) — the three programming idioms (GPU message-passing /
   `vmap` over arrays / columnar dataframe ticks) with illustrative, clearly-marked **not-executed** snippets
   (no fabricated output — there is no `example.py` to run).
3. [`03_applying.md`](./18_gpu-abm-chapter/03_applying.md) — how to *formalise* the large-population problem,
   how to *solve* it with each engine, the scenario→tool map showing why **none** of S01–S11 needs them, the
   honest trade-offs, and the pick-which / pick-instead table.

## No example to run (by design)

> **This node ships no `example.py`.** None of FLAME GPU 2 / ABMax / AMBER is a clean, pip-installable,
> runnable pipeline on this Windows / Python 3.13 box, so there is nothing to seed-run and capture — pasting
> output we did not produce would be dishonest. The line this chapter draws is precisely *installable +
> verifiable here* vs. *documented-but-deferred*. The installable GPU-lane siblings that **do** ship verified
> runnable examples are [CuPy](./15_cupy.md), [Numba](./14_numba.md), [Taichi](./16_taichi.md), and JAX.

## Scenarios that use it

**None — and that is the lesson.** This node is mapped to no scenario; it is the reference threshold against
which the lab's actual choices are measured. The scenarios it *informs* (by declining to be used) are the ABM
and replication ones:

- **S02 Schelling · S03 SIR · S05 Beer Game** — emergent ABM that ships on [Mesa](./04_mesa.md) at ≤10⁵
  agents (the engines here would add cost and zero pedagogical insight).
- **S10 Monte-Carlo / CI study** — the genuinely heavy job, solved as thousands of seeded replications via
  [joblib](./12_joblib.md) (+ [CuPy](./15_cupy.md) / [Numba](./14_numba.md) as the optional GPU exhibit), not
  as one giant population.

## Related in the lab

- [Agent-based modeling](../problem-types/02_agent-based-modeling.md) §2.6–2.7 — the heavy/GPU lane and the
  deprecated tools (AgentPy, desmod), in curriculum context.
- [Monte-Carlo / replications verdict](../problem-types/04_monte-carlo-replications.md) — the "replications,
  not population size" decision this chapter rests on.
- [GPU lane guide](../guides/03_gpu-lane.md) — the lab-wide CPU-fallback / precompute-only policy these engines
  could never satisfy on the host.
- Sibling GPU-lane nodes that **do** install + run here: [CuPy](./15_cupy.md) · [Numba](./14_numba.md) ·
  [Taichi](./16_taichi.md). The engines we use instead of these three: [Mesa](./04_mesa.md) (ABM) ·
  [joblib](./12_joblib.md) (replications).

*Part of the CAOS_SIMLAB teaching repo — <https://github.com/fsantibanezleal/CAOS_SIMLAB>.*
