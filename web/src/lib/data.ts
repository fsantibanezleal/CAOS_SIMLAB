import type { ChartTrace, GridTrace, ScenarioManifest, Trace } from "./types";

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
