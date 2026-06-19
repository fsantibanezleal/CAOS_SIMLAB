"""S01 — Bank / Clinic Queue (M/M/c). The DES "hello world" and the app's landing scenario.

Teaches: arrivals, a server pool, the queue, utilisation rho, Little's Law — and crucially
VALIDATION: the simulated mean wait is compared against the closed-form M/M/c (Erlang-C) result, so the
learner sees "does my simulation match the theory?". Pure-Python (SimPy + NumPy) => runs live in Pyodide.

All randomness is drawn up front from one seeded generator, so the run is reproducible from (params,
seed) independent of the event scheduler's interleaving.
"""
from __future__ import annotations

import math
from statistics import fmean

import simpy

from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario
from ..core.trace import Trace


def erlang_c_mmc(lam: float, mu: float, c: int) -> dict:
    """Closed-form M/M/c reference: utilisation, P(wait), Wq (mean wait in queue), Lq.

    Returns Wq = inf when the system is unstable (rho >= 1) — a teachable failure mode.
    """
    rho = lam / (c * mu)
    a = lam / mu  # offered load (Erlangs)
    if rho >= 1.0:
        return {"rho": round(rho, 4), "p_wait": 1.0, "Wq": math.inf, "Lq": math.inf, "stable": False}
    sum_terms = sum((a ** n) / math.factorial(n) for n in range(c))
    last = (a ** c) / (math.factorial(c) * (1.0 - rho))
    p0 = 1.0 / (sum_terms + last)
    p_wait = last * p0  # Erlang-C probability an arrival must queue
    wq = p_wait / (c * mu - lam)
    return {"rho": round(rho, 4), "p_wait": round(p_wait, 4), "Wq": round(wq, 4),
            "Lq": round(lam * wq, 4), "stable": True}


class QueueScenario(Scenario):
    id = "s01_queue"
    title = "Bank / Clinic Queue (M/M/c)"
    method = "DES"
    tier = 1
    viz = "queue-network"
    engine = "simpy"
    pure_python = True
    wheels = ["simpy", "numpy"]
    param_specs = [
        ParamSpec("lam", "Arrival rate λ (/min)", 2.0, 0.1, 10.0, 0.1),
        ParamSpec("mu", "Service rate μ (/min)", 1.0, 0.1, 10.0, 0.1),
        ParamSpec("c", "Servers c", 3, 1, 10, 1, kind="int"),
        ParamSpec("n_customers", "Customers", 300, 50, 5000, 50, kind="int"),
    ]

    def run(self, params: dict, seed: int) -> Trace:
        p = self.coerce(params)
        lam, mu, c, n = p["lam"], p["mu"], p["c"], p["n_customers"]
        rng = make_rng(seed)

        # Draw all variates up front => determinism independent of scheduler interleaving.
        inter = rng.exponential(1.0 / lam, size=n)
        service = rng.exponential(1.0 / mu, size=n)

        env = simpy.Environment()
        servers = simpy.Resource(env, capacity=c)
        tr = Trace(self.id, self.title, self.method, int(seed), p)
        waits: list[float] = []
        sojourns: list[float] = []

        def customer(cid: int) -> "simpy.events.Process":
            t_arr = env.now
            tr.add_event(t_arr, "arrival", id=cid)
            with servers.request() as req:
                yield req
                t_start = env.now
                waits.append(t_start - t_arr)
                tr.add_event(t_start, "start", id=cid)
                yield env.timeout(service[cid])
                sojourns.append(env.now - t_arr)
                tr.add_event(env.now, "depart", id=cid)

        def source() -> "simpy.events.Process":
            for cid in range(n):
                yield env.timeout(inter[cid])
                env.process(customer(cid))

        env.process(source())
        env.run()

        wq_sim = fmean(waits) if waits else 0.0
        w_sim = fmean(sojourns) if sojourns else 0.0
        # Little's Law cross-check: Lq = lambda * Wq (time-average queue length via the rate form).
        tr.kpis = {
            "Wq_sim": round(wq_sim, 4),
            "W_sim": round(w_sim, 4),
            "Lq_little": round(lam * wq_sim, 4),
            "n_customers": n,
            "mean_service": round(1.0 / mu, 4),
            "utilization_offered": round(lam / (c * mu), 4),
        }
        tr.analytic = erlang_c_mmc(lam, mu, c)
        return tr
