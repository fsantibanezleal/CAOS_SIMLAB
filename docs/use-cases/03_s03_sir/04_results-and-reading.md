# 04 · Results & reading — S03 SIR Epidemic

← Back to the use-case index: [../03_s03_sir.md](../03_s03_sir.md) ·
Solvers: [03_solvers-applied.md](./03_solvers-applied.md)

The shipped **variants/regimes**, what their **KPIs** show, and **how to read** the visualization. All
numbers below are the **committed** values from `manifests/s03_sir.json` (seeded runs of the verified
[`s03_sir.py`](../../../simlab/scenarios/s03_sir.py)) — not estimates.

---

## The 10 variants (committed KPIs)

All share `n = 38`, `steps = 80` and `i₀ = 0.02` except where noted. `peakI` = peak infected fraction;
`attack` = final recovered fraction `R(∞)`; `dur` = steps run before burnout/cap.

| Variant | β | γ | peakI | peak step | attack rate | dur | What it shows |
|---|---|---|---|---|---|---|---|
| **fizzle** (below threshold) | 0.022 | 0.25 | 0.018 | 0 | **0.037** | 26 | `R₀ < 1`: dies out near its seed, no wave |
| **threshold** (near threshold) | 0.040 | 0.25 | 0.018 | 0 | **0.044** | 26 | just super-critical: small, slow spread |
| **mild** | 0.140 | 0.20 | 0.272 | 12 | 0.979 | 49 | a modest epidemic, low-ish peak |
| **moderate** | 0.200 | 0.20 | 0.319 | 11 | 0.995 | 45 | the classic SIR wave: rise → peak → burnout |
| **severe** | 0.300 | 0.20 | 0.447 | 7 | 0.999 | 37 | high β: tall, fast peak |
| **explosive** | 0.420 | 0.15 | 0.547 | 6 | **1.000** | 52 | very fast spread, very high peak |
| **fastrec** (fast recovery) | 0.260 | 0.40 | 0.242 | 7 | 0.988 | 26 | high γ damps the peak even at high β |
| **slowrec** (slow recovery) | 0.160 | 0.08 | 0.545 | 15 | 0.997 | **80** | low γ stretches a long, smouldering epidemic |
| **seed1** (single seed, `i₀=0.004`) | 0.240 | 0.20 | 0.191 | 12 | 0.996 | 66 | starts from ~one case, spreads as a front |
| **denseseed** (`i₀=0.10`) | 0.180 | 0.20 | 0.510 | 5 | 0.998 | 40 | many initial cases ignite the board fast |

## How to read the KPIs (the three things the model is "about")

1. **The epidemic threshold.** Compare **fizzle** vs **threshold** against the wave variants. With
   `R₀ ≈ ⟨k⟩β/γ` and `⟨k⟩ ≲ 8`, fizzle's β/γ is far sub-critical, so the outbreak never grows past its seed
   — `peakI = 0.018` (essentially the seed) at step 0, attack rate only **0.037**. threshold is just
   super-critical: still tiny (`peakI = 0.018`, attack **0.044**), a slow creep rather than a wave. The
   moment β rises into the wave regime, the attack rate jumps to ~0.98–1.0 — that discontinuity *is* the
   threshold. (The in-app Context block reports these same committed sub-critical attack rates, ~0.037 /
   ~0.044.)
2. **Peak height & timing vs β.** Across **mild → moderate → severe → explosive**, raising β makes the peak
   **taller and earlier**: `peakI` 0.27 → 0.32 → 0.45 → 0.55, and `peak step` 12 → 11 → 7 → 6. Faster, more
   transmissible epidemics burn through the population sooner.
3. **The role of recovery γ.** **fastrec** (γ = 0.40) keeps the peak low (0.24) even with a high β = 0.26,
   because the short infectious period `1/γ` removes cases quickly — and the whole thing is over in 26 steps.
   **slowrec** (γ = 0.08) does the opposite: a tall peak (0.545) that arrives late (step 15) and a
   **smouldering** epidemic that runs the full 80-step cap.
4. **Seeding geometry.** **seed1** (`i₀ = 0.004`, ~one case) has the **lowest peak** (0.191) and a long run
   (66 steps) because the disease must spread as a *front* from a single ignition point. **denseseed**
   (`i₀ = 0.10`) lights the board almost at once: the earliest peak (step 5) and a high peak fraction (0.510).
   Both reach essentially the same attack rate — geometry changes the *shape*, not the *eventual size*.
5. **Spatial ≠ well-mixed.** Even in the strong-wave variants the attack rate plateaus around the population
   (≈0.98–1.0 here) but, in general grid runs, stays **below** the mass-action final-size prediction
   `1 − ρ = e^{−R₀ρ}`, because local contact lets the front leave isolated survivors behind — a structural
   effect of the lattice, not noise.

## How to read the visualization

- **The grid (agent-grid viz).** Colour encodes cell state from the trace legend: **susceptible** = accent
  (`var(--color-accent)`), **infected** = red (`var(--color-bad)`), **recovered** = green
  (`var(--color-good)`). As you scrub/play, watch a red **wave** grow out from the seed cells, reach its
  peak, and leave a **green field** (recovered) behind it. In `fizzle`/`threshold` the red barely spreads
  before vanishing; in `denseseed`/`explosive` the whole board reddens within a handful of frames.
- **The S/I/R chart.** Plots `S(t)`, `I(t)`, `R(t)` as **fractions of the population** over the steps run.
  The infected curve `I(t)` is the epidemic curve — its apex is `peak_infected_frac` at `peak_step`; `S(t)`
  falls monotonically and `R(t)` rises monotonically to the attack rate.
- **The KPI HUD.** Reports the **infected peak** and the step it occurs, the final **attack rate** `R(∞)`,
  the **steps run** (early burnout when `I` hits 0, or the step cap for a long epidemic), and the `β`, `γ`
  in effect. Switching variants re-binds these to the committed manifest values above; re-running live with
  your own slider settings recomputes them deterministically from `(params, seed)`.

## Marking & interaction (rubric)

The viz is animatable (frame scrubber + play), the variant selector exposes all 10 regimes for side-by-side
comparison, and every KPI is a live readout that reacts to the controls — the threshold, the β/γ trade-off,
and the seeding-geometry effects are all *legible from the controls*, not just described in prose.

---

Back to the index: [../03_s03_sir.md](../03_s03_sir.md) · Tool node:
[Mesa](../../frameworks/04_mesa.md) · Problem type:
[Agent-Based Modeling](../../problem-types/02_agent-based-modeling.md).
