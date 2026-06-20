# S01 · Formalization (M/M/c)

> The math behind scenario **S01**, kept consistent with the code in
> [`simlab/scenarios/s01_queue.py`](../../../simlab/scenarios/s01_queue.py) (`erlang_c_mmc`, `run`) and
> the verified context block in the app's Experiments page. Nothing here is invented — every formula
> below is the one the code computes. Read [01 · Assumptions](./01_assumptions.md) first.

---

## 1. Sets & indices

- Customers `i ∈ {0, 1, …, n−1}` — entities that arrive, queue, are served, depart.
- Servers `{1, …, c}` — identical, interchangeable members of one pool.

## 2. Parameters

| Symbol | Meaning | Units |
|---|---|---|
| `λ` | Arrival rate (Poisson) | customers / min |
| `μ` | Service rate **per server** (exponential) | customers / min |
| `c` | Number of servers | — |
| `n` | Number of customers simulated | — |
| `seed` | RNG seed (determinism) | — |

## 3. Decision & state variables

There is **no decision variable** here — S01 is a pure *evaluation* model (a DES), not an optimization.
The interesting object is the **state**:

- `N(t)` — the number of customers in the system (waiting **plus** in service) at time `t`. Under the
  M/M/c assumptions `N(t)` is a **birth–death continuous-time Markov chain** (births at rate `λ`, deaths
  at rate `min(N, c)·μ`).

Per-customer realised quantities recorded by the simulation:

- `Wq,i` — customer `i`'s waiting time in queue (`t_start − t_arrival`).
- `W i` — customer `i`'s sojourn (total time in system, `t_depart − t_arrival`).

## 4. Model class

An **M/M/c queue**: **M**arkovian arrivals (i.i.d. exponential inter-arrival times), **M**arkovian
(exponential) service, `c` parallel servers, one FCFS infinite-capacity line, infinite calling
population. The single-server `c = 1` case is the classical **M/M/1**.

## 5. Derived load & stability

Define the **offered load** `a` (in Erlangs) and the **per-server utilization** `ρ`:

```
a = λ / μ            (offered load, Erlangs)
ρ = λ / (c · μ)      (per-server utilization)
stable  ⇔  ρ < 1
```

In the code, `ρ` is `analytic["rho"]` and is also surfaced as the KPI `utilization_offered = λ/(c·μ)`.

## 6. The Erlang-C closed form (the analytic oracle)

`erlang_c_mmc(λ, μ, c)` computes the exact steady-state reference. The probability that an arriving
customer must wait (all `c` servers busy) is the **Erlang-C delay formula** `C(c, a)`:

```
            (a^c / c!) · 1/(1−ρ)
C(c, a) = ───────────────────────────────────────
          Σ_{k=0}^{c−1} a^k/k!  +  (a^c / c!)·1/(1−ρ)
```

Mapped to the code: `P0 = 1 / (sum_terms + last)` with `sum_terms = Σ_{k=0}^{c−1} a^k/k!` and
`last = (a^c / c!)·1/(1−ρ)`; then `p_wait = last · P0 = C(c, a)`.

From `C(c, a)` the steady-state queueing KPIs follow (and by **Little's Law** the counts):

```
Wq = C(c, a) / (c·μ − λ)        (mean wait in queue)        ← code: p_wait / (c·μ − λ)
Lq = λ · Wq                     (mean number in queue)      ← code: λ · wq
W  = Wq + 1/μ                   (mean sojourn = wait + one service)
L  = λ · W                      (mean number in system)
```

The code's `erlang_c_mmc` returns the dict `{rho, p_wait, Wq, Lq, stable}` (it computes `Wq` and `Lq`
directly; `W` and `L` follow by the identities above).

### The unstable branch

When `ρ ≥ 1` there is no finite steady state, so `erlang_c_mmc` returns
`{rho, p_wait: null, Wq: null, Lq: null, stable: false}` — **`null`, not `inf`**, deliberately, so the
committed trace stays valid JSON. Conceptually `Wq = ∞`.

## 7. Objective / constraints / dynamics

- **Objective:** none to optimize — the goal is to **measure** the steady-state behaviour (waits, queue
  length, utilization) and **validate** the simulator against the closed form.
- **Constraints:** at most `c` customers in service simultaneously; FCFS ordering; work-conserving
  servers; stability requires `ρ < 1`.
- **Dynamics (the simulated process, SimPy):** each customer is a process — *arrive → request a server
  (queue if all busy) → hold for an exponential service time → release → depart*. All inter-arrival times
  `inter` and service times `service` are drawn **up front** from one `make_rng(seed)` generator
  (`rng.exponential(1/λ, n)` and `rng.exponential(1/μ, n)`), so determinism does not depend on the event
  scheduler's interleaving.

## 8. KPIs

The simulation reports two families that are meant to be **compared**.

**Simulated KPIs** (`tr.kpis`, from the SimPy run):

| KPI | Definition |
|---|---|
| `Wq_sim` | Mean realised wait in queue over all served customers |
| `W_sim` | Mean realised sojourn (total time in system) |
| `Lq_little` | `λ · Wq_sim` — the **Little's Law** cross-check (rate form of queue length) |
| `utilization_offered` | `ρ = λ/(c·μ)` |
| `mean_service` | `1/μ` |
| `n_customers` | `n` |

**Analytic oracle** (`tr.analytic`, from Erlang-C): `rho`, `p_wait = C(c,a)`, `Wq`, `Lq`, `stable`.

**Second-engine validation** (`tr.analytic["ciw_xcheck"]`): an independent **Ciw** M/M/c replication
study (10 seeded replications) whose across-replication mean `Wq_ciw`, 95% half-CI (`ci95_half`),
relative error vs the theory (`rel_err`) and a `theory_in_ci` flag are recorded. The three numbers
landing together — `Wq_sim` from SimPy, `Wq_ciw` from Ciw, `Wq` from Erlang-C — is the validation
artifact. The *how* of both engines is in [03 · Solvers applied](./03_solvers-applied.md).

---

*Next:* [03 · Solvers applied](./03_solvers-applied.md) — which tools solve this and how.
