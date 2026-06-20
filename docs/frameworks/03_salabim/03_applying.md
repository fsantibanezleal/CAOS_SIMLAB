# Salabim — 03 · Applying it

This page is the *decision* layer: what Salabim is actually for in CAOS_SIMLAB, how to
formalize the problem it solves, which scenarios touch it, the pattern to use it in, the
honest trade-offs from the research, and when to pick it over SimPy / Ciw.

Read order: [`01_installation.md`](./01_installation.md) → [`02_usage.md`](./02_usage.md) →
**you are here (03)**. Landing page: [`../03_salabim.md`](../03_salabim.md).

---

## 1. The problem it solves — and how to formalize it

The *kind* of problem Salabim addresses is the same family as SimPy: **a discrete-event
system you want to study by simulation**. Formalize it the standard DES way before reaching
for any tool:

- **Entities** with a life-story (customers, trucks, patients, calls).
- **Resources** of limited capacity they compete for (servers, bays, ambulances).
- **A stochastic arrival process** (typically Poisson → exponential inter-arrivals).
- **Service-time distributions** per stage.
- **KPIs to measure**: utilization `rho`, queue length `Lq`, wait `Wq`, time-in-system `W`,
  blocking/abandonment — see the [DES problem-type guide](../../problem-types/01_discrete-event-simulation.md).

Salabim's *specific* contribution on top of that formalization is **visual + statistical
batteries-included**: once the entity/resource/queue model is written, the monitors give you
the KPIs for free, and the animation layer can turn the run into a movie. So the question
Salabim answers is narrower than "can I simulate this?" — it is **"do I want a ready-made,
offline-rendered video of this DES run, or fast zero-to-animation while prototyping?"** If
yes, Salabim. If the deliverable has to run *in the browser*, Salabim is the wrong tool (see
§4–§5).

## 2. Salabim's one job in this lab: the offline movie-maker

The lab runs on a **three-lane** execution model (mirrors CAOS_SEISMIC):

1. **Live (browser / Pyodide):** cheap, pure-Python scenarios animate in real time as the
   learner moves sliders. Driven by **SimPy** emitting an event trace; **React** owns the
   pixels.
2. **Precompute (local machine):** heavy or native work runs offline and ships a compact
   committed artifact, replayed in the SPA under a *"precomputed due to cost; full pipeline
   in the repo"* banner.
3. **Deploy (GitHub Pages):** only serves the SPA + artifacts; zero server compute, no GPU, no display server.

Salabim belongs **only to lane 2**, and specifically as the **offline `.mp4`/`.gif`
render** for heavy scenarios — plus a **teaching chapter** showing zero-to-animation in pure
Python. The research is blunt about why:

> *"Salabim's headline feature — built-in 2D/3D animation — is rendered with tkinter
> (desktop GUI); it cannot be embedded in a web app. It can export `.mp4`/`.gif` offline
> (incl. headless via `blind_animation=True`), which is a perfect fit for the precomputed
> lane."* — research report 01 (DES frameworks).

So the recurring brief question — *"does Salabim's built-in animation change the live
build?"* — resolves to: **no for live (it can't go in the browser), yes for offline
videos.**

---

## 3. Which scenarios use it

Salabim is **not the engine of any live scenario** and **not on any hot path**. Its place is
the **DES teaching chapter / offline video** for the heavy precomputed scenarios whose
*models* are built in SimPy:

| Scenario | Salabim's role | Engine of record |
|---|---|---|
| **DES teaching chapter** | The "see it move in pure Python" counterpoint to SimPy — fast visual feedback for the modeller, batteries-included statistics. | — (didactic) |
| **S07 — Construction Haul Routing** *(DES leg)* | Optional **offline `.mp4`** of the (deterministic) load–haul–dump cycle, rendered locally, committed and replayed. | SimPy (deterministic DES) + OR-Tools CP-SAT (route-cost certificate) + NetworkX |
| **S09 — Ambulance Dispatch** *(DES leg)* | Optional **offline `.mp4`/`.gif`** of the seeded call stream over the city, rendered locally. | SimPy + NetworkX (no OR-Tools) |
| **S10 — Monte-Carlo / CI study** | Could illustrate one replication as a video; the *statistics* come from the joblib pipeline, not Salabim. | M/M/c heap estimator + joblib (CPU) |

The **live** scenarios (S01 bank/clinic queue, S04 ED flow) never use Salabim — they are
SimPy in the Pyodide worker with the React queue-network renderer. The scenario→tool map (in
the [DES problem-type guide](../../problem-types/01_discrete-event-simulation.md)) keeps Salabim
strictly in the offline column.

> Lab scope reminder: the live web build's interactive animation is React-over-SimPy. A
> committed Salabim video is a *ready-made replay clip* for a heavy scenario, sitting beside
> the interactive trace — not a replacement for it.

---

## 4. The pattern: model-in-SimPy, replay-render-in-Salabim (offline)

Salabim is **not** an optimize-then-simulate engine on its own; it plugs in at the *render*
end of the precompute lane:

