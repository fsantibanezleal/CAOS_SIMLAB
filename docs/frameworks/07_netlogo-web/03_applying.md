# NetLogo Web (Tortoise) — 03 · applying it

How to **formalize** the kind of problem NetLogo Web solves, how to **solve it** with this engine, how it
fits **this lab's** scenarios, the honest trade-offs from the research, the **CC0 / CC BY-NC-SA license
nuance** that governs which models we may ship, and when to pick it over the alternatives.

---

## 1. Formalize the problem: when is this an ABM live card?

NetLogo Web is the right tool when **all** of these hold:

1. **The system is agent-based** — many simple autonomous entities, local rules, no central controller, and
   the interesting behavior is *emergent* (a global pattern no single agent encodes). Formally: a tuple
   `(A, S, N, f, U)` where `A` is the agent set, each agent `a∈A` has state `s_a∈S`, a neighborhood
   `N(a)⊆A` (here: NetLogo `patches`/`neighbors`), a local update rule `f(s_a, {s_b : b∈N(a)}) → s_a'`, and
   a tick scheduler `U` that applies `f` across `A` each step. Schelling, SIR, Wolf-Sheep, Flocking are all
   this shape.
2. **The scale is modest** — ~1e3–1e4 agents, so it runs smoothly in a browser (see §3 limits).
3. **The goal is "play first, understand later"** — the visitor should see it *move* and *react to a slider*
   within a second of landing, with **zero server compute** on a no-GPU VPS.

If any of those fails — millions of agents, a server-side data pipeline, a need to *trace and replay* an
exact run for teaching the code — you are in a different lane (§5).

## 2. Solve it with NetLogo Web: the workflow

Given a problem that fits §1, the end-to-end recipe is:

1. **Encode `(A, S, N, f)` as NetLogo source.** Agents = `turtles`; neighborhood = `patches`/`neighbors`;
   the local rule = `to go`; initialization = `to setup`. Expose the tunable parameters of `f` as
   **slider** widgets (e.g. Schelling's `pct-similar-wanted`, SIR's infection probability). See the
   concrete `setup`/`go` source in [`02_usage.md`](./02_usage.md) §2.
2. **Seed it.** `random-seed <fixed>` at the top of `setup` so the first-load run is reproducible — the
   live-lane equivalent of the Python scenarios' `rng=`/`seed=`.
3. **Export to standalone HTML** (desktop *Save As NetLogo Web…* or netlogoweb.org *Export → HTML*) — the
   Tortoise engine is inlined; the file is self-contained. See [`01_installation.md`](./01_installation.md) §2.
4. **Strip the IDE chrome** with the injected CSS so only the Interface shows
   ([`02_usage.md`](./02_usage.md) §3a).
5. **Commit the HTML** under `web/public/netlogo/` and embed it as a lazy, sandboxed `<iframe>` /
   `NetLogoCard` ([`02_usage.md`](./02_usage.md) §3b–3c).
6. **Record the model's license** in `ATTRIBUTION.md` (§4) and **screenshot-verify** the card before deploy.

The whole point: steps 1–4 happen **once at authoring time**; every visit just downloads a static file and
the visitor's browser does the simulating.

## 3. Which lab scenarios use NetLogo Web

NetLogo Web is the **LIVE in-browser ABM** engine — the "enter → straight to a running simulator" on-ramp.
Two scenarios get a NetLogo Web live card:

| Scenario | Live card | Sliders the visitor drags | What emerges, instantly |
|---|---|---|---|
| **S02 Schelling** (`simlab/scenarios/s02_schelling.py`) | segregation on a 2-D grid | `pct-similar-wanted` (tolerance), `density` | strong segregation from a *mild* local preference |
| **S03 SIR** (`simlab/scenarios/s03_sir.py`) | epidemic spreading | infection probability, recovery rate, contacts | an epidemic **wave** + the S/I/R curves over time |

These are the **classic ABM canon** and both exist as CC0-friendly NetLogo models, which is exactly why they
are the live-card picks (Schelling and "Virus"/SIR are textbook Models Library entries; we prefer the CC0
Code-Example variants or author our own — see §4).

### The two-engine framing (read this — it is the source of learner confusion)

