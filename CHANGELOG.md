# Changelog

All notable changes to CAOS_SIMLAB. Format: [Keep a Changelog](https://keepachangelog.com); version
scheme `X.XX.XXX` (see [conventions](https://github.com/fsantibanezleal)). Newest on top.

## [0.05.000] - 2026-06-19
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
