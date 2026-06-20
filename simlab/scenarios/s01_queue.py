"""S01 — Bank / Clinic Queue (M/M/c). The DES "hello world" and the app's landing scenario.

Teaches: arrivals, a server pool, the queue, utilisation rho, Little's Law — and crucially
VALIDATION: the simulated mean wait is compared against the closed-form M/M/c (Erlang-C) result, so the
learner sees "does my simulation match the theory?". Pure-Python (SimPy + Ciw) => runs live in Pyodide.

Two independent simulators back the validation lesson, so "the sim converges to theory" is *real*:

* The live, animatable run uses **SimPy** — one process per customer over a ``simpy.Resource`` pool. Its
  per-customer event timeline is what the front end animates, and its mean waits are the headline KPIs.
* The analytic field carries the closed-form **Erlang-C** reference *plus a real second-engine check from*
  **Ciw**: a short, seeded M/M/c replication study (``ciw_xcheck``) whose mean Wq is compared back to the
  Erlang-C Wq. So the trace literally records two simulators (SimPy KPIs, Ciw cross-check) both landing on
  the same closed-form theory — the lab uses the queueing framework it documents rather than re-deriving it.

All randomness is drawn from seeded generators — the SimPy variates from one ``make_rng(seed)`` drawn up
front (so determinism is independent of the scheduler's interleaving), the Ciw replications from
``ciw.seed(...)`` per replication — so a run is fully reproducible from (params, seed): the same input
yields the same trace byte-for-byte.
"""
from __future__ import annotations

import math
from statistics import fmean, mean, stdev

import ciw
import simpy

from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant
from ..core.trace import Trace

# --- Ciw cross-check controls (deterministic, kept small so the live gate still passes) -------------
# Each replication is run long enough to see ~CIW_TARGET_ARRIVALS post-warm-up customers, so every regime
# gets comparable statistical mass; the run length is capped so even high-throughput pools stay well under
# the 3 s live-lane gate. Replications use ciw.seed(base + k) => the study is fully reproducible.
CIW_REPS = 10
CIW_TARGET_ARRIVALS = 8000
CIW_WARMUP = 200.0
CIW_MAX_TIME = 6000.0
CIW_SEED_STRIDE = 1000  # replication k of a run with seed s uses ciw.seed(s * stride + k)


def erlang_c_mmc(lam: float, mu: float, c: int) -> dict:
    """Closed-form M/M/c reference: utilisation, P(wait), Wq (mean wait in queue), Lq.

    Returns Wq = None (null) when unstable (rho >= 1) — a teachable failure mode.
    """
    rho = lam / (c * mu)
    a = lam / mu  # offered load (Erlangs)
    if rho >= 1.0:
        # Unstable: no finite steady state. Use null (not inf) so the trace stays valid JSON.
        return {"rho": round(rho, 4), "p_wait": None, "Wq": None, "Lq": None, "stable": False}
    sum_terms = sum((a ** n) / math.factorial(n) for n in range(c))
    last = (a ** c) / (math.factorial(c) * (1.0 - rho))
    p0 = 1.0 / (sum_terms + last)
    p_wait = last * p0  # Erlang-C probability an arrival must queue
    wq = p_wait / (c * mu - lam)
    return {"rho": round(rho, 4), "p_wait": round(p_wait, 4), "Wq": round(wq, 4),
            "Lq": round(lam * wq, 4), "stable": True}


def _ciw_replication_wq(lam: float, mu: float, c: int, max_time: float, seed: int) -> float:
    """One seeded Ciw M/M/c run; return the mean post-warm-up waiting time in queue.

    Built on the real **Ciw** DES framework — Poisson arrivals + exponential service over ``c`` servers
    (an M/M/c node), exactly as the queueing chapter defines it. ``ciw.seed(seed)`` makes the run
    reproducible. Returns 0.0 if no customer cleared the warm-up (degenerate short run).
    """
    network = ciw.create_network(
        arrival_distributions=[ciw.dists.Exponential(rate=lam)],
        service_distributions=[ciw.dists.Exponential(rate=mu)],
        number_of_servers=[c],
    )
    ciw.seed(int(seed))
    sim = ciw.Simulation(network)
    sim.simulate_until_max_time(max_time)
    waits = [r.waiting_time for r in sim.get_all_records() if r.arrival_date >= CIW_WARMUP]
    return mean(waits) if waits else 0.0


