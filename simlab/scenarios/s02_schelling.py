"""S02 — Schelling segregation (Agent-Based Model on a grid), running on **Mesa 3**.

Two groups occupy a grid with some empty cells. An agent is *happy* if at least a fraction `tolerance`
of its occupied Moore-neighbours are its own type; unhappy agents relocate to a random empty cell. The
canonical ABM lesson: a mild local preference produces strong global segregation no agent intended
(Schelling 1971).

This scenario is built on the real **Mesa 3** ABM framework — ``mesa.Model`` for the world, ``mesa.Agent``
for the households, ``mesa.space.SingleGrid`` for the lattice, and the model's ``AgentSet`` (``self.agents``)
for activation — rather than a hand-rolled NumPy sweep. It is the *template* the other ABM scenarios
(s03 SIR, s05 Beer Game) follow. All randomness flows through Mesa's seeded RNG (``Model(rng=seed)`` seeds
``self.random``), so a run is fully reproducible from (params, seed): the same input yields the same trace
byte-for-byte — the "replay = truth" contract the lab depends on.

The emitted artifact is the existing grid-trace format (frames of a flat row-major cell array + per-step
series + KPIs); nothing in the trace schema or the frontend contract changes.
"""
from __future__ import annotations

from ..core.gridtrace import GridTrace
from ..core.scenario import ParamSpec, Scenario, Variant

EMPTY, A, B = 0, 1, 2

# The Mesa Agent/Model subclasses are built lazily (Mesa is a heavy third-party dep absent under Pyodide).
# Importing this module — the Scenario subclass + variants()/param_specs — therefore needs ZERO heavy deps;
# Mesa is imported only when ``run()`` calls ``_models()`` to build the classes (cached after the first
# build, so behaviour is identical to top-level class definitions).
_MODELS: tuple[type, type] | None = None


