// Theme-aware inline SVG teaching figures (read the CSS palette via the .dg-* classes in globals.css,
// so they follow light/dark). Each is an informative schematic, not decoration. Specs from
// wip/caos-simlab/content/diagrams-and-layout + theory-*.

import type { ReactNode } from "react";

function Fig({ children, cap, wide }: { children: ReactNode; cap?: ReactNode; wide?: boolean }) {
  return (
    <figure className="figure">
      <svg className={"fig-svg" + (wide ? " wide" : "")} viewBox="0 0 480 250" role="img" preserveAspectRatio="xMidYMid meet">
        {children}
      </svg>
      {cap && <figcaption className="fig-cap">{cap}</figcaption>}
    </figure>
  );
}

function Arrow({ x1, y1, x2, y2, cls = "dg-edge" }: { x1: number; y1: number; x2: number; y2: number; cls?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 6;
  const p1 = `${x2},${y2}`;
  const p2 = `${x2 - h * Math.cos(a - 0.4)},${y2 - h * Math.sin(a - 0.4)}`;
  const p3 = `${x2 - h * Math.cos(a + 0.4)},${y2 - h * Math.sin(a + 0.4)}`;
  return (
    <g>
      <line className={cls} x1={x1} y1={y1} x2={x2} y2={y2} />
      <polygon className="dg-arrowhead" points={`${p1} ${p2} ${p3}`} />
    </g>
  );
}

/** M/M/c station: Poisson source λ → FIFO queue → c parallel servers (μ each) → departures. */
export function MMcSchematic({ cap }: { cap?: ReactNode }) {
  const cy = 120;
  return (
    <Fig wide cap={cap}>
      <circle className="dg-node" cx="40" cy={cy} r="22" />
      <text className="dg-node-label" x="40" y={cy + 5} textAnchor="middle">λ</text>
      <text className="dg-edge-label" x="40" y={cy + 42} textAnchor="middle">Poisson</text>
      <Arrow x1={64} y1={cy} x2={120} y2={cy} />
      {/* queue cells */}
      <g>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} className="dg-box" x={130 + i * 22} y={cy - 14} width="20" height="28" rx="3" />
        ))}
        <text className="dg-edge-label" x="172" y={cy + 42} textAnchor="middle">FIFO queue</text>
      </g>
      <Arrow x1={224} y1={cy} x2={272} y2={cy} />
      {/* c servers */}
      {[0, 1, 2].map((i) => {
        const y = 70 + i * 50;
        return (
          <g key={i}>
            <circle className="dg-node" cx="300" cy={y} r="18" />
            <text className="dg-node-label" x="300" y={y + 4} textAnchor="middle">μ</text>
            <line className="dg-edge" x1="272" y1={cy} x2="282" y2={y} />
          </g>
        );
      })}
      <text className="dg-edge-label" x="300" y="44" textAnchor="middle">c servers</text>
      {[0, 1, 2].map((i) => <Arrow key={i} x1={318} y1={70 + i * 50} x2={372} y2={cy} />)}
      <circle className="dg-node" cx="400" cy={cy} r="18" style={{ stroke: "var(--color-good)" }} />
      <text className="dg-edge-label" x="400" y={cy + 38} textAnchor="middle">depart</text>
      <text className="dg-note" x="240" y="232" textAnchor="middle">stable iff ρ = λ / (c·μ) &lt; 1</text>
    </Fig>
  );
}

