# 12 · joblib — usage

[← back to the joblib wiki node](../12_joblib.md) · [← 01 Installation](./01_installation.md)

joblib gives you parallelism with essentially one idea: build a **list of deferred calls**, hand it to a
**`Parallel`** executor, and get back a list of results in the *same order you submitted them* — regardless
of which worker finished first. For Monte-Carlo replications that order-preservation plus per-call seeding
is exactly what makes a parallel study reproducible.

## Key API and concepts

### `delayed(func)(*args, **kwargs)` — capture a call without running it

`delayed` wraps a function so that calling it records `(func, args, kwargs)` as a *task* instead of
executing immediately. You build a generator/list of these tasks:

```python
from joblib import delayed
tasks = (delayed(replication)(base_seed + r) for r in range(K))
```

### `Parallel(n_jobs=..., backend=...)(tasks)` — run them in parallel

`Parallel` is a callable executor. You call it with the iterable of `delayed` tasks; it dispatches them to
workers and returns a **list of results in submission order**.

```python
from joblib import Parallel
results = Parallel(n_jobs=-1)(tasks)   # results[r] is the result of task r
```

Key parameters:

| Parameter | Meaning | Typical value here |
|---|---|---|
| `n_jobs` | number of workers; `-1` = all cores, `1` = serial (no subprocess), `2` = two workers | `-1` for the sweep; `1` to debug |
| `backend` | `"loky"` (default, separate processes — true CPU parallelism, bypasses the GIL), `"threading"` (shared-memory threads — only helps for releasing-GIL / I/O work), `"multiprocessing"` (legacy fork pool) | default `"loky"` for CPU-bound replications |
| `verbose` | progress messages to stderr (higher = more) | `0` in artifacts, `>0` when watching a long sweep |
| `batch_size` | how many tasks each worker grabs at once; `"auto"` adapts | `"auto"` |
| `return_as` | `"list"` (default) or `"generator"` to stream results as they arrive | `"list"` for CI aggregation |

### The two concepts that make it *correct* for Monte-Carlo

1. **Order preservation.** `results[r]` always corresponds to task `r`, no matter the finishing order. So
   if task `r` uses `seed = base_seed + r`, the mapping seed→result is stable across runs and worker
   counts.
2. **Per-task seeding inside the worker.** Each replication must own an *independent* RNG stream. The lab's
   rule (one `np.random.default_rng(seed)` per run) is enforced by passing the *seed* into the task and
   building the generator inside the worker, so workers never share a global RNG. This is what guarantees
   the replications are genuinely i.i.d. and that the study is reproducible.

> Why processes (`loky`), not threads, for replications: our replication function is pure-Python CPU work
> (an event loop over customers), which is bound by Python's GIL. Threads would serialise on the GIL and
> give ~no speedup; separate processes each get their own interpreter and run truly in parallel. Use
> `backend="threading"` only when the inner work releases the GIL (e.g. heavy NumPy/BLAS) or is I/O-bound.

## Minimal runnable example, walked through

The runnable script is [`example.py`](./example.py). It is the S10 pattern in miniature: a cheap stochastic
function (one M/M/c replication), fanned across cores with joblib, aggregated into a 95% CI, with explicit
determinism checks.

Step by step:

1. **The cheap stochastic function — one replication.**
   `mmc_mean_wait(lam, mu, c, n, seed)` simulates a small M/M/c FCFS queue with the earliest-free-server
   method and returns the per-run mean wait. It takes a **seed** (not a pre-built generator) and constructs
   `np.random.default_rng(seed)` *inside* the function, so it is self-contained and picklable — joblib can
   ship it to worker processes. This mirrors `mmc_mean_wait` in the S10 scenario.

2. **Fan K seeded replications across cores.**
   `run_study(...)` builds `delayed(mmc_mean_wait)(lam, mu, c, n, base_seed + r)` for `r in range(K)` and
   runs them with `Parallel(n_jobs=n_jobs)`. The seed plan `base_seed + r` is exactly S10's
   `make_rng(seed + r)` scheme. Results come back in order, so `per_run[r]` is replication `r`.

