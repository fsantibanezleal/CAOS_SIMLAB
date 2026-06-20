# Ciw — Usage

Ciw simulates **open queueing networks**. You describe the network declaratively (arrival
process, service process, number of servers, routing between nodes), build a `Simulation`,
run it to a horizon, and then read back a list of per-customer **records**. Ciw is
*headless*: it produces data, not pictures. The visualization belongs to the web client
(per the lab's architecture).

## Key concepts and API

### 1. The network — `ciw.create_network(...)`

You pass **one list per node**. For a single-node M/M/c queue the lists have length 1:

```python
network = ciw.create_network(
    arrival_distributions=[ciw.dists.Exponential(rate=3.0)],  # Poisson arrivals, lambda=3
    service_distributions=[ciw.dists.Exponential(rate=1.0)],  # exp service, mu=1 per server
    number_of_servers=[4],                                    # c = 4 servers
)
```

- `arrival_distributions` — inter-arrival sampler per node. `Exponential(rate=λ)` ⇒
  Poisson arrivals with rate λ (a Poisson process is the M/M model's "M" for arrivals).
- `service_distributions` — service-time sampler per node. `Exponential(rate=μ)` ⇒
  exponential service (the second "M"). Each of the `c` servers draws from this.
- `number_of_servers` — `c`, the number of parallel identical servers at the node.
- Optional: `routing` (matrix or process-based) for **multi-node** networks,
  `queue_capacities` / `system_capacity` for **blocking**, `baulking_functions` for
  customers who refuse to join, `reneging_time_distributions` for impatient customers,
  multiple **customer classes**, and server `Schedule`s. For S01 we only need the three
  lists above.

### 2. Distributions — `ciw.dists`

Ciw ships a rich set: `Exponential`, `Deterministic`, `Uniform`, `Normal`, `Gamma`,
`Erlang`, `Lognormal`, `Weibull`, `Poisson`, `Sequential`, `Empirical`, `PhaseType`, and
more. For M/M/c you use `Exponential` for both arrivals and service.

### 3. Reproducibility — `ciw.seed(s)`

Call `ciw.seed(s)` **before** constructing the `Simulation` (or before `simulate_*`) to
make a run deterministic. Different seeds give **independent replications** — the basis for
a confidence interval.

### 4. Running — `ciw.Simulation` + `simulate_until_max_time`

```python
ciw.seed(0)
sim = ciw.Simulation(network)
sim.simulate_until_max_time(8000.0)   # run to t = 8000 time units
```

There is also `simulate_until_max_customers(n)` if you prefer to stop after `n` customers.

### 5. Reading results — `get_all_records()`

```python
recs = sim.get_all_records()
```

Each record is a named tuple with fields including:
`id_number, customer_class, node, arrival_date, waiting_time, service_start_date,
service_time, service_end_date, time_blocked, exit_date, queue_size_at_arrival,
queue_size_at_departure, server_id, record_type`.

For M/M/c validation the field of interest is **`waiting_time`** (time spent in queue
before service starts). To estimate the steady-state mean you **discard a warm-up
transient** (records whose `arrival_date` is below a cutoff) and average the rest.

## The validation idea (why Ciw for the queueing lesson)

The teaching payoff is the **comparison with theory**. For a stable M/M/c queue
(`ρ = λ/(c·μ) < 1`) the mean waiting time in queue has a closed form, the **Erlang-C**
result:

```
a   = λ/μ                      # offered load (Erlangs)
ρ   = a/c                      # utilisation
C(c,a) = Erlang-C wait prob.   # P(an arrival must wait)
Wq  = C(c,a) / (c·μ − λ)       # mean time in queue
```

A correct simulation must reproduce `Wq` (within Monte-Carlo error). That single
sim-vs-theory check is the strongest didactic asset in the queueing block.

## Minimal runnable example, walked through

The full script is [`example.py`](./example.py) in this folder. It:

1. **Sets M/M/c parameters** — `λ=3`, `μ=1`, `c=4`, so `ρ=0.75` (stable).
2. **Computes the Erlang-C `Wq`** in `erlang_c_wq(...)` using a numerically stable sum.
3. **Runs 30 seeded replications** (`run_replication(seed)`), each:
   - builds the network with `ciw.create_network`,
   - seeds with `ciw.seed(SEED0 + k)` for independence,
   - simulates to `t=8000`,
   - drops warm-up records (`arrival_date < 1000`) and averages `waiting_time`.
4. **Aggregates** the 30 per-run means into an overall mean and a **95% confidence
   interval** (`mean ± 1.96·SE`), then prints theory vs simulation, the CI, the relative
   error, and whether theory falls inside the CI.

Run it from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/ciw/example.py
```

### Verified output

The following is the **actual captured stdout** from running the example with Ciw 3.2.7
on CPython 3.13.0 (Windows):

```text
M/M/c queue validation with Ciw
================================================
lambda (arrival rate) : 3.0
mu     (service rate) : 1.0
c      (servers)      : 4
offered load a=l/mu   : 3.0000 Erlangs
utilisation rho       : 0.7500
------------------------------------------------
replications          : 30
run length / warm-up  : 8000 / 1000
------------------------------------------------
Erlang-C theory   Wq  : 0.50943
Ciw simulation    Wq  : 0.52268
95% CI (sim mean)     : [0.50771, 0.53765]
relative error        : 2.60%
theory inside 95% CI  : True
================================================
PASS: sim ~= theory
```

**Reading it:** the closed-form Erlang-C `Wq = 0.50943`; the Ciw estimate is
`0.52268` with a 95% CI of `[0.50771, 0.53765]`. The theoretical value lies **inside**
that interval and the point estimate is within **2.60%** — the simulation matches theory.
This is exactly the validation story S01 teaches. (The estimate sits slightly above
theory, a classic finite-run effect: even after warm-up removal, the tail of the queue is
under-sampled in a finite horizon. Increasing `MAX_TIME` and `WARMUP` tightens both the
bias and the CI; the run length here is chosen to keep the example fast while still
covering theory.)

## Common gotchas

- **Seed before constructing the simulation.** `ciw.seed()` affects subsequent RNG draws;
  call it before `ciw.Simulation(...)` for a fully reproducible run.
- **Always remove a warm-up transient** when estimating steady-state means; otherwise the
  initially-empty system biases `Wq` downward.
- **Stability:** the Erlang-C formula (and a finite mean wait) only exists for `ρ < 1`.
  The example raises `ValueError` if you push it unstable.
- **One list per node.** A length-mismatch between `arrival_distributions`,
  `service_distributions` and `number_of_servers` is the most common setup error.
