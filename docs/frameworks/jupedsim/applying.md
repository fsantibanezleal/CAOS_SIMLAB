# JuPedSim — Applying it to a real problem

## What problem class JuPedSim is *for*

JuPedSim answers spatial pedestrian questions that aggregate models cannot:

- **How long does it take to clear a space?** Total evacuation time as a function of
  exit width/number, crowd size, and walking speed.
- **Where does congestion form?** Bottlenecks at doors, corridors, corners — emergent
  from individual collision-avoidance, not assumed.
- **What is the spatial density / flow** through a gate over time?

The key distinction in CAOS_SIMLAB: a **queueing** or **discrete-event** model treats a
door as "a server with a rate." JuPedSim treats the door as *geometry* and lets the
clearance time and the queue *emerge* from where people actually are and how they avoid
each other. Use JuPedSim only when **space and physical movement change the answer**;
otherwise a cheaper DES/queueing model is the honest choice.

## The lab pattern: simulate-then-replay (precompute lane)

JuPedSim sits in the **precompute** lane. It is native, CPU-bound and heavier than the
live scenarios, so we never run it in the browser. The pattern is:

1. **Build the geometry** for the space (ED waiting room + corridor + exits), parametrise
   the crowd (number of patients/visitors, desired speeds, exit configuration).
2. **Run headless** locally, writing per-step trajectories with
   `SqliteTrajectoryWriter` (or a custom writer).
3. **Reduce** the trajectory to a compact Arrow/JSON artifact (frames of agent
   positions + the headline metrics: total evacuation time, density-over-time at the
   exit) and **commit** it.
4. **Replay** in the React/Vite SPA — animate the recorded frames over the floor plan.
   The viewer is labelled "precomputed due to cost; full pipeline + seed in the repo,"
   consistent with the lab's deterministic-replay policy.

This is the same local-compute -> committed-artifact -> static-viewer flow used by the
DES and ABM scenarios, so JuPedSim drops into the existing pipeline without new
infrastructure.

A natural composition is **DES -> ABM (JuPedSim)**: a SimPy ED model decides *when and
how many* people are in the space (arrivals, triage, discharge), and JuPedSim answers
the spatial *egress* question for a given occupancy snapshot. The optimisation/DES tools
size the system; JuPedSim stress-tests the physical evacuation. (We do not run them in
one process; the DES output sets JuPedSim's crowd parameters offline.)

## Which CAOS_SIMLAB scenario(s) use it

Per the scenario -> tool map, JuPedSim is the engine for the **ED crowd / evacuation
flow** scenario:

- **Emergency-Department egress / room evacuation** — the spatial counterpart to the
  Hospital ED Patient-Flow DES scenario. The DES scenario (SimPy) models the *care
  pathway* (arrival -> triage -> treatment -> disposition) as resource queues. JuPedSim
  models the *physical clearance* of the ED waiting area and corridors under an
  evacuation order: how exit width and crowd size drive total evacuation time and where
  people pile up. Together they make the point the lab teaches — **pick the dedicated
  tool for the question**: queueing/DES for throughput and waiting, a microscopic
  pedestrian ABM for spatial egress.

The interactive readouts the scenario exposes (and that the verified example already
demonstrates in miniature): **total evacuation time**, **remaining-agents-over-time**
curve, and **exit flow/density**, all reacting to controls for exit width, agent count
and desired speed.

## Trade-offs (grounded in the research)

From the ABM-frameworks dimension and the architecture audits:

- **Why JuPedSim over Vadere.** Both are credible microscopic pedestrian engines from
  the same community. The research picks JuPedSim because it is **"a clean Python
  library that drops into our pipeline,"** installable from a pip wheel, whereas Vadere
  is **Java with a GUI** and adds toolchain friction. For a Python-first, scripted
  precompute pipeline, JuPedSim wins on integration cost. Vadere remains a valid
  reference.
- **Why JuPedSim and not Mesa for this scenario.** Mesa is the lab's *canonical ABM
  teaching framework*, but it is grid/network/cell-space ABM, not a calibrated
  *continuous-space pedestrian-dynamics* engine. Crowd egress with collision-free
  movement and realistic densities is exactly what JuPedSim's operational models were
  built and validated for; reproducing that faithfully in Mesa would be reinventing a
  specialist tool. So: Mesa for emergence-from-simple-rules teaching, JuPedSim for the
  pedestrian-physics scenario.
- **CPU-only, no GPU.** JuPedSim does not use CUDA. Its sweet spot is
  hundreds-to-low-thousands of agents on CPU — comfortably enough for an ED floor.
  *Million-agent, city-scale* crowd egress is a different lane entirely (FLAME GPU 2 in
  the GPU lane), not JuPedSim.
- **Native -> not live.** Because it ships compiled C++/VTK/PySide6, it cannot run in
  the Pyodide/WASM live lane (browser only runs pure-Python wheels). This is *why* it is
  precompute-only and the viewer replays artifacts.
- **LGPLv3 copyleft.** Weak copyleft. We use it as an **offline tool producing data**,
  never linking it into the shipped web bundle, which keeps it isolated from the
  MIT/Apache code we serve. Record it in the repo license inventory with the other
  copyleft precompute tools (e.g. FLAME GPU 2).
- **Calibration honesty.** JuPedSim's models are research-grade and parameter-sensitive
  (repulsion strengths/ranges, desired-speed distributions). For a *didactic* product we
  use sensible literature defaults and label the run as illustrative, not a certified
  building-evacuation study. Any real numbers (e.g. published walking-speed
  distributions) must be sourced; synthetic inputs must be labelled synthetic.

## When to pick it vs alternatives

| Question you have | Reach for | Not |
|---|---|---|
| How long to physically clear a room/ED; where do crowds jam at doors? | **JuPedSim** | a queueing model (no geometry) |
| Patient throughput / waiting time along a care pathway | **SimPy DES** (ED Patient-Flow) | JuPedSim (overkill, no pathway logic) |
| Emergence from simple agent rules for teaching (Schelling, SIR, flocking) | **Mesa** | JuPedSim (specialist, not general ABM) |
| Pedestrian egress but Java/GUI tooling is acceptable and you want its analysis suite | Vadere | (JuPedSim still preferred for a Python pipeline) |
| Million-agent, city-scale crowd egress on a GPU | FLAME GPU 2 (GPU lane) | JuPedSim (CPU-only) |

## Deprecated — do not use

For ABM generally in this lab, **AgentPy** and **desmod** are deprecated and must not be
adopted (AgentPy's own authors now point users to Mesa). They are mentioned only so
nobody reintroduces them. For the pedestrian scenario specifically the choice is
**JuPedSim** (primary) with Vadere as a reference-only alternative.
