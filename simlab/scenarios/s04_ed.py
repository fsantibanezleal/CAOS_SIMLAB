"""S04 — Emergency department patient flow (multi-stage DES).

Patients arrive (non-stationary, with an optional daytime surge), are seen at TRIAGE (FCFS pool), then
TREATMENT (a priority pool — urgent patients jump the queue), then a fixed discharge delay. The bottleneck
is treatment. Exercises multi-stage flow, priority, non-stationary arrivals, and length-of-stay by class.
SimPy, seeded (all variates drawn up front) → reproducible flow trace.
"""
from __future__ import annotations

from statistics import fmean

import simpy

from ..core.flowtrace import FlowTrace
from ..core.rng import make_rng
from ..core.scenario import ParamSpec, Scenario, Variant

URGENT, STANDARD = 0, 1


class EDScenario(Scenario):
    id = "s04_ed"
    title = "Emergency Department Patient Flow"
    method = "DES"
    tier = 2
    viz = "flow"
    engine = "simpy"
    pure_python = True
    wheels = ["simpy", "numpy"]
    param_specs = [
        ParamSpec("lam", "Arrival rate λ", 2.0, 0.2, 6.0, 0.1),
        ParamSpec("mu_triage", "Triage rate μ_t", 3.0, 0.5, 10.0, 0.1),
        ParamSpec("mu_treat", "Treatment rate μ_x", 0.8, 0.2, 4.0, 0.1),
        ParamSpec("c_triage", "Triage nurses", 2, 1, 6, 1, kind="int"),
        ParamSpec("c_treat", "Treatment bays", 3, 1, 10, 1, kind="int"),
        ParamSpec("p_urgent", "Urgent fraction", 0.25, 0.0, 0.8, 0.05),
        ParamSpec("surge", "Daytime surge (0/1)", 0, 0, 1, 1, kind="int"),
        ParamSpec("n_patients", "Patients", 240, 50, 2000, 10, kind="int"),
    ]

    def variants(self) -> list[Variant]:
        def v(vid, le, ls, lam, ct, cx, surge, pu, ne, ns):
            return Variant(vid, le, ls, {"lam": lam, "mu_triage": 3.0, "mu_treat": 0.8, "c_triage": ct,
                                          "c_treat": cx, "p_urgent": pu, "surge": surge, "n_patients": 240}, ne, ns)

        return [
            v("calm", "Calm shift", "Turno tranquilo", 1.2, 2, 3, 0, 0.25, "Light arrivals: short stays, little waiting.", "Pocas llegadas: estancias cortas, poca espera."),
            v("typical", "Typical shift", "Turno típico", 2.0, 2, 3, 0, 0.25, "Busy but stable; treatment is the bottleneck.", "Ocupado pero estable; tratamiento es el cuello de botella."),
            v("busy", "Busy shift", "Turno ocupado", 2.3, 2, 3, 0, 0.25, "Treatment near capacity — queues build.", "Tratamiento cerca de capacidad — se forman colas."),
            v("overloaded", "Overloaded", "Sobrecargado", 2.9, 2, 3, 0, 0.25, "Demand exceeds treatment capacity: the ED backs up.", "La demanda supera la capacidad de tratamiento: la urgencia se satura."),
            v("surge", "Daytime surge", "Surge diurno", 2.0, 2, 3, 1, 0.25, "A mid-shift arrival surge stresses the system transiently.", "Un surge de llegadas a media jornada estresa el sistema transitoriamente."),
            v("understaffed", "Understaffed treatment", "Tratamiento con poco personal", 2.0, 2, 2, 0, 0.25, "One fewer bay: the bottleneck tightens sharply.", "Una camilla menos: el cuello de botella se aprieta fuerte."),
            v("wellstaffed", "Well-staffed", "Bien dotado", 2.3, 2, 4, 0, 0.25, "An extra bay absorbs the busy load.", "Una camilla extra absorbe la carga ocupada."),
            v("triage_bottleneck", "Single triage nurse", "Una enfermera de triage", 2.0, 1, 3, 0, 0.25, "Triage becomes the upstream bottleneck.", "El triage se vuelve el cuello de botella aguas arriba."),
            v("high_urgent", "Many urgent", "Muchos urgentes", 2.0, 2, 3, 0, 0.45, "More urgent patients: priority reshapes who waits.", "Más urgentes: la prioridad redefine quién espera."),
            v("low_urgent", "Few urgent", "Pocos urgentes", 2.0, 2, 3, 0, 0.10, "Few urgent patients: priority rarely bites.", "Pocos urgentes: la prioridad casi no se nota."),
        ]

    def run(self, params: dict, seed: int) -> FlowTrace:
        p = self.coerce(params)
        lam, mt, mx = p["lam"], p["mu_triage"], p["mu_treat"]
        ct, cx = int(p["c_triage"]), int(p["c_treat"])
        pu, surge, n = p["p_urgent"], int(p["surge"]), int(p["n_patients"])
        rng = make_rng(seed)

        # Non-stationary arrivals via thinning; surge doubles λ over the middle of the shift.
        horizon = n / lam * 1.3
        s0, s1 = 0.30 * horizon, 0.60 * horizon
        lam_max = lam * 2.0
        arrivals: list[float] = []
        t = 0.0
        guard = 0
        while len(arrivals) < n and guard < n * 50:
            guard += 1
            t += rng.exponential(1.0 / lam_max)
            rate = lam * (2.0 if (surge and s0 <= t < s1) else 1.0)
            if rng.random() < rate / lam_max:
                arrivals.append(t)
        n = len(arrivals)
        prios = [URGENT if rng.random() < pu else STANDARD for _ in range(n)]
        tri_svc = rng.exponential(1.0 / mt, size=n)
        trt_svc = rng.exponential(1.0 / mx, size=n)
        discharge = 0.3

        env = simpy.Environment()
        triage = simpy.Resource(env, capacity=ct)
        treat = simpy.PriorityResource(env, capacity=cx)
        tr = FlowTrace(self.id, self.title, self.method, int(seed), p, stations=[
            {"id": "triage", "label_en": "Triage", "label_es": "Triage", "c": ct},
            {"id": "treat", "label_en": "Treatment", "label_es": "Tratamiento", "c": cx},
            {"id": "discharge", "label_en": "Discharge", "label_es": "Alta", "c": 0},
        ], legend=[
            {"code": URGENT, "label_en": "urgent", "label_es": "urgente", "color": "var(--color-bad)"},
            {"code": STANDARD, "label_en": "standard", "label_es": "estándar", "color": "var(--color-accent)"},
        ])
        los, los_u, los_s, wait_treat = [], [], [], []

        def patient(pid: int, prio: int):
            t_arr = env.now
            tr.add_event(t_arr, "arrival", id=pid, prio=prio)
            with triage.request() as req:
                yield req
                tr.add_event(env.now, "triage_start", id=pid, prio=prio)
                yield env.timeout(tri_svc[pid])
                tr.add_event(env.now, "triage_end", id=pid, prio=prio)
            t_q = env.now
            with treat.request(priority=prio) as req:
                yield req
                wait_treat.append(env.now - t_q)
                tr.add_event(env.now, "treat_start", id=pid, prio=prio)
                yield env.timeout(trt_svc[pid])
                tr.add_event(env.now, "treat_end", id=pid, prio=prio)
            yield env.timeout(discharge)
            tr.add_event(env.now, "depart", id=pid, prio=prio)
            stay = env.now - t_arr
            los.append(stay)
            (los_u if prio == URGENT else los_s).append(stay)

        def source():
            for i in range(n):
                yield env.timeout(max(0.0, arrivals[i] - env.now))
                env.process(patient(i, prios[i]))

        env.process(source())
        env.run()

        tr.kpis = {
            "mean_LOS": round(fmean(los), 3) if los else 0.0,
            "mean_LOS_urgent": round(fmean(los_u), 3) if los_u else 0.0,
            "mean_LOS_standard": round(fmean(los_s), 3) if los_s else 0.0,
            "mean_wait_treatment": round(fmean(wait_treat), 3) if wait_treat else 0.0,
            "n_patients": n,
            "rho_treatment": round(lam / (cx * mx), 3),
            "urgent_frac": round(sum(1 for x in prios if x == URGENT) / max(n, 1), 3),
        }
        return tr
