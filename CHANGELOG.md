# Changelog

All notable changes to CAOS_SIMLAB. Format: [Keep a Changelog](https://keepachangelog.com); version
scheme `X.XX.XXX` (see [conventions](https://github.com/fsantibanezleal)). Newest on top.

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
