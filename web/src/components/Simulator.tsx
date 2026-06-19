import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { loadManifest, loadTrace } from "../lib/data";
import { buildCustomers, stateAt } from "../lib/replay";
import type { Manifest, Trace } from "../lib/types";
import { KpiPanel } from "./KpiPanel";
import { QueueViz } from "./QueueViz";
import { Timeline } from "./Timeline";

const SCENARIO = "s01_queue";
const SEED = 42;

const PARAM_LABELS: Record<string, string> = {
  lam: "params.lam",
  mu: "params.mu",
  c: "params.c",
  n_customers: "params.n",
};

export function Simulator() {
  const { t } = useI18n();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);

  const timeRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    let alive = true;
    Promise.all([loadManifest(SCENARIO), loadTrace(SCENARIO, SEED)])
      .then(([m, tr]) => {
        if (!alive) return;
        setManifest(m);
        setTrace(tr);
        setPlaying(true);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const customers = useMemo(() => (trace ? buildCustomers(trace) : []), [trace]);
  const tEnd = trace?.timeline.t_end ?? 0;

  // Animation loop driven by real-time deltas.
  useEffect(() => {
    if (!playing || !trace) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = timeRef.current + dt * speedRef.current;
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

  const seek = (v: number) => {
    timeRef.current = v;
    setTime(v);
  };
  const restart = () => {
    seek(0);
    setPlaying(true);
  };
  const toggle = () => {
    if (timeRef.current >= tEnd) seek(0);
    setPlaying((p) => !p);
  };

  if (error) return <div className="banner error">⚠ {error}</div>;
  if (!trace || !manifest) return <div className="loading">{t("sim.loading")}</div>;

  const state = stateAt(customers, time);
  const c = Math.round(trace.params.c);

  return (
    <div className="sim">
      <div className="sim-head">
        <h2>{trace.title}</h2>
        <span className={"lane-badge " + manifest.lane}>{t("sim.lane.precomputed")}</span>
      </div>

      <div className="sim-main">
        <div className="sim-stage card">
          <QueueViz state={state} c={c} />
          <Timeline
            t={time}
            tEnd={tEnd}
            playing={playing}
            speed={speed}
            onToggle={toggle}
            onRestart={restart}
            onSeek={seek}
            onSpeed={setSpeed}
          />
          <p className="hint">{t("sim.lane.note")}</p>
        </div>

        <aside className="sim-side">
          <div className="params card">
            <h3>{t("sim.params")}</h3>
            <ul className="param-list">
              {Object.entries(trace.params).map(([key, val]) => (
                <li key={key}>
                  <span>{t(PARAM_LABELS[key] ?? key)}</span>
                  <strong>{Number.isInteger(val) ? val : val.toFixed(2)}</strong>
                </li>
              ))}
              <li>
                <span>seed</span>
                <strong>{trace.seed}</strong>
              </li>
            </ul>
          </div>
          <KpiPanel trace={trace} />
        </aside>
      </div>
    </div>
  );
}
