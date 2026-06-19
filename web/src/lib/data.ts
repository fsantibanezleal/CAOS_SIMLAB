import type { ChartTrace, FlowTrace, GanttTrace, GridTrace, RouteTrace, ScenarioManifest, Trace } from "./types";

const BASE = import.meta.env.BASE_URL; // "/" on the custom domain

export async function loadManifest(id: string): Promise<ScenarioManifest> {
  const res = await fetch(`${BASE}manifests/${id}.json`);
  if (!res.ok) throw new Error(`manifest ${id}: HTTP ${res.status}`);
  return (await res.json()) as ScenarioManifest;
}

/** Load a queue (event) trace by its repo-relative path (as recorded in a variant entry). */
export async function loadTrace(path: string): Promise<Trace> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`trace ${path}: HTTP ${res.status}`);
  return (await res.json()) as Trace;
}

/** Load a grid (frame) trace for an ABM scenario. */
export async function loadGridTrace(path: string): Promise<GridTrace> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`grid trace ${path}: HTTP ${res.status}`);
  return (await res.json()) as GridTrace;
}

/** Load a chart/series trace (Monte-Carlo, Beer Game). */
export async function loadChartTrace(path: string): Promise<ChartTrace> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`chart trace ${path}: HTTP ${res.status}`);
  return (await res.json()) as ChartTrace;
}

/** Load a multi-stage flow trace (S04 ED). */
export async function loadFlowTrace(path: string): Promise<FlowTrace> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`flow trace ${path}: HTTP ${res.status}`);
  return (await res.json()) as FlowTrace;
}

/** Load a Gantt schedule trace (S06 job-shop). */
export async function loadGanttTrace(path: string): Promise<GanttTrace> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`gantt trace ${path}: HTTP ${res.status}`);
  return (await res.json()) as GanttTrace;
}

/** Load a route/network trace (S07 haul, S08 VRP, S09 ambulance). */
export async function loadRouteTrace(path: string): Promise<RouteTrace> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`route trace ${path}: HTTP ${res.status}`);
  return (await res.json()) as RouteTrace;
}
