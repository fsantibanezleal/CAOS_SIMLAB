import { useI18n } from "../i18n";

export function About() {
  const { lang, t } = useI18n();
  return (
    <article className="prose card">
      <h2>{t("about.title")}</h2>
      {lang === "es" ? (
        <>
          <p>
            <strong>CAOS_SIMLAB</strong> es un laboratorio público y didáctico de Simulación de Eventos
            Discretos (DES) y Modelos Basados en Agentes (ABM): entras directo a una simulación corriendo,
            ajustas, y observas la dinámica — con una teoría clara a un clic.
          </p>
          <p>
            <strong>Arquitectura (replay determinista):</strong> es un sitio estático, sin backend. Las
            simulaciones livianas corren <em>en tu navegador</em> (Pyodide); las pesadas se precomputan
            localmente en un <em>trace con semilla fija</em> y se reproducen. Como una corrida queda
            determinada por (parámetros, semilla), el trace es la verdad y el replay es exacto.
          </p>
          <p>
            Código abierto (MIT). Es una <em>investigación sobre tecnología</em> de simulación, en
            construcción por fases.
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>CAOS_SIMLAB</strong> is a public, didactic lab for Discrete-Event Simulation (DES) and
            Agent-Based Modeling (ABM): you land in a running simulation, tune it, and watch the dynamics —
            with clear theory one click away.
          </p>
          <p>
            <strong>Architecture (deterministic replay):</strong> a static site, no backend. Light
            simulations run <em>in your browser</em> (Pyodide); heavy ones are precomputed locally into a
            <em> seeded trace</em> and replayed. Because a run is fully determined by (params, seed), the
            trace is the source of truth and replay is exact.
          </p>
          <p>
            Open source (MIT). It is a <em>technology investigation</em> into simulation, built in phases.
          </p>
        </>
      )}
      <p>
        <a className="link" href="https://github.com/fsantibanezleal/CAOS_SIMLAB" target="_blank" rel="noreferrer">
          github.com/fsantibanezleal/CAOS_SIMLAB →
        </a>
      </p>
    </article>
  );
}
