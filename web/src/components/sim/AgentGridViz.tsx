import { useEffect, useRef } from "react";
import { useThemeStore } from "@/state/useThemeStore";
import type { GridTrace } from "@/lib/types";

function resolveVar(v: string): string {
  const m = v.match(/var\((--[\w-]+)\)/);
  if (!m) return v;
  const val = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  return val || "#888";
}

/** Renders one frame of an ABM grid on a canvas (fast for ~1600 cells; re-resolves theme colours). */
export function AgentGridViz({ trace, frameIndex }: { trace: GridTrace; frameIndex: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const { w, h } = trace.grid;
    const colors: Record<number, string> = {};
    for (const l of trace.legend) colors[l.code] = resolveVar(l.color);
    const fi = Math.max(0, Math.min(frameIndex, trace.frames.length - 1));
    const cells = trace.frames[fi]?.cells ?? [];
    const target = 380;
    const cell = Math.max(4, Math.floor(target / Math.max(w, h)));
    const cw = cell * w;
    const ch = cell * h;
    const dpr = window.devicePixelRatio || 1;
    cv.width = cw * dpr;
    cv.height = ch * dpr;
    cv.style.width = `${cw}px`;
    cv.style.height = `${ch}px`;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const gap = cell >= 8 ? 1 : 0;
    for (let i = 0; i < cells.length; i++) {
      ctx.fillStyle = colors[cells[i]] ?? "#888";
      ctx.fillRect((i % w) * cell, Math.floor(i / w) * cell, cell - gap, cell - gap);
    }
  }, [trace, frameIndex, theme]);

  return <canvas ref={ref} className="grid-canvas" role="img" aria-label={trace.title} />;
}
