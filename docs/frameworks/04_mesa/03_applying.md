# Mesa — applying it

How to take Mesa from the toy in [02_usage.md](./02_usage.md) to a real ABM, where it fits in **this lab's**
scenarios, the honest trade-offs from the research, and when to pick it over the alternatives.

← Back to the framework landing page: [../04_mesa.md](../04_mesa.md) · Install:
[01_installation.md](./01_installation.md) · API + verified run: [02_usage.md](./02_usage.md)

---

## 1. Formalize the problem, then solve it with Mesa

ABM is the right lens when the question is **"what global pattern do these local rules produce?"** — not
"what is the optimal decision?" (that is [optimization](../../problem-types/03_optimization-routing.md), a
different problem type) and not "how do entities flow through resources?" (that is
[discrete-event simulation](../../problem-types/01_discrete-event-simulation.md)). To formalize an ABM you
specify four things — and each maps one-to-one onto a Mesa abstraction:

| Formal element | Question it answers | Mesa expression |
|---|---|---|
| **Agents + state** | who acts, and what do they remember? | `mesa.Agent` subclass with attributes |
| **Environment / topology** | who is a neighbor of whom? | a space: `SingleGrid` / `NetworkGrid` / `MultiGrid` / Mesa-Geo |
| **Local rule** | what does one agent do per tick, given its neighbors? | `Agent.step()` |
| **Activation + time** | in what order, and how is "a tick" defined? | `Model.step()` → `self.agents.shuffle_do("step")` |
| **(plus) Seed** | how do we make the run reproducible? | `super().__init__(rng=<int>)` |

The **solve loop** is then: instantiate the `Model` with a fixed `rng=`, call `model.step()` for N ticks,
and read out an observable each tick (a `DataCollector` reporter, or a hand-written metric like the
`happy_fraction` in the example). Because every random draw flows through the seeded RNG, the resulting
trajectory is the *one true run* — which is exactly what the lab commits and replays. There is no separate
"solver"; in ABM the **run is the answer**.

## 2. Which lab scenarios involve Mesa

Mesa is the **ABM** framework. Three lab scenarios are agent-based models:

| Scenario | Source | Model | Space | What emerges |
|---|---|---|---|---|
| **S02 Schelling** | [`s02_schelling.py`](../../../simlab/scenarios/s02_schelling.py) | segregation | 2-D grid, Moore neighborhood | strong segregation from a mild local preference |
| **S03 SIR** | [`s03_sir.py`](../../../simlab/scenarios/s03_sir.py) | epidemic | 2-D grid (lattice contacts) | an epidemic wave from per-cell infection/recovery |
| **S05 Beer Game** | [`s05_beergame.py`](../../../simlab/scenarios/s05_beergame.py) | supply chain | serial echelons (a small network) | the *bullwhip effect* — demand swings amplify upstream |

Mesa's `Agent` / `Model` / space / `AgentSet` abstractions map one-to-one onto these, which is why the lab
**teaches** ABM through Mesa's vocabulary — *the abstractions are the curriculum*.

### The honest framing (read this before claiming how the lab runs Mesa)

> **The lab's S02 / S03 / S05 run on REAL Mesa 3, LIVE in the browser.** Verified in source:
> `simlab/scenarios/s02_schelling.py`, `s03_sir.py` and `s05_beergame.py` all use `mesa.Agent` /
> `mesa.Model` / `AgentSet` activation (engine = "mesa") and `import mesa`. All three carry
> `lane: "live"` in their manifests; the browser worker `micropip.install`s `mesa` and it was *measured*
> to clear the 4-gate rule (`mesa ⊆ LIVE_WHEELS`, run < 3 s after a ~3 s cold start, trace < 1 MB). The
> same seeded models are *also* run headless in the local pipeline to commit a canonical replay artifact
> for instant first paint and byte-for-byte reproducibility.

That split — live Mesa engine *plus* a committed canonical replay — is the architecture for Mesa:

