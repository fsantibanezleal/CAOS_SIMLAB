"""Numba — JIT Monte-Carlo on the CPU, plus an optional CUDA kernel for the GPU exhibit.

This is the smallest honest demonstration of why Numba is in CAOS_SIMLAB at all. The
product's GPU page (S10) makes one claim and proves it: a GPU helps *thousands of
independent Monte-Carlo replications*, not a small branch-heavy discrete-event loop.
Numba is the tool that lets us write the *same* per-replication kernel twice — once with
``@njit`` for the CPU and once as a ``@cuda.jit`` kernel for the GPU — so the speed-up
(or the lack of one) is measured on identical arithmetic, not on two different programs.

What the script does:

1. ``@njit`` CPU Monte-Carlo. We estimate pi by the classic dart-throwing method:
   draw N uniform points in the unit square, count how many fall inside the quarter
   circle, and ``pi ~= 4 * inside / N``. The loop is a plain Python ``for`` that Numba
   compiles to machine code on first call. We seed NumPy *outside* the kernel so the
   draws are deterministic.

2. A second ``@njit`` kernel estimates a real simulation statistic — the probability
   that a 3-server queue is *all busy* (the Erlang-C "probability of wait") — by Monte
   Carlo, to show Numba on a queueing quantity, not just a geometry toy.

3. ``@cuda.jit`` GPU Monte-Carlo, **guarded by ``cuda.is_available()``**. Each GPU
   thread owns an independent RNG stream created with
   ``create_xoroshiro128p_states`` (period 2**128 - 1, passes TestU01 BigCrush) and
   estimates pi on its own slice of darts; a host-side reduction averages the threads.
   If no CUDA GPU is present (the common case on a laptop without an NVIDIA card, and
   always on the GPU-less production host), the script says so and runs the SAME
   estimate on the CPU as a fallback, so it always prints a GPU-section result.

Everything is deterministic: NumPy is seeded for the CPU paths and the xoroshiro states
are created from a fixed seed for the GPU path, so the same script prints stable numbers
(GPU floating-point reductions can differ in the last digit across drivers, which we note).

Run (from the repo root):
    .venv/Scripts/python.exe docs/frameworks/14_numba/example.py
"""

from __future__ import annotations

import math

import numpy as np
from numba import cuda, njit
from numba.cuda.random import (
    create_xoroshiro128p_states,
    xoroshiro128p_uniform_float32,
)

# ---------------------------------------------------------------------------
# Parameters. (seed, N) fully determine every CPU result.
# ---------------------------------------------------------------------------
SEED = 42
N_DARTS = 20_000_000          # darts for the pi estimate (big enough to be JIT-worthy)
N_QUEUE_SAMPLES = 5_000_000   # samples for the queue "all-busy" probability
LAM, MU, C = 2.4, 1.0, 3      # an M/M/3 queue: offered load a = lam/mu = 2.4 Erlangs


# ---------------------------------------------------------------------------
# 1. @njit CPU Monte-Carlo: estimate pi by dart throwing.
# ---------------------------------------------------------------------------
@njit(cache=True, fastmath=True)
def pi_cpu(xs: np.ndarray, ys: np.ndarray) -> float:
    """Fraction-in-quarter-circle * 4. Pure scalar loop, compiled by Numba.

    ``xs``/``ys`` are pre-drawn uniform[0,1) arrays so the randomness is seeded by the
    caller and the kernel itself is a deterministic function of its inputs.
    """
    inside = 0
    n = xs.shape[0]
    for i in range(n):
        if xs[i] * xs[i] + ys[i] * ys[i] <= 1.0:
            inside += 1
    return 4.0 * inside / n


