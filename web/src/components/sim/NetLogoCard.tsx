import { useEffect, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL;

/**
 * NetLogoCard — embeds a self-contained NetLogo Web (Tortoise engine) model that runs
 * entirely client-side in the browser. The model HTML under `public/netlogo/` inlines the
 * Tortoise compiler + engine + Galapagos UI plus our own .nlogo source; it makes zero
 * network calls (fonts + analytics stripped at build time — see tools/netlogo/).
 *
 * This is the LIVE-ABM lane: real Run / Setup / Go and editable sliders, with no Python
 * worker and no server compute. It is intentionally isolated from the Pyodide LivePanel
 * and the precomputed replay players — nothing here touches the existing scenario code.
 *
 * `?disableAnalytics` is appended defensively (the upstream template gates its gtag behind
 * that flag; our build also neutralizes it, so this is belt-and-suspenders).
 */
export function NetLogoCard({
  model,
  title,
  height = 520,
}: {
  model: string; // file name under public/netlogo/, e.g. "schelling.html"
  title: string;
  height?: number;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const src = `${BASE}netlogo/${model}?disableAnalytics`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLoad = () => setLoaded(true);
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, []);

  return (
    <div className="card netlogo-card" data-testid="netlogo-card">
      <div className="netlogo-card-head">
        <h3>{title}</h3>
        <span className="live-badge">
          NetLogo Web · client-side · zero server compute
        </span>
      </div>
      <div className="netlogo-frame-wrap" style={{ position: "relative", height }}>
        {!loaded && (
          <div className="netlogo-loading" data-testid="netlogo-loading">
            Loading NetLogo Web engine…
          </div>
        )}
        <iframe
          ref={ref}
          title={title}
          src={src}
          data-testid="netlogo-iframe"
          style={{ width: "100%", height: "100%", border: "0", borderRadius: "8px" }}
          // The exported model HTML is our own redistributable artifact; same-origin so the
          // validator can inspect its DOM. Sandbox kept permissive enough for the engine
          // (scripts) but it serves only static assets.
          loading="lazy"
        />
      </div>
    </div>
  );
}