/** Birth–death CTMC for M/M/c: birth rate λ, death rate min(n,c)·μ; saturates at cμ for n ≥ c. */
export function BirthDeathChain({ cap }: { cap?: ReactNode }) {
  const states = ["0", "1", "2", "c", "c+1"];
  const deaths = ["μ", "2μ", "3μ", "cμ", "cμ"];
  const y = 110;
  const x0 = 44;
  const dx = 96;
  return (
    <Fig wide cap={cap}>
      {states.map((s, i) => {
        const x = x0 + i * dx;
        return (
          <g key={i}>
            {i < states.length - 1 && (
              <>
                {/* birth arc (top) */}
                <path className="dg-edge" d={`M ${x + 20} ${y - 8} Q ${x + dx / 2} ${y - 42} ${x + dx - 20} ${y - 8}`} fill="none" />
                <polygon className="dg-arrowhead" points={`${x + dx - 20},${y - 8} ${x + dx - 28},${y - 16} ${x + dx - 30},${y - 4}`} />
                <text className="dg-edge-label" x={x + dx / 2} y={y - 36} textAnchor="middle">λ</text>
                {/* death arc (bottom) */}
                <path className="dg-edge" d={`M ${x + dx - 20} ${y + 8} Q ${x + dx / 2} ${y + 42} ${x + 20} ${y + 8}`} fill="none" />
                <polygon className="dg-arrowhead" points={`${x + 20},${y + 8} ${x + 28},${y + 16} ${x + 30},${y + 4}`} />
                <text className="dg-edge-label" x={x + dx / 2} y={y + 40} textAnchor="middle">{deaths[i + 1]}</text>
              </>
            )}
            <circle className="dg-node" cx={x} cy={y} r="18" style={i === 3 ? { stroke: "var(--color-warn)" } : undefined} />
            <text className="dg-node-label" x={x} y={y + 5} textAnchor="middle">{s}</text>
          </g>
        );
      })}
      <text className="dg-note" x="240" y="210" textAnchor="middle">death rate rises with n, then saturates at c·μ for n ≥ c</text>
    </Fig>
  );
}

/** W_q vs ρ "hockey-stick" diverging at ρ → 1 (Kingman heavy-traffic behaviour). */
export function ErlangCKnee({ cap }: { cap?: ReactNode }) {
  const x0 = 50, y0 = 30, w = 380, h = 160;
  const yb = y0 + h, xr = x0 + w;
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const rho = (i / 100);
    const wq = rho / (1 - rho); // representative divergence ∝ ρ/(1−ρ)
    const px = x0 + rho * w;
    const py = yb - Math.min(h, (wq / 12) * h);
    pts.push(`${px},${py}`);
  }
  return (
    <Fig cap={cap}>
      <line className="dg-axis" x1={x0} y1={y0} x2={x0} y2={yb} />
      <line className="dg-axis" x1={x0} y1={yb} x2={xr} y2={yb} />
      <text className="dg-axis-label" x={x0 - 6} y={y0 + 6} textAnchor="end">Wq</text>
      <text className="dg-axis-label" x={xr} y={yb + 18} textAnchor="end">ρ</text>
      <text className="dg-tick" x={x0 + w} y={yb + 16} textAnchor="middle">1</text>
      {/* asymptote at ρ=1 */}
      <line className="dg-asymptote" x1={x0 + w} y1={y0} x2={x0 + w} y2={yb} />
      <text className="dg-marker-label" x={x0 + w - 4} y={y0 + 2} textAnchor="end">ρ → 1</text>
      <polyline className="dg-curve" points={pts.join(" ")} fill="none" />
      <text className="dg-note" x={x0 + 120} y={y0 + 30}>waiting explodes near saturation</text>
    </Fig>
  );
}

/** Pooling: theoretical Wq at fixed ρ=0.8 for c = 1, 2, 5, 10 (economies of scale). */
export function PoolingBars({ cap }: { cap?: ReactNode }) {
  const data = [
    { c: "c=1 (M/M/1)", wq: 4.0 },
    { c: "c=2", wq: 0.889 },
    { c: "c=5", wq: 0.277 },
    { c: "c=10", wq: 0.102 },
  ];
  const x0 = 70, yb = 200, bw = 56, gap = 36, max = 4.0, hMax = 160;
  return (
    <Fig wide cap={cap}>
      <line className="dg-axis" x1={x0} y1="30" x2={x0} y2={yb} />
      <line className="dg-axis" x1={x0} y1={yb} x2="450" y2={yb} />
      <text className="dg-axis-label" x={x0 - 6} y="34" textAnchor="end">Wq</text>
      {data.map((d, i) => {
        const x = x0 + 20 + i * (bw + gap);
        const bh = Math.max(3, (d.wq / max) * hMax);
        return (
          <g key={i}>
            <rect className="dg-bar" x={x} y={yb - bh} width={bw} height={bh} rx="3" />
            <text className="dg-bar-label" x={x + bw / 2} y={yb - bh - 6} textAnchor="middle">{d.wq.toFixed(2)}</text>
            <text className="dg-bar-label" x={x + bw / 2} y={yb + 16} textAnchor="middle">{d.c}</text>
          </g>
        );
      })}
      <text className="dg-note" x="250" y="232" textAnchor="middle">same ρ = 0.8 — more servers ⇒ far shorter wait</text>
    </Fig>
  );
}

