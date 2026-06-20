"""scipy.stats worked example for CAOS_SIMLAB — confidence intervals the honest way.

What this demonstrates (the statistics half of the S10 pattern):

  1. A small *sample* of per-replication KPIs. Here it is K seeded runs of the
     per-run mean wait of a tiny M/M/c queue, the same `mmc_mean_wait(...)` shape as
     `simlab/scenarios/s10_montecarlo.py` — so the sample we summarise is exactly the
     kind of output a Monte-Carlo replication study produces.

  2. Two 95% confidence intervals for the population mean, computed with
     `scipy.stats` (NOT hand-typed critical values):
       - normal-approximation (z):  X̄ ± z · s/√n   via `scipy.stats.norm.interval`
       - Student-t (small n):       X̄ ± t · s/√n   via `scipy.stats.t.interval`
     plus the building blocks `scipy.stats.sem` (standard error) and
     `scipy.stats.norm.ppf` / `scipy.stats.t.ppf` (critical values) shown explicitly.

  3. When each applies: for small n the t-interval is WIDER (it admits that we
     estimated the variance from the same small sample); as n grows the two
     intervals converge. We show the same sample at n=8, n=30 and n=400 so the
     gap shrinks before your eyes.

  4. Determinism: the sample is drawn from a single seeded `numpy` Generator, so
     re-running prints byte-identical numbers. scipy.stats itself is a pure
     deterministic function of the sample.

Run it (cwd = repo root, the CAOS_SIMLAB folder):

    .venv/Scripts/python.exe docs/frameworks/13_scipy-stats/example.py

Only relative paths and the standard scientific stack are used (numpy, scipy).
No GPU, no network, no files written.
"""

from __future__ import annotations

import heapq
import math

import numpy as np
from scipy import stats


def mmc_mean_wait(lam: float, mu: float, c: int, n: int, rng: np.random.Generator) -> float:
    """One replication: mean time-in-queue of an M/M/c FCFS queue (earliest-free-server method).

    Mirrors `simlab/scenarios/s10_montecarlo.py::mmc_mean_wait` exactly — it takes a
    pre-built Generator so each replication owns an independent, seeded RNG stream.
    """
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


def sample_kpis(lam: float, mu: float, c: int, n: int, k_reps: int, base_seed: int) -> np.ndarray:
    """Draw k_reps i.i.d. per-run KPIs. Seed plan `base_seed + r` matches S10's `make_rng(seed + r)`."""
    return np.array(
        [mmc_mean_wait(lam, mu, c, n, np.random.default_rng(base_seed + r)) for r in range(k_reps)],
        dtype=float,
    )


def normal_ci(sample: np.ndarray, confidence: float = 0.95) -> tuple[float, float, float]:
    """Normal-approximation (z) CI for the population mean.

    The two canonical scipy.stats ways, shown to give the same answer:
      A) one call:  stats.norm.interval(confidence, loc=mean, scale=sem)
      B) by hand with the critical value:  mean ± stats.norm.ppf(1-α/2) · sem
    `stats.sem(sample)` is the standard error of the mean = s/√n with the n-1 (ddof=1) divisor.
    """
    mean = float(np.mean(sample))
    sem = float(stats.sem(sample))  # = sample.std(ddof=1) / sqrt(n)
    lo, hi = stats.norm.interval(confidence, loc=mean, scale=sem)   # method A
    z = float(stats.norm.ppf(1 - (1 - confidence) / 2))             # method B critical value (≈1.96)
    lo_b, hi_b = mean - z * sem, mean + z * sem
    assert math.isclose(lo, lo_b) and math.isclose(hi, hi_b)        # A and B agree
    return mean, float(lo), float(hi)


def student_t_ci(sample: np.ndarray, confidence: float = 0.95) -> tuple[float, float, float]:
    """Student-t CI for the population mean (unknown variance estimated from the sample).

    df = n - 1 degrees of freedom. As n→∞, t.ppf → z.ppf and this collapses to the normal CI.
      A) one call:  stats.t.interval(confidence, df, loc=mean, scale=sem)
      B) by hand:   mean ± stats.t.ppf(1-α/2, df) · sem
    """
    n = sample.size
    df = n - 1
    mean = float(np.mean(sample))
    sem = float(stats.sem(sample))
    lo, hi = stats.t.interval(confidence, df, loc=mean, scale=sem)  # method A
    t_crit = float(stats.t.ppf(1 - (1 - confidence) / 2, df))       # method B critical value
    lo_b, hi_b = mean - t_crit * sem, mean + t_crit * sem
    assert math.isclose(lo, lo_b) and math.isclose(hi, hi_b)        # A and B agree
    return mean, float(lo), float(hi)


