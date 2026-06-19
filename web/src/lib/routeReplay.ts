// Deterministic replay for route/network traces: interpolate each agent's position at time t from its
// timed legs, resolve active incident markers, and surface event cues for the temporal coloring — node
// arrival flashes (an agent reaching a special node), a "served" set (visited destinations), per-marker
// spawn pops, and running terminal counters. Mirrors simlab.routetrace/v1.
import type { RouteAgent, RouteMarker, RouteTrace } from "./types";

export interface AgentPos {
  id: number;
  kind: string;
  color: string;
  x: number;
  y: number;
  px?: number; // a point slightly behind, for a motion trail (only while moving)
  py?: number;
  moving: boolean;
}

export interface LiveMarker extends RouteMarker {
  spawn: number; // 0..1 bright pop decaying from t0 so a NEW call stands out
}

export interface RouteState {
  agents: AgentPos[];
  markers: LiveMarker[]; // active (pending) markers only
  movingCount: number;
  pendingCount: number;
  nodeFlash: Map<number, number>; // nodeId -> 0..1 deliver flash (agent just arrived)
  served: Set<number>; // special nodes visited so far (dims served customers in S08)
  arrivalsByKind: Record<string, number>; // running count of arrivals per node kind
  resolved: number; // incident markers resolved so far (S09)
  arrivalFlash: number; // pulse when any special-node arrival just happened
  resolvedFlash: number; // pulse when a marker just resolved
}

/** Index node coordinates for O(1) lookup. */
export function nodeIndex(trace: RouteTrace): Map<number, { x: number; y: number }> {
  const m = new Map<number, { x: number; y: number }>();
  for (const n of trace.nodes) m.set(n.id, { x: n.x, y: n.y });
  return m;
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

/** Position of one agent at time t. moving=true while inside an active leg. */
export function agentPosAt(
  agent: RouteAgent,
  t: number,
  coord: Map<number, { x: number; y: number }>,
  fallback: number | undefined,
): AgentPos | null {
  const legs = agent.legs;
  const at = (id: number) => coord.get(id);
  const base = { id: agent.id, kind: agent.kind, color: agent.color };
  if (legs.length === 0) {
    const home = fallback !== undefined ? at(fallback) : undefined;
    return home ? { ...base, x: home.x, y: home.y, moving: false } : null;
  }
  if (t <= legs[0].t0) {
    const a = at(legs[0].a);
    return a ? { ...base, x: a.x, y: a.y, moving: false } : null;
  }
  for (const l of legs) {
    if (t >= l.t0 && t <= l.t1) {
      const a = at(l.a);
      const b = at(l.b);
      if (!a || !b) return null;
      const u = l.t1 > l.t0 ? (t - l.t0) / (l.t1 - l.t0) : 1;
      const ub = Math.max(0, u - 0.18);
      return {
        ...base,
        x: lerp(a.x, b.x, u),
        y: lerp(a.y, b.y, u),
        px: lerp(a.x, b.x, ub),
        py: lerp(a.y, b.y, ub),
        moving: true,
      };
    }
  }
  let last = legs[0];
  for (const l of legs) if (l.t1 <= t) last = l;
  const b = at(last.b);
  return b ? { ...base, x: b.x, y: b.y, moving: false } : null;
}

export function routeStateAt(trace: RouteTrace, t: number, coord: Map<number, { x: number; y: number }>, win = 1): RouteState {
  const kindOf = new Map<number, string>();
  for (const n of trace.nodes) kindOf.set(n.id, n.kind);

  const agents: AgentPos[] = [];
  const nodeFlash = new Map<number, number>();
  const served = new Set<number>();
  const arrivalsByKind: Record<string, number> = {};
  let arrivalFlash = 0;
  for (const a of trace.agents) {
    const p = agentPosAt(a, t, coord, a.home);
    if (p) agents.push(p);
    for (const leg of a.legs) {
      const kind = kindOf.get(leg.b);
      if (!kind || kind === "junction") continue; // only special destinations count
      if (leg.t1 <= t) {
        served.add(leg.b);
        arrivalsByKind[kind] = (arrivalsByKind[kind] ?? 0) + 1;
        const age = t - leg.t1;
        if (age >= 0 && age < win) {
          const f = 1 - age / win;
          nodeFlash.set(leg.b, Math.max(nodeFlash.get(leg.b) ?? 0, f));
          arrivalFlash = Math.max(arrivalFlash, f);
        }
      }
    }
  }

  const markers: LiveMarker[] = [];
  let resolved = 0;
  let resolvedFlash = 0;
  for (const m of trace.markers) {
    if (t >= m.t1) {
      resolved++;
      const age = t - m.t1;
      if (age >= 0 && age < win) resolvedFlash = Math.max(resolvedFlash, 1 - age / win);
    } else if (t >= m.t0) {
      const dt = t - m.t0;
      markers.push({ ...m, spawn: dt < win ? 1 - dt / win : 0 });
    }
  }

  return {
    agents,
    markers,
    movingCount: agents.filter((a) => a.moving).length,
    pendingCount: markers.length,
    nodeFlash,
    served,
    arrivalsByKind,
    resolved,
    arrivalFlash,
    resolvedFlash,
  };
}