def _models() -> tuple[type, type]:
    """Build (and cache) the Mesa-backed ``SchellingHousehold`` + ``SchellingModel`` classes.

    Mesa is imported here, inside the function that needs it, so ``import simlab.registry`` works without
    Mesa installed (the Pyodide live lane). The classes are identical to a top-level definition.
    """
    global _MODELS
    if _MODELS is not None:
        return _MODELS

    import mesa
    from mesa.space import SingleGrid

    class SchellingHousehold(mesa.Agent):
        """One household with a fixed group label (``A`` or ``B``).

        The agent owns the local rule but the *evaluation* is driven by the model each tick (so the lab can
        record happiness + segregation per step). ``self.pos`` is the ``(x, y)`` set by the grid on placement.
        """

        def __init__(self, model: "SchellingModel", group: int) -> None:
            super().__init__(model)
            self.group = group

        def same_and_occupied(self) -> tuple[int, int]:
            """Count Moore-neighbours that are same-type and the total occupied neighbours."""
            same = occupied = 0
            for nb in self.model.grid.iter_neighbors(self.pos, moore=True):
                occupied += 1
                if nb.group == self.group:
                    same += 1
            return same, occupied

    class SchellingModel(mesa.Model):
        """The Schelling world: a (non-torus) ``SingleGrid`` populated with two household types.

        Built with Mesa 3. Activation uses the model's ``AgentSet`` (``self.agents``). Relocation of unhappy
        agents is done *simultaneously* per step (all unhappy agents are computed first, then moved), which is
        the classic batch Schelling update; every move uses ``self.random`` so the run is deterministic.
        """

        def __init__(self, size: int, empty_frac: float, tolerance: float, seed: int) -> None:
            # Mesa 3: ``rng=`` seeds both self.random (Python random.Random) and self.rng (NumPy Generator).
            # Seeding here is what makes the whole run reproducible — the foundation of the committed trace.
            super().__init__(rng=int(seed))
            self.size = int(size)
            self.tolerance = float(tolerance)
            self.grid = SingleGrid(self.size, self.size, torus=False)

            # Populate. Mirror the original layout exactly so the model is the same world, just expressed in
            # Mesa: visit cells row-major, mark occupied where a draw clears the empty fraction, then split
            # the occupied cells 50/50 into A/B after a shuffle. All draws come from the seeded self.random.
            n_cells = self.size * self.size
            draws = [self.random.random() for _ in range(n_cells)]
            occupied_flat = [i for i in range(n_cells) if draws[i] >= empty_frac]
            self.random.shuffle(occupied_flat)
            half = len(occupied_flat) // 2
            for rank, flat in enumerate(occupied_flat):
                group = A if rank < half else B
                agent = SchellingHousehold(self, group)
                self.grid.place_agent(agent, (flat % self.size, flat // self.size))

            self.total_agents = len(self.agents)

        # --- metrics over the current configuration ---------------------------------------------
        def segregation_and_unhappy(self) -> tuple[float, list["SchellingHousehold"]]:
            """Mean same-type fraction over non-isolated agents + the list of unhappy agents.

            Isolated agents (no occupied neighbours) are content — there is no same-type ratio to fail.
            """
            fracs: list[float] = []
            unhappy: list[SchellingHousehold] = []
            for agent in self.agents:
                same, occupied = agent.same_and_occupied()
                if occupied == 0:
                    continue  # isolated → content, excluded from the segregation index
                frac = same / occupied
                fracs.append(frac)
                if frac < self.tolerance:
                    unhappy.append(agent)
            seg = sum(fracs) / len(fracs) if fracs else 0.0
            return seg, unhappy

        def relocate(self, unhappy: list["SchellingHousehold"]) -> None:
            """Move every unhappy agent to a random empty cell (simultaneous batch update).

            Sorted empties + seeded shuffle keep this deterministic regardless of set iteration order.
            """
            empties = sorted(self.grid.empties)  # set → stable order before shuffling
            self.random.shuffle(empties)
            order = list(unhappy)
            self.random.shuffle(order)
            ei = 0
            for agent in order:
                if ei >= len(empties):
                    break
                dest = empties[ei]
                ei += 1
                vacated = agent.pos
                self.grid.move_agent(agent, dest)
                empties.append(vacated)  # the freed cell becomes available within the same step

        def grid_snapshot(self) -> list[int]:
            """Flatten the grid to a row-major list of state codes (EMPTY / A / B) for the frame trace."""
            cells = [EMPTY] * (self.size * self.size)
            for agent in self.agents:
                x, y = agent.pos
                cells[y * self.size + x] = agent.group
            return cells

    _MODELS = (SchellingHousehold, SchellingModel)
    return _MODELS


class SchellingScenario(Scenario):
    id = "s02_schelling"
    title = "Schelling Segregation"
    method = "ABM"
    tier = 1
    viz = "agent-grid"
    engine = "mesa"
    pure_python = True
    wheels = ["numpy", "mesa"]
    param_specs = [
        ParamSpec("size", "Grid size", 30, 10, 60, 1, kind="int"),
        ParamSpec("empty", "Empty fraction", 0.1, 0.02, 0.4, 0.01),
        ParamSpec("tolerance", "Tolerance (min same-type)", 0.5, 0.1, 0.85, 0.05),
        ParamSpec("steps", "Max steps", 50, 10, 120, 5, kind="int"),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, tol, empty, ne, ns):
            return Variant(vid, le, ls, {"size": 30, "empty": empty, "tolerance": tol, "steps": 50}, ne, ns)

        return [
            v("t30", "Tolerance 30%", "Tolerancia 30%", 0.30, 0.10, "Very tolerant: barely any segregation.", "Muy tolerante: casi nada de segregación."),
            v("t375", "Tolerance 37.5%", "Tolerancia 37.5%", 0.375, 0.10, "Mild preference, mild clustering.", "Preferencia leve, agrupación leve."),
            v("t45", "Tolerance 45%", "Tolerancia 45%", 0.45, 0.10, "Approaching the tipping point.", "Acercándose al punto de quiebre."),
            v("t50", "Tolerance 50% (classic)", "Tolerancia 50% (clásico)", 0.50, 0.10, "The classic case: strong segregation from a 'fair' rule.", "El caso clásico: fuerte segregación desde una regla 'justa'."),
            v("t55", "Tolerance 55%", "Tolerancia 55%", 0.55, 0.10, "Sharper segregation; more churn.", "Segregación más marcada; más movimiento."),
            v("t625", "Tolerance 62.5%", "Tolerancia 62.5%", 0.625, 0.10, "High demand for similarity.", "Alta exigencia de similitud."),
            v("t70", "Tolerance 70%", "Tolerancia 70%", 0.70, 0.10, "So demanding that agents rarely settle.", "Tan exigente que los agentes casi no se asientan."),
            v("dense", "Dense (5% empty)", "Densa (5% vacío)", 0.50, 0.05, "Few vacancies: hard to relocate, slow to segregate.", "Pocas vacantes: difícil reubicarse, segrega lento."),
            v("roomy", "Roomy (25% empty)", "Holgada (25% vacío)", 0.50, 0.25, "Plenty of room: fast, clean segregation.", "Mucho espacio: segregación rápida y nítida."),
            v("spacious", "Spacious (35% empty)", "Amplia (35% vacío)", 0.50, 0.35, "Very sparse board at the classic tolerance.", "Tablero muy disperso a la tolerancia clásica."),
        ]

    def run(self, params: dict, seed: int) -> GridTrace:
        p = self.coerce(params)
        n = int(p["size"])
        empty_frac, tol, steps = float(p["empty"]), float(p["tolerance"]), int(p["steps"])

        _, SchellingModel = _models()  # lazy: build the Mesa-backed model classes only when running
        model = SchellingModel(size=n, empty_frac=empty_frac, tolerance=tol, seed=int(seed))

        tr = GridTrace(self.id, self.title, self.method, int(seed), p, n, n, legend=[
            {"code": EMPTY, "label_en": "empty", "label_es": "vacío", "color": "var(--color-surface-2)"},
            {"code": A, "label_en": "group A", "label_es": "grupo A", "color": "var(--color-accent)"},
            {"code": B, "label_en": "group B", "label_es": "grupo B", "color": "var(--color-magenta)"},
        ])
        seg_series: list[float] = []
        happy_series: list[float] = []
        xs: list[float] = []

        for step in range(steps + 1):
            tr.add_frame(step, model.grid_snapshot())
            seg, unhappy = model.segregation_and_unhappy()
            n_unhappy = len(unhappy)
            seg_series.append(round(seg, 4))
            happy_series.append(round(1 - n_unhappy / max(model.total_agents, 1), 4))
            xs.append(step)
            if n_unhappy == 0 or step == steps:
                break
            model.relocate(unhappy)

        tr.series = {"x": xs, "segregation": seg_series, "happy": happy_series}
        tr.kpis = {
            "final_segregation": seg_series[-1],
            "final_happy_frac": happy_series[-1],
            "steps_run": xs[-1],
            "tolerance": round(tol, 3),
        }
        return tr
