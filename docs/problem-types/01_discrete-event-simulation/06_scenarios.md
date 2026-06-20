# 06 · Scenarios — the optimize-then-simulate bridge & the scenario map

> Part of the [Discrete-Event Simulation guide](../01_discrete-event-simulation.md). This page connects
> the engines from [05 · The DES toolbox](./05_tools.md) to the lab's actual scenarios: the
> optimize-then-simulate pattern, where each DES runs (live vs precomputed), and the full scenario map.

## The optimize-then-simulate bridge

DES is the *evaluation* half of the lab's headline pattern. An optimizer (OR-Tools, PyVRP, CP-SAT, GLOP)
proposes a plan on **deterministic** inputs; a **SimPy** DES then runs that plan under **stochastic**
conditions and reports the *distribution* of real outcomes. The optimizer proposes; the simulator
disposes.

This is where DES forms the "simulate" leg of the hybrid scenarios:

- [**S07 (construction haul routing)**](../../use-cases/07_s07_haul.md) — a native route PLAN (NetworkX +
  OR-Tools CP-SAT, no WASM) is precomputed offline and committed as data; only the pure-Python **SimPy**
  replay runs live, mutating fleet sliders and re-selecting among the committed grade×wall plans under
  stochastic load/dump/delay to produce cycle-time distributions. The *DES leg* is pure SimPy.
