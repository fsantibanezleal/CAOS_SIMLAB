"""S05 — Beer Game (supply-chain bullwhip effect), running on **Mesa 3**.

Four serial echelons (retailer → wholesaler → distributor → factory). Each forecasts the orders it
receives (exponential smoothing) and uses an order-up-to base-stock rule with a shipping lead time. A
change in customer demand is amplified into ever-larger order swings upstream — the *bullwhip effect*
(Lee, Padmanabhan & Whang 1997).

This is **not** a grid model: the Beer Game is a tiny serial *network*, so there is no ``mesa.space``.
Each echelon is a real :class:`mesa.Agent` holding its own forecast/order-position state; the
:class:`mesa.Model` steps them once per simulated week through the model's ``AgentSet`` (``self.agents``),
exactly the activation pattern the S02 Schelling template establishes — only the space is dropped. Within a
week the model activates the echelons **downstream → upstream**, so the order an agent places this tick is
the demand its upstream neighbour sees this same tick; information ripples up the chain one activation at a
time. That tick-by-tick cascade is mathematically identical to the original whole-horizon NumPy sweep (each
stage's order at week *t* still depends only on its incoming order at week *t*), so the emitted trace is
byte-for-byte unchanged.

Determinism flows from Mesa's seeded RNG: ``Model(rng=int(seed))`` seeds ``self.rng`` (a NumPy Generator
identical to ``np.random.default_rng(seed)``), the only source of randomness (the AR(1) noisy-demand
pattern). Same (params, seed) → same trace — the lab's "replay = truth" contract. The emitted artifact is
the existing chart-trace format (inventory/backorder/order series + KPIs); nothing in the trace schema or
the frontend contract changes.
"""
from __future__ import annotations

import numpy as np

from ..core.charttrace import ChartTrace
from ..core.scenario import ParamSpec, Scenario, Variant

STAGES = ["retailer", "wholesaler", "distributor", "factory"]
STAGE_COLORS = ["var(--color-good)", "var(--color-accent)", "var(--color-warn)", "var(--color-magenta)"]
STAGE_LABELS_ES = ["minorista", "mayorista", "distribuidor", "fábrica"]

# The Mesa Agent/Model subclasses are built lazily (Mesa is a heavy third-party dep absent under Pyodide).
# Importing this module — the Scenario subclass + variants()/param_specs — therefore needs ZERO heavy deps
# (numpy is allowed: it exists in the live worker). Mesa is imported only when ``run()`` calls ``_models()``
# to build the classes (cached after the first build, so behaviour is identical to top-level definitions).
_MODELS: tuple[type, type] | None = None


def _models() -> tuple[type, type]:
    """Build (and cache) the Mesa-backed ``EchelonAgent`` + ``BeerGameModel`` classes.

    Mesa is imported here, inside the function that needs it, so ``import simlab.registry`` works without
    Mesa installed (the Pyodide live lane). The classes are identical to a top-level definition.
    """
    global _MODELS
    if _MODELS is not None:
        return _MODELS

    import mesa

    class EchelonAgent(mesa.Agent):
        """One supply-chain echelon running an order-up-to base-stock policy.

        The agent owns its own state — an exponentially-smoothed forecast of incoming demand and its
        previous order-up-to level ``S`` — and exposes one local rule, :meth:`place_order`, which the model
        calls each week with the order this echelon received from its downstream neighbour. The rule is the
        classic base-stock update: ``order_t = received_t + (S_t − S_{t−1})`` with ``S_t = (L+1)·forecast_t``,
        clamped at zero. Nothing here is global; the bullwhip *emerges* from four agents each following this.
        """

        def __init__(self, model: "BeerGameModel", lead: int, theta: float, base: float) -> None:
            super().__init__(model)
            self.lead = int(lead)
            self.theta = float(theta)
            self.forecast = float(base)
            self.s_prev = (self.lead + 1) * float(base)
            self.orders: list[float] = []

        def place_order(self, received: float) -> float:
            """Update the forecast from the demand just received, set the order-up-to level, emit the order."""
            self.forecast = self.theta * received + (1 - self.theta) * self.forecast
            s_t = (self.lead + 1) * self.forecast
            order = max(0.0, received + (s_t - self.s_prev))
            self.s_prev = s_t
            self.orders.append(order)
            return order

    class BeerGameModel(mesa.Model):
        """The Beer Game world: four serial echelons, no space — a plain Mesa model over an ``AgentSet``.

        Built with Mesa 3. The customer-demand series is generated up front from the seeded ``self.rng`` (so
        the AR(1) noisy pattern is reproducible), then :meth:`step` is called once per week. Each step pushes
        the customer demand into the retailer and lets each order cascade upstream through ``self.agents`` —
        the model's ``AgentSet``, ordered retailer → factory, which is the activation order the Beer Game
        needs (downstream places its order before its upstream neighbour acts on it).
        """

        def __init__(self, weeks: int, lead: int, theta: float, step: float, pattern: int, seed: int,
                     base: float = 8.0, warmup: int = 6) -> None:
            # Mesa 3: ``rng=`` seeds self.rng (NumPy Generator, identical to np.random.default_rng(seed))
            # and self.random. Seeding here makes the whole run reproducible — the committed trace's truth.
            super().__init__(rng=int(seed))
            self.weeks = int(weeks)
            self.base = float(base)

            # The four echelons are created retailer → factory, so self.agents iterates in that serial order.
            for _ in STAGES:
                EchelonAgent(self, lead, theta, base)

            self.demand = self._build_demand(self.weeks, base, float(step), int(pattern), int(warmup))
            self.week = 0

        def _build_demand(self, w: int, base: float, step: float, pattern: int, ws: int) -> np.ndarray:
            """Customer demand: a step, a one-week spike, or AR(1) noise (the only stochastic pattern)."""
            demand = np.full(w, base)
            if pattern == 0:  # step
                demand[ws:] = base + step
            elif pattern == 1:  # spike
                demand[ws] = base + step
            else:  # AR(1) noise — draws flow through the seeded model RNG
                e = 0.0
                for t in range(w):
                    e = 0.6 * e + self.rng.normal(0, step / 2.0)
                    demand[t] = max(0.0, base + e)
            return demand

        def step(self) -> None:
            """One simulated week: push customer demand into the chain; orders cascade one stage upstream.

            ``self.agents`` is the model's AgentSet in creation order (retailer → factory). Activating in
            that order means each echelon places its order from the order its downstream neighbour just
            placed this same tick — information ripples upstream one activation per stage.
            """
            incoming = float(self.demand[self.week])
            for agent in self.agents:
                incoming = agent.place_order(incoming)
            self.week += 1

    _MODELS = (EchelonAgent, BeerGameModel)
    return _MODELS


class BeerGameScenario(Scenario):
    id = "s05_beergame"
    title = "Beer Game (Supply-Chain Bullwhip)"
    method = "ABM"
    tier = 2
    viz = "chart"
    engine = "mesa"
    pure_python = True
    wheels = ["numpy", "mesa"]
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
        base = 8.0

        _, BeerGameModel = _models()  # lazy: build the Mesa-backed model classes only when running
        model = BeerGameModel(weeks=w, lead=lead, theta=theta, step=step, pattern=pattern, seed=int(seed), base=base)
        for _ in range(w):
            model.step()

        demand = model.demand
        echelons = list(model.agents)  # retailer → factory (creation order)
        series_orders = [np.asarray(ag.orders) for ag in echelons]

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
