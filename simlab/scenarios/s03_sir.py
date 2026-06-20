"""S03 — SIR epidemic (Agent-Based Model on a grid), running on **Mesa 3**.

Each cell holds one agent in health state Susceptible, Infected or Recovered. A susceptible agent becomes
infected with probability 1−(1−β)^k where k is its number of infected Moore-neighbours; an infected agent
recovers with probability γ per step. The agent analogue of the Kermack–McKendrick compartmental model:
the epidemic takes off only above a transmissibility threshold, peaks, and burns out, leaving an attack-rate
of recovered.

This scenario is built on the real **Mesa 3** ABM framework — ``mesa.Model`` for the world, ``mesa.Agent``
for the cells, ``mesa.space.SingleGrid`` for the fully-occupied lattice, and the model's ``AgentSet``
(``self.agents``) for activation — rather than a hand-rolled NumPy sweep. It reuses the s02 Schelling
STRUCTURAL template (Mesa Agent/Model/SingleGrid/AgentSet, lazy ``_models()``, GridTrace emission); the
per-step update differs by design — S03 is a TRUE SYNCHRONOUS sweep (all S→I and I→R decided against the
start-of-step board, applied together), whereas S02 relocates unhappy agents one-by-one into a growing empty
pool. All randomness flows through Mesa's seeded RNG (``Model(rng=seed)`` seeds ``self.random``),
so a run is fully reproducible from (params, seed): the same input yields the same trace byte-for-byte — the
"replay = truth" contract the lab depends on.

The update is a *simultaneous* batch (the classic cellular SIR sweep): all infections and recoveries for a
step are decided against the configuration at the start of the step, then applied together. The emitted
artifact is the existing grid-trace format (frames of a flat row-major cell array + S/I/R series + KPIs);
nothing in the trace schema or the frontend contract changes.
"""
from __future__ import annotations

from ..core.gridtrace import GridTrace
from ..core.scenario import ParamSpec, Scenario, Variant

S, I, R = 0, 1, 2  # noqa: E741 — standard SIR compartment names

# The Mesa Agent/Model subclasses are built lazily (Mesa is a heavy dep the worker loads at runtime via
# micropip — it IS in LIVE_WHEELS and runs live — not at module import).
# Importing this module — the Scenario subclass + variants()/param_specs — therefore needs ZERO heavy deps;
# Mesa is imported only when ``run()`` calls ``_models()`` to build the classes (cached after the first
# build, so behaviour is identical to top-level class definitions).
_MODELS: tuple[type, type] | None = None


