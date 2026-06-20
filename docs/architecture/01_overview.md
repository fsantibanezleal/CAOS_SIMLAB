# 01 · Overview — the two-plane, static design

CAOS_SIMLAB is a **static** web product: there is no application server, no request-time database, no
backend that simulates on demand. Every simulation either runs **live in the visitor's browser** or is
**precomputed offline and replayed**. That single decision — keep the host static — is what makes the lab
free to host, immune to request-time abuse, trivially scalable, and reproducible by anyone who clones the
repo.

## Why static

A simulation/optimization lab is exactly the kind of thing that tempts you to stand up a backend: "let the
server run the solver." We deliberately do not, for four reasons:

- **Cost.** GitHub Pages serves the built SPA plus the committed traces for free. No VPS, no GPU, no
  autoscaling bill that grows with curiosity.
- **Abuse surface.** A public endpoint that runs an OR-Tools solve on arbitrary input is a denial-of-service
  target. There is no such endpoint here — heavy work happened offline, once, before deploy.
- **Concurrency.** Live runs execute on the visitor's own CPU (Pyodide in a Web Worker), so "many people
  tuning sliders at once" costs us nothing and never queues.
- **Reproducibility.** What ships is the exact engine source plus seeded traces. Cloning the repo and running
  `python -m simlab.pipeline` reproduces the committed bytes (see
  [02_determinism-and-trace.md](./02_determinism-and-trace.md)).

## The two planes

The whole point of the lab is to use the **real, dedicated, state-of-the-art tool for each problem type** —
not hand-rolled stand-ins. To keep that promise *and* stay static, work is split across two planes:

1. **Live plane (browser).** Light, pure-Python scenarios run in a [Pyodide](https://pyodide.org) Web Worker
   (CPython compiled to WebAssembly). Editing a slider re-runs the *real* `simlab` engine in WASM and the UI
   animates the fresh trace. Zero server compute, effectively unbounded concurrency. The engines that live
   here are the ones whose wheel closure the worker can load and that clear the gate: **SimPy** (DES),
   **Ciw** (M/M/c validation), **Mesa 3** (ABM — measured to run in Pyodide, see
   [04_live-lane-pyodide.md](./04_live-lane-pyodide.md)), **joblib** (Monte-Carlo replications), with
   **NetLogo Web** as a zero-Python alternate ABM engine.
2. **Precompute plane (local `.venv`).** The heavy / native / SOTA engines run **offline** into a committed
   seeded trace + manifest, replayed in the app with a scrubber: **OR-Tools** (CP-SAT / Routing / GLOP),
   **PyVRP** (SOTA VRP), **NetworkX / OSMnx** (road graphs), **Mesa / Mesa-Geo** + **JuPedSim** (crowds),
   **Ciw / Salabim** (DES + offline video), **joblib + SciPy** (Monte-Carlo / CIs), and the optional
   **CuPy / Numba / Taichi / JAX** GPU lane. The local plane has no restriction and runs every engine. See
   [05_precompute-pipeline.md](./05_precompute-pipeline.md).

The **host** plane is the third, trivial leg: GitHub Pages serves the built SPA and the committed traces.
No backend, no VPS. See [07_deploy.md](./07_deploy.md).

## What decides which plane a scenario uses

The split is not a matter of taste — it is **measured**. A scenario runs live only if a 4-gate holds
(pure-Python, wheel closure loadable in the browser, run < 3 s, trace < ~1 MB); otherwise it is precomputed.
The verdict and the numbers behind it are recorded in each scenario's manifest, and CI fails the build if
anything tagged "live" breaches a gate — so "live mislabeling" cannot ship. The gate is the subject of
[03_the-gate.md](./03_the-gate.md).

Which dedicated tool each scenario uses is documented per problem type in
[../problem-types/](../problem-types/) and per tool in [../frameworks/](../frameworks/).

## One render path, two producers

Both planes produce the **same** artifact — a `Trace` (see
[02_determinism-and-trace.md](./02_determinism-and-trace.md)). The front end has exactly one set of
replay/animation code; it does not know or care whether a trace was computed live in Pyodide a moment ago or
committed to the repo months ago. "Live" is *slider responsiveness*, not a different model. This is the same
"deterministic core is truth, the presentation layer only renders it" discipline as deterministic-first
generative apps — here applied to simulation replay rather than LLM output.

## Read next

- [02_determinism-and-trace.md](./02_determinism-and-trace.md) — the reproducibility contract + trace schema.
- [03_the-gate.md](./03_the-gate.md) — the measured live/precompute gate.
- [04_live-lane-pyodide.md](./04_live-lane-pyodide.md) — the Pyodide worker + wheel closure.
- [05_precompute-pipeline.md](./05_precompute-pipeline.md) — local `.venv` → seeded trace + manifest.
- [06_live-tool-evaluation.md](./06_live-tool-evaluation.md) — what was actually tested in-browser.
- [07_deploy.md](./07_deploy.md) — Pages + CI.
