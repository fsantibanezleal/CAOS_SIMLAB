import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { loadManifest } from "@/lib/data";
import { useLang } from "@/lib/useLang";
import type { ScenarioManifest } from "@/lib/types";
import { VariantComparison } from "./VariantComparison";
import { VariantPlayer } from "./VariantPlayer";

/** One case study: its problem write-up + a ≥10-variant selector + the player + the comparison chart. */
export function ScenarioExperiment({ manifestId, description }: { manifestId: string; description: ReactNode }) {
  const { t } = useTranslation();
  const lang = useLang();
  const [manifest, setManifest] = useState<ScenarioManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    let alive = true;
    loadManifest(manifestId)
      .then((m) => {
        if (!alive) return;
        setManifest(m);
        const preferred = m.variants.find((v) => v.id === "moderate") ?? m.variants[0];
        setActiveId(preferred?.id ?? "");
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [manifestId]);

  if (error) return <div className="banner error">⚠ {error}</div>;
  if (!manifest) return <div className="loading">{t("common.loading")}</div>;

  const active = manifest.variants.find((v) => v.id === activeId) ?? manifest.variants[0];

  return (
    <div>
      <div className="prose">{description}</div>

      <div className="variant-bar">
        <span className="variant-bar-label">
          {t("sim.variants")} ({manifest.variants.length}) · {manifest.lane === "live" ? t("sim.laneLive") : t("sim.lanePrecomputed")}
        </span>
        <div className="variant-chips">
          {manifest.variants.map((v) => (
            <button
              key={v.id}
              className={"variant-chip" + (v.id === active.id ? " active" : "")}
              onClick={() => setActiveId(v.id)}
            >
              {lang === "es" ? v.label_es : v.label_en}
            </button>
          ))}
        </div>
        {active && <p className="variant-note">{lang === "es" ? active.note_es : active.note_en}</p>}
      </div>

      {active && <VariantPlayer key={active.id} variant={active} />}

      <div style={{ marginTop: "1.5rem" }}>
        <VariantComparison variants={manifest.variants} activeId={active?.id ?? ""} onSelect={setActiveId} />
      </div>
    </div>
  );
}
