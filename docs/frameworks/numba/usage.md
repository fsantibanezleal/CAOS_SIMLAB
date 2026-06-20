# Numba — usage

This is a hands-on guide to the two pieces of Numba that CAOS_SIMLAB uses: the **CPU JIT**
(`@njit`) and the **CUDA target** (`@cuda.jit` with the `xoroshiro128p` RNG). The worked
example is [`example.py`](./example.py) in this folder; its real captured output is at the
bottom.

## 1. Key concepts

### `@njit` — compile a Python function to native code
`@njit` ("no-python JIT") compiles a function the first time it is called, using LLVM, into
machine code with no Python interpreter in the hot loop. Inside an `@njit` function you may
use a numeric subset of Python: scalars, `for`/`while`, `if`, math, and NumPy arrays/ufuncs.
You may **not** use arbitrary Python objects, `dict` of mixed types, most of the standard
library, or I/O. The payoff is C-like speed on plain Python loops — exactly the shape of a
Monte-Carlo inner loop (`for i in range(N): if x*x+y*y <= 1: inside += 1`).

Useful options:
- `@njit(cache=True)` — persist the compiled artifact between *process* runs (skips the
  first-call compile after the first ever run).
- `@njit(fastmath=True)` — allow reassociation / relaxed IEEE for more speed (safe for
  Monte-Carlo sums where the last ULP does not matter).
- `@njit(parallel=True)` + `numba.prange` — auto-parallelise a loop across CPU cores.

### `@cuda.jit` — write a CUDA kernel in Python
A function decorated with `@cuda.jit` becomes a **GPU kernel**: it runs once per GPU thread.
Inside it you get `cuda.grid(1)` (the global thread index) and you index your own slice of
the work. You launch it with a `kernel[blocks, threads_per_block](args...)` call. Arrays are
device arrays (`cuda.device_array(...)`, or NumPy arrays auto-copied). The kernel returns
nothing; it writes results into an output array you copy back with `.copy_to_host()`.

### `xoroshiro128p` — independent RNG streams, one per thread
Parallel Monte-Carlo needs *independent* random streams or the "replications" are secretly
correlated and the confidence interval is a lie. `numba.cuda.random` provides exactly this:

- `create_xoroshiro128p_states(n, seed=...)` allocates `n` RNG states from one seed, each a
  well-separated sub-stream of the xoroshiro128+ generator (period 2**128 − 1; passes
  TestU01 BigCrush).
- `xoroshiro128p_uniform_float32(states, tid)` draws the next uniform[0,1) for thread `tid`.

This is a **device function**: callable only from inside Numba-compiled code (`@cuda.jit`
or `@njit`), never from plain Python. (That constraint is the one gotcha the example's CPU
fallback has to work around — see below.)

### `cuda.is_available()` — the guard
Returns `True` only when an NVIDIA GPU + working CUDA driver are present. Every GPU path in
the lab is wrapped in `if cuda.is_available(): ... else: <CPU fallback>` so the repo runs
for GPU-less learners and on the GPU-less production host.

## 2. The minimal example, walked through

[`example.py`](./example.py) has three sections, all driven by one fixed seed (42) so the
output is deterministic.

**Section 1 — `@njit` CPU estimate of pi.** We pre-draw two seeded NumPy arrays of
uniform[0,1) coordinates (`rng = np.random.default_rng(42)`), then pass them to the
JIT-compiled `pi_cpu(xs, ys)`. That function is a plain scalar loop — the kind of code
Python is normally slow at — counting darts inside the quarter circle and returning
`4 * inside / N`. Drawing the randomness *outside* the kernel keeps the kernel a pure,
deterministic function of its inputs.

**Section 2 — `@njit` CPU estimate of a queueing statistic.** To show Numba on a real
simulation quantity rather than a geometry toy, we Monte-Carlo the M/M/c **probability that
all servers are busy** = the Erlang-C P(wait). We build the closed-form stationary
distribution of the number-in-system in plain Python (`mmc_stationary_cdf`), then the
`@njit` function `prob_all_busy_cpu` does inverse-transform sampling against that CDF and
counts how often the sampled state is ≥ c. We print it next to the analytic Erlang-C value
`erlang_c_prob_wait` — a simulation that does not converge to a known answer when one exists
is a bug, not a result.