- [**S11 (mine multi-destination haul)**](../../use-cases/11_s11_minehaul.md) — a GLOP LP allocation is
  simulated under uncertainty so the realised outcomes (not just the LP's paper optimum) are what gets
  reported.

S09 is *not* part of this optimize-then-simulate group — it carries **no** optimizer at all:

- [**S09 (ambulance dispatch)**](../../use-cases/09_s09_ambulance.md) — a fully **live** SimPy + NetworkX
  DES with **no** OR-Tools and **no** OSMnx/OSRM. One seeded Poisson call stream is replayed; dispatch is a
  closed-form **nearest-available argmin** (the unit with the earliest feasible scene arrival, honouring
  each unit's busy clock) and routing is `nx.single_source_dijkstra` over an in-repo `GridNetwork` road
  graph. It produces response-time distributions and coverage entirely in the browser.

The full optimization side, the `GUIDED_LOCAL_SEARCH` + deterministic stopping rule (a solution-**count**
limit such as S08's `solution_limit = 200`, or a CP-SAT/GLOP cap with `num_search_workers = 1`) + seed
template, and the simheuristic story live in the
[Optimization & Routing guide](../03_optimization-routing.md). Determinism is
the contract on both legs: seed the solver *and* the SimPy RNG so every committed run reproduces exactly —
the [determinism discipline](../../architecture/02_determinism-and-trace.md) from the
[honesty curriculum](./04_honesty-curriculum.md#4-determinism-is-the-contract).

## Where DES runs: mostly live, sometimes precomputed

Unlike the **native** optimization engines (OR-Tools is C++ with no WASM build → always precompute),
**SimPy is pure Python and clears the engine gate**, so its DES scenarios run **live in the Pyodide Web
Worker** with editable params and real-time animation. A SimPy-only scenario stays live as long as it
clears the four-gate AND (pure-Python · wheels ⊆ `LIVE_WHEELS` · run < 3 s · trace < 1 MB); the only DES
work that ships precomputed is the **native OR-Tools** plan inside a hybrid (and even then the SimPy replay
can still run live, as in S07):

- **Live (in-browser):** [S01](../../use-cases/01_s01_queue.md) (bank/clinic queue),
  [S04](../../use-cases/04_s04_ed.md) (ED patient flow), [S09](../../use-cases/09_s09_ambulance.md)
  (ambulance dispatch — SimPy + NetworkX, pure-Python, no solver), the SimPy *replay* of
  [S07](../../use-cases/07_s07_haul.md), and the joblib-driven [S10](../../use-cases/10_s10_montecarlo.md)
  Monte-Carlo study (joblib runs live in Pyodide). Move a slider, SimPy re-runs in the Worker, the
  network animates. See the [live Pyodide lane](../../architecture/04_live-lane-pyodide.md).
- **Precomputed (committed plan/trace, replayed):** only the **native OR-Tools** legs — S07's route PLAN
  (NetworkX + CP-SAT, committed as data so the live SimPy replay can re-select among the grade×wall grid),
  S08's CVRP plans (OR-Tools + PyVRP), and S11's GLOP LP allocation. These set `pure_python = False`, have
  no WASM build, and ship as committed artifacts replayed under the *"precomputed due to cost; full
  pipeline in the repo"* banner. See the [precompute pipeline](../../architecture/05_precompute-pipeline.md).

The verdict and the measured numbers for each scenario live in its manifest; the
[gate](../../architecture/03_the-gate.md) is structural, so a heavy run can never accidentally ship as
"live".

## Scenario map

How the DES tools map onto the lab's scenarios. Each row links to its use-case node; the full catalog is
the [use-cases section](../../use-cases/01_s01_queue.md).

| Scenario | DES engine | Validation / theory | Lane | What it teaches |
|---|---|---|---|---|
| [**S01 — Bank / Clinic Queue (M/M/c)**](../../use-cases/01_s01_queue.md) | **SimPy** (process-interaction) | **Ciw** closed-form M/M/c overlay (Erlang-C) | live | The DES "hello world": arrivals, a server pool, a queue, utilization ρ, Little's Law, and **sim-converges-to-theory** validation. Folds in the ρ→1 utilization blow-up. |
| [**S04 — Emergency Department Patient Flow**](../../use-cases/04_s04_ed.md) | **SimPy** (multi-stage, priority queue) | no closed form → face validity + sensitivity | live | Synthetic homogeneous Poisson arrivals with one fixed daytime surge window, priority triage, resource-limited multi-stage flow (triage → treatment → discharge). One seeded run (the replications/CI honesty lesson is **S10**). |
| [**S07 — Construction Haul Routing**](../../use-cases/07_s07_haul.md) *(DES replay)* | **SimPy** replay under stochastic load/dump/delay | — | live replay (native plan precomputed) | The *simulate* leg of optimize-then-simulate: the route plan is committed, the SimPy replay runs live; how a fixed plan degrades under uncertainty. |
| [**S08 — Vehicle Routing (CVRP)**](../../use-cases/08_s08_vrp.md) | **OR-Tools + PyVRP** (no SimPy, no DES leg) | — | precomputed | Two SOTA solvers on the identical CVRP instance; the head-to-head total-distance gap (no stochastic replay). |
| [**S09 — Ambulance Dispatch**](../../use-cases/09_s09_ambulance.md) | **SimPy + NetworkX**, closed-form nearest-available argmin dispatch (no solver) | — | live | One seeded Poisson call stream over an in-repo `GridNetwork`; response-time distributions and coverage, run live in the browser. |
| [**S10 — Monte-Carlo Replication / CI Study**](../../use-cases/10_s10_montecarlo.md) | **heap-based M/M/c estimator** (numpy), replicated by **joblib** (`Parallel`, threading) | SciPy CI vs Erlang-C | live (joblib runs in Pyodide) | The non-negotiable curriculum: **replications, confidence intervals, finite-run (initial-transient) bias**, and the wrong-vs-corrected pitfall (single run, one seed). |
| [**S11 — Mine Multi-Destination Haul**](../../use-cases/11_s11_minehaul.md) *(DES leg)* | **SimPy** replay of the GLOP LP allocation | — | precomputed | Realised haul outcomes under uncertainty vs the LP's paper optimum. |

Each scenario commits its **seed, parameters, warm-up cut, and measured gate numbers** into the manifest
so the replayed run is reproducible — and carries a **STRESS-DES model card** (see the
[honesty curriculum](./04_honesty-curriculum.md#5-an-animation-is-a-hypothesis-generator-not-evidence)).

## Next

- [Monte-Carlo & Replications guide](../04_monte-carlo-replications.md) — the replication/CI machinery S10
  wraps around the DES base model.
- [Optimization & Routing guide](../03_optimization-routing.md) — the "optimize" half of the hybrid
  scenarios above.
- Back to the [DES section index](../01_discrete-event-simulation.md).