def ciw_validate_mmc(lam: float, mu: float, c: int, seed: int, theory_wq: float | None) -> dict:
    """Real second-engine validation: a short, seeded **Ciw** M/M/c replication study vs Erlang-C.

    Runs ``CIW_REPS`` independent seeded replications, each long enough to clear ~``CIW_TARGET_ARRIVALS``
    post-warm-up arrivals (run length capped at ``CIW_MAX_TIME``). Reports the across-replication mean Wq,
    a normal 95% half-CI, and the relative error against the closed-form ``theory_wq`` — so the artifact
    records, deterministically, that an *independent* simulator lands on the same theory the lab teaches.

    For an unstable system (``theory_wq is None``) there is no finite steady-state Wq to converge to, so
    the study is skipped and ``applicable`` is False (a teachable null, kept valid JSON).
    """
    if theory_wq is None or theory_wq <= 0.0:
        return {"engine": "ciw", "applicable": False, "reps": 0,
                "Wq_ciw": None, "ci95_half": None, "rel_err": None}

    max_time = min(CIW_WARMUP + CIW_TARGET_ARRIVALS / lam, CIW_MAX_TIME)
    base = int(seed) * CIW_SEED_STRIDE
    per_rep = [_ciw_replication_wq(lam, mu, c, max_time, base + k) for k in range(CIW_REPS)]

    wq_ciw = mean(per_rep)
    sd = stdev(per_rep) if len(per_rep) > 1 else 0.0
    half_ci = 1.96 * sd / math.sqrt(len(per_rep)) if per_rep else 0.0
    rel_err = abs(wq_ciw - theory_wq) / theory_wq
    return {
        "engine": "ciw",
        "applicable": True,
        "reps": CIW_REPS,
        "max_time": round(max_time, 1),
        "warmup": round(CIW_WARMUP, 1),
        "Wq_ciw": round(wq_ciw, 4),
        "ci95_half": round(half_ci, 4),
        "rel_err": round(rel_err, 4),
        "theory_in_ci": bool((wq_ciw - half_ci) <= theory_wq <= (wq_ciw + half_ci)),
    }


