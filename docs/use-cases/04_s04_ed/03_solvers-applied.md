# 03 · Solvers applied — S04 Emergency Department Patient Flow

Which dedicated tool solves S04 and *how* — the concrete API and approach, why this tool, and the
live-vs-precompute lane for this scenario. The model itself: [02 · Formalization](./02_formalization.md).
Up: [the S04 index](../04_s04_ed.md).

## The tool: SimPy (process-interaction DES)

S04 is solved by **[SimPy](../../frameworks/01_simpy.md)** — the lab's primary, pure-Python, process-based
discrete-event-simulation engine (`engine = "simpy"` in the scenario). There is *no optimizer* here: a
priority queueing network with non-stationary arrivals has no closed form and nothing to "search," so the
job is to **simulate the flow and measure it**. SimPy is exactly the right class of tool for "entities
flowing through activities and queues for limited resources under randomness."

The full framework node (install / usage / applying + a verified `example.py`) is
[01 · SimPy](../../frameworks/01_simpy.md); the API surface used below is documented in its
[02 · usage](../../frameworks/01_simpy/02_usage.md) page, and the formalize-then-solve discipline in its
[03 · applying](../../frameworks/01_simpy/03_applying.md) page (Pattern A — *simulate-and-measure*).

## How it solves it (the concrete approach)

Each of the five DES elements maps to one SimPy construct, and the S04 code is that mapping made literal:

| DES element | SimPy construct | In `s04_ed.py` |
|---|---|---|
| Entity (patient) | a generator run as `env.process(...)` | `def patient(pid, prio): …` |
| FCFS resource (triage) | `simpy.Resource(env, capacity=cₜ)` | `triage = simpy.Resource(env, capacity=ct)` |
| **Priority** resource (treatment) | `simpy.PriorityResource(env, capacity=cₓ)` | `treat = simpy.PriorityResource(env, capacity=cx)` |
| Waiting + holding | `yield req` / `yield env.timeout(d)` | `yield req`, `yield env.timeout(tri_svc[pid])`, … |
| The clock + FEL | `simpy.Environment()` + `env.run()` | the single event loop |

The two key API moves:

1. **The treatment priority is `PriorityResource`.** A patient requests a bay with its class as the
   priority key — `with treat.request(priority=prio) as req: yield req`. Because the priority code is
   **0 = urgent, 1 = standard** and SimPy serves the *lowest* index first, urgent patients jump the
   treatment queue. The request is **non-preemptive**: it reorders who is granted the *next* free bay, but
   never evicts a patient already in service.

2. **Arrivals are injected by a single `source` process.** `source` walks the pre-sampled `arrivals[]`
   epochs and, for each, `yield env.timeout(max(0.0, arrivals[i] - env.now))` then
   `env.process(patient(i, prios[i]))`. The arrival *epochs* are computed up front by thinning (see
   [02 · Formalization §1](./02_formalization.md#1--non-stationary-arrivals-via-thinning-lewisshedler));
   `source` only replays them onto the clock, so the non-stationary intensity lives entirely in the
   pre-sampled data, not in the scheduler.

**Determinism by design.** All randomness comes from one seeded NumPy generator (`make_rng(seed)`), and
**every variate is drawn before `env.run()`**: the candidate interarrivals, the Bernoulli urgent flags
(`prios`), and both exponential service vectors (`tri_svc`, `trt_svc`). This is the lab's RNG discipline —
draw up front so the result depends only on `(params, seed)`, never on event-scheduler interleaving. The
run emits a **`FlowTrace`** (`simlab.flowtrace/v1`): an ordered list of stations (each with its capacity
`c`), a 2-class legend (urgent = red, standard = accent), and a timeline of events
(`arrival`, `triage_start`, `triage_end`, `treat_start`, `treat_end`, `depart`), each carrying the patient
`id` and `prio`. From that timeline the web `FlowViz` reconstructs, at any time `t`, the queue + in-service
population at every station and animates patients flowing through the pipeline. KPIs are accumulated in
plain Python (`los`, `los_u`, `los_s`, `wait_treat`) and reduced with `statistics.fmean`.

## Why SimPy (and not something else)

- **It matches the problem class.** S04 is a contention/waiting problem — the textbook DES use case. An
  optimizer (OR-Tools/PyVRP) would be the wrong tool: DES *evaluates* a configuration under uncertainty, it
  does not *search* for the best one.
- **Priority and multi-stage are first-class.** `PriorityResource` gives head-of-line priority directly,
  and chaining two `with resource.request()` blocks expresses a tandem network in a few lines — no custom
  FEL bookkeeping.
- **No closed form to lean on.** Unlike S01 (a single M/M/c with an Erlang-C overlay via
  [Ciw](../../frameworks/02_ciw.md)), the S04 priority + non-stationary model has *no* analytic answer — so
  simulation is the only honest measure. S04 is precisely where the S01 → S04 ramp teaches "theory ran
  out, now trust the CI."
- **Pure-Python, browser-runnable.** SimPy has zero third-party deps and runs inside Pyodide, which is what
  lets this scenario be **live** (below).

The DES alternatives and when they'd win instead are tabulated in the SimPy
[applying page §3](../../frameworks/01_simpy/03_applying.md#3-when-to-pick-something-else-and-the-alternatives)
and the [DES problem-type guide](../../problem-types/01_discrete-event-simulation.md).

## The lane: **live**

S04 runs in the **live** lane — it computes in-browser in a Pyodide Web Worker; move a slider and SimPy
re-runs and the flow re-animates. It clears all four conditions of the lab's
[4-gate](../../architecture/03_the-gate.md):

- **pure-Python** — `pure_python = True`; SimPy + NumPy import under Pyodide;
- **wheels ⊆ live set** — `wheels = ["simpy", "numpy"]`, both in `LIVE_WHEELS`;
- **fast** — a few-hundred-patient shift finishes well under the 3 s run gate;
- **small** — it emits a trace far under the ~1 MB trace gate.

The gate is structural (`classify_lane` in `simlab/core/scenario.py`) and CI enforces it, so S04 cannot
silently ship as "live" if it ever breached a gate.

**The replications-and-CI lesson lives in its sibling, not in S04 itself.** When you want the *honest
distribution* rather than one live draw, the **same M/M/c model class** is replicated across many seeded runs
in **S10** (Monte-Carlo / CI study) — note S10 uses a fast NumPy heap estimator (`mmc_mean_wait`), a
*different engine* from S04/S01's SimPy `Resource` simulation, parallelised with
[joblib](../../frameworks/12_joblib.md) and reduced to CIs with [scipy.stats](../../frameworks/13_scipy-stats.md).
S10 is itself a **live** scenario (its wheel closure `numpy/joblib/scipy` is in `LIVE_WHEELS`); a seed-42 CI
sweep is also committed for the deterministic gallery. S04 lets you *feel* one shift live; S10 turns the
M/M/c base model into the replications-and-CI lesson. See the SimPy applying page
[§5 (live vs precomputed)](../../frameworks/01_simpy/03_applying.md#5-where-simpy-runs--live-vs-precomputed).

Continue to [04 · Results & reading](./04_results-and-reading.md).
