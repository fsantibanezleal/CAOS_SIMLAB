import { useI18n } from "../i18n";
import type { Trace } from "../lib/types";

function fmt(x: number | undefined, digits = 3): string {
  if (x === undefined || !Number.isFinite(x)) return "∞";
  return x.toFixed(digits);
}

export function KpiPanel({ trace }: { trace: Trace }) {
  const { t } = useI18n();
  const a = trace.analytic;
  const k = trace.kpis;
  const stable = Boolean(a.stable) && Number.isFinite(a.Wq);
  const wqSim = k.Wq_sim;
  const wqTh = a.Wq;

  // Comparison bar (sim vs theory), scaled to the larger of the two.
  const max = Math.max(wqSim || 0, Number.isFinite(wqTh) ? wqTh : 0, 1e-6);
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;

  return (
    <div className="kpi card">
      <h3>{t("kpi.title")}</h3>
      {!stable && <div className="banner warn">{t("kpi.unstable")}</div>}

      <div className="kpi-bars">
        <div className="kpi-bar-row">
          <span className="kpi-bar-label">{t("kpi.wq.sim")}</span>
          <div className="kpi-bar-track">
            <div className="kpi-bar-fill sim" style={{ width: pct(wqSim || 0) }} />
          </div>
          <span className="kpi-bar-val">{fmt(wqSim)}</span>
        </div>
        <div className="kpi-bar-row">
          <span className="kpi-bar-label">{t("kpi.wq.theory")}</span>
          <div className="kpi-bar-track">
            <div className="kpi-bar-fill theory" style={{ width: pct(Number.isFinite(wqTh) ? wqTh : 0) }} />
          </div>
          <span className="kpi-bar-val">{fmt(wqTh)}</span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-cell">
          <div className="kpi-cell-val">{fmt(a.rho, 3)}</div>
          <div className="kpi-cell-lbl">{t("kpi.rho")}</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell-val">{fmt(a.p_wait, 3)}</div>
          <div className="kpi-cell-lbl">{t("kpi.pwait")}</div>
        </div>
        <div className="kpi-cell">
          <div className="kpi-cell-val">{fmt(k.Lq_little, 3)}</div>
          <div className="kpi-cell-lbl">{t("kpi.little")}</div>
        </div>
      </div>

      <p className="kpi-note">{t("kpi.note")}</p>
    </div>
  );
}