The lab teaches ABM with **three** representations of the *same* model, and the docs must name the split
honestly or learners get lost:

1. **LIVE / instant play → NetLogo Web** (this node). Client-side JS, animated, sliders, **zero server
   compute**. The on-ramp: play first, understand later.
2. **Python precomputed card → Mesa 3** (`simlab/scenarios/s02_schelling.py`, `s03_sir.py`,
   `engine = "mesa"`): offline precompute → committed trace → static replay in the web viewer. The full
   `Agent`/`Model`/space abstractions, **rules fully visible in-repo** for teaching.
3. **Build-it-yourself / scale-up path → Mesa** in a Jupyter notebook. The framework whose abstractions
   *are* the curriculum; learners write their own models.

> The honest one-liner the live Theory pages must carry: **"NetLogo for instant in-browser play; Python
> + Mesa for how to build & trace it yourself."** Pair each NetLogo card with its Mesa precomputed
> equivalent so the lesson lands: *the concept is engine-independent; Mesa is the production engine.* See
> the [Mesa node](../04_mesa.md).

## 4. The pattern: client-side-live (no precompute, no replay)

NetLogo Web is the **one engine in the lab that does NOT use precompute-then-replay.** Every heavy engine
(Mesa, OR-Tools, JuPedSim, …) follows *simulate-offline → commit artifact → static replay*. NetLogo Web is
the opposite — the simulation **runs live in the visitor's browser**:

```text
authoring time (once)                              every visit (in the browser)
┌──────────────────────────┐  export   ┌──────────────────────────────────────────┐
│ NetLogo model + Interface ├──────────►│ Tortoise engine steps the model LIVE,     │
│ random-seed <fixed>       │  to HTML  │ draws the view, reacts to slider drags     │
└──────────────────────────┘           └──────────────────────────────────────────┘
        committed once as a static .html             VPS does ZERO compute
```

Why this lane exists at all, given the lab's precompute religion: it is the **cleanest way to honor
"enter → a running simulator"** on a **no-GPU, shared VPS**. A NumPy/Pyodide card must download the Pyodide
runtime before the first frame; a NetLogo Web card is native JS and starts faster, with no Python in the
browser. The cost is the trade-offs in §5.

It is also still **deterministic** in spirit: a fixed `random-seed` in `setup` makes the first-load run
reproducible — the same discipline as the seeded Python traces, just executed live instead of replayed.

## 5. Honest trade-offs (from the research)

Grounded in `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`.

**Strengths**
- **Zero server compute.** Pure client-side JS — the no-GPU VPS serves a static file and does nothing else.
  This is *the* architectural fit for the live lane.
- **Instant, animated, interactive for free.** Sliders, buttons, plots and a real-time view come straight
  out of the export — no UI code to write for the model itself.
- **Highest didactic pedigree.** NetLogo is *the* classic ABM teaching tool, with the world's largest
  curated didactic Models Library (Schelling, SIR/Virus, Wolf-Sheep, Fire, Flocking).
- **Same model, two engines.** The identical canonical model exists as a NetLogo card *and* a Python
  notebook/Mesa example — reinforcing that the concept is engine-independent.

**Limits / pitfalls**
- **In-browser scale ceiling (~1e3–1e4 agents).** Below Mesa's ~1e5 object ceiling and far below GPU lanes.
  Fine for the on-ramp models; anything large goes to Mesa / FLAME GPU 2 / ABMax / AMBER offline.
- **License nuance is a real hazard** for a public product — see §6. Shipping a CC BY-NC-SA model in a
  public repo without care is a licensing mistake.
- **Two-engine cognitive load.** Teaching Mesa while the live card runs on NetLogo (and the shipped Python
  card on Mesa precompute) can confuse learners; mitigate with the explicit framing in §3.
- **Engine-version / selector drift.** The chrome-strip CSS selectors and bundled-engine version can change
  across NetLogo Web releases; pin one engine version per committed model and re-verify selectors on export.
- **No `random-seed` ⇒ non-reproducible card.** Forgetting to seed `setup` makes each visit different,
  breaking the lab's determinism promise. Always seed.
