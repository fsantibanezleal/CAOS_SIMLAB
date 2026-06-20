# 03 · Salabim — the offline movie-maker (DES)

**Salabim** is a pure-Python discrete-event simulation (DES) library whose distinguishing
feature is **built-in 2D/3D animation with offline video export** (`.mp4` / `.gif`). It is
MIT-licensed, has zero mandatory dependencies, and models systems the same
process-interaction way SimPy does — you write each entity's life-story as a procedure that
alternates *doing* (`hold`, `request`) and *waiting* (`yield`), and the engine runs many of
them on one seeded simulated clock. Where Salabim pulls ahead of SimPy is the
batteries-included layer: automatic **monitors** give you queueing KPIs (`occupancy.mean()`,
`length.mean()`, …) for free, and the animation engine can turn a run into a movie.

**When to use it in this lab:** Salabim lives **only in the offline / precompute lane**. Its
animation is rendered with tkinter (a desktop GUI), so it **cannot be embedded in the
browser** — the live, parameter-editable scenarios are SimPy-in-Pyodide with a React viewer.
Salabim's job is the **offline movie-maker**: render a polished `.mp4`/`.gif` replay of a
*heavy* scenario locally (headless via `blind_animation=True`), commit the compact artifact,
and let the SPA replay it under the "precomputed due to cost" banner. It is also the lab's
**teaching counterpoint** to SimPy — fast zero-to-animation and free statistics make it a
clean way to *see* a DES model move. Reach for it when the deliverable is a committed video
of an offline run; never for anything that has to run live in a browser (use SimPy), and not
for closed-form queueing validation (use [Ciw](./02_ciw.md)).

## Read this node in order

1. [`./03_salabim/01_installation.md`](./03_salabim/01_installation.md) — exact pip line,
   installed version (`26.0.6`), the precompute requirements lane, optional deps, the
   **greenlet / `yieldless=False`** caveat, headless rendering, and "no GPU".
2. [`./03_salabim/02_usage.md`](./03_salabim/02_usage.md) — the real API and concepts, the
   M/M/1 example walked through step by step with its **captured output**, and the
   `.mp4`/`.gif` export path (conceptual, headless).
3. [`./03_salabim/03_applying.md`](./03_salabim/03_applying.md) — how to formalize the
   problem, which lab scenarios use it, the model-in-SimPy / render-in-Salabim pattern, the
   honest trade-offs, and Salabim-vs-SimPy-vs-Ciw.

Runnable example: [`./03_salabim/example.py`](./03_salabim/example.py) — a seeded, headless
M/M/1 queue that validates itself against closed-form theory. Run from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/03_salabim/example.py
```

## Related

- **Problem type:** [Discrete-event simulation](../problem-types/01_discrete-event-simulation.md)
  — the queueing KPIs, the sim-converges-to-theory gate, and the scenario→tool map (S01, S04,
  S07, S09, S10).
- **Companion frameworks:** [SimPy](./01_simpy.md) (the engine of record + the live lane),
  [Ciw](./02_ciw.md) (the closed-form queueing-theory lesson).
- **Honesty curriculum:** [Monte-Carlo replications](../problem-types/04_monte-carlo-replications.md)
  — why one converged run is a sanity check, not a claim.
- **Scenarios that may carry a Salabim offline clip:** **S07** (construction haul routing)
  and **S09** (ambulance dispatch) DES legs — models of record in SimPy, optional rendered
  replay in Salabim.
