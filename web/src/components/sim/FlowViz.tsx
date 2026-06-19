import { useTranslation } from "react-i18next";
import type { FlowStage, FlowState, Patient } from "@/lib/flowReplay";
import type { FlowTrace } from "@/lib/types";

const MAXQ = 10;
const cy = 130;
const STAGE_X: Record<FlowStage, number> = { src: 36, triage: 182, treat: 390, disch: 562, sink: 760 };
const lerp = (a: number, b: number, p: number) => a + (b - a) * Math.max(0, Math.min(1, p));

/** Multi-stage ED flow: source → Triage (queue + nurses) → Treatment (queue + bays) → Discharge → out.
 *  Patients coloured by priority (urgent / standard), with the same temporal coloring as the queue viz:
 *  stations flash when they take in / hand off a patient, counts pulse, and dots travel between stages. */
export function FlowViz({ trace, state }: { trace: FlowTrace; state: FlowState }) {
  const { t, i18n } = useTranslation();
  const es = (i18n.resolvedLanguage ?? "en").startsWith("es");
  const colorFor = (prio: number) => trace.legend.find((l) => l.code === prio)?.color ?? "var(--color-fg-faint)";
  const triageC = trace.stations[0]?.c ?? 2;
  const treatC = trace.stations[1]?.c ?? 3;
  const lab = (i: number) => (es ? trace.stations[i]?.label_es : trace.stations[i]?.label_en) ?? "";

  function Station({ x, w, title, c, queue, svc, recv, deliver }: { x: number; w: number; title: string; c: number; queue: Patient[]; svc: Patient[]; recv: number; deliver: number }) {
    const sq = Math.min(c, 8);
    const flash = Math.max(recv, deliver);
    const flashColor = deliver >= recv ? "var(--color-good)" : "var(--color-accent)";
    return (
      <g>
        {flash > 0 && (
          <rect x={x - 4 - 5 * flash} y={52 - 5 * flash} width={w + 8 + 10 * flash} height={158 + 10 * flash}
                rx="10" fill="none" stroke={flashColor} strokeWidth={2} opacity={flash} />
        )}
        <rect x={x} y={56} width={w} height={150} rx="8" className="qv-lane" style={flash > 0 ? { stroke: flashColor } : undefined} />
        <text x={x + w / 2} y={48} textAnchor="middle" className="qv-label" style={{ fontSize: `${13 + 3 * flash}px` }}>{title} · {svc.length}/{c}</text>
        {/* servers (top row) */}
        {Array.from({ length: sq }).map((_, i) => {
          const occ = svc[i];
          const bx = x + 12 + i * 19;
          return (
            <g key={i}>
              <rect x={bx} y={68} width={15} height={15} rx="3" className={"qv-server" + (occ ? " busy" : "")}
                    style={occ && flash > 0 ? { stroke: flashColor } : undefined} />
              {occ && <circle cx={bx + 7.5} cy={75.5} r={4 * (1 + 0.3 * recv)} fill={colorFor(occ.prio)} />}
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
      <line className="qv-flow" x1={612} y1={cy} x2={760 - 22} y2={cy} />

      {/* source */}
      {state.srcFlash > 0 && <circle cx={36} cy={cy} r={22 + 14 * state.srcFlash} fill="none" stroke="var(--color-accent-2)" strokeWidth={2} opacity={state.srcFlash} />}
      <circle cx={36} cy={cy} r="22" className="qv-source" opacity={0.85 + 0.15 * state.srcFlash} />
      <text x={36} y={cy + 6} textAnchor="middle" className="qv-glyph">→</text>
      <text x={36} y={cy + 46} textAnchor="middle" className="qv-label">{es ? "Llegadas" : "Arrivals"}</text>
      <text x={36} y={cy - 34} textAnchor="middle" className="qv-count" style={{ fontSize: `${16 + 5 * state.srcFlash}px` }}>{state.arrived}</text>

      <Station x={92} w={180} title={lab(0)} c={triageC} queue={state.triageWait} svc={state.triageSvc} recv={state.triageRecv} deliver={state.triageDeliver} />
      <Station x={300} w={180} title={lab(1)} c={treatC} queue={state.treatWait} svc={state.treatSvc} recv={state.treatRecv} deliver={state.treatDeliver} />

      {/* discharge */}
      {state.dischFlash > 0 && <rect x={512 - 4 - 5 * state.dischFlash} y={92 - 4 - 5 * state.dischFlash} width={100 + 8 + 10 * state.dischFlash} height={76 + 8 + 10 * state.dischFlash} rx="10" fill="none" stroke="var(--color-good)" strokeWidth={2} opacity={state.dischFlash} />}
      <rect x={512} y={92} width={100} height={76} rx="8" className="qv-lane" />
      <text x={562} y={84} textAnchor="middle" className="qv-label">{lab(2)} ({state.discharge.length})</text>
      {state.discharge.slice(0, 6).map((p, i) => (
        <circle key={p.id} cx={524 + (i % 3) * 22} cy={112 + Math.floor(i / 3) * 22} r="7" fill={colorFor(p.prio)} />
      ))}

      {/* travelling dots between stages (coloured by priority) */}
      {state.transits.slice(0, 60).map((d) => (
        <circle key={`${d.from}-${d.id}`} r="7" fill={colorFor(d.prio)}
                cx={lerp(STAGE_X[d.from], STAGE_X[d.to], d.p)} cy={cy} opacity={0.95} />
      ))}

      {/* sink */}
      {state.sinkFlash > 0 && <circle cx={760} cy={cy} r={22 + 14 * state.sinkFlash} fill="none" stroke="var(--color-good)" strokeWidth={2} opacity={state.sinkFlash} />}
      <circle cx={760} cy={cy} r="22" className="qv-sink" opacity={0.85 + 0.15 * state.sinkFlash} />
      <text x={760} y={cy + 6} textAnchor="middle" className="qv-glyph">✓</text>
      <text x={760} y={cy + 46} textAnchor="middle" className="qv-label">{t("viz.served", "Discharged")}</text>
      <text x={760} y={cy - 34} textAnchor="middle" className="qv-count" style={{ fontSize: `${16 + 5 * state.sinkFlash}px` }}>{state.departed}</text>
    </svg>
  );
}
