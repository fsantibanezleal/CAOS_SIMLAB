// Turn a flat M/M/c event timeline into per-customer intervals and a state-at-time query.
// This is the deterministic player: the same trace always yields the same animation.
import type { Trace } from "./types";

export interface Customer {
  id: number;
  arrival: number;
  start: number; // when service began
  depart: number; // when service ended
}

export interface QueueState {
  t: number;
  arrived: number;
  served: number;
  waiting: Customer[]; // arrived, not yet in service
  inService: Customer[]; // currently being served (<= c)
}

export function buildCustomers(trace: Trace): Customer[] {
  const map = new Map<number, Customer>();
  for (const e of trace.timeline.events) {
    if (typeof e.id !== "number") continue;
    let c = map.get(e.id);
    if (!c) {
      c = { id: e.id, arrival: NaN, start: NaN, depart: NaN };
      map.set(e.id, c);
    }
    if (e.kind === "arrival") c.arrival = e.t;
    else if (e.kind === "start") c.start = e.t;
    else if (e.kind === "depart") c.depart = e.t;
  }
  return [...map.values()].sort((a, b) => a.arrival - b.arrival);
}

export function stateAt(customers: Customer[], t: number): QueueState {
  const waiting: Customer[] = [];
  const inService: Customer[] = [];
  let arrived = 0;
  let served = 0;
  for (const c of customers) {
    if (c.arrival <= t) arrived++;
    if (!Number.isNaN(c.depart) && c.depart <= t) {
      served++;
      continue;
    }
    if (!Number.isNaN(c.start) && c.start <= t) inService.push(c);
    else if (c.arrival <= t) waiting.push(c);
  }
  // most-recent arrivals at the front of the queue lane (visual)
  inService.sort((a, b) => a.start - b.start);
  return { t, arrived, served, waiting, inService };
}