# ---------------------------------------------------------------------------
# 2. @njit CPU Monte-Carlo of a queueing statistic.
#    Estimate P(all c servers busy) for an M/M/c via the embedded steady-state idea:
#    sample a Poisson(a) number-in-system surrogate is overkill here, so we use the
#    simplest faithful estimator — sample the stationary "number busy" of an
#    M/M/c/c (Erlang-B) loss view is also off-topic; instead we Monte-Carlo the
#    Erlang-C wait probability directly from its definition by sampling the
#    stationary number-in-system N of an M/M/c and asking P(N >= c).
#    The stationary pmf of an M/M/c is known in closed form, so we sample from it.
# ---------------------------------------------------------------------------
@njit(cache=True)
def prob_all_busy_cpu(u: np.ndarray, pmf_cdf: np.ndarray, c: int) -> float:
    """Estimate P(N >= c) by inverse-transform sampling the M/M/c stationary pmf.

    ``u`` is a uniform[0,1) array; ``pmf_cdf`` is the cumulative stationary distribution
    of the number-in-system N (index = state). We invert each u against the CDF and
    count how often the sampled state is >= c (all servers busy).
    """
    busy = 0
    n = u.shape[0]
    m = pmf_cdf.shape[0]
    for i in range(n):
        ui = u[i]
        # linear inverse-CDF search (states are few; clarity over speed)
        state = m - 1
        for k in range(m):
            if ui <= pmf_cdf[k]:
                state = k
                break
        if state >= c:
            busy += 1
    return busy / n


def mmc_stationary_cdf(lam: float, mu: float, c: int, max_n: int = 200) -> np.ndarray:
    """Closed-form stationary pmf of the number-in-system N of a stable M/M/c, as a CDF."""
    a = lam / mu                       # offered load (Erlangs); per-server utilisation rho = a/c (< 1 stable)
    # un-normalised stationary probabilities p_n
    p = np.zeros(max_n + 1)
    p[0] = 1.0
    for n in range(1, max_n + 1):
        if n <= c:
            p[n] = p[n - 1] * a / n
        else:
            p[n] = p[n - 1] * a / c
    p /= p.sum()                       # normalise
    return np.cumsum(p)


def erlang_c_prob_wait(lam: float, mu: float, c: int) -> float:
    """Closed-form Erlang-C P(wait) = P(N >= c) — the analytic reference for check 2."""
    a = lam / mu
    rho = a / c
    sum_terms = sum(a ** n / math.factorial(n) for n in range(c))
    last = (a ** c / math.factorial(c)) * (1.0 / (1.0 - rho))
    return last / (sum_terms + last)


# ---------------------------------------------------------------------------
# 3. @cuda.jit GPU Monte-Carlo with per-thread xoroshiro128p RNG.
#    Each thread throws `darts_per_thread` darts using its OWN RNG stream and writes
#    its local inside-count. The host averages the per-thread fractions.
# ---------------------------------------------------------------------------
@cuda.jit
def pi_gpu_kernel(rng_states, darts_per_thread, out_counts):  # pragma: no cover - GPU only
    tid = cuda.grid(1)
    if tid >= out_counts.shape[0]:
        return
    inside = 0
    for _ in range(darts_per_thread):
        x = xoroshiro128p_uniform_float32(rng_states, tid)
        y = xoroshiro128p_uniform_float32(rng_states, tid)
        if x * x + y * y <= 1.0:
            inside += 1
    out_counts[tid] = inside


def pi_on_gpu(n_threads: int, darts_per_thread: int, seed: int) -> float:
    """Drive the CUDA kernel: one independent xoroshiro stream per thread."""
    rng_states = create_xoroshiro128p_states(n_threads, seed=seed)
    out = cuda.device_array(n_threads, dtype=np.int64)
    threads_per_block = 128
    blocks = (n_threads + threads_per_block - 1) // threads_per_block
    pi_gpu_kernel[blocks, threads_per_block](rng_states, darts_per_thread, out)
    counts = out.copy_to_host()
    total = int(counts.sum())
    return 4.0 * total / (n_threads * darts_per_thread)


# --- CPU fallback for the GPU section --------------------------------------
# numba.cuda.random's xoroshiro128p_uniform_float32 is a *device function*: it can only
# be called from inside Numba-compiled code, never from plain Python. It also needs the
# states as a host NumPy structured array (we .copy_to_host() the states first, since
# create_xoroshiro128p_states returns a DeviceNDArray even with no physical GPU). So the
# no-GPU fallback wraps the device function in an @njit kernel that walks the SAME states
# the GPU path would have used. This guarantees the fallback uses the identical RNG, not a
# different one — the whole point of the exhibit is that the arithmetic is the same on
# both targets.
@njit(cache=True)
def pi_cpu_xoroshiro(rng_states, n_streams: int, darts_per_stream: int) -> int:
    """Count darts inside the quarter-circle across all streams, using xoroshiro128p."""
    inside = 0
    for s in range(n_streams):
        for _ in range(darts_per_stream):
            x = xoroshiro128p_uniform_float32(rng_states, s)
            y = xoroshiro128p_uniform_float32(rng_states, s)
            if x * x + y * y <= 1.0:
                inside += 1
    return inside


