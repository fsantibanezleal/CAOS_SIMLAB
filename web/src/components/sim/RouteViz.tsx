import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { RouteState } from "@/lib/routeReplay";
import { nodeIndex } from "@/lib/routeReplay";
import type { RouteTrace } from "@/lib/types";

const W = 760;
const H = 480;
const PAD = 30;

/** Synthetic road network with animated agents (trucks / vehicles / ambulances) replayed along their
 *  timed legs, planned-route polylines, pulsing incident markers, and event cues that match the queue viz:
 *  destination nodes flash when an agent arrives (served customers then dim), incidents POP on spawn, and
 *  the HUD counters pulse on change. Elevation (S07) shades junctions. */
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
      py: (y: number) => H - (oy + (y - miny) * s),
    };
  }, [trace.bounds]);

  const colorForKind = useMemo(() => {
    const m: Record<string, string> = {};
    for (const l of trace.legend) m[l.code] = l.color;
    return m;
  }, [trace.legend]);

  const hasElev = trace.nodes.some((n) => typeof n.elev === "number");
  const elevFill = (e: number) => `hsl(${Math.round(210 - e * 182)} 62% ${55 - e * 8}%)`;

  // scenario-appropriate running counter for the HUD (F1)
  const totalCustomers = useMemo(() => trace.nodes.filter((n) => n.kind === "customer").length, [trace.nodes]);
  const servedCustomers = useMemo(
    () => trace.nodes.filter((n) => n.kind === "customer" && state.served.has(n.id)).length,
    [trace.nodes, state.served],
  );
  const progress = (() => {
    if (trace.markers.length > 0)
      return { label: es ? "resueltos" : "resolved", value: `${state.resolved}`, flash: state.resolvedFlash };
    if (totalCustomers > 0)
      return { label: es ? "atendidos" : "served", value: `${servedCustomers}/${totalCustomers}`, flash: state.arrivalFlash };
    const dump = state.arrivalsByKind["dump"] ?? 0;
    return { label: es ? "cargas" : "loads", value: `${dump}`, flash: state.arrivalFlash };
  })();

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
        const flash = state.nodeFlash.get(n.id) ?? 0;
        const servedDim = n.kind === "customer" && state.served.has(n.id);
        const fill = isSpecial ? c : hasElev && typeof n.elev === "number" ? elevFill(n.elev) : "var(--color-fg-faint)";
        return (
          <g key={n.id}>
            {flash > 0 && (
              <circle cx={px(n.x)} cy={py(n.y)} r={9 + 12 * flash} fill="none" stroke={c ?? "var(--color-good)"}
                strokeWidth={2} opacity={flash} />
            )}
            <circle cx={px(n.x)} cy={py(n.y)} r={isSpecial ? 7 : hasElev ? 4.5 : 2.6}
              fill={fill} className={isSpecial ? "rv-node-special" : "rv-node"}
              opacity={servedDim ? 0.4 : undefined} />
            {servedDim && <circle cx={px(n.x)} cy={py(n.y)} r={3} fill="var(--color-bg)" />}
            {isSpecial && (
              <text x={px(n.x)} y={py(n.y) - 11} textAnchor="middle" className="rv-node-label">
                {n.label ?? (es ? legendEs(trace, n.kind) : legendEn(trace, n.kind))}
              </text>
            )}
          </g>
        );
      })}

      {/* active incident markers (S09) — a bright spawn POP that settles to a gentle breathing pulse */}
      {state.markers.map((m, i) => {
        const r = 9 + 11 * m.spawn + 2.2 * Math.abs(Math.sin(time * 2.6));
        return (
          <g key={i}>
            <circle cx={px(m.x)} cy={py(m.y)} r={r} className="rv-incident-ring" opacity={0.55 + 0.4 * m.spawn} />
            <circle cx={px(m.x)} cy={py(m.y)} r={5 + 2 * m.spawn} className="rv-incident" />
          </g>
        );
      })}

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

      {/* live HUD — counters pulse on change (F1) */}
      <text x={14} y={26} className="rv-hud">{"t = " + time.toFixed(1)}</text>
      <text x={14} y={45} className="rv-hud-sub">{(es ? "en ruta: " : "moving: ") + state.movingCount}</text>
      <text x={14} y={66} className="rv-hud-pulse" style={{ fontSize: `${13 + 6 * progress.flash}px` }}>
        {progress.label + ": " + progress.value}
      </text>
      {trace.markers.length > 0 && (
        <text x={14} y={84} className="rv-hud-sub">{(es ? "pendientes: " : "pending: ") + state.pendingCount}</text>
      )}
    </svg>
  );
}

function legendEn(trace: RouteTrace, code: string): string {
  return trace.legend.find((l) => l.code === code)?.label_en ?? code;
}
function legendEs(trace: RouteTrace, code: string): string {
  return trace.legend.find((l) => l.code === code)?.label_es ?? code;
}
