# S06 — Results, variants & how to read the viz

> Use-case node: [06_s06_jobshop](../06_s06_jobshop.md) · prev:
> [03_solvers-applied.md](./03_solvers-applied.md)

## The variants (regimes)

S06 ships **ten variants**: the `ft06` benchmark plus nine seeded generated instances chosen to probe
**machine contention** (jobs competing for a limited set of machines). The variants are declared in
[`simlab/scenarios/s06_jobshop.py`](../../../simlab/scenarios/s06_jobshop.py) (`variants()`).

| Variant | Shape | Regime | What it shows |
|---|---|---|---|
| `ft06` | 6 × 6 | benchmark | The classic Fisher–Thompson (1963) reference — proven optimum 55. |
| `j3m3` | 3 × 3 | tiny | Instantly optimal; the smallest instance. |
| `j4m3` | 4 × 3 | jobs > machines | More jobs than machines — contention rises. |
| `j4m4` | 4 × 4 | square | A balanced small shop. |
| `j5m4` | 5 × 4 | jobs > machines | Machines become the binding constraint. |
| `j5m5` | 5 × 5 | square | A square 5×5 shop. |
| `j6m4` | 6 × 4 | heavy contention | Many jobs squeezed onto few machines. |
| `j6m6` | 6 × 6 | square | A 6×6 generated instance. |
| `j8m4` | 8 × 4 | heavy contention | Many jobs queue for few machines. |
| `j4m6` | 4 × 6 | machines > jobs | More machines than jobs. |

## The verified KPIs (committed traces, seed 42)

These are read directly from `data/artifacts/s06_jobshop/<variant>-seed42.json` — **all ten solve to
`OPTIMAL`**.

| Variant | Jobs | Machines | Ops | Makespan $C_{\max}$ | Utilization | Optimal? |
|---|---:|---:|---:|---:|---:|:--:|
| `ft06` | 6 | 6 | 36 | **55** | 0.597 | yes |
| `j3m3` | 3 | 3 | 9  | 22 | 0.652 | yes |
| `j4m3` | 4 | 3 | 12 | 39 | 0.658 | yes |
| `j4m4` | 4 | 4 | 16 | 35 | 0.700 | yes |
| `j5m4` | 5 | 4 | 20 | 41 | 0.701 | yes |
| `j5m5` | 5 | 5 | 25 | 48 | 0.604 | yes |
| `j6m4` | 6 | 4 | 24 | 32 | **0.891** | yes |
| `j6m6` | 6 | 6 | 36 | 46 | 0.630 | yes |
| `j8m4` | 8 | 4 | 32 | **60** | 0.821 | yes |
| `j4m6` | 4 | 6 | 24 | 49 | **0.469** | yes |

## What the KPIs show

- **`ft06` reproduces the literature.** The solved makespan is exactly **55**, the proven optimum — a sanity
  check that the model and the deterministic solve are correct.
- **Contention pushes utilization up; idle machines pull it down.** Utilization is
  $\frac{\sum d_{j,k}}{C_{\max}\cdot m}$ — the fraction of the Gantt area actually occupied. The
  heavy-contention instances pack machines tightest: **`j6m4` hits 0.891** and **`j8m4` 0.821** (many jobs,
  four machines — little idle time). The opposite extreme is **`j4m6` at 0.469**: with more machines than
  jobs, lots of machine-time sits idle, so the Gantt is sparse.
- **Makespans are *not* comparable across variants — read *within* an instance.** Because every generated
  job routes through *all* machines, total work $\sum d_{j,k}$ differs from instance to instance, so a bigger
  makespan does not mean a "harder" or "worse" result. The honest reading is *inside* one instance: how
  machine contention stretches the Gantt and where the idle gaps fall.
- **The "more machines = short makespan" intuition is wrong here — and the data proves it.** One might
  expect `j4m6` (machines > jobs) to finish quickly. It does not: at **49** it is one of the *longest*
  makespans, because each of its 4 jobs is a **6-operation chain** and the chain length, not the machine
  count, dominates. This is the adversarially-audited correction baked into the on-site Context block — the
  narrative was made to match the committed numbers, not the other way around.

## How to read the visualization (Gantt)

The viz is a **Gantt chart** (renderer `gantt`, 2D), driven by the trace's `ops` list:

- **Rows = machines** $M_i$ (labels `M1…Mm`). **Each block = one operation.**
- **Color = job** — one color runs through *all* operations of a given job, so you can trace a job hopping
  from machine to machine in its required order.
- **Block width = duration** $d_{j,k}$. **Gaps in a row = idle time** on that machine (a machine waiting for
  the next operation whose predecessor hasn't finished, or simply no work to do).
- **The animation sweeps a timeline left→right** as if the schedule were executing; the **final line marks
  $C_{\max}$** (where the last block ends).
- **The HUD / KPIs** show makespan, whether it is optimal, jobs / machines / operations, and utilization.

Reading tips: a densely packed Gantt with few gaps means high utilization (the machines are the
bottleneck — e.g. `j6m4`); a sparse Gantt with wide gaps means the *precedence chains*, not the machines,
set the makespan (e.g. `j4m6`). The single critical path — the chain of operations with no slack that fixes
$C_{\max}$ — is what an optimizer is squeezing; everything else has room to slide without changing the
finish time.

## Where this sits in the lab

S06 is the **optimize-only anchor**: a solver with no simulation, so a learner sees clearly what "just
optimizing" produces — a provably-best plan on deterministic inputs — *before* the paired scenarios
(S07–S09 routing, S11 mine-haul) complicate it by handing the optimized plan to a SimPy DES and watching it
degrade under uncertainty (the **optimize-then-simulate** bridge). See the
[Optimization & Routing guide](../../problem-types/03_optimization-routing.md) and the
[OR-Tools node](../../frameworks/08_ortools.md).
