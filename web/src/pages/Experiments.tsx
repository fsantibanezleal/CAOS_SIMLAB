import { useTranslation } from "react-i18next";
import { Tabs } from "@/components/content/Tabs";
import { Callout } from "@/components/content/Callout";
import { ScenarioExperiment } from "@/components/sim/ScenarioExperiment";
import { useLang } from "@/lib/useLang";

export default function Experiments() {
  const { t } = useTranslation();
  const lang = useLang();

  const tabs = [
    {
      id: "s01",
      label: "S01 · " + (lang === "es" ? "Cola banco/clínica" : "Bank / clinic queue"),
      content: <ScenarioExperiment manifestId="s01_queue" description={<S01Desc lang={lang} />} />,
    },
    { id: "s03", label: "S03 · " + (lang === "es" ? "Epidemia (SIR)" : "Epidemic (SIR)"), content: <Coming lang={lang} which="sir" /> },
    { id: "s04", label: "S04 · " + (lang === "es" ? "Urgencias" : "Emergency dept.") , content: <Coming lang={lang} which="ed" /> },
    { id: "s07", label: "S07 · " + (lang === "es" ? "Ruteo de camiones" : "Haul routing"), content: <Coming lang={lang} which="haul" /> },
  ];

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.experiments")}</h1>
        <p className="lede">
          {lang === "es"
            ? "Casos de estudio trabajados. Cada uno explica el problema y lo que aborda, ofrece ≥10 regímenes pre-simulados para comparar, un reproductor animado y una comparación contra la teoría."
            : "Worked case studies. Each explains the problem and what it addresses, offers ≥10 pre-simulated regimes to compare, an animated player, and a comparison against theory."}
        </p>
      </div>
      <Tabs tabs={tabs} ariaLabel={t("nav.experiments")} />
    </div>
  );
}

function S01Desc({ lang }: { lang: string }) {
  if (lang === "es") {
    return (
      <>
        <h2>El problema: una cola con varios servidores (M/M/c)</h2>
        <p>
          Clientes llegan a un banco o una clínica y esperan a ser atendidos por uno de <em>c</em> servidores
          idénticos. Las llegadas son aleatorias (proceso de Poisson con tasa <em>λ</em>) y cada atención dura
          un tiempo exponencial con tasa <em>μ</em>. Es el problema canónico de la teoría de colas: el
          <strong> M/M/c</strong> (llegadas markovianas / servicio markoviano / c servidores).
        </p>
        <p><strong>Qué aborda.</strong> Es la puerta de entrada a DES y enseña lo esencial:</p>
        <ul>
          <li>cómo la <strong>utilización</strong> ρ = λ/(c·μ) gobierna la congestión, y por qué la espera explota cuando ρ→1;</li>
          <li>el efecto <strong>pooling</strong>: a igual ρ, más servidores compartidos acortan drásticamente la espera (compara M/M/1, c=2, c=5, c=10 abajo);</li>
          <li>la <strong>Ley de Little</strong> (Lq = λ·Wq) y la diferencia entre una sola corrida ruidosa y la media de largo plazo;</li>
          <li><strong>validación</strong>: el M/M/c tiene solución cerrada (Erlang-C), así que cada régimen se contrasta con la teoría.</li>
        </ul>
        <Callout variant="note" title="Cómo leer los regímenes">
          <p>
            Hay 12 versiones pre-simuladas: un barrido de carga (ρ de 0.33 hasta inestable) y un barrido de
            número de servidores a ρ fijo. Cambia entre ellas y observa cómo cambian la animación y los KPIs;
            el gráfico de comparación los muestra todos a la vez.
          </p>
        </Callout>
      </>
    );
  }
  return (
    <>
      <h2>The problem: a multi-server queue (M/M/c)</h2>
      <p>
        Customers arrive at a bank or clinic and wait to be served by one of <em>c</em> identical servers.
        Arrivals are random (a Poisson process with rate <em>λ</em>) and each service takes an exponential
        time with rate <em>μ</em>. This is the canonical queueing-theory problem: the <strong>M/M/c</strong>
        (Markovian arrivals / Markovian service / c servers).
      </p>
      <p><strong>What it addresses.</strong> It is the entry point to DES and teaches the essentials:</p>
      <ul>
        <li>how <strong>utilization</strong> ρ = λ/(c·μ) governs congestion, and why waiting explodes as ρ→1;</li>
        <li>the <strong>pooling effect</strong>: at equal ρ, more shared servers drastically shorten the wait (compare M/M/1, c=2, c=5, c=10 below);</li>
        <li><strong>Little's Law</strong> (Lq = λ·Wq) and the gap between one noisy run and the long-run mean;</li>
        <li><strong>validation</strong>: M/M/c has a closed form (Erlang-C), so every regime is checked against theory.</li>
      </ul>
      <Callout variant="note" title="How to read the regimes">
        <p>
          There are 12 pre-simulated versions: a load sweep (ρ from 0.33 to unstable) and a server-count
          sweep at fixed ρ. Switch between them and watch the animation and KPIs change; the comparison chart
          shows them all at once.
        </p>
      </Callout>
    </>
  );
}

