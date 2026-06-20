# S02 · Schelling Segregation — use-case node

**Problem statement.** Two equal-size social groups share a square lattice city with some vacant homes. Each
household holds a *very* mild preference — it does not want to end up a strict local minority among its eight
immediate (Moore) neighbours — and it relocates to an empty cell whenever that preference fails. Thomas
Schelling's (1971) question is whether preferences this tepid can still produce a strongly segregated city
that *no individual* intended. The canonical instance is a 30×30 grid, 10% empty, with tolerance
τ = 0.5; the lab runs it on real **Mesa 3** (`mesa.Agent` / `mesa.Model` / `SingleGrid`), records a seeded
frame trace, and lets the viewer watch the segregation index *S* climb far above the τ any agent demands —
the fingerprint of **emergence**.

## Read in order

1. [01_assumptions.md](./02_s02_schelling/01_assumptions.md) — the canonical instance + what is and is not
   modeled (scope & assumptions).
2. [02_formalization.md](./02_s02_schelling/02_formalization.md) — the math: sets, parameters, state &
   decision variables, the model class, the dynamics, and the KPIs.
3. [03_solvers-applied.md](./02_s02_schelling/03_solvers-applied.md) — how Mesa 3 actually expresses and
   runs this model (the concrete API), why Mesa, and the live-vs-precompute lane for this scenario.
4. [04_results-and-reading.md](./02_s02_schelling/04_results-and-reading.md) — the variants/regimes, what
   the KPIs show, and how to read the grid + chart + HUD.

## See also

- Scenario source (verified): [`s02_schelling.py`](../../simlab/scenarios/s02_schelling.py)
- Manifest (variants, params, gate, committed KPIs): [`s02_schelling.json`](../../manifests/s02_schelling.json)
- Framework node — the dedicated tool: [Mesa](../frameworks/04_mesa.md)
  ([applying](../frameworks/04_mesa/03_applying.md) · [usage](../frameworks/04_mesa/02_usage.md))
- Problem-type guide: [Agent-Based Modeling](../problem-types/02_agent-based-modeling.md)
- Sibling ABM use-cases on the same engine: S03 SIR · S05 Beer Game (Mesa)
