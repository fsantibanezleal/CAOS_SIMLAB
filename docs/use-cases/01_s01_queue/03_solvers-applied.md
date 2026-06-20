# S01 · Solvers applied — SimPy + Ciw + Erlang-C

> How scenario **S01** is actually solved: the dedicated tools, the concrete API each one uses, why each
> is the right pick, and the live-vs-precompute lane. Grounded in
> [`simlab/scenarios/s01_queue.py`](../../../simlab/scenarios/s01_queue.py) and the framework wiki.

S01 uses **three** engines in concert — one simulator drives the animation, a closed form is the oracle,
and a **second, independent** simulator confirms the oracle is being hit. That triangulation is the whole
point: "the sim converges to theory" is made *real* rather than asserted.

---

## 1. SimPy — the live, animatable simulator (primary engine)

**Tool:** [SimPy](../../frameworks/01_simpy.md) (MIT, `4.1.2`), the lab's primary DES engine —
process-interaction style, pure Python, zero third-party deps.

**How it is applied (concrete API):**

- `env = simpy.Environment()` — one simulated clock.
- `servers = simpy.Resource(env, capacity=c)` — the pool of `c` identical servers; the FCFS queue is the
  `Resource`'s built-in request queue.
- Each customer is a generator process: inside `with servers.request() as req:` it does
  `yield req` (join the queue / acquire a free server), records the wait `env.now − t_arr`, then
  `yield env.timeout(service[cid])` to hold the server for its exponential service time; leaving the
  `with` releases the server so the next waiting customer starts.
- A `source()` process emits the `n` customers spaced by the pre-drawn inter-arrival gaps
  (`yield env.timeout(inter[cid])` then `env.process(customer(cid))`).
- `env.run()` advances the future-event list to exhaustion.
- Every transition is appended to the lab's `Trace` via `tr.add_event(t, kind, id=...)` with
  `kind ∈ {arrival, start, depart}` — this event timeline is exactly **what the front end animates**, and
  its means become the headline KPIs `Wq_sim`, `W_sim`, `Lq_little`.

