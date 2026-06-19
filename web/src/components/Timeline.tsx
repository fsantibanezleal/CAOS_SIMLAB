import { useI18n } from "../i18n";

export interface TimelineProps {
  t: number;
  tEnd: number;
  playing: boolean;
  speed: number;
  onToggle: () => void;
  onRestart: () => void;
  onSeek: (t: number) => void;
  onSpeed: (s: number) => void;
}

const SPEEDS = [0.5, 1, 2, 4, 8];

export function Timeline(p: TimelineProps) {
  const { t } = useI18n();
  return (
    <div className="timeline card">
      <div className="timeline-row">
        <button className="btn primary" onClick={p.onToggle}>
          {p.playing ? t("sim.pause") : t("sim.play")}
        </button>
        <button className="btn" onClick={p.onRestart}>
          {t("sim.restart")}
        </button>
        <span className="timeline-time">
          {t("sim.time")}: {p.t.toFixed(1)} / {p.tEnd.toFixed(1)}
        </span>
        <span className="spacer" />
        <label className="speed">
          {t("sim.speed")}
          <select value={p.speed} onChange={(e) => p.onSpeed(Number(e.target.value))} className="select">
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <input
        className="scrub"
        type="range"
        min={0}
        max={p.tEnd}
        step={p.tEnd / 1000}
        value={p.t}
        onChange={(e) => p.onSeek(Number(e.target.value))}
      />
    </div>
  );
}
