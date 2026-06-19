# Changelog

All notable changes to CAOS_SIMLAB. Format: [Keep a Changelog](https://keepachangelog.com); version
scheme `X.XX.XXX` (see [conventions](https://github.com/fsantibanezleal)). Newest on top.

## [0.09.000] - 2026-06-19
### Added
- **S04 — Emergency department (multi-stage DES)**: triage → treatment (priority pool) → discharge, with
  non-stationary arrivals + an optional surge; SimPy, seeded. 10 regimes (load / staffing / surge / urgent
  mix); reports length-of-stay by class. New **flow visualization** (`FlowViz`): patients (coloured by
  priority) flowing through station queues + servers; new trace schema `simlab.flowtrace/v1`.
- **S06 — Job-shop scheduling (OR-Tools CP-SAT)**: minimize makespan over machines/jobs/precedences;
  includes the classic **Fisher–Thompson ft06** benchmark (proven optimal makespan 55) + generated
  instances. 10 regimes. New **Gantt visualization** (`GanttViz`): job-coloured bars per machine with a
  sweeping playhead; new trace schema `simlab.gantt/v1`. Native solver → precompute lane
  (`requirements-precompute.txt`; lazy import keeps the registry/CI importable without OR-Tools).
- The case-study player now branches across **five renderers** (queue-network · agent-grid · chart · flow
  · gantt). **7 of 10 scenarios live** (S01–S06 + S10); S07/S08/S09 (geospatial routing) remain. 26 tests.

## [0.08.000] - 2026-06-19
### Added
- **Two new chart/series scenarios** (pure-Python + NumPy, seeded):
  - **S10 — Monte-Carlo / CI study**: N replications of the M/M/c (S01 model) → running mean + a 95%
    confidence band that narrows like 1/√n toward the closed-form Erlang-C value, plus a per-run Wq
    histogram. 10 regimes (replications × load). Makes the replications/CI lesson interactive.
  - **S05 — Beer Game (bullwhip)**: 4 serial echelons with an order-up-to + smoothed-forecast policy and
    a shipping lead time; a demand change is amplified upstream. 10 regimes (lead time / smoothing /
    demand pattern); reports the bullwhip ratio per echelon.
- **Chart/series visualization** (`ChartViz` + `ChartVariantPlayer`): multi-line chart with an optional
  confidence band, horizontal reference lines, a histogram, and a playhead that reveals the series while
  playing. New trace schema `simlab.charttrace/v1`. The case-study player now branches across three
  renderers (queue-network · agent-grid · chart); the KPI comparison is reused for grid + chart scenarios.
- Experiments now shows the **full 10-scenario roadmap** — 5 live (S01 queue, S02 Schelling, S03 SIR,
  S05 Beer Game, S10 Monte-Carlo) + 5 upcoming (S04 ED, S06 job-shop, S07 haul, S08 VRP, S09 ambulance).
  18 tests total.
### Added
- **Two new ABM scenarios** (live-capable, pure-Python + NumPy, fully seeded):
  - **S02 — Schelling segregation**: a grid of two groups; unhappy agents relocate. 10 regimes (a
    tolerance sweep + density variants); tracks the segregation index over time.
  - **S03 — SIR epidemic**: grid contagion (β per infected neighbour, γ recovery). 10 regimes (β/γ
    sweep across the epidemic threshold); tracks the S/I/R curves and the attack rate.
- **Agent-grid visualization**: a canvas grid player (theme-aware cell colours, legend, frame scrubber)
  + an over-time **series chart** (segregation / epidemic curves) + a per-regime **comparison** (bars +
  table). The case-study player now branches on the scenario's viz renderer (queue-network vs agent-grid).
- New frame-based trace schema (`simlab.gridtrace/v1`) + the scenarios' tests (reproducibility, variant
  family, grid pipeline manifest). 15 tests total.
### Added
- **Graduate-level Theory**, transcribed from a deep-research workflow (3 reports, web-verified). Three
  domains as vertical sub-tab sections, each sub-tab carrying full bilingual prose, governing **equations
  (KaTeX)**, an assumptions/limits block, a theme-aware **bilingual SVG figure**, and DOI references:
  - **Queueing (M/M/c)** — 9 sub-tabs: Kendall notation, birth–death CTMC + steady state, stability,
    Erlang-C (Wq/Lq/W/L), Little's Law, PASTA, the ρ→1 knee + Kingman, pooling/square-root staffing.
  - **DES methodology** — 7 sub-tabs: the FEL worldview, the study lifecycle, input modeling + GoF,
    RNG/seeding/CRN, replications & CIs, V&V (Erlang-C as the worked check), warm-up/run-length.
  - **ABM** — 10 sub-tabs: agents/scheduler/activation, emergence, the ODD protocol, validation, and the
    canonical models (Schelling, SIR/Kermack–McKendrick, Boids, Sugarscape, Mesa).
- ~17 **bilingual, theme-aware SVG diagrams** across the theory (event-loop, CTMC, Erlang-C knee,
  replications/CI, SIR, emergence, ODD, Boids, …) and a full **bibliography** tab (25+ verified refs).
### Changed
- Replaced the earlier shallow Theory summaries; the lede fills the page width (0.05.001).
### Added
- **Deep, referenced Theory** to the CAOS_SEISMIC standard: three top tabs (Queueing theory · DES
  methodology · Agent-based modeling) of vertical sub-tabs, each with rigorous prose, **KaTeX equations**
  (M/M/c steady state, Erlang-C, Little's Law, Kingman heavy-traffic, SIR R₀), an assumptions block, a
  theme-aware **SVG figure**, and inline references.
- **Verified bibliography** (`data/citations.ts`, 25 references, 14 DOI-verified) + `Cite` / `ReferenceList`
  components and a References tab.
- **Quality SVG diagrams** (`components/figures/`): M/M/c schematic, birth–death CTMC, Wq-vs-ρ knee,
  pooling bars, DES event-loop timeline, replications/CI, SIR compartment flow, emergence grid.
### Changed
- **Width fix** completed: removed the 75ch prose cap so content fills the page; added figure/text rows,
  definition grids and assumption blocks (matches the sister CAOS app's layout density).
### Changed
- **Richer queue animation.** Customers are assigned to a SPECIFIC server (S1…Sc, labelled) and animate
  as transit dots travelling queue→server and server→sink, so you can see who is doing the work and
  where the flow goes. Servers flash a ring when they receive/deliver; the Arrivals/Served counters pulse
  when they change. Reconstructed server assignment is deterministic from the trace.
- **Each case study is now 3 sub-tabs** under the regime selector — Simulator · Summary charts · Context —
  so the simulator is visible without scrolling.
- **Width fix.** Content prose now fills the page width (the previous 75ch cap left pages half-empty);
  added figure/text rows, definition grids and assumption blocks for wide layouts.
### Changed
- **You now land directly on the simulator** (`/` = the Experiments simulator) — entering the app drops
  you straight into a running sim, per the product intent. Introduction moved to `/introduction`
  (`/experiments` redirects to `/`).
- In a case study, the **live simulator (regime selector + animated player) now renders first**, with the
  problem write-up and the cross-regime comparison below it.

## [0.03.000] - 2026-06-19
### Added
- **12 pre-simulated regimes for S01** (a `Variant` family on the scenario): a load sweep (ρ from 0.33
  to unstable) and a server-count sweep at fixed ρ that exposes the pooling effect (M/M/1 → c=10).
- Pipeline now emits one seeded trace per variant + a **manifest v2** listing all variants with their
  gate verdict, KPIs and Erlang-C reference. Tests cover the variant family + the v2 manifest.
- **Full web rebuild to the CAOS_SEISMIC design system**: multi-page SPA (react-router) with
  Introduction · Experiments · Theory · How-to-build; header with brand + nav + GitHub / personal /
  portfolio icon-links + language + light/dark toggles (lucide-react); react-i18next EN/ES.
- **Experiments**: tabs per case study; S01 ships a **≥10-variant selector**, an animated player, and a
  sim-vs-theory **comparison scatter + table** (click a point to load that regime).
- **Theory**: tabbed deep content (DES fundamentals, queueing M/M/c with **KaTeX** equations, validation
  & replications, ABM) ; **How-to-build**: the end-to-end recipe with real code.
### Changed
- Unstable analytic Wq serialized as **null** (not `Infinity`) so committed traces stay valid JSON.
- Retired the thin Phase-1a "Learn / About" single-group viewer.

## [0.02.000] - 2026-06-19
### Added
- **Web viewer (Phase 1a)** — React 19 + Vite static SPA, deployed to GitHub Pages at
  `simlab.fasl-work.com` (no backend). Lands in a running simulation.
- **S01 simulator**: animated M/M/c queue (SVG) replaying the committed seeded trace
  (arrivals → queue → c servers → served) with play/pause/scrub + speed.
- **Validation panel**: simulated Wq vs the closed-form Erlang-C, plus utilization, P(wait) and
  Little's Law, with the "a single run is noisy" teaching note.
- **Learn** (DES + M/M/c theory) and **About** tabs; bilingual **EN/ES**; **light/dark** theme.
- GitHub Pages deploy workflow (Actions on `main`); deterministic-replay architecture (ADR-0054).
### Changed
- Repo made **public**.

## [0.01.000] - 2026-06-18
### Added
- Project foundation (Phase 0): the shared `simlab` engine — RNG seeding (`core/rng.py`), the trace
  schema (`core/trace.py`), the `Scenario` interface + the 3-gate live/precompute classifier
  (`core/scenario.py`), and the manifest builder (`core/manifest.py`).
- **S01 — Bank / Clinic Queue (M/M/c)**: a SimPy DES with a closed-form Erlang-C reference for
  validation; the live-lane landing scenario.
- The local precompute pipeline + CLI (`python -m simlab.pipeline`), writing compact seeded traces to
  `data/artifacts/` and manifests to `manifests/`.
- Test suite: reproducibility (same seed → identical trace), theory validation (replication mean within
  15% of Erlang-C), unstable-system detection, and gate behaviour.
- Setup + precompute scripts (PowerShell + bash), `requirements*.txt` (base / dev / precompute / gpu),
  MIT license, data policy, and the public-repo CI guards.
