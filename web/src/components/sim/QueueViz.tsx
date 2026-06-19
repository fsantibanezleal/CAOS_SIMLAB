import { useTranslation } from "react-i18next";
import type { Frame } from "@/lib/replay";

const MAX_DOTS = 16;
const W = 820;
const H = 270;
const SRC_X = 52;
const LANE_X0 = 116;
const LANE_X1 = 432;
const SRV_X = 486;
const BOX_W = 66;
const SINK_X = 770;
const GAP = 6;

const lerp = (a: number, b: number, p: number) => a + (b - a) * Math.max(0, Math.min(1, p));

/** Animated M/M/c queue: arrivals → waiting lane → a SPECIFIC server → sink, with transit dots and
 *  flash rings so you can see who is doing the work and when counts change. */
export function QueueViz({ frame, c }: { frame: Frame; c: number }) {
  const { t } = useTranslation();
  const servers = Math.max(1, Math.min(c, 10));
  const boxH = Math.min(26, (H - 72 - (servers - 1) * GAP) / servers);
  const stackH = servers * boxH + (servers - 1) * GAP;
  const top = (H - stackH) / 2;
  const cy = H / 2;
  const slotY = (i: number) => top + i * (boxH + GAP) + boxH / 2;

  const shownWaiting = frame.waiting.slice(-MAX_DOTS);
  const overflow = frame.waiting.length - shownWaiting.length;

  return (
    <svg className="queueviz" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="M/M/c queue">
      {/* flow guides */}
      <line className="qv-flow" x1={LANE_X1} y1={cy} x2={SRV_X} y2={cy} />
      <line className="qv-flow" x1={SRV_X + BOX_W} y1={cy} x2={SINK_X - 22} y2={cy} />

      {/* ── Arrivals source ── */}
      {frame.sourceFlash > 0 && (
        <circle cx={SRC_X} cy={cy} r={22 + 14 * frame.sourceFlash} fill="none" stroke="var(--color-accent-2)"
                strokeWidth={2} opacity={frame.sourceFlash} />
      )}
      <circle cx={SRC_X} cy={cy} r="22" className="qv-source" opacity={0.85 + 0.15 * frame.sourceFlash} />
      <text x={SRC_X} y={cy + 6} textAnchor="middle" className="qv-glyph">→</text>
      <text x={SRC_X} y={cy + 48} textAnchor="middle" className="qv-label">{t("viz.source", "Arrivals")}</text>
      <text x={SRC_X} y={cy - 34} textAnchor="middle" className="qv-count"
            style={{ fontSize: `${16 + 5 * frame.sourceFlash}px` }}>{frame.arrived}</text>

      {/* ── Queue lane ── */}
      <rect x={LANE_X0} y={cy - 24} width={LANE_X1 - LANE_X0} height="48" rx="24" className="qv-lane" />
      <text x={(LANE_X0 + LANE_X1) / 2} y={cy + 48} textAnchor="middle" className="qv-label">
        {t("viz.queue", "Queue")} ({frame.waiting.length})
      </text>
      {shownWaiting.map((cust, i) => (
        <circle key={cust.id} cx={LANE_X1 - 18 - i * 24} cy={cy} r="9" className="qv-dot" />
      ))}
      {overflow > 0 && <text x={LANE_X0 + 8} y={cy + 5} className="qv-overflow">+{overflow}</text>}

      {/* ── Servers ── */}
      <text x={SRV_X + BOX_W / 2} y={top - 12} textAnchor="middle" className="qv-label">
        {t("viz.servers", "Servers")}
      </text>
      {frame.servers.map((s, i) => {
        const y = top + i * (boxH + GAP);
        const flash = Math.max(s.recv, s.deliver);
        const flashColor = s.deliver >= s.recv ? "var(--color-good)" : "var(--color-accent)";
        const busy = s.customer !== null;
        return (
          <g key={i}>
            {flash > 0 && (
              <rect x={SRV_X - 4 - 5 * flash} y={y - 4 - 5 * flash} width={BOX_W + 8 + 10 * flash}
                    height={boxH + 8 + 10 * flash} rx="8" fill="none" stroke={flashColor}
                    strokeWidth={2} opacity={flash} />
            )}
            <rect x={SRV_X} y={y} width={BOX_W} height={boxH} rx="6"
                  className={"qv-server" + (busy ? " busy" : "")}
                  style={flash > 0 ? { stroke: flashColor } : undefined} />
            <text x={SRV_X - 8} y={y + boxH / 2 + 4} textAnchor="end" className="qv-srv-label">S{i + 1}</text>
            {busy && (
              <circle cx={SRV_X + BOX_W / 2} cy={y + boxH / 2} r={Math.min(7, boxH / 2 - 3) * (1 + 0.25 * s.recv)}
                      className="qv-token" />
            )}
          </g>
        );
      })}

      {/* ── Transit dots (queue → server, server → sink) ── */}
      {frame.transitsIn.slice(0, 40).map((d) => (
        <circle key={"in" + d.id} r="8" className="qv-dot"
                cx={lerp(LANE_X1 - 6, SRV_X, d.p)} cy={lerp(cy, slotY(d.server), d.p)} />
      ))}
      {frame.transitsOut.slice(0, 40).map((d) => (
        <circle key={"out" + d.id} r="8" fill="var(--color-good)"
                cx={lerp(SRV_X + BOX_W, SINK_X, d.p)} cy={lerp(slotY(d.server), cy, d.p)} />
      ))}

      {/* ── Sink ── */}
      {frame.sinkFlash > 0 && (
        <circle cx={SINK_X} cy={cy} r={22 + 14 * frame.sinkFlash} fill="none" stroke="var(--color-good)"
                strokeWidth={2} opacity={frame.sinkFlash} />
      )}
      <circle cx={SINK_X} cy={cy} r="22" className="qv-sink" opacity={0.85 + 0.15 * frame.sinkFlash} />
      <text x={SINK_X} y={cy + 6} textAnchor="middle" className="qv-glyph">✓</text>
      <text x={SINK_X} y={cy + 48} textAnchor="middle" className="qv-label">{t("viz.served", "Served")}</text>
      <text x={SINK_X} y={cy - 34} textAnchor="middle" className="qv-count"
            style={{ fontSize: `${16 + 5 * frame.sinkFlash}px` }}>{frame.served}</text>
    </svg>
  );
}
