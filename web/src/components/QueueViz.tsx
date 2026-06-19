import { useI18n } from "../i18n";
import type { QueueState } from "../lib/replay";

const MAX_DOTS = 14;

export function QueueViz({ state, c }: { state: QueueState; c: number }) {
  const { t } = useI18n();
  const W = 820;
  const H = 240;
  const servers = Math.max(1, Math.min(c, 10));
  const boxH = Math.min(30, (H - 60) / servers);
  const gap = 6;
  const stackH = servers * boxH + (servers - 1) * gap;
  const top = (H - stackH) / 2;
  const serverX = 470;
  const boxW = 64;

  const occupied = state.inService.length;
  const waiting = state.waiting;
  const shown = waiting.slice(-MAX_DOTS);
  const overflow = waiting.length - shown.length;

  return (
    <svg className="queueviz" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="queue">
      {/* Arrivals source */}
      <g>
        <circle cx="48" cy={H / 2} r="22" className="qv-source" />
        <text x="48" y={H / 2 + 5} textAnchor="middle" className="qv-glyph">
          →
        </text>
        <text x="48" y={H / 2 + 46} textAnchor="middle" className="qv-label">
          {t("viz.source")}
        </text>
        <text x="48" y={H / 2 - 36} textAnchor="middle" className="qv-count">
          {state.arrived}
        </text>
      </g>

      {/* Queue lane */}
      <rect x="110" y={H / 2 - 24} width="300" height="48" rx="24" className="qv-lane" />
      <text x="260" y={H / 2 + 46} textAnchor="middle" className="qv-label">
        {t("viz.queue")} ({waiting.length})
      </text>
      {shown.map((cust, i) => {
        const cx = 392 - i * 26;
        return <circle key={cust.id} cx={cx} cy={H / 2} r="9" className="qv-dot" />;
      })}
      {overflow > 0 && (
        <text x="120" y={H / 2 + 5} className="qv-overflow">
          +{overflow}
        </text>
      )}

      {/* Servers */}
      <text x={serverX + boxW / 2} y={top - 10} textAnchor="middle" className="qv-label">
        {t("viz.servers")}
      </text>
      {Array.from({ length: servers }).map((_, i) => {
        const y = top + i * (boxH + gap);
        const busy = i < occupied;
        return (
          <g key={i}>
            <rect
              x={serverX}
              y={y}
              width={boxW}
              height={boxH}
              rx="6"
              className={"qv-server" + (busy ? " busy" : "")}
            />
            {busy && <circle cx={serverX + boxW / 2} cy={y + boxH / 2} r={Math.min(9, boxH / 2 - 3)} className="qv-token" />}
          </g>
        );
      })}
      {c > 10 && (
        <text x={serverX + boxW / 2} y={top + stackH + 16} textAnchor="middle" className="qv-overflow">
          c={c}
        </text>
      )}

      {/* Sink */}
      <g>
        <line x1={serverX + boxW} y1={H / 2} x2="720" y2={H / 2} className="qv-flow" />
        <circle cx="752" cy={H / 2} r="22" className="qv-sink" />
        <text x="752" y={H / 2 + 5} textAnchor="middle" className="qv-count">
          {state.served}
        </text>
        <text x="752" y={H / 2 + 46} textAnchor="middle" className="qv-label">
          {t("viz.served")}
        </text>
      </g>
    </svg>
  );
}
