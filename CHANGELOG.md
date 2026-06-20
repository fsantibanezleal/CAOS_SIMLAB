# Changelog

All notable changes to CAOS_SIMLAB. Format: [Keep a Changelog](https://keepachangelog.com); version
scheme `X.XX.XXX` (see [conventions](https://github.com/fsantibanezleal)). Newest on top.

## [0.17.001] - 2026-06-20
### Fixed — 5-layer consistency (multi-round adversarial remediation) + functional
- Removed the stale v0.16 "Mesa/joblib/SciPy = precompute-only" lane lie from every surface (it had survived on
  the deployed Build/Introduction/Methodology pages): Build now shows the real `LIVE_WHEELS` closure, and the
  live/precompute taxonomy matches the gate everywhere — only the native OR-Tools scenarios (S06/S08/S11)
  precompute; S07 (SimPy replay over a committed native plan) and S09 (SimPy+NetworkX) run live.
- Experiments tabs now use the canonical scenario ids (S07 Haul, S08 VRP, S09 Ambulance, S10 Monte-Carlo) —
  dropped the display renumber that contradicted the docs and the Introduction page.
- **s07 live fix:** committed the full grade×wall grid for both load/dump corridors (68 plans) so every variant
  × every reachable slider stop resolves to a committed plan (fixed a live `RuntimeError` when toggling the wall
  / moving the grade off the one committed point); Reset restores the variant's regime; added a plan-coverage
  guard test.
- Consistency/honesty: s09 `method` `des`→`DES` (regenerated trace+manifest); S08 web degree constraint
  `Σ x_0j ≤ K` (shipped solve drops empty routes); S04 documented as a non-stationary (Lewis–Shedler thinned)
  Poisson with FCFS triage + non-preemptive priority treatment; S05 as a fixed-order serial cascade with its
  real emitted KPIs; S10 CI uses the exact `scipy.stats.norm.ppf(0.975)` (not a hand-typed 1.96); s11 base
  honestly out of band; drifted numbers aligned to the manifests across docs + web.
- Reframed the Mesa-Geo / JuPedSim "applying" docs to the honest future-variant pattern (no fabricated
  scenarios); added the PyVRP citation (Wouda, Lan & Kool 2024) + wired the VRP refs; corrected stale
  deploy-architecture prose (static GitHub Pages, no VPS/backend); removed internal `wip/` path citations from
  the public docs; unified the gate name to **4-gate**.
- CI: `deploy-pages` also triggers on `simlab/**` (the live Pyodide bundle inlines `simlab/**/*.py`).

## [0.17.000] - 2026-06-20
### Fixed — restore ALL 8 live modes (the v0.16 regression)
- v0.16 wrongly demoted s02/s03/s05/s07/s09/s10 to precompute, removing their interactive Run. Restored every
  one with its real tool: **s02/s03/s05 on real Mesa 3 live in Pyodide** (measured: loads with `sqlite3`,
  ~3 s cold start), **s09** NetworkX+SimPy, **s10** joblib, and **s07** via the OR-Tools/NetworkX route plan
  precomputed + committed (`s07_plans.py`) with the **SimPy stochastic replay running live** over it. Live now
  matches v0.15 exactly: s01, s02, s03, s04, s05, s07, s09, s10; only the native OR-Tools solvers (s06/s08/s11)
  stay precompute. Gate: live iff `pure_python AND wheels ⊆ LIVE_WHEELS AND <3s AND <1MB`; worker loads the
  closure on demand. NetLogo Web card added as the alternate ABM live engine.
### Added
- Documentation rebuilt as a **numbered wiki**: 18 `docs/frameworks/NN_<fw>/` guides with **16 verified
  `example.py`** (NetLogo Web is an in-browser JS card and the GPU-ABM chapter is reference-only, so both are
  doc-only by design), `docs/use-cases/NN_<scenario>/` (assumptions+formalization+solvers+results, 11), deep
  `docs/architecture/` (7 files), granular problem-types/guides, master + section indexes.
### Fixed — cross-layer consistency
- Hard adversarial validation (15 independent auditors) found **83 defects**; all remediated — docs,
  docstrings, in-code comments, web content and manifests aligned to the code+manifest truth (Mesa = live not
  precompute; S01 = SimPy live + Ciw cross-check; replications/CI = S10 not S04; S10 = heap M/M/c + joblib).
- 40 tests pass; ruff (whole repo) clean; tsc + vite build green.

## [0.16.000] - 2026-06-20
### Changed — major: every scenario now runs on its REAL dedicated tool (no more hand-rolled NumPy stand-ins)
- **ABM → Mesa 3** (was hand-rolled NumPy): s02 Schelling, s03 SIR, s05 Beer Game now use `mesa.Agent` /
  `mesa.Model` / AgentSet activation. The earlier docs/Theory claim of "uses Mesa" is now TRUE.
- **DES → SimPy** (real): s01 Bank/Clinic queue + a real **Ciw** M/M/c (Erlang-C) cross-validation; s04 ED.
- **Optimization/routing → OR-Tools** (CP-SAT/Routing/GLOP) for s06/s07/s09/s11, **PyVRP** SOTA contrast for
  s08, **NetworkX/OSMnx** road graphs for s07/s09.
- **Monte-Carlo → joblib** (CPU-parallel seeded replications) + **scipy.stats** confidence intervals (s10),
  replacing the hand-rolled NumPy loop.
### Added
- Documentation rebuilt: `docs/problem-types/` (DES/ABM/optimization/Monte-Carlo) and 18 `docs/frameworks/<tool>/`
  guides (installation/usage/applying) with **16 verified `example.py` actually run in the .venv** (NetLogo Web
  is a JS in-browser card and the GPU-ABM chapter is reference-only, so both are doc-only by design), plus
  `docs/guides/` (precompute/live/gpu) and a docs index. `requirements-precompute.txt`/`requirements-gpu.txt`
  pinned to verified versions; setup scripts install the precompute lane.
### Fixed
- **Live plane:** heavy scenario imports made lazy so `import simlab.registry` loads under Pyodide; new gate
  criterion `wheels ⊆ {numpy, simpy, ciw}`. LIVE = s01, s04 (SimPy/Ciw); everything heavier (Mesa ABM,
  OR-Tools, joblib/scipy, networkx) is precompute + replay. Worker loads numpy+networkx+simpy+ciw.
- LICENSES/ATTRIBUTION/ARCHITECTURE/README and the Theory/Methodology content corrected to the real stack.
- All 38 tests pass; ruff clean; web build green; traces deterministic (byte-identical reruns).

## [0.15.002] - 2026-06-19
### Fixed
- **Adversarial truth-audit remediation.** A full audit (equations vs code, citations web-verified, each
  case re-executed) found the simulation/OR cores correct and **all 50 citations real (0 fabricated)**, but
  surfaced real defects — now fixed:
  - **QueueingTheory pooling figure was wrong by 2×** (showed Wq 0.889/0.277/0.102 for c=2/5/10; correct
    1.778/0.554/0.205). Fixed the values, bar heights, trend overlay, caption, and the "cuts to a third" →
    "to a bit under half" prose. *(The headline figure now matches the code's own Erlang-C.)*
  - **DES methodology tab described features the code doesn't implement** — a "Welch warm-up the lab
    applies", "spawned substreams / CRN", Student-t CIs, and "inside the CI across all 12 regimes". Reworded
    to the truth: no warm-up (n is large), sequential PCG64 seeds, a normal-approximation CI, 11 stable
    regimes. OptimizationTheory: S07 infers the match-factor regime from throughput/loader-wait (no MF KPI).
  - **Scenario variant claims now match the data.** S11: the dump flow is serviced (dump_heavy routes the
    majority to the dump), plan-adherence is measured over the plant plan (overtrucked = 100%), and
    low_target / surge12 / barrier retuned so they realize their labels. S03: fizzle now genuinely dies out
    (R0≈0.7) and threshold is small/slow (R0≈1.3); title "SIR/SEIR"→"SIR" (no SEIR exists). S07: f_t12 note
    corrected (loads 12→15, wait ~4×), `switch_grade_est`→null under a barrier (was a wrong 2.98), the sim
    framed as deterministic with M/M/1//N as the analytic analogue. S08: global-span = longest route (not
    "longest − shortest"); the back-and-forth claim removed; manyveh/c15v4/tightcap stated honestly (the
    extra vehicle/tighter cap doesn't bind on these instances). S06: dropped the false "j4m6 short makespan"
    + "at equal load" (generated jobs traverse all machines → makespans not comparable across instances).
    S10: it's live-capable (not "no live mode"); the ρ≈0.9 case reframed as the finite-run transient-bias
    lesson. S02: copy corrected (≈99% settle, segregation ≫ random at τ=0.30, t70 empty 0.10). S01: stale
    "Wq=inf" docstring → "None". AbmTheory: removed the spurious "SingleActivation" Mesa scheduler.
  - 38 tests pass; ruff clean; all affected traces regenerated.

## [0.15.001] - 2026-06-19
### Fixed
- **S11 terrain made genuinely diverse.** The previous hills were clustered centrally, leaving flat
  corridors so routes between (centrally-spread) stations were still straight. Now: the stations sit at
  opposite **corners/edges** (only the stock stays interior), the hills field is **distributed and
  irregular** — broad tall hills placed **on the corridors** between stations (a central wall + a
  top-corridor + a right-corridor block), medium scattered bumps, and a **basin** (amp&lt;0) — and the
  loaded-climb penalty was strengthened (`ROAD_GRADE` 2.5→6.0). Routes now visibly **wind** around the
  relief (route/straight ≈ 1.03 → 1.15+), and each corner→plant flow takes a different path. The
  plan-vs-fleet grade-slip lesson is unchanged (undertrucked 1.6 → overtrucked 2.86, in band).

## [0.15.000] - 2026-06-19
### Added
- **Theory page completed — new "Optimization & routing" section** (the page had Queueing, DES, ABM but
  nothing on the optimization/routing the lab now teaches via S06/S07/S08/S11). A deep `OptimizationTheory`
  component matching the existing depth: 7 sub-tabs — **Linear programming & duality** (simplex vs
  interior-point, LP duality + complementary slackness, GLOP, the S11 blend LP), **Integer/MILP**
  (branch-and-bound, cutting planes, total unimodularity, NP-hardness), **Constraint programming / CP-SAT**
  (the disjunctive job-shop, no-overlap, makespan, FT06=55), **Shortest paths & graded routing** (Dijkstra
  O((V+E)log V), the graded edge cost, the route-switch g\*=ΔL/ΔC), **Vehicle routing** (TSP→CVRP→VRPTW,
  the arc-flow MILP, global-span, guided local search), **Mine haulage & the match factor** (closed
  finite-source M/M/1//N, MF=(N·t_L)/(c·t_cycle), optimize-then-simulate / plan-vs-reality), and **Exact
  vs. heuristic / complexity** (P/NP, anytime solving, the live/precompute consequence). Every formula
  matched to the scenario code; KaTeX-rendered; bilingual; 20 OR citations added to `citations.ts`
  (Dantzig, Karmarkar, Land-Doig, Gomory, Fisher-Thompson, Dijkstra, Dantzig-Ramser, Toth-Vigo,
  Morgan-Peterson match factor, …). Authored + adversarially math-checked by a workflow.

## [0.14.000] - 2026-06-19
### Changed
- **Every scenario's Context rewritten to a deep, formalized standard** (the prior write-ups were too
  terse). Each of the 11 cases now answers, in order: **the problem** (with the canonical real instance);
  **Components & variables** (sets, parameters, decision/state variables); **Formalization** — the detailed
  math, **rendered with KaTeX** (`Equation`/`InlineMath`), with the model class named correctly (M/M/c;
  finite-source M/M/1//N + match factor; Schelling happiness rule; SIR threshold; priority M/M/c +
  thinning; order-up-to + bullwhip ratio; CP-SAT disjunctive; CVRP/MILP; nearest-available EMS;
  replications + CI; blending LP) and every formula matched to the scenario's actual code; **Scope &
  assumptions** (what's modeled, the Markovian/seeded/stationary assumptions, what's out of scope); then
  what each variant shows + how to read the viz. Authored + adversarially math-checked by a per-scenario
  workflow (read code → write → verify vs code). 29–62 rendered equations per scenario.
- **S11 mine haul — much bigger, richer map** (the small bordered map made every trip hug the edge). New
  **"hills" terrain** in `_geo.py` (a sum of Gaussian bumps → a varied landscape); a 14×14 grid with the
  phases / plant / dump / stock placed in the **interior**, spread out, so haul routes **wind through the
  valleys** (now 100% interior, no border-hugging). The plan-vs-fleet grade-slip lesson still holds
  (undertrucked 2.05 → overtrucked 2.88 in band).

## [0.13.000] - 2026-06-19
### Added
- **S11 — Multi-destination mine haul (plan-then-simulate).** A new case study that is genuinely new vs
  S07/S08: ore flows from several **phases** (load points, each with an ore grade) to three destination
  **kinds** — a **plant** (grade target), a **dump** (waste), and intermediate **stockpiles** (a node that
  is a sink AND, once it holds material, a source for later trips). Two coupled OR problems:
  - **Blending LP** (OR-Tools **GLOP**): choose the per-source plant feed to hit the grade target within
    demand (linearized deviation); the phase grades straddle the target so the plan is a genuine blend.
  - **Execution DES** (seeded): a **fixed fleet** runs graded haul cycles with a duty-based, reachable-
    soonest dispatch. Because the rich phase is far, an under-sized fleet can't deliver its planned tonnage
    and the **plant grade slips first** (undertrucked 1.78 vs target 2.9 → overtrucked 2.86, in band) —
    *an optimal plan is necessary but not sufficient*. 12 variants (fleet sizing, demand surge, tight band,
    stock-as-source/buffer, barrier, low target, dump-heavy).
  - New **stock fill-bar** primitive in RouteViz (a `gauges` trace field; level interpolated against the
    replay clock — rises on tip-in, falls on draw-out) + a plant-delivery HUD counter (plant is a pure
    sink, so the count is unambiguous). `routetrace.py` `gauges` is only serialized when present, so other
    route traces stay byte-identical. Native solver ⇒ **precompute lane** (no live lane; the Live tab shows
    the native-only explainer). New tab **S11**; lede updated to eleven cases / four routing problems.
  - **Deep, formalized description** (the new context standard): problem · components & variables · detailed
    mathematical formalization (the blending LP, the graded route cost, the achieved-grade + plan-adherence
    definitions) · scope & assumptions (what's modeled vs the out-of-scope period-scheduling / cut-off-grade
    / live-dispatch app). 3 new tests (blend + slip/recovery + stock dual role); 38 tests total.

## [0.12.000] - 2026-06-19
### Changed
- **S07 haul redesigned — the route now genuinely depends on the terrain (was degenerate).** The old grid
  used a smooth monotone elevation ramp, so *every* load→dump path climbed the same total amount: the grade
  weight only scaled a constant and never changed the optimal route — it was an invariant border path
  across all variants. Replaced with a deterministic **Gaussian ridge + low pass** field (`_geo.py` gains
  backward-compatible keyword-only `terrain`/`terrain_opts`/`blocked`; the `ramp` default reproduces S08/S09
  byte-for-byte). Now the optimal haul route **switches direct↔pass at a critical grade g\* ≈ 3.4**
  (Dijkstra-verified), moving the pass sends the detour the other way, and a **barrier** (true node removal)
  reroutes it independent of grade. 13 variants spanning the route trade-off AND the loader-bottleneck
  fleet-sizing story (no monotone clones). New `analytic.switch_grade_est` + `route_via`.
- **S07 description rewritten + formalized** — grounds the model as a **closed finite-source (machine-
  repair, M/M/1//N) queue** with the **match factor** MF = trucks·t_load ÷ (loaders·t_cycle), the graded
  route cost, and what each variant shows (the old copy was too terse and skipped the formalization).
- **RouteViz: elevation field render** — a paint-once normalized terrain heatmap behind the roads (ridge
  warm, pass cool) so the route trade-off is visible; **barriers** drawn as impassable cells; the elev
  colour ramp is now normalized to [0,1] (the ridge peak exceeds 1). `routetrace.py` gains an optional
  `barriers` field (only serialized when present → S08/S09 stay byte-identical).
- **Case order**: Monte-Carlo moved to the **S07** slot (right after S06) so the three geospatial routing
  cases group together at the end (now S08 haul · S09 VRP · S10 ambulance). Display labels only — internal
  `manifestId`s and tab ids are unchanged (deep-links preserved).
- Tests: route-switch + tie-stability (±1e-9) + updated loader-saturation tests; S08/S09 byte-identity
  regression. 35 tests.

## [0.11.002] - 2026-06-19
### Fixed
- **S10 live lane crashed on unstable regimes.** Tuning the Monte-Carlo sliders to ρ ≥ 1 (e.g. high λ /
  few servers) made `erlang_c_mmc` return `Wq=None` (no steady-state), and `round(None, 4)` raised
  `TypeError` — a live-only crash (committed variants are all stable, so it never surfaced offline). Now
  the scenario drops the Erlang-C reference line and nulls the theory KPIs when unstable; the simulated
  running mean + CI band still render (illustrating non-convergence). Committed traces unchanged
  (byte-equality preserved); added a regression test for the ρ ≥ 1 case.

## [0.11.001] - 2026-06-19
### Fixed
- **Dynamism parity across every viz** — the S01 queue's "temporal coloring" (event flash rings + counter
  pulse + traveling dots) was inconsistent: some scenes felt static. Brought every scene up to that bar
  with the topology-appropriate analogue (guided by a multi-agent adversarial viz review):
  - **S04 ED flow** now flashes each station on receive/hand-off, pulses the arrival/served counts, and
    sends priority-coloured patients **traveling between stations** (source→triage→treatment→discharge→out)
    — previously static (the original report). New flash/transit computation in `flowReplay`.
  - **S07/S08/S09 route** destination nodes now **flash on arrival** (an expanding glow ring); served VRP
    customers **dim** so route progress reads at a glance (was: a served customer was pixel-identical to an
    unserved one); the HUD gains a **pulsing running counter** (loads / served N/total / resolved) and
    S09's incidents now **POP per-spawn** instead of sharing one global sine. New event/served/counter
    channels in `routeReplay`.
  - **S02/S03 grid** cells that just changed state get a brief fading **halo** (a relocation / a spreading
    infection now reads as "happening now"), via a per-cell diff vs the previous frame in `AgentGridViz`.
  - **S05/S10 charts** gain a **leading-edge marker** on each revealed series so the eye tracks "now"
    (progressive reveal + playhead was already correct).
- Process: a 50-agent internal adversarial visualization review graded all 10 scenes for
  attractiveness / clarity / dynamics-coverage / live-correctness; the 5 confirmed findings are fixed here.
  Verified in-browser (Playwright) across the route/grid/chart scenes; zero console errors.

## [0.11.000] - 2026-06-19
### Added
- **Pyodide live param-tuning lane — the architecture's reason-for-being is now interactive.** A new 4th
  **"Live (your browser)"** sub-tab per case study loads Pyodide (Python 3.13 + numpy + simpy) in a Web
  Worker from the jsdelivr CDN, writes the inlined `simlab` sources into the WASM filesystem, and runs the
  **exact same `Scenario.run`** the offline pipeline runs — so tuning the sliders + seed and pressing Run
  computes a fresh trace **in the browser, no server**, animated by the very same per-renderer player.
  - **`simlab/live.py`** (`run_trace_json`, `live_lanes`) — the in-browser entrypoint, sharing the
    `Scenario.run → Trace.to_json` path; a hard guard refuses native-engine scenarios.
  - **Worker stack:** `pyodide.worker.ts` (classic worker, `importScripts` the pinned Pyodide v0.28.3 UMD;
    explicit `indexURL`), `pyodideClient.ts` (lazy singleton, `warmUp`/`runLive`/`verifyLive` + phase
    progress), `pyodideProtocol.ts`, `pyodide-config.ts`. `copy-data.mjs` now also inlines `simlab/**/*.py`
    into `public/pyodide/simlab-sources.json` at prebuild (canonical source = the package itself).
  - **`LivePanel`** + `LiveControls`: sliders generated from `manifest.param_specs`, a seed field,
    Run/Reset, a one-time-download note, live progress, and a "computed live in your browser · N ms · numpy
    X" badge. Players are reused unchanged via an in-memory trace registry in `data.ts` (synthetic
    `live://` keys) + a shared `PlayerSwitch`.
  - **"Verify against the committed trace"** (replay = truth): re-runs the active regime in WASM and
    compares its serialized trace to the committed file — **byte-equality**, with a 1e-9 numeric-tolerance
    fallback that warns (never crashes). Verified live: **all 8 live-capable scenarios reproduce their
    committed traces byte-for-byte** (S01–S05, S07, S09, S10) even across the numpy 2.4.6→2.2.5 gap, so no
    trace regeneration was needed.
  - **Gate:** native-engine scenarios (S06 CP-SAT, S08 OR-Tools) show a read-only "precomputed only"
    explainer driven by `gate.reasons` — no Run button, so the ~runtime download never fires for them.
- **32 tests** (3 new `test_live.py`, incl. a CPython byte-equality regression vs every committed trace).
  Verified end-to-end in a real browser (Playwright): run + verify + native-only gate, zero console errors.

## [0.10.000] - 2026-06-19
### Added
- **Geospatial routing lane — the final three case studies, all on a self-contained synthetic road
  network** (grid of junctions + adjacency + an elevation field; Dijkstra shortest paths with a pluggable
  edge cost; no OSM / tiles / external maps — fully reproducible from `(params, seed)`). New shared
  `simlab/scenarios/_geo.py`, trace schema `simlab.routetrace/v1`, and a new **route visualization**
  (`RouteViz` + `RouteVariantPlayer`): roads, planned-route polylines, agents interpolated along timed
  legs with a motion trail, pulsing incident markers, elevation-shaded junctions, and a live HUD. Brings
  the case-study player to **six renderers** and **all 10 scenarios live**.
  - **S07 — Construction haul routing** (hybrid optimize-then-simulate, pure-Python DES): trucks cycle
    load↔dump where elevation grades the loaded climb; a shared **loader is the bottleneck**. 10 regimes
    show throughput **saturating** as the fleet is over-trucked (9 vs 12 trucks: same loads, double the
    loader wait), extra loaders lifting the ceiling, and grade lengthening the cycle.
  - **S08 — Vehicle routing problem** (capacitated VRP, **OR-Tools** routing solver → precompute lane): K
    capacity-limited vehicles serve N customers minimizing distance, with a global-span cost that balances
    routes. 10 regimes surface the **total-distance ↔ longest-route** trade-off across capacity, fleet
    size and customer density.
  - **S09 — Ambulance dispatch** (stochastic EMS, pure-Python DES): Poisson calls, nearest-available
    dispatch (accounting for busy units), scene → hospital → base. 10 regimes cover **fleet sizing and
    station siting** (offered load >100% = overwhelmed; more well-sited stations cut response; surges
    collapse coverage), reporting mean/p90 response and coverage within the response target.
- **29 tests** (7 new routing/network tests). Pipeline writes 30 new seeded traces + 3 manifests.

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
