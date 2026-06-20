# SimPy — Usage

This is the practical how-to for SimPy in CAOS_SIMLAB: the handful of concepts that make up the whole
API, a minimal runnable example walked through line by line, and the **real captured output** of that
example. If you read only one section, read [the example walkthrough](#3-the-minimal-example).

Read order for this node: **you are on 02.** Previous: [`01_installation.md`](./01_installation.md).
Next: [`03_applying.md`](./03_applying.md). Landing page: [`../01_simpy.md`](../01_simpy.md).

> SimPy is a **process-based discrete-event simulation** library. You describe the *life-story* of each
> entity as a Python generator; each `yield` is a point where the entity *waits* and hands control back
> to the engine. The engine advances a single simulated clock by jumping from event to event. There is
> no animation and no GUI — SimPy is the headless physics; in this lab the browser owns the pixels.

## 1. The whole API, in five concepts

SimPy is small. Almost everything you will ever write uses just these:

| Concept | What it is | API |
|---|---|---|
| **Environment** | Holds the simulated clock and the future-event list (FEL); runs the loop. | `env = simpy.Environment()`; `env.now`; `env.run(until=T)` |
| **Process** | The life-story of one entity, written as a Python *generator function*. | `env.process(my_gen(env, ...))` |
| **Timeout** | "Wait for a fixed/sampled duration of simulated time." | `yield env.timeout(d)` |
| **Resource** | A pool of `capacity` identical, limited servers entities queue for. | `r = simpy.Resource(env, capacity=c)`; `with r.request() as req: yield req` |
| **PriorityResource** | A `Resource` where lower-priority-number requests are served first. | `r.request(priority=p)` |

Two facts make the model click:

1. **`yield` is the only place time passes.** Between yields, code runs *instantaneously* in
   simulated time. `yield env.timeout(5)` says "5 time-units go by"; `yield resource.request()` says
   "wait, however long it takes, until a server is free". Everything else is a state change at the
   current instant.
2. **`with resource.request() as req:` is the idiomatic queue.** Entering the `with` joins the FIFO
   queue; `yield req` blocks until a server frees up; leaving the `with` block **releases** the server
   so the next waiting entity is served. Forgetting to release is the classic deadlock — the `with`
   form prevents it.

### The mental model: an event loop over simulated time

There is **no real-time waiting**. `env.run()` keeps a sorted future-event list (a heap keyed by
event time). Each step it pops the earliest event, jumps `env.now` to that event's time, and resumes
whatever process was waiting on it. Resuming a process runs its Python code (instantaneously, in
simulated time) up to its *next* `yield`, which schedules a new future event. The loop ends when the
FEL is empty or the clock reaches `until=`. That is the entire engine — a priority queue plus
generator resumption. Understanding this is enough to debug almost any SimPy model.

### Useful extras (not in the minimal example)

- **`Container`** — a quantity of a continuous/bulk resource (fuel, ore, blood units) with `put`/`get`.
- **`Store`** — a queue of *discrete items* (parts on a conveyor, jobs) with `put`/`get`.
- **`env.event()`** + `succeed()` — a custom event you trigger yourself (e.g. a breakdown signal).
- **Conditions** — `yield a & b` (both) or `yield a | b` (first), e.g. "served OR reneged after T".
- **`req.priority`** via `PriorityResource` / `PreemptiveResource` — triage classes (used in S04).

## 2. Determinism — the contract

SimPy itself is deterministic: given the same sequence of sampled durations, it always produces the
same trace. The randomness comes from *you*, so the rule in this lab is:

> Create **one** `random.Random(seed)` instance and pass it to every process. Never call the module-level
> `random.expovariate(...)` (it uses a hidden global generator and breaks reproducibility). The same
> `(params, seed)` must reproduce the same numbers exactly — that is what makes a committed precomputed
> run trustworthy and lets the front end *replay* instead of *recompute*.

This contract is why the lab's "precomputed due to cost" artifacts are still honest science: a
committed trace is not a snapshot of one lucky run, it is the *reproducible* output of a pinned
`(params, seed)` whose pipeline is in the repo.

## 3. The minimal example

The file [`example.py`](./example.py) is a complete, self-contained **M/M/c queue** — the DES "hello
world": Poisson arrivals, a pool of `c` servers, a FIFO queue, exponential service, and a warm-up
period. It records each customer's waiting time and the server busy-time, then prints the mean wait and
utilization **next to the closed-form queueing theory** so you can see the simulation converge to a
known answer.

Run it from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/01_simpy/example.py
```

### Walkthrough

**The parameters and the stats sink.** A single `(params, seed)` tuple determines the run, and a tiny
dataclass collects observations so the generator processes can mutate shared state:

```python
SEED = 42
N_SERVERS = 3          # c  — number of identical parallel servers
ARRIVAL_RATE = 2.4     # lambda — mean arrivals per unit time (Poisson process)
SERVICE_RATE = 1.0     # mu     — mean services per unit time per busy server
SIM_TIME = 20_000.0    # simulated-time horizon (long enough for a tight estimate)
WARMUP = 1_000.0       # discard the initial transient before collecting stats

@dataclass
class Stats:
    waits: list[float] = field(default_factory=list)   # per-customer queue wait (Wq)
    busy_time: float = 0.0                              # total server-busy time
```

**The customer life-story** is the heart of the model:

```python
def customer(env, servers, rng, stats):
    t_arrive = env.now
    with servers.request() as req:        # join the FIFO queue for a free server
        yield req                         # WAIT until a server is free
        wait = env.now - t_arrive
        service_time = rng.expovariate(SERVICE_RATE)
        yield env.timeout(service_time)   # HOLD the server for the service duration
    # leaving the `with` releases the server for the next waiting customer
    if t_arrive >= WARMUP:                # only record once the system has settled
        stats.waits.append(wait)
        stats.busy_time += service_time
```

- `t_arrive = env.now` snapshots the simulated time the customer arrived.
- `with servers.request() as req:` puts the customer in the queue for the `Resource`.
- `yield req` is the **wait in line**: control returns to the engine until a server is free. The time
  between `t_arrive` and the moment this resumes *is* the queue wait `Wq`.
- `yield env.timeout(service_time)` **holds** the server for an exponential service duration.
- The `if t_arrive >= WARMUP` guard implements the **warm-up**: the system starts empty and idle (not
  its steady state), so early measurements are biased low and are discarded.

**The arrival stream** spawns customers as a Poisson process:

```python
def arrivals(env, servers, rng, stats):
    while True:
        yield env.timeout(rng.expovariate(ARRIVAL_RATE))   # exponential inter-arrival gap
        env.process(customer(env, servers, rng, stats))    # spawn a new customer process
```

An infinite loop that waits an exponential gap, then spawns a new `customer` process. Exponential
inter-arrival times are exactly what makes the arrivals Poisson.

**Wiring it together and running the loop:**

```python
def main():
    rng = random.Random(SEED)                          # the ONE source of randomness
    env = simpy.Environment()
    servers = simpy.Resource(env, capacity=N_SERVERS)  # c identical servers
    stats = Stats()
    env.process(arrivals(env, servers, rng, stats))    # start the arrival generator
    env.run(until=SIM_TIME)                            # run the FEL until the horizon
```

`env.run(until=SIM_TIME)` is the whole simulation loop: pop the earliest event, advance the clock,
execute it (which may schedule more events), repeat — until the clock reaches `SIM_TIME`.

### The theory check

Because an M/M/c queue has a **closed-form** mean wait (the Erlang-C result), the example also computes
the analytic `Wq` and the theoretical utilization `ρ = λ / (c·μ)`, and prints them beside the simulated
values. A simulation that does not converge to a known answer *when one exists* is a bug — so this
side-by-side is the cheapest, most credible validation a learner can witness. (When the model gets
realistic enough that no closed form exists — e.g. the multi-stage S04 ED — the validation method is
replications + confidence intervals, which the lab demonstrates in **S10** (the Monte-Carlo study), not in
the single S04 run; see [`03_applying.md`](./03_applying.md).)

The Erlang-C helper in the file is just the textbook formula:

```python
def erlang_c_mean_wait(lam, mu, c):
    a = lam / mu                      # offered load in Erlangs
    rho = a / c                       # per-server utilization
    sum_terms = sum(a**n / math.factorial(n) for n in range(c))
    last_term = (a**c / math.factorial(c)) * (1.0 / (1.0 - rho))
    p_wait = last_term / (sum_terms + last_term)   # P(an arrival has to wait)
    return p_wait / (c * mu - lam)                 # Erlang-C mean wait Wq
```

## 4. Verified output

The following is the **real, captured stdout** of running `example.py` with the venv interpreter from
the repo root (re-run from the new `01_simpy.md` path to confirm; numbers are unchanged). It is
deterministic: every run prints exactly these numbers.

```text
M/M/c queue simulation (SimPy)
  parameters : c=3, lambda=2.4, mu=1.0, seed=42
  horizon    : 20000 (warm-up discarded: 1000)
  customers  : 45414 measured after warm-up
  results (simulated vs. theory):
    mean wait Wq   :   1.0555   theory(Erlang-C):   1.0787
    utilization rho:   0.7969   theory(lambda/c.mu):   0.8000
```

How to read it:

- **45414 customers** were measured after the warm-up cut — a large sample, hence a tight estimate.
- **Mean wait `Wq` = 1.0555** vs **Erlang-C theory 1.0787** — the simulation lands within ~2% of the
  exact analytic answer. They are not identical (this is *one* long run, a single random sample), and
  that gap is itself the lesson: a simulation estimates; it does not compute the exact value. Running
  many seeds and reporting a confidence interval (scenario S10) makes the gap quantifiable.
- **Utilization `ρ` = 0.7969** vs **theory `λ/(c·μ)` = 0.8000** — essentially exact, because over a
  20 000-unit horizon the measured busy fraction is a very stable quantity.

## 5. Common pitfalls (and the fix)

- **Reporting a single run as "the answer."** One run is one noisy sample. The honest output is N
  replications with a confidence interval. (The example here is intentionally *one* run to keep it
  minimal — the CI story lives in scenario S10 and the
  [Monte-Carlo replications](../../problem-types/04_monte-carlo-replications.md) guide.)
- **No warm-up.** A model starting empty and idle is biased low; discard the initial transient. The
  example does this with the `WARMUP` guard.
- **Using the global `random`.** Always pass a seeded `random.Random` instance, or the run is not
  reproducible.
- **Forgetting to release a resource.** Use `with resource.request() as req:`; the `with` releases it
  for you and prevents deadlock.
- **Putting blocking work between `yield`s.** Any non-trivial computation between two yields happens at
  a single simulated instant — it does not consume simulated time and it *does* consume wall-clock
  time. Keep per-event work tiny; this is also what keeps the live lane under its 3-second gate.
- **Expecting SimPy to animate.** It has no viz by design. Emit an event trace and render it in the
  front end.

## Sources

- SimPy docs (Environment, Resource, processes, `yield`): <https://simpy.readthedocs.io/>
- "Discrete Event Simulation: It's Easy with SimPy!" (arXiv 2405.01562): <https://arxiv.org/html/2405.01562v1>
- Erlang-C / M/M/c queueing reference — paired with the simulation per research report 01 (Ciw lesson).
