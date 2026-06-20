# 03 · Solvers applied — S03 SIR Epidemic

← Back to the use-case index: [../03_s03_sir.md](../03_s03_sir.md) ·
Formalization: [02_formalization.md](./02_formalization.md)

Which dedicated tool solves this, **how** (the concrete API), **why** it's the right tool, and the
**live-vs-precompute lane**. Tool node: [Mesa — Agent-Based Modeling](../../frameworks/04_mesa.md).

---

## The tool: Mesa 3

S03 is built on the **real Mesa 3** ABM framework (engine `"mesa"`, `wheels = ["numpy", "mesa"]`), not a
hand-rolled NumPy sweep. ABM has **no separate "solver"**: in agent-based modeling the *run is the answer* —
you instantiate the model with a fixed seed, call `step()` for `T` ticks, and read out the observable each
tick. Mesa is the engine that runs that loop with first-class agent/space abstractions.

### How the four ABM ingredients map onto Mesa (verified in [`s03_sir.py`](../../../simlab/scenarios/s03_sir.py))

| Formal element | Mesa expression | In `s03_sir.py` |
|---|---|---|
| **Agents + state** | `mesa.Agent` subclass | `class SIRAgent(mesa.Agent)` carrying `self.state ∈ {S, I, R}` |
| **Space / topology** | a Mesa space | `SingleGrid(size, size, torus=False)` — one agent per cell, non-toroidal |
| **Neighbour query** | space API | `self.model.grid.iter_neighbors(self.pos, moore=True)` → `infected_neighbors()` |
| **Local rule + tick** | `Model.step()` over the `AgentSet` | `SIRModel.step()` iterates `self.agents`, draws S→I then I→R |
| **Seed (reproducibility)** | `super().__init__(rng=<int>)` | `SIRModel.__init__` calls `super().__init__(rng=int(seed))` |

### The concrete API / approach

1. **Model construction.** `SIRModel.__init__(size, beta, gamma, init_infected, seed)` calls
   `super().__init__(rng=int(seed))` — Mesa 3 seeds **both** `self.random` (a Python `random.Random`) and
   `self.rng` (a NumPy `Generator`) from this one int. It then builds `SingleGrid(size, size, torus=False)`,
   creates `n²` `SIRAgent`s with seeded initial states, and `grid.place_agent(agent, (x, y))` at the
   row-major position. `self.total_agents = len(self.agents)` caches the population.
2. **The tick — a synchronous SIR sweep.** `SIRModel.step()` iterates `self.agents` (Mesa's `AgentSet`) in
   stable order. For each `S` cell it computes `k = infected_neighbors()` and, if `k > 0`, draws
   `self.random.random() < 1 − (1 − β)^k`; for each `I` cell it draws `self.random.random() < γ`. Cells that
   flip are buffered in `new_infected` / `new_recovered` and applied **after** the scan, so every read uses
   `x(t)` — a true simultaneous update.
   - Note: unlike the generic Mesa idiom `self.agents.shuffle_do("step")`, this scenario drives transitions
     centrally from `Model.step()` and keeps the order **stable** (not shuffled). That is deliberate: a
     synchronous cellular sweep must decide every transition from the same start-of-step board, and a fixed
     order keeps the committed trace reproducible.
3. **Readout per tick.** `model.counts()` returns `(S, I, R)` population counts; `model.grid_snapshot()`
   flattens the grid to a row-major list of state codes for the frame. The scenario's `run()` records a frame
   + the S/I/R fractions each step into a `GridTrace`, tracks the running infected peak, and **breaks early**
   when `I = 0` (burnout) or at the step cap.
4. **Lazy import.** The `SIRAgent` / `SIRModel` classes are built inside `_models()` (cached) so `import mesa`
   only happens when `run()` is called — importing the scenario module (registry, `variants()`, `param_specs`)
   needs **zero** heavy deps. This keeps the live worker's cold-start import graph minimal.

### Why Mesa (vs the alternatives)

- **The abstractions are the curriculum.** `Agent` / `Model` / space / `AgentSet` *are* the ABM concepts, so
  the in-repo `step()` code teaches ABM directly rather than hiding it in a black box. The lab deliberately
  uses Mesa here instead of a "≤10-line NumPy" toy precisely so the model is *real* and reproducible.
- **It's the de-facto Python ABM standard** — Apache-2.0, actively maintained, JOSS-published — the low-risk
  default for small–medium models (≤ ~1e5 agents; this grid is ~1 444).
- **First-class spaces & seeding.** `SingleGrid` + `iter_neighbors(moore=True)` give the exact lattice-contact
  topology, and `rng=` makes the run a pure function of `(params, seed)`.
- When you'd pick something else: **NetLogo Web** for a zero-server in-browser classic, **Mesa-Geo** for real
  maps, **FLAME GPU 2 / ABMax / AMBER** for million-agent scale. See the decision table in
  [04_mesa/03_applying.md](../../frameworks/04_mesa/03_applying.md).

---

## Live-vs-precompute lane for S03

**S03 runs in the LIVE lane.** Verified in the committed manifest (`manifests/s03_sir.json` → `"lane":
"live"`, `engine: "mesa"`, `wheel_closure: ["numpy", "mesa"]`).

The lab's **3-gate rule** (`classify_lane` in
[`simlab/core/scenario.py`](../../../simlab/core/scenario.py)) admits a scenario to the live lane only if it
is **pure-Python AND** finishes a run in-Worker in **< 3 s AND** its trace is **< ~1 MB AND** its wheel
closure ⊆ `LIVE_WHEELS`. S03 sets `pure_python = True` and `wheels = ["numpy", "mesa"]`, and **both** wheels
are in `LIVE_WHEELS` (Mesa 3 was *measured* to run under Pyodide: cold start ~3 s for the
numpy+pandas+scipy+networkx+sqlite3+mesa closure, a 20-step 2500-agent run ~2.3 s). So the browser runs the
**real Mesa 3 model live**, seeded — it is **not** a stand-in.

What "live + committed trace" means here, in practice:

- The precompute pipeline still runs every variant offline and commits a `GridTrace` per variant
  (`data/artifacts/s03_sir/<variant>-seed<seed>.json`) plus `manifests/s03_sir.json`. The app **replays** a
  tiny committed trace instantly on first paint while the Pyodide worker warms up, and uses the manifest's
  KPIs/variants for the selector — zero compute needed to compare regimes.
- The **same render path** animates a live re-run and a replayed trace identically, because both are the same
  `GridTrace` schema (`simlab.gridtrace/v1`) and a run is deterministic from `(params, seed)` — "replay =
  truth".

> **Honesty note on the framework page.** The Mesa node ([04_mesa.md](../../frameworks/04_mesa.md)) frames
> Mesa generally as a *precompute-lane* engine (SolaraViz can't be served publicly). For S03 specifically the
> measured gate result and the committed manifest both say **live** — real Mesa 3 in Pyodide — with the
> committed trace serving as the instant-first-paint / offline-replay fallback. The code and manifest are the
> authority used here.

---

Next: [04 · Results & reading](./04_results-and-reading.md) — the regimes and how to read the viz.
