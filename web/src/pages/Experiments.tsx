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
const BEERGAME_KPI: GridKpiConfig = {
  key: "bullwhip_factory", en: "Bullwhip ratio at the factory", es: "Razón bullwhip en la fábrica",
  cols: [
    { key: "bullwhip_retailer", en: "Retailer", es: "Minorista" },
    { key: "bullwhip_wholesaler", en: "Wholesaler", es: "Mayorista" },
    { key: "bullwhip_distributor", en: "Distributor", es: "Distribuidor" },
    { key: "bullwhip_factory", en: "Factory", es: "Fábrica" },
    { key: "peak_factory_order", en: "Peak order", es: "Pico orden" },
  ],
};
const MONTECARLO_KPI: GridKpiConfig = {
  key: "ci_halfwidth", en: "95% CI half-width", es: "Semiancho del IC 95%",
  cols: [
    { key: "final_mean", en: "Mean Wq", es: "Media Wq" },
    { key: "theory_Wq", en: "Theory Wq", es: "Wq teoría" },
    { key: "ci_halfwidth", en: "CI half-width", es: "Semiancho IC" },
    { key: "rel_error_pct", en: "Rel. err %", es: "Error rel. %" },
    { key: "n_reps", en: "Reps", es: "Réplicas" },
  ],
};
const ED_KPI: GridKpiConfig = {
  key: "mean_LOS", en: "Mean length-of-stay", es: "Estancia media",
  cols: [
    { key: "mean_LOS", en: "LOS", es: "Estancia" },
    { key: "mean_LOS_urgent", en: "LOS urgent", es: "Estancia urgente" },
    { key: "mean_LOS_standard", en: "LOS standard", es: "Estancia estándar" },
    { key: "mean_wait_treatment", en: "Wait treat.", es: "Espera trat." },
    { key: "rho_treatment", en: "ρ treat.", es: "ρ trat." },
  ],
};
const JOBSHOP_KPI: GridKpiConfig = {
  key: "makespan", en: "Makespan (lower is better)", es: "Makespan (menor es mejor)",
  cols: [
    { key: "makespan", en: "Makespan", es: "Makespan" },
    { key: "n_jobs", en: "Jobs", es: "Trabajos" },
    { key: "n_machines", en: "Machines", es: "Máquinas" },
    { key: "n_operations", en: "Ops", es: "Ops" },
    { key: "utilization", en: "Utilization", es: "Utilización" },
  ],
};

export default function Experiments() {
  const { t } = useTranslation();
  const lang = useLang();
  const L = (en: string, es: string) => (lang === "es" ? es : en);

  const tabs = [
    { id: "s01", label: "S01 · " + L("Bank / clinic queue", "Cola banco/clínica"), content: <ScenarioExperiment manifestId="s01_queue" description={<S01Desc lang={lang} />} /> },
    { id: "s02", label: "S02 · " + L("Schelling segregation", "Segregación de Schelling"), content: <ScenarioExperiment manifestId="s02_schelling" description={<S02Desc lang={lang} />} gridKpi={SCHELLING_KPI} /> },
    { id: "s03", label: "S03 · " + L("Epidemic (SIR)", "Epidemia (SIR)"), content: <ScenarioExperiment manifestId="s03_sir" description={<S03Desc lang={lang} />} gridKpi={SIR_KPI} /> },
    { id: "s04", label: "S04 · " + L("Emergency dept.", "Urgencias"), content: <ScenarioExperiment manifestId="s04_ed" description={<S04Desc lang={lang} />} gridKpi={ED_KPI} /> },
    { id: "s05", label: "S05 · " + L("Beer Game (bullwhip)", "Beer Game (bullwhip)"), content: <ScenarioExperiment manifestId="s05_beergame" description={<S05Desc lang={lang} />} gridKpi={BEERGAME_KPI} /> },
    { id: "s06", label: "S06 · " + L("Job-shop (CP-SAT)", "Job-shop (CP-SAT)"), content: <ScenarioExperiment manifestId="s06_jobshop" description={<S06Desc lang={lang} />} gridKpi={JOBSHOP_KPI} /> },
    { id: "s07", label: "S07 · " + L("Haul routing", "Ruteo de camiones"), content: <Coming lang={lang} which="haul" /> },
    { id: "s08", label: "S08 · " + L("Vehicle routing (VRP)", "Ruteo de vehículos (VRP)"), content: <Coming lang={lang} which="vrp" /> },
    { id: "s09", label: "S09 · " + L("Ambulance dispatch", "Despacho ambulancias"), content: <Coming lang={lang} which="ambulance" /> },
    { id: "s10", label: "S10 · " + L("Monte-Carlo / CI", "Monte-Carlo / IC"), content: <ScenarioExperiment manifestId="s10_montecarlo" description={<S10Desc lang={lang} />} gridKpi={MONTECARLO_KPI} /> },
  ];

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.experiments")}</h1>
        <p className="lede">
          {L(
            "Worked case studies across DES, ABM and optimization. Each explains the problem and what it addresses, offers ≥10 pre-simulated regimes to compare, an animated player, and a comparison of results. Seven are live; the geospatial routing cases are landing next.",
            "Casos de estudio sobre DES, ABM y optimización. Cada uno explica el problema y lo que aborda, ofrece ≥10 regímenes pre-simulados para comparar, un reproductor animado y una comparación de resultados. Siete están activos; los casos de ruteo geoespacial llegan a continuación.",
          )}
        </p>
      </div>
      <Tabs tabs={tabs} ariaLabel={t("nav.experiments")} />
    </div>
  );
}

