import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { Briefcase, Github, Globe, Network } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { EXTERNAL_LINKS } from "@/lib/links";
import { ROUTES } from "@/lib/routes";
import { APP_VERSION } from "@/lib/version";

/** App shell: sticky header (brand + nav + external icon-links + language/theme toggles) and footer. */
export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="brand" aria-label={t("product.name")}>
            <Network size={18} aria-hidden="true" className="brand-mark" />
            <span>{t("product.name")}</span>
          </NavLink>

          <nav className="main-nav" aria-label={t("product.name")}>
            {ROUTES.map((r) => (
              <NavLink
                key={r.id}
                to={r.path}
                end={r.path === "/"}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {t(r.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <a className="icon-btn" href={EXTERNAL_LINKS.github} target="_blank" rel="noreferrer noopener"
               aria-label={t("header.github")} title={t("header.github")}>
              <Github size={18} aria-hidden="true" />
            </a>
            <a className="icon-btn" href={EXTERNAL_LINKS.personal} target="_blank" rel="noreferrer noopener"
               aria-label={t("header.personal")} title={t("header.personal")}>
              <Globe size={18} aria-hidden="true" />
            </a>
            <a className="icon-btn" href={EXTERNAL_LINKS.portfolio} target="_blank" rel="noreferrer noopener"
               aria-label={t("header.portfolio")} title={t("header.portfolio")}>
              <Briefcase size={18} aria-hidden="true" />
            </a>
            <span className="header-sep" aria-hidden="true" />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="page">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-meta">
            <span>{t("footer.attribution")}</span>
            <span aria-hidden="true">·</span>
            <span>{t("footer.complement")}</span>
          </div>
          <div className="footer-meta">
            <a href={EXTERNAL_LINKS.github} target="_blank" rel="noreferrer noopener">{t("header.github")}</a>
            <span aria-hidden="true">·</span>
            <a href={EXTERNAL_LINKS.personal} target="_blank" rel="noreferrer noopener">{t("header.personal")}</a>
            <span aria-hidden="true">·</span>
            <a href={EXTERNAL_LINKS.portfolio} target="_blank" rel="noreferrer noopener">{t("header.portfolio")}</a>
            <span aria-hidden="true">·</span>
            <span className="faint">{t("footer.license")}</span>
            <span className="footer-build">
              <span>{t("footer.version")}{APP_VERSION}</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