```
                 (deterministic plan)            (stochastic eval)         (offline render)
OR-Tools / CP-SAT  ───────────────▶  SimPy DES model  ───────────────▶  Salabim .mp4/.gif
   propose                              dispose (KPIs +                     a ready-made
   the plan                            committed event trace)              replay video
```

- **Models of record stay in SimPy** for consistency across the lab (one engine, one trace
  schema, one gate). Where a polished replay clip adds didactic value for a *heavy* scenario,
  *also* build a Salabim view and render it **offline** with `blind_animation=True` +
  `env.video(...)` on the local machine.
- **Commit the compact artifact** (the video and/or the event trace), never the raw heavy
  run. The SPA replays it.
- **Determinism is the contract** on every lane: seed the solver *and* the simulation RNG so
  any committed video/trace regenerates exactly from the public repo.

This keeps Salabim's value (cheap, good-looking animation) without letting its desktop-only
renderer leak onto the hot path.

---

## 5. Honest trade-offs (grounded in the research)

**Why Salabim earns a place**

- **Built-in 2D/3D animation + statistics, in pure Python.** Zero-to-animation is fast; the
  monitors (`length.mean()`, `occupancy.mean()`, …) give queueing KPIs for free, which makes
  it a strong *teaching counterpoint* to SimPy (report 01).
- **Clean offline video pipeline.** `.mp4`/`.gif` export, headless-capable via
  `blind_animation=True`, is "correct and cheap" for the precomputed lane (adversarial
  report adv-04).
- **MIT-licensed**, like SimPy and Ciw — safe for a public repo, no copyleft contamination.

**Why it is *not* the live engine — the hard limits**

- **Animation is tkinter (desktop GUI).** It *cannot* be embedded in a web app, and a static
  host has no display server. Its live-build value is therefore **zero** — confirmed in
  report 01 and reaffirmed in adv-04 ("Salabim relegated to the offline-video lane —
  correct"). React owns the live pixels.
- **Headless rendering is fragile.** Video on a headless box needs `blind_animation=True` (or
  `pyvirtualdisplay`) and an `ffmpeg` binary; do the render on the local box, not in CI,
  to avoid flakiness (report 01, risks).
- **Pure-Python speed ceiling.** Like SimPy, Salabim is ~10–20× slower than a C++ engine on
  heavy DES and degrades as queues grow — another reason it stays in the *precompute* lane,
  not live.
- **Greenlet caveat in this lab.** The 26.x default *yieldless* mode needs the native
  `greenlet`, which the lab does not carry; use `yieldless=False` (classic `yield`). See
  [`01_installation.md` §3.1](./01_installation.md#31-important-platform-note--greenlet-is-not-installed-here).

---

## 6. When to pick Salabim vs the alternatives

| If you want… | Use | Not |
|---|---|---|
| A **live, in-browser** animated scenario the learner can tune | **SimPy** + React viewer (event trace) | Salabim — its renderer can't go in a browser |
| A **ready-made replay video** of a heavy scenario, rendered offline | **Salabim** `env.video(...)` + `blind_animation=True` | SimPy (no built-in renderer) |
| To validate a sim against **closed-form queueing theory** (M/M/c, blocking, networks) | **Ciw** (or SimPy with a theory overlay) | Salabim (no analytic layer) |
| The **canonical, most-transferable** DES teaching code | **SimPy** (de-facto standard, runs in Pyodide) | Salabim as primary (secondary chapter only) |
| Fast **zero-to-animation** locally while *prototyping* a model | **Salabim** (batteries-included viz) | — |

Rule of thumb: **SimPy is the engine of record and the live lane; Ciw is the theory lesson;
Salabim is the offline movie-maker and a teaching counterpoint.** Pick Salabim when the
deliverable is a *committed video of a heavy, offline run* — and never for anything that has
to run in the browser. See the sibling nodes [`../01_simpy.md`](../01_simpy.md) and
[`../02_ciw.md`](../02_ciw.md).

### Deprecated — do not use

`desmod` (a thin, near-dormant SimPy structuring layer) and `AgentPy` (an ABM library) show
up in older tutorials but are **deprecated and excluded** from this lab. If you see them
recommended elsewhere, ignore it: for DES use **SimPy / Ciw / Salabim**; for ABM use
**Mesa** (see [agent-based-modeling guide](../../problem-types/02_agent-based-modeling.md)).

---

## 7. Sources

Grounded in the CAOS_SIMLAB research dimensions:

- DES frameworks (report 01) — Salabim = offline movie-maker, tkinter desktop, MIT, headless
  via `blind_animation`. <https://www.salabim.org/manual/Animation.html>
- Adversarial frameworks/GPU critique (adv-04) — "Salabim relegated to the offline-video
  lane — correct and cheap."
- Scenario catalog (report 10) — scenario tiers and the live/precompute policy.
- Salabim — <https://www.salabim.org/> · PyPI `salabim 26.0.6` ·
  JOSS paper (van der Ham, 2018): <https://joss.theoj.org/papers/10.21105/joss.00767>
- Repo: <https://github.com/fsantibanezleal/CAOS_SIMLAB> · see also
  [`LICENSES.md`](../../../LICENSES.md) / [`ATTRIBUTION.md`](../../../ATTRIBUTION.md).
