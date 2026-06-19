// Mirrors the simlab trace + manifest schemas (simlab/core/trace.py, manifest.py).

export interface SimEvent {
  t: number;
  kind: string; // "arrival" | "start" | "depart" for S01
  id?: number;
  [k: string]: unknown;
}

export interface Trace {
  schema: string;
  scenario: string;
  title: string;
  method: string;
  seed: number;
  params: Record<string, number>;
  kpis: Record<string, number>;
  analytic: Record<string, number>;
  timeline: { t_end: number; events: SimEvent[] };
}

export interface Manifest {
  schema: string;
  id: string;
  title: string;
  method: string;
  tier: number;
  engine: string;
  seed: number;
  params: Record<string, number>;
  lane: "live" | "precomputed";
  gate: {
    pure_python: boolean;
    run_ms: number;
    trace_bytes: number;
    reasons: string[];
    thresholds: { max_run_ms: number; max_trace_bytes: number };
  };
  wheel_closure: string[];
  viz: { renderer: string; dimensionality: string };
}
