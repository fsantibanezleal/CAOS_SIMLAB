# JuPedSim — Usage

This is a hands-on how-to for the JuPedSim Python API as we use it in CAOS_SIMLAB:
build a geometry, give pedestrians a destination, step the simulation, and read out
who has evacuated. It walks through the minimal example in
[`example.py`](./example.py) and shows its **real captured output**.

## Mental model: five concepts

JuPedSim is a *microscopic* pedestrian model — every pedestrian is an individual agent
with a position, a radius and a desired speed, moving through a 2D walkable space and
avoiding walls and each other. Five concepts cover almost everything:

1. **Geometry** — the walkable area. A polygon (outer boundary, optional holes) given
   as a list of `(x, y)` points, a Well-Known-Text string, or a Shapely
   `Polygon`/`MultiPolygon`. Everything inside is floor; everything outside is wall.

2. **Operational model** — the physics of movement. We use
   `CollisionFreeSpeedModel`, a speed-based model (agents slow down as neighbours/walls
   get close, never overlapping) from Tordeux et al. (arXiv:1512.05597). Alternatives
   in the same library: `SocialForceModel`, `GeneralizedCentrifugalForceModel`,
   `AnticipationVelocityModel`. The model object carries global parameters
   (neighbour/geometry repulsion strength and range).

3. **Stages** — points of interest in the route: an **exit** (`add_exit_stage`, agents
   are *removed* when they reach it), a **waypoint** (`add_waypoint_stage`, a place to
   pass through), a queue, a waiting set, etc. Each stage call returns an integer id.

4. **Journey** — the route graph: which stages an agent visits and how it transitions
   between them. `JourneyDescription([stage_id, ...])` plus `add_journey(...)` returns
   a `journey_id`. A trivial "walk straight to the one exit" journey is just
   `JourneyDescription([exit_id])`.

5. **Agents** — pedestrians. Each is created from a model-specific parameters object
   (`CollisionFreeSpeedModelAgentParameters`) carrying its `position`, `desired_speed`,
   `radius`, `journey_id` and target `stage_id`. `add_agent(params)` returns an
   agent id.

### The run loop

```python
sim = jps.Simulation(model=..., geometry=..., dt=0.01)
exit_id = sim.add_exit_stage(exit_polygon)
journey_id = sim.add_journey(jps.JourneyDescription([exit_id]))
sim.add_agent(jps.CollisionFreeSpeedModelAgentParameters(
    position=(x, y), journey_id=journey_id, stage_id=exit_id))
while sim.agent_count() > 0:
    sim.iterate()           # advance one dt
print(sim.iteration_count())  # how many steps it took to empty the room
```

- `dt` is the integration step in seconds (default `0.01`; leave it at the default).
- `iterate()` advances exactly one `dt`. `iteration_count()` returns the number of
  steps so far, so `iteration_count() * dt` is the simulated time in seconds.
- `agent_count()` is the number of agents *still in the simulation*. JuPedSim removes
  an agent the moment it reaches an exit stage, so `agent_count() == 0` means the room
  is empty — the natural "evacuation complete" condition.

### Determinism / seeding

The collision-free-speed model is **deterministic**: identical geometry + parameters +
initial positions produce identical trajectories every run. The model itself has no
random seed to set. The only randomness in a typical script is **where you place the
agents at the start**, so we seed Python's `random` (e.g. `random.Random(1234)`) for
the initial scatter. That makes the whole experiment reproducible — essential for the
lab's deterministic-replay policy.

## Minimal example, walked through

[`example.py`](./example.py) builds a 10 m x 6 m room with a narrow exit on the right
wall, places 8 pedestrians on a 1 m grid on the left (with seeded jitter so they never
overlap — recall radius 0.2 m means centres must be > 0.4 m apart), routes them to the
exit, and steps until the room is empty.

Key steps in the file:

1. **Seed** — `rng = random.Random(1234)` so the jittered start positions are fixed.
2. **Geometry** — `ROOM` is the outer rectangle; `EXIT` is a thin strip just inside the
   right wall, added with `add_exit_stage`.
3. **Simulation** — `jps.Simulation(model=jps.CollisionFreeSpeedModel(), geometry=ROOM,
   dt=0.01)`.
4. **Journey** — one-stop journey to the exit.
5. **Agents** — placed on a grid (`x in {1,2}`, `y in {1,2,3,4}`) plus +-0.15 m jitter,
   each with `desired_speed=1.2` m/s and `radius=0.2` m.
6. **Loop** — `iterate()` until `agent_count() == 0` (with a 6000-iteration / 60 s
   safety cap), sampling the remaining count every 2 simulated seconds.
7. **Report** — start count, evacuated, remaining, iterations, evacuation time.

### Run it

From the repository root (cwd = repo root):

```bash
.venv/Scripts/python.exe docs/frameworks/jupedsim/example.py
```

### Verified output

The following is the **actual stdout** captured by running the script in this
environment (`jupedsim` 1.4.2, Python 3.13). The run is deterministic — repeated runs
print exactly the same numbers (evacuation time 8.42 s):

```text
JuPedSim 1.4.2
seed=1234  dt=0.01s  agents=8  exit_stage_id=1

  t(s)   remaining
  ----   ---------
   2.0       8
   4.0       8
   6.0       8
   8.0       3

Result
  agents at start      : 8
  agents evacuated     : 8
  agents remaining     : 0
  iterations executed  : 842
  evacuation time (s)  : 8.42
  fully evacuated      : True
```

### How to read it

- All **8** agents start on the left; the exit is ~7-9 m away. At a desired speed of
  1.2 m/s the leaders need several seconds just to traverse the room, so the count
  stays at 8 through t = 6 s — nobody has reached the exit yet.
- Between t = 6 s and t = 8 s the agents reach the narrow exit and stream out; by the
  8 s sample only **3** remain.
- The loop ends at iteration **842**, i.e. **8.42 s** of simulated time, with
  `agent_count() == 0` -> **full evacuation**. That total evacuation time is the headline
  metric an ED-egress study reports, and it changes when you vary exit width, agent
  count, or desired speed — which is exactly the interactivity the scenario exposes.

## Persisting trajectories for replay

The example reads aggregate counts. For the lab's *replay* viewer you also record each
agent's per-step position. JuPedSim ships `jupedsim.SqliteTrajectoryWriter` (and an
HDF5 writer); pass one as `trajectory_writer=` to `Simulation(...)` and it logs frames
automatically. In the pipeline we then export the compact trajectory to Arrow/JSON and
commit that artifact — the browser never runs JuPedSim, it just animates the recorded
frames.

## Common pitfalls

- **Agents too close at spawn.** Placement closer than `2 * radius` raises
  `RuntimeError: Model constraint violation: Agent ... too close to agent ...`. Lay
  agents on a grid with spacing comfortably above `2 * radius` (0.4 m for the default
  0.2 m radius); this is why the example uses a 1 m grid with small jitter rather than
  free random scatter.
- **Agents on/over a wall.** Spawning outside the walkable polygon or right on the
  boundary also raises a constraint violation — keep spawn points a margin inside.
- **Forgetting the journey/stage ids.** `journey_id` and `stage_id` on the agent params
  must reference ids returned by `add_journey` / `add_exit_stage`, or the agent has no
  destination.
- **Expecting an RNG seed on the model.** There isn't one; control reproducibility via
  your own placement RNG (the model is already deterministic).
