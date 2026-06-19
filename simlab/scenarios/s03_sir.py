"""S03 — SIR epidemic (Agent-Based Model on a grid).

Each cell is Susceptible, Infected or Recovered. A susceptible cell becomes infected with probability
1−(1−β)^k where k is its number of infected Moore-neighbours; an infected cell recovers with probability
γ per step. The agent analogue of the Kermack–McKendrick compartmental model: the epidemic takes off only
above a transmissibility threshold, peaks, and burns out, leaving an attack-rate of recovered.
Pure-Python + NumPy, fully seeded → reproducible frame trace + epidemic curve.
"""
from __future__ import annotations

import numpy as np

from ..core.gridtrace import GridTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant

S, I, R = 0, 1, 2  # noqa: E741 — standard SIR compartment names


def _infected_neighbors(grid: np.ndarray) -> np.ndarray:
    eq = (grid == I).astype(np.int32)
    p = np.pad(eq, 1)
    total = np.zeros_like(eq)
    for di in (0, 1, 2):
        for dj in (0, 1, 2):
            if di == 1 and dj == 1:
                continue
            total += p[di:di + grid.shape[0], dj:dj + grid.shape[1]]
    return total


class SIRScenario(Scenario):
    id = "s03_sir"
    title = "SIR / SEIR Epidemic"
    method = "ABM"
    tier = 1
    viz = "agent-grid"
    engine = "numpy"
    pure_python = True
    wheels = ["numpy"]
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
            v("fizzle", "Below threshold (fizzles)", "Bajo umbral (se apaga)", 0.06, 0.25, 0.02, "Transmissibility too low: the outbreak dies out.", "Transmisibilidad muy baja: el brote se apaga."),
            v("threshold", "Near threshold", "Cerca del umbral", 0.10, 0.25, 0.02, "Right at the tipping point — small, slow spread.", "Justo en el punto de quiebre — propagación pequeña y lenta."),
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
        rng = make_rng(seed)

        grid = np.full((n, n), S, dtype=np.int32)
        infect0 = rng.random((n, n)) < init
        if not infect0.any():
            infect0[n // 2, n // 2] = True
        grid[infect0] = I

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
            tr.add_frame(step, grid.flatten().tolist())
            ni = int((grid == I).sum())
            nr = int((grid == R).sum())
            ns_ = total - ni - nr
            s_series.append(round(ns_ / total, 4))
            i_series.append(round(ni / total, 4))
            r_series.append(round(nr / total, 4))
            xs.append(step)
            if ni > peak_i:
                peak_i, peak_step = ni, step
            if ni == 0 or step == steps:
                break
            inf_n = _infected_neighbors(grid)
            p_inf = 1.0 - np.power(1.0 - beta, inf_n)
            draws = rng.random((n, n))
            new_inf = (grid == S) & (draws < p_inf)
            rec_draws = rng.random((n, n))
            new_rec = (grid == I) & (rec_draws < gamma)
            grid = grid.copy()
            grid[new_inf] = I
            grid[new_rec] = R

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
