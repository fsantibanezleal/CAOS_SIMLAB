# 18 · Heavy / GPU ABM — usage (the three idioms)

This chapter is conceptual: it teaches the **programming idiom** each heavy-ABM engine forces on you, so you
can recognize which one a million-agent problem *would* want — without us shipping any of them. Each idiom is
a different answer to the same question: *"object-per-agent Mesa bogs down past ~10⁵ agents
([ABM guide §2.1](../../problem-types/02_agent-based-modeling.md)) — how do you go bigger?"*

> **No "Verified output" block here, by design.** Unlike the [JAX](../17_jax/02_usage.md),
> [CuPy](../15_cupy/02_usage.md), [Numba](../14_numba/02_usage.md) and [Taichi](../16_taichi/02_usage.md)
> nodes — which run a seeded `example.py` and paste the real stdout — this is a **reference chapter with no
> `example.py`**. None of these three installs+runs on this Windows / Python 3.13 box (see
> [`01_installation.md`](./01_installation.md)), so the snippets below are *illustrative of the idiom*, not
> executed. We do not paste output we did not capture.

The three idioms:

| Engine | Idiom (one phrase) | Mental model |
|---|---|---|
| **FLAME GPU 2** | **message-passing agents on the GPU** | each agent is a CUDA thread; agents communicate only by reading/writing **message lists** |
| **ABMax** | **`vmap` over the population** | the population is array columns; one agent's `step()` is `vmap`-batched + JIT-compiled |
| **AMBER** | **columnar dataframe ticks** | the population is a Polars DataFrame; a tick is a vectorized column expression |

---

## 1. FLAME GPU 2 — message-passing agents

FLAME GPU 2's core abstraction is **communication via messages**, not direct object references. You cannot
have agent A reach into agent B's fields (that would be a data race across thousands of CUDA threads).
Instead each tick has two kinds of agent function:

1. **output** functions — an agent *writes* a message into a typed message list (e.g. its position into a
   spatial-3D message list);
2. **input** functions — an agent *reads* the messages in its neighbourhood and updates its own state.

The GPU runs one agent per thread, in parallel, and the message lists are the only channel between them.
This is what makes it scale to **millions of agents on a single GPU** — there is no shared mutable graph to
lock.

**The idiom (illustrative — NOT runnable here):**

```python
# pseudocode in the FLAME GPU 2 Python-binding style
import pyflamegpu

model = pyflamegpu.ModelDescription("circles")

# 1. an agent type with state...
agent = model.newAgent("point")
agent.newVariableFloat("x")
agent.newVariableFloat("y")

# 2. a spatial message list agents talk through...
msg = model.newMessageSpatial2D("location")
msg.newVariableID("id")
msg.setRadius(1.0)         # only neighbours within r exchange messages
msg.setMin(0.0, 0.0); msg.setMax(50.0, 50.0)

# 3. agent functions are written in CUDA C (RTC-compiled at runtime)
out_fn = agent.newRTCFunction("output", r"""
FLAMEGPU_AGENT_FUNCTION(output, flamegpu::MessageNone, flamegpu::MessageSpatial2D) {
    FLAMEGPU->message_out.setVariable<flamegpu::id_t>("id", FLAMEGPU->getID());
    FLAMEGPU->message_out.setLocation(
        FLAMEGPU->getVariable<float>("x"), FLAMEGPU->getVariable<float>("y"));
    return flamegpu::ALIVE;
}""")
out_fn.setMessageOutput("location")
# ...an input function reads "location" messages in the radius and moves the agent...

cuda = pyflamegpu.CUDASimulation(model)   # picks the GPU, JIT-compiles the kernels
cuda.SimulationConfig().steps = 100
cuda.initFunctions(); cuda.simulate()     # millions of agents step in parallel
```

**What to take away:** the *agent rule* is real CUDA C, RTC-compiled at runtime, and **all** interaction is
mediated by message lists. It is the most powerful and the most operationally brittle of the three (CUDA
toolkit pinning, 8 GB-VRAM OOM, AGPL-3.0 — see [`01_installation.md`](./01_installation.md)). In CAOS_SIMLAB
it stays a chapter; if it were ever used, its output would have to ship as a **fully reproducible committed
trace**, because the static host can never recompute it.

## 2. ABMax — `vmap` over the population

ABMax keeps the *Mesa mental model* (agents with state and a `step`) but executes it the **JAX way**: the
population is a struct of arrays (one array per attribute, indexed by agent), and the per-agent step is a
**pure function** that JAX `vmap`-batches across the agent axis and `jit`-compiles into one fused kernel —
identical to the primitive documented in the [JAX guide](../17_jax/02_usage.md), just wrapped with ABM-flavoured
helpers (creation/removal, neighbourhood selection).

