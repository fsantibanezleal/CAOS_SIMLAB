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
half of the curriculum: it runs the **live, in-browser** queueing scenarios (S01 bank/clinic M/M/c — where
SimPy is the live engine and Ciw the in-run cross-check — and S04 emergency-department flow), it drives the
**live** ambulance dispatch DES (S09, SimPy + NetworkX), and it is the **simulate leg** of the
optimize-then-simulate hybrids whose optimizer is native OR-Tools (S07 and S11 — *the optimizer proposes,
the simulator disposes*). In those hybrids the shipped SimPy legs are **deterministic** (fixed service
times; contention from shared finite resources, not random variates). The two hybrids split differently on
the lane: **S07 runs live by replay** — its native OR-Tools/NetworkX route plan is precomputed offline and
**committed as data** (`s07_plans.py`), then the pure-Python SimPy replay over that fixed plan runs **live**
in the browser; **S11** ships the SimPy leg as a **precomputed, replayed trace** (the GLOP-optimized
allocation). (S08 has **no** SimPy leg — it is a deterministic OR-Tools-vs-PyVRP head-to-head.) The M/M/c
base model also feeds the Monte-Carlo CI study (S10). Pure-Python SimPy models stay live — including a
replay over a committed native plan (S07); a leg falls to the precompute lane only when its trace is itself
precomputed and replayed (S11) or when it breaches a gate.

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
- **S04 — Emergency Department Patient Flow** — synthetic **non-stationary (Lewis–Shedler thinned) Poisson**
  arrivals with one fixed surge window over the middle of the shift (`[0.30H, 0.60H)`, where λ doubles);
  **FCFS triage** (`simpy.Resource`) then a **non-preemptive priority treatment** station
  (`simpy.PriorityResource`), multi-stage resource-limited flow; no closed form → replications + CI +
  warm-up. *(live)*
- **S07 — Construction Haul Routing** *(DES leg)* — a **deterministic** SimPy DES of the closed
  finite-source haul cycle (fixed load/dump times, inert seed) over the route certified by
  [OR-Tools](./08_ortools.md) CP-SAT; saturation comes from the shared finite loader, not random variates.
  The native route plan is precomputed offline and **committed** (`s07_plans.py`); only the pure-Python
  SimPy replay runs in the browser. *(live — SimPy replay over a committed native plan)*
- **S08 — Last-Mile Delivery VRP** — **no SimPy leg.** S08 is a deterministic two-solver head-to-head
  (OR-Tools vs [PyVRP](./09_pyvrp.md)) replayed from a committed trace. *(precomputed — native code)*
- **S09 — Ambulance Dispatch** — SimPy + [NetworkX](./10_networkx.md), **live**. One seeded Poisson call
  stream drives nearest-available dispatch; the DES is the event-ordering mechanism (variates drawn up front
  from one seeded RNG), not a stochastic stress-test. No OR-Tools. *(live)*
- **S10 — Monte-Carlo Replication / CI Study** — the base M/M/c model (a fast heap-based estimator, same
  model class as S01 but a different engine) replicated across seeds via [joblib](./12_joblib.md) to draw CI
  envelopes vs the naive single run. *(live)*
- **S11 — LP/GLOP hybrid** *(DES leg)* — a **deterministic** SimPy DES of the haul system under the
  GLOP-optimized allocation (no stochastic variates). *(precomputed — native OR-Tools)*

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
