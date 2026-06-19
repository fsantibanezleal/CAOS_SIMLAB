import type { GanttTrace } from "@/lib/types";

const JOB_COLORS = [
  "var(--color-accent)", "var(--color-magenta)", "var(--color-good)", "var(--color-warn)",
  "var(--color-accent-2)", "var(--color-bad)", "var(--color-fg-faint)", "var(--color-accent)",
];

/** Gantt chart of a job-shop schedule: machines as rows, time on x; each operation a job-coloured bar
 *  that fills as the "now" playhead sweeps right (so the schedule appears to execute). */
export function GanttViz({ trace, now, es }: { trace: GanttTrace; now: number; es: boolean }) {
  const W = 720;
  const ml = 46;
  const mr = 16;
  const rowH = 26;
  const gap = 6;
  const mt = 16;
  const mb = 30;
  const rows = trace.machines.length;
  const H = mt + rows * (rowH + gap) + mb;
  const plotW = W - ml - mr;
  const ms = trace.makespan || 1;
  const sx = (tt: number) => ml + (tt / ms) * plotW;
  const rowY = (m: number) => mt + m * (rowH + gap);

  const ticks = 5;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => (i / ticks) * ms);

  return (
    <svg className="fig-svg wide" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={trace.title} style={{ maxWidth: 720 }}>
      {/* machine rows + labels */}
      {trace.machines.map((mc, i) => (
        <g key={mc.id}>
          <rect x={ml} y={rowY(i)} width={plotW} height={rowH} rx="3" className="qv-lane" />
          <text x={ml - 6} y={rowY(i) + rowH / 2 + 4} textAnchor="end" className="dg-tick">{mc.label}</text>
        </g>
      ))}
      {/* time gridlines + ticks */}
      {tickVals.map((tv, i) => (
        <g key={i}>
          <line className="dg-grid" x1={sx(tv)} y1={mt} x2={sx(tv)} y2={mt + rows * (rowH + gap) - gap} />
          <text className="dg-tick" x={sx(tv)} y={H - 12} textAnchor="middle">{Math.round(tv)}</text>
        </g>
      ))}
      <text className="dg-axis-label" x={W - mr} y={H - 2} textAnchor="end">{es ? "tiempo" : "time"}</text>

      {/* operations: faint planned outline + filled portion up to `now` */}
      {trace.ops.map((op, i) => {
        const x = sx(op.start);
        const wFull = sx(op.start + op.dur) - x;
        const filled = Math.max(0, Math.min(op.start + op.dur, now) - op.start);
        const wFill = (filled / ms) * plotW;
        const y = rowY(op.machine);
        const col = JOB_COLORS[op.job % JOB_COLORS.length];
        return (
          <g key={i}>
            <rect x={x} y={y + 2} width={Math.max(1, wFull)} height={rowH - 4} rx="2" fill="none" stroke={col} strokeWidth={1} opacity={0.4} />
            {wFill > 0 && <rect x={x} y={y + 2} width={Math.max(1, wFill)} height={rowH - 4} rx="2" fill={col} opacity={0.85} />}
            {wFull > 16 && <text x={x + 4} y={y + rowH / 2 + 3} fontSize="9" fill="var(--color-accent-fg)">J{op.job + 1}</text>}
          </g>
        );
      })}

      {/* playhead */}
      <line x1={sx(now)} y1={mt} x2={sx(now)} y2={mt + rows * (rowH + gap) - gap} stroke="var(--color-fg)" strokeWidth={1.5} />
    </svg>
  );
}
