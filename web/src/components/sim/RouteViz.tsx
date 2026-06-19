import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { RouteState } from "@/lib/routeReplay";
import { nodeIndex } from "@/lib/routeReplay";
import type { RouteTrace } from "@/lib/types";

const W = 760;
const H = 480;
const PAD = 30;

/** Synthetic road network with animated agents (trucks / vehicles / ambulances) replayed along their
 *  timed legs, planned-route polylines, and pulsing incident markers. Elevation (S07) shades junctions. */
export function RouteViz({ trace, state, time }: { trace: RouteTrace; state: RouteState; time: number }) {
  const { i18n } = useTranslation();
  const es = (i18n.resolvedLanguage ?? "en").startsWith("es");
  const coord = useMemo(() => nodeIndex(trace), [trace]);

  const { px, py } = useMemo(() => {
    const { minx, miny, maxx, maxy } = trace.bounds;
    const s = Math.min((W - 2 * PAD) / Math.max(1e-9, maxx - minx), (H - 2 * PAD) / Math.max(1e-9, maxy - miny));
    const ox = (W - (maxx - minx) * s) / 2;
    const oy = (H - (maxy - miny) * s) / 2;
    return {
      px: (x: number) => ox + (x - minx) * s,
      py: (y: number) => H - (oy + (y - miny) * s), // invert: higher world-y is higher on screen
    };
  }, [trace.bounds]);

  const colorForKind = useMemo(() => {
    const m: Record<string, string> = {};
    for (const l of trace.legend) m[l.code] = l.color;
    return m;
  }, [trace.legend]);

  const hasElev = trace.nodes.some((n) => typeof n.elev === "number");
  const elevFill = (e: number) => `hsl(${Math.round(210 - e * 182)} 62% ${55 - e * 8}%)`; // blue (low) → orange (high)
  const pulse = 1 + 0.35 * Math.abs(Math.sin(time * 2.4));

  return (
    <svg className="routeviz" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={trace.title}>
      {/* roads */}
      {trace.edges.map(([a, b], i) => {
        const ca = coord.get(a)!;
        const cb = coord.get(b)!;
        return <line key={i} className="rv-road" x1={px(ca.x)} y1={py(ca.y)} x2={px(cb.x)} y2={py(cb.y)} />;
      })}

      {/* planned routes (VRP per-vehicle / haul route) */}
      {trace.routes.map((r, i) => {
        const pts = r.path.map((id) => `${px(coord.get(id)!.x)},${py(coord.get(id)!.y)}`).join(" ");
        return <polyline key={i} className="rv-route" points={pts} style={{ stroke: r.color }} />;
      })}

      {/* nodes */}
      {trace.nodes.map((n) => {
        const isSpecial = n.kind !== "junction";
        const c = colorForKind[n.kind];
        const fill = isSpecial ? c : hasElev && typeof n.elev === "number" ? elevFill(n.elev) : "var(--color-fg-faint)";
        return (
          <g key={n.id}>
            <circle cx={px(n.x)} cy={py(n.y)} r={isSpecial ? 7 : hasElev ? 4.5 : 2.6}
              fill={fill} className={isSpecial ? "rv-node-special" : "rv-node"} />
            {isSpecial && (
              <text x={px(n.x)} y={py(n.y) - 11} textAnchor="middle" className="rv-node-label">
                {n.label ?? (es ? legendEs(trace, n.kind) : legendEn(trace, n.kind))}
              </text>
            )}
          </g>
        );
      })}

      {/* active incident markers (S09) — pulsing rings */}
      {state.markers.map((m, i) => (
        <g key={i}>
          <circle cx={px(m.x)} cy={py(m.y)} r={9 * pulse} className="rv-incident-ring" />
          <circle cx={px(m.x)} cy={py(m.y)} r={5} className="rv-incident" />
        </g>
      ))}

      {/* agents (trucks / vehicles / ambulances) */}
      {state.agents.map((a) => (
        <g key={a.id}>
          {a.moving && a.px !== undefined && (
            <line x1={px(a.px)} y1={py(a.py!)} x2={px(a.x)} y2={py(a.y)} className="rv-trail" style={{ stroke: a.color }} />
          )}
          <circle cx={px(a.x)} cy={py(a.y)} r={a.moving ? 9 : 7} className="rv-agent-glow" style={{ fill: a.color }} />
          <circle cx={px(a.x)} cy={py(a.y)} r={5} style={{ fill: a.color }} className="rv-agent" />
        </g>
      ))}

      {/* live overlay */}
      <text x={14} y={26} className="rv-hud">{(es ? "t = " : "t = ") + time.toFixed(1)}</text>
      <text x={14} y={44} className="rv-hud-sub">
        {(es ? "en ruta: " : "moving: ") + state.movingCount}
        {trace.markers.length > 0 ? (es ? `  ·  pendientes: ${state.pendingCount}` : `  ·  pending: ${state.pendingCount}`) : ""}
      </text>
    </svg>
  );
}

function legendEn(trace: RouteTrace, code: string): string {
  return trace.legend.find((l) => l.code === code)?.label_en ?? code;
}
function legendEs(trace: RouteTrace, code: string): string {
  return trace.legend.find((l) => l.code === code)?.label_es ?? code;
}
