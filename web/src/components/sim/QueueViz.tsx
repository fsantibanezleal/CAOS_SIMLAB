import { useTranslation } from "react-i18next";
import type { QueueState } from "@/lib/replay";

const MAX_DOTS = 16;

/** SVG of an M/M/c queue at one instant: arrivals → waiting lane → c servers → served sink. */
export function QueueViz({ state, c }: { state: QueueState; c: number }) {
  const { t } = useTranslation();
  const W = 820;
  const H = 250;
  const servers = Math.max(1, Math.min(c, 10));
  const boxH = Math.min(28, (H - 70) / servers);
  const gap = 6;
  const stackH = servers * boxH + (servers - 1) * gap;
  const top = (H - stackH) / 2;
  const serverX = 480;
  const boxW = 66;

  const occupied = state.inService.length;
  const shown = state.waiting.slice(-MAX_DOTS);
  const overflow = state.waiting.length - shown.length;

  return (
    <svg className="queueviz" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="M/M/c queue">
      {/* Arrivals source */}
      <circle cx="50" cy={H / 2} r="22" className="qv-source" />
      <text x="50" y={H / 2 + 6} textAnchor="middle" className="qv-glyph">→</text>
      <text x="50" y={H / 2 + 48} textAnchor="middle" className="qv-label">{t("viz.source", "Arrivals")}</text>
      <text x="50" y={H / 2 - 36} textAnchor="middle" className="qv-count">{state.arrived}</text>

      {/* Queue lane */}
      <rect x="112" y={H / 2 - 24} width="316" height="48" rx="24" className="qv-lane" />
      <text x="270" y={H / 2 + 48} textAnchor="middle" className="qv-label">
        {t("viz.queue", "Queue")} ({state.waiting.length})
      </text>
      {shown.map((cust, i) => (
        <circle key={cust.id} cx={410 - i * 26} cy={H / 2} r="9" className="qv-dot" />
      ))}
      {overflow > 0 && <text x="122" y={H / 2 + 5} className="qv-overflow">+{overflow}</text>}

      {/* Servers */}
      <text x={serverX + boxW / 2} y={top - 12} textAnchor="middle" className="qv-label">
        {t("viz.servers", "Servers")} ({occupied}/{servers})
      </text>
      {Array.from({ length: servers }).map((_, i) => {
        const y = top + i * (boxH + gap);
        const busy = i < occupied;
        return (
          <g key={i}>
            <rect x={serverX} y={y} width={boxW} height={boxH} rx="6" className={"qv-server" + (busy ? " busy" : "")} />
            {busy && <circle cx={serverX + boxW / 2} cy={y + boxH / 2} r={Math.min(8, boxH / 2 - 3)} className="qv-token" />}
          </g>
        );
      })}

      {/* Sink */}
      <line x1={serverX + boxW} y1={H / 2} x2="730" y2={H / 2} className="qv-flow" />
      <circle cx="762" cy={H / 2} r="22" className="qv-sink" />
      <text x="762" y={H / 2 + 6} textAnchor="middle" className="qv-count">{state.served}</text>
      <text x="762" y={H / 2 + 48} textAnchor="middle" className="qv-label">{t("viz.served", "Served")}</text>
    </svg>
  );
}
