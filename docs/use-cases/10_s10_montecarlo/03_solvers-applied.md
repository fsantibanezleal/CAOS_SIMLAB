# 03 — Solvers applied

> Reading order: file 3 of 4 in the [S10 use-case node](../10_s10_montecarlo.md).
> Previous: [02 — Formalization](./02_formalization.md) · Next:
> [04 — Results & reading](./04_results-and-reading.md).

S10 is solved by **two dedicated tools in series**: [joblib](../../frameworks/12_joblib.md) *generates*
the replication sample (fans the independent runs across CPU cores), and
[`scipy.stats`](../../frameworks/13_scipy-stats.md) *reduces* that sample to an honest confidence interval.
The model itself is plain NumPy + a heap. The lab deliberately builds the scenario on the very tools it
documents rather than a hand-rolled loop.

## joblib — the CPU replication driver

**What it does here.** The N replications are embarrassingly parallel — independent, seeded, and each only
returns one float (`Wq^(r)`). joblib turns "run N seeded replications and collect their KPIs" into one
line with order-preserving result collection.

**The concrete API** (from `run()` in
[`s10_montecarlo.py`](../../../simlab/scenarios/s10_montecarlo.py)):

```python
from joblib import Parallel, delayed

per_run = Parallel(n_jobs=-1, backend="threading")(
    delayed(mmc_mean_wait)(lam, mu, c, n, int(seed) + r) for r in range(reps)
)
wqs = np.asarray(per_run, dtype=float)
```

- `delayed(mmc_mean_wait)(…)` packages each replication as a deferred call; the generator builds the list
  of N deferred calls.
- `Parallel(n_jobs=-1, …)(…)` executes them across all cores and returns results **in submission order**,
  so `per_run[r]` is always replication `r` regardless of finish order.
- The worker function takes a **seed**, not a pre-built `Generator`, so it is self-contained and picklable
  (`mmc_mean_wait` builds its own `np.random.default_rng(seed)` inside). Each replication `r` is seeded
  `seed + r`, so the parallel result equals the serial result **byte-for-byte** on any worker count or
  finish order — determinism is independent of the backend.

**Why `backend="threading"` (not the default loky process pool).** Each replication is NumPy-heavy
(`rng.exponential` / `cumsum` release the GIL), so threads parallelise the real work without the loky
process-pool cold-start tax (~5 s) that would push the first run over the 3 s live gate. Threading is also
the only joblib backend that works under Pyodide/WASM (no fork/subprocess), so the same code path serves
the live lane.

**Why this tool.** The honest deliverable of a stochastic simulation is never one run — it is a *mean with
a confidence interval* over many seeded replications, and that standard error only shrinks like `1/√n`.
joblib is the lab's v1 default for exactly this "run K independent seeded runs and aggregate" pattern: one
line of parallelism, results stay in order, bit-reproducible across worker counts. A GPU is intentionally
out of scope here — a many-replication study of a cheap model is embarrassingly parallel and maps cleanly
onto cores; the GPU lane ([Numba](../../frameworks/14_numba.md) / [CuPy](../../frameworks/15_cupy.md))
only earns its transfer/launch overhead far above the crossover, and the discrete-event model itself never
goes on the GPU.

→ Framework wiki: [12 — joblib](../../frameworks/12_joblib.md) (install · usage · applying · runnable
example).

## `scipy.stats` — the confidence-interval layer

**What it does here.** It turns the replication sample into the interval — both the running band and the
headline CI — using the real statistics API rather than hand-typed constants.

**The concrete API** (from the same `run()`):

```python
from scipy import stats

Z95 = float(stats.norm.ppf(0.975))          # exact 95% two-sided normal critical value (not 1.96)

# running band, per replication count k:
half = Z95 * sd / np.sqrt(k)                 # sd = np.std(wqs[:k], ddof=1)

# headline CI via the canonical SciPy calls:
sem = float(stats.sem(wqs))                            # s/√N, ddof=1
ci_lo, ci_hi = stats.norm.interval(0.95, loc=final_mean, scale=sem)
final_half = (ci_hi - ci_lo) / 2                       # == h_N
```

- `stats.norm.ppf(0.975)` supplies the **exact** critical value `≈ 1.959964` for the running band — the
  lab uses the statistics framework it teaches instead of a rounded 1.96.
- `stats.sem(wqs)` is the standard error of the mean (`s/√N`, ddof=1); `stats.norm.interval(0.95, …)`
  applies the two-sided normal interval around `final_mean`. The headline half-width equals the final
  point of the running band, but expressed through the canonical SciPy calls.

**Why this tool.** `scipy.stats` is the statistics layer of a replication study — it decides whether the
headline number is defensible or a precise lie. It is a pure deterministic function of the sample joblib
produced, so it adds no nondeterminism. (The lab's house default for *small* `N` is the Student-t
interval; S10 ships the normal-approximation interval, valid by the CLT for the moderate `N ∈ {50…500}`
the variants use — see [01 — Assumptions](./01_assumptions.md).)

→ Framework wiki: [13 — `scipy.stats`](../../frameworks/13_scipy-stats.md) (install · usage · applying ·
runnable example).

## The oracle (no solver — closed form)

The comparison line is **not** simulated: `erlang_c_mmc(λ, μ, c)` in
[`s01_queue.py`](../../../simlab/scenarios/s01_queue.py) returns the analytic `Wq` directly (or `None`
when `ρ ≥ 1`). It is the ground truth the Monte-Carlo estimate is judged against.

## Live vs precompute lane for this scenario

| Lane | What runs | How the tools appear |
|---|---|---|
| **Offline trace generation** (committed gallery) | the offline `.venv` runs `joblib + scipy` to generate the seed-42 CI sweep; the result is committed as a deterministic chart trace for instant first paint | full native joblib (`threading`) + full `scipy.stats` |
| **Live** (Pyodide, in-browser) | the **same** joblib + scipy engines run on demand (S10 is a `live` scenario) | `joblib` + `scipy` are heavy native deps, so they are **imported lazily inside `run()`** (never at module import) — the registry import and the whole live lane work even before they load; the `threading` backend is the only one that works under WASM, so the browser runs the real engines, not a fallback |

S10's lane is **live**; the committed seed-42 trace is only the first-paint replay, not a separate
precompute lane — the same joblib + scipy engines re-run in the browser on demand.

The module-level scenario definition (the `Scenario` subclass, `variants()`, `param_specs`) needs **zero**
heavy deps (NumPy only, which exists in the live worker). Because the seed plan and SciPy reduction are
deterministic, **replay is truth**: the committed seed-42 trace and a fresh live run on seed 42 produce
the same numbers. `wheels = ["numpy", "joblib", "scipy"]` declares what the live lane loads.

See [architecture.md](../../architecture.md) for the two-lane deterministic-replay design and the
[4-gate](../../architecture/03_the-gate.md) the `threading` backend is tuned against.