1. **Mesa runs live; a committed trace is the first paint.** The page loads instantly from a deterministic
   committed trace (Arrow/JSON), then a live Run button re-executes real Mesa 3 in Pyodide on top of it.
   What does *not* ship is **SolaraViz** (Mesa's server-bound visualization) — the lab's React/SVG viewer
   owns the pixels instead, on a static SPA with zero server compute.
2. **Mesa rules are fully visible in the code and the paper.** The lab is didactic. The `Agent.step()`
   and `Model.step()` implementations are in-repo; learners read the Mesa abstractions directly from the
   source, not hidden inside a framework blackbox.
3. **Live for pure-Python; precompute only for native code.** Pure-Python engines whose wheels ⊆
   `LIVE_WHEELS` (SimPy, Ciw, **Mesa**, joblib/scipy, networkx) run live under Pyodide. The precompute lane
   is reserved for the **native-code** engines that cannot run in WASM — OR-Tools CP-SAT/GLOP (S06, S07,
   S08, S11) — which are seeded offline, committed, and replayed.

So Mesa's role in this lab is **the real ABM engine, run live in the browser**, teaching the curriculum via
`Agent`/`Model`/space abstractions; the committed trace is only the canonical replay (first paint), and the
precompute path is just where that canonical artifact is produced — not a claim that Mesa cannot run live.

---

## 3. The pattern: live Mesa + a committed canonical replay

Mesa fits the lab's architecture as **commit a seeded canonical trace → first paint → re-run live in
Pyodide**:

```
local .venv (Mesa, headless)        committed artifact      web SPA (Pyodide live)
┌───────────────────────────┐        ┌──────────────┐       ┌─────────────────────────┐
│ Model.step() each tick →   │ record │ trace.arrow  │ first │ React player first-paints│
│ DataCollector / frame trace├───────►│  / .json     ├──────►│ the trace, then a "Run"  │
└───────────────────────────┘        └──────────────┘ paint │ button re-runs real Mesa │
        seeded (rng=…)                small & versioned      │ live via micropip+Pyodide│
                                                             └─────────────────────────┘
```

The committed seeded trace gives instant first paint and a *one true* run reproducible by anyone who clones
the repo; the live Run then re-executes real Mesa 3 in the browser (same `rng=` ⇒ same trajectory). Native
engines (OR-Tools) cannot do the live step and stay replay-only — but Mesa can and does.

For ABM specifically the variant is **build-then-observe** rather than *optimize-then-simulate*: ABM does
not prescribe a decision, it reveals the dynamics a rule set produces. (Contrast Optimization scenarios
like S06, which *do* follow optimize-then-simulate: solve with OR-Tools CP-SAT, then animate the schedule.)

See the pipeline guide: [../../guides/01_precompute-pipeline.md](../../guides/01_precompute-pipeline.md) and the
live-lane rationale: [../../guides/02_live-lane-pyodide.md](../../guides/02_live-lane-pyodide.md).

---

## 4. Honest trade-offs (from the research)

Grounded in `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`:

**Strengths**
- **De-facto Python ABM standard** — Apache-2.0, actively maintained, JOSS-published (2025), huge community
  and example library. Choosing it is the low-risk, well-documented default.
- **Clean, teachable abstractions** — `Agent` / `Model` / space / `AgentSet` *are* the ABM concepts.
- **First-class spaces** — grid, network (`NetworkGrid`), cell-space; real maps via **Mesa-Geo** (GeoAgents
  over Shapely/GeoPandas).
- **Batteries for studies** — `DataCollector` (tidy DataFrames) and `batch_run` (seeded parameter sweeps).

**Limits / pitfalls**
- **Not a web-serving engine.** SolaraViz is a stateful Python process per session; do **not** put it
  behind nginx for public users. Use it locally; serve replays. *(Primary architectural risk.)*
- **Object-per-agent ceiling (~1e5 agents).** Mesa bogs down past ~100k agents. If a "heavy" scenario needs
  more, route it to **FLAME GPU 2** (CUDA), **ABMax** (JAX) or **AMBER** (Polars) — do not fight Mesa.
- **CPU-only, no GPU.** Fine for the lab's small models; irrelevant for million-agent scale.
- **Replay-vs-live nuance.** The ABM pages must be explicit that the page first paints from a committed
  canonical trace and *then* re-runs real Mesa 3 live in Pyodide on a Run — so learners do not mistake the
  instant first paint for "Mesa isn't really running." (NetLogo Web remains a separate zero-server in-browser
  on-ramp for the classic models.)

---

## 5. When to pick Mesa vs the alternatives

| If you need… | Pick | Why |
|---|---|---|
| To **learn/teach** ABM in Python; build small–medium models (≤1e5 agents) | **Mesa 3** | the standard; abstractions = curriculum |
| **Real maps / GIS** in an ABM | **Mesa-Geo** ([../mesa-geo/](../05_mesa-geo.md)) | GeoAgents over Shapely/GeoPandas, Leaflet |
| An **instant, zero-server in-browser** animated classic (Schelling, SIR, Wolf-Sheep) | **NetLogo Web** ([../netlogo-web/](../07_netlogo-web.md)) | compiles to JS, runs fully client-side, zero VPS compute |
| A **throwaway ≤10-line demo** where a framework is overkill | **hand-rolled NumPy** | fine for a one-off; the lab instead uses **Mesa 3** for S02/S03/S05 (run live in Pyodide, with a committed canonical replay) — real abstractions, reproducible |
| **Millions of agents** | **FLAME GPU 2** / ABMax / AMBER ([../gpu-abm-chapter/](../18_gpu-abm-chapter.md)) | GPU / vectorized / columnar scale beyond Mesa's ceiling |
| **Crowd / pedestrian flow** | **JuPedSim** ([../jupedsim/](../06_jupedsim.md)) | validated social-force / collision-free-speed, pip-installable |

**Do not use** (explicitly out of scope):
- **AgentPy** — *deprecated*; its own authors now point users to Mesa. Cite only as historical context.
- **desmod** — a *DES* helper (built on SimPy), also unmaintained; not used here. (Listed because it shows
  up in ABM/DES searches — for DES this lab uses SimPy/Ciw, not desmod.)

---

## 6. Cross-references

- ABM problem-type guide: [../../problem-types/02_agent-based-modeling.md](../../problem-types/02_agent-based-modeling.md)
- How to install / which requirements file: [01_installation.md](./01_installation.md)
- API + runnable example + verified output: [02_usage.md](./02_usage.md)
- Runnable example source: [example.py](./example.py)
- Live-lane rationale (why Mesa runs in Pyodide): [../../guides/02_live-lane-pyodide.md](../../guides/02_live-lane-pyodide.md)
- Research (decision + trade-offs): `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`
