# 01 · SimPy — the primary discrete-event simulation engine

**SimPy** (MIT, pinned `4.1.2`) is a pure-Python, **process-based discrete-event simulation (DES)**
library and the lab's primary DES engine. You describe each entity's life-story as a Python generator
that `yield`s — `yield env.timeout(d)` to let simulated time pass, `yield resource.request()` to wait
for a limited shared server — and a single event loop advances one simulated clock from event to event.
It has **zero third-party dependencies** and runs entirely on CPU, which is exactly why it ships in the
lab's **core** requirements and is small enough to load inside the browser via Pyodide. It is *headless*
by design: the engine emits a structured event trace, the React front end owns the pixels.

Reach for SimPy whenever the system is **entities flowing through activities and queues for limited
resources under randomness**, and the *waiting* — not a single best decision — is what you want to
measure (throughput, waiting time, utilization). In CAOS_SIMLAB it is the engine behind the whole DES
half of the curriculum: it runs the **live, in-browser** queueing scenarios (S01 bank/clinic M/M/c,
S04 emergency-department flow), it is the **"simulate" leg** of the optimize-then-simulate hybrids
(S07/S08/S09/S11 — *the optimizer proposes, the simulator disposes*), and it is the **base model** the
Monte-Carlo CI study (S10) replicates across thousands of seeds. Light models stay live; heavy runs
(long horizons, big fleets, many replications) use the **same engine** moved to the precompute lane and
ship as a committed, replayable trace.

## Read in order

1. [01 · Installation](./01_simpy/01_installation.md) — exact pip line (`simpy==4.1.2`), why it lives
   in the **core** `requirements.txt` (not precompute/gpu), zero transitive deps, and the
   Python / OS / Pyodide / no-CUDA platform notes.
2. [02 · Usage](./01_simpy/02_usage.md) — the whole API in five concepts (`Environment`, `Process`,
   `Timeout`, `Resource`, `PriorityResource`), the event-loop mental model, the determinism contract,
   and the runnable example walked through with its **real captured output**.
3. [03 · Applying](./01_simpy/03_applying.md) — how to **formalize** a DES (the five-element template)
   and solve it the honest way (warm-up + replications + CI), the three patterns SimPy slots into,
   live-vs-precompute gating, the research trade-offs, and exactly which scenarios use it.

## Example

- [`example.py`](./01_simpy/example.py) — a complete **M/M/c queue** (the DES "hello world"): Poisson
  arrivals, a pool of `c` servers, a FIFO queue, exponential service, a warm-up, and a side-by-side
  check against the closed-form Erlang-C mean wait. Run it from the repo root:

  ```bash
  .venv/Scripts/python.exe docs/frameworks/01_simpy/example.py
  ```

  Its verified, deterministic output is captured in
  [02 · Usage §4](./01_simpy/02_usage.md#4-verified-output).

## Scenarios that use it

- **S01 — Bank / Clinic Queue (M/M/c)** — primary live engine: arrivals, server pool, FIFO queue, ρ,
  Little's Law; paired with [Ciw](./02_ciw.md) for the closed-form analytic overlay. *(live)*
- **S04 — Emergency Department Patient Flow** — non-stationary arrivals, priority triage, multi-stage
  resource-limited flow; no closed form → replications + CI + warm-up. *(live)*
- **S07 — Construction Haul Routing** *(DES leg)* — replays trucks under stochastic load/dump/delay on
  a fixed [OR-Tools](./08_ortools.md) plan. *(precomputed)*
- **S08 — Last-Mile Delivery VRP** *(DES leg)* — replays optimized [PyVRP](./09_pyvrp/02_usage.md)
  routes with travel-time noise; exposes time-window violations. *(precomputed)*
- **S09 — Ambulance Dispatch** *(DES leg)* — many stochastic call streams over a city graph;
  response-time distributions from replicated runs. *(precomputed)*
- **S10 — Monte-Carlo Replication / CI Study** — SimPy is the base model (reuses S01/S04), replicated
  across thousands of seeds to draw CI envelopes vs the naive single run. *(precomputed)*
- **S11 — LP/GLOP hybrid** *(DES leg)* — simulates the system under the GLOP-optimized allocation to
  report realised outcomes under uncertainty. *(precomputed)*

## Related

- [DES problem-type guide](../problem-types/01_discrete-event-simulation.md) — the decision map for the
  whole discrete-event half of the lab.
- [Monte-Carlo replications guide](../problem-types/04_monte-carlo-replications.md) ·
  [Optimization & routing guide](../problem-types/03_optimization-routing.md) — where SimPy is the
  replicated base model and the "simulate" leg, respectively.
- Sibling DES engines: [Ciw](./02_ciw.md) (closed-form analytic anchor) ·
  [Salabim](./03_salabim.md) (offline animation / video). For emergent peer-interaction behaviour use
  [Mesa](./04_mesa.md) (ABM) instead.
- [architecture.md](../architecture.md) — the two-lane, replay-is-truth design that decides when SimPy
  runs live vs precomputed.
