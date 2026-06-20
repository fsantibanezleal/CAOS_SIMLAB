# 02 · Ciw — queueing-network DES with analytic validation

**Ciw** (MIT, pinned `3.2.7`) is a pure-Python discrete-event simulation library
specialised for **open queueing networks** — multi-node, multi-class systems with
routing, blocking, baulking, reneging and server schedules. You describe the network
declaratively (arrival process, service process, server count, routing), run it to a
horizon, and read back per-customer records. It is *headless* by design: it produces an
event trace, not pictures, which is exactly the contract this lab wants — the Python
engine is the physics, the browser owns the animation.

Reach for Ciw when the problem **is** a queueing network *and* you want to **validate the
simulation against queueing theory**. That is its distinguishing strength: the classical
queues it simulates (M/M/1, M/M/c, Jackson networks) have **closed-form** answers, so a
Ciw run can be checked against the math side-by-side. In CAOS_SIMLAB that powers the
**queueing-theory teaching block**: scenario **S01** runs an M/M/c teller queue in Ciw and
benchmarks the mean wait against the closed-form Erlang-C `Wq`, publishing the agreement
(value + 95% CI + a "PASS") as the didactic artifact. Ciw is a **secondary teaching
chapter** — [SimPy](./01_simpy.md) is the lab's primary live engine and drives S01's animation;
Ciw provides the theory anchor. Because it sits in the **precompute lane**, it runs offline
and the live site serves the committed result.

## Read in order

1. [01 · Installation](./02_ciw/01_installation.md) — exact pip line (`ciw==3.2.7`), the
   precompute requirements lane, transitive deps (numpy / networkx / optional pandas),
   platform & CUDA notes.
2. [02 · Usage](./02_ciw/02_usage.md) — the real API (`create_network`, `ciw.dists`,
   `ciw.seed`, `Simulation`, `get_all_records`), the Erlang-C validation idea, and the
   runnable example walked through with its **real captured output**.
3. [03 · Applying](./02_ciw/03_applying.md) — how to formalize a queueing problem, the
   simulate-then-validate pattern, the research trade-offs, when to pick Ciw vs SimPy /
   Salabim, and how to extend S01 beyond the closed form.

## Example

- [`example.py`](./02_ciw/example.py) — M/M/c validation: 30 seeded replications vs the
  Erlang-C closed form, with a 95% CI. Run it from the repo root:

  ```bash
  .venv/Scripts/python.exe docs/frameworks/02_ciw/example.py
  ```

## Scenarios that use it

- **S01 — Bank / Clinic Teller Queue (M/M/c)** — Ciw provides the analytic M/M/c
  validation anchor; SimPy drives the live animation. Module: `simlab/scenarios/s01_queue.py`.

## Related

- [DES problem-type guide](../problem-types/01_discrete-event-simulation.md) — the decision
  map for the whole discrete-event half of the lab.
- Sibling DES engines: [SimPy](./01_simpy.md) (primary live engine) ·
  [Salabim](./03_salabim.md) (offline animation / video).
- [architecture.md](../architecture.md) · [precompute pipeline](../guides/01_precompute-pipeline.md)
  — the two-lane, replay-is-truth design that makes Ciw a precompute-lane tool.
