# 01 · Assumptions — S03 SIR Epidemic

← Back to the use-case index: [../03_s03_sir.md](../03_s03_sir.md)

This page fixes the **canonical instance** the scenario solves and states precisely **what is and isn't
modeled**. Everything here is read off the verified scenario source
([`s03_sir.py`](../../../simlab/scenarios/s03_sir.py)) and the in-app Context block — nothing is invented.

---

## The canonical instance

The **Kermack–McKendrick (1927) SIR model**, in its **agent-based (cellular-automaton) form**: each cell of
a square grid is one individual whose health state is **S** (susceptible), **I** (infected) or **R**
(recovered). Infection spreads only by *local contact* between neighbouring cells; recovery confers
permanent immunity. The question is the shape of the epidemic that *emerges* from these per-cell rules — not
a decision to optimize, but a dynamic to observe.

The default instance (the slider mid-points in the code):

| Element | Default | Where it lives |
|---|---|---|
| Grid / population | `n × n = 38 × 38` (1 444 cells, one agent each) | `ParamSpec("size", …, 38, 10, 60)` |
| Infection prob. per infected neighbour `β` | `0.20` (range 0.02–0.6) | `ParamSpec("beta", …, 0.20, …)` |
| Recovery prob. per step `γ` | `0.20` (range 0.02–0.6) | `ParamSpec("gamma", …, 0.20, …)` |
| Initial infected fraction `i₀` | `0.02` (range 0.002–0.2) | `ParamSpec("init_infected", …, 0.02, …)` |
| Max steps | `80` (range 20–160) | `ParamSpec("steps", …, 80, …)` |
| Neighbourhood | 8-cell **Moore**, **non-toroidal** | `SingleGrid(size, size, torus=False)`, `iter_neighbors(moore=True)` |

The grid is **fully occupied** — `SingleGrid` with exactly one `SIRAgent` per cell (`n²` agents). It is
seeded at start: each cell is set Infected if a seeded draw `< i₀`, else Susceptible; if no cell ignites,
a single fixed cell is forced to Infected so the run isn't inert (`states[n_cells // 2] = I` — flat index
`n²//2`, which is the **left-edge middle-row** cell, *not* the geometric centre). The 10 shipped
**variants** sweep `β`, `γ` and `i₀` around this instance (see
[04 · Results & reading](./04_results-and-reading.md)).

---

## What **is** modeled

- **Three compartments S / I / R** as a per-cell discrete state `x_{ij} ∈ {S, I, R}`; each step a cell is in
  exactly one.
- **Local, neighbour-driven contagion.** A susceptible cell with `k` infected Moore-neighbours is infected
  with probability `1 − (1 − β)^k` (each infected neighbour is an independent contact at rate `β`).
- **Constant per-capita recovery.** An infected cell recovers with fixed probability `γ` per step,
  independent of its neighbourhood; `R` is **absorbing** (recovery is irreversible).
- **Synchronous (simultaneous) update.** Every step, all infections and recoveries are *decided against the
  start-of-step configuration*, then applied together — the classic synchronous cellular SIR sweep.
- **Spatial structure.** Contacts are limited to the 8 Moore neighbours, so the epidemic spreads as a
  **front** rather than instantaneously across a well-mixed population.
- **Full reproducibility.** All randomness flows through Mesa's seeded RNG (`Model(rng=seed)` seeds
  `self.random`); the same `(params, seed)` reproduces the trace byte-for-byte — the lab's "replay = truth"
  contract.

## What is **not** modeled (scope boundaries)

- **No incubation / exposed compartment** — this is SIR, **not** SEIR.
- **No reinfection, no waning immunity** — `R` is terminal; no `R → S` and no `R → I`.
- **No vital dynamics** — no births, deaths (other than "recovery"), or population turnover.
- **No agent mobility** — cells are fixed; the only thing that moves is the *state*, not the agents.
- **No contact heterogeneity beyond the lattice** — every cell has the same 8-neighbour topology (edge cells
  have fewer because the grid is non-toroidal); no long-range links, no super-spreaders, no age/contact
  structure.
- **No interventions** — no vaccination, quarantine, or β/γ that change over time within a run.
- **Not well-mixed.** Because contact is local, the attack rate stays **below** the mass-action SIR
  final-size prediction `1 − ρ = e^{−R₀ρ}` (that relation is cited only as the well-mixed reference).

## Modeling assumptions that make it sound

- **Markovian / memoryless.** The next state depends only on the current state and the current neighbour
  states; draws are independent step to step.
- **Discrete time.** "A tick" is one synchronous sweep of the whole grid; the mean infectious period is
  `1/γ` steps.
- **Deterministic given the seed.** Iterating the model's `AgentSet` in its stable order and drawing
  infection-then-recovery per agent keeps the sweep reproducible; reads use the *unmodified* `state`, which
  is what makes the update genuinely synchronous.

---

Next: [02 · Formalization](./02_formalization.md) — the math behind these rules and the KPIs they produce.
