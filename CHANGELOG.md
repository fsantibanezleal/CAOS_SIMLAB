# Changelog

All notable changes to CAOS_SIMLAB. Format: [Keep a Changelog](https://keepachangelog.com); version
scheme `X.XX.XXX` (see [conventions](https://github.com/fsantibanezleal)). Newest on top.

## [0.03.001] - 2026-06-19
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
