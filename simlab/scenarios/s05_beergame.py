"""S05 — Beer Game (supply-chain bullwhip effect).

Four serial echelons (retailer → wholesaler → distributor → factory). Each forecasts the orders it
receives (exponential smoothing) and uses an order-up-to base-stock rule with a shipping lead time. A
change in customer demand is amplified into ever-larger order swings upstream — the *bullwhip effect*
(Lee, Padmanabhan & Whang 1997). Deterministic/seeded, pure-Python + NumPy.
"""
from __future__ import annotations

import numpy as np

from ..core.charttrace import ChartTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant

STAGES = ["retailer", "wholesaler", "distributor", "factory"]
STAGE_COLORS = ["var(--color-good)", "var(--color-accent)", "var(--color-warn)", "var(--color-magenta)"]
STAGE_LABELS_ES = ["minorista", "mayorista", "distribuidor", "fábrica"]


def _echelon_orders(received: np.ndarray, lead: int, theta: float, base: float) -> np.ndarray:
    """Order-up-to base-stock with exponentially-smoothed forecast.
    order_t = received_t + (S_t − S_{t−1}), S_t = (L+1)·forecast_t."""
    w = len(received)
    forecast = base
    s_prev = (lead + 1) * base
    out = np.zeros(w)
    for t in range(w):
        forecast = theta * received[t] + (1 - theta) * forecast
        s_t = (lead + 1) * forecast
        order = received[t] + (s_t - s_prev)
        out[t] = max(0.0, order)
        s_prev = s_t
    return out


class BeerGameScenario(Scenario):
    id = "s05_beergame"
    title = "Beer Game (Supply-Chain Bullwhip)"
    method = "ABM"
    tier = 2
    viz = "chart"
    engine = "numpy"
    pure_python = True
    wheels = ["numpy"]
    param_specs = [
        ParamSpec("weeks", "Weeks", 52, 20, 120, 1, kind="int"),
        ParamSpec("lead", "Lead time L", 2, 1, 6, 1, kind="int"),
        ParamSpec("theta", "Forecast smoothing θ", 0.4, 0.1, 0.9, 0.05),
        ParamSpec("step", "Demand change", 4.0, 0.0, 12.0, 1.0),
        ParamSpec("pattern", "Demand pattern (0 step,1 spike,2 noise)", 0, 0, 2, 1, kind="int"),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, lead, theta, step, pattern, ne, ns):
            return Variant(vid, le, ls, {"weeks": 52, "lead": lead, "theta": theta, "step": step, "pattern": pattern}, ne, ns)

        return [
            v("L1", "Lead time 1 wk", "Lead time 1 sem", 1, 0.4, 4.0, 0, "Short lead time: modest amplification.", "Lead time corto: amplificación modesta."),
            v("L2", "Lead time 2 wk", "Lead time 2 sem", 2, 0.4, 4.0, 0, "The baseline bullwhip case.", "El caso base de bullwhip."),
            v("L3", "Lead time 3 wk", "Lead time 3 sem", 3, 0.4, 4.0, 0, "Longer lead time amplifies more.", "Mayor lead time amplifica más."),
            v("L4", "Lead time 4 wk", "Lead time 4 sem", 4, 0.4, 4.0, 0, "Long lead time: violent upstream swings.", "Lead time largo: oscilaciones upstream violentas."),
            v("theta20", "Smoothing θ=0.2", "Suavizado θ=0.2", 2, 0.2, 4.0, 0, "Heavy smoothing: calmer, slower response.", "Mucho suavizado: respuesta más calmada y lenta."),
            v("theta40", "Smoothing θ=0.4", "Suavizado θ=0.4", 2, 0.4, 4.0, 0, "Moderate forecasting reactivity.", "Reactividad de pronóstico moderada."),
            v("theta70", "Smoothing θ=0.7", "Suavizado θ=0.7", 2, 0.7, 4.0, 0, "Reactive forecasting worsens the bullwhip.", "Pronóstico reactivo empeora el bullwhip."),
            v("bigstep", "Big demand step", "Salto de demanda grande", 2, 0.4, 8.0, 0, "A large step: large overshoot upstream.", "Un salto grande: gran sobre-pico upstream."),
            v("spike", "One-week spike", "Pico de una semana", 2, 0.4, 8.0, 1, "A transient spike still ripples upstream.", "Un pico transitorio igual repercute upstream."),
            v("noisy", "Noisy demand", "Demanda ruidosa", 2, 0.4, 5.0, 2, "Random demand: variance amplifies stage by stage.", "Demanda aleatoria: la varianza se amplifica eslabón a eslabón."),
        ]

    def run(self, params: dict, seed: int) -> ChartTrace:
        p = self.coerce(params)
        w, lead, theta, step, pattern = int(p["weeks"]), int(p["lead"]), float(p["theta"]), float(p["step"]), int(p["pattern"])
        rng = make_rng(seed)
        base = 8.0
        ws = 6

        demand = np.full(w, base)
        if pattern == 0:  # step
            demand[ws:] = base + step
        elif pattern == 1:  # spike
            demand[ws] = base + step
        else:  # AR(1) noise
            e = 0.0
            for t in range(w):
                e = 0.6 * e + rng.normal(0, step / 2.0)
                demand[t] = max(0.0, base + e)

        series_orders = []
        received = demand.copy()
        for i in range(4):
            orders = _echelon_orders(received, lead, theta, base)
            series_orders.append(orders)
            received = orders  # this stage's orders are the next stage's demand

        var_d = float(np.var(demand)) or 1e-9
        bullwhip = [round(float(np.var(o)) / var_d, 2) for o in series_orders]

        tr = ChartTrace(self.id, self.title, self.method, int(seed), p)
        tr.x_label_en, tr.x_label_es = "week", "semana"
        tr.y_label_en, tr.y_label_es = "orders / demand (units)", "órdenes / demanda (unidades)"
        xs = list(range(1, w + 1))
        tr.series = {"x": xs, "demand": [round(float(d), 2) for d in demand]}
        tr.lines = [{"key": "demand", "color": "var(--color-fg-faint)", "label_en": "customer demand", "label_es": "demanda del cliente", "dashed": True}]
        for i, st in enumerate(STAGES):
            tr.series[st] = [round(float(o), 2) for o in series_orders[i]]
            tr.lines.append({"key": st, "color": STAGE_COLORS[i], "label_en": f"{st} orders", "label_es": f"órdenes {STAGE_LABELS_ES[i]}"})
        tr.kpis = {
            "bullwhip_factory": bullwhip[3],
            "bullwhip_distributor": bullwhip[2],
            "bullwhip_wholesaler": bullwhip[1],
            "bullwhip_retailer": bullwhip[0],
            "peak_factory_order": round(float(np.max(series_orders[3])), 1),
        }
        return tr