def main() -> None:
    rng = np.random.default_rng(SEED)   # the ONE host RNG -> deterministic CPU draws

    print("Numba JIT Monte-Carlo demo (CAOS_SIMLAB / S10 GPU exhibit)")
    print(f"  numba target check : cuda.is_available() = {cuda.is_available()}")
    print()

    # --- 1. CPU @njit: estimate pi ---------------------------------------
    xs = rng.random(N_DARTS, dtype=np.float64)
    ys = rng.random(N_DARTS, dtype=np.float64)
    pi_est = pi_cpu(xs, ys)
    print("1) CPU @njit  - estimate pi by dart throwing")
    print(f"     darts          : {N_DARTS:,}")
    print(f"     pi (estimate)  : {pi_est:.6f}   true pi: {math.pi:.6f}   "
          f"abs err: {abs(pi_est - math.pi):.2e}")
    print()

    # --- 2. CPU @njit: queueing statistic vs Erlang-C --------------------
    cdf = mmc_stationary_cdf(LAM, MU, C)
    u = rng.random(N_QUEUE_SAMPLES, dtype=np.float64)
    p_busy_mc = prob_all_busy_cpu(u, cdf, C)
    p_busy_th = erlang_c_prob_wait(LAM, MU, C)
    print("2) CPU @njit  - M/M/c P(all servers busy) = Erlang-C P(wait)")
    print(f"     queue          : lambda={LAM}, mu={MU}, c={C}  (rho={LAM/(C*MU):.3f})")
    print(f"     P(wait) MC     : {p_busy_mc:.6f}   theory(Erlang-C): {p_busy_th:.6f}   "
          f"abs err: {abs(p_busy_mc - p_busy_th):.2e}")
    print()

    # --- 3. GPU @cuda.jit with xoroshiro128p, or CPU fallback ------------
    print("3) GPU @cuda.jit - estimate pi, one xoroshiro128p stream per thread")
    if cuda.is_available():
        n_threads = 4096
        darts_per_thread = 50_000
        pi_gpu = pi_on_gpu(n_threads, darts_per_thread, seed=SEED)
        print(f"     device         : {cuda.get_current_device().name.decode()}")
        print(f"     threads        : {n_threads:,} x {darts_per_thread:,} darts "
              f"= {n_threads * darts_per_thread:,} total")
        print(f"     pi (GPU)       : {pi_gpu:.6f}   true pi: {math.pi:.6f}   "
              f"abs err: {abs(pi_gpu - math.pi):.2e}")
    else:
        # No CUDA device here. We still produce the GPU-section answer by running the
        # IDENTICAL xoroshiro128p estimator on the CPU: numba.cuda.random's
        # xoroshiro128p_uniform_float32 also has a CPU implementation, so the fallback
        # uses the SAME RNG, not a different one.
        print("     no CUDA device detected -> CPU fallback using the SAME xoroshiro128p RNG")
        n_streams = 256
        darts_per_stream = 100_000
        states = create_xoroshiro128p_states(n_streams, seed=SEED).copy_to_host()
        total_inside = pi_cpu_xoroshiro(states, n_streams, darts_per_stream)
        total = n_streams * darts_per_stream
        pi_fb = 4.0 * total_inside / total
        print(f"     streams        : {n_streams:,} x {darts_per_stream:,} darts "
              f"= {total:,} total")
        print(f"     pi (CPU xoro)  : {pi_fb:.6f}   true pi: {math.pi:.6f}   "
              f"abs err: {abs(pi_fb - math.pi):.2e}")
    print()
    print("Honest verdict (S10): the GPU's win is running thousands of these independent")
    print("streams at once. It does NOT speed up a small branch-heavy event loop (DES),")
    print("where it is measurably slower. See docs/frameworks/14_numba/03_applying.md.")


if __name__ == "__main__":
    main()
