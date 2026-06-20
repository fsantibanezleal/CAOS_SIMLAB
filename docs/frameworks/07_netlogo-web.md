# 07 · NetLogo Web (Tortoise) — the LIVE in-browser ABM engine

**NetLogo Web** is the classic NetLogo agent-based-modeling language compiled to **JavaScript** by the
**Tortoise** compiler/runtime. It is not a Python package — you author a model (in NetLogo desktop or on
netlogoweb.org), **export it to a self-contained HTML file** with the engine inlined, and that file runs the
simulation **entirely in the visitor's browser**. In this lab it owns the **LIVE on-ramp lane**: a visitor
lands on a scenario page and a real, animated simulator is *already running* — sliders, plots, a 2-D view —
served as a static file by a no-GPU VPS that does **zero compute**. It is the only engine here that
simulates live in the browser without Pyodide (native JS, smaller cold-start), which is precisely why it
carries the "enter → a running simulator, instantly" promise.

**When to use it:** modest-scale (~1e3–1e4 agents) ABM classics — Schelling segregation, SIR epidemics,
Wolf-Sheep, Flocking — where the goal is *play first, understand later* with no server cost. **How the lab
uses it:** it is a zero-server instant-play on-ramp, the JS half of a deliberate two-engine pairing. Each
NetLogo card has a twin **Mesa 3** card (which runs **live in Pyodide**, backed by a committed canonical
replay) so the lesson lands cleanly: *the concept is engine-independent; NetLogo runs instantly as compiled
JS with no Pyodide load, Python + Mesa is the real engine — also live, plus the exact committed trace — for
how to build and reproduce it yourself.* The difference is the runtime (native JS vs Pyodide-Python), not
live-vs-precompute: both run live. For anything large (millions of agents) the lab routes to the GPU-ABM
chapter (see below). The one hard compliance fact: NetLogo model
licenses are **mixed** (Code Examples are CC0; most Models Library models are CC BY-NC-SA — *not* open
source), so the lab prefers CC0 or authors its own models — detailed in the applying page.

## Read the node in order

1. [`./07_netlogo-web/01_installation.md`](./07_netlogo-web/01_installation.md) — what "installing" means
   for a JS engine (no pip, no `requirements*.txt`), how to author + export a model to standalone HTML, how
   to obtain the raw engine artifacts, and the platform/no-CUDA/no-Pyodide notes.
2. [`./07_netlogo-web/02_usage.md`](./07_netlogo-web/02_usage.md) — the real concepts (the
   `setup`/`go`/seed contract), a concrete seeded NetLogo source, and the **runnable artifact**: the
   chrome-strip CSS + lazy sandboxed `<iframe>` / `NetLogoCard` React embed, plus what the rendered card
   should show (this node's stand-in for stdout, since there is no `example.py`).
3. [`./07_netlogo-web/03_applying.md`](./07_netlogo-web/03_applying.md) — how to *formalize* an ABM problem
   `(A, S, N, f, U)` and *solve* it with this engine, which lab scenarios use it, the client-side-live
   pattern, the honest research trade-offs, the CC0 / CC BY-NC-SA license nuance, and when to pick it vs the
   alternatives.

## No `example.py` for this node

NetLogo Web is **JavaScript, not Python**, so this node intentionally has **no `example.py`** and **no
captured stdout block** — the established convention for the JS/reference frameworks (cf. the
[GPU-ABM reference chapter](./18_gpu-abm-chapter.md)). The equivalent runnable artifact is the HTML/JS embed in
[`./07_netlogo-web/02_usage.md`](./07_netlogo-web/02_usage.md) §3; you verify it by serving the exported
HTML and looking at the animated card (see
[`./07_netlogo-web/01_installation.md`](./07_netlogo-web/01_installation.md) §6).

## Scenarios that use this framework

| Scenario | NetLogo Web card (JS, this engine) | Python twin (Mesa 3 — runs live in Pyodide + committed replay) |
|---|---|---|
| **S02 — Schelling segregation** | segregation on a 2-D grid; sliders: `pct-similar-wanted`, `density` | `simlab/scenarios/s02_schelling.py` (`engine = "mesa"`) |
| **S03 — SIR epidemic** | epidemic wave + S/I/R curves; sliders: infection prob., recovery, contacts | `simlab/scenarios/s03_sir.py` (`engine = "mesa"`) |

## See also

- ABM problem-type guide: [`../problem-types/02_agent-based-modeling.md`](../problem-types/02_agent-based-modeling.md)
- The Python ABM lane (build-it-yourself / scale-up): [`./04_mesa.md`](./04_mesa.md)
- Beyond-the-browser scale (millions of agents): [`./18_gpu-abm-chapter.md`](./18_gpu-abm-chapter.md)
- Live-lane runtime guide (NetLogo Web vs Pyodide): [`../guides/02_live-lane-pyodide.md`](../guides/02_live-lane-pyodide.md)
- Research (decision + trade-offs + license nuance): `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`
