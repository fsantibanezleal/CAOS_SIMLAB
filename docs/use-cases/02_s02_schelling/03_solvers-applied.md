# S02 Schelling — the tool, applied

← Back to the node index: [../02_s02_schelling.md](../02_s02_schelling.md) ·
Prev: [02_formalization.md](./02_formalization.md) · Next: [04_results-and-reading.md](./04_results-and-reading.md)

This page documents the **dedicated tool** that runs this scenario — **Mesa 3** — exactly as the verified
code uses it, why Mesa is the right tool, and which lane the scenario lives in. The framework reference is
the Mesa node: [../../frameworks/04_mesa.md](../../frameworks/04_mesa.md).

---

## 1. The tool: Mesa 3 (`engine = "mesa"`)

There is no separate "solver" in ABM — the **run is the answer**. The dedicated tool is the ABM *framework*
that expresses the world and steps it forward. The scenario is built on **real Mesa 3**, not a hand-rolled
NumPy sweep (verified in [`s02_schelling.py`](../../../simlab/scenarios/s02_schelling.py)):

| Formal element | Mesa expression in this scenario |
|---|---|
| Agent + state | `class SchellingHousehold(mesa.Agent)` carrying `self.group` (A or B) |
| Environment / topology | `from mesa.space import SingleGrid`; `SingleGrid(size, size, torus=False)` (non-periodic) |
| Neighbour lookup | `self.model.grid.iter_neighbors(self.pos, moore=True)` (the 8 Moore neighbours) |
| Placement / movement | `grid.place_agent(agent, (x, y))`, `grid.move_agent(agent, dest)`, `grid.empties` |
| The model world | `class SchellingModel(mesa.Model)` |
| Agent collection / activation | the model's `AgentSet` via `self.agents` (Mesa 3 API) |
| Seed → reproducibility | `super().__init__(rng=int(seed))` — Mesa 3 seeds both `self.random` and `self.rng` |

`self.pos` is the `(x, y)` the grid assigns on placement; `grid.empties` is the live set of vacant cells the
relocation step draws from.

### The concrete solve loop (verified)

`SchellingScenario.run(params, seed)`:

1. Coerce params; lazily build the Mesa-backed classes via `_models()` (see §3), then instantiate
   `SchellingModel(size=n, empty_frac=e, tolerance=τ, seed=seed)`.
2. Open a `GridTrace` with the three-state bilingual legend (empty / group A → accent / group B → magenta).
3. For `step` in `0 … T`: record a frame (`grid_snapshot()`), compute `segregation_and_unhappy()`, append
   the segregation and happy series, then **stop** if no one is unhappy or the cap is hit, else
   `model.relocate(unhappy)`.
4. Attach `series` (`x`, `segregation`, `happy`) and the `kpis` block, and return the trace.

Mesa drives the world; the lab owns the *evaluation* each tick (so it can record happiness + segregation per
step) and the metric definitions — the `Agent` / `Model` / space abstractions remain visible in-repo, the
curriculum rather than a blackbox.

## 2. Why Mesa for this problem

- **It is the de-facto Python ABM standard** (Apache-2.0, actively maintained, JOSS-published) — the
  low-risk, well-documented default for "what global pattern do these local rules produce?".
- **Its abstractions *are* the ABM concepts** — `Agent` / `Model` / space / `AgentSet` map one-to-one onto
  Schelling's households, lattice, and activation, so the code reads as the model.
- **First-class spaces** — `SingleGrid` with a Moore neighbourhood is exactly the Schelling environment; no
  geometry library or hand-rolled adjacency needed.
- **Seeded RNG built in** — `Model(rng=…)` makes the whole run reproducible, which is the foundation of the
  lab's committed, replayable trace.
- It is the lab's **template** ABM scenario: S03 SIR and S05 Beer Game follow the same Mesa pattern. For why
  not the alternatives (NetLogo Web, Mesa-Geo, GPU-ABM), see the Mesa node's
  [pick-vs-alternatives table](../../frameworks/04_mesa/03_applying.md#5-when-to-pick-mesa-vs-the-alternatives).

## 3. Lazy import — a deliberate engineering choice

Mesa is imported **inside** `_models()`, not at module top level, and the built classes are cached
(`_MODELS`). This is why: importing `simlab.registry` (the Scenario subclass + `variants()` + `param_specs`)
must need **zero heavy deps**, so the registry loads even where Mesa is absent. Mesa is pulled in only when
`run()` actually executes. Behaviour is identical to a top-level class definition — the lazy build is an
import-cost optimization, not a semantic change.

## 4. Live vs precompute lane for this scenario

**This scenario's lane is `live`** (verified in [`s02_schelling.json`](../../../manifests/s02_schelling.json):
`"lane": "live"`, and on every variant). The lane is decided **from measurement** by the gate
(`classify_lane` in [`simlab/core/scenario.py`](../../../simlab/core/scenario.py)) — an AND of four
conditions:

- **pure-Python** — `SchellingScenario.pure_python = True` (Mesa is pure Python; no native blockers).
- **run time** < 3000 ms — the committed gate timings are well under the cap (e.g. `t50` ≈ 19 ms; the cold
  `t30` measurement ≈ 2630 ms includes one-time setup, still < 3 s).
- **trace size** < 1 MB — the largest committed trace (`t625`) is ≈ 94 KB, far under the cap.
- **wheel closure ⊆ live worker** — `wheels = ["numpy", "mesa"]`, and both are in `LIVE_WHEELS`. Mesa 3 was
  *measured* to run in Pyodide (numpy + pandas + scipy + networkx + sqlite3 + mesa), so ABM runs **live on
  real Mesa**, not a stand-in.

So S02 can run **live in the browser** under Pyodide. It is also **precomputed offline** in the local
`.venv` and the seeded trace committed (`data/artifacts/s02_schelling/<variant>-seed42.json`), so the static
viewer can instantly **replay** the canonical run without any cold-start. Either way the contract holds:
same `(params, seed)` → same trace.

> Note on the Mesa node's generic framing: the Mesa framework node describes Mesa as a *precompute-lane*
> engine in general (its SolaraViz server is unfit for a static SPA). That is the safe default for *heavy*
> Mesa models. S02/S03/S05 are light enough that the **measured** gate classifies them `live`; the precompute
> path is still used to commit the canonical replay. The per-scenario manifest is authoritative for the lane.

See the lane guides: [live lane (Pyodide)](../../guides/02_live-lane-pyodide.md) ·
[precompute pipeline](../../guides/01_precompute-pipeline.md).

Continue to results → [04_results-and-reading.md](./04_results-and-reading.md).
