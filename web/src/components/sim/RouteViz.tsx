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
  const elevFill = (e: number) => `hsl(${Math.round(210 - e * 182)} 62% ${Math.round(55 - e * 18)}%)`; // blue (low) -> orange (high)

  // normalize elevation to [0,1] over the trace nodes (the ridge peak can exceed 1) before colouring
  const elevNorm = useMemo(() => {
    const es2 = trace.nodes.map((n) => n.elev).filter((e): e is number => typeof e === "number");
    if (!es2.length) return null;
    const mn = Math.min(...es2);
    return { mn, span: Math.max(...es2) - mn || 1 };
  }, [trace.nodes]);

  // a paint-once elevation field behind the roads (a ridge + passes are invisible from dots alone)
  const field = useMemo(() => {
    if (!hasElev || !elevNorm || typeof document === "undefined") return null;
    const { minx, miny, maxx, maxy } = trace.bounds;
    const cols = Math.round(maxx - minx) + 1;
    const rows = Math.round(maxy - miny) + 1;
    if (cols < 2 || rows < 2) return null;
    const cv = document.createElement("canvas");
    cv.width = cols;
    cv.height = rows;
    const ctx = cv.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "hsl(0 0% 45%)"; // neutral for any removed (blocked) cell
    ctx.fillRect(0, 0, cols, rows);
    for (const n of trace.nodes) {
      if (typeof n.elev !== "number") continue;
      ctx.fillStyle = elevFill((n.elev - elevNorm.mn) / elevNorm.span);
      ctx.fillRect(Math.round(n.x - minx), Math.round(maxy - n.y), 1, 1); // invert y: high world-y at top
    }
    return { url: cv.toDataURL(), x: px(minx), y: py(maxy), w: px(maxx) - px(minx), h: py(miny) - py(maxy) };
  }, [hasElev, elevNorm, trace.nodes, trace.bounds, px, py]);

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
      {/* elevation field (terrain) behind everything — ridge reads warm, passes cool */}
      {field && (
        <image href={field.url} x={field.x} y={field.y} width={field.w} height={field.h}
          preserveAspectRatio="none" opacity={0.55} />
      )}

      {/* impassable cells (haul wall) */}
      {(trace.barriers ?? []).map((b, i) => (
        <g key={`bar${i}`}>
          <rect x={px(b.x) - 8} y={py(b.y) - 8} width={16} height={16} rx={3} fill="var(--color-bad)" opacity={0.22} />
          <line x1={px(b.x) - 6} y1={py(b.y) - 6} x2={px(b.x) + 6} y2={py(b.y) + 6} stroke="var(--color-bad)" strokeWidth={2.2} />
          <line x1={px(b.x) - 6} y1={py(b.y) + 6} x2={px(b.x) + 6} y2={py(b.y) - 6} stroke="var(--color-bad)" strokeWidth={2.2} />
        </g>
      ))}

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
        // junctions are faint dots over the elevation field (the field carries the terrain colour now)
        const fill = isSpecial ? c : "var(--color-fg-faint)";
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
