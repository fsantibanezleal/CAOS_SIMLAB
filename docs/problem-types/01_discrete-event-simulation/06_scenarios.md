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

- [**S07 (construction haul routing)**](../../use-cases/07_s07_haul.md) and
  [**S09 (ambulance dispatch)**](../../use-cases/09_s09_ambulance.md) — an OR-Tools plan over a road
  graph is fixed offline; a **SimPy** model then replays trucks / ambulances under stochastic
  load/dump/delay and stochastic call streams, producing cycle-time and response-time distributions. The
  *DES leg* of each is pure SimPy.
- [**S08 (VRP/VRPTW)**](../../use-cases/08_s08_vrp.md) — optimized routes are handed to a SimPy replay
  that injects travel-time noise and reports time-window violations: "an optimum on paper is fragile
  under uncertainty."
- [**S11 (mine multi-destination haul)**](../../use-cases/11_s11_minehaul.md) — a GLOP LP allocation is
  simulated under uncertainty so the realised outcomes (not just the LP's paper optimum) are what gets
  reported.

The full optimization side, the mandatory `GUIDED_LOCAL_SEARCH` + time-limit + seed template, and the
simheuristic story live in the [Optimization & Routing guide](../03_optimization-routing.md). Determinism is
the contract on both legs: seed the solver *and* the SimPy RNG so every committed run reproduces exactly —
the [determinism discipline](../../architecture/02_determinism-and-trace.md) from the
[honesty curriculum](./04_honesty-curriculum.md#4-determinism-is-the-contract).

## Where DES runs: mostly live, sometimes precomputed

Unlike the optimization tools (native C++ → always precompute), **SimPy is pure Python and clears the
engine gate**, so light DES scenarios run **live in the Pyodide Web Worker** with editable params and
real-time animation. A DES scenario falls back to the precompute lane only when it breaches the **time**
or **trace** gate — long horizons, large entity counts, or many replications:

- **Live (in-browser):** [S01](../../use-cases/01_s01_queue.md) (bank/clinic queue),
  [S04](../../use-cases/04_s04_ed.md) (ED patient flow), and the *DES base model* used inside
  [S10](../../use-cases/10_s10_montecarlo.md). Move a slider, SimPy re-runs in the Worker, the
  queue-network animates. See the [live Pyodide lane](../../architecture/04_live-lane-pyodide.md).
- **Precomputed (committed trace, replayed):** the heavy SimPy legs of S07/S08/S09/S11 (large graphs,
  many trucks/calls), and S10's **thousands-of-replications** Monte-Carlo study — computed offline (CPU
  via joblib; an optional CuPy/Numba GPU exhibit) and committed as a CI-envelope artifact, then replayed
  under the *"precomputed due to cost; full pipeline in the repo"* banner. See the
  [precompute pipeline](../../architecture/05_precompute-pipeline.md).

The verdict and the measured numbers for each scenario live in its manifest; the
[gate](../../architecture/03_the-gate.md) is structural, so a heavy run can never accidentally ship as
"live".

## Scenario map

How the DES tools map onto the lab's scenarios. Each row links to its use-case node; the full catalog is
the [use-cases section](../../use-cases/01_s01_queue.md).

| Scenario | DES engine | Validation / theory | Lane | What it teaches |
|---|---|---|---|---|
| [**S01 — Bank / Clinic Queue (M/M/c)**](../../use-cases/01_s01_queue.md) | **SimPy** (process-interaction) | **Ciw** closed-form M/M/c overlay (Erlang-C) | live | The DES "hello world": arrivals, a server pool, a queue, utilization ρ, Little's Law, and **sim-converges-to-theory** validation. Folds in the ρ→1 utilization blow-up. |
| [**S04 — Emergency Department Patient Flow**](../../use-cases/04_s04_ed.md) | **SimPy** (multi-stage, priority queue) | no closed form → **replications + CI** | live | Non-stationary Poisson arrivals, priority triage, resource-limited multi-stage flow (triage → treatment → disposition), and the **results-honesty** beat (single run vs N replications + CI, warm-up). |
| [**S07 — Construction Haul Routing**](../../use-cases/07_s07_haul.md) *(DES leg)* | **SimPy** replay under stochastic load/dump/delay | — | precomputed (heavy graph) | The *simulate* leg of optimize-then-simulate; how a fixed plan degrades under uncertainty. |
| [**S08 — Vehicle Routing (VRP/VRPTW)**](../../use-cases/08_s08_vrp.md) *(DES leg)* | **SimPy** replay with travel-time noise | — | precomputed | Optimized routes vs reality: time-window violations under stochastic travel times. |
| [**S09 — Ambulance Dispatch**](../../use-cases/09_s09_ambulance.md) *(DES leg)* | **SimPy** many stochastic call streams | — | precomputed | Stochastic demand over a city graph; response-time distributions and coverage from replicated runs. |
| [**S10 — Monte-Carlo Replication / CI Study**](../../use-cases/10_s10_montecarlo.md) | **SimPy** base model (reuses S01/S04) | — | precomputed (CPU joblib; optional GPU) | The non-negotiable curriculum: **replications, confidence intervals, warm-up / initial transient**, and the wrong-vs-corrected pitfall (single run, one seed, no warm-up). |
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
