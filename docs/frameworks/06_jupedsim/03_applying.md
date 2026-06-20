# 03 · JuPedSim — Applying it to a real problem

> Prerequisites: [01_installation.md](01_installation.md) · [02_usage.md](02_usage.md).
> Landing page: [../06_jupedsim.md](../06_jupedsim.md).

## What problem class JuPedSim is *for*

JuPedSim answers **spatial pedestrian questions** that aggregate models cannot:

- **How long does it take to clear a space?** Total evacuation time as a function of exit
  width / number, crowd size, and walking speed.
- **Where does congestion form?** Bottlenecks at doors, corridors, corners — *emergent*
  from individual collision-avoidance, not assumed.
- **What is the spatial density / flow** through a gate over time?

The key distinction in CAOS_SIMLAB: a **queueing** or **discrete-event** model treats a
door as "a server with a rate." JuPedSim treats the door as *geometry* and lets the
clearance time and the queue *emerge* from where people actually are and how they avoid each
other. Use JuPedSim only when **space and physical movement change the answer**; otherwise a
cheaper DES / queueing model is the honest choice.

## How to formalize the problem

Before reaching for the engine, state the egress problem in the four terms JuPedSim
consumes — this is the modelling contract:

1. **Walkable domain Ω** — the floor as a polygon with holes (walls, furniture, columns are
   holes / cut-outs). Source it from the floor plan; keep all spawn points a margin inside
   ∂Ω.
2. **Exits E = {e₁ … e_k}** — each an exit stage (a strip of ∂Ω). Width and count are the
   primary *design levers* you sweep.
3. **Population P** — N agents, each with a start position, desired speed v_d (from a
   walking-speed distribution) and radius r. Occupancy and the v_d distribution are the
   *demand* you vary; respect the `2r` minimum spacing at spawn.
4. **Routing R** — a journey per agent class mapping start → exit(s). The simplest is
   "everyone to the nearest single exit"; richer studies assign exits or add waypoints.

The **objective / readouts** are then well defined: total evacuation time
T = `iteration_count() * dt` at `agent_count() == 0`; the remaining-agents-over-time curve;
and exit flow / density (frames per gate). A study is a *sweep* of (exit width, N, v_d)
producing a surface of T and the density maps — that surface is the deliverable, not a
single run.

## How to solve it: the lab pattern (simulate-then-replay, precompute lane)

JuPedSim sits in the **precompute** lane. It is native, CPU-bound and heavier than the live
scenarios, so we never run it in the browser. The pattern:

1. **Build the geometry** for the space (ED waiting room + corridor + exits) and
   parametrise the crowd (number of patients / visitors, desired speeds, exit
   configuration).
2. **Run headless** locally, writing per-step trajectories with `SqliteTrajectoryWriter`
   (or a custom writer).
3. **Reduce** the trajectory to a compact Arrow/JSON artifact (frames of agent positions +
   the headline metrics: total evacuation time, density-over-time at the exit) and
   **commit** it.
4. **Replay** in the React/Vite SPA — animate the recorded frames over the floor plan. The
   viewer is labelled "precomputed due to cost; full pipeline + seed in the repo,"
   consistent with the lab's deterministic-replay policy
   ([../../architecture.md](../../architecture.md)).

This is the same local-compute → committed-artifact → static-viewer flow used by the DES and
ABM scenarios ([../../guides/01_precompute-pipeline.md](../../guides/01_precompute-pipeline.md)),
so JuPedSim drops into the existing pipeline without new infrastructure.