/** DES next-event clock: N(t) right-continuous step function jumping event to event. */
export function EventLoopTimeline({ cap }: { cap?: ReactNode }) {
  const x0 = 40, yb = 190, xr = 450, top = 40;
  // event times + N(t) levels
  const evs = [
    { t: 0.5, n: 1 }, { t: 1.3, n: 2 }, { t: 2.1, n: 1 }, { t: 2.8, n: 2 },
    { t: 3.6, n: 3 }, { t: 4.4, n: 2 }, { t: 5.2, n: 1 }, { t: 6.2, n: 0 },
  ];
  const tMax = 7, nMax = 3;
  const sx = (t: number) => x0 + (t / tMax) * (xr - x0);
  const sy = (n: number) => yb - (n / nMax) * (yb - top);
  let prevN = 0, prevX = x0;
  const segs: ReactNode[] = [];
  evs.forEach((e, i) => {
    const x = sx(e.t);
    segs.push(<line key={"h" + i} className="dg-curve" x1={prevX} y1={sy(prevN)} x2={x} y2={sy(prevN)} />);
    segs.push(<line key={"v" + i} className="dg-curve" x1={x} y1={sy(prevN)} x2={x} y2={sy(e.n)} />);
    segs.push(<line key={"t" + i} className="dg-marker" x1={x} y1={yb} x2={x} y2={yb + 6} />);
    prevN = e.n; prevX = x;
  });
  segs.push(<line key="end" className="dg-curve" x1={prevX} y1={sy(prevN)} x2={xr} y2={sy(prevN)} />);
  return (
    <Fig wide cap={cap}>
      <line className="dg-axis" x1={x0} y1={top} x2={x0} y2={yb} />
      <line className="dg-axis" x1={x0} y1={yb} x2={xr} y2={yb} />
      <text className="dg-axis-label" x={x0 - 6} y={top + 4} textAnchor="end">N(t)</text>
      <text className="dg-axis-label" x={xr} y={yb + 18} textAnchor="end">t (events)</text>
      {segs}
      <text className="dg-note" x="245" y="226" textAnchor="middle">time jumps event-to-event; state is piecewise-constant</text>
    </Fig>
  );
}

/** Replications → sampling distribution of the mean + confidence interval around the true value. */
export function ReplicationsCI({ cap }: { cap?: ReactNode }) {
  const x0 = 40, xr = 450, axisY = 175;
  const runs = [0.40, 0.52, 0.44, 0.47, 0.39, 0.49, 0.43, 0.46, 0.41, 0.48];
  const lo = 0.3, hi = 0.6;
  const sx = (v: number) => x0 + ((v - lo) / (hi - lo)) * (xr - x0);
  const truth = 0.4444, mean = 0.449, ci = 0.02;
  // bell curve
  const bell: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const v = lo + (i / 60) * (hi - lo);
    const z = (v - mean) / 0.035;
    const y = 120 - 80 * Math.exp(-0.5 * z * z);
    bell.push(`${sx(v)},${y}`);
  }
  return (
    <Fig wide cap={cap}>
      {/* CI band */}
      <rect className="dg-fill-accent" x={sx(mean - ci)} y="40" width={sx(mean + ci) - sx(mean - ci)} height="135" rx="2" opacity="0.5" />
      <polyline className="dg-curve" points={bell.join(" ")} fill="none" />
      {/* run-mean dots */}
      {runs.map((v, i) => <circle key={i} className="dg-bar-2" cx={sx(v)} cy={150} r="4" />)}
      <line className="dg-axis" x1={x0} y1={axisY} x2={xr} y2={axisY} />
      {/* truth line */}
      <line className="dg-asymptote" x1={sx(truth)} y1="40" x2={sx(truth)} y2={axisY} />
      <text className="dg-marker-label" x={sx(truth)} y="34" textAnchor="middle" style={{ fill: "var(--color-good)" }}>theory</text>
      <text className="dg-axis-label" x={xr} y={axisY + 18} textAnchor="end">mean wait Wq</text>
      <text className="dg-note" x="245" y="210" textAnchor="middle">each run = one sample; the mean ± CI brackets the true value</text>
    </Fig>
  );
}

