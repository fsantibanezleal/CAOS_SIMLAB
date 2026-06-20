# 03 · Methods & KPIs — what a DES measures, and the model shape

> Part of the [Discrete-Event Simulation guide](../01_discrete-event-simulation.md). This page covers the
> quantities you pull out of a DES, the one identity that validates them (Little's Law), and the
> process-interaction shape in code (the SimPy generator).

## KPIs — what a DES actually measures

A DES is only as good as the quantities you pull out of it. The canonical operational KPIs:

- **Utilization (ρ)** — the fraction of time a resource is busy. For a server pool of `c` servers with
  arrival rate λ and per-server service rate μ, `ρ = λ / (c·μ)`. The system is only stable when ρ < 1;
  as **ρ → 1 the queue blows up nonlinearly** — this is the headline lesson of scenario
  [**S01**](../../use-cases/01_s01_queue.md). The blow-up is not gradual: pushing a system from 80% to
  95% utilization can multiply the wait several-fold, which is why "just keep the resource busy" is
  often the wrong operational target.
- **Waiting time / time in system** — how long an entity queues before service (`Wq`) and total
  sojourn time (`W`). These are the numbers a manager actually feels.
- **Queue length** — entities waiting (`Lq`) and entities in the system (`L`).
- **Throughput** — completed entities per unit time; in steady state it equals the effective arrival
  rate.

Every one of these is a *random variable*, not a fixed number — which is precisely why the
[honesty curriculum](./04_honesty-curriculum.md) insists you report each as a mean with a confidence
interval, after discarding the warm-up, rather than as a single run's average.

### The notation, gathered

| Symbol | Meaning |
|---|---|
| `λ` | arrival rate (entities per unit time) |
| `μ` | per-server service rate (entities per unit time) |
| `c` | number of parallel servers |
| `ρ` | utilization, `ρ = λ / (c·μ)` (stable only when ρ < 1) |
| `Wq` / `W` | mean waiting time in queue / total time in system |
| `Lq` / `L` | mean number waiting / mean number in system |

## Little's Law — the one identity to know

For any stable system in steady state, regardless of the arrival or service distribution:

```text
L = λ · W            (entities in system = arrival rate × time in system)
Lq = λ · Wq          (the same, restricted to the queue)
```

Little's Law is the cheapest sanity check in all of simulation: measure any two of `L`, `λ`, `W` and the
third is forced. If your simulated `L` and `λ·W` disagree, your model — or your measurement window — is
wrong. The lab uses it as a built-in validation gate in [**S01**](../../use-cases/01_s01_queue.md).

The power of the law is its generality: it makes **no** assumption about the arrival distribution, the
service distribution, the number of servers, or the queue discipline. So it holds for the idealised
M/M/c queue *and* for the messy multi-stage emergency department — making it the one check you can apply
to literally every DES you build. The standard failure mode it catches is a measurement-window bug:
collecting `L` over the full run (including warm-up) but `W` only over completed entities, so the two no
longer refer to the same population.

## Process-interaction in practice (the SimPy shape)

The whole process-interaction worldview fits in a few lines, and reading them is the fastest way to
internalise the FEL/clock model from [01 · What it is](./01_what-it-is.md). A SimPy process is a Python
generator; each `yield` is a point where the entity *waits* and the engine advances the clock:

```python
import simpy

def patient(env, name, nurses, treat_time):
    arrive = env.now
    with nurses.request() as req:      # join the queue for a nurse (a Resource)
        yield req                      # WAIT here until a nurse is free  (FEL handles it)
        wait = env.now - arrive        # measured waiting time
        yield env.timeout(treat_time)  # HOLD the nurse for the treatment duration
    # leaving the `with` block releases the nurse; the next waiting patient is served
```

`nurses` is a `simpy.Resource(env, capacity=c)` — the limited resource that creates the queue. The two
`yield`s are the only places the entity gives time back to the engine; everything else is instantaneous
state change. Many `patient` processes run "concurrently", but the FEL serialises them onto a single
simulated clock. This is the entire mental model — the lab's engine wraps it with seeding, a trace
schema, and the live/precompute gate (in `simlab/core/`), and each scenario module (in
`simlab/scenarios/`) is a variation on it.

Mapping the snippet back to the five concepts:

- the **entity** is the `patient` process instance;
- the **resource** is `nurses`;
- the **events** are the implicit "nurse becomes free" and the explicit `env.timeout(treat_time)`
  completion;
- the **future-event list** is what `with ... request()` and `timeout` schedule into, invisibly;
- the **clock** is `env.now`, which only moves at the two `yield`s.

The full API walkthrough — `Environment`, `Process`, `Timeout`, `Resource`, `PriorityResource`, the
determinism contract, and a runnable example with captured output — is in the
[SimPy usage node](../../frameworks/01_simpy/02_usage.md); how to *formalize* a DES and solve it the
honest way (warm-up + replications + CI) is in [SimPy applying](../../frameworks/01_simpy/03_applying.md).

## Next

- [04 · The honesty curriculum](./04_honesty-curriculum.md) — why each KPI above must be reported as a
  distribution with a CI, after a warm-up.
- [05 · The DES toolbox](./05_tools.md) — which engine produces these KPIs, and which anchors them
  against closed-form theory.
- Back to the [DES section index](../01_discrete-event-simulation.md).