- **Not a Python framework.** It does not live in any `requirements*.txt`; it cannot be unit-tested with
  pytest like the Python engines. Verification is "serve the HTML and look at it" (and screenshot-verify
  before deploy).

## 6. License nuance — the mixed CC0 / CC BY-NC-SA model

This is the single most important compliance fact for shipping NetLogo content in a **public** product, and
it is verified against NetLogo's own FAQ (not memory):

- The **Tortoise engine** is open source; its runtime deps are MIT / EPL-1.0 — fine to bundle.
- **NetLogo desktop** (the authoring tool) is **GPL-2.0+** — but we only *use* it to author; we don't
  redistribute the desktop app.
- **Model code license is mixed and per-model:**
  - **Code Examples** in the Models Library are **CC0 / public domain** — safe to ship and adapt freely.
  - **Most other Models Library models are CC BY-NC-SA** — Creative Commons Attribution-**NonCommercial**-
    ShareAlike. This is **not an open-source license**; it permits free *noncommercial* use with attribution
    and share-alike, but its NonCommercial clause is a problem for a public product that may later monetize.

**House rule for this lab (record + prefer CC0 + author our own):**

1. **Prefer CC0** — start from a *Code Example* variant whenever one exists for the model we want.
2. **Author our own** NetLogo model when no CC0 variant covers the scenario, or when a desired model is
   CC BY-NC-SA. Schelling and SIR are simple enough to write from scratch, making our card unambiguously
   ours to license.
3. **Record each embedded model's license** in `LICENSES.md` / `ATTRIBUTION.md` (component, license,
   source URL) — the same discipline the repo already applies to datasets and the SimPy/NumPy/OR-Tools
   engines.
4. **Never silently ship a CC BY-NC-SA model** as if it were ours. If we must reference one, attribute it
   and keep it clearly out of any commercial surface.

For S02 and S03 specifically: both are trivial to author cleanly, so the lab's live cards should be
**our own CC0-clean NetLogo models** (or CC0 Code-Example derivatives), recorded in `ATTRIBUTION.md`.

## 7. When to pick NetLogo Web vs the alternatives

| If you need… | Pick | Why |
|---|---|---|
| An **instant, zero-server, animated** in-browser ABM classic (Schelling, SIR, Wolf-Sheep) | **NetLogo Web** (Tortoise) | compiles to JS, runs fully client-side, no VPS compute |
| A **throwaway ≤10-line Python demo** where a framework is overkill | **hand-rolled NumPy** | fine for a one-off; the lab uses **Mesa 3** for S02/S03 (precomputed + replayed) |
| To **learn/teach + build/scale** ABM in Python (≤1e5 agents), with `DataCollector` / `batch_run` | **[Mesa 3](../04_mesa/03_applying.md)** (offline → replay) | the Python standard; abstractions = curriculum |
| **Real maps / GIS** in an ABM | **Mesa-Geo** | GeoAgents over Shapely/GeoPandas |
| **Millions of agents** | **[FLAME GPU 2 / ABMax / AMBER](../18_gpu-abm-chapter.md)** | GPU / vectorized / columnar scale beyond Mesa & the browser |
| **Crowd / pedestrian flow** | **JuPedSim** | validated social-force / collision-free-speed, pip-installable |

**Do not use** (explicitly out of scope):
- **AgentPy** — *deprecated*; its own authors point users to Mesa. Cite only as historical context.
- **desmod** — an unmaintained *DES* helper on SimPy; not used here. (Shows up in ABM/DES searches; for DES
  this lab uses SimPy / Ciw.)

## 8. Cross-references

- Node landing page: [`../07_netlogo-web.md`](../07_netlogo-web.md)
- How to author + export + obtain the engine: [`01_installation.md`](./01_installation.md)
- Chrome-strip + iframe/React embed snippet + verified facts: [`02_usage.md`](./02_usage.md)
- The Python ABM lane (build-it-yourself / scale-up): [`../04_mesa/03_applying.md`](../04_mesa/03_applying.md)
- ABM problem-type guide: [`../../problem-types/02_agent-based-modeling.md`](../../problem-types/02_agent-based-modeling.md)
- Research (decision + trade-offs + license nuance): `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`
