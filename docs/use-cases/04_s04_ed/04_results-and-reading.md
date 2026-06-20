# 04 · Results & reading — S04 Emergency Department Patient Flow

The shipped regimes, what the KPIs reveal, and how to read the flow visualization. The KPIs are defined in
[02 · Formalization](./02_formalization.md#kpis-the-reported-outputs); how they're produced in
[03 · Solvers applied](./03_solvers-applied.md). Up: [the S04 index](../04_s04_ed.md).

## The ten variants (regimes)

Each variant fixes μₜ = 3.0, μₓ = 0.8, n = 240 and sweeps the knobs around the typical shift (the exact
parameter sets are in [`s04_ed.py`](../../../simlab/scenarios/s04_ed.py) `variants()`):

| id | label | λ | cₜ | cₓ | s | pᵤ | What it shows |
|---|---|---|---|---|---|---|---|
| `calm` | Calm shift | 1.2 | 2 | 3 | 0 | 0.25 | Light arrivals: short stays, little waiting. |
| `typical` | Typical shift | 2.0 | 2 | 3 | 0 | 0.25 | Busy but stable; treatment is the bottleneck. |
| `busy` | Busy shift | 2.3 | 2 | 3 | 0 | 0.25 | Treatment near capacity — queues build. |
| `overloaded` | Overloaded | 2.9 | 2 | 3 | 0 | 0.25 | Demand exceeds treatment capacity: the ED backs up. |
| `surge` | Daytime surge | 2.0 | 2 | 3 | **1** | 0.25 | A mid-shift arrival surge stresses the system transiently. |
| `understaffed` | Understaffed treatment | 2.0 | 2 | **2** | 0 | 0.25 | One fewer bay: the bottleneck tightens sharply. |
| `wellstaffed` | Well-staffed | 2.3 | 2 | **4** | 0 | 0.25 | An extra bay absorbs the busy load. |
| `triage_bottleneck` | Single triage nurse | 2.0 | **1** | 3 | 0 | 0.25 | Triage becomes the upstream bottleneck. |
| `high_urgent` | Many urgent | 2.0 | 2 | 3 | 0 | **0.45** | More urgent patients: priority reshapes who waits. |
| `low_urgent` | Few urgent | 2.0 | 2 | 3 | 0 | **0.10** | Few urgent patients: priority rarely bites. |

Three orthogonal axes are being swept:

- **Load (λ): `calm` → `typical` → `busy` → `overloaded`** drives treatment utilization
  `ρ = λ/(cₓ·μₓ)` from slack toward and past 1. At ρ = 0.5 (calm), 0.83 (typical), 0.96 (busy), 1.21
  (overloaded) — once ρ ≥ 1 the queue is unstable and LOS blows up nonlinearly (the headline DES lesson,
  carried over from S01).
- **Staffing (cₓ, cₜ): `understaffed` / `wellstaffed`** move the *bottleneck* bay count (one fewer tightens
  it, one more absorbs the busy load), and **`triage_bottleneck`** drops cₜ to 1 to move the bottleneck
  *upstream* — the one variant where the triage wait, not the treatment wait, dominates LOS.
- **Urgent mix (pᵤ): `high_urgent` / `low_urgent`** change how often the priority discipline bites — with
  more urgents, priority reshapes *who* waits; with few, it barely shows.
- **Surge (s): `surge`** turns on the mid-shift intensity spike to expose *transient* stress at the same
  average load as `typical`.

## What the KPIs show

Five KPIs surface in the app's grid (`ED_KPI`): **LOS**, **LOS urgent**, **LOS standard**, **Wait treat.**,
and **ρ treat.** Read them together:

- **ρ treat. is the stability dial.** It's the offered load on the bottleneck, `λ/(cₓ·μₓ)`. Below 1, the
  system settles; as ρ → 1 the treatment queue and the mean wait grow steeply; at ρ ≥ 1 (`overloaded`)
  the ED genuinely backs up. Note ρ depends only on λ, cₓ, μₓ — so `understaffed` (cₓ = 2 → ρ = 1.25) is
  unstable even at the typical λ, while `wellstaffed` (cₓ = 4 → ρ = 0.72) stays comfortable at the busy λ.
- **Wait treat. measures bottleneck severity.** The mean time to be *granted a bay* is the cleanest read on
  how bad the bottleneck is — it climbs sharply as ρ → 1, and it is where the priority discipline does its
  work.
- **LOS urgent vs LOS standard makes priority visible.** This is the priority payload: raising pᵤ
  (`high_urgent`) pulls **LOS urgent down at the expense of LOS standard** — urgents jump the treatment
  queue, so standards wait longer. With `low_urgent`, the two converge: priority rarely changes anyone's
  position. Crucially, priority **reorders** who waits, it doesn't add capacity — total mean LOS is driven
  by ρ, not by the mix.
- **LOS (total) is the headline.** Total time-in-system rises with load and tightens with each removed bay;
  `triage_bottleneck` shows that the limiting station need not be treatment — starving triage stretches LOS
  upstream even though ρ_treat is unchanged.

> **Honesty caveat.** Every number here is **one seeded run** — a single noisy draw, not the answer.
> Re-seed and the means move. The honest, replicated-with-confidence-interval version of these same
> S01/S04 models is **S10** (Monte-Carlo CI study), and the reason is the whole
> [DES honesty curriculum](../../problem-types/01_discrete-event-simulation/04_honesty-curriculum.md):
> report a distribution after a warm-up, never a single run.

## How to read the visualization

The renderer is the lab's **flow** viz (`viz = "flow"`), driven by the `FlowTrace` timeline:

- **Three stations, left to right: triage → treatment → discharge.** Patients enter at the left and flow
  rightward through the pipeline. Each station shows its **queue** (patients waiting) and its **in-service**
  slots (up to its capacity `c`: cₜ nurses, cₓ bays).
- **Color = class.** **Red** = urgent, **blue/accent** = standard (the trace's `legend`). At the treatment
  station you can literally watch red patients jump ahead of blue ones in the queue — the priority
  discipline in action — most visibly in `high_urgent`.
- **Queue length = where waiting accumulates.** The length of each station's queue tells you where the
  system is choking. Watch the **treatment** queue grow as you step from `calm` to `overloaded` (ρ → 1);
  switch to `triage_bottleneck` and the long queue moves **upstream** to triage instead.
- **The HUD/KPIs tie it together.** As the animation runs, the LOS / LOS-urgent / LOS-standard / wait /
  ρ readouts update; cross-reading the growing treatment queue against rising ρ and Wait-treat is the
  intended "aha" — the bottleneck you *see* is the bottleneck the numbers *measure*.

The reading rule: **the animation is a hypothesis generator, not evidence.** Use it to build intuition and
catch gross errors; trust the *claim* to the replicated statistics (S10), never to "it looked busy."

Back to [the S04 index](../04_s04_ed.md) · or jump to [01 · SimPy](../../frameworks/01_simpy.md) /
the [DES guide](../../problem-types/01_discrete-event-simulation.md).
