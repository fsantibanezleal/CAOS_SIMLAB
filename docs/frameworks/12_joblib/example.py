"""joblib worked example for CAOS_SIMLAB — CPU-parallel Monte-Carlo replications.

What this demonstrates (the S10 pattern, in miniature):

  1. A *cheap stochastic function* `replication(seed)` that returns one noisy KPI.
     Here it is the per-run mean wait of a tiny M/M/c queue, sampled with one
     seeded RNG — exactly the shape of `mmc_mean_wait(...)` in
     `simlab/scenarios/s10_montecarlo.py`, just smaller.

  2. Fanning K independent, *seeded* replications across CPU cores with
     `joblib.Parallel` / `delayed`. Each replication owns its own RNG stream
     (`seed = base_seed + r`), so the result is reproducible regardless of how
     many workers run or in what order they finish.

  3. Aggregating the K per-run KPIs into a sample mean and a normal-approximation
     95% confidence interval  ( X̄ ± 1.96 · s / √K ,  s with ddof=1 ).

  4. Determinism: running the whole parallel study twice with the same base seed
     yields a bit-identical mean. Order independence is also shown by comparing a
     1-worker run to an all-cores run.

Run it (cwd = repo root, the CAOS_SIMLAB folder):

    .venv/Scripts/python.exe docs/frameworks/12_joblib/example.py

Only relative paths and the standard scientific stack are used (numpy, joblib).
No GPU, no network, no files written.
"""

from __future__ import annotations

import heapq
import math

import numpy as np
from joblib import Parallel, delayed


def mmc_mean_wait(lam: float, mu: float, c: int, n: int, seed: int) -> float:
    """One replication: mean time-in-queue of an M/M/c FCFS queue (earliest-free-server method).

    Mirrors `simlab/scenarios/s10_montecarlo.py::mmc_mean_wait`, but takes a *seed*
    (not a pre-built Generator) so the function is self-contained and picklable —
    joblib must be able to ship it to worker processes.
    """
    rng = np.random.default_rng(int(seed))  # the single source of randomness for this run
    inter = rng.exponential(1.0 / lam, size=n)
    service = rng.exponential(1.0 / mu, size=n)
    arrival = np.cumsum(inter)
    free = [0.0] * c
    heapq.heapify(free)
    total_wait = 0.0
    for i in range(n):
        f = heapq.heappop(free)
        start = arrival[i] if arrival[i] > f else f
        total_wait += start - arrival[i]
        heapq.heappush(free, start + service[i])
    return total_wait / n


def run_study(lam: float, mu: float, c: int, n: int, k_reps: int, base_seed: int, n_jobs: int):
    """Fan k_reps seeded replications across `n_jobs` CPU workers and aggregate a 95% CI.

    Returns (mean, half_width, per_run_array). The seed plan is `base_seed + r`,
    which is exactly the S10 scheme (`make_rng(seed + r)`), so the same base_seed
    reproduces the same study bit-for-bit on any number of workers.
    """
    per_run = Parallel(n_jobs=n_jobs)(
        delayed(mmc_mean_wait)(lam, mu, c, n, base_seed + r) for r in range(k_reps)
    )
    per_run = np.asarray(per_run, dtype=float)
    mean = float(per_run.mean())
    sd = float(per_run.std(ddof=1))           # sample sd, n-1 divisor (matches S10)
    half = 1.96 * sd / math.sqrt(k_reps)      # normal-approx 95% CI half-width
    return mean, half, per_run


def main() -> None:
    # --- model + study parameters (a small, fast M/M/c; ρ = λ/(c·μ) = 2/3 ≈ 0.67) ---
    LAM, MU, C, N = 2.0, 1.0, 3, 600
    K_REPS = 400
    BASE_SEED = 42

    # Closed-form steady-state Erlang-C mean wait Wq, for reference.
    # Wq = C(c, a) / (c·μ − λ), with a = λ/μ and Erlang-C probability of waiting.
    a = LAM / MU
    rho = LAM / (C * MU)
    s = sum(a**k / math.factorial(k) for k in range(C))
    last = a**C / (math.factorial(C) * (1 - rho))
    p_wait = last / (s + last)
    wq_theory = p_wait / (C * MU - LAM)

    print("=== joblib CPU-parallel Monte-Carlo replications (S10 pattern) ===")
    print(f"model: M/M/c  lam={LAM} mu={MU} c={C}  customers/run n={N}  rho={rho:.3f}")
    print(f"study: K={K_REPS} replications, base_seed={BASE_SEED}")
    print(f"Erlang-C steady-state Wq (reference) = {wq_theory:.4f}")
    print()

    # --- run the study across ALL cores ---
    mean_all, half_all, per_run = run_study(LAM, MU, C, N, K_REPS, BASE_SEED, n_jobs=-1)
    lo, hi = mean_all - half_all, mean_all + half_all
    print(f"[n_jobs=-1, all cores]  mean Wq = {mean_all:.4f}")
    print(f"                        95% CI  = [{lo:.4f}, {hi:.4f}]  (half-width {half_all:.4f})")
    print(f"                        theory inside CI? {lo <= wq_theory <= hi}")
    print(f"                        per-run spread: min={per_run.min():.4f} max={per_run.max():.4f}")
    print()

    # --- determinism check #1: same base seed, run again on all cores -> identical mean ---
    mean_again, half_again, _ = run_study(LAM, MU, C, N, K_REPS, BASE_SEED, n_jobs=-1)
    print("determinism (same base_seed, second all-core run):")
    print(f"  mean repeats exactly?      {mean_all == mean_again}  ({mean_all:.10f} == {mean_again:.10f})")

    # --- determinism check #2: worker count must not change the result (order independence) ---
    mean_serial, _, _ = run_study(LAM, MU, C, N, K_REPS, BASE_SEED, n_jobs=1)
    print(f"  1 worker == all workers?   {mean_all == mean_serial}  (n_jobs=1 vs n_jobs=-1)")

    # --- a different base seed gives a (slightly) different study -> it IS stochastic ---
    mean_other, _, _ = run_study(LAM, MU, C, N, K_REPS, base_seed=1234, n_jobs=-1)
    print(f"  different base_seed differs? {mean_all != mean_other}  ({mean_all:.4f} vs {mean_other:.4f})")
    print()

    # --- per-seed determinism of ONE replication (the atomic unit) ---
    one_a = mmc_mean_wait(LAM, MU, C, N, seed=BASE_SEED + 7)
    one_b = mmc_mean_wait(LAM, MU, C, N, seed=BASE_SEED + 7)
    print(f"single replication seed={BASE_SEED + 7} reproducible? {one_a == one_b}  (Wq={one_a:.4f})")


if __name__ == "__main__":
    main()
