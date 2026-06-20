# JuPedSim — microscopic pedestrian dynamics

**JuPedSim** (Jülich Pedestrian Simulator) is an open-source library for *microscopic
pedestrian dynamics*: a compiled C++ core with a clean Python API in which every pedestrian
is an individual agent with a position, radius and desired speed, moving through a 2D
walkable polygon while avoiding walls and each other. It implements validated operational
models (collision-free speed, social force, generalized centrifugal force, anticipation
velocity) and answers the questions aggregate models cannot: **how long does it take to
physically clear a space, where does congestion form at doors and corridors, and what is the
flow / density through a gate over time.** Reach for it only when *space and physical
movement change the answer*; for pure throughput / waiting a cheaper queueing or
discrete-event model is the honest choice.

In CAOS_SIMLAB JuPedSim is the engine for the **crowd / evacuation flow** family — the
spatial counterpart to the Hospital ED Patient-Flow DES scenario. It lives in the
**precompute** lane: because it ships native C++/VTK/PySide6 it cannot run in the browser, so
we run it headless locally, record per-step trajectories, commit a compact seeded artifact,
and the SPA *replays* it — the lab's standard simulate-then-replay, deterministic pattern.
It is LGPLv3 (weak copyleft) and CPU-only; we use it strictly as an offline tool that
produces data, never linked into the shipped web bundle.

- **Project:** <https://github.com/PedestrianDynamics/jupedsim> · **Docs:**
  <https://www.jupedsim.org/> · **License:** LGPLv3 · **Version here:** 1.4.2 (Python 3.13)

## Read in order

1. [01_installation.md](06_jupedsim/01_installation.md) — exact pip line + pin, the
   precompute requirements lane, transitive deps, platform / CUDA / license notes.
2. [02_usage.md](06_jupedsim/02_usage.md) — the five core concepts (geometry, model,
   stages, journey, agents), the run loop, determinism / seeding, and the runnable example
   walked through with its **real captured output**.
3. [03_applying.md](06_jupedsim/03_applying.md) — how to *formalize* an egress problem and
   *solve* it with the simulate-then-replay pattern, which scenarios use it, the research
   trade-offs, and when to pick it vs alternatives.
4. [example.py](06_jupedsim/example.py) — minimal verified script (8-agent room evacuation).
   Run from the repo root:
   `.venv/Scripts/python.exe docs/frameworks/06_jupedsim/example.py`

## Where it's used in the lab

- **Problem type:** [Agent-Based Modeling → Crowd / pedestrian flow](../problem-types/02_agent-based-modeling/04_tools.md#4-crowd--pedestrian-flow-jupedsim)
- **Scenario:** Emergency-Department egress / room evacuation — the spatial complement to
  **S04 Emergency Department Flow** (see the scenario → tool map in
  [../README.md](../README.md) and the
  [DES problem-type page](../problem-types/01_discrete-event-simulation.md) for the
  paired SimPy care-pathway model).
- **Pipeline:** [precompute pipeline](../guides/01_precompute-pipeline.md) (local `.venv` →
  seeded trace → replay) · why it is **not** in the
  [live lane](../guides/02_live-lane-pyodide.md) · GPU alternatives for city-scale in the
  [GPU-ABM reference chapter](18_gpu-abm-chapter.md).

## Related frameworks

- [Mesa](04_mesa.md) — the lab's canonical general ABM teaching framework (use it for
  emergence-from-simple-rules; JuPedSim for calibrated pedestrian physics).
- [SimPy](01_simpy.md) — the DES engine for the ED care pathway that *feeds* JuPedSim's
  occupancy parameters offline.
