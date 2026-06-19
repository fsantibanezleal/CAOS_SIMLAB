# Architecture — deterministic-replay public simulation viewer

CAOS_SIMLAB is a **static** web product: there is no application server. Every simulation either runs
**live in the browser** or is **precomputed offline and replayed**. This keeps it free to host, immune to
request-time abuse, and reproducible.

## The contract

A run is a pure function of `(params, seed)`. The same inputs always produce the same **trace** (a
compact, JSON timeline of events + KPIs). The trace is the source of truth; the front end only animates
it. This is the same "deterministic core is truth, the presentation layer only renders it" discipline as
deterministic-first generative apps — here applied to simulation replay rather than LLM output.

## Three lanes

1. **Live** — pure-Python scenarios (SimPy/Mesa) run in a Pyodide Web Worker. Editable params, real-time
   animation, zero server compute.
2. **Precomputed** — scenarios that fail the live gate (native solvers like OR-Tools, large agent counts,
   GPU work) are run by the local pipeline into a committed seeded trace + manifest, replayed with a
   scrubber.
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
