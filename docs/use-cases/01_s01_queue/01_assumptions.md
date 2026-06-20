# S01 · Assumptions, canonical instance & scope

> Use-case node for scenario **S01 — Bank / Clinic Queue (M/M/c)**. This page fixes *what is being
> modelled* before any math: the concrete instance, what the model includes, and — just as important —
> what it deliberately leaves out. Read it before the [formalization](./02_formalization.md).

---

## 1. The canonical instance

Customers arrive at a **bank or clinic** and wait for one of `c` **identical servers** (tellers /
treatment desks) that share a **single first-come-first-served (FCFS) line**. There is one queue feeding
the whole pool, not one queue per server. The operational question is the one a branch manager actually
asks: **how long do people wait, and why does the wait explode as the place gets busy?**

This is the discrete-event-simulation "hello world" — the canonical bank/clinic instance — and it is the
app's landing scenario. Its didactic payload is not just *animate a queue* but **validation**: the
simulated mean wait is held up against the closed-form theory, so the learner sees "does my simulation
match the math?" answered with numbers.

### Components

| Element | In this scenario |
|---|---|
| **Entities** | Indistinguishable customers. The shipped run uses `n = 300` customers per simulation. |
| **Resource** | A pool of `c` identical, work-conserving servers — a SimPy `Resource(capacity=c)` — fronted by a single FCFS queue of **infinite capacity**. |
| **Arrival process** | A **Poisson** process of rate `λ` (per minute): inter-arrival times are i.i.d. exponential with mean `1/λ`. |
| **Service process** | **Exponential** service of rate `μ` (per minute) **per server**: mean service time `1/μ`. |
| **State** | `N(t)`, the number of customers in the system (waiting **plus** in service) at time `t`. |
| **Calling population** | Infinite (the arrival rate does not depend on how many customers are already inside). |

### Tunable parameters (the app's sliders)

These are the four `ParamSpec`s declared on the scenario, with their defaults and ranges:

| Parameter | Symbol | Default | Range | Step |
|---|---|---|---|---|
| Arrival rate (/min) | `λ` (`lam`) | 2.0 | 0.1 – 10.0 | 0.1 |
| Service rate (/min) | `μ` (`mu`) | 1.0 | 0.1 – 10.0 | 0.1 |
| Servers | `c` | 3 | 1 – 10 | 1 (int) |
| Customers | `n` (`n_customers`) | 300 | 50 – 5000 | 50 (int) |

---

## 2. What is modelled

- **A single shared FCFS line** feeding `c` identical parallel servers (an M/M/c station — the M/M/1
  single-server case is just `c = 1`).
- **Work-conserving servers**: a free server never idles while a customer waits.
- **Infinite queue capacity** (no balking from a full buffer) and an **infinite calling population**.
- **Stationary** Poisson arrivals and **independent exponential** service — the two "M"s of M/M/c.
- A **seeded, reproducible** run. All exponential variates (inter-arrival and service times) are drawn
  **up front** from one seeded NumPy generator, so the outcome is a function of `(params, seed)` **only**
  and does not depend on the event scheduler's interleaving. The same input reproduces the same trace
  byte-for-byte — the lab's "replay = truth" contract.

---

## 3. What is **out of scope** (deliberately not modelled)

The M/M/c idealisation is chosen precisely because it has an **exact closed form** to validate against.
The price of that is a set of real-world effects it does **not** capture:

- **Balking / reneging** (impatience — leaving before joining, or abandoning the queue).
- **Batch arrivals** (groups arriving together).
- **Finite buffers / blocking** (a cap on the line length).
- **Priorities / multiple customer classes** (some customers jump the queue).
- **Non-stationary `λ`** (time-of-day demand peaks).
- **Non-exponential service** (deterministic or heavy-tailed service times → G/G/c, no closed form).

These are not omissions by accident — they are the boundary of where Erlang-C still holds. The moment a
model needs them, the closed form runs out and **replicated simulation with confidence intervals** becomes
the only honest measure. That transition is taught downstream in the **emergency-department scenario
S04** (priority triage, non-stationary arrivals, multi-stage flow) and in the **Monte-Carlo CI study
S10**, and is the central lesson of the
[DES problem-type guide](../../problem-types/01_discrete-event-simulation.md).

---

## 4. Stability — the one assumption that can fail

The model is only stable (has a finite steady state) when the **per-server utilization** `ρ = λ / (c·μ)`
is **below 1**. When `ρ ≥ 1`, arrivals meet or exceed capacity, no steady state exists, and the queue
grows without bound: the theory returns `Wq = ∞` (a null analytic field) while the simulated line just
keeps lengthening. This **unstable regime is shipped on purpose** (the `unstable` variant, `ρ ≈ 1.10`) as
a teachable failure mode — see [results & reading](./04_results-and-reading.md).

---

*Next:* [02 · Formalization](./02_formalization.md) — the sets, parameters, model class, Erlang-C
closed form and KPIs, pulled verbatim from the code and the Experiments context.