function S01Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: una cola con varios servidores (M/M/c)</h2>
      <p>Clientes llegan a un banco o clínica y esperan a uno de <em>c</em> servidores idénticos. Llegadas Poisson (λ), servicio exponencial (μ). Es el problema canónico de la teoría de colas.</p>
      <p><strong>Qué aborda:</strong> cómo ρ = λ/(c·μ) gobierna la congestión y por qué la espera explota cuando ρ→1; el <strong>pooling</strong> (a igual ρ, más servidores acortan la espera); la Ley de Little; y la <strong>validación</strong> contra Erlang-C. 12 regímenes.</p>
    </>
  ) : (
    <>
      <h2>The problem: a multi-server queue (M/M/c)</h2>
      <p>Customers arrive at a bank or clinic and wait for one of <em>c</em> identical servers. Poisson arrivals (λ), exponential service (μ). The canonical queueing-theory problem.</p>
      <p><strong>What it addresses:</strong> how ρ = λ/(c·μ) governs congestion and why waiting explodes as ρ→1; the <strong>pooling</strong> effect; Little's Law; and <strong>validation</strong> against Erlang-C. 12 regimes.</p>
    </>
  );
}

function S02Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: segregación de Schelling</h2>
      <p>Dos grupos en una grilla con celdas vacías. Un agente está <em>contento</em> si una fracción <em>tolerancia</em> de sus vecinos son de su tipo; los descontentos se mudan. Reglas locales simples, semilla fija.</p>
      <p><strong>Qué aborda — emergencia:</strong> una preferencia local leve produce segregación global que nadie buscó. Busca el <strong>punto de quiebre</strong> con el selector; el gráfico muestra el índice de segregación creciendo.</p>
    </>
  ) : (
    <>
      <h2>The problem: Schelling segregation</h2>
      <p>Two groups on a grid with empty cells. An agent is <em>happy</em> if a fraction <em>tolerance</em> of its neighbours are its type; unhappy ones relocate. Simple local rules, fixed seed.</p>
      <p><strong>What it addresses — emergence:</strong> a mild local preference drives global segregation no agent intended. Find the <strong>tipping point</strong> with the selector; the chart shows the segregation index climbing.</p>
    </>
  );
}

function S03Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: epidemia SIR sobre una grilla</h2>
      <p>Cada celda es Susceptible, Infectada o Recuperada. Contagio con probabilidad 1−(1−β)<sup>k</sup> según vecinos infectados <em>k</em>; recuperación con probabilidad <em>γ</em>. Versión por agentes del modelo de Kermack–McKendrick.</p>
      <p><strong>Qué aborda:</strong> el <strong>umbral epidémico</strong> — bajo cierta transmisibilidad se apaga; arriba, despega, pico y extinción con una <em>tasa de ataque</em>. Compara regímenes β/γ; el gráfico muestra las curvas S/I/R.</p>
    </>
  ) : (
    <>
      <h2>The problem: SIR epidemic on a grid</h2>
      <p>Each cell is Susceptible, Infected or Recovered. Infection with probability 1−(1−β)<sup>k</sup> from <em>k</em> infected neighbours; recovery with probability <em>γ</em>. The agent version of Kermack–McKendrick.</p>
      <p><strong>What it addresses:</strong> the <strong>epidemic threshold</strong> — below a transmissibility it fizzles; above, it takes off, peaks and burns out with an <em>attack rate</em>. Compare β/γ regimes; the chart shows the S/I/R curves.</p>
    </>
  );
}

