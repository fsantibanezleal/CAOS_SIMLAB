# 06 · Live-tool evaluation — what was actually tested in-browser

The live wheel closure (`LIVE_WHEELS`) is **measured, not assumed**. This page is the honest record of what
was exercised in a real browser to decide which engines may run in Pyodide, what is / isn't Pyodide-viable,
and what the fallback policy is. The numbers below are the basis for the gate constants in
[03_the-gate.md](./03_the-gate.md) and the worker's `loadPackage`/`micropip.install` list in
[04_live-lane-pyodide.md](./04_live-lane-pyodide.md).

## Per-engine verdict

| Engine | Lane | Pyodide-viable? | Evidence / why |
|---|---|---|---|
| **NumPy** | live | ✓ | Ships as a Pyodide package (`loadPackage`); the single RNG source for every run. |
| **SimPy** | live | ✓ | Pure-Python, installs via micropip; the DES queues run live. |
| **Ciw** | live | ✓ | Pure-Python (deps pandas/scipy/networkx already loaded); runs the S01 M/M/c validation live. |
| **Mesa 3** | live | ✓ (measured) | The non-obvious result. Mesa imports `sqlite3` (via `mesa.experimental`); once `sqlite3` is loaded with `loadPackage`, Mesa imports and runs. Cold start ~3 s for numpy+pandas+scipy+networkx+sqlite3+mesa; a 20-step 2500-agent run ~2.3 s — **verified in a real browser**, inside the 3 s gate. So ABM (S02/S03/S05) runs LIVE on real Mesa, not a stand-in. |
| **joblib** | live | ✓ | Pure-Python; the Monte-Carlo replications. (In Pyodide it runs the loky/threading backend in-Worker; the speedup is modest but the *result* is identical to the offline run, which is all replay = truth needs.) |
| **NetLogo Web** | live (alt) | ✓, no Pyodide | NetLogo compiled to JS (Tortoise) — a self-contained HTML file simulates entirely in the browser as native JS; smaller cold start than WASM, the instant on-ramp for ABM classics. |
| **OR-Tools** | precompute | ✗ | C++ with no WASM build; `pure_python=False`. CP-SAT (S06), Routing (S07/S08/S09), GLOP (S11) are precompute-only. |
| **PyVRP** | precompute | ✗ | Native (C++ extension via HGS); precompute-only even though it's pip-installable on CPython. |
| **OSMnx** | precompute | ✗ (and policy) | Heavy dep stack + network fetches at build time; only the **rendered geometry** (plain JSON) is committed, never raw graphs. |
| **Mesa-Geo / JuPedSim** | precompute | ✗ | Native/heavy geometry stacks; large state — precompute + replay. |
| **CuPy / Numba / Taichi / JAX** (GPU lane) | precompute | ✗ | CUDA / native JIT; CUDA-only, never enters the browser. CPU fallback for the same scenarios is joblib (S10). |

## What is / isn't Pyodide-viable — the principle

Two things must both be true for an engine to be a live candidate, and they map exactly onto the first two
gate conditions:

1. **It imports in WASM.** Pure-Python wheels (SimPy, Ciw, Mesa, joblib) qualify; native-code engines
   (OR-Tools, PyVRP, the GPU libs) do not — there is no WASM build, so they can't import at all.
2. **Its closure is small and fast enough to clear the time/byte gates.** Even an importable engine is forced
   to precompute if a run exceeds 3 s in-Worker or a trace exceeds ~1 MB. This is why the decision is
   per-variant and recomputed at build time rather than fixed by engine name.

The subtle, load-bearing discovery was Mesa: it is pure-Python and *looks* live-eligible, but it silently
needs `sqlite3`. Adding `sqlite3` to the closure (and verifying cold-start + run time in a real browser) is
what moved ABM from "assume precompute" to "measured live" — and it's why `sqlite3` sits in `LIVE_WHEELS`
next to the obvious entries.

## Fallback policy (honest)

- **The gate is the authority, not intent.** A scenario tagged `live` that any variant fails to clear is
  reclassified `precomputed` automatically; nothing is shipped live on faith.
- **Live scenarios still commit traces.** Every live scenario also has committed traces so the first paint
  replays instantly while Pyodide warms, and so every regime is comparable with zero compute. The live lane
  is an *enhancement* (slider responsiveness), never a single point of failure — if Pyodide fails to boot,
  the page still replays the committed trace.
- **ABM has a second live engine.** Where Mesa-in-Pyodide is borderline or the instant on-ramp matters more
  than build-it-yourself fidelity, the scenario ships a **NetLogo Web** live card (zero Python) paired with a
  Mesa precompute-and-replay twin. Which one a scenario ships is an empirical call recorded in its manifest.
- **GPU is never required.** The GPU lane (CuPy/Numba/Taichi/JAX) is local-only and optional; every GPU
  scenario has a CPU path (S10 uses joblib on CPU, which is what CI runs — no CUDA on the runner).

## Read next

- [03_the-gate.md](./03_the-gate.md) — the four-part rule these measurements feed.
- [04_live-lane-pyodide.md](./04_live-lane-pyodide.md) — the worker that loads exactly this closure.
- [../guides/02_live-lane-pyodide.md](../guides/02_live-lane-pyodide.md) — the runtime how-to (cold start, sources).