function Coming({ lang, which }: { lang: string; which: "sir" | "ed" | "haul" }) {
  const copy = {
    sir: {
      en: { h: "Epidemic spread (SIR) — Agent-Based Model", p: "Agents on a grid are Susceptible, Infected or Recovered; infection spreads by local contact. You will tune the contagion probability and recovery rate and watch the epidemic curve, the peak, and herd immunity emerge — the canonical ABM lesson that global dynamics arise from simple local rules." },
      es: { h: "Propagación epidémica (SIR) — Modelo Basado en Agentes", p: "Agentes en una grilla son Susceptibles, Infectados o Recuperados; la infección se propaga por contacto local. Ajustarás la probabilidad de contagio y la tasa de recuperación y verás emerger la curva epidémica, el pico y la inmunidad de rebaño — la lección canónica de ABM: la dinámica global surge de reglas locales simples." },
    },
    ed: {
      en: { h: "Emergency department patient flow — DES", p: "A multi-stage DES with priority triage and non-stationary arrivals: patients flow through triage, treatment and disposition under limited resources. It addresses results-honesty head-on — single run vs N replications, confidence intervals, and the warm-up period." },
      es: { h: "Flujo de pacientes en urgencias — DES", p: "Un DES multi-etapa con triage por prioridad y llegadas no estacionarias: los pacientes fluyen por triage, tratamiento y disposición con recursos limitados. Aborda de frente la honestidad de resultados — una corrida vs N réplicas, intervalos de confianza y el periodo de calentamiento." },
    },
    haul: {
      en: { h: "Construction haul routing — optimize-then-simulate", p: "Trucks haul material over a road network where elevation drives cost. An optimizer (OR-Tools) plans routes offline; a DES then replays them under stochastic delays. It is precomputed (native solver, larger data) and is the one case where 3D terrain is pedagogically real." },
      es: { h: "Ruteo de camiones en construcción — optimizar-luego-simular", p: "Camiones transportan material sobre una red vial donde la elevación maneja el costo. Un optimizador (OR-Tools) planifica rutas offline; un DES las reproduce bajo demoras estocásticas. Es precomputado (solver nativo, datos más grandes) y es el único caso donde el terreno 3D es pedagógicamente real." },
    },
  }[which];
  const c = lang === "es" ? copy.es : copy.en;
  return (
    <div className="prose">
      <h2>{c.h}</h2>
      <p>{c.p}</p>
      <div className="coming">{lang === "es" ? "En construcción — llega en una próxima fase del roadmap." : "Under construction — arriving in a later roadmap phase."}</div>
    </div>
  );
}