3. **Aggregate a normal-approximation 95% CI.**
   With the K per-run KPIs in a NumPy array: `mean = per_run.mean()`, sample sd `per_run.std(ddof=1)` (the
   `n−1` divisor), and half-width `1.96 · s / √K`. The CI is `[mean − half, mean + half]`. This is the same
   formula S10 reports as `ci_halfwidth`.

4. **Show determinism three ways.**
   - Re-run the whole all-core study with the same `base_seed` → the mean is **bit-identical**.
   - Run with `n_jobs=1` (serial) vs `n_jobs=-1` (all cores) → **identical mean**, proving the worker count
     and finishing order don't affect the result.
   - Run with a *different* `base_seed` → a different mean, confirming it really is stochastic.
   - Finally, call a single replication twice with the same seed → identical value (the atomic unit is
     deterministic).

## Verified output

Captured by actually re-running from the repo root (joblib 1.5.3, numpy 2.4.6):

```bash
.venv/Scripts/python.exe docs/frameworks/12_joblib/example.py
```

```text
=== joblib CPU-parallel Monte-Carlo replications (S10 pattern) ===
model: M/M/c  lam=2.0 mu=1.0 c=3  customers/run n=600  rho=0.667
study: K=400 replications, base_seed=42
Erlang-C steady-state Wq (reference) = 0.4444

[n_jobs=-1, all cores]  mean Wq = 0.4346
                        95% CI  = [0.4167, 0.4526]  (half-width 0.0180)
                        theory inside CI? True
                        per-run spread: min=0.0825 max=1.3784

determinism (same base_seed, second all-core run):
  mean repeats exactly?      True  (0.4346337140 == 0.4346337140)
  1 worker == all workers?   True  (n_jobs=1 vs n_jobs=-1)
  different base_seed differs? True  (0.4346 vs 0.4434)

single replication seed=49 reproducible? True  (Wq=0.3554)
```

### Reading the output

- **The CI brackets the theory.** At ρ≈0.67 the 400-replication mean (`0.4346`) lands close to the
  closed-form Erlang-C value (`0.4444`), and the 95% CI `[0.4167, 0.4526]` **contains** it. This is the
  well-behaved load regime — exactly what the S10 audit found for `rep*_mod` variants (rel. error ~0.7%,
  theory inside CI). At high load (ρ≈0.9) a finite 600-customer run would instead show a transient bias that
  pulls the CI *below* theory — see [03 Applying](./03_applying.md) and the S10 docstring; that is a
  model/methodology lesson, not a joblib issue.
- **Determinism holds across worker counts.** `n_jobs=1` and `n_jobs=-1` give the **same** mean to the last
  digit. This is the whole reason the seed-per-task pattern matters: parallelism is an implementation detail,
  not a source of randomness. "Replay = truth" survives going parallel.
- **The per-run spread is huge** (`0.08` … `1.38` around a mean of `0.43`). One run tells you almost
  nothing; the value is in the *ensemble*. That is the Monte-Carlo lesson the lab teaches, and the reason a
  fast parallel replication driver is worth having.

## Common pitfalls (and the lab's answers)

- **Sharing one RNG across workers** silently correlates "independent" runs and collapses your effective
  sample size. → Pass a seed per task and build the generator inside the worker (as above).
- **Forgetting the `__main__` guard on Windows** causes an endless process-spawn loop with the `loky`
  backend. → Always guard the entry point (`example.py` does); see [01 Installation](./01_installation.md).
- **Using threads for pure-Python CPU work** gives ~no speedup (GIL). → Keep the default `loky` (process)
  backend for replications.
- **Tiny tasks, big overhead.** If each replication is microseconds, process dispatch overhead dominates
  and parallel can be *slower* than serial. → Parallelise when each task is at least milliseconds, or raise
  `batch_size` so workers grab many tasks at once.

---

**Next:** [03 — Applying it](./03_applying.md) — how to formalize the problem, which scenarios use joblib,
and when to pick it vs the alternatives.
