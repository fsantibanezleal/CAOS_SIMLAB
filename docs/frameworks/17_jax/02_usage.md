# 17 · JAX — usage

This is the hands-on guide: the handful of JAX concepts that matter for a
vectorized Monte-Carlo / ABM-batch workload, the minimal runnable example walked
through step by step, and its **real captured output** (re-run to confirm). For
the version and wheel see [`01_installation.md`](./01_installation.md); for the
judgement layer (scenarios, trade-offs, pick-vs-alternatives) see
[`03_applying.md`](./03_applying.md).

> JAX in CAOS_SIMLAB is a **vectorization primitive**. We do **not** build the
> simulation *engine* in JAX (that is [SimPy](../01_simpy.md) / [Mesa](../04_mesa.md) /
> [Ciw](../02_ciw.md)); we use JAX to run *many independent replications of a
> cheap computation at once* as a single fused, compiled kernel. Everything below
> runs on the **CPU backend** — no GPU needed.

---

## 1. The four concepts you actually need

### `jax.numpy` — NumPy you can transform

`import jax.numpy as jnp` gives you a near-drop-in NumPy API (`jnp.sum`,
`jnp.mean`, `jnp.sqrt`, …) that returns **`jax.Array`** values living on a device.
The crucial difference from NumPy: JAX arrays are **immutable** and JAX functions
are expected to be **pure** (no in-place mutation, no hidden side effects). That
purity is precisely what lets JAX *trace* and *compile* them — a function with a
hidden `print` or a global counter cannot be safely fused by XLA.

### `jax.random` — explicit, splittable RNG (the replication backbone)

JAX has **no global random state**. Randomness is an explicit input: a *key*
created with `random.PRNGKey(seed)`. To get many independent streams you **split**
a key:

```python
root = random.PRNGKey(20260619)
keys = random.split(root, n_reps)   # n_reps independent, non-overlapping keys
```

