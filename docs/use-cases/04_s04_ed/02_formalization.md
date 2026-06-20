# 02 · Formalization — S04 Emergency Department Patient Flow

The math, pulled from the scenario's verified Context block (`web/src/pages/Experiments.tsx`) and the
implementation in [`simlab/scenarios/s04_ed.py`](../../../simlab/scenarios/s04_ed.py) — kept consistent
with the code, nothing invented. Background and scope: [01 · Assumptions](./01_assumptions.md). Up: [the
S04 index](../04_s04_ed.md).

## Model class

A **tandem queueing network** (a two-stage open network) plus a deterministic exit:

> an **M/M/cₜ FCFS** triage station, feeding an **M/M/cₓ non-preemptive head-of-line priority** (2-class)
> treatment station, followed by a deterministic discharge delay modeled as an **∞-server stage** with
> fixed time `d`.

It is run as a **process-interaction discrete-event simulation** (SimPy), with all random variates sampled
*up front* under a fixed seed so the trace is reproducible.

## Sets

| Set | Symbol | Meaning |
|---|---|---|
| Patients | `i = 1, …, n` | entities flowing through the shift |
| Stations | triage → treatment → discharge | traversed in series by every patient |
| Patient classes | `k ∈ {urgent, standard}` | priority codes **0** (urgent) and **1** (standard); *lower number = higher priority* |

## Parameters

| Parameter | Symbol | Code key | Role |
|---|---|---|---|
| Base arrival rate | λ | `lam` | base intensity of the arrival process |
| Triage service rate | μₜ | `mu_triage` | per-nurse exponential rate at triage |
| Treatment service rate | μₓ | `mu_treat` | per-bay exponential rate at treatment |
| Triage nurses | cₜ | `c_triage` | servers in the triage pool |
| Treatment bays | cₓ | `c_treat` | servers in the treatment pool |
| Urgent fraction | pᵤ | `p_urgent` | Bernoulli probability a patient is urgent |
| Surge flag | s ∈ {0,1} | `surge` | turns the daytime arrival surge on/off |
| Discharge delay | d = 0.3 | *(constant)* | deterministic discharge hold |
| Patient count | n | `n_patients` | patients in the shift |

Derived horizon and surge window (from `run`): the shift horizon is `H = n / λ · 1.3`, the surge window is
`[s₀, s₁) = [0.3H, 0.6H)`, and the thinning envelope is `λ_max = 2λ`.

## Decision vs state variables

This is a **simulation**, not an optimizer: there are **no decision variables** in the optimization sense.
The "design" knobs (cₜ, cₓ, λ, pᵤ, s) are *parameters* the modeler sets per variant; the model then
*evaluates* the resulting flow. What evolves over (simulated) time are the **state variables**:

- each station's **queue length** and number of **busy servers**;
- for every patient `i`: its arrival epoch `aᵢ`, its sampled service times `Sᵗᵢ, Sˣᵢ`, the realized waits
  `waitᵗᵢ` (triage) and `waitˣᵢ` (treatment), and its departure epoch.

## Dynamics

### 1 · Non-stationary arrivals via thinning (Lewis–Shedler)

The instantaneous intensity has a surge that doubles the rate over the middle of the shift:

```
λ(t) = λ · ( 1 + s · 1[ s₀ ≤ t < s₁ ] ),     λ_max = 2λ
```

A homogeneous Poisson process of rate `λ_max` is generated (interarrivals `~ Exp(λ_max)`), and each
candidate epoch `t` is **accepted** with the thinning probability

```
Pr[ accept t ] = λ(t) / λ_max
```

The accepted points form the arrivals `a₁ < a₂ < ⋯`. (In code: a `while` loop draws
`t += rng.exponential(1/λ_max)`, computes `rate = λ · (2 if surge and s₀≤t<s₁ else 1)`, and keeps `t` when
`rng.random() < rate/λ_max`; a guard caps the loop at `n·50` candidates. The realized `n` is the number of
accepted points.)

### 2 · Class assignment and service times (drawn up front)

Each patient is urgent with probability pᵤ (Bernoulli); services are independent exponentials:

```
Sᵗᵢ ~ Exp(μₜ),     Sˣᵢ ~ Exp(μₓ),     discharge = d   (constant)
```

All of these vectors — `prios`, `tri_svc`, `trt_svc` — are sampled before the event loop starts, so
determinism does not depend on the scheduler's interleaving.

### 3 · Flow through the stations

Each patient `i` runs as one SimPy process:

1. **arrival** at `aᵢ` (the `source` process releases it at the right epoch);
2. request a **triage** nurse (FCFS `Resource`, capacity cₜ) → wait `waitᵗᵢ` → hold for `Sᵗᵢ` → release;
3. request a **treatment** bay (a `PriorityResource`, capacity cₓ, requested with `priority = k`) → wait
   `waitˣᵢ` → hold for `Sˣᵢ` → release;
4. hold the deterministic discharge `d`, then **depart**.

The **priority discipline** at treatment serves urgent patients first: when a bay frees up it picks the
waiting patient with the lowest priority index, **without preempting** one already in service
(non-preemptive, head-of-line).

### 4 · Length-of-stay and the load indicator

Each patient's stay is its total time in system,

```
LOSᵢ = (waitᵗᵢ + Sᵗᵢ) + (waitˣᵢ + Sˣᵢ) + d
```

and the bottleneck-load indicator is the offered utilization of treatment — the system is stable when
`ρ < 1`:

```
ρ = λ / ( cₓ · μₓ )
```

## KPIs (the reported outputs)

Computed in `run` and stored on the trace's `kpis` (means are over the realized patients):

| KPI key | Symbol | Definition |
|---|---|---|
| `mean_LOS` | LOS̄ | mean total length-of-stay over all patients |
| `mean_LOS_urgent` | LOS̄ᵤ | mean LOS over urgent patients |
| `mean_LOS_standard` | LOS̄ₛ | mean LOS over standard patients |
| `mean_wait_treatment` | — | mean wait to enter treatment (`env.now − t_q`, captured at the moment the bay is granted) |
| `rho_treatment` | ρ | offered treatment utilization `λ / (cₓ·μₓ)` |
| `n_patients` | n | realized patient count (accepted arrivals) |
| `urgent_frac` | — | realized fraction of urgent patients |

> **Note on the modeled bottleneck.** Per the Context, treatment is *the* bottleneck: a single LOS picks
> up both a triage wait and a treatment wait, but with μₜ = 3.0 ≫ μₓ = 0.8 (default) the treatment wait
> dominates — and `ρ` is reported on treatment for exactly this reason. The `triage_bottleneck` variant
> (cₜ = 1) is the deliberate exception that moves contention upstream.

## Why simulation (no closed form)

Poisson arrivals (via thinning) and exponential services make the *core* Markovian, but the **priority
classes** and the **non-stationary intensity** push the model out of any simple closed form — so there is
no Erlang-C-style analytic answer to overlay (unlike S01). The honest measure is therefore replicated
simulation with a confidence interval, after a warm-up; the single seeded run shown live is one draw, not
the answer. See the
[DES honesty curriculum](../../problem-types/01_discrete-event-simulation/04_honesty-curriculum.md).

Continue to [03 · Solvers applied](./03_solvers-applied.md).
