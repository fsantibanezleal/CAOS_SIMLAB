# SimPy — Usage

This is the practical how-to for SimPy in CAOS_SIMLAB: the handful of concepts that make up the whole
API, a minimal runnable example walked through line by line, and the **real captured output** of that
example. If you read only one section, read [the example walkthrough](#the-minimal-example).

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

Useful extras you will meet later but not in the minimal example:

- **`Container`** — a quantity of a continuous/bulk resource (fuel, ore, blood units) with `put`/`get`.
- **`Store`** — a queue of *discrete items* (parts on a conveyor, jobs) with `put`/`get`.
- **`env.event()`** + `succeed()` — a custom event you trigger yourself (e.g. a breakdown signal).
- **Conditions** — `yield a & b` (both) or `yield a | b` (first), e.g. "served OR reneged after T".

## 2. Determinism — the contract

SimPy itself is deterministic: given the same sequence of sampled durations, it always produces the
same trace. The randomness comes from *you*, so the rule in this lab is:

> Create **one** `random.Random(seed)` instance and pass it to every process. Never call the module-level
> `random.expovariate(...)` (it uses a hidden global generator and breaks reproducibility). The same
> `(params, seed)` must reproduce the same numbers exactly — that is what makes a committed precomputed
> run trustworthy and lets the front end *replay* instead of *recompute*.

## 3. The minimal example

The file [`example.py`](./example.py) is a complete, self-contained **M/M/c queue** — the DES "hello
world": Poisson arrivals, a pool of `c` servers, a FIFO queue, exponential service, and a warm-up
period. It records each customer's waiting time and the server busy-time, then prints the mean wait and
utilization **next to the closed-form queueing theory** so you can see the simulation converge to a
known answer.

Run it from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/simpy/example.py
```

### Walkthrough

The heart of the model is two short generators.

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

```python
def arrivals(env, servers, rng, stats):
    while True:
        yield env.timeout(rng.expovariate(ARRIVAL_RATE))   # exponential inter-arrival gap
        env.process(customer(env, servers, rng, stats))    # spawn a new customer process
```

This is the **Poisson arrival stream**: an infinite loop that waits an exponential gap, then spawns a
new `customer` process. Exponential inter-arrival times are exactly what makes the arrivals Poisson.

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
realistic enough that no closed form exists — e.g. the multi-stage S04 ED — you switch to replications
+ confidence intervals; see [`applying.md`](./applying.md).)

## 4. Verified output

The following is the **real, captured stdout** of running `example.py` with the venv interpreter from
the repo root. It is deterministic: every run prints exactly these numbers.

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
  [Monte-Carlo replications](../../problem-types/monte-carlo-replications.md) guide.)
- **No warm-up.** A model starting empty and idle is biased low; discard the initial transient. The
  example does this with the `WARMUP` guard.
- **Using the global `random`.** Always pass a seeded `random.Random` instance, or the run is not
  reproducible.
- **Forgetting to release a resource.** Use `with resource.request() as req:`; the `with` releases it
  for you and prevents deadlock.
- **Expecting SimPy to animate.** It has no viz by design. Emit an event trace and render it in the
  front end.

## Sources

- SimPy docs (Environment, Resource, processes, `yield`): <https://simpy.readthedocs.io/>
- "Discrete Event Simulation: It's Easy with SimPy!" (arXiv 2405.01562): <https://arxiv.org/html/2405.01562v1>
- Erlang-C / M/M/c queueing reference — paired with the simulation per research report 01 (Ciw lesson).