**The idiom (illustrative — ABMax does not install here; see [`01_installation.md`](./01_installation.md)):**

```python
# conceptual ABMax-style step, expressed with the JAX primitives it wraps
import jax.numpy as jnp
from jax import vmap, jit, random

# population = struct of arrays: one row per agent
state = {"x": jnp.zeros(1_000_000), "infected": jnp.zeros(1_000_000, bool)}

def agent_step(x, infected, key, beta):
    # pure function of ONE agent's state -> its next state
    roll = random.uniform(key)
    new_infected = infected | (roll < beta)
    return x, new_infected

step_pop = jit(vmap(agent_step, in_axes=(0, 0, 0, None)))   # batch over agents
keys = random.split(random.PRNGKey(0), state["x"].shape[0])
state["x"], state["infected"] = step_pop(state["x"], state["infected"], keys, 0.03)
```

**What to take away:** ABMax is "Mesa rules, JAX execution." Its strength is **backend portability** (the
same code runs CPU→GPU/TPU) and **differentiability** (gradients through the simulation), and its license is
permissive (Apache-2.0). Its weakness is the JAX constraint set — **fixed-shape, immutable** arrays, so
agents that spawn/die or have ragged neighbourhoods need padding+masking. Because the lab already has the
bare `vmap`+`jit` primitive verified and runnable (no ABMax install needed, and ABMax's install fails on
Windows), we teach the idiom here and use raw JAX in practice.

## 3. AMBER — columnar dataframe ticks

AMBER drops the object model entirely. The whole population is **one Polars DataFrame**, one row per agent,
one column per attribute, and a simulation step is a **vectorized column expression** over that frame — no
per-agent Python loop, all work pushed into Polars' Rust/SIMD engine. This is why it reports large speedups
over object-per-agent Mesa on big, homogeneous models, **on CPU only** (no GPU).

**The idiom (illustrative — AMBER not installed; Polars-style step):**

```python
# conceptual AMBER-style tick: the population IS a Polars DataFrame
import polars as pl

pop = pl.DataFrame({                    # one row per agent
    "id":       range(1_000_000),
    "state":    ["S"] * 1_000_000,      # SIR compartment
    "neighbours_infected": [0] * 1_000_000,
})

def sir_tick(pop: pl.DataFrame, beta: float, seed: int) -> pl.DataFrame:
    # an entire tick = ONE vectorized column expression (no agent loop)
    return pop.with_columns(
        pl.when((pl.col("state") == "S")
                & (pl.col("neighbours_infected") > 0)
                & (pl.col("id").hash(seed) % 1000 < int(beta * 1000)))
          .then(pl.lit("I"))
          .otherwise(pl.col("state"))
          .alias("state")
    )

pop = sir_tick(pop, beta=0.05, seed=20260619)
```

**What to take away:** AMBER trades the readable `Agent.step()` for **dataframe thinking** — every rule
becomes a `when/then/otherwise` over columns. It needs no GPU, no CUDA, no exotic toolchain (its only real
friction is thin upstream packaging). For our scale it adds nothing over headless Mesa, so it is documented,
not adopted.

---

## 4. The one thing all three share (and why we don't need them)

All three are answers to **"I have 10⁵–10⁸ agents and object-per-agent Mesa is too slow."** They differ only
in *how* they vectorize (GPU threads + messages / `vmap` over arrays / dataframe columns). The research's
blunt verdict, recorded in the [ABM guide §2.6](../../problem-types/02_agent-based-modeling.md) and the
[Monte-Carlo verdict](../../problem-types/04_monte-carlo-replications.md): **the highest-ROI parallel use in
this lab is thousands of independent seeded replications, not one giant population** — and that runs in
seconds on CPU cores via [joblib](../12_joblib/02_usage.md). Our eleven scenarios sit at ≤10⁵ agents, well
inside headless Mesa's comfort zone, so none of these three is needed for v1.

> **Deprecated — do not use, and not to be confused with these:** **AgentPy** and **desmod** are
> deprecated/unmaintained. They are *not* heavy/GPU engines; they are older small-scale tools listed only so
> they are recognised and avoided ([ABM guide §2.7](../../problem-types/02_agent-based-modeling.md)). The three
> engines in this chapter are the *real* heavy-ABM options; AgentPy/desmod are dead ends at any scale.

## Related

- [`01_installation.md`](./01_installation.md) — how each *would* be installed and why none is in our
  requirements.
- [`03_applying.md`](./03_applying.md) — the million-agent decision and our scenarios' honest verdict.
- [`../17_jax/02_usage.md`](../17_jax/02_usage.md) — the **runnable, verified** `vmap`+`jit` primitive ABMax wraps (the
  one we actually use).
- [`agent-based-modeling.md`](../../problem-types/02_agent-based-modeling.md) §2.6 — heavy/GPU lane in context.
