# S02 Schelling — the canonical instance + scope & assumptions

← Back to the node index: [../02_s02_schelling.md](../02_s02_schelling.md) ·
Next: [02_formalization.md](./02_formalization.md)

This page fixes the *one* instance the lab treats as canonical and states plainly what the model does and
does not represent. Everything here is read from the verified source
([`s02_schelling.py`](../../../simlab/scenarios/s02_schelling.py)) and the scenario's Context block in the
Experiments page — nothing is invented.

---

## 1. The canonical instance

The default ("classic") instance is the one Schelling (1971) made famous, with the lab's exact defaults:

| Knob | Symbol | Default | Range (`param_specs`) | Meaning |
|---|---|---|---|---|
| Grid size | n | **30** | 10 – 60 (int) | the lattice is n × n cells |
| Empty fraction | e | **0.10** | 0.02 – 0.40 | share of cells left vacant at init |
| Tolerance | τ | **0.50** | 0.10 – 0.85 | minimum fraction of own-type occupied neighbours an agent demands |
| Max steps | — | **50** | 10 – 120 (int) | hard cap on relocation rounds |
| Seed | — | **42** (manifest) | any int | seeds Mesa's RNG → fully reproducible run |

So the canonical run is a **30×30 grid, 10% empty, τ = 0.5, ≤ 50 steps, seed 42**. With 10% empty there are
≈ 810 occupied cells, split as evenly as possible into ≈ 405 type-A and ≈ 405 type-B households. The cell
state alphabet is `{ empty = 0, A = 1, B = 2 }` (verified: `EMPTY, A, B = 0, 1, 2`).

Each run is **a single reproducible draw**: the same `(params, seed)` reproduces the exact same trace
byte-for-byte, because every random draw (which cells are occupied, the A/B split shuffle, the relocation
shuffles) flows through Mesa's seeded RNG (`Model(rng=seed)` seeds `self.random`). This is the lab's
"replay = truth" contract.

---

## 2. What IS modeled

- **Two equal-size groups** (A and B), placed by visiting cells row-major, marking a cell occupied when a
  seeded draw clears the empty fraction, then splitting the occupied set 50/50 into A/B after a shuffle.
- **A square n×n grid with a Moore neighbourhood** (all 8 surrounding cells) and **non-periodic borders**
  (`SingleGrid(..., torus=False)`): an off-grid neighbour simply does not exist (it is not counted, not
  wrapped). Edge and corner agents therefore have fewer potential neighbours.
- **A single, local preference per agent.** A household looks only at its own *occupied* Moore neighbours
  and is content when at least a fraction τ of them share its type. This is the only behaviour an agent has.
- **Relocation of unhappy agents to a random empty cell**, done as a **batch update** each step: all unhappy
  agents are decided against the start-of-step configuration first, then relocated one-by-one. The
  just-vacated cell becomes available to later movers within the same step.
- **An isolated agent (no occupied neighbours) is content by convention** — there is no same-type ratio to
  fail, so it is excluded from both the unhappy set and the segregation index.

## 3. What is NOT modeled (deliberately out of scope)

The Context block is explicit that the model is intentionally minimal — it demonstrates *sufficiency*, not
that this is the only mechanism behind real segregation. Excluded, on purpose:

- **Prices, rent, or ability to pay** — relocation is free and unconstrained by economics.
- **Social networks** — neighbours are purely spatial (grid adjacency), not relational.
- **More than two groups** — exactly two equal-size types.
- **Preference for diversity (anti-segregation)** — the only preference is for own-type similarity.
- **Periodic borders (torus)** — borders are hard; edge agents genuinely have fewer neighbours.
- **Relocation to the *nearest satisfactory* vacancy** — here an unhappy agent moves to *any* random empty
  cell, not the closest cell that would make it happy.

## 4. Assumptions that shape interpretation

- **Batch update, not strictly Markovian.** Each step decides every unhappy agent against the start-of-step
  configuration, then relocates them one-by-one; the within-step shuffle order (of unhappy agents and of
  empty cells) influences the exact trace. Qualitative conclusions therefore rest on **ensembles over
  seeds**, not on any single committed run.
- **Equal group sizes** (50/50 split) — the model does not study minority/majority asymmetry.
- **Honesty caveat (from the Context block).** The model shows that a mild local rule *suffices* to generate
  global segregation; it is not a claim that this rule is the cause of any particular real-world segregation.

Continue to the math → [02_formalization.md](./02_formalization.md).
