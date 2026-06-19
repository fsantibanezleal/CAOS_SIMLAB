"""S10 — Monte-Carlo replication / confidence-interval study.

Runs N independent replications of the M/M/c queue (the S01 model) and shows the output-analysis lesson
made interactive: a single run is noisy, but the running mean of many seeded replications converges to the
closed-form Erlang-C value, and the 95% confidence interval narrows like 1/√n. Precompute lane (N runs),
but pure-Python and fully seeded.
"""
from __future__ import annotations

import heapq
import math

import numpy as np

from ..core.charttrace import ChartTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant
from .s01_queue import erlang_c_mmc


def mmc_mean_wait(lam: float, mu: float, c: int, n: int, rng: np.random.Generator) -> float:
    """Mean time-in-queue of an M/M/c FCFS queue via the earliest-free-server method (O(n log c))."""
    inter = rng.exponential(1.0 / lam, size=n)
    service = rng.exponential(1.0 / mu, size=n)
    arrival = np.cumsum(inter)
    free = [0.0] * c
    heapq.heapify(free)
    total_wait = 0.0
    for i in range(n):
        f = heapq.heappop(free)
        start = arrival[i] if arrival[i] > f else f
        total_wait += start - arrival[i]
        heapq.heappush(free, start + service[i])
    return total_wait / n


class MonteCarloScenario(Scenario):
    id = "s10_montecarlo"
    title = "Monte-Carlo Replication / CI Study"
    method = "hybrid"
    tier = 3
    viz = "chart"
    engine = "numpy"
    pure_python = True
    wheels = ["numpy"]
    param_specs = [
        ParamSpec("lam", "Arrival rate λ", 2.0, 0.1, 10.0, 0.1),
        ParamSpec("mu", "Service rate μ", 1.0, 0.1, 10.0, 0.1),
        ParamSpec("c", "Servers c", 3, 1, 10, 1, kind="int"),
        ParamSpec("n_customers", "Customers per run", 600, 100, 5000, 50, kind="int"),
        ParamSpec("n_reps", "Replications", 200, 20, 1000, 10, kind="int"),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, lam, c, reps, ne, ns):
            return Variant(vid, le, ls, {"lam": lam, "mu": 1.0, "c": c, "n_customers": 600, "n_reps": reps}, ne, ns)

        # ρ = λ/(c·μ); μ=1, c=3 ⇒ ρ = λ/3
        return [
            v("rep50_mod", "50 reps · ρ≈0.67", "50 réplicas · ρ≈0.67", 2.0, 3, 50, "Few replications: wide, jumpy CI.", "Pocas réplicas: IC ancho e inestable."),
            v("rep200_mod", "200 reps · ρ≈0.67", "200 réplicas · ρ≈0.67", 2.0, 3, 200, "More replications: the CI tightens around theory.", "Más réplicas: el IC se cierra en torno a la teoría."),
            v("rep500_mod", "500 reps · ρ≈0.67", "500 réplicas · ρ≈0.67", 2.0, 3, 500, "Many replications: a tight, well-centred CI.", "Muchas réplicas: IC angosto y bien centrado."),
            v("rep200_light", "200 reps · ρ≈0.50", "200 réplicas · ρ≈0.50", 1.5, 3, 200, "Light load: low variance, easy to estimate.", "Carga ligera: baja varianza, fácil de estimar."),
            v("rep200_busy", "200 reps · ρ≈0.80", "200 réplicas · ρ≈0.80", 2.4, 3, 200, "Busier: more run-to-run variability.", "Más ocupada: más variabilidad entre corridas."),
            v("rep200_heavy", "200 reps · ρ≈0.90", "200 réplicas · ρ≈0.90", 2.7, 3, 200, "Heavy load: high variance — the CI is wide.", "Carga alta: alta varianza — el IC es ancho."),
            v("rep500_busy", "500 reps · ρ≈0.80", "500 réplicas · ρ≈0.80", 2.4, 3, 500, "More reps tame the busy-system variance.", "Más réplicas domestican la varianza del sistema ocupado."),
            v("rep500_heavy", "500 reps · ρ≈0.90", "500 réplicas · ρ≈0.90", 2.7, 3, 500, "Even at ρ=0.9, 500 reps give a usable CI.", "Aun a ρ=0.9, 500 réplicas dan un IC utilizable."),
            v("rep50_heavy", "50 reps · ρ≈0.90", "50 réplicas · ρ≈0.90", 2.7, 3, 50, "The danger case: few reps at high load — don't trust it.", "El caso peligroso: pocas réplicas a carga alta — no confíes."),
            v("rep500_light", "500 reps · ρ≈0.50", "500 réplicas · ρ≈0.50", 1.5, 3, 500, "Best case: light load, many reps, razor-tight CI.", "Mejor caso: carga ligera, muchas réplicas, IC finísimo."),
        ]

    def run(self, params: dict, seed: int) -> ChartTrace:
        p = self.coerce(params)
        lam, mu, c, n, reps = p["lam"], p["mu"], int(p["c"]), int(p["n_customers"]), int(p["n_reps"])
        wqs = np.array([mmc_mean_wait(lam, mu, c, n, make_rng(seed + r)) for r in range(reps)])

        ks = list(range(1, reps + 1))
        run_mean, ci_lo, ci_hi = [], [], []
        cum = np.cumsum(wqs)
        for k in ks:
            m = cum[k - 1] / k
            run_mean.append(round(float(m), 4))
            if k >= 2:
                sd = float(np.std(wqs[:k], ddof=1))
                half = 1.96 * sd / math.sqrt(k)  # 95% CI (normal approx)
            else:
                half = 0.0
            ci_lo.append(round(m - half, 4))
            ci_hi.append(round(m + half, 4))

        theory = erlang_c_mmc(lam, mu, c)
        counts, edges = np.histogram(wqs, bins=18)

        tr = ChartTrace(self.id, self.title, self.method, int(seed), p)
        tr.x_label_en, tr.x_label_es = "replications n", "réplicas n"
        tr.y_label_en, tr.y_label_es = "mean wait Wq", "espera media Wq"
        tr.series = {"x": ks, "run_mean": run_mean, "ci_lo": ci_lo, "ci_hi": ci_hi}
        tr.lines = [{"key": "run_mean", "color": "var(--color-magenta)", "label_en": "running mean", "label_es": "media corriente"}]
        tr.band = {"lo": "ci_lo", "hi": "ci_hi", "color": "var(--color-accent)", "label_en": "95% CI", "label_es": "IC 95%"}
        tr.ref_lines = [{"y": round(theory["Wq"], 4), "color": "var(--color-good)", "label_en": "Erlang-C theory", "label_es": "teoría Erlang-C"}]
        tr.bars = {"edges": [round(float(e), 3) for e in edges], "counts": [int(x) for x in counts],
                   "color": "var(--color-fg-faint)", "label_en": "per-run Wq distribution", "label_es": "distribución de Wq por corrida"}
        final_half = round((ci_hi[-1] - ci_lo[-1]) / 2, 4)
        tr.kpis = {
            "final_mean": run_mean[-1],
            "ci_halfwidth": final_half,
            "theory_Wq": round(theory["Wq"], 4),
            "rel_error_pct": round(100 * abs(run_mean[-1] - theory["Wq"]) / theory["Wq"], 2) if theory["Wq"] else 0.0,
            "n_reps": reps,
            "rho": theory["rho"],
        }
        tr.analytic = theory
        return tr
