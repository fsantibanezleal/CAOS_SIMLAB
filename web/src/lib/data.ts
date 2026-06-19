import type { Manifest, Trace } from "./types";

const BASE = import.meta.env.BASE_URL; // "/" on the custom domain

export async function loadManifest(id: string): Promise<Manifest> {
  const res = await fetch(`${BASE}manifests/${id}.json`);
  if (!res.ok) throw new Error(`manifest ${id}: HTTP ${res.status}`);
  return (await res.json()) as Manifest;
}

export async function loadTrace(id: string, seed: number): Promise<Trace> {
  const res = await fetch(`${BASE}data/artifacts/${id}/trace-seed${seed}.json`);
  if (!res.ok) throw new Error(`trace ${id} seed ${seed}: HTTP ${res.status}`);
  return (await res.json()) as Trace;
}
