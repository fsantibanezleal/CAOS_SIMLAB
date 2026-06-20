"""Minimal JuPedSim example for CAOS_SIMLAB (framework: jupedsim 1.4.2).

What it shows
-------------
A tiny rectangular room with one exit on the right wall. A handful of
pedestrians are placed on the left side and walk to the exit using the
*collision-free speed model*. We step the simulation, watch agents leave
through the exit (JuPedSim removes an agent the moment it reaches an exit
stage), and report how long it took everyone to evacuate.

Determinism
-----------
JuPedSim's collision-free speed model is itself deterministic: given the
same geometry, the same model parameters and the same initial agent
positions/speeds, every iteration is reproducible. The ONLY source of
randomness here is the initial scatter of the agents, so we seed Python's
``random`` (via ``random.Random(SEED)``) to make the whole run repeatable.
Re-running this file always prints the same numbers.

Run it (from the repo root, cwd = repo root):
    .venv/Scripts/python.exe docs/frameworks/jupedsim/example.py
"""

from __future__ import annotations

import random

import jupedsim as jps

# --- Reproducibility -------------------------------------------------------
SEED = 1234
rng = random.Random(SEED)

# --- 1. Geometry: a 10 m x 6 m room ---------------------------------------
# Walkable area is given as the outer boundary (counter-clockwise list of
# (x, y) corner points). The exit is a thin strip placed just inside the
# right wall.
ROOM = [(0.0, 0.0), (10.0, 0.0), (10.0, 6.0), (0.0, 6.0)]
EXIT = [(9.6, 2.4), (9.9, 2.4), (9.9, 3.6), (9.6, 3.6)]

# --- 2. Build the simulation ----------------------------------------------
# dt is the integration step in seconds (default 0.01 s). The model
# parameters use library defaults; only the geometry repulsion keeps agents
# off the walls and the neighbor repulsion keeps them from overlapping.
simulation = jps.Simulation(
    model=jps.CollisionFreeSpeedModel(),
    geometry=ROOM,
    dt=0.01,
)

# --- 3. Routing: one exit stage + a trivial one-stop journey --------------
exit_id = simulation.add_exit_stage(EXIT)
journey = jps.JourneyDescription([exit_id])
journey_id = simulation.add_journey(journey)

# --- 4. Place a few agents on the left side -------------------------------
# Agents have radius 0.2 m, so two centers must be > 0.4 m apart or JuPedSim
# rejects the placement. We lay them on a 1.0 m grid (comfortably > 0.4 m)
# and add a small seeded jitter (+-0.15 m) so the start is varied yet
# reproducible and never overlapping.
N_AGENTS = 8
GRID_X = [1.0, 2.0]            # two columns near the left wall
GRID_Y = [1.0, 2.0, 3.0, 4.0]  # four rows -> 8 grid cells
agent_ids: list[int] = []
for gx in GRID_X:
    for gy in GRID_Y:
        pos = (gx + rng.uniform(-0.15, 0.15), gy + rng.uniform(-0.15, 0.15))
        params = jps.CollisionFreeSpeedModelAgentParameters(
            position=pos,
            journey_id=journey_id,
            stage_id=exit_id,
            desired_speed=1.2,  # ~1.2 m/s, a typical walking speed
            radius=0.2,
        )
        agent_ids.append(simulation.add_agent(params))

start_count = simulation.agent_count()
print(f"JuPedSim {jps.__version__}")
print(f"seed={SEED}  dt={0.01}s  agents={start_count}  exit_stage_id={exit_id}")

# --- 5. Run until the room is empty (or a safety cap) ----------------------
# Each iterate() advances the simulation by one dt. We poll the agent count;
# JuPedSim removes agents as they cross the exit, so agent_count() -> 0 means
# full evacuation. We sample the count every 2 simulated seconds for a log.
MAX_ITERATIONS = 6000  # 60 s of simulated time @ dt=0.01 -> hard safety cap
SAMPLE_EVERY = 200      # every 2.0 simulated seconds

print("\n  t(s)   remaining")
print("  ----   ---------")
while simulation.agent_count() > 0 and simulation.iteration_count() < MAX_ITERATIONS:
    simulation.iterate()
    it = simulation.iteration_count()
    if it % SAMPLE_EVERY == 0:
        print(f"  {it * 0.01:4.1f}   {simulation.agent_count():>5d}")

# --- 6. Report ------------------------------------------------------------
final_it = simulation.iteration_count()
evacuation_time = final_it * 0.01
evacuated = start_count - simulation.agent_count()

print("\nResult")
print(f"  agents at start      : {start_count}")
print(f"  agents evacuated     : {evacuated}")
print(f"  agents remaining     : {simulation.agent_count()}")
print(f"  iterations executed  : {final_it}")
print(f"  evacuation time (s)  : {evacuation_time:.2f}")
all_out = simulation.agent_count() == 0
print(f"  fully evacuated      : {all_out}")
