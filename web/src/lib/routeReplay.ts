// Deterministic replay for route/network traces: interpolate each agent's position at time t from its
// timed legs, and resolve which incident markers are active. Mirrors simlab.routetrace/v1.
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

export interface RouteState {
  agents: AgentPos[];
  markers: RouteMarker[]; // only those active at t
  movingCount: number;
  pendingCount: number; // active incident markers (S09)
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
  // active leg?
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
  // between legs or after the last: sit at the last completed leg's destination
  let last = legs[0];
  for (const l of legs) if (l.t1 <= t) last = l;
  const b = at(last.b);
  return b ? { ...base, x: b.x, y: b.y, moving: false } : null;
}

export function routeStateAt(trace: RouteTrace, t: number, coord: Map<number, { x: number; y: number }>): RouteState {
  const agents: AgentPos[] = [];
  for (const a of trace.agents) {
    const p = agentPosAt(a, t, coord, a.home);
    if (p) agents.push(p);
  }
  const markers = trace.markers.filter((m) => t >= m.t0 && t <= m.t1);
  return {
    agents,
    markers,
    movingCount: agents.filter((a) => a.moving).length,
    pendingCount: markers.length,
  };
}
