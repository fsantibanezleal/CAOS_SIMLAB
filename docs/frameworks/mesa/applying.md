# Mesa — applying it

How to take Mesa from the toy in [usage.md](./usage.md) to a real ABM, where it fits in **this lab's**
scenarios, the honest trade-offs from the research, and when to pick it over the alternatives.

---

## 1. Which lab scenarios involve Mesa

Mesa is the **ABM** framework. Three lab scenarios are agent-based models:

| Scenario | Model | Space | What emerges |
|---|---|---|---|
| **S02 Schelling** | segregation | 2-D grid, Moore neighborhood | strong segregation from a mild local preference |
| **S03 SIR** | epidemic | 2-D grid (lattice contacts) | an epidemic wave from per-cell infection/recovery |
| **S05 Beer Game** | supply chain | serial echelons (a small network) | the *bullwhip effect* — demand swings amplify upstream |

Mesa's `Agent` / `Model` / space / `AgentSet` abstractions map one-to-one onto these, which is why the lab
**teaches** ABM through Mesa's vocabulary — *the abstractions are the curriculum*.

### The honest caveat (read this before claiming "the lab runs on Mesa")

> **The lab's *shipped* S02 / S03 / S05 are hand-rolled on NumPy, not on Mesa.** Verified in source:
> `simlab/scenarios/s02_schelling.py`, `s03_sir.py` and `s05_beergame.py` all declare `engine = "numpy"`
> and contain no `import mesa`. `requirements.txt` says so explicitly.

There are three reasons, and they are exactly the trade-off boundary for Mesa:

1. **Pyodide wheel closure must stay tiny.** The scenarios run *live in the browser*. Pulling Mesa (plus
   pandas + networkx) into the Pyodide closure would bloat cold-start. NumPy is already in the closure.
2. **Every agent rule must be visible in-repo for teaching.** The lab is didactic; a ~30-line NumPy sweep
   that a learner can read top-to-bottom beats an opaque framework call.
3. **These canonical models are tiny and vectorize cleanly.** At ~300–1000 cells, a NumPy sweep is simpler
   and faster than per-object agent activation; a framework would add overhead, not value.

So Mesa's role in this lab is **(a) the conceptual reference** the docs and Theory pages teach against, and
**(b) the engine you reach for in the offline precompute lane** when a model outgrows a hand-rolled sweep
(heterogeneous agents, network spaces, large suites). It is **not** the live engine. That is the truthful
framing — see `wip/caos-simlab/content/fix-mesa-framing.md`.

---

## 2. The pattern: precompute-then-replay

Mesa fits the lab's architecture as **simulate-offline → record → replay**:

```
local .venv (Mesa, headless)            committed artifact        web SPA (no compute)
┌───────────────────────────┐           ┌──────────────┐          ┌──────────────────┐
│ Model.step() each tick →   │  record   │ trace.arrow  │  serve   │ React/Vite player │
│ DataCollector / frame trace├──────────►│  / .json     ├─────────►│ scrubs the frames │
└───────────────────────────┘           └──────────────┘          └──────────────────┘
        seeded (rng=…)                    small & versioned          deterministic replay
```

This is the same pattern the lab uses for every heavy engine (it mirrors CAOS_SEISMIC: local compute →
committed artifact → static viewer). The **seed** is what makes it sound: a fixed `rng=` means the
committed trace is the *one true* run, reproducible by anyone who clones the repo.

For ABM specifically the variant is **build-then-observe** rather than *optimize-then-simulate*: ABM does
not prescribe a decision, it reveals the dynamics a rule set produces. (Contrast Optimization scenarios
like S06, which *do* follow optimize-then-simulate: solve with OR-Tools CP-SAT, then animate the schedule.)

---

## 3. Honest trade-offs (from the research)

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
- **Two-engine cognitive load.** Teaching Mesa while the live cards run on NumPy (and the *live* on-ramp
  uses NetLogo Web) can confuse learners — the docs mitigate by framing it explicitly ("NumPy/NetLogo for
  instant play; Mesa for how to build & scale it yourself").

---

## 4. When to pick Mesa vs the alternatives

| If you need… | Pick | Why |
|---|---|---|
| To **learn/teach** ABM in Python; build small–medium models (≤1e5 agents) | **Mesa 3** | the standard; abstractions = curriculum |
| **Real maps / GIS** in an ABM | **Mesa-Geo** | GeoAgents over Shapely/GeoPandas, Leaflet |
| An **instant, zero-server in-browser** animated classic (Schelling, SIR, Wolf-Sheep) | **NetLogo Web** (Tortoise) | compiles to JS, runs fully client-side, zero VPS compute |
| **Tiny canonical model that must ship into the browser & stay readable** | **hand-rolled NumPy** | what S02/S03/S05 actually do — minimal wheel, visible rules |
| **Millions of agents** | **FLAME GPU 2** / ABMax / AMBER | GPU / vectorized / columnar scale beyond Mesa's ceiling |
| **Crowd / pedestrian flow** | **JuPedSim** | validated social-force / collision-free-speed, pip-installable |

**Do not use** (explicitly out of scope):
- **AgentPy** — *deprecated*; its own authors now point users to Mesa. Cite only as historical context.
- **desmod** — a *DES* helper (built on SimPy), also unmaintained; not used here. (Listed because it shows
  up in ABM/DES searches — for DES this lab uses SimPy/Ciw, not desmod.)

---

## 5. Cross-references

- ABM problem-type guide: [../../problem-types/agent-based-modeling.md](../../problem-types/agent-based-modeling.md)
- How to install / which requirements file: [installation.md](./installation.md)
- API + runnable example + verified output: [usage.md](./usage.md)
- Truthful Mesa framing in the live Theory pages: `wip/caos-simlab/content/fix-mesa-framing.md`
- Research (decision + trade-offs): `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`
