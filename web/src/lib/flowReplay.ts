// Reconstruct multi-stage flow (S04 ED) state at time t from the event trace.
import type { FlowTrace } from "./types";

export interface Patient {
  id: number;
  prio: number;
  arrival: number;
  triageStart: number;
  triageEnd: number;
  treatStart: number;
  treatEnd: number;
  depart: number;
}

export interface FlowState {
  t: number;
  arrived: number;
  departed: number;
  triageWait: Patient[];
  triageSvc: Patient[];
  treatWait: Patient[];
  treatSvc: Patient[];
  discharge: Patient[];
}

const N = Number.NaN;

export function buildPatients(trace: FlowTrace): Patient[] {
  const map = new Map<number, Patient>();
  for (const e of trace.timeline.events) {
    let pt = map.get(e.id);
    if (!pt) {
      pt = { id: e.id, prio: e.prio, arrival: N, triageStart: N, triageEnd: N, treatStart: N, treatEnd: N, depart: N };
      map.set(e.id, pt);
    }
    pt.prio = e.prio;
    if (e.kind === "arrival") pt.arrival = e.t;
    else if (e.kind === "triage_start") pt.triageStart = e.t;
    else if (e.kind === "triage_end") pt.triageEnd = e.t;
    else if (e.kind === "treat_start") pt.treatStart = e.t;
    else if (e.kind === "treat_end") pt.treatEnd = e.t;
    else if (e.kind === "depart") pt.depart = e.t;
  }
  return [...map.values()].sort((a, b) => a.arrival - b.arrival);
}

const between = (a: number, t: number, b: number) => !Number.isNaN(a) && a <= t && (Number.isNaN(b) || t < b);

export function flowStateAt(patients: Patient[], t: number): FlowState {
  const s: FlowState = { t, arrived: 0, departed: 0, triageWait: [], triageSvc: [], treatWait: [], treatSvc: [], discharge: [] };
  for (const p of patients) {
    if (!Number.isNaN(p.arrival) && p.arrival <= t) s.arrived++;
    if (!Number.isNaN(p.depart) && p.depart <= t) {
      s.departed++;
      continue;
    }
    if (between(p.arrival, t, p.triageStart)) s.triageWait.push(p);
    else if (between(p.triageStart, t, p.triageEnd)) s.triageSvc.push(p);
    else if (between(p.triageEnd, t, p.treatStart)) s.treatWait.push(p);
    else if (between(p.treatStart, t, p.treatEnd)) s.treatSvc.push(p);
    else if (between(p.treatEnd, t, p.depart)) s.discharge.push(p);
  }
  return s;
}
