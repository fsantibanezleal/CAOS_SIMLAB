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

export type FlowStage = "src" | "triage" | "treat" | "disch" | "sink";
export interface FlowTransit {
  id: number;
  prio: number;
  from: FlowStage;
  to: FlowStage;
  p: number; // 0..1 progress along the hop
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
  // temporal-coloring cues (mirror QueueViz): decaying 0..1 flash intensities + traveling dots
  srcFlash: number;
  sinkFlash: number;
  triageRecv: number;
  triageDeliver: number;
  treatRecv: number;
  treatDeliver: number;
  dischFlash: number;
  transits: FlowTransit[];
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

/** Flash intensity for an event at time `e`: 1 right at the event, decaying linearly to 0 over `win`. */
const flashAt = (e: number, t: number, win: number) => {
  if (Number.isNaN(e)) return 0;
  const age = t - e;
  return age >= 0 && age < win ? 1 - age / win : 0;
};

// Inter-station hops, latest first, so each patient shows at most one traveling dot.
const HOPS: { ev: keyof Patient; from: FlowStage; to: FlowStage }[] = [
  { ev: "depart", from: "disch", to: "sink" },
  { ev: "treatEnd", from: "treat", to: "disch" },
  { ev: "triageEnd", from: "triage", to: "treat" },
  { ev: "arrival", from: "src", to: "triage" },
];

export function flowStateAt(patients: Patient[], t: number, win = 1): FlowState {
  const s: FlowState = {
    t, arrived: 0, departed: 0, triageWait: [], triageSvc: [], treatWait: [], treatSvc: [], discharge: [],
    srcFlash: 0, sinkFlash: 0, triageRecv: 0, triageDeliver: 0, treatRecv: 0, treatDeliver: 0, dischFlash: 0,
    transits: [],
  };
  for (const p of patients) {
    if (!Number.isNaN(p.arrival) && p.arrival <= t) s.arrived++;
    const gone = !Number.isNaN(p.depart) && p.depart <= t;
    if (gone) s.departed++;
    else if (between(p.arrival, t, p.triageStart)) s.triageWait.push(p);
    else if (between(p.triageStart, t, p.triageEnd)) s.triageSvc.push(p);
    else if (between(p.triageEnd, t, p.treatStart)) s.treatWait.push(p);
    else if (between(p.treatStart, t, p.treatEnd)) s.treatSvc.push(p);
    else if (between(p.treatEnd, t, p.depart)) s.discharge.push(p);

    // flashes (max over patients)
    s.srcFlash = Math.max(s.srcFlash, flashAt(p.arrival, t, win));
    s.triageRecv = Math.max(s.triageRecv, flashAt(p.triageStart, t, win));
    s.triageDeliver = Math.max(s.triageDeliver, flashAt(p.triageEnd, t, win));
    s.treatRecv = Math.max(s.treatRecv, flashAt(p.treatStart, t, win));
    s.treatDeliver = Math.max(s.treatDeliver, flashAt(p.treatEnd, t, win));
    s.dischFlash = Math.max(s.dischFlash, flashAt(p.treatEnd, t, win)); // patient enters discharge
    s.sinkFlash = Math.max(s.sinkFlash, flashAt(p.depart, t, win)); // patient leaves the system

    // one traveling dot per patient: the most recent stage hop still inside the window
    for (const h of HOPS) {
      const e = p[h.ev] as number;
      if (!Number.isNaN(e) && t - e >= 0 && t - e < win) {
        s.transits.push({ id: p.id, prio: p.prio, from: h.from, to: h.to, p: (t - e) / win });
        break;
      }
    }
  }
  return s;
}