def erlang_c_wq(lam: float, mu: float, c: int) -> float:
    """Closed-form steady-state mean wait Wq of an M/M/c queue (Erlang-C), as a reference target."""
    a = lam / mu
    rho = lam / (c * mu)
    s = sum(a**k / math.factorial(k) for k in range(c))
    last = a**c / (math.factorial(c) * (1 - rho))
    p_wait = last / (s + last)
    return p_wait / (c * mu - lam)


def main() -> None:
    # --- model (a small, fast M/M/c; ρ = λ/(c·μ) = 2/3 ≈ 0.67, well below saturation) ---
    LAM, MU, C, N = 2.0, 1.0, 3, 600
    BASE_SEED = 42
    CONF = 0.95
    alpha = 1 - CONF
    wq_theory = erlang_c_wq(LAM, MU, C)

    print("=== scipy.stats confidence intervals (S10 statistics layer) ===")
    print(f"model: M/M/c  lam={LAM} mu={MU} c={C}  customers/run n={N}  rho={LAM / (C * MU):.3f}")
    print(f"reference: Erlang-C steady-state Wq = {wq_theory:.4f}")
    print(f"confidence = {CONF:.0%}  (alpha = {alpha:.2f})")
    print()

    # The two critical values that drive every interval below.
    z_crit = float(stats.norm.ppf(1 - alpha / 2))
    print("critical values from scipy.stats:")
    print(f"  z = norm.ppf(0.975)            = {z_crit:.4f}   (n-independent)")
    for n_small in (8, 30, 400):
        t_crit = float(stats.t.ppf(1 - alpha / 2, n_small - 1))
        print(f"  t = t.ppf(0.975, df={n_small - 1:>3d})       = {t_crit:.4f}   (df = n-1, shrinks toward z)")
    print()

    # --- the same study at three sample sizes: watch t and z converge ---
    print(f"{'K (reps)':>8} | {'mean':>7} | {'sem':>7} | {'normal (z) 95% CI':>24} | {'Student-t 95% CI':>24} | t-width / z-width")
    print("-" * 104)
    for k in (8, 30, 400):
        sample = sample_kpis(LAM, MU, C, N, k_reps=k, base_seed=BASE_SEED)
        mean, z_lo, z_hi = normal_ci(sample, CONF)
        _, t_lo, t_hi = student_t_ci(sample, CONF)
        sem = float(stats.sem(sample))
        ratio = (t_hi - t_lo) / (z_hi - z_lo)
        print(
            f"{k:>8} | {mean:>7.4f} | {sem:>7.4f} | "
            f"[{z_lo:>7.4f}, {z_hi:>7.4f}] | [{t_lo:>7.4f}, {t_hi:>7.4f}] | {ratio:>6.3f}x"
        )
    print()

    # --- spell out the small-n case (K=8): t is the safe default ---
    sample8 = sample_kpis(LAM, MU, C, N, k_reps=8, base_seed=BASE_SEED)
    mean, z_lo, z_hi = normal_ci(sample8, CONF)
    _, t_lo, t_hi = student_t_ci(sample8, CONF)
    print("small sample (K=8) - why we default to Student-t:")
    print(f"  sample (per-run Wq): {np.array2string(sample8, precision=4, floatmode='fixed')}")
    print(f"  normal (z)  CI: [{z_lo:.4f}, {z_hi:.4f}]  width {z_hi - z_lo:.4f}  (too narrow: assumes known variance)")
    print(f"  Student-t   CI: [{t_lo:.4f}, {t_hi:.4f}]  width {t_hi - t_lo:.4f}  (wider, honest: variance estimated)")
    print(f"  Erlang-C theory {wq_theory:.4f} inside t-CI? {t_lo <= wq_theory <= t_hi}")
    print()

    # --- determinism: the whole thing is a pure function of the seed ---
    a = sample_kpis(LAM, MU, C, N, k_reps=30, base_seed=BASE_SEED)
    b = sample_kpis(LAM, MU, C, N, k_reps=30, base_seed=BASE_SEED)
    print(f"determinism: same base_seed reproduces the sample exactly? {np.array_equal(a, b)}")


if __name__ == "__main__":
    main()