class QueueScenario(Scenario):
    id = "s01_queue"
    title = "Bank / Clinic Queue (M/M/c)"
    method = "DES"
    tier = 1
    viz = "queue-network"
    engine = "simpy"
    pure_python = True
    # SimPy runs the live, animatable simulation; Ciw runs the independent M/M/c cross-check against
    # Erlang-C. Both are pure Python, so the live (Pyodide) lane is preserved. NumPy supplies the seeded
    # variate stream for the SimPy run.
    wheels = ["simpy", "ciw", "numpy"]
    param_specs = [
        ParamSpec("lam", "Arrival rate λ (/min)", 2.0, 0.1, 10.0, 0.1),
        ParamSpec("mu", "Service rate μ (/min)", 1.0, 0.1, 10.0, 0.1),
        ParamSpec("c", "Servers c", 3, 1, 10, 1, kind="int"),
        ParamSpec("n_customers", "Customers", 300, 50, 5000, 50, kind="int"),
    ]

    def variants(self) -> list[Variant]:
        """12 pre-simulated regimes: a load sweep (ρ from 0.33 to unstable), the single-server M/M/1
        special case, and a fixed-ρ server-count sweep that exposes the pooling effect."""
        n = 300

        def v(vid, le, ls, lam, mu, c, ne, ns):
            return Variant(vid, le, ls, {"lam": lam, "mu": mu, "c": c, "n_customers": n}, ne, ns)

        return [
            v("light", "Light load (ρ≈0.33)", "Carga ligera (ρ≈0.33)", 1.0, 1.0, 3,
              "Servers mostly idle; almost no one waits.", "Servidores casi ociosos; casi nadie espera."),
            v("moderate", "Moderate (ρ≈0.67)", "Moderada (ρ≈0.67)", 2.0, 1.0, 3,
              "A healthy operating point; short, stable queue.", "Punto de operación sano; cola corta y estable."),
            v("busy", "Busy (ρ≈0.80)", "Ocupada (ρ≈0.80)", 2.4, 1.0, 3,
              "Waits become noticeable as load rises.", "Las esperas se notan al subir la carga."),
            v("heavy", "Heavy (ρ≈0.90)", "Alta (ρ≈0.90)", 2.7, 1.0, 3,
              "Near the knee of the curve — waits climb fast.", "Cerca del codo de la curva — la espera sube rápido."),
            v("saturated", "Near-saturation (ρ≈0.95)", "Casi saturada (ρ≈0.95)", 2.85, 1.0, 3,
              "Tiny load increases cause huge wait increases.", "Pequeños aumentos de carga disparan la espera."),
            v("unstable", "Unstable (ρ≈1.10)", "Inestable (ρ≈1.10)", 3.3, 1.0, 3,
              "Arrivals exceed capacity: the queue grows without bound (theory Wq = ∞).",
              "Las llegadas superan la capacidad: la cola crece sin límite (teoría Wq = ∞)."),
            v("mm1", "Single server M/M/1 (ρ≈0.80)", "Un servidor M/M/1 (ρ≈0.80)", 0.8, 1.0, 1,
              "One server at ρ=0.8 — compare its wait with the multi-server pools below.",
              "Un servidor a ρ=0.8 — compara su espera con los pools multi-servidor de abajo."),
            v("mm1_busy", "Single server busy (ρ≈0.90)", "Un servidor ocupado (ρ≈0.90)", 0.9, 1.0, 1,
              "A single busy server: long, volatile waits.", "Un solo servidor ocupado: esperas largas y volátiles."),
            v("c2", "Two servers (ρ≈0.80)", "Dos servidores (ρ≈0.80)", 1.6, 1.0, 2,
              "Same ρ as M/M/1 but pooled across 2 servers.", "Mismo ρ que M/M/1 pero compartido entre 2 servidores."),
            v("c5", "Five servers (ρ≈0.80)", "Cinco servidores (ρ≈0.80)", 4.0, 1.0, 5,
              "Same ρ, more servers: pooling shortens the wait (economies of scale).",
              "Mismo ρ, más servidores: el pooling acorta la espera (economías de escala)."),
            v("c10", "Ten servers (ρ≈0.80)", "Diez servidores (ρ≈0.80)", 8.0, 1.0, 10,
              "A large pool at the same ρ — the wait nearly vanishes.", "Un pool grande al mismo ρ — la espera casi desaparece."),
            v("fast", "Fast service, 2 servers (ρ≈0.50)", "Servicio rápido, 2 servidores (ρ≈0.50)", 2.0, 2.0, 2,
              "Doubling the service rate μ halves the load.", "Duplicar la tasa de servicio μ reduce la carga a la mitad."),
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
        # Closed-form Erlang-C reference (exact) + a real second-engine Ciw replication study that should
        # converge to it. The top-level analytic keys (rho/p_wait/Wq/Lq/stable) are unchanged; the Ciw
        # cross-check is recorded under a nested "ciw_xcheck" key so the schema the frontend consumes is
        # preserved while the validation lesson becomes genuinely tool-backed.
        analytic = erlang_c_mmc(lam, mu, c)
        analytic["ciw_xcheck"] = ciw_validate_mmc(lam, mu, c, int(seed), analytic["Wq"])
        tr.analytic = analytic
        return tr