def _models() -> tuple[type, type]:
    """Build (and cache) the Mesa-backed ``SIRAgent`` + ``SIRModel`` classes.

    Mesa is imported here, inside the function that needs it, so ``import simlab.registry`` works without
    Mesa installed (the Pyodide live lane). The classes are identical to a top-level definition.
    """
    global _MODELS
    if _MODELS is not None:
        return _MODELS

    import mesa
    from mesa.space import SingleGrid

    class SIRAgent(mesa.Agent):
        """One cell carrying a health state (``S`` / ``I`` / ``R``).

        The agent owns its state but the *transition* is driven by the model each tick (simultaneous batch
        update), so the lab can record the S/I/R populations per step. ``self.pos`` is the ``(x, y)`` set by
        the grid on placement.
        """

        def __init__(self, model: "SIRModel", state: int) -> None:
            super().__init__(model)
            self.state = state

        def infected_neighbors(self) -> int:
            """Count Moore-neighbours currently in the Infected state."""
            return sum(1 for nb in self.model.grid.iter_neighbors(self.pos, moore=True) if nb.state == I)

    class SIRModel(mesa.Model):
        """The SIR world: a (non-torus) ``SingleGrid`` with one agent per cell.

        Built with Mesa 3. Activation uses the model's ``AgentSet`` (``self.agents``). The per-step update is
        computed against the start-of-step configuration and applied simultaneously (the classic synchronous
        SIR sweep); every draw uses ``self.random`` so the run is deterministic.
        """

        def __init__(self, size: int, beta: float, gamma: float, init_infected: float, seed: int) -> None:
            # Mesa 3: ``rng=`` seeds both self.random (Python random.Random) and self.rng (NumPy Generator).
            # Seeding here is what makes the whole run reproducible — the foundation of the committed trace.
            super().__init__(rng=int(seed))
            self.size = int(size)
            self.beta = float(beta)
            self.gamma = float(gamma)
            self.grid = SingleGrid(self.size, self.size, torus=False)

            # Populate: one agent per cell, visited row-major (flat index = y*size + x). Each cell starts
            # Infected if a seeded draw clears the init fraction, else Susceptible. All draws come from the
            # seeded self.random, so the initial board is reproducible.
            n_cells = self.size * self.size
            states = [I if self.random.random() < init_infected else S for _ in range(n_cells)]
            if I not in states:  # guarantee at least one seed case (a stochastic all-S start would be inert)
                states[n_cells // 2] = I
            for flat in range(n_cells):
                agent = SIRAgent(self, states[flat])
                self.grid.place_agent(agent, (flat % self.size, flat // self.size))

            self.total_agents = len(self.agents)

        # --- one simultaneous SIR sweep ---------------------------------------------------------
        def step(self) -> None:
            """Decide all transitions against the current board, then apply them together.

            Iterating ``self.agents`` in its stable order and drawing infection then recovery per agent keeps
            the sweep deterministic; reads use the unmodified ``state`` so the update is synchronous.
            """
            new_infected: list[SIRAgent] = []
            new_recovered: list[SIRAgent] = []
            for agent in self.agents:
                if agent.state == S:
                    k = agent.infected_neighbors()
                    if k:
                        p_inf = 1.0 - (1.0 - self.beta) ** k
                        if self.random.random() < p_inf:
                            new_infected.append(agent)
                elif agent.state == I:
                    if self.random.random() < self.gamma:
                        new_recovered.append(agent)
            for agent in new_infected:
                agent.state = I
            for agent in new_recovered:
                agent.state = R

        # --- metrics over the current configuration ---------------------------------------------
        def counts(self) -> tuple[int, int, int]:
            """Return the (S, I, R) population counts over all agents."""
            ni = nr = 0
            for agent in self.agents:
                if agent.state == I:
                    ni += 1
                elif agent.state == R:
                    nr += 1
            return self.total_agents - ni - nr, ni, nr

        def grid_snapshot(self) -> list[int]:
            """Flatten the grid to a row-major list of state codes (S / I / R) for the frame trace."""
            cells = [S] * (self.size * self.size)
            for agent in self.agents:
                x, y = agent.pos
                cells[y * self.size + x] = agent.state
            return cells

    _MODELS = (SIRAgent, SIRModel)
    return _MODELS


class SIRScenario(Scenario):
    id = "s03_sir"
    title = "SIR Epidemic"
    method = "ABM"
    tier = 1
    viz = "agent-grid"
    engine = "mesa"
    pure_python = True
    wheels = ["numpy", "mesa"]
    param_specs = [
        ParamSpec("size", "Grid size", 38, 10, 60, 1, kind="int"),
        ParamSpec("beta", "Infection prob β (per infected neighbor)", 0.20, 0.02, 0.6, 0.01),
        ParamSpec("gamma", "Recovery prob γ (per step)", 0.20, 0.02, 0.6, 0.01),
        ParamSpec("init_infected", "Initial infected fraction", 0.02, 0.002, 0.2, 0.002),
        ParamSpec("steps", "Max steps", 80, 20, 160, 5, kind="int"),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, beta, gamma, init, ne, ns):
            return Variant(vid, le, ls, {"size": 38, "beta": beta, "gamma": gamma, "init_infected": init, "steps": 80}, ne, ns)

        return [
            v("fizzle", "Below threshold (fizzles)", "Bajo umbral (se apaga)", 0.022, 0.25, 0.02, "Transmissibility too low: the outbreak dies out.", "Transmisibilidad muy baja: el brote se apaga."),
            v("threshold", "Near threshold", "Cerca del umbral", 0.04, 0.25, 0.02, "Right at the tipping point — small, slow spread.", "Justo en el punto de quiebre — propagación pequeña y lenta."),
            v("mild", "Mild wave", "Ola leve", 0.14, 0.20, 0.02, "A modest epidemic with a low peak.", "Una epidemia modesta con pico bajo."),
            v("moderate", "Moderate wave", "Ola moderada", 0.20, 0.20, 0.02, "The classic SIR wave: rise, peak, burnout.", "La ola SIR clásica: sube, pico, extinción."),
            v("severe", "Severe wave", "Ola severa", 0.30, 0.20, 0.02, "High transmissibility: tall, fast peak.", "Alta transmisibilidad: pico alto y rápido."),
            v("explosive", "Explosive", "Explosiva", 0.42, 0.15, 0.02, "Very fast spread, very high peak.", "Propagación muy rápida, pico muy alto."),
            v("fastrec", "Fast recovery", "Recuperación rápida", 0.26, 0.40, 0.02, "High γ damps the peak even at high β.", "Una γ alta amortigua el pico aun con β alta."),
            v("slowrec", "Slow recovery", "Recuperación lenta", 0.16, 0.08, 0.02, "Low γ stretches a long, smouldering epidemic.", "Una γ baja alarga una epidemia prolongada."),
            v("seed1", "Single seed", "Semilla única", 0.24, 0.20, 0.004, "Starts from ~one case and spreads as a front.", "Parte de ~un caso y se propaga como frente."),
            v("denseseed", "Dense seeding", "Siembra densa", 0.18, 0.20, 0.10, "Many initial cases ignite the whole board fast.", "Muchos casos iniciales encienden el tablero rápido."),
        ]

    def run(self, params: dict, seed: int) -> GridTrace:
        p = self.coerce(params)
        n = int(p["size"])
        beta, gamma = float(p["beta"]), float(p["gamma"])
        init, steps = float(p["init_infected"]), int(p["steps"])

        _, SIRModel = _models()  # lazy: build the Mesa-backed model classes only when running
        model = SIRModel(size=n, beta=beta, gamma=gamma, init_infected=init, seed=int(seed))

        tr = GridTrace(self.id, self.title, self.method, int(seed), p, n, n, legend=[
            {"code": S, "label_en": "susceptible", "label_es": "susceptible", "color": "var(--color-accent)"},
            {"code": I, "label_en": "infected", "label_es": "infectado", "color": "var(--color-bad)"},
            {"code": R, "label_en": "recovered", "label_es": "recuperado", "color": "var(--color-good)"},
        ])
        total = n * n
        s_series: list[float] = []
        i_series: list[float] = []
        r_series: list[float] = []
        xs: list[float] = []
        peak_i, peak_step = 0, 0

        for step in range(steps + 1):
            tr.add_frame(step, model.grid_snapshot())
            ns_, ni, nr = model.counts()
            s_series.append(round(ns_ / total, 4))
            i_series.append(round(ni / total, 4))
            r_series.append(round(nr / total, 4))
            xs.append(step)
            if ni > peak_i:
                peak_i, peak_step = ni, step
            if ni == 0 or step == steps:
                break
            model.step()

        tr.series = {"x": xs, "S": s_series, "I": i_series, "R": r_series}
        tr.kpis = {
            "peak_infected_frac": round(peak_i / total, 4),
            "peak_step": peak_step,
            "attack_rate": r_series[-1],
            "duration_steps": xs[-1],
            "beta": round(beta, 3),
            "gamma": round(gamma, 3),
        }
        return tr