/** SIR compartmental flow: S → I → R with infection rate βSI/N and recovery rate γ. */
export function SIRFlow({ cap }: { cap?: ReactNode }) {
  const y = 110, bw = 90, bh = 56;
  const boxes = [
    { x: 40, t: "S", s: "Susceptible", cls: "dg-box accent" },
    { x: 195, t: "I", s: "Infected", cls: "dg-box", style: { stroke: "var(--color-bad)" } as const },
    { x: 350, t: "R", s: "Recovered", cls: "dg-box good" },
  ];
  return (
    <Fig wide cap={cap}>
      {boxes.map((b, i) => (
        <g key={i}>
          <rect className={b.cls} x={b.x} y={y} width={bw} height={bh} rx="8" style={(b as { style?: object }).style} />
          <text className="dg-box-title" x={b.x + bw / 2} y={y + 26} textAnchor="middle">{b.t}</text>
          <text className="dg-box-sub" x={b.x + bw / 2} y={y + 44} textAnchor="middle">{b.s}</text>
        </g>
      ))}
      <Arrow x1={130} y1={y + bh / 2} x2={195} y2={y + bh / 2} />
      <text className="dg-edge-label" x="162" y={y - 6} textAnchor="middle">β·S·I/N</text>
      <Arrow x1={285} y1={y + bh / 2} x2={350} y2={y + bh / 2} />
      <text className="dg-edge-label" x="317" y={y - 6} textAnchor="middle">γ</text>
      <text className="dg-note" x="240" y="210" textAnchor="middle">R₀ = β/γ · epidemic if R₀ &gt; 1 · herd immunity at 1 − 1/R₀</text>
    </Fig>
  );
}

/** Emergence: local rule on a Moore neighbourhood → emergent global pattern. */
export function EmergenceGrid({ cap }: { cap?: ReactNode }) {
  const n = 8, cell = 18, gx = 30, gy = 40, gx2 = 300;
  // a clustered (segregated) pattern for the right grid
  const seg = (i: number, j: number) => ((i < n / 2) !== (j < n / 2) ? "i" : "s");
  return (
    <Fig wide cap={cap}>
      {/* left: local rule (a focal cell + Moore neighbours) */}
      <text className="dg-edge-label" x={gx + n * cell / 2} y={gy - 10} textAnchor="middle">local rule</text>
      {Array.from({ length: 3 }).map((_, i) =>
        Array.from({ length: 3 }).map((__, j) => {
          const focal = i === 1 && j === 1;
          return <rect key={`l${i}${j}`} className={"dg-cell " + (focal ? "i" : "s")} x={gx + 40 + j * cell} y={gy + 30 + i * cell} width={cell - 2} height={cell - 2} />;
        }),
      )}
      <text className="dg-note" x={gx + 60} y={gy + 110} textAnchor="middle">move if unhappy</text>
      <Arrow x1={210} y1={120} x2={285} y2={120} />
      <text className="dg-edge-label" x="247" y="110" textAnchor="middle">iterate</text>
      {/* right: emergent pattern */}
      <text className="dg-edge-label" x={gx2 + n * cell / 2} y={gy - 10} textAnchor="middle">emergent pattern</text>
      {Array.from({ length: n }).map((_, i) =>
        Array.from({ length: n }).map((__, j) => (
          <rect key={`r${i}${j}`} className={"dg-cell " + seg(i, j)} x={gx2 + j * cell} y={gy + i * cell} width={cell - 2} height={cell - 2} />
        )),
      )}
      <text className="dg-note" x="240" y="232" textAnchor="middle">simple local rules → global structure no agent intended</text>
    </Fig>
  );
}
