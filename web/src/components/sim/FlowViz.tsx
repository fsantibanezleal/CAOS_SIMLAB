import { useTranslation } from "react-i18next";
import type { FlowState, Patient } from "@/lib/flowReplay";
import type { FlowTrace } from "@/lib/types";

const MAXQ = 10;

/** Multi-stage ED flow: source → Triage (queue + nurses) → Treatment (queue + bays) → Discharge → out.
 *  Patients coloured by priority (urgent / standard). */
export function FlowViz({ trace, state }: { trace: FlowTrace; state: FlowState }) {
  const { t, i18n } = useTranslation();
  const es = (i18n.resolvedLanguage ?? "en").startsWith("es");
  const colorFor = (prio: number) => trace.legend.find((l) => l.code === prio)?.color ?? "var(--color-fg-faint)";
  const cy = 130;
  const triageC = trace.stations[0]?.c ?? 2;
  const treatC = trace.stations[1]?.c ?? 3;
  const lab = (i: number) => (es ? trace.stations[i]?.label_es : trace.stations[i]?.label_en) ?? "";

  function Station({ x, w, title, c, queue, svc }: { x: number; w: number; title: string; c: number; queue: Patient[]; svc: Patient[] }) {
    const sq = Math.min(c, 8);
    return (
      <g>
        <rect x={x} y={56} width={w} height={150} rx="8" className="qv-lane" />
        <text x={x + w / 2} y={48} textAnchor="middle" className="qv-label">{title} · {svc.length}/{c}</text>
        {/* servers (top row) */}
        {Array.from({ length: sq }).map((_, i) => {
          const occ = svc[i];
          const bx = x + 12 + i * 19;
          return (
            <g key={i}>
              <rect x={bx} y={68} width={15} height={15} rx="3" className={"qv-server" + (occ ? " busy" : "")} />
              {occ && <circle cx={bx + 7.5} cy={75.5} r="4" fill={colorFor(occ.prio)} />}
            </g>
          );
        })}
        <text x={x + 10} y={104} className="qv-label" fontSize="10">{es ? "cola" : "queue"} ({queue.length})</text>
        {/* queue (wrap dots) */}
        {queue.slice(-MAXQ).map((p, i) => (
          <circle key={p.id} cx={x + 16 + (i % 5) * 20} cy={124 + Math.floor(i / 5) * 20} r="7" fill={colorFor(p.prio)} />
        ))}
        {queue.length > MAXQ && <text x={x + w - 10} y={196} textAnchor="end" className="qv-overflow">+{queue.length - MAXQ}</text>}
      </g>
    );
  }

  return (
    <svg className="queueviz" viewBox="0 0 820 230" role="img" aria-label={trace.title}>
      {/* flow arrows */}
      <line className="qv-flow" x1={64} y1={cy} x2={92} y2={cy} />
      <line className="qv-flow" x1={272} y1={cy} x2={300} y2={cy} />
      <line className="qv-flow" x1={480} y1={cy} x2={512} y2={cy} />
      <line className="qv-flow" x1={612} y1={cy} x2={760} y2={cy} />

      {/* source */}
      <circle cx={36} cy={cy} r="22" className="qv-source" />
      <text x={36} y={cy + 6} textAnchor="middle" className="qv-glyph">→</text>
      <text x={36} y={cy + 46} textAnchor="middle" className="qv-label">{es ? "Llegadas" : "Arrivals"}</text>
      <text x={36} y={cy - 34} textAnchor="middle" className="qv-count">{state.arrived}</text>

      <Station x={92} w={180} title={lab(0)} c={triageC} queue={state.triageWait} svc={state.triageSvc} />
      <Station x={300} w={180} title={lab(1)} c={treatC} queue={state.treatWait} svc={state.treatSvc} />

      {/* discharge */}
      <rect x={512} y={92} width={100} height={76} rx="8" className="qv-lane" />
      <text x={562} y={84} textAnchor="middle" className="qv-label">{lab(2)} ({state.discharge.length})</text>
      {state.discharge.slice(0, 6).map((p, i) => (
        <circle key={p.id} cx={524 + (i % 3) * 22} cy={112 + Math.floor(i / 3) * 22} r="7" fill={colorFor(p.prio)} />
      ))}

      {/* sink */}
      <circle cx={760} cy={cy} r="22" className="qv-sink" />
      <text x={760} y={cy + 6} textAnchor="middle" className="qv-glyph">✓</text>
      <text x={760} y={cy + 46} textAnchor="middle" className="qv-label">{t("viz.served", "Discharged")}</text>
      <text x={760} y={cy - 34} textAnchor="middle" className="qv-count">{state.departed}</text>
    </svg>
  );
}