A natural composition is **DES → ABM (JuPedSim)**: a SimPy ED model decides *when and how
many* people are in the space (arrivals, triage, discharge), and JuPedSim answers the
spatial *egress* question for a given occupancy snapshot. The optimisation / DES tools size
the system; JuPedSim stress-tests the physical evacuation. (We do **not** run them in one
process; the DES output sets JuPedSim's crowd parameters offline.)

## Which CAOS_SIMLAB scenario(s) use it

Per the scenario → tool map ([../../README.md](../../README.md)) and the ABM problem-type
page ([../../problem-types/02_agent-based-modeling/04_tools.md](../../problem-types/02_agent-based-modeling/04_tools.md#4-crowd--pedestrian-flow-jupedsim)),
JuPedSim is the engine for the **ED crowd / evacuation flow** scenario:

- **Emergency-Department egress / room evacuation** — the spatial counterpart to the
  **Hospital ED Patient-Flow DES scenario (S04)**. The DES scenario (SimPy) models the
  *care pathway* (arrival → triage → treatment → disposition) as resource queues — see the
  DES problem-type page ([../../problem-types/01_discrete-event-simulation.md](../../problem-types/01_discrete-event-simulation.md)).
  JuPedSim models the *physical clearance* of the ED waiting area and corridors under an
  evacuation order: how exit width and crowd size drive total evacuation time and where
  people pile up. Together they make the point the lab teaches — **pick the dedicated tool
  for the question**: queueing / DES for throughput and waiting, a microscopic pedestrian
  ABM for spatial egress.

The interactive readouts the scenario exposes (and that the verified example already
demonstrates in miniature): **total evacuation time**, the **remaining-agents-over-time**
curve, and **exit flow / density**, all reacting to controls for exit width, agent count and
desired speed.

## Trade-offs (grounded in the research)

From the ABM-frameworks dimension and the architecture audits:

- **Why JuPedSim over Vadere.** Both are credible microscopic pedestrian engines from the
  same community. The research picks JuPedSim because it is **"a clean Python library that
  drops into our pipeline,"** installable from a pip wheel, whereas Vadere is **Java with a
  GUI** and adds toolchain friction. For a Python-first, scripted precompute pipeline,
  JuPedSim wins on integration cost. Vadere remains a valid reference.
- **Why JuPedSim and not Mesa for this scenario.** Mesa
  ([../04_mesa.md](../04_mesa.md)) is the lab's *canonical ABM teaching framework*, but it is grid /
  network / cell-space ABM, not a calibrated *continuous-space pedestrian-dynamics* engine.
  Crowd egress with collision-free movement and realistic densities is exactly what
  JuPedSim's operational models were built and validated for; reproducing that faithfully in
  Mesa would be reinventing a specialist tool. So: Mesa for emergence-from-simple-rules
  teaching, JuPedSim for the pedestrian-physics scenario.
- **CPU-only, no GPU.** JuPedSim does not use CUDA. Its sweet spot is
  hundreds-to-low-thousands of agents on CPU — comfortably enough for an ED floor.
  *Million-agent, city-scale* crowd egress is a different lane entirely (FLAME GPU 2 in the
  [GPU-ABM reference chapter](../18_gpu-abm-chapter.md)), not JuPedSim.
- **Native → not live.** Because it ships compiled C++ / VTK / PySide6, it cannot run in the
  Pyodide / WASM live lane (the browser only runs pure-Python wheels;
  [../../guides/02_live-lane-pyodide.md](../../guides/02_live-lane-pyodide.md)). This is *why* it
  is precompute-only and the viewer replays artifacts.
- **LGPLv3 copyleft.** Weak copyleft. We use it as an **offline tool producing data**, never
  linking it into the shipped web bundle, which keeps it isolated from the MIT/Apache code
  we serve. Recorded in the repo license inventory ([../../../LICENSES.md](../../../LICENSES.md))
  with the other copyleft precompute tools (e.g. FLAME GPU 2).
- **Calibration honesty.** JuPedSim's models are research-grade and parameter-sensitive
  (repulsion strengths / ranges, desired-speed distributions). For a *didactic* product we
  use sensible literature defaults and label the run as illustrative, **not** a certified
  building-evacuation study. Any real numbers (e.g. published walking-speed distributions)
  must be sourced; synthetic inputs must be labelled synthetic.

## When to pick it vs alternatives

| Question you have | Reach for | Not |
|---|---|---|
| How long to physically clear a room / ED; where do crowds jam at doors? | **JuPedSim** | a queueing model (no geometry) |
| Patient throughput / waiting time along a care pathway | **[SimPy DES](../01_simpy.md)** (ED Patient-Flow, S04) | JuPedSim (overkill, no pathway logic) |
| Emergence from simple agent rules for teaching (Schelling, SIR, flocking) | **[Mesa](../04_mesa.md)** | JuPedSim (specialist, not general ABM) |
| Pedestrian egress but Java/GUI tooling is acceptable and you want its analysis suite | Vadere | (JuPedSim still preferred for a Python pipeline) |
| Million-agent, city-scale crowd egress on a GPU | FLAME GPU 2 ([GPU-ABM chapter](../18_gpu-abm-chapter.md)) | JuPedSim (CPU-only) |

## Deprecated — do not use

For ABM generally in this lab, **AgentPy** and **desmod** are deprecated and must not be
adopted (AgentPy's own authors now point users to Mesa). They are mentioned only so nobody
reintroduces them. For the pedestrian scenario specifically the choice is **JuPedSim**
(primary) with Vadere as a reference-only alternative.
