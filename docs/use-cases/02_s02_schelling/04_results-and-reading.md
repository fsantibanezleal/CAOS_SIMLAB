# S02 Schelling — results & how to read them

← Back to the node index: [../02_s02_schelling.md](../02_s02_schelling.md) ·
Prev: [03_solvers-applied.md](./03_solvers-applied.md)

The variants, KPIs, and gate timings below are the **committed** values from
[`s02_schelling.json`](../../../manifests/s02_schelling.json) (seed 42) — not illustrative numbers. They are
the exact traces the viewer replays.

---

## 1. The two sweeps

The 10 variants form two deliberate sweeps that **separate the effect of preference from the effect of
available space**:

- **Tolerance sweep** (τ from 0.30 to 0.70), holding the 30×30 grid and 10% empty fixed — walks the phase
  transition in the demanded similarity τ.
- **Density sweep** (empty from 5% to 35%), holding the classic τ = 0.50 fixed — varies how much room agents
  have to relocate into.

## 2. Committed KPIs (seed 42)

### Tolerance sweep — n = 30, e = 0.10

| Variant | τ | final S | happy | steps | What it shows |
|---|---|---|---|---|---|
| `t30` Tolerance 30% | 0.30 | **0.7396** | 1.0 | 7 | Very tolerant, yet S ≈ 0.74 — already ~2.5× τ, well above a random mix. |
| `t375` Tolerance 37.5% | 0.375 | 0.7352 | 1.0 | 9 | Mild preference, mild clustering. |
| `t45` Tolerance 45% | 0.45 | **0.8805** | 1.0 | 21 | Approaching the tipping point. |
| `t50` Tolerance 50% (classic) | 0.50 | **0.8805** | 1.0 | 21 | The famous case — strong segregation from a "fair" rule. |
| `t55` Tolerance 55% | 0.55 | 0.9402 | 1.0 | 28 | Sharper segregation, more churn. |
| `t625` Tolerance 62.5% | 0.625 | 0.9709 | 0.9853 | 50 (cap) | High similarity demand; not everyone settles. |
| `t70` Tolerance 70% | 0.70 | 0.9438 | 0.9389 | 50 (cap) | So demanding the system keeps churning; hits the step cap. |

### Density sweep — n = 30, τ = 0.50

| Variant | e | final S | happy | steps | What it shows |
|---|---|---|---|---|---|
| `dense` Dense (5% empty) | 0.05 | 0.8600 | 1.0 | 16 | Few vacancies → harder to relocate, slower to segregate. |
| `roomy` Roomy (25% empty) | 0.25 | 0.8879 | 1.0 | 13 | Plenty of room → fast, clean segregation. |
| `spacious` Spacious (35% empty) | 0.35 | 0.9230 | 1.0 | 9 | Very sparse board; converges quickest of the three. |

## 3. What the KPIs show

- **Emergence is the headline.** In *every* converged variant the final segregation S is far above the
  tolerance τ that produced it. Even the most tolerant run (`t30`, τ = 0.30) self-organizes to S ≈ 0.74.
  That gap — `final_segregation` ≫ `tolerance` — *is* the Schelling result: a mild local preference yields
  strong global segregation no agent intended.
- **A phase-transition shape with a tipping point.** Reading down the tolerance sweep, S rises from ≈ 0.74
  to ≈ 0.94 then plateaus near 0.95–0.97. On this seed `t45` and `t50` reach the **identical converged
  state** (both S = 0.8805 at 21 steps) — a single-seed coincidence; the *ensemble* over seeds is what
  traces the smooth S(τ) curve, which is why the Context block flags conclusions as ensemble-level.
- **High τ stops converging.** At τ = 0.625 and 0.70 the demand is so strict that some agents never find a
  satisfactory cell: the happy fraction drops below 1 (0.985, 0.939) and the run **exhausts the 50-step
  cap** (`steps_run = 50`) rather than reaching all-content. Segregation is highest here but the system is
  still churning.
- **Space matters independently of preference.** At fixed τ = 0.50, more vacancy converges *faster*
  (spacious 9 steps vs dense 16) and to *slightly higher* S — room to move lets clean clusters form quickly;
  scarce vacancies (dense) make relocation a bottleneck.

## 4. How to read the visualization

- **The grid** paints group **A in the accent colour** and group **B in magenta** over neutral empty cells
  (the legend from `GridTrace`). Step the animation and you watch unhappy agents jump until contiguous
  single-colour **clusters** form, separated by a jagged boundary — that boundary is the visible segregation.
- **The chart** plots the two per-step series: the **segregation index S rising** toward its plateau, and the
  **happy fraction trending to 1** (or, for high τ, stalling below 1). The step where the curves flatten is
  `steps_run`.
- **The HUD / KPIs** report `final_segregation`, `final_happy_frac`, `steps_run`, and the run's `tolerance`.
  The one signal to watch: **final S ≫ τ is the fingerprint of emergence.**
- **Reproducibility cue.** Every committed trace is `seed 42`; re-running the same variant locally on the
  same seed reproduces it byte-for-byte (the "replay = truth" contract). Comparing variants side by side is
  how the two sweeps are meant to be read — preference vs space, holding the other fixed.

Back to the node index → [../02_s02_schelling.md](../02_s02_schelling.md).
