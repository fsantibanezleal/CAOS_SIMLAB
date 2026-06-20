# Architecture — deterministic-replay public simulation viewer

CAOS_SIMLAB is a **static** web product: there is no application server. Every simulation either runs
**live in the browser** or is **precomputed offline and replayed**. This keeps it free to host, immune to
request-time abuse, and reproducible.

## The contract

A run is a pure function of `(params, seed)`. The same inputs always produce the same **trace** (a
compact, JSON timeline of events + KPIs). The trace is the source of truth; the front end only animates
it. This is the same "deterministic core is truth, the presentation layer only renders it" discipline as
deterministic-first generative apps — here applied to simulation replay rather than LLM output.

## Two planes, dedicated engines

The whole point of the lab is to use the **real, dedicated, state-of-the-art tool for each problem type**
(not hand-rolled stand-ins). The local plane has no restriction and runs every engine; the live plane is
kept light. Which tool each scenario uses is documented in [problem-types/](problem-types/) and
[frameworks/](frameworks/).

1. **Live** — pure-Python scenarios run in a Pyodide Web Worker (editable params, real-time animation, zero
   server compute): **SimPy** for DES, **Mesa 3** for ABM (with **NetLogo Web** as the alternate
   client-side-JS ABM engine). What clears the 3-gate runs live; the rest is replayed.
2. **Precomputed (local plane)** — the heavy/native/SOTA engines run **offline in the local `.venv`** into
   a committed seeded trace + manifest, replayed with a scrubber: **OR-Tools** (CP-SAT / Routing / GLOP),
   **PyVRP** (SOTA VRP), **NetworkX/OSMnx** (road graphs), **Mesa/Mesa-Geo** + **JuPedSim** (ABM/crowds),
   **Ciw**/**Salabim** (DES queueing + offline video), **joblib + SciPy** (Monte-Carlo / CIs), and the
   optional **CuPy/Numba/Taichi/JAX** GPU lane. See [guides/precompute-pipeline.md](guides/precompute-pipeline.md).
3. **Host** — GitHub Pages serves the built SPA + the committed traces. No backend, no VPS.

## The 3-gate rule (`simlab/core/scenario.py`)

A scenario may run **live** only if **all three** hold; otherwise it is **precomputed**:

1. **pure-Python** — the engine can run in Pyodide/WASM (native code like OR-Tools cannot → precompute).
2. **fast** — a run completes in **< 3 s** in-Worker on a mid laptop.
3. **small** — the animatable trace is **< ~1 MB**.

The verdict and the measured numbers are written into each scenario's manifest, and CI fails the build if
anything tagged "live" breaches a gate — so "live mislabeling" cannot ship.

## Deploy

GitHub Pages, branch `main`, custom domain `simlab.fasl-work.com` (`git-as-data`: committing a new trace
re-publishes the site). See the management repo for the deploy workflow + DNS.
