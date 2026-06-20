"""JAX vmap + jit vectorized Monte-Carlo — CAOS_SIMLAB framework demo.

What this demonstrates
----------------------
JAX as a *vectorization primitive*, not as a simulation engine. We take one
small, scalar "simulation" (a single seeded Monte-Carlo replication that
estimates a tail probability) and:

  1. write it once for ONE seed as a plain function of (key, params),
  2. `vmap` it over a whole batch of independent RNG keys so every replication
     runs in lock-step as one vectorized computation,
  3. `jit`-compile the whole batched function so the Python overhead is paid
     once and the kernel is fused.

The toy model: estimate  P(sum of n Exp(1) draws > threshold)  by Monte-Carlo.
Each replication draws `n_per_rep` Exponential(1) samples, sums them, and
returns 1.0 if the sum exceeds `threshold` else 0.0 (one Bernoulli trial). The
batch mean across `n_reps` replications is the Monte-Carlo estimate of that tail
probability; the analytic truth is the survival function of a Gamma(n, 1)
(Erlang) distribution, so we can check the estimate against ground truth.

Why this shape matters for the lab: a stochastic simulation KPI is a random
variable, and the honest answer is *mean over many independent replications*.
JAX's `jax.random` is splittable/counter-based, so `n_reps` independent keys are
provably non-overlapping streams — exactly the property a replication study
needs. This is the same "thousands of independent replications" workload the
GPU/Monte-Carlo research flags as the highest-ROI parallel use (we run it on the
CPU backend here; the identical code vmaps onto a GPU/TPU backend unchanged).

Determinism: everything is seeded from a single root key, so this script prints
the SAME numbers on every run, on every machine, on the CPU backend.

Run (from the repo root):
    .venv/Scripts/python.exe docs/frameworks/jax/example.py
"""

from __future__ import annotations

# Force the CPU backend BEFORE importing jax. CAOS_SIMLAB documents JAX as a
# CPU-runnable vectorization primitive; no GPU/CUDA is required to run this file.
import os

os.environ.setdefault("JAX_PLATFORMS", "cpu")
# Make the float math reproducible/portable across CPUs.
os.environ.setdefault("XLA_FLAGS", "--xla_cpu_enable_fast_math=false")

import jax
import jax.numpy as jnp
from jax import jit, random, vmap

# Use 64-bit so the analytic comparison is tight and platform-stable.
jax.config.update("jax_enable_x64", True)


def one_replication(key: jax.Array, n_per_rep: int, threshold: float) -> jax.Array:
    """ONE Monte-Carlo replication for ONE RNG key.

    Draws `n_per_rep` Exponential(1) samples, sums them, and returns a single
    Bernoulli outcome: 1.0 if the sum exceeds `threshold`, else 0.0.

    Written for a single seed only — `vmap` turns it into a batch with no edit.
    """
    samples = random.exponential(key, shape=(n_per_rep,))  # i.i.d. Exp(1)
    total = jnp.sum(samples)
    return (total > threshold).astype(jnp.float64)


def monte_carlo_estimate(
    root_seed: int,
    n_reps: int,
    n_per_rep: int,
    threshold: float,
) -> tuple[float, float]:
    """Vectorized + JIT-compiled batch of independent replications.

    Returns (estimate, standard_error_of_the_mean).
    """
    root_key = random.PRNGKey(root_seed)
    # `split` produces n_reps independent, non-overlapping sub-keys (one per
    # replication). This is the trustworthy-independent-streams property.
    keys = random.split(root_key, n_reps)

    # vmap maps `one_replication` over axis 0 of `keys`; n_per_rep and threshold
    # are held fixed (in_axes=None). jit compiles the whole batched function.
    batched = jit(
        vmap(one_replication, in_axes=(0, None, None)),
        static_argnums=(1,),  # n_per_rep changes array shapes -> static
    )
    outcomes = batched(keys, n_per_rep, threshold)  # shape (n_reps,)

    estimate = jnp.mean(outcomes)
    # Standard error of a Bernoulli mean: sqrt(p*(1-p)/n).
    sem = jnp.sqrt(estimate * (1.0 - estimate) / n_reps)
    return float(estimate), float(sem)


def analytic_tail(n_per_rep: int, threshold: float) -> float:
    """Ground truth: P(Gamma(n, 1) > threshold) via the regularized upper
    incomplete gamma function Q(n, threshold)."""
    from jax.scipy.special import gammaincc

    return float(gammaincc(n_per_rep, threshold))


def main() -> None:
    # Fixed experiment so the output is fully deterministic.
    root_seed = 20260619
    n_reps = 200_000          # independent Monte-Carlo replications
    n_per_rep = 5             # Exp(1) draws summed per replication  -> Gamma(5,1)
    threshold = 8.0           # tail cutoff

    print("JAX vmap + jit vectorized Monte-Carlo (CPU backend)")
    print("=" * 55)
    print(f"jax version      : {jax.__version__}")
    print(f"backend          : {jax.default_backend()}")
    print(f"devices          : {jax.devices()}")
    print(f"x64 enabled      : {jax.config.read('jax_enable_x64')}")
    print("-" * 55)
    print(f"replications     : {n_reps:,}")
    print(f"draws/replication: {n_per_rep}  (sum ~ Gamma({n_per_rep}, 1))")
    print(f"threshold        : {threshold}")
    print("-" * 55)

    estimate, sem = monte_carlo_estimate(root_seed, n_reps, n_per_rep, threshold)
    truth = analytic_tail(n_per_rep, threshold)

    lo, hi = estimate - 1.96 * sem, estimate + 1.96 * sem
    abs_err = abs(estimate - truth)

    print(f"MC estimate      : {estimate:.6f}")
    print(f"95% CI           : [{lo:.6f}, {hi:.6f}]")
    print(f"analytic truth   : {truth:.6f}   P(Gamma(5,1) > 8)")
    print(f"absolute error   : {abs_err:.6f}")
    print(f"truth in 95% CI  : {lo <= truth <= hi}")
    print("=" * 55)


if __name__ == "__main__":
    main()
