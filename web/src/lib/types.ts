// Mirrors the simlab trace + manifest v2 schemas (simlab/core/*.py, simlab/pipeline.py).

export interface SimEvent {
  t: number;
  kind: string; // "arrival" | "start" | "depart"
  id?: number;
}

export interface Analytic {
  rho: number;
  p_wait: number | null;
  Wq: number | null;
  Lq: number | null;
  stable: boolean;
}

export interface Trace {
  schema: string;
  scenario: string;
  title: string;
  method: string;
  seed: number;
  params: Record<string, number>;
  kpis: Record<string, number>;
  analytic: Analytic;
  timeline: { t_end: number; events: SimEvent[] };
}

export interface GateInfo {
  pure_python: boolean;
  run_ms: number;
  trace_bytes: number;
  reasons: string[];
}

export interface VariantEntry {
  id: string;
  label_en: string;
  label_es: string;
  note_en: string;
  note_es: string;
  params: Record<string, number>;
  lane: "live" | "precomputed";
  gate: GateInfo;
  kpis: Record<string, number>;
  analytic: Analytic;
  trace: string; // repo-relative path, forward slashes
}

export interface ScenarioManifest {
  schema: string;
  id: string;
  title: string;
  method: string;
  tier: number;
  engine: string;
  seed: number;
  viz: { renderer: string; dimensionality: string };
  wheel_closure: string[];
  lane: "live" | "precomputed";
  variants: VariantEntry[];
}
