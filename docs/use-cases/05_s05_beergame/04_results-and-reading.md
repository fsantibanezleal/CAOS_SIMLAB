# S05 Beer Game — results & how to read them

← Back to the use-case index: [../05_s05_beergame.md](../05_s05_beergame.md) ·
Prev: [03_solvers-applied.md](./03_solvers-applied.md)

The variants the scenario ships, what their KPIs show, and how to read the chart. All KPI values below are
read from the committed [`manifests/s05_beergame.json`](../../../manifests/s05_beergame.json) (seed 42) — not
estimated.

---

## 1. The variants (regimes)

Ten variants sweep the two structural drivers of the bullwhip (lead time and forecast reactivity) plus the
demand-shock shape. All sit at `W = 52`, `d₀ = 8`.

| Variant | `L` | `θ` | `Δ` | pattern | What it isolates |
|---|---|---|---|---|---|
| **L1** | 1 | 0.4 | 4 | step | short lead time → modest amplification |
| **L2** | 2 | 0.4 | 4 | step | the **baseline** bullwhip case |
| **L3** | 3 | 0.4 | 4 | step | longer lead time amplifies more |
| **L4** | 4 | 0.4 | 4 | step | long lead time → violent upstream swings |
| **theta20** | 2 | 0.2 | 4 | step | heavy smoothing → calmer, slower response |
| **theta40** | 2 | 0.4 | 4 | step | moderate reactivity (= L2 baseline) |
| **theta70** | 2 | 0.7 | 4 | step | reactive forecasting worsens the bullwhip |
| **bigstep** | 2 | 0.4 | 8 | step | a large step → large overshoot upstream |
| **spike** | 2 | 0.4 | 8 | spike | a one-week pulse still ripples upstream |
| **noisy** | 2 | 0.4 | 5 | AR(1) noise | random demand: variance amplifies stage by stage |

## 2. What the KPIs show

The headline KPI is the **bullwhip ratio** `Bᵢ = Var(oᵢ)/Var(d)` for each echelon, plus the factory's peak
order. Committed values (seed 42):

| Variant | B₁ retailer | B₂ wholesaler | B₃ distributor | B₄ factory | peak factory order |
|---|---|---|---|---|---|
| L1 | 1.26 | 2.34 | 6.15 | **19.36** | 50.0 |
| **L2 (baseline)** | 1.52 | 4.57 | 20.38 | **101.92** | 101.7 |
| L3 | 1.87 | 8.65 | 57.52 | **382.0** | 190.8 |
| L4 | 2.30 | 15.35 | 138.35 | **1202.53** | 332.0 |
| theta20 | 1.29 | 2.18 | 4.57 | **10.67** | 34.2 |
| theta40 | 1.52 | 4.57 | 20.38 | **101.92** | 101.7 |
| theta70 | 2.01 | 15.45 | 159.98 | **1555.1** | 377.4 |
| bigstep | 1.52 | 4.57 | 20.38 | **99.14** | 195.4 |
| spike | 5.28 | 26.12 | 117.56 | **555.24** | 195.4 |
| noisy | 3.90 | 12.92 | 42.97 | **160.47** | 108.1 |

**The hallmark holds everywhere:** `B₁ ≤ B₂ ≤ B₃ ≤ B₄` with every `Bᵢ > 1` — order variance grows
monotonically retailer → factory. Reading down the columns:

- **Lead time is the dominant lever.** L1→L4 drives the factory bullwhip from 19 to over 1200. The `(L+1)`
  factor in the order-up-to target means each extra week of lead time amplifies the target adjustment, and
  that amplification compounds across the four stages.
- **Reactive forecasting worsens it.** theta20→theta70 takes the factory bullwhip from 11 to ~1555. A
  reactive forecast (`θ=0.7`) chases every demand move and over-orders; heavy smoothing (`θ=0.2`) calms the
  chain at the cost of a slow, laggy response.
- **A bigger step does *not* raise the ratio — only the peak.** `bigstep` (Δ=8) shows `B₄ = 99.14`,
  essentially equal to the baseline 101.92, because the bullwhip *ratio* is scale-invariant in Δ (numerator
  and denominator both scale with Δ²). What doubles is the **peak factory order** (101.7 → 195.4). The text
  is careful to say bigstep gives "a larger overshoot" (peak), not a larger ratio.
- **A transient still propagates.** The one-week `spike` produces a large factory bullwhip (555) — a single
  pulse, not a permanent shift, still ripples violently upstream.
- **Variance amplifies without a single shock.** `noisy` (AR(1) demand) shows the bullwhip on continuously
  random demand: `B₄ = 160` with no step at all — amplification is a property of the policy + lead time, not
  just of a one-off shock.

## 3. How to read the visualization

The renderer is a **line chart** (`viz: chart`). Per week it plots:

- **Customer demand** — dashed grey (`--color-fg-faint`), the exogenous driver.
- **Retailer orders** — green (`--color-good`).
- **Wholesaler orders** — accent (`--color-accent`).
- **Distributor orders** — amber (`--color-warn`).
- **Factory orders** — magenta (`--color-magenta`).

X-axis is the week (1…W); Y-axis is orders/demand in units.

**What to look for:** each successive curve sits **higher and overshoots more** than the one before it —
retailer is closest to the demand line, the factory swings the widest. That growing separation between the
curves *is* the bullwhip, made visual. The four bullwhip-ratio KPIs quantify exactly that separation (they
should grow retailer → factory), and the peak-factory-order KPI is the worst single order the factory must
place. Sweep the variants side by side to *quantify* how much longer lead times and more reactive forecasts
worsen the amplification — the chart shows the shape, the KPIs put a number on it.

Because the run is deterministic and seeded, the chart you see for given sliders is the exact committed
trace — anyone who clones the repo and runs the same `(params, seed)` reproduces it byte-for-byte.

---

Back to the index: [../05_s05_beergame.md](../05_s05_beergame.md).
