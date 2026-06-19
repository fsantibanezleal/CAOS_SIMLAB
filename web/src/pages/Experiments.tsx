import { useTranslation } from "react-i18next";
import { Tabs } from "@/components/content/Tabs";
import { Callout } from "@/components/content/Callout";
import { ScenarioExperiment, type GridKpiConfig } from "@/components/sim/ScenarioExperiment";
import { useLang } from "@/lib/useLang";

const SCHELLING_KPI: GridKpiConfig = {
  key: "final_segregation", en: "Final segregation index", es: "Índice de segregación final",
  cols: [
    { key: "final_segregation", en: "Segregation", es: "Segregación" },
    { key: "final_happy_frac", en: "Happy", es: "Felices" },
    { key: "tolerance", en: "Tolerance", es: "Tolerancia" },
    { key: "steps_run", en: "Steps", es: "Pasos" },
  ],
};
const SIR_KPI: GridKpiConfig = {
  key: "attack_rate", en: "Attack rate (final recovered)", es: "Tasa de ataque (recuperados finales)",
  cols: [
    { key: "attack_rate", en: "Attack rate", es: "Tasa ataque" },
    { key: "peak_infected_frac", en: "Peak I", es: "Pico I" },
    { key: "peak_step", en: "Peak step", es: "Paso pico" },
    { key: "beta", en: "β", es: "β" },
    { key: "gamma", en: "γ", es: "γ" },
  ],
};

export default function Experiments() {
  const { t } = useTranslation();
  const lang = useLang();

  const tabs = [
    {
      id: "s01",
      label: "S01 · " + (lang === "es" ? "Cola banco/clínica" : "Bank / clinic queue"),
      content: <ScenarioExperiment manifestId="s01_queue" description={<S01Desc lang={lang} />} />,
    },
    {
      id: "s02",
      label: "S02 · " + (lang === "es" ? "Segregación de Schelling" : "Schelling segregation"),
      content: <ScenarioExperiment manifestId="s02_schelling" description={<S02Desc lang={lang} />} gridKpi={SCHELLING_KPI} />,
    },
    {
      id: "s03",
      label: "S03 · " + (lang === "es" ? "Epidemia (SIR)" : "Epidemic (SIR)"),
      content: <ScenarioExperiment manifestId="s03_sir" description={<S03Desc lang={lang} />} gridKpi={SIR_KPI} />,
    },
    { id: "s04", label: "S04 · " + (lang === "es" ? "Urgencias" : "Emergency dept."), content: <Coming lang={lang} which="ed" /> },
    { id: "s07", label: "S07 · " + (lang === "es" ? "Ruteo de camiones" : "Haul routing"), content: <Coming lang={lang} which="haul" /> },
  ];

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.experiments")}</h1>
        <p className="lede">
          {lang === "es"
            ? "Casos de estudio trabajados. Cada uno explica el problema y lo que aborda, ofrece ≥10 regímenes pre-simulados para comparar, un reproductor animado y una comparación de resultados."
            : "Worked case studies. Each explains the problem and what it addresses, offers ≥10 pre-simulated regimes to compare, an animated player, and a comparison of results."}
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
        <p>Clientes llegan a un banco o una clínica y esperan a ser atendidos por uno de <em>c</em> servidores idénticos. Las llegadas son aleatorias (Poisson, tasa <em>λ</em>) y cada atención dura un tiempo exponencial (tasa <em>μ</em>). Es el problema canónico de la teoría de colas: el <strong>M/M/c</strong>.</p>
        <p><strong>Qué aborda:</strong> cómo la utilización ρ = λ/(c·μ) gobierna la congestión y por qué la espera explota cuando ρ→1; el efecto <strong>pooling</strong> (a igual ρ, más servidores acortan la espera); la Ley de Little; y la <strong>validación</strong> contra la fórmula cerrada de Erlang-C. Hay 12 regímenes pre-simulados — un barrido de carga y uno de número de servidores.</p>
      </>
    );
  }
  return (
    <>
      <h2>The problem: a multi-server queue (M/M/c)</h2>
      <p>Customers arrive at a bank or clinic and wait for one of <em>c</em> identical servers. Arrivals are random (Poisson, rate <em>λ</em>) and each service takes an exponential time (rate <em>μ</em>). This is the canonical queueing-theory problem: the <strong>M/M/c</strong>.</p>
      <p><strong>What it addresses:</strong> how utilization ρ = λ/(c·μ) governs congestion and why waiting explodes as ρ→1; the <strong>pooling</strong> effect (at equal ρ, more servers shorten the wait); Little's Law; and <strong>validation</strong> against the closed-form Erlang-C. 12 pre-simulated regimes — a load sweep and a server-count sweep.</p>
    </>
  );
}