function S04Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: flujo de pacientes en urgencias (DES multi-etapa)</h2>
      <p>Los pacientes llegan (de forma no estacionaria, con un posible <em>surge</em> diurno), pasan por <strong>triage</strong> (cola FCFS), luego por <strong>tratamiento</strong> (un pool con <em>prioridad</em>: los urgentes se adelantan) y finalmente un retardo de <strong>alta</strong>. El cuello de botella es tratamiento.</p>
      <p><strong>Qué aborda:</strong> el <strong>flujo multi-etapa</strong> con recursos limitados, el efecto de la <strong>prioridad</strong> (urgente vs estándar) sobre quién espera, y cómo las <strong>llegadas no estacionarias</strong> (un surge) saturan el sistema. Compara regímenes (carga, dotación de camillas, surge, mezcla de urgentes) y observa la estancia media por clase. La animación muestra los pacientes (rojos = urgentes) fluyendo por las estaciones.</p>
    </>
  ) : (
    <>
      <h2>The problem: emergency-department patient flow (multi-stage DES)</h2>
      <p>Patients arrive (non-stationary, with an optional daytime <em>surge</em>), pass through <strong>triage</strong> (FCFS queue), then <strong>treatment</strong> (a <em>priority</em> pool: urgent patients jump the queue), then a <strong>discharge</strong> delay. Treatment is the bottleneck.</p>
      <p><strong>What it addresses:</strong> <strong>multi-stage flow</strong> under limited resources, the effect of <strong>priority</strong> (urgent vs standard) on who waits, and how <strong>non-stationary arrivals</strong> (a surge) overload the system. Compare regimes (load, bay staffing, surge, urgent mix) and watch the mean length-of-stay by class. The animation shows patients (red = urgent) flowing through the stations.</p>
    </>
  );
}

function S06Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: programación job-shop (optimización con CP-SAT)</h2>
      <p>Cada trabajo es una secuencia ordenada de operaciones, cada una en una máquina específica por un tiempo fijo; una máquina hace una operación a la vez. El optimizador asigna tiempos de inicio para <strong>minimizar el makespan</strong> (cuándo termina el último trabajo). Esto es <strong>optimización combinatoria pura</strong> — lo que hace un solver, en contraste con los simuladores estocásticos del resto del lab. Se usa <strong>OR-Tools CP-SAT</strong>; como es código nativo, el escenario es precomputado y se muestra el horario óptimo como diagrama de Gantt.</p>
      <p><strong>Qué aborda:</strong> qué resuelve un optimizador de restricciones, y cómo la contención de máquinas determina el makespan. Incluye el benchmark clásico <strong>Fisher–Thompson ft06</strong> (6×6, óptimo probado de 55) y varias instancias generadas. La animación recorre el horario como si se ejecutara.</p>
    </>
  ) : (
    <>
      <h2>The problem: job-shop scheduling (constraint optimization, CP-SAT)</h2>
      <p>Each job is an ordered sequence of operations, each needing a specific machine for a fixed time; a machine does one operation at a time. The optimizer assigns start times to <strong>minimize the makespan</strong> (when the last job finishes). This is <strong>pure combinatorial optimization</strong> — what a solver does, in contrast with the stochastic simulators elsewhere in the lab. It uses <strong>OR-Tools CP-SAT</strong>; being native code, the scenario is precomputed and the optimal schedule is shown as a Gantt chart.</p>
      <p><strong>What it addresses:</strong> what a constraint optimizer solves, and how machine contention drives the makespan. Includes the classic <strong>Fisher–Thompson ft06</strong> benchmark (6×6, proven optimal 55) and several generated instances. The animation sweeps the schedule as if it were executing.</p>
    </>
  );
}

function S05Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: el efecto bullwhip (Beer Game)</h2>
      <p>Cuatro eslabones en serie (minorista → mayorista → distribuidor → fábrica). Cada uno pronostica las órdenes que recibe (suavizado exponencial) y usa una regla order-up-to con un <em>lead time</em> de envío. Un cambio en la demanda del cliente se transmite aguas arriba.</p>
      <p><strong>Qué aborda — el bullwhip:</strong> incluso un cambio modesto de demanda se <strong>amplifica</strong> en oscilaciones de órdenes cada vez mayores hacia la fábrica. La razón de bullwhip (varianza de órdenes / varianza de demanda) crece eslabón a eslabón. Compara lead time y suavizado para ver qué empeora la amplificación; el gráfico muestra las órdenes de cada eslabón en el tiempo.</p>
    </>
  ) : (
    <>
      <h2>The problem: the bullwhip effect (Beer Game)</h2>
      <p>Four serial echelons (retailer → wholesaler → distributor → factory). Each forecasts the orders it receives (exponential smoothing) and uses an order-up-to rule with a shipping <em>lead time</em>. A change in customer demand propagates upstream.</p>
      <p><strong>What it addresses — the bullwhip:</strong> even a modest demand change is <strong>amplified</strong> into ever-larger order swings toward the factory. The bullwhip ratio (order variance / demand variance) grows stage by stage. Compare lead time and smoothing to see what worsens the amplification; the chart shows each echelon's orders over time.</p>
    </>
  );
}

