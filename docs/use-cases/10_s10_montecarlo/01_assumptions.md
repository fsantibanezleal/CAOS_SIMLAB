# 01 — Assumptions & scope

> Reading order: this is file 1 of 4 in the
> [S10 use-case node](../10_s10_montecarlo.md). Next:
> [02 — Formalization](./02_formalization.md).

## The canonical instance

S10 is not a new physical system — it is an **output-analysis study of the S01 M/M/c queue**. The
"problem" is the methodological one: *how much can I trust a single simulation run, and how many seeded
replications buy me an honest answer?* The canonical instance fixes the queue and sweeps the study knobs.

The defaults that ship in the scenario (`param_specs` in
[`s10_montecarlo.py`](../../../simlab/scenarios/s10_montecarlo.py)):

| Parameter | Code key | Default | Range | Meaning |
|---|---|---|---|---|
| Arrival rate λ | `lam` | 2.0 | 0.1 – 10.0 | Poisson arrivals into the queue |
| Service rate μ | `mu` | 1.0 | 0.1 – 10.0 | per-server exponential service rate |
| Servers c | `c` | 3 | 1 – 10 | size of the server pool |
| Customers per run | `n_customers` | 600 | 100 – 5000 | length of one replication |
| Replications | `n_reps` | 200 | 20 – 1000 | how many seeded runs are averaged |

With `μ=1, c=3` the utilization is `ρ = λ/(c·μ) = λ/3`, so the load axis is driven entirely by λ. The
shipped variants hold `μ=1`, `c=3`, `n_customers=600` fixed and move only λ (the load) and `n_reps` (the
replication budget) — see [04 — Results & reading](./04_results-and-reading.md).

The committed deterministic trace uses **seed 42**; each replication `r` then draws from seed `42 + r`.

## What IS modeled

- **A full M/M/c replication.** Each replication actually simulates `n` customers: it samples
  inter-arrival times `~ Exp(λ)` and service times `~ Exp(μ)`, assigns every customer to the
  earliest-free server (an O(n log c) heap of server-free times), and averages each customer's queue wait
  to produce one per-run statistic `Wq^(r)`. There is no shortcut — the randomness is real and seeded.
- **The estimator and its uncertainty as a function of `k`.** The running mean `W̄_k`, the running sample
  standard deviation `s_k` (ddof=1), and the running 95% CI half-width `h_k` are recomputed at every
  replication count `k = 1 … N`, so the chart shows the estimator *converging* rather than a single final
  number.
- **The closed-form oracle.** The Erlang-C `Wq` and the utilization `ρ` are computed analytically
  (`erlang_c_mmc` in [`s01_queue.py`](../../../simlab/scenarios/s01_queue.py)) as the ground truth the
  Monte-Carlo estimate is judged against.
- **The per-run distribution.** A histogram (18 bins) of the `Wq^(r)` sample — its *width is* the variance
  that dilates the CI.
- **The finite-run-bias failure mode.** Because each replication starts empty and serves only `n=600`
  customers, the full-run average carries a start-up (initialisation) transient. The study surfaces this
  honestly rather than hiding it (see below).

## What is NOT modeled (the honesty boundary)

- **No warm-up / initialisation-bias removal.** Each `Wq^(r)` is the average over the *entire* run,
  transient included. At light-to-moderate load that bias is negligible and `W̄_N` lands on Erlang-C; at
  high load (`ρ≈0.9`, ~600 customers) it is large (~16% low), so the CI converges tightly around a
  **biased** estimate and the Erlang-C line falls *outside* the band. This is a deliberate teaching point:
  the CI measures the *precision* of the estimator, not its *accuracy*.
- **No Student-t or bootstrap interval.** The CI is the **normal-approximation** interval only (the
  asymptotic-normality / CLT regime). The half-width assumes normality of the *mean* `W̄_k` for moderate
  `N`, not normality of the individual `Wq^(r)`.
- **No experiment-budget optimisation.** The trade-off between run length `n` and replication count `N`
  (the budget-allocation question) is out of scope — the variants sweep them by hand, they are not solved.
- **No variance-reduction techniques** (common random numbers across configs, antithetic variates,
  control variates) — replications are plain i.i.d. seeded draws.
- **The unstable regime is shown, not estimated.** When `ρ ≥ 1` (i.e. `λ ≥ c·μ`) there is no steady
  state: Erlang-C returns `Wq = None` (no theory line, by design — see `erlang_c_mmc`) and the sample mean
  simply grows with `n` instead of converging.

## Determinism & lane

- **Bit-for-bit reproducible.** The seed plan `seed + r` is fixed and each replication builds its own RNG
  inside the worker (`np.random.default_rng(seed)`), so the parallel result equals the serial result on
  any worker count or finish order. `scipy.stats` is then a pure deterministic function of that sample.
- **Live.** The model is pure-Python and fully seeded, and its wheel closure (`numpy`, `joblib`, `scipy`)
  is in `LIVE_WHEELS`, so the manifest gate classifies S10 as `lane: "live"` — it runs in the browser via
  Pyodide. The live path is **not** a hand-rolled NumPy fallback: it runs the same dedicated engines, real
  `joblib.Parallel(backend="threading")` (the only joblib backend that works under WASM) over `scipy.stats`
  for the CI math, both imported lazily inside `run()` so the registry import stays light. The committed
  seed-42 trace is also replayed for the deterministic gallery (first paint while Pyodide warms up); because
  the run is a pure function of `(params, seed)`, the live result is byte-equal to that committed trace.

See [03 — Solvers applied](./03_solvers-applied.md) for how the two lanes use the dedicated tools.
