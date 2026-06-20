# S02 Schelling — formalization

← Back to the node index: [../02_s02_schelling.md](../02_s02_schelling.md) ·
Prev: [01_assumptions.md](./01_assumptions.md) · Next: [03_solvers-applied.md](./03_solvers-applied.md)

The math below is the **verified** formalization, taken from the scenario's Context block in the Experiments
page and kept consistent with the code in
[`s02_schelling.py`](../../../simlab/scenarios/s02_schelling.py). LaTeX is shown inline as plain math so the
node is readable as Markdown; the live Theory page renders the same equations with KaTeX.

---

## 1. Model class

A **lattice agent-based model (ABM)** with **asynchronous, relocation-driven activation**. There is no
closed-form solver and no objective to optimize: in ABM the **run *is* the answer** — you build the local
rule and observe the global pattern it produces. (`analytic = {}` in the trace, by design.)

## 2. Sets

- Cells: a square lattice C = { (x, y) : 0 ≤ x, y < n }, with n the grid size.
- States per cell: { empty = 0, A = 1, B = 2 } (verified `EMPTY, A, B = 0, 1, 2`).
- Agents: the set of households, one per occupied cell, each carrying a fixed group label c_i ∈ { A, B }.
- For an agent i at position pos_i, let **N_i** = its set of *occupied* Moore neighbours (the occupied cells
  among the 8 surrounding cells; off-grid cells do not exist because `torus=False`).
- The non-isolated, scored set: 𝒜 = { i : c_i ≠ 0 and |N_i| > 0 }.

## 3. Parameters

| Parameter | Symbol | Role |
|---|---|---|
| Grid size | n | lattice is n × n |
| Empty fraction | e | share of cells left vacant at init (a cell is occupied iff its seeded draw ≥ e) |
| Tolerance | τ | minimum own-type fraction an agent demands (the single behavioural threshold) |
| Max steps | T | hard cap on relocation rounds |
| Seed | — | seeds the RNG; with it, the run is reproducible |

## 4. State & decision variables

**State** is the full grid configuration each step: every cell's value in { 0, 1, 2 }. The frame trace
stores this as a row-major flat array of state codes (`grid_snapshot()` → `cells[y*n + x] = group`).

**Per-agent derived variables** (computed each step, not free parameters):

- Same-type fraction over occupied neighbours:

  `s_i = |{ j ∈ N_i : c_j = c_i }| / |N_i|`,  for |N_i| > 0.

- The happiness / unhappiness indicator and the **decision** to move:

  `u_i = 1[ s_i ≥ τ ]`,   **move i ⇔ u_i = 0** (i.e. move iff `s_i < τ`, a *strict* threshold).

  An isolated agent (|N_i| = 0) is taken to be content by convention and never moves.

The "decision variable" of the ABM is thus this binary relocate/stay choice each agent makes from its own
local view — there is no global decision vector being optimized.

## 5. Dynamics (the step)

Each step is a **simultaneous batch update** (verified in `relocate()` and the `run()` loop):

1. **Evaluate.** For every agent compute s_i; collect the unhappy set U = { i : |N_i| > 0 and s_i < τ }.
   (`segregation_and_unhappy()` returns both the segregation index and U in one pass.)
2. **Stop test.** If U is empty (everyone content) **or** the step index has reached T, stop — the system
   has converged or hit the cap.
3. **Relocate.** Otherwise move every unhappy agent to a random empty cell: take the grid's empties as a
   *sorted* list (stable order), seeded-shuffle them, seeded-shuffle the movers, and assign one-to-one;
   each just-vacated cell is appended back so it becomes available to later movers in the same step. All
   shuffles use the seeded `self.random`, so the batch update is deterministic regardless of set iteration
   order.

The loop records a frame **before** each evaluation, so frame t is the configuration at the start of round t
(the initial random board is frame 0).

## 6. Macro-observables / KPIs

The model's headline macro-observable is the **segregation index** — the mean same-type fraction over the
non-isolated agents:

`S = (1/|𝒜|) · Σ_{i ∈ 𝒜} s_i`,   𝒜 = { i : c_i ≠ 0, |N_i| > 0 }.

It also logs, per step, the **happy fraction** `1 − n_unhappy / n_agents` (where n_agents = total agents,
floored at 1 to avoid division by zero). Both are emitted as time series (`series.segregation`,
`series.happy`, with `series.x` = step index).

**Emergence** is the empirical claim `S ≫ τ` at (near-)stationarity for moderate τ: the collective
self-organizes far above what any single agent demands. As a function of τ the converged S is
**phase-transition-shaped** with a *tipping point* τ_c — a small rise in tolerance produces a qualitative
jump in global segregation.

The committed KPI block (from `run()`), surfaced in the app HUD, is:

| KPI | Definition |
|---|---|
| `final_segregation` | S at the last recorded step |
| `final_happy_frac` | happy fraction at the last recorded step |
| `steps_run` | the step index at which the loop stopped (converged or cap) |
| `tolerance` | the run's τ (echoed for comparison against S) |

The key reading: **`final_segregation` much larger than `tolerance` is the fingerprint of emergence.**

Continue to how Mesa solves it → [03_solvers-applied.md](./03_solvers-applied.md).