**Section 3 — GPU kernel, or CPU fallback.** Guarded by `cuda.is_available()`:
- *If a GPU is present:* `create_xoroshiro128p_states(n_threads, seed=42)` gives each thread
  its own stream; the `@cuda.jit` kernel `pi_gpu_kernel` throws `darts_per_thread` darts per
  thread using `xoroshiro128p_uniform_float32`; the host sums the per-thread counts.
- *If no GPU (this machine):* we run the **same** estimator on the CPU using the **same**
  xoroshiro128p RNG. Because `xoroshiro128p_uniform_float32` is a device function, the
  fallback wraps it in an `@njit` kernel (`pi_cpu_xoroshiro`) and passes the states as a
  host NumPy array (we call `.copy_to_host()` first, since `create_xoroshiro128p_states`
  returns a `DeviceNDArray` even with no physical GPU). This is the subtle part: the
  fallback is the identical RNG, not a different one — the whole point is that the arithmetic
  matches across targets.

Run it from the repo root:

```
.venv/Scripts/python.exe docs/frameworks/numba/example.py
```

## 3. Verified output

Captured by actually running the command above in this repo's `.venv` (Numba 0.65.1,
Python 3.13, NumPy 2.4.6). This machine has **no CUDA device**, so section 3 takes the CPU
fallback — and still prints a result, exactly as the graceful-fallback rule requires. The
numbers are identical across repeated runs (deterministic):

```
Numba JIT Monte-Carlo demo (CAOS_SIMLAB / S10 GPU exhibit)
  numba target check : cuda.is_available() = False

1) CPU @njit  - estimate pi by dart throwing
     darts          : 20,000,000
     pi (estimate)  : 3.141209   true pi: 3.141593   abs err: 3.84e-04

2) CPU @njit  - M/M/c P(all servers busy) = Erlang-C P(wait)
     queue          : lambda=2.4, mu=1.0, c=3  (rho=0.800)
     P(wait) MC     : 0.646893   theory(Erlang-C): 0.647191   abs err: 2.98e-04

3) GPU @cuda.jit - estimate pi, one xoroshiro128p stream per thread
     no CUDA device detected -> CPU fallback using the SAME xoroshiro128p RNG
     streams        : 256 x 100,000 darts = 25,600,000 total
     pi (CPU xoro)  : 3.141904   true pi: 3.141593   abs err: 3.11e-04

Honest verdict (S10): the GPU's win is running thousands of these independent
streams at once. It does NOT speed up a small branch-heavy event loop (DES),
where it is measurably slower. See docs/frameworks/numba/applying.md.
```

What to read from this:
- Both `@njit` Monte-Carlo estimates land on their analytic targets to ~3–4 decimal places
  (pi to 3.8e-4, Erlang-C P(wait) to 3.0e-4) — the JIT'd loops are correct.
- Section 3 demonstrates the **CUDA RNG** (`create_xoroshiro128p_states` +
  `xoroshiro128p_uniform_float32`) running here on the CPU fallback path, producing a valid
  pi estimate (3.1e-4). On a CUDA machine the identical kernel runs on the GPU instead.

### Honest limitation on this machine
`cuda.is_available()` is `False` here, so the **on-device GPU kernel was not executed** in
this capture — only its CPU-fallback twin. The GPU branch (`pi_gpu_kernel` / `pi_on_gpu`) is
present and compiles for the CUDA target, but exercising it on hardware requires the local
RTX 4070 Laptop. This is by design: the lab's contract is that the GPU lane is optional and
the repo must run end-to-end without a GPU. The CPU fallback proves the RNG and the
estimator; the GPU only changes *how fast* thousands of these streams run, not *what* they
compute.