function S10Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: ¿cuánto confío en una corrida?</h2>
      <p>Una simulación estocástica es un experimento aleatorio: una sola corrida da un número ruidoso. Este caso corre <em>N réplicas</em> independientes del M/M/c y muestra la <strong>media corriente</strong> y el <strong>intervalo de confianza del 95%</strong> a medida que se acumulan réplicas, contra la respuesta cerrada de Erlang-C.</p>
      <p><strong>Qué aborda — réplicas e IC:</strong> el IC se angosta como 1/√n; con pocas réplicas a carga alta el estimador es poco confiable. Compara regímenes (réplicas × carga) para ver el semiancho del IC encogerse; el histograma muestra la distribución de Wq por corrida.</p>
    </>
  ) : (
    <>
      <h2>The problem: how much do I trust one run?</h2>
      <p>A stochastic simulation is a random experiment: a single run gives a noisy number. This case runs <em>N independent replications</em> of the M/M/c and shows the <strong>running mean</strong> and the <strong>95% confidence interval</strong> as replications accumulate, against the closed-form Erlang-C answer.</p>
      <p><strong>What it addresses — replications & CIs:</strong> the CI narrows like 1/√n; with few replications at high load the estimate is untrustworthy. Compare regimes (reps × load) to watch the CI half-width shrink; the histogram shows the per-run Wq distribution.</p>
    </>
  );
}

function Coming({ lang, which }: { lang: string; which: "haul" | "vrp" | "ambulance" }) {
  const copy: Record<string, { en: { h: string; p: string }; es: { h: string; p: string } }> = {
    haul: {
      en: { h: "Construction haul routing — optimize-then-simulate", p: "Trucks haul material over a road network where elevation drives cost. An optimizer plans routes offline; a DES replays them under stochastic delays. The one case where 3D terrain is pedagogically real." },
      es: { h: "Ruteo de camiones — optimizar-luego-simular", p: "Camiones transportan material sobre una red vial donde la elevación maneja el costo. Un optimizador planifica rutas offline; un DES las reproduce bajo demoras. El único caso donde el terreno 3D es pedagógicamente real." },
    },
    vrp: {
      en: { h: "Vehicle routing (VRP/VRPTW)", p: "Route a fleet to serve customers (with time windows) minimizing distance — OR-Tools / PyVRP. Then simulate the plan under stochastic demand to show time-window fragility. Map viz; precomputed." },
      es: { h: "Ruteo de vehículos (VRP/VRPTW)", p: "Rutea una flota para servir clientes (con ventanas de tiempo) minimizando distancia — OR-Tools / PyVRP. Luego simula el plan bajo demanda estocástica para ver la fragilidad de las ventanas. Viz de mapa; precomputado." },
    },
    ambulance: {
      en: { h: "Emergency / ambulance dispatch", p: "Stochastic calls over a city graph: an offline base dispatch plan evaluated over many stochastic-call DES runs — response-time distributions and coverage. Map viz; precomputed." },
      es: { h: "Despacho de ambulancias", p: "Llamados estocásticos sobre un grafo de ciudad: un plan de despacho base evaluado sobre muchas corridas DES con llamados aleatorios — distribuciones de tiempo de respuesta y cobertura. Viz de mapa; precomputado." },
    },
  };
  const c = lang === "es" ? copy[which].es : copy[which].en;
  return (
    <div className="prose">
      <h2>{c.h}</h2>
      <p>{c.p}</p>
      <Callout variant="note" title={lang === "es" ? "En construcción" : "Under construction"}>
        <p>{lang === "es" ? "Llega en la fase de precómputo (OR-Tools / OSMnx + mapas deck.gl/MapLibre)." : "Arriving in the precompute phase (OR-Tools / OSMnx + deck.gl/MapLibre maps)."}</p>
      </Callout>
    </div>
  );
}
