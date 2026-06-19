import { useEffect, useRef } from "react";
import { useThemeStore } from "@/state/useThemeStore";
import type { GridTrace } from "@/lib/types";

function resolveVar(v: string): string {
  const m = v.match(/var\((--[\w-]+)\)/);
  if (!m) return v;
  const val = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  return val || "#888";
}

const HALO_MS = 300; // how long a just-changed cell stays haloed

/** Renders one frame of an ABM grid on a canvas. Cells that just changed state (vs the previous frame) get
 *  a brief fading halo so a relocation (Schelling) or a spreading infection (SIR) reads as "happening now"
 *  — the cellular analogue of the queue viz's event flash. */
export function AgentGridViz({ trace, frameIndex }: { trace: GridTrace; frameIndex: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const { w, h } = trace.grid;
    const colors: Record<number, string> = {};
    for (const l of trace.legend) colors[l.code] = resolveVar(l.color);
    const halo = resolveVar("var(--color-fg)");
    const fi = Math.max(0, Math.min(frameIndex, trace.frames.length - 1));
    const cells = trace.frames[fi]?.cells ?? [];
    const prev = trace.frames[fi - 1]?.cells;
    const changed: number[] = [];
    if (prev) for (let i = 0; i < cells.length; i++) if (cells[i] !== prev[i]) changed.push(i);

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
    const gap = cell >= 8 ? 1 : 0;

    const draw = (alpha: number) => {
      ctx.clearRect(0, 0, cw, ch);
      for (let i = 0; i < cells.length; i++) {
        ctx.fillStyle = colors[cells[i]] ?? "#888";
        ctx.fillRect((i % w) * cell, Math.floor(i / w) * cell, cell - gap, cell - gap);
      }
      if (alpha > 0 && changed.length) {
        ctx.lineWidth = Math.max(1, cell * 0.18);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = halo;
        const inset = ctx.lineWidth / 2 + 0.5;
        for (const i of changed) {
          ctx.strokeRect((i % w) * cell + inset, Math.floor(i / w) * cell + inset, cell - gap - 2 * inset, cell - gap - 2 * inset);
        }
        ctx.globalAlpha = 1;
      }
    };

    if (!changed.length) {
      draw(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const a = Math.max(0, 1 - (now - start) / HALO_MS);
      draw(a);
      if (a > 0) raf = requestAnimationFrame(tick);
    };
    draw(1);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trace, frameIndex, theme]);

  return <canvas ref={ref} className="grid-canvas" role="img" aria-label={trace.title} />;
}
