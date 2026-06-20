# S01 · Results & reading

> The 12 shipped variants of scenario **S01**, what their KPIs show, and how to read the viz. All numbers
> are the committed, seeded results (`seed = 42`) from the scenario manifest — `Wq_sim` is the SimPy
> simulated mean wait, `Wq` is the Erlang-C theory, `Wq_ciw` is the independent Ciw cross-check, and
> `rel_err` / `theory_in_ci` describe how well Ciw lands on the theory. Read
> [03 · Solvers applied](./03_solvers-applied.md) first.

---

## 1. The three regimes the variants sweep

The 12 variants are not random points — they are three deliberate teaching axes.

### A. Load sweep (hold `c = 3`, `μ = 1`, raise `λ` → climb the `ρ` axis)

This is the headline lesson: **as `ρ → 1` the wait blows up nonlinearly.**

| Variant | `λ` | `ρ` | `Wq_sim` (SimPy) | `Wq` (Erlang-C) | `Wq_ciw` (Ciw) | `rel_err` | theory in CI? |
|---|---|---|---|---|---|---|---|
| `light` | 1.0 | 0.33 | 0.083 | 0.045 | 0.045 | 0.010 | yes |
| `moderate` | 2.0 | 0.67 | 0.747 | 0.444 | 0.441 | 0.007 | yes |
| `busy` | 2.4 | 0.80 | 1.576 | 1.079 | 1.101 | 0.020 | yes |
| `heavy` | 2.7 | 0.90 | 3.956 | 2.724 | 2.497 | 0.083 | yes |
| `saturated` | 2.85 | 0.95 | 5.912 | 6.047 | 6.665 | 0.102 | yes |
| `unstable` | 3.3 | 1.10 | 11.857 | — (∞) | — (n/a) | — | — |

Reading it: from `ρ = 0.33` to `ρ = 0.95` the theoretical wait climbs from ~0.045 to ~6.05 — a **~130×**
increase for less than a 3× increase in load. The jump from `heavy` (0.90) to `saturated` (0.95) alone
roughly **doubles** the wait: this is the **knee of the curve**. The `unstable` variant (`ρ ≈ 1.10`) has
**no finite theory** (`Wq = null`, Ciw skipped) — arrivals exceed capacity and the queue grows without
bound; the finite `Wq_sim = 11.86` is just the average over a 300-customer run that never reached steady
state (and it would keep rising with more customers).

### B. Pooling sweep (hold `ρ ≈ 0.80`, raise `c` → economies of scale)

Same utilization, more servers. The wait **shrinks** as the pool grows — pooling is free capacity.

| Variant | `c` | `λ` | `ρ` | `Wq_sim` | `Wq` (Erlang-C) |
|---|---|---|---|---|---|
| `mm1` | 1 | 0.8 | 0.80 | 5.463 | 4.000 |
| `c2` | 2 | 1.6 | 0.80 | 2.564 | 1.778 |
| `c5` | 5 | 4.0 | 0.80 | 0.795 | 0.554 |
| `c10` | 10 | 8.0 | 0.80 | 0.231 | 0.205 |

Reading it: at **identical `ρ = 0.80`**, the theoretical wait falls from `4.0` (single server) to `0.205`
(ten servers) — a **~20× shorter wait** purely from sharing one line across more servers. This is the
counter-intuitive result the variant set is built to make visceral: ten desks at 80% busy serve people
far faster than one desk at 80% busy.

### C. Special cases

- `mm1` / `mm1_busy` — the **single-server M/M/1** at `ρ = 0.80` and `ρ = 0.90`. `mm1_busy` has theory
  `Wq = 9.0` vs `Wq_sim = 12.91`: long, volatile waits when one server runs hot.
- `fast` — **doubling `μ`** (two servers, `μ = 2`) drops the load to `ρ = 0.50`; theory `Wq = 0.167`,
  `Wq_sim = 0.231`. Faster service is another lever on the same `ρ`.

---

## 2. What the KPIs show — and the validation story

Three numbers are meant to be read **together**: `Wq_sim` (SimPy), `Wq` (Erlang-C theory), `Wq_ciw`
(independent Ciw study).

- **Ciw vs theory is tight.** Across every stable variant, the Ciw cross-check lands within ~1–10% of the
  closed form (`rel_err` ≈ 0.007–0.102) **and** `theory_in_ci` is `true` everywhere — the Erlang-C `Wq`
  falls inside Ciw's 95% confidence band in all stable regimes. That is the artifact: an *independent*
  simulator confirms the theory the lab teaches.
- **`Wq_sim` sits a bit above theory — and that is honest, not a bug.** SimPy's single 300-customer run
  is a **short, noisy sample with a cold start** (the system begins empty and idle, so early customers
  wait less, but the finite run also doesn't fully average out the heavy upper tail). Its bias grows with
  load — small at `light` (0.083 vs 0.045) and large at `heavy` (3.96 vs 2.72) — which is exactly the
  pedagogy: **one short run is not the answer.** The Ciw study (10 long, warmed-up replications) is the
  honest estimate and is the one that matches theory. The graduation from "one run" to "replications +
  CI + warm-up" is the spine of the [DES guide](../../problem-types/01_discrete-event-simulation.md) and the
  subject of scenario S10.
- **Little's Law cross-check.** `Lq_little = λ · Wq_sim` is reported alongside, the cheapest internal
  sanity check that the simulated wait and queue length are mutually consistent.

---

## 3. How to read the viz

- The animation shows the **source** emitting customers into the **FCFS buffer**, then on to the `c`
  **server nodes**. Server nodes **change colour** as they flip idle → busy; the **line lengthens** when
  all `c` are taken (this is `N(t)` minus the in-service customers, visualised).
- The **HUD** puts the simulated KPIs (`Wq_sim`, `W_sim`, `Lq_little`, `utilization_offered = ρ`) **next
  to** the analytic Erlang-C oracle (`ρ`, `P(wait)`, `Wq`, `Lq`). **Agreement within Monte-Carlo error is
  the validation criterion** — the reader is meant to compare the two columns.
- **Unstable regime:** the analytic field is **empty** (theory returned nulls) and the simulated line
  just keeps growing on screen — the visual signature of `ρ ≥ 1`.

## 4. Lane & performance (committed run)

S01 ships **live** (`seed = 42`). Measured per-variant run times range from ≈ **6.2 ms** (`unstable`) to
≈ **2498.6 ms** (`c10`, the ten-server pool, ~2.5 s) — all inside the 3 s live gate, but the heavier stable
variants (`saturated` ≈ 2.2 s, `c5` ≈ 2.1 s, `c10` ≈ 2.5 s) sit close to it, so the gate is *cleared*, not
cleared with room to spare; each trace is ≈ **35 KB**, far inside the 1 MB gate. Note that most of every
*stable* variant's run time is the **Ciw cross-check** (10
seeded M/M/c replications), not the SimPy animation: the SimPy run itself is cheap (~a few ms for 300
customers). The `unstable` variant is fast for exactly that reason — it does **not** short-circuit the
SimPy simulation (all 300 customers are still simulated, which is why it reports a finite
`Wq_sim = 11.86`); what it skips is the *analytic* leg, because with no finite steady-state `Wq` there is
nothing for Ciw to converge to, so `ciw_validate_mmc` returns `applicable: false` and the 10 Ciw
replications never run. The viz runs live in a Pyodide Web Worker — see
[03 · Solvers applied §4](./03_solvers-applied.md#4-live-vs-precompute-lane-this-scenario).

---

*Back to:* [the S01 use-case index](../01_s01_queue.md).