**Why SimPy:** it is the de-facto Python DES standard and the most teachable (the process reads like the
customer's life-story); crucially it is **pure Python so it runs inside Pyodide in a Web Worker**, which
is what makes S01 genuinely *live* — move a slider, SimPy re-runs in the browser, the queue-network
re-animates. The full rationale and API tour: [SimPy framework wiki](../../frameworks/01_simpy.md).

---

## 2. Erlang-C — the closed-form oracle

**Tool:** an exact closed form computed in-repo by `erlang_c_mmc(λ, μ, c)` (no external dependency — it is
the queueing-theory result the [Ciw chapter](../../frameworks/02_ciw.md) teaches).

**How it is applied:** it returns `{rho, p_wait, Wq, Lq, stable}` — the exact steady-state `P(wait)`,
mean wait `Wq` and mean queue length `Lq` for the M/M/c system (formulae in
[02 · Formalization §6](./02_formalization.md#6-the-erlang-c-closed-form-the-analytic-oracle)). For
`ρ ≥ 1` it returns nulls (`stable: false`) — a teachable failure mode kept as valid JSON.

**Why a closed form:** the M/M/c family is one of the rare queueing models with an **exact** answer, so
the simulator can be checked against ground truth rather than against another estimate. Pairing a
simulation with an exact result is the most credible validation a learner can witness.

---

## 3. Ciw — the independent second-engine cross-check

**Tool:** [Ciw](../../frameworks/02_ciw.md) (MIT, `3.2.7`), a dedicated **queueing-network** DES built on
the event-scheduling worldview — used here as a *second, independent* simulator, not as the live engine.

**How it is applied (concrete API), in `ciw_validate_mmc` / `_ciw_replication_wq`:**

- `network = ciw.create_network(arrival_distributions=[ciw.dists.Exponential(rate=λ)],
  service_distributions=[ciw.dists.Exponential(rate=μ)], number_of_servers=[c])` — declares the M/M/c
  node directly.
- `ciw.seed(s)` then `sim = ciw.Simulation(network); sim.simulate_until_max_time(max_time)`.
- `sim.get_all_records()` is filtered to post-warm-up customers (`arrival_date ≥ 200.0`) and the mean
  `waiting_time` is the per-replication `Wq`.
- This is repeated for **`CIW_REPS = 10`** seeded replications (replication `k` of a run with seed `s`
  uses `ciw.seed(s · 1000 + k)`), each run long enough to clear ~`CIW_TARGET_ARRIVALS = 8000`
  post-warm-up arrivals (`max_time = min(200 + 8000/λ, 6000)` — capped so the live gate still passes).
- The study reports the across-replication mean `Wq_ciw`, a normal **95% half-CI** `ci95_half = 1.96·sd/√reps`,
  the **relative error** vs the Erlang-C `Wq` (`rel_err`), and `theory_in_ci` (does the closed form fall
  inside the CI band?). It is recorded under the nested `analytic["ciw_xcheck"]` key so the frontend
  schema is unchanged.
- For an unstable system (`theory_wq is None`) the study is **skipped** (`applicable: false`) — there is
  no finite steady-state `Wq` to converge to.

**Why Ciw (and why a second engine at all):** the lab's claim is "an *independent* simulator lands on the
same theory we teach." A single simulator agreeing with its own author's closed form is weaker evidence;
two engines (SimPy KPIs + Ciw cross-check) both hitting Erlang-C is the strong "does my sim match theory?"
move. Ciw is the dedicated tool for it because it models a queueing network **declaratively** and the
classical queues it simulates have closed forms. Full rationale and API:
[Ciw framework wiki](../../frameworks/02_ciw.md).

> **Note on the lane for Ciw.** The Ciw framework chapter describes Ciw's *general* role as a
> precompute-lane tool. In **S01 specifically**, the Ciw cross-check is pure Python and is run **inside**
> the scenario's `run()` (it is small by design — 10 short, capped replications), so it travels with the
> SimPy run and stays within the live gate. The authoritative lane for S01 is the one measured below.

---

## 4. Live vs precompute lane (this scenario)

S01 is a **live** scenario. The lab's [4-gate](../../architecture/03_the-gate.md)
(`classify_lane`) admits a scenario to the live Pyodide lane only when **all** hold: pure-Python AND
`run < 3000 ms` AND `trace < 1 MB` AND its wheel closure ⊆ the live-worker set. S01 clears every gate:

- **Pure-Python:** yes — SimPy, Ciw and NumPy are all pure-Python / Pyodide-loadable
  (`wheels = ["simpy", "ciw", "numpy"]`, all in `LIVE_WHEELS`).
- **Run time:** every shipped variant runs well under the 3 s gate (measured `run_ms` ranges ≈ **2.7 ms**
  for the unstable variant up to ≈ **1032 ms** for the ten-server pool — see the manifest and
  [04 · Results](./04_results-and-reading.md)). The bulk of each *stable* variant's time is the Ciw
  cross-check (10 seeded replications), not the SimPy animation; the unstable variant is fast because that
  Ciw study is **skipped** (`applicable: false` — no finite theory to converge to), **not** because the
  SimPy run short-circuits — the SimPy simulation always runs all 300 customers to completion.
- **Trace size:** ≈ **35 KB** per variant, far below the 1 MB gate.

So the published lane is `lane: "live"`. In the app, the SimPy run (and its in-trace Ciw cross-check)
executes **live in a Web Worker** under Pyodide; nothing about S01 is pre-baked except the committed
seeded artifacts the manifest references, which exist so the page renders instantly before the worker
warms up. The gate is **structural** (measured, recorded in the manifest), so S01 can never silently
ship as "live" if a future edit pushed it over a threshold.

See the lane mechanics in the [live-lane (Pyodide) guide](../../guides/02_live-lane-pyodide.md) and the
two-lane design in [architecture.md](../../architecture.md).

---

*Next:* [04 · Results & reading](./04_results-and-reading.md) — the variants, what the KPIs show, how to
read the viz.
