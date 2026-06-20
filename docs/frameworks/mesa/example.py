"""Minimal Schelling segregation model on a grid, built with Mesa 3.

This is a *didactic* example for the CAOS_SIMLAB framework docs. It shows the
canonical Mesa 3 shape:

  * subclass ``mesa.Agent`` -> the per-agent state and ``step()`` rule;
  * subclass ``mesa.Model`` -> the world (a ``SingleGrid`` space) + the
    ``step()`` that activates agents;
  * activate agents through the model's ``AgentSet`` with ``shuffle_do("step")``
    (the Mesa 3 replacement for the old explicit scheduler objects).

It is fully headless (no SolaraViz / no server) and seeded, so the printed
trajectory is identical on every run -- exactly what the lab needs from a
precompute engine: a reproducible trace.

Run it from the repo root with the project venv:

    .venv/Scripts/python.exe docs/frameworks/mesa/example.py
"""

from __future__ import annotations

import mesa
from mesa.space import SingleGrid

# --- Parameters (small, so the run is fast and the output is easy to read) ----
WIDTH = 20
HEIGHT = 20
DENSITY = 0.80          # fraction of cells that hold an agent
MINORITY_FRACTION = 0.30  # fraction of agents that are type 1 (vs type 0)
HOMOPHILY = 3           # an agent is happy if >= this many of its 8 neighbors share its type
STEPS = 20
SEED = 42               # makes the whole run deterministic


class SchellingAgent(mesa.Agent):
    """A household with a fixed group label and a tolerance threshold.

    Local rule: count same-type neighbors in the Moore (8-cell) neighborhood;
    if there are fewer than ``HOMOPHILY`` of them, the household is unhappy and
    relocates to a random empty cell. This is the entire behavior -- segregation
    is never programmed, it *emerges* from many agents following this one rule.
    """

    def __init__(self, model: "SchellingModel", agent_type: int) -> None:
        super().__init__(model)
        self.type = agent_type

    def step(self) -> None:
        # self.pos is set by the grid when the agent is placed.
        neighbors = self.model.grid.iter_neighbors(self.pos, moore=True)
        same = sum(1 for n in neighbors if n.type == self.type)

        if same < self.model.homophily:
            # Unhappy -> move to a random empty cell (uses the model's seeded RNG).
            self.model.grid.move_to_empty(self)
        else:
            self.model.happy += 1


class SchellingModel(mesa.Model):
    """The Schelling world: a grid populated with two agent types."""

    def __init__(
        self,
        width: int = WIDTH,
        height: int = HEIGHT,
        density: float = DENSITY,
        minority_fraction: float = MINORITY_FRACTION,
        homophily: int = HOMOPHILY,
        seed: int | None = SEED,
    ) -> None:
        # In Mesa 3.5 the reproducible RNG is passed via ``rng=``; this seeds
        # both model.random (Python's random.Random) and model.rng (NumPy).
        super().__init__(rng=seed)

        self.homophily = homophily
        self.happy = 0
        # torus=True wraps the edges so corner/edge agents are not special-cased.
        self.grid = SingleGrid(width, height, torus=True)

        # Populate: visit every cell, decide whether it holds an agent, and if so
        # which type. All randomness flows through self.random (seeded).
        for _, pos in self.grid.coord_iter():
            if self.random.random() < density:
                agent_type = 1 if self.random.random() < minority_fraction else 0
                agent = SchellingAgent(self, agent_type)
                self.grid.place_agent(agent, pos)

        self.total_agents = len(self.agents)

    def step(self) -> None:
        """One tick: reset the happy counter, then activate every agent once
        in a freshly shuffled order (random activation)."""
        self.happy = 0
        self.agents.shuffle_do("step")

    def happy_fraction(self) -> float:
        return self.happy / self.total_agents if self.total_agents else 0.0


def main() -> None:
    model = SchellingModel(seed=SEED)
    print(
        f"Schelling on a {WIDTH}x{HEIGHT} grid | agents={model.total_agents} "
        f"| homophily>={HOMOPHILY} | seed={SEED}"
    )
    print("step  happy_fraction")

    # Step 0 is the initial configuration: run one activation to measure how many
    # agents are already happy before any further dynamics settle in.
    for step in range(STEPS):
        model.step()
        print(f"{step + 1:>4}  {model.happy_fraction():.4f}")

    print(
        f"\nFinal: {model.happy}/{model.total_agents} agents happy "
        f"({model.happy_fraction():.1%}) after {STEPS} steps."
    )


if __name__ == "__main__":
    main()
