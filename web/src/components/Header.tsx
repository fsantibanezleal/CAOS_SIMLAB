import { useI18n, type Lang } from "../i18n";
import { useTheme } from "../theme";

export type Tab = "simulator" | "learn" | "about";

export function Header({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const tabs: Tab[] = ["simulator", "learn", "about"];

  return (
    <header className="header">
      <div className="brand">
        <svg className="logo" viewBox="0 0 64 64" aria-hidden width="34" height="34">
          <rect width="64" height="64" rx="12" fill="#0d1b2a" />
          <circle cx="16" cy="32" r="5" fill="#4cc9f0" />
          <circle cx="32" cy="20" r="5" fill="#4895ef" />
          <circle cx="32" cy="44" r="5" fill="#4895ef" />
          <circle cx="48" cy="32" r="5" fill="#f72585" />
          <g stroke="#577590" strokeWidth="2.5" fill="none" opacity="0.9">
            <path d="M20 31 L28 22" />
            <path d="M20 33 L28 42" />
            <path d="M36 22 L44 31" />
            <path d="M36 42 L44 33" />
          </g>
        </svg>
        <div>
          <div className="brand-title">{t("app.title")}</div>
          <div className="brand-tag">{t("app.tagline")}</div>
        </div>
      </div>
      <nav className="tabs">
        {tabs.map((x) => (
          <button
            key={x}
            className={"tab" + (tab === x ? " active" : "")}
            onClick={() => setTab(x)}
          >
            {t("nav." + x)}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <select
          aria-label="language"
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="select"
        >
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
        <button className="icon-btn" onClick={toggle} aria-label="toggle theme">
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
