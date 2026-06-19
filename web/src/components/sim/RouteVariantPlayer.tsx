import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play, RotateCcw } from "lucide-react";
import { loadRouteTrace } from "@/lib/data";
import { nodeIndex, routeStateAt } from "@/lib/routeReplay";
import { useLang } from "@/lib/useLang";
import type { RouteTrace, VariantEntry } from "@/lib/types";
import { RouteViz } from "./RouteViz";

const KPI_MAP: Record<string, { en: string; es: string }> = {
  // S07 haul
  loads_delivered: { en: "Loads delivered", es: "Cargas entregadas" },
  throughput_per_hr: { en: "Throughput /hr", es: "Rendimiento /hr" },
  mean_cycle_time: { en: "Mean cycle time", es: "Tiempo ciclo medio" },
  loader_wait_per_load: { en: "Loader wait / load", es: "Espera cargador / carga" },
  n_trucks: { en: "Trucks", es: "Camiones" },
  n_loaders: { en: "Loaders", es: "Cargadores" },
  // S08 VRP
  total_distance: { en: "Total distance", es: "Distancia total" },
  vehicles_used: { en: "Vehicles used", es: "Vehículos usados" },
  customers: { en: "Customers", es: "Clientes" },
  max_route_time: { en: "Longest route", es: "Ruta más larga" },
  capacity: { en: "Capacity", es: "Capacidad" },
  // S09 ambulance
  calls: { en: "Calls", es: "Llamados" },
  mean_response: { en: "Mean response", es: "Respuesta media" },
  p90_response: { en: "90th pct response", es: "Respuesta p90" },
  coverage_pct: { en: "Coverage ≤ target %", es: "Cobertura ≤ meta %" },
  load_pct: { en: "Offered load %", es: "Carga ofrecida %" },
  n_ambulances: { en: "Ambulances", es: "Ambulancias" },
};
const PARAM_MAP: Record<string, { en: string; es: string }> = {
  grid: { en: "Grid size", es: "Tamaño grilla" },
  n_trucks: { en: "Trucks", es: "Camiones" },
  n_loaders: { en: "Loaders", es: "Cargadores" },
  grade: { en: "Grade penalty", es: "Penalización pendiente" },
  horizon: { en: "Horizon", es: "Horizonte" },
  n_customers: { en: "Customers", es: "Clientes" },
  n_vehicles: { en: "Vehicles", es: "Vehículos" },
  capacity: { en: "Capacity", es: "Capacidad" },
  inst_seed: { en: "Instance seed", es: "Semilla instancia" },
  n_ambulances: { en: "Ambulances", es: "Ambulancias" },
  n_stations: { en: "Stations", es: "Bases" },
  call_rate: { en: "Calls / hr", es: "Llamados / hr" },
  threshold: { en: "Response target", es: "Meta respuesta" },
};
const SPEEDS = [0.5, 1, 2, 4, 8];

export function RouteVariantPlayer({ variant }: { variant: VariantEntry }) {
  const { t } = useTranslation();
  const es = useLang() === "es";
  const [trace, setTrace] = useState<RouteTrace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timeRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    let alive = true;
    setTrace(null);
    setError(null);
    setTime(0);
    timeRef.current = 0;
    loadRouteTrace(variant.trace)
      .then((tr) => alive && (setTrace(tr), setPlaying(true)))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [variant.trace]);

  const coord = useMemo(() => (trace ? nodeIndex(trace) : null), [trace]);
  const tEnd = trace?.t_end ?? 0;

  useEffect(() => {
    if (!playing || !trace) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = timeRef.current + dt * speedRef.current * (tEnd / 30 || 1);
      if (next >= tEnd) {
        next = tEnd;
        timeRef.current = next;
        setTime(next);
        setPlaying(false);
        return;
      }
      timeRef.current = next;
      setTime(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, trace, tEnd]);

  if (error) return <div className="banner error">⚠ {error}</div>;
  if (!trace || !coord) return <div className="loading">{t("common.loading")}</div>;

  const seek = (v: number) => {
    timeRef.current = v;
    setTime(v);
  };
  const toggle = () => {
    if (timeRef.current >= tEnd) seek(0);
    setPlaying((p) => !p);
  };
  const restart = () => {
    seek(0);
    setPlaying(true);
  };
  const state = routeStateAt(trace, time, coord);

  return (
    <div className="sim-layout">
      <div className="sim-stage">
        <div className="card grid-stage">
          <RouteViz trace={trace} state={state} time={time} />
          <div className="grid-legend">
            {trace.legend.map((l) => (
              <span key={l.code} className="grid-legend-item"><span className="legend-dot" style={{ background: l.color }} /> {es ? l.label_es : l.label_en}</span>
            ))}
          </div>
        </div>
        <div className="card timeline">
          <div className="timeline-row">
            <button className="btn primary" onClick={toggle}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? t("sim.pause") : t("sim.play")}</button>
            <button className="btn" onClick={restart}><RotateCcw size={15} />{t("sim.restart")}</button>
            <span className="timeline-time">{t("sim.time")}: {time.toFixed(1)} / {tEnd.toFixed(1)}</span>
            <span className="spacer" />
            <label className="timeline-time" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              {t("sim.speed")}
              <select className="select" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
              </select>
            </label>
          </div>
          <input className="scrub" type="range" min={0} max={tEnd || 1} step={(tEnd || 1) / 1000} value={time}
                 onChange={(e) => seek(Number(e.target.value))} aria-label={t("sim.time")} />
        </div>
      </div>
      <aside className="sim-side">
        <div className="kpi card">
          <h3>{t("kpi.title")}</h3>
          <div className="kpi-grid">
            {Object.entries(trace.kpis).map(([k, v]) => (
              <div className="kpi-cell" key={k}>
                <div className="kpi-cell-val">{typeof v === "number" && !Number.isInteger(v) ? v.toFixed(2) : v}</div>
                <div className="kpi-cell-lbl">{KPI_MAP[k] ? (es ? KPI_MAP[k].es : KPI_MAP[k].en) : k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="params card">
          <h3>{t("sim.runConfig")}</h3>
          <ul className="param-list">
            {Object.entries(trace.params).map(([k, v]) => (
              <li key={k}><span className="k">{PARAM_MAP[k] ? (es ? PARAM_MAP[k].es : PARAM_MAP[k].en) : k}</span><span className="v">{Number.isInteger(v) ? v : v.toFixed(2)}</span></li>
            ))}
            <li><span className="k">{t("sim.seed")}</span><span className="v">{trace.seed}</span></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