This is the property a replication study demands (see the
[Monte-Carlo methodology §7](../../problem-types/04_monte-carlo-replications/01_what-it-is.md#rng-streams-the-foundation-of-trustworthy-replications)):
each replication gets a *provably-independent* stream because JAX's PRNG is
counter-based and splittable, not a single mutated generator. Reusing a key gives
**identical** draws — great for reproducibility, fatal if you forget to split.

### `vmap` — write for ONE, run for MANY

`jax.vmap` is automatic vectorization. You write your computation for a **single**
element (one replication, one agent), and `vmap` rewrites it to run over a whole
batched axis with no Python loop:

```python
batched = vmap(one_replication, in_axes=(0, None, None))
# axis 0 of arg 0 (the keys) is the batch; args 1 and 2 are broadcast (None)
outcomes = batched(keys, n_per_rep, threshold)   # shape (n_reps,)
```

`in_axes` says *which* argument is batched and along which axis (`0`), and which
are held fixed (`None`). This is the heart of the "vectorized ABM / MC" pattern:
one clear scalar function + `vmap` = a batch, with **no** error-prone manual
broadcasting.

### `jit` — compile the whole thing once

`jax.jit` traces a function, hands the graph to **XLA**, and compiles a fused
native kernel. The first call pays the compile cost; later calls with the same
input shapes/dtypes reuse the cached kernel. Composing `jit(vmap(f))` means the
*entire batched* computation becomes one compiled kernel — the Python interpreter
is out of the inner loop entirely.

> **`static_argnums`** — arguments that change array *shapes* (here `n_per_rep`,
> which sets the draw count) must be marked static so JAX recompiles per distinct
> value instead of trying to trace them as abstract arrays.

---

## 2. The minimal example, walked through

The full script is [`example.py`](./example.py). It estimates a tail probability
by Monte-Carlo and checks it against the analytic truth.

**The model (one replication):** draw `n_per_rep = 5` i.i.d. `Exp(1)` samples, sum
them (the sum is `Gamma(5, 1)`-distributed), and return `1.0` if the sum exceeds
`threshold = 8.0`, else `0.0`. That is one Bernoulli trial estimating
`P(Gamma(5, 1) > 8)`.

```python
def one_replication(key, n_per_rep, threshold):
    samples = random.exponential(key, shape=(n_per_rep,))  # i.i.d. Exp(1)
    total = jnp.sum(samples)
    return (total > threshold).astype(jnp.float64)
```

**The batch (the JAX move):** split the root key into `n_reps = 200_000`
independent keys, `vmap` the single-replication function over them, and `jit` the
whole batched function:

```python
keys = random.split(random.PRNGKey(root_seed), n_reps)
batched = jit(vmap(one_replication, in_axes=(0, None, None)), static_argnums=(1,))
outcomes = batched(keys, n_per_rep, threshold)   # (n_reps,) of 0.0/1.0
```

**The estimate:** the batch mean is the Monte-Carlo estimate; its standard error
is the Bernoulli `sqrt(p(1-p)/n)`, giving a 95% CI of `estimate ± 1.96·sem`:

```python
estimate = jnp.mean(outcomes)
sem      = jnp.sqrt(estimate * (1 - estimate) / n_reps)
```

**The check (honesty):** the analytic truth is the survival function of the
`Gamma(5, 1)` (Erlang) distribution, i.e. the regularized upper incomplete gamma
`Q(5, 8) = gammaincc(5, 8)` from `jax.scipy.special`. We assert the truth lands
**inside** the 95% CI — turning "trust me" into a verifiable claim.

Two reproducibility guards make the output **identical on every run / machine** on
the CPU backend:

- `jax.config.update("jax_enable_x64", True)` — 64-bit math for a tight, stable
  comparison against the analytic value.
- A single fixed `root_seed` from which all `n_reps` streams are split.

---

## 3. Verified output

Run from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/17_jax/example.py
```

Captured stdout (real, on the CPU backend; identical across repeated runs):

```text
JAX vmap + jit vectorized Monte-Carlo (CPU backend)
=======================================================
jax version      : 0.10.2
backend          : cpu
devices          : [CpuDevice(id=0)]
x64 enabled      : True
-------------------------------------------------------
replications     : 200,000
draws/replication: 5  (sum ~ Gamma(5, 1))
threshold        : 8.0
-------------------------------------------------------
MC estimate      : 0.100425
95% CI           : [0.099108, 0.101742]
analytic truth   : 0.099632   P(Gamma(5,1) > 8)
absolute error   : 0.000793
truth in 95% CI  : True
=======================================================
```

**Reading the result:** 200,000 independent JAX replications estimate
`P(Gamma(5,1) > 8) ≈ 0.1004`, the analytic truth is `0.0996`, the absolute error
is `~8e-4`, and the truth falls **inside** the 95% confidence interval. The whole
batch is one `jit`-compiled, `vmap`-vectorized kernel on the CPU backend — no
Python replication loop, and the same code would run unchanged on a GPU/TPU
backend. This is the canonical "thousands of independent replications → mean +
honest CI" workload the lab teaches, expressed as vectorized compute.

---

## 4. Pitfalls (the ones that bite first)

- **Forgetting to split keys.** Reusing one key across replications gives the
  *same* draws every time — your "independent" runs collapse to one. Always
  `random.split` (or `random.fold_in`) per replication.
- **In-place mutation.** `arr[i] = x` does not exist; use `arr.at[i].set(x)`
  (returns a new array). JAX arrays are immutable by design.
- **Benchmarking the first call.** The first `jit` call includes compilation. Time
  the *second* call, and call `.block_until_ready()` when timing because JAX
  dispatches asynchronously.
- **Silent 32-bit truncation.** Without `jax_enable_x64`, everything is fp32 and
  the analytic comparison drifts. Set it **before** creating any array.
- **Shape-changing args under `jit`.** Anything that changes array shapes (like the
  draw count) must be `static_argnums`, or JAX retraces / raises.

---

## Related

- [`01_installation.md`](./01_installation.md) — version, wheel, deps, why CPU-only.
- [`03_applying.md`](./03_applying.md) — scenarios, the optimize / vectorize pattern, trade-offs.
- [`../../problem-types/04_monte-carlo-replications.md`](../../problem-types/04_monte-carlo-replications.md) — the replications / CI / warm-up curriculum this serves.