function S02Desc({ lang }: { lang: string }) {
  if (lang === "es") {
    return (
      <>
        <h2>El problema: segregación de Schelling</h2>
        <p>Dos grupos ocupan una grilla con algunas celdas vacías. Cada agente está <em>contento</em> si al menos una fracción <em>tolerancia</em> de sus vecinos (vecindad de Moore) son de su mismo tipo; los descontentos se mudan a una celda vacía al azar. Reglas locales simples, semilla fija.</p>
        <p><strong>Qué aborda — emergencia:</strong> aun con una preferencia local leve (¡incluso querer solo un 30–50% de vecinos similares!), el sistema se segrega globalmente, un patrón que ningún agente buscó. Mueve el selector de regímenes para ver el <strong>punto de quiebre</strong>: bajo cierta tolerancia casi no hay segregación, y por encima aparece de golpe. El gráfico muestra el índice de segregación creciendo paso a paso.</p>
      </>
    );
  }
  return (
    <>
      <h2>The problem: Schelling segregation</h2>
      <p>Two groups occupy a grid with some empty cells. An agent is <em>happy</em> if at least a fraction <em>tolerance</em> of its Moore-neighbours are its own type; unhappy agents relocate to a random empty cell. Simple local rules, fixed seed.</p>
      <p><strong>What it addresses — emergence:</strong> even a mild local preference (wanting just 30–50% similar neighbours!) drives the system to global segregation that no agent intended. Move the regime selector to find the <strong>tipping point</strong>: below a tolerance there is almost no segregation, and above it segregation appears sharply. The chart shows the segregation index climbing step by step.</p>
    </>
  );
}

function S03Desc({ lang }: { lang: string }) {
  if (lang === "es") {
    return (
      <>
        <h2>El problema: epidemia SIR sobre una grilla</h2>
        <p>Cada celda es <em>Susceptible</em>, <em>Infectada</em> o <em>Recuperada</em>. Una susceptible se infecta con probabilidad 1−(1−β)<sup>k</sup> según su número <em>k</em> de vecinos infectados; una infectada se recupera con probabilidad <em>γ</em> por paso. Es la versión por agentes del modelo compartimental de Kermack–McKendrick.</p>
        <p><strong>Qué aborda:</strong> el <strong>umbral epidémico</strong> — por debajo de cierta transmisibilidad el brote se apaga; por encima, despega, alcanza un <em>pico</em> y se extingue dejando una <em>tasa de ataque</em> de recuperados. Compara regímenes β/γ para ver cómo cambian el pico y el momento del pico; el gráfico muestra las curvas S/I/R en el tiempo.</p>
      </>
    );
  }
  return (
    <>
      <h2>The problem: SIR epidemic on a grid</h2>
      <p>Each cell is <em>Susceptible</em>, <em>Infected</em> or <em>Recovered</em>. A susceptible cell becomes infected with probability 1−(1−β)<sup>k</sup> given its number <em>k</em> of infected neighbours; an infected cell recovers with probability <em>γ</em> per step. It is the agent version of the Kermack–McKendrick compartmental model.</p>
      <p><strong>What it addresses:</strong> the <strong>epidemic threshold</strong> — below a transmissibility the outbreak fizzles; above it, the epidemic takes off, peaks, and burns out, leaving an <em>attack rate</em> of recovered. Compare β/γ regimes to see how the peak and its timing change; the chart shows the S/I/R curves over time.</p>
    </>
  );
}

function Coming({ lang, which }: { lang: string; which: "ed" | "haul" }) {
  const copy = {
    ed: {
      en: { h: "Emergency department patient flow — DES", p: "A multi-stage DES with priority triage and non-stationary arrivals: patients flow through triage, treatment and disposition under limited resources. It addresses results-honesty head-on — single run vs N replications, confidence intervals, and the warm-up period." },
      es: { h: "Flujo de pacientes en urgencias — DES", p: "Un DES multi-etapa con triage por prioridad y llegadas no estacionarias: los pacientes fluyen por triage, tratamiento y disposición con recursos limitados. Aborda de frente la honestidad de resultados — una corrida vs N réplicas, intervalos de confianza y el periodo de calentamiento." },
    },
    haul: {
      en: { h: "Construction haul routing — optimize-then-simulate", p: "Trucks haul material over a road network where elevation drives cost. An optimizer (OR-Tools) plans routes offline; a DES then replays them under stochastic delays. Precomputed (native solver, larger data) and the one case where 3D terrain is pedagogically real." },
      es: { h: "Ruteo de camiones en construcción — optimizar-luego-simular", p: "Camiones transportan material sobre una red vial donde la elevación maneja el costo. Un optimizador (OR-Tools) planifica rutas offline; un DES las reproduce bajo demoras estocásticas. Precomputado (solver nativo, datos más grandes) y el único caso donde el terreno 3D es pedagógicamente real." },
    },
  }[which];
  const c = lang === "es" ? copy.es : copy.en;
  return (
    <div className="prose">
      <h2>{c.h}</h2>
      <p>{c.p}</p>
      <Callout variant="note" title={lang === "es" ? "En construcción" : "Under construction"}>
        <p>{lang === "es" ? "Llega en una próxima fase del roadmap (carril de precómputo con OR-Tools + mapas)." : "Arriving in a later roadmap phase (the OR-Tools + maps precompute lane)."}</p>
      </Callout>
    </div>
  );
}
