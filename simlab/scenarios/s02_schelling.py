"""S02 — Schelling segregation (Agent-Based Model on a grid).

Two groups occupy a grid with some empty cells. An agent is *happy* if at least a fraction `tolerance`
of its occupied Moore-neighbours are its own type; unhappy agents relocate to a random empty cell. The
canonical ABM lesson: a mild local preference produces strong global segregation no agent intended
(Schelling 1971). Pure-Python + NumPy, fully seeded → reproducible frame trace.
"""
from __future__ import annotations

import numpy as np

from ..core.gridtrace import GridTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant

EMPTY, A, B = 0, 1, 2


def _neighbor_counts(grid: np.ndarray, value: int) -> np.ndarray:
    """Count Moore-neighbours equal to `value` for every cell (out-of-grid = empty)."""
    eq = (grid == value).astype(np.int32)
    p = np.pad(eq, 1)
    total = np.zeros_like(eq)
    for di in (0, 1, 2):
        for dj in (0, 1, 2):
            if di == 1 and dj == 1:
                continue
            total += p[di:di + grid.shape[0], dj:dj + grid.shape[1]]
    return total


class SchellingScenario(Scenario):
    id = "s02_schelling"
    title = "Schelling Segregation"
    method = "ABM"
    tier = 1
    viz = "agent-grid"
    engine = "numpy"
    pure_python = True
    wheels = ["numpy"]
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
            v("t70", "Tolerance 70%", "Tolerancia 70%", 0.70, 0.12, "So demanding that agents rarely settle.", "Tan exigente que los agentes casi no se asientan."),
            v("dense", "Dense (5% empty)", "Densa (5% vacío)", 0.50, 0.05, "Few vacancies: hard to relocate, slow to segregate.", "Pocas vacantes: difícil reubicarse, segrega lento."),
            v("roomy", "Roomy (25% empty)", "Holgada (25% vacío)", 0.50, 0.25, "Plenty of room: fast, clean segregation.", "Mucho espacio: segregación rápida y nítida."),
            v("spacious", "Spacious (35% empty)", "Amplia (35% vacío)", 0.50, 0.35, "Very sparse board at the classic tolerance.", "Tablero muy disperso a la tolerancia clásica."),
        ]

    def run(self, params: dict, seed: int) -> GridTrace:
        p = self.coerce(params)
        n = int(p["size"])
        empty_frac, tol, steps = float(p["empty"]), float(p["tolerance"]), int(p["steps"])
        rng = make_rng(seed)

        cells = rng.random(n * n)
        grid = np.full(n * n, EMPTY, dtype=np.int32)
        occ = cells >= empty_frac
        idx = np.where(occ)[0]
        rng.shuffle(idx)
        half = len(idx) // 2
        grid[idx[:half]] = A
        grid[idx[half:]] = B
        grid = grid.reshape(n, n)

        tr = GridTrace(self.id, self.title, self.method, int(seed), p, n, n, legend=[
            {"code": EMPTY, "label_en": "empty", "label_es": "vacío", "color": "var(--color-surface-2)"},
            {"code": A, "label_en": "group A", "label_es": "grupo A", "color": "var(--color-accent)"},
            {"code": B, "label_en": "group B", "label_es": "grupo B", "color": "var(--color-magenta)"},
        ])
        seg_series: list[float] = []
        happy_series: list[float] = []
        xs: list[float] = []

        def segregation_and_unhappy() -> tuple[float, np.ndarray]:
            cnt_a = _neighbor_counts(grid, A)
            cnt_b = _neighbor_counts(grid, B)
            occn = cnt_a + cnt_b
            same = np.where(grid == A, cnt_a, np.where(grid == B, cnt_b, 0))
            with np.errstate(invalid="ignore", divide="ignore"):
                frac = np.where(occn > 0, same / np.maximum(occn, 1), 1.0)
            agent_mask = grid != EMPTY
            iso = (occn == 0) & agent_mask
            seg = float(frac[agent_mask & (occn > 0)].mean()) if (agent_mask & (occn > 0)).any() else 0.0
            unhappy = agent_mask & (occn > 0) & (frac < tol)
            unhappy = unhappy & ~iso  # isolated agents are content (no same-type to compare)
            return seg, unhappy

        for step in range(steps + 1):
            tr.add_frame(step, grid.flatten().tolist())
            seg, unhappy = segregation_and_unhappy()
            n_agents = int((grid != EMPTY).sum())
            n_unhappy = int(unhappy.sum())
            seg_series.append(round(seg, 4))
            happy_series.append(round(1 - n_unhappy / max(n_agents, 1), 4))
            xs.append(step)
            if n_unhappy == 0 or step == steps:
                break
            # relocate unhappy agents to random empty cells
            empties = list(np.where(grid.flatten() == EMPTY)[0])
            rng.shuffle(empties)
            unhappy_pos = list(np.where(unhappy.flatten())[0])
            rng.shuffle(unhappy_pos)
            flat = grid.flatten()
            ei = 0
            for pos in unhappy_pos:
                if ei >= len(empties):
                    break
                dest = empties[ei]
                ei += 1
                flat[dest] = flat[pos]
                flat[pos] = EMPTY
                empties.append(pos)  # the vacated cell becomes available
            grid = flat.reshape(n, n)

        tr.series = {"x": xs, "segregation": seg_series, "happy": happy_series}
        tr.kpis = {
            "final_segregation": seg_series[-1],
            "final_happy_frac": happy_series[-1],
            "steps_run": xs[-1],
            "tolerance": round(tol, 3),
        }
        return tr
