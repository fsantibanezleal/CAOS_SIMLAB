import { useTranslation } from "react-i18next";
import { Tabs } from "@/components/content/Tabs";
import { Equation, InlineMath } from "@/components/content/Equation";
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
const HAUL_KPI: GridKpiConfig = {
  key: "throughput_per_hr", en: "Throughput per hour (saturates at the loader)", es: "Rendimiento por hora (se satura en el cargador)",
  cols: [
    { key: "loads_delivered", en: "Loads", es: "Cargas" },
    { key: "throughput_per_hr", en: "Throughput /hr", es: "Rendimiento /hr" },
    { key: "loader_wait_per_load", en: "Loader wait/load", es: "Espera cargador/carga" },
    { key: "mean_cycle_time", en: "Cycle time", es: "Tiempo ciclo" },
    { key: "switch_grade_est", en: "Switch grade g*", es: "Pendiente salto g*" },
    { key: "n_trucks", en: "Trucks", es: "Camiones" },
    { key: "n_loaders", en: "Loaders", es: "Cargadores" },
  ],
};
const VRP_KPI: GridKpiConfig = {
  key: "total_distance", en: "Total distance (vs longest route)", es: "Distancia total (vs ruta más larga)",
  cols: [
    { key: "total_distance", en: "Total dist.", es: "Dist. total" },
    { key: "max_route_time", en: "Longest route", es: "Ruta más larga" },
    { key: "vehicles_used", en: "Vehicles", es: "Vehículos" },
    { key: "customers", en: "Customers", es: "Clientes" },
    { key: "capacity", en: "Capacity", es: "Capacidad" },
  ],
};
const AMBULANCE_KPI: GridKpiConfig = {
  key: "coverage_pct", en: "Coverage within the response target", es: "Cobertura dentro de la meta de respuesta",
  cols: [
    { key: "coverage_pct", en: "Coverage %", es: "Cobertura %" },
    { key: "mean_response", en: "Mean resp.", es: "Resp. media" },
    { key: "p90_response", en: "p90 resp.", es: "Resp. p90" },
    { key: "load_pct", en: "Offered load %", es: "Carga ofrecida %" },
    { key: "n_ambulances", en: "Ambulances", es: "Ambulancias" },
  ],
};
const MINEHAUL_KPI: GridKpiConfig = {
  key: "grade_dev", en: "Grade deviation from target (lower is better)", es: "Desvío de ley vs objetivo (menor es mejor)",
  cols: [
    { key: "grade_achieved", en: "Grade achieved", es: "Ley lograda" },
    { key: "grade_target", en: "Grade target", es: "Ley objetivo" },
    { key: "grade_dev", en: "Deviation", es: "Desvío" },
    { key: "in_band", en: "In band", es: "En banda" },
    { key: "plan_adherence_pct", en: "Plan adherence %", es: "Adherencia %" },
    { key: "plant_tons", en: "Plant t", es: "t planta" },
    { key: "n_trucks", en: "Trucks", es: "Camiones" },
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
    // Monte-Carlo moved up after S06 so the geospatial routing cases group together at the end.
    // Display numbers are sequential; internal manifestIds are unchanged (deep-links preserved).
    { id: "s07", label: "S07 · " + L("Monte-Carlo / CI", "Monte-Carlo / IC"), content: <ScenarioExperiment manifestId="s10_montecarlo" description={<S10Desc lang={lang} />} gridKpi={MONTECARLO_KPI} /> },
    { id: "s08", label: "S08 · " + L("Haul routing", "Ruteo de camiones"), content: <ScenarioExperiment manifestId="s07_haul" description={<S07Desc lang={lang} />} gridKpi={HAUL_KPI} /> },
    { id: "s09", label: "S09 · " + L("Vehicle routing (VRP)", "Ruteo de vehículos (VRP)"), content: <ScenarioExperiment manifestId="s08_vrp" description={<S08Desc lang={lang} />} gridKpi={VRP_KPI} /> },
    { id: "s10", label: "S10 · " + L("Ambulance dispatch", "Despacho ambulancias"), content: <ScenarioExperiment manifestId="s09_ambulance" description={<S09Desc lang={lang} />} gridKpi={AMBULANCE_KPI} /> },
    { id: "s11", label: "S11 · " + L("Multi-destination mine haul", "Acarreo minero multidestino"), content: <ScenarioExperiment manifestId="s11_minehaul" description={<S11Desc lang={lang} />} gridKpi={MINEHAUL_KPI} /> },
  ];

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.experiments")}</h1>
        <p className="lede">
          {L(
            "Eleven worked case studies across DES, ABM and optimization — queues, segregation, epidemics, emergency flow, supply chains, scheduling, Monte-Carlo, and four geospatial routing problems on a synthetic road network (haul, VRP, ambulance dispatch, and a multi-destination mine haul with a blending LP). Each explains the problem, its components and variables, a detailed formalization, its scope and assumptions; offers ≥10 pre-simulated regimes, an animated player, and a comparison of results.",
            "Once casos de estudio sobre DES, ABM y optimización — colas, segregación, epidemias, flujo de urgencias, cadenas de suministro, programación, Monte-Carlo y cuatro problemas de ruteo geoespacial sobre una red vial sintética (acarreo, VRP, despacho de ambulancias y un acarreo minero multidestino con LP de blending). Cada uno explica el problema, sus componentes y variables, una formalización detallada, sus alcances y supuestos; ofrece ≥10 regímenes pre-simulados, un reproductor animado y una comparación de resultados.",
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
      <h2>El problema: una cola con varios servidores en paralelo (M/M/c)</h2>
      <p>
        <strong>El problema.</strong> Clientes llegan a un banco o una clínica y esperan a que se libere uno de <em>c</em> servidores idénticos que comparten una sola fila por orden de llegada (FCFS). Las llegadas siguen un proceso de Poisson de tasa <InlineMath tex={String.raw`\lambda`} /> y cada servicio es exponencial de tasa <InlineMath tex={String.raw`\mu`} /> por servidor. Es el "hola mundo" de la simulación de eventos discretos: la <strong>instancia canónica</strong> del banco/clínica donde la pregunta es cuánto se espera y por qué. El simulador (SimPy) se valida contra la solución cerrada de Erlang-C.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li><strong>Entidades:</strong> clientes indistinguibles (en el código, <InlineMath tex={String.raw`n=300`} /> clientes por corrida).</li>
        <li><strong>Recurso:</strong> un pool de <em>c</em> servidores idénticos (un <InlineMath tex={String.raw`\texttt{Resource(capacity}=c\texttt{)}`} /> en SimPy) y una cola FCFS de capacidad infinita.</li>
        <li><strong>Parámetros:</strong> tasa de llegada <InlineMath tex={String.raw`\lambda`} /> (/min), tasa de servicio <InlineMath tex={String.raw`\mu`} /> (/min) por servidor, número de servidores <InlineMath tex={String.raw`c`} /> y número de clientes <InlineMath tex={String.raw`n`} />.</li>
        <li><strong>Variable de estado:</strong> <InlineMath tex={String.raw`N(t)`} />, el número de clientes en el sistema (en espera más en servicio) en el instante <InlineMath tex={String.raw`t`} />.</li>
        <li><strong>Métricas medidas:</strong> espera en cola por cliente <InlineMath tex={String.raw`W_q`} />, estancia total <InlineMath tex={String.raw`W`} />, y por la ley de Little <InlineMath tex={String.raw`L_q=\lambda W_q`} />.</li>
      </ul>

      <h3>Formalización</h3>
      <p>
        El modelo es una cola <strong>M/M/c</strong> (markoviana en llegadas y en servicio, <em>c</em> servidores). El conteo <InlineMath tex={String.raw`N(t)`} /> es una cadena de Markov de nacimiento-muerte. Se definen la carga ofrecida <InlineMath tex={String.raw`a`} /> (en Erlangs) y la utilización por servidor <InlineMath tex={String.raw`\rho`} />:
      </p>
      <Equation tex={String.raw`a=\frac{\lambda}{\mu},\qquad \rho=\frac{\lambda}{c\,\mu},\qquad \text{estable}\iff \rho<1.`} />
      <p>
        La probabilidad de que un cliente que llega deba esperar (todos los servidores ocupados) es la fórmula de retardo de <strong>Erlang-C</strong>, <InlineMath tex={String.raw`C(c,a)`} />, calculada en <code>erlang_c_mmc</code> como <InlineMath tex={String.raw`P(\text{wait})=\text{last}\cdot P_0`} />:
      </p>
      <Equation tex={String.raw`C(c,a)=\frac{\dfrac{a^{c}}{c!}\,\dfrac{1}{1-\rho}}{\displaystyle\sum_{n=0}^{c-1}\frac{a^{n}}{n!}+\frac{a^{c}}{c!}\,\frac{1}{1-\rho}}.`} />
      <p>
        De ahí la espera media en cola y el número medio en cola por la ley de Little, exactamente como en el código (<InlineMath tex={String.raw`\texttt{wq}=\texttt{p\_wait}/(c\mu-\lambda)`} />, <InlineMath tex={String.raw`\texttt{Lq}=\lambda\,\texttt{wq}`} />):
      </p>
      <Equation tex={String.raw`W_q=\frac{C(c,a)}{c\mu-\lambda},\qquad L_q=\lambda\,W_q,\qquad W=W_q+\frac{1}{\mu},\qquad L=\lambda W.`} />
      <p>
        Si <InlineMath tex={String.raw`\rho\ge 1`} /> el código devuelve <InlineMath tex={String.raw`W_q=\infty`} /> (campo nulo): no hay estado estacionario y la cola crece sin límite.
      </p>

      <h3>Alcances y supuestos</h3>
      <p>
        Se modela: un pool de <em>c</em> servidores conservativos en trabajo, una cola FCFS de capacidad infinita y una población llamante infinita. Supuestos clave: llegadas <strong>markovianas</strong> (tiempos entre llegadas i.i.d. exponenciales) y servicio exponencial e independiente; régimen <strong>estacionario</strong> (las fórmulas valen solo si <InlineMath tex={String.raw`\rho<1`} />); corrida <strong>semillada</strong> y reproducible — todas las variantes exponenciales se sortean por adelantado desde un único generador, de modo que el resultado depende de <InlineMath tex={String.raw`(\text{params}, \text{seed})`} /> y no del entrelazado del planificador de eventos.
      </p>
      <p>
        Queda <strong>fuera de alcance</strong>: balking/reneging (impaciencia), llegadas en lotes, buffers finitos, prioridades, <InlineMath tex={String.raw`\lambda`} /> no estacionaria y servicio no exponencial (esos casos se capturan en el escenario de urgencias S04 o con aproximaciones G/G/c).
      </p>

      <p>
        <strong>Qué muestra cada variante.</strong> Un barrido de carga manteniendo <InlineMath tex={String.raw`c=3,\ \mu=1`} /> recorre el eje <InlineMath tex={String.raw`\rho`} />: <em>Carga ligera</em> (<InlineMath tex={String.raw`\rho\approx0.33`} />, casi nadie espera), <em>Moderada</em> (<InlineMath tex={String.raw`\rho\approx0.67`} />), <em>Ocupada</em>, <em>Alta</em> (<InlineMath tex={String.raw`\rho\approx0.90`} />, cerca del codo), <em>Casi saturada</em> (<InlineMath tex={String.raw`\rho\approx0.95`} />) e <em>Inestable</em> (<InlineMath tex={String.raw`\rho\approx1.10`} />, teoría <InlineMath tex={String.raw`W_q=\infty`} />): pequeños aumentos de carga disparan la espera. Un grupo a <InlineMath tex={String.raw`\rho`} /> fijo demuestra el <strong>pooling</strong>: <em>Un servidor M/M/1</em>, <em>Dos</em>, <em>Cinco</em> y <em>Diez servidores</em>, todos a <InlineMath tex={String.raw`\rho\approx0.80`} />, muestran que a igual <InlineMath tex={String.raw`\rho`} /> un pool mayor acorta drásticamente la espera (economías de escala). <em>Servicio rápido</em> ilustra que duplicar <InlineMath tex={String.raw`\mu`} /> reduce la carga a la mitad.
      </p>
      <p>
        <strong>Cómo leer la viz.</strong> La animación muestra la fuente emitiendo clientes hacia el buffer FCFS y de ahí a los <em>c</em> servidores; los nodos de servidor cambian de color al pasar de ocioso a ocupado y la fila se alarga cuando todos están tomados. El HUD compara las KPIs simuladas (<InlineMath tex={String.raw`\texttt{Wq\_sim}`} />, <InlineMath tex={String.raw`\texttt{W\_sim}`} />, <InlineMath tex={String.raw`\texttt{Lq\_little}=\lambda\,W_q^{\text{sim}}`} />, <InlineMath tex={String.raw`\texttt{utilization\_offered}=\rho`} />) contra el oráculo analítico de Erlang-C (<InlineMath tex={String.raw`\rho`} />, <InlineMath tex={String.raw`P(\text{wait})`} />, <InlineMath tex={String.raw`W_q`} />, <InlineMath tex={String.raw`L_q`} />): el acuerdo dentro del error de Monte-Carlo es el criterio de validación. En el régimen inestable el campo analítico aparece vacío y la fila simulada crece sin parar.
      </p>
    </>
  ) : (
    <>
      <h2>The problem: a queue with several parallel servers (M/M/c)</h2>
      <p>
        <strong>The problem.</strong> Customers arrive at a bank or clinic and wait for one of <em>c</em> identical servers that share a single first-come-first-served (FCFS) line. Arrivals follow a Poisson process of rate <InlineMath tex={String.raw`\lambda`} /> and each service is exponential of rate <InlineMath tex={String.raw`\mu`} /> per server. It is the "hello world" of discrete-event simulation: the <strong>canonical bank/clinic instance</strong> where the question is how long people wait and why. The simulator (SimPy) is validated against the closed-form Erlang-C solution.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li><strong>Entities:</strong> indistinguishable customers (in the code, <InlineMath tex={String.raw`n=300`} /> customers per run).</li>
        <li><strong>Resource:</strong> a pool of <em>c</em> identical servers (a SimPy <InlineMath tex={String.raw`\texttt{Resource(capacity}=c\texttt{)}`} />) and an FCFS queue of infinite capacity.</li>
        <li><strong>Parameters:</strong> arrival rate <InlineMath tex={String.raw`\lambda`} /> (/min), service rate <InlineMath tex={String.raw`\mu`} /> (/min) per server, number of servers <InlineMath tex={String.raw`c`} /> and number of customers <InlineMath tex={String.raw`n`} />.</li>
        <li><strong>State variable:</strong> <InlineMath tex={String.raw`N(t)`} />, the number of customers in the system (waiting plus in service) at time <InlineMath tex={String.raw`t`} />.</li>
        <li><strong>Measured metrics:</strong> per-customer wait in queue <InlineMath tex={String.raw`W_q`} />, total sojourn <InlineMath tex={String.raw`W`} />, and by Little's Law <InlineMath tex={String.raw`L_q=\lambda W_q`} />.</li>
      </ul>

      <h3>Formalization</h3>
      <p>
        The model is an <strong>M/M/c</strong> queue (Markovian in arrivals and in service, <em>c</em> servers). The count <InlineMath tex={String.raw`N(t)`} /> is a birth-death Markov chain. Define the offered load <InlineMath tex={String.raw`a`} /> (in Erlangs) and the per-server utilization <InlineMath tex={String.raw`\rho`} />:
      </p>
      <Equation tex={String.raw`a=\frac{\lambda}{\mu},\qquad \rho=\frac{\lambda}{c\,\mu},\qquad \text{stable}\iff \rho<1.`} />
      <p>
        The probability that an arriving customer must wait (all servers busy) is the <strong>Erlang-C</strong> delay formula <InlineMath tex={String.raw`C(c,a)`} />, computed in <code>erlang_c_mmc</code> as <InlineMath tex={String.raw`P(\text{wait})=\text{last}\cdot P_0`} />:
      </p>
      <Equation tex={String.raw`C(c,a)=\frac{\dfrac{a^{c}}{c!}\,\dfrac{1}{1-\rho}}{\displaystyle\sum_{n=0}^{c-1}\frac{a^{n}}{n!}+\frac{a^{c}}{c!}\,\frac{1}{1-\rho}}.`} />
      <p>
        From it the mean wait in queue and the mean number in queue follow by Little's Law, exactly as in the code (<InlineMath tex={String.raw`\texttt{wq}=\texttt{p\_wait}/(c\mu-\lambda)`} />, <InlineMath tex={String.raw`\texttt{Lq}=\lambda\,\texttt{wq}`} />):
      </p>
      <Equation tex={String.raw`W_q=\frac{C(c,a)}{c\mu-\lambda},\qquad L_q=\lambda\,W_q,\qquad W=W_q+\frac{1}{\mu},\qquad L=\lambda W.`} />
      <p>
        If <InlineMath tex={String.raw`\rho\ge 1`} /> the code returns <InlineMath tex={String.raw`W_q=\infty`} /> (a null field): there is no steady state and the queue grows without bound.
      </p>

      <h3>Scope &amp; assumptions</h3>
      <p>
        Modeled: a pool of <em>c</em> work-conserving servers, an FCFS queue of infinite capacity and an infinite calling population. Key assumptions: <strong>Markovian</strong> arrivals (i.i.d. exponential inter-arrival times) and independent exponential service; <strong>stationary</strong> regime (the formulae hold only if <InlineMath tex={String.raw`\rho<1`} />); a <strong>seeded</strong>, reproducible run — all exponential variates are drawn up front from one generator, so the result depends on <InlineMath tex={String.raw`(\text{params}, \text{seed})`} /> and not on the event scheduler's interleaving.
      </p>
      <p>
        Out of scope: balking/reneging (impatience), batch arrivals, finite buffers, priorities, non-stationary <InlineMath tex={String.raw`\lambda`} /> and non-exponential service (those are captured in the emergency-department scenario S04 or via G/G/c approximations).
      </p>

      <p>
        <strong>What each variant shows.</strong> A load sweep holding <InlineMath tex={String.raw`c=3,\ \mu=1`} /> crawls up the <InlineMath tex={String.raw`\rho`} /> axis: <em>Light load</em> (<InlineMath tex={String.raw`\rho\approx0.33`} />, almost no one waits), <em>Moderate</em> (<InlineMath tex={String.raw`\rho\approx0.67`} />), <em>Busy</em>, <em>Heavy</em> (<InlineMath tex={String.raw`\rho\approx0.90`} />, near the knee), <em>Near-saturation</em> (<InlineMath tex={String.raw`\rho\approx0.95`} />) and <em>Unstable</em> (<InlineMath tex={String.raw`\rho\approx1.10`} />, theory <InlineMath tex={String.raw`W_q=\infty`} />): tiny load increases cause huge wait increases. A fixed-<InlineMath tex={String.raw`\rho`} /> group demonstrates <strong>pooling</strong>: <em>Single server M/M/1</em>, <em>Two</em>, <em>Five</em> and <em>Ten servers</em>, all at <InlineMath tex={String.raw`\rho\approx0.80`} />, show that at equal <InlineMath tex={String.raw`\rho`} /> a larger pool sharply shortens the wait (economies of scale). <em>Fast service</em> illustrates that doubling <InlineMath tex={String.raw`\mu`} /> halves the load.
      </p>
      <p>
        <strong>How to read the viz.</strong> The animation shows the source emitting customers into the FCFS buffer and on to the <em>c</em> servers; server nodes change colour as they flip from idle to busy and the line lengthens when all are taken. The HUD compares the simulated KPIs (<InlineMath tex={String.raw`\texttt{Wq\_sim}`} />, <InlineMath tex={String.raw`\texttt{W\_sim}`} />, <InlineMath tex={String.raw`\texttt{Lq\_little}=\lambda\,W_q^{\text{sim}}`} />, <InlineMath tex={String.raw`\texttt{utilization\_offered}=\rho`} />) against the analytic Erlang-C oracle (<InlineMath tex={String.raw`\rho`} />, <InlineMath tex={String.raw`P(\text{wait})`} />, <InlineMath tex={String.raw`W_q`} />, <InlineMath tex={String.raw`L_q`} />): agreement within Monte-Carlo error is the validation criterion. In the unstable regime the analytic field is empty and the simulated line keeps growing.
      </p>
    </>
  );
}

function S02Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>Segregación residencial a partir de preferencias locales leves: el modelo de Schelling (1971) sobre una grilla 30×30</h2>
      <p>
        <strong>El problema.</strong> Dos grupos sociales conviven en una ciudad reticulada con algunas viviendas vacías. Cada
        hogar tiene una preferencia <em>muy</em> moderada — no quedar en minoría estricta entre sus vecinos inmediatos — y se
        muda cuando esa condición no se cumple. La pregunta de Thomas Schelling: ¿pueden preferencias individuales tan tibias
        producir una ciudad fuertemente segregada que <em>nadie</em> buscó? La instancia canónica es una grilla de{" "}
        <InlineMath tex={String.raw`30\times 30`} /> celdas con un 10% vacías y tolerancia <InlineMath tex={String.raw`\tau=0.5`} />.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li>
          <strong>Entorno:</strong> grilla cuadrada <InlineMath tex={String.raw`n\times n`} /> (parámetro <InlineMath tex={String.raw`n`} />,{" "}
          por defecto 30) con vecindario de <strong>Moore</strong> (los 8 vecinos), bordes no periódicos (fuera de la grilla = vacío).
        </li>
        <li>
          <strong>Celdas / estado:</strong> cada celda toma un valor en{" "}
          <InlineMath tex={String.raw`\{\,\text{vacío}=0,\ A=1,\ B=2\,\}`} />. Los agentes son los tipos <InlineMath tex={String.raw`A`} /> y{" "}
          <InlineMath tex={String.raw`B`} /> (repartidos a partes iguales en la inicialización).
        </li>
        <li>
          <strong>Parámetros:</strong> tamaño <InlineMath tex={String.raw`n`} />; fracción vacía <InlineMath tex={String.raw`e`} /> (0.02–0.4);
          tolerancia <InlineMath tex={String.raw`\tau`} /> (0.1–0.85, mínimo de vecinos del mismo tipo); pasos máximos (10–120). Semilla fija → traza reproducible.
        </li>
        <li>
          <strong>Variables de decisión/derivadas por agente:</strong> conteo de vecinos del mismo tipo, fracción similar <InlineMath tex={String.raw`s_i`} />,
          y la marca booleana de descontento que dispara la reubicación.
        </li>
      </ul>

      <h3>Formalización</h3>
      <p>
        Es un <strong>modelo basado en agentes (ABM) sobre retícula</strong> con activación asíncrona por reubicación. Para el agente{" "}
        <InlineMath tex={String.raw`i`} /> de tipo <InlineMath tex={String.raw`c_i`} />, sea <InlineMath tex={String.raw`N_i`} /> su conjunto de
        vecinos de Moore <em>ocupados</em>. La fracción de vecinos del mismo tipo es
      </p>
      <Equation tex={String.raw`s_i = \frac{\big|\{\, j\in N_i : c_j = c_i \,\}\big|}{|N_i|}, \qquad |N_i| > 0.`} />
      <p>
        El agente está <strong>contento</strong> si y solo si <InlineMath tex={String.raw`s_i \ge \tau`} />; en el código un agente es
        descontento exactamente cuando <InlineMath tex={String.raw`s_i < \tau`} /> (umbral estricto). Un agente <em>aislado</em>{" "}
        (<InlineMath tex={String.raw`|N_i| = 0`} />, sin vecinos ocupados) se considera contento por convención.
      </p>
      <Equation tex={String.raw`u_i = \mathbb{1}\!\left[\, s_i \ge \tau \,\right], \qquad \text{mover } i \iff u_i = 0 .`} />
      <p>
        <strong>Dinámica de reubicación.</strong> En cada paso se identifican todos los agentes descontentos; se barajan y se asignan a
        celdas vacías barajadas, uno a uno (la celda recién desocupada vuelve a estar disponible para los siguientes). El proceso se
        detiene cuando no quedan descontentos o se alcanza el máximo de pasos. El <strong>índice de segregación</strong>, macro-observable
        del modelo, es la fracción similar media sobre los agentes con al menos un vecino ocupado:
      </p>
      <Equation tex={String.raw`S = \frac{1}{|\mathcal{A}|}\sum_{i\in\mathcal{A}} s_i, \qquad \mathcal{A}=\{\, i : c_i\neq 0,\ |N_i|>0 \,\}.`} />
      <p>
        La <strong>emergencia</strong> es la afirmación <InlineMath tex={String.raw`S \gg \tau`} /> en estado (casi) estacionario para{" "}
        <InlineMath tex={String.raw`\tau`} /> moderado: el conjunto se auto-organiza muy por encima de lo que cualquier agente exige. La
        curva <InlineMath tex={String.raw`S(\tau)`} /> tiene forma de <strong>transición de fase</strong> con un <em>punto de quiebre</em>{" "}
        <InlineMath tex={String.raw`\tau_c`} />: un pequeño aumento de la tolerancia provoca un salto cualitativo en la segregación global.
        También se registra la fracción de agentes contentos <InlineMath tex={String.raw`1 - n_{\text{desc}}/n_{\text{ag}}`} /> por paso.
      </p>

      <h3>Alcances y supuestos</h3>
      <ul>
        <li>
          <strong>Se modela:</strong> dos grupos de igual tamaño, vecindario de Moore, una sola preferencia (fracción del mismo tipo), reubicación a
          celda vacía <em>aleatoria</em>. Inicialización aleatoria con semilla fija → cada corrida es un sorteo reproducible.
        </li>
        <li>
          <strong>Activación asíncrona, no markoviana en sentido estricto:</strong> el orden intra-paso (barajado) influye en la traza; las
          conclusiones cualitativas se sostienen sobre semillas, no sobre una corrida.
        </li>
        <li>
          <strong>Fuera de alcance (deliberadamente):</strong> precios/renta, capacidad económica, redes sociales, más de dos grupos, preferencia por
          diversidad (anti-segregación), bordes periódicos y reubicación al vacío satisfactorio más cercano (aquí es a un vacío aleatorio cualquiera).
        </li>
        <li>
          <strong>Honestidad:</strong> el modelo demuestra <em>suficiencia</em> (esta regla basta para generar segregación), no que sea el único
          mecanismo posible de la segregación real.
        </li>
      </ul>

      <p>
        <strong>Qué muestra cada variante.</strong> El barrido de tolerancia <em>Tolerancia 30% → 70%</em> recorre la transición: con{" "}
        <em>30%</em> casi no hay segregación; <em>37.5%</em> y <em>45%</em> se acercan al punto de quiebre; <em>50% (clásico)</em> es el caso
        célebre — fuerte segregación desde una regla &ldquo;justa&rdquo;; <em>55%</em> y <em>62.5%</em> la agudizan con más movimiento; y{" "}
        <em>70%</em> es tan exigente que los agentes casi no se asientan. El barrido de densidad fija <InlineMath tex={String.raw`\tau=0.5`} /> y
        varía el vacío: <em>Densa (5%)</em> apenas tiene vacantes — segrega lento; <em>Holgada (25%)</em> da espacio para una segregación rápida y
        nítida; <em>Amplia (35%)</em> es un tablero muy disperso. Juntas separan el efecto de la <em>preferencia</em> del efecto del{" "}
        <em>espacio disponible</em>.
      </p>
      <p>
        <strong>Cómo leer la visualización.</strong> La grilla pinta el grupo <InlineMath tex={String.raw`A`} /> en color de acento y el grupo{" "}
        <InlineMath tex={String.raw`B`} /> en magenta sobre celdas vacías neutras; la animación avanza paso a paso y se ven los descontentos
        saltando hasta que se forman <em>clusters</em> contiguos separados por una frontera dentada. El gráfico traza el{" "}
        <strong>índice de segregación</strong> <InlineMath tex={String.raw`S`} /> subiendo y la <strong>fracción contenta</strong> tendiendo a 1. El
        HUD/KPIs reportan <InlineMath tex={String.raw`S`} /> final, fracción contenta final, pasos ejecutados y la tolerancia{" "}
        <InlineMath tex={String.raw`\tau`} /> de la corrida. La señal clave: <InlineMath tex={String.raw`S`} /> final mucho mayor que{" "}
        <InlineMath tex={String.raw`\tau`} /> es la huella de la emergencia.
      </p>
    </>
  ) : (
    <>
      <h2>Residential segregation from mild local preferences: Schelling&rsquo;s (1971) model on a 30×30 grid</h2>
      <p>
        <strong>The problem.</strong> Two social groups share a lattice city with some vacant homes. Each household holds a{" "}
        <em>very</em> mild preference — not to end up a strict local minority among its immediate neighbours — and relocates when
        that fails. Thomas Schelling&rsquo;s question: can preferences this tepid produce a strongly segregated city that{" "}
        <em>no one</em> intended? The canonical instance is a <InlineMath tex={String.raw`30\times 30`} /> grid, 10% empty, with
        tolerance <InlineMath tex={String.raw`\tau=0.5`} />.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li>
          <strong>Environment:</strong> a square <InlineMath tex={String.raw`n\times n`} /> grid (parameter <InlineMath tex={String.raw`n`} />,{" "}
          default 30) with a <strong>Moore</strong> neighbourhood (all 8 neighbours), non-periodic borders (off-grid = empty).
        </li>
        <li>
          <strong>Cells / state:</strong> each cell takes a value in{" "}
          <InlineMath tex={String.raw`\{\,\text{empty}=0,\ A=1,\ B=2\,\}`} />. The agents are types <InlineMath tex={String.raw`A`} /> and{" "}
          <InlineMath tex={String.raw`B`} /> (split evenly at initialization).
        </li>
        <li>
          <strong>Parameters:</strong> size <InlineMath tex={String.raw`n`} />; empty fraction <InlineMath tex={String.raw`e`} /> (0.02–0.4);
          tolerance <InlineMath tex={String.raw`\tau`} /> (0.1–0.85, minimum same-type neighbours); max steps (10–120). Fixed seed → reproducible trace.
        </li>
        <li>
          <strong>Per-agent decision/derived variables:</strong> same-type neighbour count, like-fraction <InlineMath tex={String.raw`s_i`} />,
          and the boolean unhappy flag that triggers relocation.
        </li>
      </ul>

      <h3>Formalization</h3>
      <p>
        This is a <strong>lattice agent-based model (ABM)</strong> with asynchronous relocation-driven activation. For agent{" "}
        <InlineMath tex={String.raw`i`} /> of type <InlineMath tex={String.raw`c_i`} />, let <InlineMath tex={String.raw`N_i`} /> be its set of{" "}
        <em>occupied</em> Moore neighbours. The same-type fraction is
      </p>
      <Equation tex={String.raw`s_i = \frac{\big|\{\, j\in N_i : c_j = c_i \,\}\big|}{|N_i|}, \qquad |N_i| > 0.`} />
      <p>
        The agent is <strong>happy</strong> iff <InlineMath tex={String.raw`s_i \ge \tau`} />; in the code an agent is unhappy exactly when{" "}
        <InlineMath tex={String.raw`s_i < \tau`} /> (strict threshold). An <em>isolated</em> agent (<InlineMath tex={String.raw`|N_i| = 0`} />, no
        occupied neighbours) is taken to be content by convention.
      </p>
      <Equation tex={String.raw`u_i = \mathbb{1}\!\left[\, s_i \ge \tau \,\right], \qquad \text{move } i \iff u_i = 0 .`} />
      <p>
        <strong>Relocation dynamic.</strong> Each step identifies all unhappy agents; they are shuffled and assigned to shuffled empty cells one
        by one (the just-vacated cell becomes available to later movers). The process stops when no unhappy agents remain or the max step is reached.
        The <strong>segregation index</strong>, the model&rsquo;s macro-observable, is the mean like-fraction over agents with at least one occupied
        neighbour:
      </p>
      <Equation tex={String.raw`S = \frac{1}{|\mathcal{A}|}\sum_{i\in\mathcal{A}} s_i, \qquad \mathcal{A}=\{\, i : c_i\neq 0,\ |N_i|>0 \,\}.`} />
      <p>
        <strong>Emergence</strong> is the claim <InlineMath tex={String.raw`S \gg \tau`} /> at (near-)stationarity for moderate{" "}
        <InlineMath tex={String.raw`\tau`} />: the collective self-organizes far above what any agent demands. The curve{" "}
        <InlineMath tex={String.raw`S(\tau)`} /> is <strong>phase-transition-shaped</strong> with a <em>tipping point</em>{" "}
        <InlineMath tex={String.raw`\tau_c`} />: a small rise in tolerance produces a qualitative jump in global segregation. The model also logs the
        happy fraction <InlineMath tex={String.raw`1 - n_{\text{unh}}/n_{\text{ag}}`} /> per step.
      </p>

      <h3>Scope &amp; assumptions</h3>
      <ul>
        <li>
          <strong>Modeled:</strong> two equal-size groups, Moore neighbourhood, a single preference (own-type fraction), relocation to a{" "}
          <em>random</em> empty cell. Seeded random initialization → each run is a reproducible draw.
        </li>
        <li>
          <strong>Asynchronous activation, not strictly Markovian:</strong> the within-step (shuffled) order affects the trace; qualitative
          conclusions rest on ensembles over seeds, not a single run.
        </li>
        <li>
          <strong>Out of scope (deliberately):</strong> prices/rent, ability to pay, social networks, more than two groups, preference for diversity
          (anti-segregation), periodic borders, and relocation to the <em>nearest satisfactory</em> vacancy (here it is any random empty cell).
        </li>
        <li>
          <strong>Honesty:</strong> the model demonstrates <em>sufficiency</em> (this rule suffices to generate segregation), not that it is the only
          possible mechanism behind real segregation.
        </li>
      </ul>

      <p>
        <strong>What each variant shows.</strong> The tolerance sweep <em>Tolerance 30% → 70%</em> walks the transition: at <em>30%</em> there is
        barely any segregation; <em>37.5%</em> and <em>45%</em> approach the tipping point; <em>50% (classic)</em> is the famous case — strong
        segregation from a &ldquo;fair&rdquo; rule; <em>55%</em> and <em>62.5%</em> sharpen it with more churn; and <em>70%</em> is so demanding
        that agents rarely settle. The density sweep fixes <InlineMath tex={String.raw`\tau=0.5`} /> and varies vacancy: <em>Dense (5%)</em> has
        few vacancies — slow to segregate; <em>Roomy (25%)</em> gives room for fast, clean segregation; <em>Spacious (35%)</em> is a very sparse
        board. Together they separate the effect of <em>preference</em> from the effect of <em>available space</em>.
      </p>
      <p>
        <strong>How to read the viz.</strong> The grid paints group <InlineMath tex={String.raw`A`} /> in the accent colour and group{" "}
        <InlineMath tex={String.raw`B`} /> in magenta over neutral empty cells; the animation advances step by step and you watch unhappy agents
        jump until contiguous <em>clusters</em> form, separated by a jagged boundary. The chart plots the <strong>segregation index</strong>{" "}
        <InlineMath tex={String.raw`S`} /> rising and the <strong>happy fraction</strong> trending to 1. The HUD/KPIs report final{" "}
        <InlineMath tex={String.raw`S`} />, final happy fraction, steps run, and the run&rsquo;s tolerance <InlineMath tex={String.raw`\tau`} />. The
        key signal: a final <InlineMath tex={String.raw`S`} /> much larger than <InlineMath tex={String.raw`\tau`} /> is the fingerprint of emergence.
      </p>
    </>
  );
}

function S03Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: cómo despega, llega a su pico y se extingue un brote — SIR por agentes sobre una grilla</h2>
      <p>
        <strong>El problema.</strong> Una enfermedad se propaga por contacto local en una población. Queremos saber{" "}
        <em>si</em> el brote despega o se apaga, cuán alto y cuándo es el <em>pico</em> de infectados, y qué fracción de
        la población termina contagiada — la <em>tasa de ataque</em>. La instancia canónica es el modelo de{" "}
        <strong>Kermack–McKendrick</strong> (1927), aquí en su versión <strong>por agentes (ABM)</strong>: cada celda de
        una grilla es un individuo Susceptible, Infectado o Recuperado, y el contagio ocurre solo entre vecinos.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li>
          <strong>Grilla / población:</strong> una malla cuadrada de <InlineMath tex={String.raw`n \times n`} /> celdas (
          <InlineMath tex={String.raw`n = 38`} /> por defecto). Cada celda es un agente con un único estado.
        </li>
        <li>
          <strong>Estados (compartimentos):</strong>{" "}
          <InlineMath tex={String.raw`x_{ij} \in \{S, I, R\}`} /> — Susceptible, Infectado, Recuperado. Cada paso una
          celda está en exactamente uno.
        </li>
        <li>
          <strong>Vecindad:</strong> los 8 vecinos de Moore. <InlineMath tex={String.raw`k_{ij}`} /> es el número de
          vecinos infectados de la celda <InlineMath tex={String.raw`(i,j)`} />.
        </li>
        <li>
          <strong>Parámetros:</strong> probabilidad de contagio por vecino infectado{" "}
          <InlineMath tex={String.raw`\beta`} />, probabilidad de recuperación por paso{" "}
          <InlineMath tex={String.raw`\gamma`} />, fracción inicial de infectados{" "}
          <InlineMath tex={String.raw`i_0`} />, y número máximo de pasos.
        </li>
        <li>
          <strong>Variables de salida (KPIs):</strong> las curvas <InlineMath tex={String.raw`S(t), I(t), R(t)`} /> (
          fracciones), el pico de infectados y su paso, la tasa de ataque final y la duración del brote.
        </li>
      </ul>

      <h3>Formalización</h3>
      <p>
        Modelo: <strong>SIR estocástico por agentes en una grilla</strong> (autómata celular probabilístico, análogo
        discreto del SIR compartimental de Kermack–McKendrick). La actualización es <em>síncrona</em> (todas las celdas
        se actualizan a la vez a partir del estado del paso anterior). Para una celda susceptible con{" "}
        <InlineMath tex={String.raw`k`} /> vecinos infectados, cada vecino la contagia independientemente con
        probabilidad <InlineMath tex={String.raw`\beta`} />, de modo que escapa al contagio con probabilidad{" "}
        <InlineMath tex={String.raw`(1-\beta)^{k}`} />. La probabilidad de infectarse es por tanto:
      </p>
      <Equation
        tex={String.raw`P(S \to I \mid k) = 1 - (1-\beta)^{k}`}
        caption={"Probabilidad de contagio desde k vecinos infectados (contactos independientes)."}
      />
      <p>
        Una celda infectada se recupera (irreversiblemente) con probabilidad fija por paso, independiente de la
        vecindad:
      </p>
      <Equation
        tex={String.raw`P(I \to R) = \gamma, \qquad P(R \to \cdot) = 0`}
        caption={"Recuperación per cápita constante; R es absorbente."}
      />
      <p>
        Concretamente, en cada paso cada celda susceptible saca un sorteo{" "}
        <InlineMath tex={String.raw`u \sim \mathcal{U}(0,1)`} /> y pasa a I si{" "}
        <InlineMath tex={String.raw`u < 1-(1-\beta)^{k}`} />; cada celda infectada saca otro sorteo y pasa a R si cae
        bajo <InlineMath tex={String.raw`\gamma`} />. La conexión con el SIR continuo (acción de masas) es{" "}
        <InlineMath tex={String.raw`\beta_{\text{ef}} \approx \langle k\rangle\,\beta`} /> y{" "}
        <InlineMath tex={String.raw`\gamma_{\text{ef}} = \gamma`} />, lo que define el número reproductivo y el{" "}
        <strong>umbral epidémico</strong> (despega si <InlineMath tex={String.raw`R_0 > 1`} />):
      </p>
      <Equation
        tex={String.raw`R_0 \approx \frac{\langle k\rangle\,\beta}{\gamma}, \qquad R_0 > 1 \;\Longleftrightarrow\; \text{el brote despega}`}
        caption={"Número reproductivo aproximado y umbral epidémico (⟨k⟩ ≤ 8 en la grilla de Moore)."}
      />
      <p>
        El período infeccioso medio es <InlineMath tex={String.raw`1/\gamma`} /> pasos. La <em>tasa de ataque</em> es la
        fracción finalmente recuperada <InlineMath tex={String.raw`R(\infty)`} />; en mezcla perfecta satisface la
        relación de tamaño final <InlineMath tex={String.raw`1-\rho = e^{-R_0\,\rho}`} />, pero la estructura espacial
        de la grilla la deja por debajo de esa predicción.
      </p>

      <h3>Alcances y supuestos</h3>
      <ul>
        <li>
          <strong>Markoviano y sin memoria:</strong> el estado siguiente depende solo del estado actual y de los
          vecinos; los sorteos son independientes paso a paso (RNG sembrado → traza reproducible).
        </li>
        <li>
          <strong>Espacial, no bien mezclado:</strong> el contacto es <em>local</em> (8 vecinos de Moore), no de
          población homogénea; por eso el brote se propaga como un frente y la tasa de ataque queda por debajo del
          SIR de acción de masas.
        </li>
        <li>
          <strong>Tiempo discreto y actualización síncrona;</strong> sembrado al inicio con una fracción aleatoria{" "}
          <InlineMath tex={String.raw`i_0`} /> (o un único caso central si el sorteo no enciende ninguna celda).
        </li>
        <li>
          <strong>Inmunidad permanente:</strong> R es absorbente — no hay reinfección, ni nacimientos/muertes, ni
          incubación (no es SEIR), ni movilidad de agentes, ni heterogeneidad de contactos más allá de la grilla.
        </li>
      </ul>

      <p>
        <strong>Qué muestra cada variante.</strong> <em>Bajo umbral</em> y <em>Cerca del umbral</em> ilustran el{" "}
        <strong>umbral epidémico</strong>: con <InlineMath tex={String.raw`\beta`} /> bajo el brote se apaga, y justo en
        el punto de quiebre apenas se arrastra. <em>Ola leve → moderada → severa → explosiva</em> suben{" "}
        <InlineMath tex={String.raw`\beta`} /> para mostrar la curva SIR clásica con picos cada vez más altos y rápidos.{" "}
        <em>Recuperación rápida</em> (<InlineMath tex={String.raw`\gamma`} /> alta) amortigua el pico aun con{" "}
        <InlineMath tex={String.raw`\beta`} /> alta, mientras que <em>Recuperación lenta</em> (
        <InlineMath tex={String.raw`\gamma`} /> baja) alarga una epidemia prolongada. <em>Semilla única</em> parte de{" "}
        ~un caso y se propaga como frente; <em>Siembra densa</em> enciende el tablero entero casi de inmediato.
      </p>
      <p>
        <strong>Cómo leer la visualización.</strong> En la grilla, el color codifica el estado: susceptible (acento),{" "}
        infectado (rojo), recuperado (verde). La animación avanza paso a paso y verás la ola roja crecer, alcanzar su
        pico y dejar tras de sí un campo verde (recuperados). El gráfico muestra las curvas{" "}
        <InlineMath tex={String.raw`S(t)`} />, <InlineMath tex={String.raw`I(t)`} /> y{" "}
        <InlineMath tex={String.raw`R(t)`} /> como fracciones de la población. El HUD/KPIs reportan el{" "}
        <strong>pico de infectados</strong> y el paso en que ocurre, la <strong>tasa de ataque</strong> final (
        <InlineMath tex={String.raw`R(\infty)`} />), la duración del brote y los valores de{" "}
        <InlineMath tex={String.raw`\beta`} /> y <InlineMath tex={String.raw`\gamma`} />.
      </p>
    </>
  ) : (
    <>
      <h2>The problem: how an outbreak takes off, peaks and burns out — agent-based SIR on a grid</h2>
      <p>
        <strong>The problem.</strong> A disease spreads by local contact through a population. We want to know{" "}
        <em>whether</em> the outbreak takes off or fizzles, how tall and when the infected <em>peak</em> is, and what
        fraction of the population ends up infected — the <em>attack rate</em>. The canonical instance is the{" "}
        <strong>Kermack–McKendrick</strong> model (1927), here in its <strong>agent-based (ABM)</strong> form: each cell
        of a grid is a Susceptible, Infected or Recovered individual, and infection happens only between neighbours.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li>
          <strong>Grid / population:</strong> a square lattice of <InlineMath tex={String.raw`n \times n`} /> cells (
          <InlineMath tex={String.raw`n = 38`} /> by default). Each cell is an agent with a single state.
        </li>
        <li>
          <strong>States (compartments):</strong>{" "}
          <InlineMath tex={String.raw`x_{ij} \in \{S, I, R\}`} /> — Susceptible, Infected, Recovered. Each step a cell
          is in exactly one.
        </li>
        <li>
          <strong>Neighbourhood:</strong> the 8 Moore neighbours. <InlineMath tex={String.raw`k_{ij}`} /> is the number
          of infected neighbours of cell <InlineMath tex={String.raw`(i,j)`} />.
        </li>
        <li>
          <strong>Parameters:</strong> infection probability per infected neighbour{" "}
          <InlineMath tex={String.raw`\beta`} />, recovery probability per step{" "}
          <InlineMath tex={String.raw`\gamma`} />, initial infected fraction{" "}
          <InlineMath tex={String.raw`i_0`} />, and a maximum number of steps.
        </li>
        <li>
          <strong>Output variables (KPIs):</strong> the curves <InlineMath tex={String.raw`S(t), I(t), R(t)`} /> (
          fractions), the infected peak and its step, the final attack rate and the outbreak duration.
        </li>
      </ul>

      <h3>Formalization</h3>
      <p>
        Model: <strong>stochastic agent-based SIR on a grid</strong> (a probabilistic cellular automaton, the discrete
        analogue of the Kermack–McKendrick compartmental SIR). The update is <em>synchronous</em> (all cells update at
        once from the previous step's state). For a susceptible cell with <InlineMath tex={String.raw`k`} /> infected
        neighbours, each neighbour infects it independently with probability <InlineMath tex={String.raw`\beta`} />, so
        it escapes infection with probability <InlineMath tex={String.raw`(1-\beta)^{k}`} />. The probability of
        becoming infected is therefore:
      </p>
      <Equation
        tex={String.raw`P(S \to I \mid k) = 1 - (1-\beta)^{k}`}
        caption={"Infection probability from k infected neighbours (independent contacts)."}
      />
      <p>
        An infected cell recovers (irreversibly) with a fixed per-step probability, independent of the neighbourhood:
      </p>
      <Equation
        tex={String.raw`P(I \to R) = \gamma, \qquad P(R \to \cdot) = 0`}
        caption={"Constant per-capita recovery; R is absorbing."}
      />
      <p>
        Concretely, each step every susceptible cell draws <InlineMath tex={String.raw`u \sim \mathcal{U}(0,1)`} /> and
        moves to I if <InlineMath tex={String.raw`u < 1-(1-\beta)^{k}`} />; every infected cell draws another and moves
        to R if it falls below <InlineMath tex={String.raw`\gamma`} />. The link to the continuous (mass-action) SIR is{" "}
        <InlineMath tex={String.raw`\beta_{\text{eff}} \approx \langle k\rangle\,\beta`} /> and{" "}
        <InlineMath tex={String.raw`\gamma_{\text{eff}} = \gamma`} />, which defines the reproduction number and the{" "}
        <strong>epidemic threshold</strong> (it takes off iff <InlineMath tex={String.raw`R_0 > 1`} />):
      </p>
      <Equation
        tex={String.raw`R_0 \approx \frac{\langle k\rangle\,\beta}{\gamma}, \qquad R_0 > 1 \;\Longleftrightarrow\; \text{the outbreak takes off}`}
        caption={"Approximate reproduction number and epidemic threshold (⟨k⟩ ≤ 8 on the Moore grid)."}
      />
      <p>
        The mean infectious period is <InlineMath tex={String.raw`1/\gamma`} /> steps. The <em>attack rate</em> is the
        finally-recovered fraction <InlineMath tex={String.raw`R(\infty)`} />; under perfect mixing it satisfies the
        final-size relation <InlineMath tex={String.raw`1-\rho = e^{-R_0\,\rho}`} />, but the grid's spatial structure
        leaves it below that prediction.
      </p>

      <h3>Scope &amp; assumptions</h3>
      <ul>
        <li>
          <strong>Markovian and memoryless:</strong> the next state depends only on the current state and neighbours;
          draws are independent step to step (seeded RNG → reproducible trace).
        </li>
        <li>
          <strong>Spatial, not well-mixed:</strong> contact is <em>local</em> (8 Moore neighbours), not a homogeneous
          population; that is why the outbreak spreads as a front and the attack rate stays below mass-action SIR.
        </li>
        <li>
          <strong>Discrete time and synchronous update;</strong> seeded at the start with a random fraction{" "}
          <InlineMath tex={String.raw`i_0`} /> (or a single central case if the draw lights no cell).
        </li>
        <li>
          <strong>Permanent immunity:</strong> R is absorbing — no reinfection, no births/deaths, no incubation (not
          SEIR), no agent mobility, and no contact heterogeneity beyond the grid.
        </li>
      </ul>

      <p>
        <strong>What each variant shows.</strong> <em>Below threshold</em> and <em>Near threshold</em> illustrate the{" "}
        <strong>epidemic threshold</strong>: with low <InlineMath tex={String.raw`\beta`} /> the outbreak dies out, and
        right at the tipping point it barely crawls. <em>Mild → moderate → severe → explosive</em> raise{" "}
        <InlineMath tex={String.raw`\beta`} /> to show the classic SIR wave with ever taller, faster peaks.{" "}
        <em>Fast recovery</em> (high <InlineMath tex={String.raw`\gamma`} />) damps the peak even at high{" "}
        <InlineMath tex={String.raw`\beta`} />, while <em>Slow recovery</em> (low{" "}
        <InlineMath tex={String.raw`\gamma`} />) stretches a long, smouldering epidemic. <em>Single seed</em> starts
        from ~one case and spreads as a front; <em>Dense seeding</em> ignites the whole board almost at once.
      </p>
      <p>
        <strong>How to read the viz.</strong> On the grid, colour encodes the state: susceptible (accent), infected
        (red), recovered (green). The animation steps forward and you watch the red wave grow, peak, and leave a green
        field (recovered) behind it. The chart shows the curves <InlineMath tex={String.raw`S(t)`} />,{" "}
        <InlineMath tex={String.raw`I(t)`} /> and <InlineMath tex={String.raw`R(t)`} /> as fractions of the population.
        The HUD/KPIs report the <strong>infected peak</strong> and the step it occurs, the final{" "}
        <strong>attack rate</strong> (<InlineMath tex={String.raw`R(\infty)`} />), the outbreak duration, and the
        values of <InlineMath tex={String.raw`\beta`} /> and <InlineMath tex={String.raw`\gamma`} />.
      </p>
    </>
  );
}

function S04Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: flujo de pacientes en urgencias — red de colas en tándem con prioridad (instancia canónica: una sala de urgencias de un turno)</h2>
      <p>
        <strong>El problema.</strong> Los pacientes llegan a un servicio de urgencias de forma{" "}
        <em>no estacionaria</em> (con un posible <em>surge</em> diurno), pasan primero por{" "}
        <strong>triage</strong> (un pool de enfermeras, disciplina FCFS), luego por{" "}
        <strong>tratamiento</strong> (un pool de camillas con <em>prioridad</em>: los urgentes se adelantan
        a los estándar) y finalmente sufren un retardo fijo de <strong>alta</strong> antes de irse. El cuello
        de botella es tratamiento. La pregunta operativa es cómo la carga, la dotación de camillas, el surge
        y la mezcla de urgentes determinan la <strong>estancia media</strong> (length-of-stay) por clase.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li>
          <strong>Etapas (estaciones):</strong> triage <InlineMath tex={String.raw`\rightarrow`} /> tratamiento{" "}
          <InlineMath tex={String.raw`\rightarrow`} /> alta, recorridas en serie por cada paciente.
        </li>
        <li>
          <strong>Clases de paciente:</strong>{" "}
          <InlineMath tex={String.raw`k \in \{\text{urgente}, \text{estándar}\}`} />, con códigos de
          prioridad <InlineMath tex={String.raw`0`} /> (urgente) y <InlineMath tex={String.raw`1`} /> (estándar);
          menor número = mayor prioridad.
        </li>
        <li>
          <strong>Parámetros:</strong> tasa base de llegada <InlineMath tex={String.raw`\lambda`} /> (<code>lam</code>);
          tasas de servicio <InlineMath tex={String.raw`\mu_t`} /> (triage, <code>mu_triage</code>) y{" "}
          <InlineMath tex={String.raw`\mu_x`} /> (tratamiento, <code>mu_treat</code>); servidores{" "}
          <InlineMath tex={String.raw`c_t`} /> enfermeras (<code>c_triage</code>) y{" "}
          <InlineMath tex={String.raw`c_x`} /> camillas (<code>c_treat</code>); fracción urgente{" "}
          <InlineMath tex={String.raw`p_u`} /> (<code>p_urgent</code>); flag de surge{" "}
          <InlineMath tex={String.raw`s \in \{0,1\}`} /> (<code>surge</code>); retardo de alta determinista{" "}
          <InlineMath tex={String.raw`d = 0.3`} />; número de pacientes <InlineMath tex={String.raw`n`} /> (<code>n_patients</code>).
        </li>
        <li>
          <strong>Variables de estado:</strong> la cola y los servidores ocupados de cada estación; para cada
          paciente <InlineMath tex={String.raw`i`} />, su instante de llegada{" "}
          <InlineMath tex={String.raw`a_i`} />, sus servicios <InlineMath tex={String.raw`S^t_i, S^x_i`} /> y
          su instante de partida.
        </li>
        <li>
          <strong>Resultados (KPIs):</strong> estancia media total y por clase{" "}
          <InlineMath tex={String.raw`\overline{\text{LOS}}, \overline{\text{LOS}}_u, \overline{\text{LOS}}_s`} />,
          espera media a tratamiento, y la utilización de tratamiento{" "}
          <InlineMath tex={String.raw`\rho`} />.
        </li>
      </ul>

      <h3>Formalización</h3>
      <p>
        El modelo es una <strong>red de colas en tándem</strong> (red abierta de dos etapas): una estación{" "}
        <strong>M/M/<InlineMath tex={String.raw`c_t`} /></strong> FCFS para triage seguida de una estación{" "}
        <strong>M/M/<InlineMath tex={String.raw`c_x`} /> con prioridad no expropiativa</strong> (head-of-line,
        2 clases) para tratamiento, más un retardo de alta determinista (etapa{" "}
        <InlineMath tex={String.raw`\infty`} />-servidor con tiempo fijo{" "}
        <InlineMath tex={String.raw`d`} />). Se simula como DES de interacción de procesos (SimPy), con todas
        las variates muestreadas <em>a priori</em> y semilla fija, de modo que la traza es reproducible.
      </p>
      <p>
        <strong>Llegadas no estacionarias por <em>thinning</em> (Lewis–Shedler).</strong> La intensidad
        instantánea es una <InlineMath tex={String.raw`\lambda(t)`} /> con un surge que duplica la tasa en la
        franja media del turno <InlineMath tex={String.raw`[s_0, s_1) = [0.3H,\, 0.6H)`} />:
      </p>
      <Equation tex={String.raw`\lambda(t) = \lambda \cdot \big(1 + s\,\mathbf{1}[\,s_0 \le t < s_1\,]\big), \qquad \lambda_{\max} = 2\lambda`} />
      <p>
        Se genera un proceso de Poisson homogéneo de tasa{" "}
        <InlineMath tex={String.raw`\lambda_{\max}`} /> (interarribos exponenciales{" "}
        <InlineMath tex={String.raw`\sim \text{Exp}(\lambda_{\max})`} />) y cada candidato en{" "}
        <InlineMath tex={String.raw`t`} /> se <em>acepta</em> con probabilidad de adelgazamiento:
      </p>
      <Equation tex={String.raw`\Pr[\text{aceptar } t] = \frac{\lambda(t)}{\lambda_{\max}}`} />
      <p>
        Los aceptados forman las llegadas <InlineMath tex={String.raw`a_1 < a_2 < \cdots`} />. Cada paciente
        es urgente con probabilidad <InlineMath tex={String.raw`p_u`} /> (Bernoulli). Los servicios son
        exponenciales independientes:
      </p>
      <Equation tex={String.raw`S^t_i \sim \text{Exp}(\mu_t), \qquad S^x_i \sim \text{Exp}(\mu_x), \qquad \text{alta} = d \;\text{(constante)}`} />
      <p>
        En tratamiento, la disciplina de prioridad atiende primero a los urgentes; al liberarse una camilla se
        toma al paciente en espera de menor índice de prioridad (sin expropiar al que ya está en servicio). La
        estancia de cada paciente es el tiempo total en el sistema:
      </p>
      <Equation tex={String.raw`\text{LOS}_i = (\text{espera}^t_i + S^t_i) + (\text{espera}^x_i + S^x_i) + d`} />
      <p>
        El indicador de carga del cuello de botella es la utilización ofrecida a tratamiento (estable si{" "}
        <InlineMath tex={String.raw`\rho < 1`} />):
      </p>
      <Equation tex={String.raw`\rho = \frac{\lambda}{c_x\,\mu_x}`} />

      <h3>Alcances y supuestos</h3>
      <ul>
        <li>
          <strong>Se modela:</strong> flujo multi-etapa con recursos finitos, colas por estación,
          prioridad de 2 clases en el cuello de botella, llegadas no estacionarias y LOS por clase.
        </li>
        <li>
          <strong>Markoviano:</strong> llegadas de Poisson (vía thinning) y servicios exponenciales{" "}
          <InlineMath tex={String.raw`\Rightarrow`} /> el núcleo es Markoviano; la prioridad y la no
          estacionariedad lo sacan de toda fórmula cerrada simple, de ahí la simulación.
        </li>
        <li>
          <strong>Sembrado / reproducible:</strong> todas las variates (llegadas, clases, servicios) se
          extraen por adelantado con semilla fija; la misma semilla reproduce exactamente la misma traza.
        </li>
        <li>
          <strong>Estacionario:</strong> no — la intensidad <InlineMath tex={String.raw`\lambda(t)`} /> es
          deliberadamente variable en el tiempo (transitorio de surge).
        </li>
        <li>
          <strong>Fuera de alcance:</strong> abandono/baulking (LWBS), repriorización dinámica, expropiación,
          colas con capacidad finita, reentradas, recursos compartidos entre etapas y costos. El alta es un
          retardo fijo, no una distribución.
        </li>
      </ul>

      <p>
        <strong>Qué muestra cada variante.</strong> <em>Calm</em>/<em>Typical</em>/<em>Busy</em>/<em>Overloaded</em>{" "}
        barren <InlineMath tex={String.raw`\lambda`} /> para llevar la utilización de tratamiento{" "}
        <InlineMath tex={String.raw`\rho`} /> de holgada a <InlineMath tex={String.raw`\ge 1`} /> (las colas
        explotan); <em>Daytime surge</em> activa <InlineMath tex={String.raw`s=1`} /> para mostrar el
        estrés transitorio de un pico de media jornada; <em>Understaffed</em>/<em>Well-staffed</em> mueven{" "}
        <InlineMath tex={String.raw`c_x`} /> (una camilla menos aprieta el cuello, una de más lo absorbe);{" "}
        <em>Single triage nurse</em> baja <InlineMath tex={String.raw`c_t=1`} /> para crear un cuello aguas
        arriba; <em>Many urgent</em>/<em>Few urgent</em> varían{" "}
        <InlineMath tex={String.raw`p_u`} /> para mostrar cómo la prioridad redefine quién espera (la
        estancia de los urgentes baja a costa de los estándar).
      </p>
      <p>
        <strong>Cómo leer la visualización.</strong> Los pacientes fluyen por las tres estaciones de
        izquierda a derecha; <strong>rojo</strong> = urgente, <strong>azul/acento</strong> = estándar. El
        largo de cada cola por estación muestra dónde se acumula la espera (mira tratamiento cuando{" "}
        <InlineMath tex={String.raw`\rho \to 1`} />). En el HUD/KPIs:{" "}
        <InlineMath tex={String.raw`\overline{\text{LOS}}`} /> total y por clase{" "}
        (<InlineMath tex={String.raw`\overline{\text{LOS}}_u`} /> vs{" "}
        <InlineMath tex={String.raw`\overline{\text{LOS}}_s`} />) hacen visible el efecto de la prioridad, la
        espera media a tratamiento marca la severidad del cuello, y{" "}
        <InlineMath tex={String.raw`\rho`} /> indica si el régimen es estable.
      </p>
    </>
  ) : (
    <>
      <h2>The problem: emergency-department patient flow — a tandem priority queueing network (canonical instance: one ED shift)</h2>
      <p>
        <strong>The problem.</strong> Patients arrive at an emergency department{" "}
        <em>non-stationarily</em> (with an optional daytime <em>surge</em>), first pass through{" "}
        <strong>triage</strong> (a pool of nurses, FCFS discipline), then <strong>treatment</strong> (a pool
        of bays with <em>priority</em>: urgent patients jump ahead of standard ones), and finally incur a
        fixed <strong>discharge</strong> delay before leaving. Treatment is the bottleneck. The operational
        question is how load, bay staffing, the surge, and the urgent mix drive the mean{" "}
        <strong>length-of-stay</strong> (LOS) per class.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li>
          <strong>Stages (stations):</strong> triage <InlineMath tex={String.raw`\rightarrow`} /> treatment{" "}
          <InlineMath tex={String.raw`\rightarrow`} /> discharge, traversed in series by each patient.
        </li>
        <li>
          <strong>Patient classes:</strong>{" "}
          <InlineMath tex={String.raw`k \in \{\text{urgent}, \text{standard}\}`} />, with priority codes{" "}
          <InlineMath tex={String.raw`0`} /> (urgent) and <InlineMath tex={String.raw`1`} /> (standard);
          lower number = higher priority.
        </li>
        <li>
          <strong>Parameters:</strong> base arrival rate <InlineMath tex={String.raw`\lambda`} /> (<code>lam</code>);
          service rates <InlineMath tex={String.raw`\mu_t`} /> (triage, <code>mu_triage</code>) and{" "}
          <InlineMath tex={String.raw`\mu_x`} /> (treatment, <code>mu_treat</code>); servers{" "}
          <InlineMath tex={String.raw`c_t`} /> nurses (<code>c_triage</code>) and{" "}
          <InlineMath tex={String.raw`c_x`} /> bays (<code>c_treat</code>); urgent fraction{" "}
          <InlineMath tex={String.raw`p_u`} /> (<code>p_urgent</code>); surge flag{" "}
          <InlineMath tex={String.raw`s \in \{0,1\}`} /> (<code>surge</code>); deterministic discharge delay{" "}
          <InlineMath tex={String.raw`d = 0.3`} />; patient count <InlineMath tex={String.raw`n`} /> (<code>n_patients</code>).
        </li>
        <li>
          <strong>State variables:</strong> each station's queue and busy servers; for every patient{" "}
          <InlineMath tex={String.raw`i`} />, its arrival epoch <InlineMath tex={String.raw`a_i`} />, its
          service times <InlineMath tex={String.raw`S^t_i, S^x_i`} />, and its departure epoch.
        </li>
        <li>
          <strong>Outputs (KPIs):</strong> mean total and per-class LOS{" "}
          <InlineMath tex={String.raw`\overline{\text{LOS}}, \overline{\text{LOS}}_u, \overline{\text{LOS}}_s`} />,
          mean wait to treatment, and treatment utilization <InlineMath tex={String.raw`\rho`} />.
        </li>
      </ul>

      <h3>Formalization</h3>
      <p>
        The model is a <strong>tandem queueing network</strong> (two-stage open network): an{" "}
        <strong>M/M/<InlineMath tex={String.raw`c_t`} /></strong> FCFS triage station feeding an{" "}
        <strong>M/M/<InlineMath tex={String.raw`c_x`} /> non-preemptive priority station</strong> (head-of-line,
        2 classes) for treatment, plus a deterministic discharge delay (an{" "}
        <InlineMath tex={String.raw`\infty`} />-server stage with fixed time{" "}
        <InlineMath tex={String.raw`d`} />). It is run as a process-interaction DES (SimPy), with all variates
        sampled <em>up front</em> under a fixed seed, so the trace is reproducible.
      </p>
      <p>
        <strong>Non-stationary arrivals via <em>thinning</em> (Lewis–Shedler).</strong> The instantaneous
        intensity is a <InlineMath tex={String.raw`\lambda(t)`} /> with a surge that doubles the rate over the
        middle of the shift <InlineMath tex={String.raw`[s_0, s_1) = [0.3H,\, 0.6H)`} />:
      </p>
      <Equation tex={String.raw`\lambda(t) = \lambda \cdot \big(1 + s\,\mathbf{1}[\,s_0 \le t < s_1\,]\big), \qquad \lambda_{\max} = 2\lambda`} />
      <p>
        A homogeneous Poisson process of rate <InlineMath tex={String.raw`\lambda_{\max}`} /> is generated
        (exponential interarrivals <InlineMath tex={String.raw`\sim \text{Exp}(\lambda_{\max})`} />) and each
        candidate at <InlineMath tex={String.raw`t`} /> is <em>accepted</em> with thinning probability:
      </p>
      <Equation tex={String.raw`\Pr[\text{accept } t] = \frac{\lambda(t)}{\lambda_{\max}}`} />
      <p>
        The accepted points form the arrivals <InlineMath tex={String.raw`a_1 < a_2 < \cdots`} />. Each
        patient is urgent with probability <InlineMath tex={String.raw`p_u`} /> (Bernoulli). Services are
        independent exponentials:
      </p>
      <Equation tex={String.raw`S^t_i \sim \text{Exp}(\mu_t), \qquad S^x_i \sim \text{Exp}(\mu_x), \qquad \text{discharge} = d \;\text{(constant)}`} />
      <p>
        At treatment, the priority discipline serves urgent patients first; when a bay frees up it picks the
        waiting patient with the lowest priority index (without preempting one already in service). Each
        patient's stay is its total time in system:
      </p>
      <Equation tex={String.raw`\text{LOS}_i = (\text{wait}^t_i + S^t_i) + (\text{wait}^x_i + S^x_i) + d`} />
      <p>
        The bottleneck-load indicator is the offered utilization of treatment (stable when{" "}
        <InlineMath tex={String.raw`\rho < 1`} />):
      </p>
      <Equation tex={String.raw`\rho = \frac{\lambda}{c_x\,\mu_x}`} />

      <h3>Scope &amp; assumptions</h3>
      <ul>
        <li>
          <strong>Modeled:</strong> multi-stage flow under finite resources, per-station queues, 2-class
          priority at the bottleneck, non-stationary arrivals, and per-class LOS.
        </li>
        <li>
          <strong>Markovian:</strong> Poisson arrivals (via thinning) and exponential services{" "}
          <InlineMath tex={String.raw`\Rightarrow`} /> the core is Markovian; priority and non-stationarity
          push it out of any simple closed form, hence simulation.
        </li>
        <li>
          <strong>Seeded / reproducible:</strong> all variates (arrivals, classes, services) are drawn up
          front under a fixed seed; the same seed reproduces exactly the same trace.
        </li>
        <li>
          <strong>Stationary:</strong> no — the intensity <InlineMath tex={String.raw`\lambda(t)`} /> is
          deliberately time-varying (surge transient).
        </li>
        <li>
          <strong>Out of scope:</strong> abandonment/balking (LWBS), dynamic re-prioritization, preemption,
          finite-capacity queues, re-entry, resources shared across stages, and costs. Discharge is a fixed
          delay, not a distribution.
        </li>
      </ul>

      <p>
        <strong>What each variant shows.</strong> <em>Calm</em>/<em>Typical</em>/<em>Busy</em>/<em>Overloaded</em>{" "}
        sweep <InlineMath tex={String.raw`\lambda`} /> to drive treatment utilization{" "}
        <InlineMath tex={String.raw`\rho`} /> from slack to <InlineMath tex={String.raw`\ge 1`} /> (queues
        blow up); <em>Daytime surge</em> sets <InlineMath tex={String.raw`s=1`} /> to show the transient
        stress of a mid-shift spike; <em>Understaffed</em>/<em>Well-staffed</em> move{" "}
        <InlineMath tex={String.raw`c_x`} /> (one fewer bay tightens the bottleneck, one extra absorbs it);{" "}
        <em>Single triage nurse</em> drops <InlineMath tex={String.raw`c_t=1`} /> to create an upstream
        bottleneck; <em>Many urgent</em>/<em>Few urgent</em> vary{" "}
        <InlineMath tex={String.raw`p_u`} /> to show how priority reshapes who waits (urgent LOS falls at the
        expense of standard LOS).
      </p>
      <p>
        <strong>How to read the viz.</strong> Patients flow through the three stations left to right;{" "}
        <strong>red</strong> = urgent, <strong>blue/accent</strong> = standard. Each station's queue length
        shows where waiting accumulates (watch treatment as <InlineMath tex={String.raw`\rho \to 1`} />). In
        the HUD/KPIs: total <InlineMath tex={String.raw`\overline{\text{LOS}}`} /> and per-class{" "}
        (<InlineMath tex={String.raw`\overline{\text{LOS}}_u`} /> vs{" "}
        <InlineMath tex={String.raw`\overline{\text{LOS}}_s`} />) make the priority effect visible, the mean
        wait to treatment marks bottleneck severity, and <InlineMath tex={String.raw`\rho`} /> tells you
        whether the regime is stable.
      </p>
    </>
  );
}

function S06Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: programar un taller (job-shop) minimizando el makespan — instancia canónica Fisher–Thompson ft06 (6×6, óptimo probado 55)</h2>
      <p>
        <strong>El problema.</strong> Un <em>taller de trabajos</em> (job-shop) procesa varios trabajos, cada uno definido como una <strong>secuencia ordenada de operaciones</strong>; cada operación necesita una <strong>máquina específica</strong> durante un <strong>tiempo fijo</strong>. Cada máquina hace una sola operación a la vez y, dentro de un trabajo, las operaciones se ejecutan en orden. El objetivo es asignar tiempos de inicio a todas las operaciones de modo que el <strong>último trabajo termine lo antes posible</strong> (minimizar el makespan <InlineMath tex={String.raw`C_{\max}`} />). A diferencia del resto de SIMLAB, esto no es simulación estocástica sino <strong>optimización combinatoria pura</strong>: lo que resuelve un solucionador (OR-Tools CP-SAT), no lo que muestrea un simulador.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li><strong>Trabajos</strong> <InlineMath tex={String.raw`j = 1,\dots,n`} />; cada trabajo es una lista ordenada de operaciones <InlineMath tex={String.raw`(j,k)`} />, <InlineMath tex={String.raw`k = 0,\dots,m_j-1`} />.</li>
        <li><strong>Máquinas</strong> <InlineMath tex={String.raw`M = \{1,\dots,m\}`} /> (en ft06, 6 trabajos × 6 máquinas).</li>
        <li><strong>Parámetros</strong> de cada operación: la máquina requerida <InlineMath tex={String.raw`\mu(j,k)\in M`} /> y la duración fija <InlineMath tex={String.raw`d_{j,k}`} /> (enteros; en las instancias generadas <InlineMath tex={String.raw`d\in\{2,\dots,9\}`} /> con orden de máquinas barajado por semilla).</li>
        <li><strong>Variables de decisión:</strong> el inicio <InlineMath tex={String.raw`s_{j,k}\in[0,H]`} /> y el fin <InlineMath tex={String.raw`e_{j,k}=s_{j,k}+d_{j,k}`} /> de cada operación, modelados como una <em>variable de intervalo</em>; más la variable de makespan <InlineMath tex={String.raw`C_{\max}`} />. El horizonte <InlineMath tex={String.raw`H=\sum_{j,k} d_{j,k}`} /> (suma de todas las duraciones) acota las variables.</li>
      </ul>

      <h3>Formalización</h3>
      <p>
        Es un modelo de <strong>programación por restricciones</strong> resuelto por <strong>CP-SAT</strong> (constraint programming + SAT), con la restricción <strong>disyuntiva</strong> clásica de máquina. Cada operación es un intervalo <InlineMath tex={String.raw`[s_{j,k},\,s_{j,k}+d_{j,k})`} />. La <strong>precedencia</strong> dentro de cada trabajo impone que la operación <InlineMath tex={String.raw`k`} /> no comience antes de que termine la <InlineMath tex={String.raw`k-1`} />:
      </p>
      <Equation tex={String.raw`s_{j,k} \;\ge\; e_{j,k-1} \;=\; s_{j,k-1} + d_{j,k-1}, \qquad k \ge 1.`} />
      <p>
        La restricción <strong>disyuntiva (no-solapamiento)</strong> de cada máquina exige que sus intervalos asignados nunca se solapen — esto es <InlineMath tex={String.raw`\texttt{AddNoOverlap}`} /> sobre el conjunto de intervalos de la máquina <InlineMath tex={String.raw`m`} />, equivalente a la disyunción por cada par de operaciones <InlineMath tex={String.raw`(j,k),(j',k')`} /> que comparten esa máquina:
      </p>
      <Equation tex={String.raw`\bigl(e_{j,k} \le s_{j',k'}\bigr) \;\lor\; \bigl(e_{j',k'} \le s_{j,k}\bigr).`} />
      <p>El makespan iguala el mayor de los finales de la última operación de cada trabajo, y se minimiza:</p>
      <Equation tex={String.raw`C_{\max} \;=\; \max_{j}\, e_{j,\,m_j-1}, \qquad \min\; C_{\max}.`} />

      <h3>Alcances y supuestos</h3>
      <ul>
        <li><strong>Determinista, no estocástico:</strong> no hay aleatoriedad en el modelo; las duraciones son fijas. Las instancias generadas son <em>sembradas</em> (semilla por variante) y CP-SAT corre con un <em>worker</em> único y <InlineMath tex={String.raw`\texttt{random\_seed}=42`} />, así el horario óptimo es reproducible y se precomputa (OR-Tools es código nativo).</li>
        <li><strong>Supuestos:</strong> sin preempción (una operación, una vez iniciada, ocupa la máquina hasta terminar); máquinas siempre disponibles; sin tiempos de setup, transporte ni fechas de entrega; cada operación usa exactamente una máquina.</li>
        <li><strong>Fuera de alcance:</strong> tiempos estocásticos, averías, rutas alternativas, objetivos distintos del makespan (tardanza, costo) y restricciones de recursos compartidos.</li>
        <li>El solver reporta <InlineMath tex={String.raw`\texttt{OPTIMAL}`} /> u <InlineMath tex={String.raw`\texttt{FEASIBLE}`} /> (límite de 10 s). Para <strong>ft06</strong> el óptimo probado es <InlineMath tex={String.raw`C_{\max}=55`} />.</li>
      </ul>

      <p>
        <strong>Qué muestra cada variante.</strong> <em>ft06</em> es el benchmark clásico de Fisher–Thompson (1963), 6×6, con óptimo probado de 55 — el caso de referencia. Las variantes generadas exploran la <strong>contención</strong>: <em>j3m3</em> es diminuta y óptima al instante; <em>j4m3</em>, <em>j5m4</em>, <em>j6m4</em> y <em>j8m4</em> tienen más trabajos que máquinas (más cola, makespan más largo); <em>j4m4</em>, <em>j5m5</em> y <em>j6m6</em> son talleres cuadrados (balanceados); <em>j4m6</em> tiene más máquinas que trabajos y por eso un makespan corto. La lección: a igualdad de carga, menos máquinas que trabajos eleva el makespan.
      </p>
      <p>
        <strong>Cómo leer la visualización.</strong> Es un <strong>diagrama de Gantt</strong>: cada fila es una máquina <InlineMath tex={String.raw`M_i`} /> y cada bloque es una operación, coloreada por <strong>trabajo</strong> (el mismo color recorre todas las operaciones de un trabajo). El ancho del bloque es su duración <InlineMath tex={String.raw`d_{j,k}`} />; los huecos en una fila son tiempo ocioso de esa máquina. La animación barre una línea de tiempo de izquierda a derecha como si el horario se ejecutara, y la línea final marca <InlineMath tex={String.raw`C_{\max}`} />. El HUD/KPIs muestran el makespan, si es óptimo, el número de trabajos/máquinas/operaciones y la <strong>utilización</strong> <InlineMath tex={String.raw`= \frac{\sum_{j,k} d_{j,k}}{C_{\max}\cdot m}`} /> (fracción del área del Gantt realmente ocupada).
      </p>
    </>
  ) : (
    <>
      <h2>The problem: scheduling a job-shop to minimize the makespan — canonical Fisher–Thompson ft06 instance (6×6, proven optimum 55)</h2>
      <p>
        <strong>The problem.</strong> A <em>job-shop</em> processes several jobs, each defined as an <strong>ordered sequence of operations</strong>; every operation needs a <strong>specific machine</strong> for a <strong>fixed time</strong>. Each machine does one operation at a time, and within a job operations run in order. The goal is to assign start times to all operations so the <strong>last job finishes as early as possible</strong> (minimize the makespan <InlineMath tex={String.raw`C_{\max}`} />). Unlike the rest of SIMLAB, this is not stochastic simulation but <strong>pure combinatorial optimization</strong>: what a solver computes (OR-Tools CP-SAT), not what a simulator samples.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li><strong>Jobs</strong> <InlineMath tex={String.raw`j = 1,\dots,n`} />; each job is an ordered list of operations <InlineMath tex={String.raw`(j,k)`} />, <InlineMath tex={String.raw`k = 0,\dots,m_j-1`} />.</li>
        <li><strong>Machines</strong> <InlineMath tex={String.raw`M = \{1,\dots,m\}`} /> (in ft06, 6 jobs × 6 machines).</li>
        <li><strong>Per-operation parameters:</strong> the required machine <InlineMath tex={String.raw`\mu(j,k)\in M`} /> and the fixed duration <InlineMath tex={String.raw`d_{j,k}`} /> (integers; in generated instances <InlineMath tex={String.raw`d\in\{2,\dots,9\}`} /> with the machine order seed-shuffled).</li>
        <li><strong>Decision variables:</strong> the start <InlineMath tex={String.raw`s_{j,k}\in[0,H]`} /> and end <InlineMath tex={String.raw`e_{j,k}=s_{j,k}+d_{j,k}`} /> of each operation, modeled as an <em>interval variable</em>; plus the makespan variable <InlineMath tex={String.raw`C_{\max}`} />. The horizon <InlineMath tex={String.raw`H=\sum_{j,k} d_{j,k}`} /> (sum of all durations) bounds the variables.</li>
      </ul>

      <h3>Formalization</h3>
      <p>
        This is a <strong>constraint-programming</strong> model solved by <strong>CP-SAT</strong> (constraint programming + SAT), with the classic <strong>disjunctive</strong> machine constraint. Each operation is an interval <InlineMath tex={String.raw`[s_{j,k},\,s_{j,k}+d_{j,k})`} />. <strong>Precedence</strong> within a job forces operation <InlineMath tex={String.raw`k`} /> not to start before operation <InlineMath tex={String.raw`k-1`} /> finishes:
      </p>
      <Equation tex={String.raw`s_{j,k} \;\ge\; e_{j,k-1} \;=\; s_{j,k-1} + d_{j,k-1}, \qquad k \ge 1.`} />
      <p>
        Each machine's <strong>disjunctive (no-overlap)</strong> constraint requires its assigned intervals never to overlap — this is <InlineMath tex={String.raw`\texttt{AddNoOverlap}`} /> over the set of intervals of machine <InlineMath tex={String.raw`m`} />, equivalent to the disjunction for every pair of operations <InlineMath tex={String.raw`(j,k),(j',k')`} /> sharing that machine:
      </p>
      <Equation tex={String.raw`\bigl(e_{j,k} \le s_{j',k'}\bigr) \;\lor\; \bigl(e_{j',k'} \le s_{j,k}\bigr).`} />
      <p>The makespan equals the largest finish time of each job's last operation, and is minimized:</p>
      <Equation tex={String.raw`C_{\max} \;=\; \max_{j}\, e_{j,\,m_j-1}, \qquad \min\; C_{\max}.`} />

      <h3>Scope &amp; assumptions</h3>
      <ul>
        <li><strong>Deterministic, not stochastic:</strong> there is no randomness in the model; durations are fixed. Generated instances are <em>seeded</em> (per-variant seed) and CP-SAT runs single-worker with <InlineMath tex={String.raw`\texttt{random\_seed}=42`} />, so the optimal schedule is reproducible and precomputed (OR-Tools is native code).</li>
        <li><strong>Assumptions:</strong> no preemption (once started, an operation holds the machine until done); machines always available; no setup, transport or due dates; each operation uses exactly one machine.</li>
        <li><strong>Out of scope:</strong> stochastic times, breakdowns, alternative routings, objectives other than makespan (tardiness, cost) and shared-resource constraints.</li>
        <li>The solver reports <InlineMath tex={String.raw`\texttt{OPTIMAL}`} /> or <InlineMath tex={String.raw`\texttt{FEASIBLE}`} /> (10 s cap). For <strong>ft06</strong> the proven optimum is <InlineMath tex={String.raw`C_{\max}=55`} />.</li>
      </ul>

      <p>
        <strong>What each variant shows.</strong> <em>ft06</em> is the classic Fisher–Thompson (1963) benchmark, 6×6, with proven optimum 55 — the reference case. The generated variants probe <strong>contention</strong>: <em>j3m3</em> is tiny and instantly optimal; <em>j4m3</em>, <em>j5m4</em>, <em>j6m4</em> and <em>j8m4</em> have more jobs than machines (more queueing, longer makespan); <em>j4m4</em>, <em>j5m5</em> and <em>j6m6</em> are square (balanced) shops; <em>j4m6</em> has more machines than jobs and therefore a short makespan. The lesson: at equal load, fewer machines than jobs raises the makespan.
      </p>
      <p>
        <strong>How to read the viz.</strong> It is a <strong>Gantt chart</strong>: each row is a machine <InlineMath tex={String.raw`M_i`} /> and each block is an operation, colored by <strong>job</strong> (one color runs through all of a job's operations). A block's width is its duration <InlineMath tex={String.raw`d_{j,k}`} />; gaps in a row are that machine's idle time. The animation sweeps a timeline left to right as if the schedule were executing, and the final line marks <InlineMath tex={String.raw`C_{\max}`} />. The HUD/KPIs show the makespan, whether it is optimal, the number of jobs/machines/operations, and the <strong>utilization</strong> <InlineMath tex={String.raw`= \frac{\sum_{j,k} d_{j,k}}{C_{\max}\cdot m}`} /> (the fraction of the Gantt area actually occupied).
      </p>
    </>
  );
}

function S05Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El efecto bullwhip en una cadena de suministro de 4 eslabones (el Beer Game del MIT)</h2>
      <p><strong>El problema:</strong> en una cadena en serie minorista → mayorista → distribuidor → fábrica, cada eslabón solo ve las órdenes de su cliente inmediato y, para protegerse del <em>lead time</em> de envío, repone con una política <em>order-up-to</em> sobre un pronóstico suavizado. El resultado clásico (Lee, Padmanabhan {"&"} Whang, 1997) es que un cambio modesto y único en la demanda del cliente final se <strong>amplifica</strong> en oscilaciones de órdenes cada vez más violentas a medida que se sube por la cadena: el <em>bullwhip effect</em>. La instancia canónica es el Beer Game: demanda base de 8 unidades/semana que recibe un escalón en la semana 6, con 52 semanas, lead time <InlineMath tex={String.raw`L`} /> y suavizado <InlineMath tex={String.raw`\theta`} />.</p>

      <h3>Componentes y variables</h3>
      <ul>
        <li><strong>Eslabones</strong> <InlineMath tex={String.raw`i \in \{1,2,3,4\}`} />: minorista, mayorista, distribuidor, fábrica, en serie.</li>
        <li><strong>Horizonte</strong> <InlineMath tex={String.raw`t = 1 \dots W`} /> semanas (<InlineMath tex={String.raw`W = 52`} /> por defecto).</li>
        <li><strong>Parámetros:</strong> lead time entero <InlineMath tex={String.raw`L`} /> (1–6 sem), suavizado <InlineMath tex={String.raw`\theta \in (0,1)`} />, demanda base <InlineMath tex={String.raw`d_0 = 8`} />, magnitud del cambio <InlineMath tex={String.raw`\Delta`} /> y patrón de demanda (escalón / pico / ruido AR(1)).</li>
        <li><strong>Entrada de cada eslabón:</strong> <InlineMath tex={String.raw`r^{(i)}_t`} /> = órdenes que recibe (para <InlineMath tex={String.raw`i=1`} /> es la demanda del cliente; para <InlineMath tex={String.raw`i>1`} /> son las órdenes que emitió el eslabón aguas abajo).</li>
        <li><strong>Estado/decisión:</strong> pronóstico suavizado <InlineMath tex={String.raw`F^{(i)}_t`} />, nivel objetivo order-up-to <InlineMath tex={String.raw`S^{(i)}_t`} /> y la orden emitida <InlineMath tex={String.raw`o^{(i)}_t`} /> (la decisión).</li>
      </ul>

      <h3>Formalización</h3>
      <p>Es un <strong>modelo basado en agentes (ABM)</strong> determinista y secuencial: cada eslabón corre una <strong>política order-up-to (base-stock) con pronóstico de suavizado exponencial</strong>. El pronóstico de la demanda recibida es exponencial simple:</p>
      <Equation tex={String.raw`F^{(i)}_t = \theta\, r^{(i)}_t + (1-\theta)\, F^{(i)}_{t-1}, \qquad F^{(i)}_0 = d_0`} />
      <p>El nivel order-up-to cubre el lead time más el período actual, <InlineMath tex={String.raw`L+1`} /> períodos de pronóstico:</p>
      <Equation tex={String.raw`S^{(i)}_t = (L+1)\, F^{(i)}_t`} />
      <p>La orden repone lo consumido más el ajuste del nivel objetivo (no-negativa):</p>
      <Equation tex={String.raw`o^{(i)}_t = \max\!\big(0,\; r^{(i)}_t + (S^{(i)}_t - S^{(i)}_{t-1})\big)`} />
      <p>El acoplamiento en serie es <InlineMath tex={String.raw`r^{(i+1)}_t = o^{(i)}_t`} />: las órdenes de un eslabón son la demanda del siguiente. La métrica de amplificación es la <strong>razón de bullwhip</strong> por eslabón:</p>
      <Equation tex={String.raw`B_i = \frac{\operatorname{Var}(o^{(i)})}{\operatorname{Var}(d)}`} />
      <p>El sello del bullwhip es <InlineMath tex={String.raw`B_1 \le B_2 \le B_3 \le B_4`} /> con <InlineMath tex={String.raw`B_i > 1`} />: la varianza de las órdenes crece eslabón a eslabón hacia la fábrica.</p>

      <h3>Alcances y supuestos</h3>
      <ul>
        <li><strong>Determinista y seeded:</strong> los patrones escalón y pico son exactos; el patrón ruidoso usa un proceso AR(1), <InlineMath tex={String.raw`e_t = 0.6\, e_{t-1} + \varepsilon_t`} /> con <InlineMath tex={String.raw`\varepsilon_t \sim \mathcal{N}(0, (\Delta/2)^2)`} />, sembrado por la semilla — reproducible.</li>
        <li><strong>Estados iniciales:</strong> <InlineMath tex={String.raw`F^{(i)}_0 = d_0 = 8`} /> y <InlineMath tex={String.raw`S^{(i)}_{-1} = (L+1)\,d_0`} /> en todos los eslabones (estado estacionario antes del shock).</li>
        <li><strong>Modelado:</strong> la dinámica de las órdenes y su amplificación; mismo <InlineMath tex={String.raw`L`} /> y <InlineMath tex={String.raw`\theta`} /> para los cuatro eslabones.</li>
        <li><strong>Fuera de alcance:</strong> inventario físico, backorders, costos de mantención/quiebre, retrasos de información distintos del lead time, y políticas heterogéneas por eslabón. No se optimiza ningún costo; el objetivo es <em>exhibir</em> la amplificación, no minimizarla.</li>
      </ul>

      <p><strong>Qué muestra cada variante:</strong> <em>L1–L4</em> barren el lead time <InlineMath tex={String.raw`L \in \{1,2,3,4\}`} /> a <InlineMath tex={String.raw`\theta=0.4`} />: a mayor <InlineMath tex={String.raw`L`} />, el factor <InlineMath tex={String.raw`(L+1)`} /> del nivel objetivo amplifica más y <em>L4</em> produce oscilaciones upstream violentas. <em>theta20/theta40/theta70</em> fijan <InlineMath tex={String.raw`L=2`} /> y varían el suavizado: un pronóstico reactivo (<InlineMath tex={String.raw`\theta=0.7`} />) persigue cada movimiento y <strong>empeora</strong> el bullwhip, mientras que <InlineMath tex={String.raw`\theta=0.2`} /> lo calma a costa de reaccionar lento. <em>bigstep</em> escala el escalón (<InlineMath tex={String.raw`\Delta=8`} />) y muestra mayor sobre-pico; <em>spike</em> es un pico de una sola semana que igual repercute hacia arriba; <em>noisy</em> usa demanda AR(1) para ver la varianza amplificarse eslabón a eslabón sin un shock único.</p>

      <p><strong>Cómo leer la visualización:</strong> el gráfico de líneas traza, por semana, la demanda del cliente (gris punteada) y las órdenes de cada eslabón: minorista (verde), mayorista (acento), distribuidor (ámbar) y fábrica (magenta). Verás cada curva más arriba y con más sobre-pico que la anterior — esa separación creciente <em>es</em> el bullwhip. Los KPIs reportan la razón de bullwhip <InlineMath tex={String.raw`B_i`} /> de los cuatro eslabones (debe crecer minorista → fábrica) y el pico de órdenes de la fábrica; compáralos entre variantes para cuantificar cuánto empeoran <InlineMath tex={String.raw`L`} /> y <InlineMath tex={String.raw`\theta`} /> la amplificación.</p>
    </>
  ) : (
    <>
      <h2>The bullwhip effect in a 4-echelon supply chain (the MIT Beer Game)</h2>
      <p><strong>The problem:</strong> in a serial chain retailer → wholesaler → distributor → factory, each echelon sees only its immediate customer's orders and, to cover the shipping <em>lead time</em>, replenishes with an <em>order-up-to</em> policy on a smoothed forecast. The classic result (Lee, Padmanabhan {"&"} Whang, 1997) is that a modest, one-off change in end-customer demand is <strong>amplified</strong> into ever-larger order swings as you move upstream: the <em>bullwhip effect</em>. The canonical instance is the Beer Game: base demand of 8 units/week receiving a step at week 6, over 52 weeks, with lead time <InlineMath tex={String.raw`L`} /> and smoothing <InlineMath tex={String.raw`\theta`} />.</p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li><strong>Echelons</strong> <InlineMath tex={String.raw`i \in \{1,2,3,4\}`} />: retailer, wholesaler, distributor, factory, in series.</li>
        <li><strong>Horizon</strong> <InlineMath tex={String.raw`t = 1 \dots W`} /> weeks (<InlineMath tex={String.raw`W = 52`} /> by default).</li>
        <li><strong>Parameters:</strong> integer lead time <InlineMath tex={String.raw`L`} /> (1–6 wk), smoothing <InlineMath tex={String.raw`\theta \in (0,1)`} />, base demand <InlineMath tex={String.raw`d_0 = 8`} />, change magnitude <InlineMath tex={String.raw`\Delta`} />, and demand pattern (step / spike / AR(1) noise).</li>
        <li><strong>Each echelon's input:</strong> <InlineMath tex={String.raw`r^{(i)}_t`} /> = orders it receives (for <InlineMath tex={String.raw`i=1`} /> the customer demand; for <InlineMath tex={String.raw`i>1`} /> the orders the downstream echelon placed).</li>
        <li><strong>State/decision:</strong> smoothed forecast <InlineMath tex={String.raw`F^{(i)}_t`} />, order-up-to target <InlineMath tex={String.raw`S^{(i)}_t`} />, and the placed order <InlineMath tex={String.raw`o^{(i)}_t`} /> (the decision).</li>
      </ul>

      <h3>Formalization</h3>
      <p>This is a deterministic, sequential <strong>agent-based model (ABM)</strong>: each echelon runs an <strong>order-up-to (base-stock) policy with an exponential-smoothing forecast</strong>. The forecast of received demand is simple exponential smoothing:</p>
      <Equation tex={String.raw`F^{(i)}_t = \theta\, r^{(i)}_t + (1-\theta)\, F^{(i)}_{t-1}, \qquad F^{(i)}_0 = d_0`} />
      <p>The order-up-to target covers the lead time plus the current period, <InlineMath tex={String.raw`L+1`} /> forecast periods:</p>
      <Equation tex={String.raw`S^{(i)}_t = (L+1)\, F^{(i)}_t`} />
      <p>The order replenishes consumption plus the target-level adjustment (clamped non-negative):</p>
      <Equation tex={String.raw`o^{(i)}_t = \max\!\big(0,\; r^{(i)}_t + (S^{(i)}_t - S^{(i)}_{t-1})\big)`} />
      <p>The serial coupling is <InlineMath tex={String.raw`r^{(i+1)}_t = o^{(i)}_t`} />: one echelon's orders are the next echelon's demand. The amplification metric is the per-echelon <strong>bullwhip ratio</strong>:</p>
      <Equation tex={String.raw`B_i = \frac{\operatorname{Var}(o^{(i)})}{\operatorname{Var}(d)}`} />
      <p>The hallmark of the bullwhip is <InlineMath tex={String.raw`B_1 \le B_2 \le B_3 \le B_4`} /> with <InlineMath tex={String.raw`B_i > 1`} />: order variance grows stage by stage toward the factory.</p>

      <h3>Scope &amp; assumptions</h3>
      <ul>
        <li><strong>Deterministic and seeded:</strong> the step and spike patterns are exact; the noisy pattern uses an AR(1) process, <InlineMath tex={String.raw`e_t = 0.6\, e_{t-1} + \varepsilon_t`} /> with <InlineMath tex={String.raw`\varepsilon_t \sim \mathcal{N}(0, (\Delta/2)^2)`} />, driven by the seed — reproducible.</li>
        <li><strong>Initial states:</strong> <InlineMath tex={String.raw`F^{(i)}_0 = d_0 = 8`} /> and <InlineMath tex={String.raw`S^{(i)}_{-1} = (L+1)\,d_0`} /> at every echelon (steady state before the shock).</li>
        <li><strong>Modeled:</strong> the order dynamics and their amplification; the same <InlineMath tex={String.raw`L`} /> and <InlineMath tex={String.raw`\theta`} /> across all four echelons.</li>
        <li><strong>Out of scope:</strong> physical inventory, backorders, holding/stockout costs, information delays other than the lead time, and per-echelon heterogeneous policies. No cost is optimized; the goal is to <em>exhibit</em> the amplification, not minimize it.</li>
      </ul>

      <p><strong>What each variant shows:</strong> <em>L1–L4</em> sweep lead time <InlineMath tex={String.raw`L \in \{1,2,3,4\}`} /> at <InlineMath tex={String.raw`\theta=0.4`} />: larger <InlineMath tex={String.raw`L`} /> means the target's <InlineMath tex={String.raw`(L+1)`} /> factor amplifies more, and <em>L4</em> produces violent upstream swings. <em>theta20/theta40/theta70</em> fix <InlineMath tex={String.raw`L=2`} /> and vary smoothing: a reactive forecast (<InlineMath tex={String.raw`\theta=0.7`} />) chases every move and <strong>worsens</strong> the bullwhip, while <InlineMath tex={String.raw`\theta=0.2`} /> calms it at the cost of slow response. <em>bigstep</em> scales the step (<InlineMath tex={String.raw`\Delta=8`} />) for a larger overshoot; <em>spike</em> is a single-week spike that still ripples upstream; <em>noisy</em> uses AR(1) demand to watch variance amplify stage by stage without a single shock.</p>

      <p><strong>How to read the viz:</strong> the line chart plots, by week, customer demand (dashed grey) and each echelon's orders: retailer (green), wholesaler (accent), distributor (amber), and factory (magenta). Each curve sits higher and overshoots more than the one before — that growing separation <em>is</em> the bullwhip. The KPIs report the bullwhip ratio <InlineMath tex={String.raw`B_i`} /> for all four echelons (it should grow retailer → factory) and the factory's peak order; compare them across variants to quantify how much <InlineMath tex={String.raw`L`} /> and <InlineMath tex={String.raw`\theta`} /> worsen the amplification.</p>
    </>
  );
}

function S10Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>
        El problema: ¿cuánto puedo confiar en una sola corrida de simulación? — el estudio de
        Monte-Carlo / IC sobre el M/M/c (μ=1, c=3, λ barrido)
      </h2>
      <p>
        <strong>El problema.</strong> Una simulación estocástica es un <em>experimento aleatorio</em>:
        una única corrida del M/M/c (el modelo de S01) entrega un número ruidoso para la espera media
        en cola <InlineMath tex={String.raw`W_q`} />, y dos semillas distintas dan respuestas distintas.
        La pregunta de <em>análisis de salida</em> es: ¿cuántas réplicas independientes necesito, y con
        qué precisión, para que mi estimador iguale la respuesta cerrada de Erlang-C? Este caso corre{" "}
        <InlineMath tex={String.raw`N`} /> réplicas sembradas, dibuja la <strong>media corriente</strong> y
        su <strong>intervalo de confianza del 95%</strong> a medida que se acumulan réplicas, y los
        contrasta contra la <InlineMath tex={String.raw`W_q`} /> de Erlang-C.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li>
          <strong>Modelo base:</strong> una cola M/M/c FCFS con tasa de llegada{" "}
          <InlineMath tex={String.raw`\lambda`} />, tasa de servicio por servidor{" "}
          <InlineMath tex={String.raw`\mu`} /> y <InlineMath tex={String.raw`c`} /> servidores;{" "}
          <InlineMath tex={String.raw`n`} /> clientes por corrida (<code>n_customers</code>, 600).
        </li>
        <li>
          <strong>Parámetros del estudio:</strong> el número de réplicas{" "}
          <InlineMath tex={String.raw`N`} /> (<code>n_reps</code>) y la semilla base; cada réplica{" "}
          <InlineMath tex={String.raw`r`} /> usa la semilla <InlineMath tex={String.raw`\text{seed}+r`} />{" "}
          (independencia reproducible).
        </li>
        <li>
          <strong>Variable aleatoria por réplica:</strong>{" "}
          <InlineMath tex={String.raw`W_q^{(r)}`} /> = espera media en cola de la réplica{" "}
          <InlineMath tex={String.raw`r`} />, obtenida por el método del servidor-libre-más-pronto.
        </li>
        <li>
          <strong>Salidas (estado del estimador):</strong> la media corriente{" "}
          <InlineMath tex={String.raw`\bar{W}_k`} />, la desviación muestral{" "}
          <InlineMath tex={String.raw`s_k`} /> y el semiancho del IC{" "}
          <InlineMath tex={String.raw`h_k`} />, todos en función del número de réplicas{" "}
          <InlineMath tex={String.raw`k`} />.
        </li>
        <li>
          <strong>Referencia (oráculo):</strong> la <InlineMath tex={String.raw`W_q`} /> cerrada de
          Erlang-C y la utilización <InlineMath tex={String.raw`\rho`} />.
        </li>
      </ul>

      <h3>Formalización</h3>
      <p>
        <strong>Clase de modelo: M/M/c</strong> (llegadas de Poisson, servicio exponencial,{" "}
        <InlineMath tex={String.raw`c`} /> servidores), estudiado por <strong>Monte-Carlo de réplicas
        independientes</strong>. La utilización (eje de carga) es:
      </p>
      <Equation
        tex={String.raw`\rho = \frac{\lambda}{c\,\mu}\,,\qquad \text{aquí } \mu=1,\ c=3 \;\Rightarrow\; \rho = \frac{\lambda}{3}\,.`}
      />
      <p>
        Cada réplica simula <InlineMath tex={String.raw`n`} /> clientes muestreando los tiempos entre
        llegadas <InlineMath tex={String.raw`\sim \text{Exp}(\lambda)`} /> y de servicio{" "}
        <InlineMath tex={String.raw`\sim \text{Exp}(\mu)`} />, asigna cada cliente al servidor que se
        libera más pronto y promedia su espera en cola, produciendo una muestra i.i.d.{" "}
        <InlineMath tex={String.raw`W_q^{(1)},\dots,W_q^{(N)}`} />. La <strong>media corriente</strong>{" "}
        tras <InlineMath tex={String.raw`k`} /> réplicas es:
      </p>
      <Equation tex={String.raw`\bar{W}_k = \frac{1}{k}\sum_{r=1}^{k} W_q^{(r)}\,.`} />
      <p>
        Con la <strong>desviación estándar muestral</strong> (corregida, <em>ddof=1</em>):
      </p>
      <Equation tex={String.raw`s_k = \sqrt{\frac{1}{k-1}\sum_{r=1}^{k}\bigl(W_q^{(r)}-\bar{W}_k\bigr)^2}\,,`} />
      <p>
        el <strong>semiancho del IC del 95%</strong> (aproximación normal, <InlineMath tex={String.raw`z=1.96`} />) es:
      </p>
      <Equation tex={String.raw`h_k = z\,\frac{s_k}{\sqrt{k}} = 1.96\,\frac{s_k}{\sqrt{k}}\,,\qquad \text{IC}_{95\%} = \bigl[\,\bar{W}_k - h_k,\ \bar{W}_k + h_k\,\bigr].`} />
      <p>
        Por la ley de los grandes números <InlineMath tex={String.raw`\bar{W}_k \to W_q`} /> y el
        semiancho se cierra como <InlineMath tex={String.raw`h_k \propto 1/\sqrt{k}`} />: cuadruplicar
        las réplicas reduce a la mitad el IC. El oráculo es la espera cerrada de Erlang-C con carga
        ofrecida <InlineMath tex={String.raw`a=\lambda/\mu`} />:
      </p>
      <Equation tex={String.raw`W_q = \frac{C(c,a)}{c\mu - \lambda}\,,\qquad C(c,a)=\frac{\dfrac{a^{c}}{c!}\dfrac{1}{1-\rho}}{\displaystyle\sum_{n=0}^{c-1}\frac{a^{n}}{n!}+\frac{a^{c}}{c!}\frac{1}{1-\rho}}\,.`} />
      <p>
        La <strong>varianza por réplica crece con la carga</strong>: al subir{" "}
        <InlineMath tex={String.raw`\rho`} /> los <InlineMath tex={String.raw`W_q^{(r)}`} /> se dispersan
        más, así que <InlineMath tex={String.raw`s_k`} /> y por tanto <InlineMath tex={String.raw`h_k`} />{" "}
        crecen — se necesitan más réplicas para la misma precisión. En el <strong>caso inestable</strong>{" "}
        <InlineMath tex={String.raw`\rho \ge 1`} /> (es decir <InlineMath tex={String.raw`\lambda \ge c\mu`} />)
        no hay estado estacionario: Erlang-C no devuelve <InlineMath tex={String.raw`W_q`} /> finito (la
        referencia es nula, sin línea de teoría) y la media muestral simplemente crece con{" "}
        <InlineMath tex={String.raw`n`} /> en vez de converger.
      </p>

      <h3>Alcances y supuestos</h3>
      <p>
        <strong>Modela:</strong> el estudio de análisis-de-salida puro — la convergencia del estimador
        y la contracción del IC para la <InlineMath tex={String.raw`W_q`} /> del M/M/c. <strong>Supuestos:</strong>{" "}
        markoviano (llegadas Poisson, servicio exponencial); réplicas <em>independientes y sembradas</em>{" "}
        (la réplica <InlineMath tex={String.raw`r`} /> usa <InlineMath tex={String.raw`\text{seed}+r`} />,
        de modo que toda la figura es reproducible bit a bit); el IC asume normalidad asintótica de la
        media (válida por el TLC para <InlineMath tex={String.raw`N`} /> moderado), no normalidad de los{" "}
        <InlineMath tex={String.raw`W_q^{(r)}`} /> individuales. <strong>Fuera de alcance:</strong> el
        sesgo del transitorio de arranque (no hay descarte de calentamiento — cada{" "}
        <InlineMath tex={String.raw`W_q^{(r)}`} /> es el promedio de la corrida completa), los IC
        bootstrap/t-Student, y la asignación de presupuesto entre largo de corrida{" "}
        <InlineMath tex={String.raw`n`} /> y número de réplicas <InlineMath tex={String.raw`N`} />. Solver
        numérico (NumPy) ⇒ caso <strong>precomputado</strong> (lane de N corridas), sin modo en vivo.
      </p>

      <p>
        <strong>Qué muestra cada variante.</strong> El barrido de <em>réplicas</em> a carga fija{" "}
        <strong>rep50_mod → rep200_mod → rep500_mod</strong> (<InlineMath tex={String.raw`\rho\approx0.67`} />)
        muestra el IC cerrándose como <InlineMath tex={String.raw`1/\sqrt{N}`} /> hasta quedar centrado en
        la teoría. El barrido de <em>carga</em> a 200 réplicas{" "}
        <strong>rep200_light (<InlineMath tex={String.raw`\rho\approx0.50`} />) → rep200_busy (0.80) →
        rep200_heavy (0.90)</strong> muestra cómo la varianza por corrida crece con{" "}
        <InlineMath tex={String.raw`\rho`} /> y ensancha el IC. <strong>rep500_busy</strong> y{" "}
        <strong>rep500_heavy</strong> muestran que más réplicas domestican esa varianza.{" "}
        <strong>rep50_heavy</strong> es el caso peligroso (pocas réplicas + carga alta = estimador en el
        que no se debe confiar), y <strong>rep500_light</strong> el mejor caso (IC finísimo).
      </p>
      <p>
        <strong>Cómo leer la visualización.</strong> El eje x es el número de réplicas{" "}
        <InlineMath tex={String.raw`n`} />; el eje y la espera media <InlineMath tex={String.raw`W_q`} />.
        La línea <strong>magenta</strong> es la media corriente <InlineMath tex={String.raw`\bar{W}_k`} />;
        la <strong>banda</strong> sombreada a su alrededor es el IC del 95%{" "}
        <InlineMath tex={String.raw`[\bar{W}_k-h_k,\ \bar{W}_k+h_k]`} /> — obsérvala estrecharse a medida
        que entran réplicas. La línea de referencia <strong>verde</strong> es la teoría Erlang-C (ausente
        cuando <InlineMath tex={String.raw`\rho\ge1`} />). Las <strong>barras</strong> tenues son el
        histograma de los <InlineMath tex={String.raw`W_q^{(r)}`} /> por corrida (su anchura{" "}
        <em>es</em> la varianza que dilata el IC). El HUD/KPIs reportan{" "}
        <code>final_mean</code>, <code>ci_halfwidth</code> (<InlineMath tex={String.raw`h_N`} />),{" "}
        <code>theory_Wq</code>, el <code>rel_error_pct</code>{" "}
        <InlineMath tex={String.raw`100\,|\bar{W}_N - W_q|/W_q`} />, <code>n_reps</code> y{" "}
        <InlineMath tex={String.raw`\rho`} />.
      </p>
    </>
  ) : (
    <>
      <h2>
        The problem: how much can I trust a single simulation run? — the Monte-Carlo / CI study of the
        M/M/c (μ=1, c=3, λ swept)
      </h2>
      <p>
        <strong>The problem.</strong> A stochastic simulation is a <em>random experiment</em>: a single
        run of the M/M/c (the S01 model) returns a noisy number for the mean wait in queue{" "}
        <InlineMath tex={String.raw`W_q`} />, and two seeds give two different answers. The{" "}
        <em>output-analysis</em> question is: how many independent replications do I need, and at what
        precision, for my estimator to match the closed-form Erlang-C answer? This case runs{" "}
        <InlineMath tex={String.raw`N`} /> seeded replications, plots the <strong>running mean</strong> and
        its <strong>95% confidence interval</strong> as replications accumulate, and compares them against
        the Erlang-C <InlineMath tex={String.raw`W_q`} />.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li>
          <strong>Base model:</strong> an M/M/c FCFS queue with arrival rate{" "}
          <InlineMath tex={String.raw`\lambda`} />, per-server service rate{" "}
          <InlineMath tex={String.raw`\mu`} /> and <InlineMath tex={String.raw`c`} /> servers;{" "}
          <InlineMath tex={String.raw`n`} /> customers per run (<code>n_customers</code>, 600).
        </li>
        <li>
          <strong>Study parameters:</strong> the number of replications{" "}
          <InlineMath tex={String.raw`N`} /> (<code>n_reps</code>) and the base seed; each replication{" "}
          <InlineMath tex={String.raw`r`} /> uses seed <InlineMath tex={String.raw`\text{seed}+r`} />{" "}
          (reproducible independence).
        </li>
        <li>
          <strong>Per-replication random variable:</strong>{" "}
          <InlineMath tex={String.raw`W_q^{(r)}`} /> = mean wait in queue of replication{" "}
          <InlineMath tex={String.raw`r`} />, obtained by the earliest-free-server method.
        </li>
        <li>
          <strong>Outputs (estimator state):</strong> the running mean{" "}
          <InlineMath tex={String.raw`\bar{W}_k`} />, the sample standard deviation{" "}
          <InlineMath tex={String.raw`s_k`} /> and the CI half-width{" "}
          <InlineMath tex={String.raw`h_k`} />, all as a function of the replication count{" "}
          <InlineMath tex={String.raw`k`} />.
        </li>
        <li>
          <strong>Reference (oracle):</strong> the closed-form Erlang-C{" "}
          <InlineMath tex={String.raw`W_q`} /> and the utilization <InlineMath tex={String.raw`\rho`} />.
        </li>
      </ul>

      <h3>Formalization</h3>
      <p>
        <strong>Model class: M/M/c</strong> (Poisson arrivals, exponential service,{" "}
        <InlineMath tex={String.raw`c`} /> servers), studied by <strong>independent-replication
        Monte-Carlo</strong>. The utilization (load axis) is:
      </p>
      <Equation
        tex={String.raw`\rho = \frac{\lambda}{c\,\mu}\,,\qquad \text{here } \mu=1,\ c=3 \;\Rightarrow\; \rho = \frac{\lambda}{3}\,.`}
      />
      <p>
        Each replication simulates <InlineMath tex={String.raw`n`} /> customers by sampling inter-arrival
        times <InlineMath tex={String.raw`\sim \text{Exp}(\lambda)`} /> and service times{" "}
        <InlineMath tex={String.raw`\sim \text{Exp}(\mu)`} />, assigns each customer to the
        earliest-free server and averages its queue wait, yielding an i.i.d. sample{" "}
        <InlineMath tex={String.raw`W_q^{(1)},\dots,W_q^{(N)}`} />. The <strong>running mean</strong>{" "}
        after <InlineMath tex={String.raw`k`} /> replications is:
      </p>
      <Equation tex={String.raw`\bar{W}_k = \frac{1}{k}\sum_{r=1}^{k} W_q^{(r)}\,.`} />
      <p>
        With the <strong>sample standard deviation</strong> (corrected, <em>ddof=1</em>):
      </p>
      <Equation tex={String.raw`s_k = \sqrt{\frac{1}{k-1}\sum_{r=1}^{k}\bigl(W_q^{(r)}-\bar{W}_k\bigr)^2}\,,`} />
      <p>
        the <strong>95% CI half-width</strong> (normal approximation, <InlineMath tex={String.raw`z=1.96`} />) is:
      </p>
      <Equation tex={String.raw`h_k = z\,\frac{s_k}{\sqrt{k}} = 1.96\,\frac{s_k}{\sqrt{k}}\,,\qquad \text{CI}_{95\%} = \bigl[\,\bar{W}_k - h_k,\ \bar{W}_k + h_k\,\bigr].`} />
      <p>
        By the law of large numbers <InlineMath tex={String.raw`\bar{W}_k \to W_q`} /> and the half-width
        shrinks like <InlineMath tex={String.raw`h_k \propto 1/\sqrt{k}`} />: quadrupling the replications
        halves the CI. The oracle is the closed-form Erlang-C wait with offered load{" "}
        <InlineMath tex={String.raw`a=\lambda/\mu`} />:
      </p>
      <Equation tex={String.raw`W_q = \frac{C(c,a)}{c\mu - \lambda}\,,\qquad C(c,a)=\frac{\dfrac{a^{c}}{c!}\dfrac{1}{1-\rho}}{\displaystyle\sum_{n=0}^{c-1}\frac{a^{n}}{n!}+\frac{a^{c}}{c!}\frac{1}{1-\rho}}\,.`} />
      <p>
        The <strong>per-replication variance grows with load</strong>: as{" "}
        <InlineMath tex={String.raw`\rho`} /> rises the <InlineMath tex={String.raw`W_q^{(r)}`} /> spread
        widens, so <InlineMath tex={String.raw`s_k`} /> and hence <InlineMath tex={String.raw`h_k`} />{" "}
        grow — more replications are needed for the same precision. In the <strong>unstable case</strong>{" "}
        <InlineMath tex={String.raw`\rho \ge 1`} /> (i.e. <InlineMath tex={String.raw`\lambda \ge c\mu`} />)
        there is no steady state: Erlang-C returns no finite <InlineMath tex={String.raw`W_q`} /> (the
        reference is null, no theory line) and the sample mean simply grows with{" "}
        <InlineMath tex={String.raw`n`} /> instead of converging.
      </p>

      <h3>Scope &amp; assumptions</h3>
      <p>
        <strong>Models:</strong> the pure output-analysis study — estimator convergence and CI
        contraction for the M/M/c <InlineMath tex={String.raw`W_q`} />. <strong>Assumptions:</strong>{" "}
        Markovian (Poisson arrivals, exponential service); <em>independent and seeded</em> replications
        (replication <InlineMath tex={String.raw`r`} /> uses <InlineMath tex={String.raw`\text{seed}+r`} />,
        so the whole figure is bit-for-bit reproducible); the CI assumes asymptotic normality of the mean
        (valid by the CLT for moderate <InlineMath tex={String.raw`N`} />), not normality of the
        individual <InlineMath tex={String.raw`W_q^{(r)}`} />. <strong>Out of scope:</strong> start-up
        transient bias (no warm-up discard — each <InlineMath tex={String.raw`W_q^{(r)}`} /> is the full-run
        average), bootstrap/Student-t CIs, and budget allocation between run length{" "}
        <InlineMath tex={String.raw`n`} /> and replication count <InlineMath tex={String.raw`N`} />.
        Numerical solver (NumPy) ⇒ a <strong>precomputed</strong> case (an N-run lane), no live mode.
      </p>

      <p>
        <strong>What each variant shows.</strong> The <em>replication</em> sweep at fixed load{" "}
        <strong>rep50_mod → rep200_mod → rep500_mod</strong> (<InlineMath tex={String.raw`\rho\approx0.67`} />)
        shows the CI closing like <InlineMath tex={String.raw`1/\sqrt{N}`} /> until it sits on theory. The{" "}
        <em>load</em> sweep at 200 replications{" "}
        <strong>rep200_light (<InlineMath tex={String.raw`\rho\approx0.50`} />) → rep200_busy (0.80) →
        rep200_heavy (0.90)</strong> shows the per-run variance growing with{" "}
        <InlineMath tex={String.raw`\rho`} /> and widening the CI. <strong>rep500_busy</strong> and{" "}
        <strong>rep500_heavy</strong> show that more replications tame that variance.{" "}
        <strong>rep50_heavy</strong> is the danger case (few reps + high load = an untrustworthy estimate),
        and <strong>rep500_light</strong> the best case (a razor-tight CI).
      </p>
      <p>
        <strong>How to read the viz.</strong> The x-axis is the replication count{" "}
        <InlineMath tex={String.raw`n`} />; the y-axis the mean wait <InlineMath tex={String.raw`W_q`} />.
        The <strong>magenta</strong> line is the running mean <InlineMath tex={String.raw`\bar{W}_k`} />;
        the shaded <strong>band</strong> around it is the 95% CI{" "}
        <InlineMath tex={String.raw`[\bar{W}_k-h_k,\ \bar{W}_k+h_k]`} /> — watch it narrow as replications
        arrive. The <strong>green</strong> reference line is the Erlang-C theory (absent when{" "}
        <InlineMath tex={String.raw`\rho\ge1`} />). The faint <strong>bars</strong> are the histogram of
        the per-run <InlineMath tex={String.raw`W_q^{(r)}`} /> (its width <em>is</em> the variance that
        inflates the CI). The HUD/KPIs report <code>final_mean</code>, <code>ci_halfwidth</code> (
        <InlineMath tex={String.raw`h_N`} />), <code>theory_Wq</code>, the <code>rel_error_pct</code>{" "}
        <InlineMath tex={String.raw`100\,|\bar{W}_N - W_q|/W_q`} />, <code>n_reps</code> and{" "}
        <InlineMath tex={String.raw`\rho`} />.
      </p>
    </>
  );
}

function S11Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: acarreo minero multidestino — un plan óptimo de flujo vs una flota fija (planificar-luego-simular)</h2>
      <p>
        <strong>El problema.</strong> Una mina envía mineral desde varias <strong>fases</strong> (puntos de carguío, cada una con su <em>ley</em> de mineral <InlineMath tex={String.raw`g_i`} /> y una <em>disponibilidad</em> <InlineMath tex={String.raw`a_i`} />) hacia tres <strong>tipos de destino</strong>: una <strong>planta</strong> con ley objetivo <InlineMath tex={String.raw`g^{*}`} />, demanda <InlineMath tex={String.raw`D`} /> y banda <InlineMath tex={String.raw`\pm\tau`} />; un <strong>botadero</strong> (estéril); y <strong>acopios</strong> intermedios — un nodo que es sumidero y, una vez que tiene material, <em>origen</em> para viajes posteriores, con un nivel <InlineMath tex={String.raw`\ell(t)`} />. Hay dos problemas de optimización <em>acoplados</em>: el <strong>blending</strong> de la alimentación de planta (un LP) y la <strong>ejecución</strong> del plan por una flota <strong>fija</strong> de <InlineMath tex={String.raw`K`} /> camiones (un DES). La lección: un plan óptimo es necesario pero no suficiente, y bajo una flota fija <strong>la ley es lo primero que se desajusta</strong>.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li><strong>Conjuntos:</strong> fases/orígenes <InlineMath tex={String.raw`i \in S`} />, cada una con ley <InlineMath tex={String.raw`g_i`} /> y disponibilidad <InlineMath tex={String.raw`a_i`} />; las leyes de las fases <em>rodean</em> al objetivo (en el código <InlineMath tex={String.raw`g = (1.6,\,2.5,\,3.4)`} />: baja/media cerca de la planta, la rica lejos).</li>
        <li><strong>Destinos:</strong> el conjunto {"{"} planta, botadero, acopios {"}"} — la planta es un sumidero con meta de ley, el botadero un sumidero de estéril, y cada acopio un nodo sumidero-y-origen con nivel <InlineMath tex={String.raw`\ell(t)`} /> y capacidad.</li>
        <li><strong>Flota:</strong> <InlineMath tex={String.raw`K`} /> camiones (<code>n_trucks</code>) de <strong>capacidad</strong> fija <InlineMath tex={String.raw`q`} /> toneladas por viaje (<InlineMath tex={String.raw`q = 2`} /> en el código), con tiempos fijos de carga y descarga y un cargador compartido por origen.</li>
        <li><strong>Parámetros:</strong> demanda de planta <InlineMath tex={String.raw`D`} />, ley objetivo <InlineMath tex={String.raw`g^{*}`} /> y banda <InlineMath tex={String.raw`\pm\tau`} />; el costo de arista <em>graduado</em> por pendiente del terreno (penalización <InlineMath tex={String.raw`\rho`} /> al subir); y la capacidad y nivel inicial de cada acopio.</li>
        <li><strong>Variables de decisión:</strong> el <strong>plan de mezcla</strong> <InlineMath tex={String.raw`x_i \ge 0`} /> (toneladas de cada origen a la planta), que resuelve el LP; y, en la simulación, qué <strong>flujo</strong> sirve cada camión en cada ciclo — la regla de <em>despacho</em> al trabajo factible alcanzable más pronto.</li>
      </ul>

      <h3>Formalización</h3>
      <p>
        <strong>(1) LP de blending (OR-Tools GLOP).</strong> Se elige <InlineMath tex={String.raw`x_i \ge 0`} /> para minimizar la desviación de ley, linealizada con holguras <InlineMath tex={String.raw`d^{+}, d^{-} \ge 0`} />, sujeto a satisfacer la demanda, respetar la disponibilidad de cada origen y definir la ley mezclada vs el objetivo:
      </p>
      <Equation tex={String.raw`\min \; d^{+} + d^{-} \quad \text{s.a.} \quad \sum_{i \in S} x_i = D, \quad 0 \le x_i \le a_i, \quad \sum_{i \in S} g_i\,x_i - g^{*} D = d^{+} - d^{-}.`} />
      <p>
        Como las leyes <em>rodean</em> al objetivo y cada disponibilidad es limitada, ninguna fase sola satisface la planta: <strong>el plan es una mezcla genuina</strong>. <strong>(2) Costo de ruta graduado.</strong> Cada par origen→destino se rutea por el camino más corto bajo un costo de arista que solo penaliza lo cuesta arriba (Dijkstra sobre el terreno de "colinas", una suma de gaussianas):
      </p>
      <Equation tex={String.raw`\text{costo}(a \to b) = \text{dist}(a,b)\,\bigl(1 + \rho \cdot \max(0,\; \text{elev}_b - \text{elev}_a)\bigr).`} />
      <p>
        <strong>(3) Ejecución (DES).</strong> Los <InlineMath tex={String.raw`K`} /> camiones ciclan carga → acarreo graduado → descarga → retorno; el despacho elige el flujo factible <em>alcanzable más pronto</em> manteniendo la planta como prioridad. La <strong>ley lograda</strong> sobre lo realmente entregado a la planta y la <strong>adherencia al plan</strong> son:
      </p>
      <Equation tex={String.raw`\hat{g} = \frac{\sum (\text{tons} \cdot g_{\text{src}})}{\sum \text{tons}}, \qquad \text{adherencia} = \frac{\sum_f \text{entregado}_f}{\sum_f \text{planificado}_f}.`} />
      <p>
        Un acopio tiene nivel <InlineMath tex={String.raw`\ell(t)`} /> que <em>sube</em> al recibir un viaje y <em>baja</em> al despachar uno (requiere <InlineMath tex={String.raw`\ell \ge q`} /> para poder originar). El LP es nativo (OR-Tools GLOP) y la ejecución es un DES con cola de eventos por instante de arribo.
      </p>

      <h3>Alcances y supuestos</h3>
      <p>
        <strong>Modela:</strong> un <em>turno</em> con fases, leyes, demanda y disponibilidad <strong>dadas</strong>; el plan óptimo de flujo + blending; y su realización por una flota fija bajo rutas graduadas, contención de cargador y disponibilidad de áreas. La corrida es <strong>determinística y con semilla</strong> — todo depende de <InlineMath tex={String.raw`(\text{params}, \text{seed})`} /> y no del entrelazado del planificador de eventos. <strong>Supuestos:</strong> capacidad de camión <InlineMath tex={String.raw`q`} /> y tiempos de servicio fijos; el LP es <strong>estático</strong> (no re-optimiza en vivo). <strong>Queda fuera de alcance</strong> (sería otra herramienta): la planificación por períodos / secuenciamiento de bloques, la <em>ley de corte</em> (Lane), y el despacho re-optimizando en tiempo real. Como el solver es nativo, este es un caso <strong>precomputado</strong> (sin modo en vivo): la traza commiteada reproduce el plan + la flota realizando una versión degradada de él.
      </p>

      <p>
        <strong>Qué muestra cada variante.</strong> <em>undertrucked → base → overtrucked</em>: la misma demanda con flota creciente — la ley sube de muy baja a dentro de la banda al realizarse el plan. <em>two_phase_rich</em>: una meta alta exige la fase rica lejana, que una flota chica no alcanza. <em>tight_grade</em>: una banda angosta hace que pequeñas desviaciones por flota ya salgan de especificación. <em>surge / surge12</em>: un alza de demanda desajusta la ley hasta sumar camiones. <em>stock_source</em>: un acopio rico pre-armado alimenta la planta — mira la barra <em>vaciarse</em>. <em>stock_buffer</em>: un acopio se <em>llena</em> desde una fase mientras corre la planta. <em>low_target</em>: meta baja apoyada en fases cercanas (fácil en ley). <em>dump_heavy</em>: poca planta, casi toda la producción al botadero. <em>barrier</em>: un muro alarga la ruta de la fase rica, agravando el desvío.
      </p>
      <p>
        <strong>Cómo leer la viz.</strong> Nodos: <strong>fases</strong> (acento), <strong>planta</strong> (verde, meta de ley), <strong>botadero</strong> (ámbar) y <strong>acopio</strong> (magenta) con una <strong>barra de nivel</strong> que sube/baja siguiendo <InlineMath tex={String.raw`\ell(t)`} />; las polilíneas de color son los flujos planificados; los camiones suben lento por la ruta graduada y vuelven rápido vacíos. El HUD de planta cuenta los viajes y compara <strong>ley lograda <InlineMath tex={String.raw`\hat{g}`} /> vs objetivo <InlineMath tex={String.raw`g^{*}`} /></strong> y la <strong>adherencia al plan</strong> al cambiar la flota: cuando la flota es insuficiente, la barra del acopio y los viajes a planta se quedan cortos y <InlineMath tex={String.raw`\hat{g}`} /> se cae bajo la banda.
      </p>
    </>
  ) : (
    <>
      <h2>The problem: multi-destination mine haul — an optimal flow plan vs a fixed fleet (plan-then-simulate)</h2>
      <p>
        <strong>The problem.</strong> A mine sends ore from several <strong>phases</strong> (load points, each with an ore <em>grade</em> <InlineMath tex={String.raw`g_i`} /> and an <em>availability</em> <InlineMath tex={String.raw`a_i`} />) to three <strong>destination kinds</strong>: a <strong>plant</strong> with grade target <InlineMath tex={String.raw`g^{*}`} />, demand <InlineMath tex={String.raw`D`} /> and band <InlineMath tex={String.raw`\pm\tau`} />; a <strong>dump</strong> (waste); and intermediate <strong>stockpiles</strong> — a node that is a sink and, once it holds material, a <em>source</em> for later trips, with a level <InlineMath tex={String.raw`\ell(t)`} />. Two <em>coupled</em> optimization problems: the plant-feed <strong>blend</strong> (an LP) and a <strong>fixed</strong> fleet of <InlineMath tex={String.raw`K`} /> trucks <strong>executing</strong> the plan (a DES). The lesson: an optimal plan is necessary but not sufficient, and under a fixed fleet <strong>the grade slips first</strong>.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li><strong>Sets:</strong> phases/sources <InlineMath tex={String.raw`i \in S`} />, each with grade <InlineMath tex={String.raw`g_i`} /> and availability <InlineMath tex={String.raw`a_i`} />; the phase grades <em>straddle</em> the target (in the code <InlineMath tex={String.raw`g = (1.6,\,2.5,\,3.4)`} />: low/mid near the plant, the rich one far).</li>
        <li><strong>Destinations:</strong> the set {"{"} plant, dump, stocks {"}"} — the plant is a sink with a grade target, the dump a waste sink, and each stock a sink-and-source node with level <InlineMath tex={String.raw`\ell(t)`} /> and capacity.</li>
        <li><strong>Fleet:</strong> <InlineMath tex={String.raw`K`} /> trucks (<code>n_trucks</code>) of fixed <strong>capacity</strong> <InlineMath tex={String.raw`q`} /> tonnes per trip (<InlineMath tex={String.raw`q = 2`} /> in the code), with fixed load/tip times and a shared loader per source.</li>
        <li><strong>Parameters:</strong> plant demand <InlineMath tex={String.raw`D`} />, grade target <InlineMath tex={String.raw`g^{*}`} /> with band <InlineMath tex={String.raw`\pm\tau`} />; the slope-<em>graded</em> edge cost (uphill penalty <InlineMath tex={String.raw`\rho`} />); and each stock's capacity and initial level.</li>
        <li><strong>Decision variables:</strong> the <strong>blend plan</strong> <InlineMath tex={String.raw`x_i \ge 0`} /> (tonnes from each source to the plant), solved by the LP; and, in the simulation, which <strong>flow</strong> each truck serves per cycle — the <em>dispatch</em> rule to the reachable-soonest feasible job.</li>
      </ul>

      <h3>Formalization</h3>
      <p>
        <strong>(1) Blending LP (OR-Tools GLOP).</strong> Choose <InlineMath tex={String.raw`x_i \ge 0`} /> to minimize the grade deviation, linearized with slacks <InlineMath tex={String.raw`d^{+}, d^{-} \ge 0`} />, subject to meeting demand, respecting each source's availability, and defining the blended grade vs the target:
      </p>
      <Equation tex={String.raw`\min \; d^{+} + d^{-} \quad \text{s.t.} \quad \sum_{i \in S} x_i = D, \quad 0 \le x_i \le a_i, \quad \sum_{i \in S} g_i\,x_i - g^{*} D = d^{+} - d^{-}.`} />
      <p>
        Because the grades <em>straddle</em> the target and each availability is capped, no single phase satisfies the plant: <strong>the plan is a genuine blend</strong>. <strong>(2) Graded route cost.</strong> Each source→destination pair is routed by the shortest path under an edge cost that penalizes only uphill (Dijkstra over the "hills" terrain, a sum of Gaussian bumps):
      </p>
      <Equation tex={String.raw`\text{cost}(a \to b) = \text{dist}(a,b)\,\bigl(1 + \rho \cdot \max(0,\; \text{elev}_b - \text{elev}_a)\bigr).`} />
      <p>
        <strong>(3) Execution (DES).</strong> The <InlineMath tex={String.raw`K`} /> trucks cycle load → graded haul → tip → return; dispatch picks the feasible flow <em>reachable soonest</em> with the plant as priority. The <strong>achieved grade</strong> over what was actually delivered to the plant and the <strong>plan adherence</strong> are:
      </p>
      <Equation tex={String.raw`\hat{g} = \frac{\sum (\text{tons} \cdot g_{\text{src}})}{\sum \text{tons}}, \qquad \text{adherence} = \frac{\sum_f \text{delivered}_f}{\sum_f \text{planned}_f}.`} />
      <p>
        A stock holds a level <InlineMath tex={String.raw`\ell(t)`} /> that <em>rises</em> on tip-in and <em>falls</em> on draw-out (it needs <InlineMath tex={String.raw`\ell \ge q`} /> to be able to source). The LP is native (OR-Tools GLOP) and the execution is a DES with an event queue keyed by arrival instant.
      </p>

      <h3>Scope &amp; assumptions</h3>
      <p>
        <strong>Models:</strong> one <em>shift</em> with phases, grades, demand and availability <strong>given</strong>; the optimal flow + blend plan; and its realization by a fixed fleet under graded routes, loader contention and area availability. The run is <strong>deterministic and seeded</strong> — everything depends on <InlineMath tex={String.raw`(\text{params}, \text{seed})`} /> and not on the event scheduler's interleaving. <strong>Assumptions:</strong> fixed truck capacity <InlineMath tex={String.raw`q`} /> and service times; the LP is <strong>static</strong> (no live re-optimization). <strong>Out of scope</strong> (a separate tool): period scheduling / block sequencing, the <em>cut-off grade</em> (Lane's algorithm), and real-time re-optimizing dispatch. Because the solver is native, this is a <strong>precomputed</strong> case (no live lane): the committed trace replays the plan + the fleet realizing a degraded version of it.
      </p>

      <p>
        <strong>What each variant shows.</strong> <em>undertrucked → base → overtrucked</em>: the same demand with a growing fleet — the grade climbs from far-off to inside the band as the plan is realized. <em>two_phase_rich</em>: a high target needs the distant rich phase a small fleet can't deliver. <em>tight_grade</em>: a narrow band makes small fleet-driven deviations miss spec. <em>surge / surge12</em>: a demand surge throws the grade off until trucks are added. <em>stock_source</em>: a pre-built rich stock feeds the plant — watch the bar <em>drain</em>. <em>stock_buffer</em>: a stock <em>fills</em> from a phase while the plant runs. <em>low_target</em>: a low target leans on the near phases (easy on grade). <em>dump_heavy</em>: little to the plant, most production to the dump. <em>barrier</em>: a wall lengthens the rich phase's road, worsening the slip.
      </p>
      <p>
        <strong>How to read the viz.</strong> Nodes: <strong>phases</strong> (accent), <strong>plant</strong> (green, grade target), <strong>dump</strong> (amber) and <strong>stock</strong> (magenta) with a <strong>fill bar</strong> that rises/falls tracking <InlineMath tex={String.raw`\ell(t)`} />; the coloured polylines are the planned flows; trucks crawl uphill on the graded route and race back empty. The plant HUD counts trips and compares <strong>grade achieved <InlineMath tex={String.raw`\hat{g}`} /> vs target <InlineMath tex={String.raw`g^{*}`} /></strong> and <strong>plan adherence</strong> as you change the fleet: when the fleet is under-sized, the stock bar and trips to the plant fall short and <InlineMath tex={String.raw`\hat{g}`} /> drops below the band.
      </p>
    </>
  );
}

function S07Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: ruteo de acarreo en faena — una cola cerrada de fuente finita (optimizar-luego-simular)</h2>
      <p>
        <strong>El problema.</strong> Una flota fija de camiones recircula sin fin entre un punto de <strong>carguío</strong> (terreno bajo) y un <strong>botadero</strong> (terreno alto), sobre una red vial sintética donde <strong>un cordón de terreno alto separa ambos</strong> y la <strong>elevación maneja el costo</strong>. Cada camión repite un ciclo de cuatro fases: <strong>carga</strong> en el cargador compartido, <strong>acarreo cargado</strong> cruzando el cordón, <strong>descarga</strong>, y <strong>retorno vacío</strong> rápido. La ruta cargada minimiza un costo de arista <em>graduado</em> que penaliza solo lo cuesta arriba, resuelto exacto con <strong>Dijkstra</strong> (el paso <em>optimizar</em>); luego un bucle de eventos discretos con semilla <em>simula</em> el ciclo. El cargador compartido es el recurso que ata: los camiones son una población finita que llama, así que es una <strong>cola de reparación de máquinas (fuente finita) M/M/1//N</strong> y el rendimiento se satura en la tasa del cargador — hay que <strong>emparejar la flota al cargador</strong> (el "factor de emparejamiento").
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li><strong>Conjuntos:</strong> nodos de junción de la grilla <InlineMath tex={String.raw`g\times g`} /> (<InlineMath tex={String.raw`g=12`} />) con un campo de elevación <InlineMath tex={String.raw`\text{elev}(n)`} />; un <strong>carguío</strong> en el borde inferior y un <strong>botadero</strong> en el superior, ambos en la columna <code>lift_col</code>.</li>
        <li><strong>Parámetros:</strong> penalización de pendiente <InlineMath tex={String.raw`\gamma`} /> (<code>grade</code>, 0–8), columna del paso <code>pass_col</code>, columna de carga/descarga <code>lift_col</code>, barrera <InlineMath tex={String.raw`\{0,1\}`} /> sobre la línea directa, número de camiones <InlineMath tex={String.raw`N`} /> (<code>n_trucks</code>, 1–14), número de cargadores <InlineMath tex={String.raw`c`} /> (<code>n_loaders</code>, 1–4), tiempo de carga <InlineMath tex={String.raw`t_L=4`} /> y de descarga <InlineMath tex={String.raw`1`} /> min, y la duración del turno <InlineMath tex={String.raw`H`} /> (<code>horizon</code>).</li>
        <li><strong>Variable de decisión (optimizar):</strong> la ruta cargada — la secuencia de nodos que minimiza el costo graduado, vía Dijkstra; el retorno vacío usa distancia simple.</li>
        <li><strong>Variables de estado (simular):</strong> el instante en que cada cargador queda libre y el número de camiones esperando en el cargador en el instante <InlineMath tex={String.raw`t`} />.</li>
        <li><strong>Métricas medidas:</strong> cargas entregadas, rendimiento por hora, tiempo medio de ciclo, espera del cargador por carga, y la pendiente de salto estimada <InlineMath tex={String.raw`g^{*}`} />.</li>
      </ul>

      <h3>Formalización</h3>
      <p>
        <strong>Costo de ruta graduado.</strong> La ruta cargada minimiza una suma de costos de arista que penaliza solo la subida (<code>loaded_cost</code> en el código): la distancia se infla por la pendiente <InlineMath tex={String.raw`\gamma`} /> veces la subida positiva <InlineMath tex={String.raw`\Delta\text{elev}=\max(0,\,\text{elev}_b-\text{elev}_a)`} />:
      </p>
      <Equation tex={String.raw`\text{cost}(a\to b)=\text{dist}(a,b)\,\big(1+\gamma\,\max(0,\,\text{elev}_b-\text{elev}_a)\big).`} />
      <p>
        <strong>Condición de salto de ruta.</strong> Sea <InlineMath tex={String.raw`(L,C)`} /> la longitud y la subida total de una ruta. La ruta <em>directa</em> sobre la cima es corta y trepa fuerte <InlineMath tex={String.raw`(L_{\text{dir}},C_{\text{dir}})`} />; el <em>desvío</em> al paso es largo y casi plano <InlineMath tex={String.raw`(L_{\text{det}},C_{\text{det}})`} />. El desvío vence cuando <InlineMath tex={String.raw`L_{\text{dir}}+\gamma\,C_{\text{dir}}>L_{\text{det}}+\gamma\,C_{\text{det}}`} />, lo que define la <strong>pendiente crítica</strong> <InlineMath tex={String.raw`g^{*}`} /> donde la ruta óptima salta directo→paso (la cantidad <code>switch</code> del código):
      </p>
      <Equation tex={String.raw`g^{*}=\frac{L_{\text{det}}-L_{\text{dir}}}{C_{\text{dir}}-C_{\text{det}}}\;=\;\frac{\Delta L}{\Delta C}\qquad(\text{aquí }g^{*}\approx 3{,}4).`} />
      <p>
        Bajo <InlineMath tex={String.raw`g^{*}`} /> gana la subida directa; sobre <InlineMath tex={String.raw`g^{*}`} /> la ruta salta al paso. Una <strong>barrera</strong> sobre la línea directa la redirige al paso independiente de la pendiente.
      </p>
      <p>
        <strong>El modelo de cola — por qué no es la M/M/c de S01.</strong> Los camiones son una <strong>población finita que llama</strong>: un camión no puede volver a pedir el cargador hasta terminar su ida y vuelta, así que la tasa de llegada depende del estado. Con <InlineMath tex={String.raw`N`} /> camiones (las "máquinas"), <InlineMath tex={String.raw`c`} /> cargadores (el servidor de reparación), tasa de carga <InlineMath tex={String.raw`\mu=1/t_L`} /> y tasa de retorno por camino <InlineMath tex={String.raw`\lambda`} />, es la clásica <strong>cola de reparación de máquinas M/M/1//N</strong> (o M/M/c//N con varios cargadores) — las llegadas son <InlineMath tex={String.raw`(N-n)\,\lambda`} /> con <InlineMath tex={String.raw`n`} /> camiones ya en el cargador:
      </p>
      <Equation tex={String.raw`\lambda_n=(N-n)\,\lambda,\qquad \mu_n=\min(n,c)\,\mu,\qquad 0\le n\le N.`} />
      <p>
        <strong>Factor de emparejamiento.</strong> El rendimiento nunca supera la tasa del cargador (techo <InlineMath tex={String.raw`=c\,\mu`} />); al crecer la flota se satura en ese techo y cada camión extra solo agrega cola. El atajo minero es el <strong>factor de emparejamiento</strong> <InlineMath tex={String.raw`\text{MF}`} />:
      </p>
      <Equation tex={String.raw`\text{MF}=\frac{N\cdot t_L}{c\cdot t_{\text{ciclo}}},\qquad \text{MF}<1\;(\text{sub-equipado})\;\mid\;\text{MF}\approx 1\;(\text{emparejado})\;\mid\;\text{MF}>1\;(\text{sobre-equipado}).`} />
      <p>
        <InlineMath tex={String.raw`\text{MF}<1`} /> deja el cargador ocioso (flota limitante); <InlineMath tex={String.raw`\text{MF}\approx 1`} /> empareja (cargador a pleno, ~sin cola); <InlineMath tex={String.raw`\text{MF}>1`} /> sobre-equipa (cola persistente, rendimiento clavado en <InlineMath tex={String.raw`c\,\mu`} />). Con variabilidad el óptimo práctico cae un poco bajo <InlineMath tex={String.raw`\text{MF}=1`} />.
      </p>

      <h3>Alcances y supuestos</h3>
      <p>
        Se modela: una ruta cargada <strong>óptima exacta</strong> (Dijkstra sobre el costo graduado) con retorno vacío por distancia simple; un cargador compartido como el <strong>recurso que ata</strong>; y una población <strong>finita</strong> de <InlineMath tex={String.raw`N`} /> camiones. Supuestos clave: el campo de elevación es <strong>determinista</strong> (un cordón gaussiano con notches de paso, sin RNG); el costo penaliza <strong>solo lo cuesta arriba</strong> (<InlineMath tex={String.raw`\max(0,\cdot)`} />); la corrida es <strong>semillada</strong> y reproducible — depende de <InlineMath tex={String.raw`(\text{params},\text{seed})`} /> y no del entrelazado del planificador; el turno es <strong>finito</strong> <InlineMath tex={String.raw`H`} /> (no estado estacionario: una carga que no cabe antes de <InlineMath tex={String.raw`H`} /> se descarta).
      </p>
      <p>
        Queda <strong>fuera de alcance</strong>: velocidad variable o fallas de camión, descenso cargado (solo se penaliza subir), congestión multi-camión en la vía, costo de combustible explícito, y reasignación dinámica de ruta dentro del turno. El CVRP de múltiples vehículos con capacidad se trata en S08; el despacho estocástico, en otra escena.
      </p>

      <p>
        <strong>Qué muestra cada variante.</strong> <em>r_low / r_mid / r_switch / r_steep</em> barren la pendiente cruzando el salto (<InlineMath tex={String.raw`\gamma=1\to3\to4\to8`} />: directa → justo bajo <InlineMath tex={String.raw`g^{*}`} /> → salta al paso → desvío largo); <em>r_passR</em> mueve el paso a la columna 9 (el desvío va al otro lado); <em>r_wall</em> redirige por una barrera aun a pendiente baja. <em>f_t2</em> (cargador ocioso, flota limitante) → <em>f_t6</em> (colas asomando, <InlineMath tex={String.raw`\text{MF}\to1`} />) → <em>f_t12</em> (sobre-equipado: cargas casi iguales, ~el doble de espera); <em>f_l2t12 / f_l3t12</em> suben el techo con 2 y 3 cargadores. <em>x_steep2 / x_flat</em> acoplan pendiente y flota (el ciclo largo baja el rendimiento; el plano da ciclos rápidos y ruta trivialmente directa).
      </p>
      <p>
        <strong>Cómo leer la animación.</strong> El <strong>campo sombreado</strong> muestra el cordón (cálido) y el paso bajo (frío); los camiones suben lento por la ruta graduada y bajan rápido vacíos; los nodos marcan <strong>carguío</strong> (verde) y <strong>botadero</strong> (ámbar); la línea tenue es la ruta cargada elegida (se mueve visiblemente al paso al subir <InlineMath tex={String.raw`\gamma`} /> sobre <InlineMath tex={String.raw`g^{*}`} />); el HUD cuenta los camiones en ruta. En la tabla de KPIs, mira cómo <code>throughput_per_hr</code> se aplana mientras <code>loader_wait_per_load</code> sigue subiendo una vez cruzado <InlineMath tex={String.raw`\text{MF}\approx 1`} />, y compara <code>switch_grade_est</code> <InlineMath tex={String.raw`(g^{*})`} /> con la <InlineMath tex={String.raw`\gamma`} /> de cada variante para predecir si la ruta va directa o por el paso.
      </p>
    </>
  ) : (
    <>
      <h2>The problem: construction haul routing — a closed finite-source queue (optimize-then-simulate)</h2>
      <p>
        <strong>The problem.</strong> A fixed fleet of trucks endlessly recirculates between a <strong>load</strong> point (low ground) and a <strong>dump</strong> (high ground), over a synthetic road network where <strong>a ridge of high ground walls the two apart</strong> and <strong>elevation drives cost</strong>. Each truck repeats a four-phase cycle: <strong>load</strong> at the shared loader, <strong>loaded haul</strong> crossing the ridge, <strong>dump</strong>, and a fast <strong>empty return</strong>. The loaded route minimizes a grade-<em>graded</em> edge cost that penalizes only uphill segments, solved exactly with <strong>Dijkstra</strong> (the <em>optimize</em> step); a seeded discrete-event loop then <em>simulates</em> the cycle. The shared loader is the binding resource: trucks are a finite calling population, so this is a <strong>machine-repair (finite-source) M/M/1//N queue</strong> and throughput saturates at the loader rate — you must <strong>match the fleet to the loader</strong> (the "match factor").
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li><strong>Sets:</strong> junction nodes of the <InlineMath tex={String.raw`g\times g`} /> grid (<InlineMath tex={String.raw`g=12`} />) carrying an elevation field <InlineMath tex={String.raw`\text{elev}(n)`} />; a <strong>load</strong> point on the bottom edge and a <strong>dump</strong> on the top edge, both in column <code>lift_col</code>.</li>
        <li><strong>Parameters:</strong> grade penalty <InlineMath tex={String.raw`\gamma`} /> (<code>grade</code>, 0–8), pass column <code>pass_col</code>, load/dump column <code>lift_col</code>, barrier <InlineMath tex={String.raw`\{0,1\}`} /> across the direct line, number of trucks <InlineMath tex={String.raw`N`} /> (<code>n_trucks</code>, 1–14), number of loaders <InlineMath tex={String.raw`c`} /> (<code>n_loaders</code>, 1–4), load time <InlineMath tex={String.raw`t_L=4`} /> and dump time <InlineMath tex={String.raw`1`} /> min, and shift length <InlineMath tex={String.raw`H`} /> (<code>horizon</code>).</li>
        <li><strong>Decision variable (optimize):</strong> the loaded route — the node sequence minimizing the graded cost, via Dijkstra; the empty return uses plain distance.</li>
        <li><strong>State variables (simulate):</strong> the time each loader becomes free, and the number of trucks waiting at the loader at time <InlineMath tex={String.raw`t`} />.</li>
        <li><strong>Measured metrics:</strong> loads delivered, throughput per hour, mean cycle time, loader wait per load, and the estimated switch grade <InlineMath tex={String.raw`g^{*}`} />.</li>
      </ul>

      <h3>Formalization</h3>
      <p>
        <strong>Graded route cost.</strong> The loaded route minimizes a sum of edge costs that penalizes only climbing (<code>loaded_cost</code> in the code): distance is inflated by grade <InlineMath tex={String.raw`\gamma`} /> times the positive climb <InlineMath tex={String.raw`\Delta\text{elev}=\max(0,\,\text{elev}_b-\text{elev}_a)`} />:
      </p>
      <Equation tex={String.raw`\text{cost}(a\to b)=\text{dist}(a,b)\,\big(1+\gamma\,\max(0,\,\text{elev}_b-\text{elev}_a)\big).`} />
      <p>
        <strong>Route-switch condition.</strong> Let <InlineMath tex={String.raw`(L,C)`} /> be a route's total length and total climb. The <em>direct</em> route over the crest is short and climbs hard <InlineMath tex={String.raw`(L_{\text{dir}},C_{\text{dir}})`} />; the <em>detour</em> to the pass is long and nearly flat <InlineMath tex={String.raw`(L_{\text{det}},C_{\text{det}})`} />. The detour wins when <InlineMath tex={String.raw`L_{\text{dir}}+\gamma\,C_{\text{dir}}>L_{\text{det}}+\gamma\,C_{\text{det}}`} />, defining the <strong>critical grade</strong> <InlineMath tex={String.raw`g^{*}`} /> at which the optimal route flips direct→pass (the code's <code>switch</code> quantity):
      </p>
      <Equation tex={String.raw`g^{*}=\frac{L_{\text{det}}-L_{\text{dir}}}{C_{\text{dir}}-C_{\text{det}}}\;=\;\frac{\Delta L}{\Delta C}\qquad(\text{here }g^{*}\approx 3.4).`} />
      <p>
        Below <InlineMath tex={String.raw`g^{*}`} /> the direct climb wins; above <InlineMath tex={String.raw`g^{*}`} /> the route flips to the pass. A <strong>barrier</strong> across the direct line reroutes it to the pass independent of grade.
      </p>
      <p>
        <strong>The queueing model — why this is not the M/M/c of S01.</strong> Trucks are a <strong>finite calling population</strong>: a truck cannot demand the loader again until it finishes its haul-and-return, so the arrival rate is state-dependent. With <InlineMath tex={String.raw`N`} /> trucks (the "machines"), <InlineMath tex={String.raw`c`} /> loaders (the repair server), load rate <InlineMath tex={String.raw`\mu=1/t_L`} /> and per-truck return rate <InlineMath tex={String.raw`\lambda`} />, this is the classic <strong>machine-repair M/M/1//N queue</strong> (M/M/c//N with several loaders) — arrivals are <InlineMath tex={String.raw`(N-n)\,\lambda`} /> with <InlineMath tex={String.raw`n`} /> trucks already at the loader:
      </p>
      <Equation tex={String.raw`\lambda_n=(N-n)\,\lambda,\qquad \mu_n=\min(n,c)\,\mu,\qquad 0\le n\le N.`} />
      <p>
        <strong>Match factor.</strong> Throughput can never exceed the loader rate (ceiling <InlineMath tex={String.raw`=c\,\mu`} />); as the fleet grows it saturates at that ceiling and each extra truck adds only queue. The mining shorthand is the <strong>match factor</strong> <InlineMath tex={String.raw`\text{MF}`} />:
      </p>
      <Equation tex={String.raw`\text{MF}=\frac{N\cdot t_L}{c\cdot t_{\text{cycle}}},\qquad \text{MF}<1\;(\text{under-trucked})\;\mid\;\text{MF}\approx 1\;(\text{matched})\;\mid\;\text{MF}>1\;(\text{over-trucked}).`} />
      <p>
        <InlineMath tex={String.raw`\text{MF}<1`} /> leaves the loader idle (fleet-limited); <InlineMath tex={String.raw`\text{MF}\approx 1`} /> is matched (loader full, ~no queue); <InlineMath tex={String.raw`\text{MF}>1`} /> over-trucks (persistent queue, throughput pinned at <InlineMath tex={String.raw`c\,\mu`} />). Under variability the practical optimum sits slightly below <InlineMath tex={String.raw`\text{MF}=1`} />.
      </p>

      <h3>Scope &amp; assumptions</h3>
      <p>
        Modeled: an <strong>exactly optimal</strong> loaded route (Dijkstra over the graded cost) with an empty return on plain distance; a shared loader as the <strong>binding resource</strong>; and a <strong>finite</strong> population of <InlineMath tex={String.raw`N`} /> trucks. Key assumptions: the elevation field is <strong>deterministic</strong> (a Gaussian ridge with pass notches, no RNG); the cost penalizes <strong>uphill only</strong> (<InlineMath tex={String.raw`\max(0,\cdot)`} />); the run is <strong>seeded</strong> and reproducible — it depends on <InlineMath tex={String.raw`(\text{params},\text{seed})`} /> and not on the scheduler's interleaving; the shift is <strong>finite</strong> <InlineMath tex={String.raw`H`} /> (not steady state: a load that cannot finish before <InlineMath tex={String.raw`H`} /> is dropped).
      </p>
      <p>
        Out of scope: variable truck speed or breakdowns, loaded descent (only climbing is penalized), multi-truck congestion on the road, explicit fuel cost, and dynamic in-shift rerouting. Multi-vehicle capacitated routing (CVRP) is covered in S08; stochastic dispatch in another scene.
      </p>

      <p>
        <strong>What each variant shows.</strong> <em>r_low / r_mid / r_switch / r_steep</em> sweep grade across the switch (<InlineMath tex={String.raw`\gamma=1\to3\to4\to8`} />: direct → just below <InlineMath tex={String.raw`g^{*}`} /> → flips to the pass → long detour); <em>r_passR</em> moves the pass to column 9 (the detour goes the other way); <em>r_wall</em> reroutes via a barrier even at low grade. <em>f_t2</em> (loader idles, fleet-limited) → <em>f_t6</em> (queues forming, <InlineMath tex={String.raw`\text{MF}\to1`} />) → <em>f_t12</em> (over-trucked: near-identical loads, ~double the wait); <em>f_l2t12 / f_l3t12</em> lift the ceiling with 2 and 3 loaders. <em>x_steep2 / x_flat</em> couple grade and fleet (the long cycle lowers throughput; flat gives fast cycles and a trivially direct route).
      </p>
      <p>
        <strong>How to read the viz.</strong> The <strong>shaded field</strong> shows the ridge (warm) and the low pass (cool); trucks crawl uphill on the graded route and race back empty; node colours mark <strong>load</strong> (green) and <strong>dump</strong> (amber); the faint line is the chosen loaded route (it visibly moves to the pass as <InlineMath tex={String.raw`\gamma`} /> rises past <InlineMath tex={String.raw`g^{*}`} />); the HUD counts trucks en route. In the KPI table, watch <code>throughput_per_hr</code> flatten while <code>loader_wait_per_load</code> keeps climbing once you cross <InlineMath tex={String.raw`\text{MF}\approx 1`} />, and compare <code>switch_grade_est</code> <InlineMath tex={String.raw`(g^{*})`} /> against each variant's <InlineMath tex={String.raw`\gamma`} /> to predict whether the route runs direct or via the pass.
      </p>
    </>
  );
}

function S08Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: ruteo de vehículos capacitado (CVRP) resuelto con OR-Tools — un depósito, N clientes con demanda y K vehículos sobre una grilla vial sintética</h2>
      <p>
        <strong>El problema.</strong> Una flota de reparto sale de un único <strong>depósito</strong>, debe servir a un conjunto de <strong>clientes</strong> —cada uno con una <strong>demanda</strong> entera— y volver al depósito, sin que ningún vehículo exceda su <strong>capacidad</strong> <InlineMath tex={String.raw`Q`} />. El objetivo clásico es minimizar la <strong>distancia total</strong> recorrida por la flota. Es <strong>optimización combinatoria</strong> pura (NP-difícil): no hay dinámica estocástica, sino una única instancia que se resuelve de una vez. La instancia es una grilla <InlineMath tex={String.raw`g \times g`} /> con el depósito en el centro y los clientes sembrados al azar; las distancias entre nodos especiales son <strong>caminos más cortos sobre la grilla</strong>. El solver de ruteo de <strong>OR-Tools</strong> es código nativo, así que el caso se precomputa: la traza commiteada guarda las rutas óptimas y la web las reproduce como vehículos recorriendo la red.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li><strong>Nodos especiales</strong> <InlineMath tex={String.raw`V = \{0, 1, \dots, n\}`} />: el índice <InlineMath tex={String.raw`0`} /> es el <strong>depósito</strong>, los índices <InlineMath tex={String.raw`1\dots n`} /> son los <strong>clientes</strong> (<InlineMath tex={String.raw`n=`} /> <code>n_customers</code>, 4–18).</li>
        <li><strong>Demandas</strong> <InlineMath tex={String.raw`d_i`} />: <InlineMath tex={String.raw`d_0 = 0`} /> en el depósito; cada cliente toma <InlineMath tex={String.raw`d_i \sim \mathcal{U}\{1,2,3\}`} /> (entero, semilla <code>inst_seed</code>).</li>
        <li><strong>Matriz de costos</strong> <InlineMath tex={String.raw`c_{ij}`} />: distancia del camino más corto entre los nodos especiales <InlineMath tex={String.raw`i`} /> y <InlineMath tex={String.raw`j`} /> sobre la grilla, escalada por <InlineMath tex={String.raw`100`} /> y redondeada a entero.</li>
        <li><strong>Flota</strong>: <InlineMath tex={String.raw`K=`} /> <code>n_vehicles</code> vehículos (1–6), cada uno con la misma <strong>capacidad</strong> <InlineMath tex={String.raw`Q=`} /> <code>capacity</code> (4–40).</li>
        <li><strong>Variables de decisión</strong>: arcos binarios <InlineMath tex={String.raw`x_{ij}\in\{0,1\}`} /> (¿se recorre el arco <InlineMath tex={String.raw`i\to j`} />?) y la <strong>carga acumulada</strong> <InlineMath tex={String.raw`u_i`} /> de cada nodo (dimensión <em>Capacity</em> de OR-Tools).</li>
      </ul>

      <h3>Formalización</h3>
      <p>
        Es el <strong>CVRP</strong> (<em>Capacitated Vehicle Routing Problem</em>), formulado como un <strong>MILP</strong> de flujo en arcos. Se minimiza la distancia total recorrida:
      </p>
      <Equation
        tex={String.raw`\min \; \sum_{i\in V}\sum_{j\in V} c_{ij}\, x_{ij}`}
        caption="Objetivo base: distancia total de todos los arcos recorridos."
      />
      <p>
        sujeto a <strong>restricciones de grado</strong> (cada cliente se visita exactamente una vez) y a que la flota salga y vuelva al depósito:
      </p>
      <Equation
        tex={String.raw`\sum_{j\in V} x_{ij} = 1 \;\; \forall i\neq 0, \qquad \sum_{i\in V} x_{ij} = 1 \;\; \forall j\neq 0, \qquad \sum_{j} x_{0j} = K`}
        caption="Grado de entrada/salida = 1 por cliente; K vehículos parten del depósito."
      />
      <p>
        La <strong>capacidad</strong> se impone con variables de carga acumulada al estilo <em>MTZ</em>, que además eliminan subtoures:
      </p>
      <Equation
        tex={String.raw`u_j \ge u_i + d_j - Q\,(1 - x_{ij}), \qquad d_i \le u_i \le Q \;\; \forall i\neq 0`}
        caption="La carga sube en d_j al cruzar un arco usado y nunca supera Q."
      />
      <p>
        El código añade además una <strong>dimensión de distancia con costo de span global</strong>: a la función objetivo se le suma un término proporcional a la <strong>ruta más larga</strong> (el <em>span</em> = máximo menos mínimo de la distancia acumulada entre vehículos), con coeficiente <InlineMath tex={String.raw`\gamma = 100`} />:
      </p>
      <Equation
        tex={String.raw`\min \; \sum_{i,j} c_{ij}\, x_{ij} \;+\; \gamma \cdot \Big(\max_{k}\, \text{dist}_k - \min_{k}\, \text{dist}_k\Big), \qquad \gamma = 100`}
        caption="Objetivo efectivo: distancia total + penalización del span (ruta más larga menos la más corta)."
      />
      <p>
        Esto fuerza a <strong>balancear</strong> las rutas (minimizar la más larga), de modo que los vehículos extra se usen de verdad. OR-Tools resuelve esto con <code>PATH_CHEAPEST_ARC</code> como solución inicial y <strong>búsqueda local guiada</strong> (<code>GUIDED_LOCAL_SEARCH</code>), un solo hilo, con límite de <InlineMath tex={String.raw`3`} /> segundos.
      </p>

      <h3>Alcances y supuestos</h3>
      <ul>
        <li><strong>Determinista y sembrado</strong>: la instancia (clientes y demandas) depende solo de <code>inst_seed</code>; no hay aleatoriedad en el viaje. El mismo seed da siempre la misma solución, que se precomputa y se reproduce.</li>
        <li><strong>Sin estocástica de operación</strong>: no se modelan ventanas de tiempo, tráfico, tiempos de servicio variables ni fallas — a diferencia del despacho EMS estocástico de otra escena.</li>
        <li><strong>Distancias métricas en grilla</strong>: <InlineMath tex={String.raw`c_{ij}`} /> es el camino más corto en la red, simétrico y entero (escala <InlineMath tex={String.raw`{\times}100`} />). Velocidad uniforme <InlineMath tex={String.raw`= 1`} /> para convertir distancia en tiempo de animación.</li>
        <li><strong>Óptimo práctico, no probado</strong>: con límite de 3 s, OR-Tools entrega una solución de alta calidad (cuasi-óptima en instancias chicas), no un certificado de optimalidad MILP. Un vehículo cuya ruta es solo depósito→depósito se descarta como <em>no usado</em>.</li>
        <li><strong>Fuera de alcance</strong>: múltiples depósitos, recogidas y entregas, flota heterogénea y demanda dinámica.</li>
      </ul>

      <p>
        <strong>Qué muestra cada variante.</strong> <em>small</em> (8 clientes · 2 vehículos) da dos rutas limpias como caso de lectura mínima. <em>base</em> (12 · 3) es el caso balanceado de referencia. <em>tightcap</em> baja <InlineMath tex={String.raw`Q`} /> a 8 y obliga a más idas y vueltas al depósito (la capacidad se vuelve activa). <em>fewveh</em> (2 vehículos) alarga las rutas individuales; <em>manyveh</em> (4) las acorta — pero el costo de span global revela el <strong>compromiso distancia-total ↔ ruta-más-larga</strong>: más vehículos bajan el máximo a costa de algo de distancia total. <em>c15</em>, <em>c15v4</em> y <em>c18</em> escalan clientes y flota; <em>dense</em> aprieta clientes en grilla chica y <em>spread</em> los dispersa en grilla grande (tramos largos).
      </p>
      <p>
        <strong>Cómo leer la viz.</strong> El <strong>depósito</strong> se marca en verde y los <strong>clientes</strong> en magenta sobre la grilla vial. Cada vehículo usado tiene <strong>un color de ruta</strong> y se anima saliendo del depósito, visitando su secuencia de clientes y volviendo. Los KPIs del HUD reportan <code>total_distance</code> (objetivo base), <code>vehicles_used</code> (de los <InlineMath tex={String.raw`K`} /> disponibles), <code>max_route_time</code> (la ruta más larga — el término que el span global penaliza), <code>customers</code> y <code>capacity</code> <InlineMath tex={String.raw`Q`} />. Compara <code>vehicles_used</code> contra <code>total_distance</code> y <code>max_route_time</code> entre variantes para ver el trade-off en acción.
      </p>
    </>
  ) : (
    <>
      <h2>The problem: capacitated vehicle routing (CVRP) solved with OR-Tools — one depot, N customers with demand, and K vehicles on a synthetic road grid</h2>
      <p>
        <strong>The problem.</strong> A delivery fleet leaves a single <strong>depot</strong>, must serve a set of <strong>customers</strong> —each with an integer <strong>demand</strong>— and return to the depot, with no vehicle exceeding its <strong>capacity</strong> <InlineMath tex={String.raw`Q`} />. The classic objective is to minimize the fleet's <strong>total travel distance</strong>. This is pure <strong>combinatorial optimization</strong> (NP-hard): no stochastic dynamics, just one instance solved once. The instance is a <InlineMath tex={String.raw`g \times g`} /> grid with the depot at the center and customers seeded at random; distances between special nodes are <strong>grid shortest paths</strong>. The <strong>OR-Tools</strong> routing solver is native code, so the case is precomputed: the committed trace holds the optimal routes and the web replays them as vehicles driving the network.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li><strong>Special nodes</strong> <InlineMath tex={String.raw`V = \{0, 1, \dots, n\}`} />: index <InlineMath tex={String.raw`0`} /> is the <strong>depot</strong>, indices <InlineMath tex={String.raw`1\dots n`} /> are the <strong>customers</strong> (<InlineMath tex={String.raw`n=`} /> <code>n_customers</code>, 4–18).</li>
        <li><strong>Demands</strong> <InlineMath tex={String.raw`d_i`} />: <InlineMath tex={String.raw`d_0 = 0`} /> at the depot; each customer draws <InlineMath tex={String.raw`d_i \sim \mathcal{U}\{1,2,3\}`} /> (integer, seed <code>inst_seed</code>).</li>
        <li><strong>Cost matrix</strong> <InlineMath tex={String.raw`c_{ij}`} />: shortest-path distance between special nodes <InlineMath tex={String.raw`i`} /> and <InlineMath tex={String.raw`j`} /> on the grid, scaled by <InlineMath tex={String.raw`100`} /> and rounded to an integer.</li>
        <li><strong>Fleet</strong>: <InlineMath tex={String.raw`K=`} /> <code>n_vehicles</code> vehicles (1–6), each with the same <strong>capacity</strong> <InlineMath tex={String.raw`Q=`} /> <code>capacity</code> (4–40).</li>
        <li><strong>Decision variables</strong>: binary arcs <InlineMath tex={String.raw`x_{ij}\in\{0,1\}`} /> (is arc <InlineMath tex={String.raw`i\to j`} /> traversed?) and the <strong>cumulative load</strong> <InlineMath tex={String.raw`u_i`} /> at each node (OR-Tools <em>Capacity</em> dimension).</li>
      </ul>

      <h3>Formalization</h3>
      <p>
        This is the <strong>CVRP</strong> (<em>Capacitated Vehicle Routing Problem</em>), cast as an arc-flow <strong>MILP</strong>. It minimizes total distance traveled:
      </p>
      <Equation
        tex={String.raw`\min \; \sum_{i\in V}\sum_{j\in V} c_{ij}\, x_{ij}`}
        caption="Base objective: total distance over all traversed arcs."
      />
      <p>
        subject to <strong>degree constraints</strong> (each customer is visited exactly once) and the fleet leaving from and returning to the depot:
      </p>
      <Equation
        tex={String.raw`\sum_{j\in V} x_{ij} = 1 \;\; \forall i\neq 0, \qquad \sum_{i\in V} x_{ij} = 1 \;\; \forall j\neq 0, \qquad \sum_{j} x_{0j} = K`}
        caption="In-/out-degree = 1 per customer; K vehicles depart the depot."
      />
      <p>
        <strong>Capacity</strong> is enforced with cumulative-load variables in <em>MTZ</em> style, which also eliminate subtours:
      </p>
      <Equation
        tex={String.raw`u_j \ge u_i + d_j - Q\,(1 - x_{ij}), \qquad d_i \le u_i \le Q \;\; \forall i\neq 0`}
        caption="Load rises by d_j across a used arc and never exceeds Q."
      />
      <p>
        The code further adds a <strong>distance dimension with a global-span cost</strong>: a term proportional to the <strong>longest route</strong> (the <em>span</em> = max minus min of cumulative distance across vehicles) is added to the objective, with coefficient <InlineMath tex={String.raw`\gamma = 100`} />:
      </p>
      <Equation
        tex={String.raw`\min \; \sum_{i,j} c_{ij}\, x_{ij} \;+\; \gamma \cdot \Big(\max_{k}\, \text{dist}_k - \min_{k}\, \text{dist}_k\Big), \qquad \gamma = 100`}
        caption="Effective objective: total distance + penalty on the span (longest route minus shortest)."
      />
      <p>
        This forces routes to <strong>balance</strong> (minimize the longest one), so extra vehicles actually get used. OR-Tools solves it with <code>PATH_CHEAPEST_ARC</code> as the first solution and <strong>guided local search</strong> (<code>GUIDED_LOCAL_SEARCH</code>), single-thread, with a <InlineMath tex={String.raw`3`} />-second time limit.
      </p>

      <h3>Scope &amp; assumptions</h3>
      <ul>
        <li><strong>Deterministic and seeded</strong>: the instance (customers and demands) depends only on <code>inst_seed</code>; there is no travel randomness. The same seed always yields the same solution, which is precomputed and replayed.</li>
        <li><strong>No operational stochastics</strong>: no time windows, traffic, variable service times, or failures — unlike the stochastic EMS dispatch in another scene.</li>
        <li><strong>Metric grid distances</strong>: <InlineMath tex={String.raw`c_{ij}`} /> is the shortest path on the network, symmetric and integer (scale <InlineMath tex={String.raw`{\times}100`} />). Uniform speed <InlineMath tex={String.raw`= 1`} /> converts distance into animation time.</li>
        <li><strong>Practical optimum, not proven</strong>: with a 3 s limit, OR-Tools returns a high-quality (near-optimal on small instances) solution, not a MILP optimality certificate. A vehicle whose route is just depot→depot is dropped as <em>unused</em>.</li>
        <li><strong>Out of scope</strong>: multiple depots, pickup-and-delivery, heterogeneous fleet, and dynamic demand.</li>
      </ul>

      <p>
        <strong>What each variant shows.</strong> <em>small</em> (8 customers · 2 vehicles) gives two clean routes as the minimal reading. <em>base</em> (12 · 3) is the balanced reference case. <em>tightcap</em> drops <InlineMath tex={String.raw`Q`} /> to 8 and forces more back-and-forth to the depot (capacity becomes binding). <em>fewveh</em> (2 vehicles) lengthens individual routes; <em>manyveh</em> (4) shortens them — but the global-span cost surfaces the <strong>total-distance ↔ longest-route trade-off</strong>: more vehicles lower the max route at the cost of some total distance. <em>c15</em>, <em>c15v4</em>, and <em>c18</em> scale customers and fleet; <em>dense</em> packs customers on a small grid and <em>spread</em> disperses them on a large grid (long legs).
      </p>
      <p>
        <strong>How to read the viz.</strong> The <strong>depot</strong> is marked green and <strong>customers</strong> magenta on the road grid. Each used vehicle has <strong>one route color</strong> and animates leaving the depot, visiting its customer sequence, and returning. The HUD KPIs report <code>total_distance</code> (base objective), <code>vehicles_used</code> (of the <InlineMath tex={String.raw`K`} /> available), <code>max_route_time</code> (the longest route — the term the global span penalizes), <code>customers</code>, and <code>capacity</code> <InlineMath tex={String.raw`Q`} />. Compare <code>vehicles_used</code> against <code>total_distance</code> and <code>max_route_time</code> across variants to see the trade-off in action.
      </p>
    </>
  );
}

function S09Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>Despacho de ambulancias: un sistema EMS estocástico de eventos discretos sobre una ciudad-grilla.</h2>
      <p>
        <strong>El problema.</strong> Los llamados de emergencia llegan en momentos y lugares <em>impredecibles</em>;
        una flota finita de ambulancias debe responder rápido desde sus bases. Más unidades y mejor ubicación
        acortan los tiempos de respuesta, pero cuestan. La pregunta canónica de dimensionamiento de flota y
        ubicación de bases es: <em>¿cuántas ambulancias, en qué bases, para cubrir qué fracción de los llamados
        dentro de un umbral?</em> Aquí la red es una <strong>ciudad-grilla</strong> de{" "}
        <InlineMath tex={String.raw`g \times g`} /> nodos con calles entre vecinos; cada llamado se atiende con la
        unidad que puede <strong>llegar antes</strong> (nearest-available), contando a las que siguen ocupadas. La
        ambulancia viaja a la escena, atiende en sitio, traslada al hospital central y regresa a su base. Es una
        simulación de eventos discretos (DES) pura en Python, con semilla y por tanto reproducible.
      </p>

      <h3>Componentes y variables</h3>
      <ul>
        <li>
          <strong>Conjuntos:</strong> nodos de la grilla <InlineMath tex={String.raw`V`} /> con{" "}
          <InlineMath tex={String.raw`|V| = g^2`} />; bases{" "}
          <InlineMath tex={String.raw`S \subseteq V`} /> (<InlineMath tex={String.raw`|S| = n_s`} />); flota de
          ambulancias <InlineMath tex={String.raw`A`} /> (<InlineMath tex={String.raw`|A| = c`} />); hospital
          central <InlineMath tex={String.raw`h \in V`} /> en el centro.
        </li>
        <li>
          <strong>Parámetros:</strong> tasa de llamados{" "}
          <InlineMath tex={String.raw`\lambda`} /> (llamados/hora), umbral de respuesta{" "}
          <InlineMath tex={String.raw`\tau`} /> (min, def. 8), horizonte{" "}
          <InlineMath tex={String.raw`T`} /> (min), velocidad <InlineMath tex={String.raw`v = 1.3`} /> y tiempo en
          escena <InlineMath tex={String.raw`s_0 = 2`} /> min.
        </li>
        <li>
          <strong>Variables aleatorias:</strong> tiempos entre llegadas{" "}
          <InlineMath tex={String.raw`\Delta_k \sim \text{Exp}(\lambda)`} /> y nodo del llamado{" "}
          <InlineMath tex={String.raw`c_k \sim \text{Unif}(V)`} />.
        </li>
        <li>
          <strong>Estado / decisión:</strong> para cada ambulancia{" "}
          <InlineMath tex={String.raw`i`} />, su nodo y su instante de liberación{" "}
          <InlineMath tex={String.raw`f_i`} />; la decisión es la asignación{" "}
          <InlineMath tex={String.raw`i^\star(k)`} /> del llamado{" "}
          <InlineMath tex={String.raw`k`} /> a una unidad.
        </li>
      </ul>

      <h3>Formalización</h3>
      <p>
        El modelo es una <strong>cola espacial multi-servidor con servicio dependiente del estado</strong> — un
        sistema EMS tipo <InlineMath tex={String.raw`M/G/c`} /> donde el "servicio" es el ciclo completo
        viaje-atención-traslado-retorno y el ruteo es <em>nearest-available</em>. Las llegadas forman un proceso de
        Poisson: los tiempos entre llamados son exponenciales,
      </p>
      <Equation tex={String.raw`\Delta_k \sim \text{Exp}\!\left(\tfrac{\lambda}{60}\right), \qquad t_k = t_{k-1} + \Delta_k, \qquad c_k \sim \text{Unif}(V).`} />
      <p>
        La distancia entre nodos es el camino más corto{" "}
        <InlineMath tex={String.raw`d(u,w)`} /> sobre la grilla; el tiempo de viaje es{" "}
        <InlineMath tex={String.raw`d/v`} />. Al llegar el llamado{" "}
        <InlineMath tex={String.raw`k`} />, cada unidad queda lista en{" "}
        <InlineMath tex={String.raw`r_i = \max(t_k, f_i)`} /> y se elige la de <strong>arribo más temprano</strong>:
      </p>
      <Equation tex={String.raw`i^\star = \arg\min_{i \in A} \left[\, \max(t_k, f_i) + \frac{d(\text{node}_i,\, c_k)}{v} \,\right].`} />
      <p>
        La unidad elegida ejecuta el ciclo y su instante de liberación se actualiza encadenando los tramos:
      </p>
      <Equation tex={String.raw`t_{\text{esc}} = r_{i^\star} + \tfrac{d(\text{node}_{i^\star}, c_k)}{v}, \quad t_{\text{trat}} = t_{\text{esc}} + s_0, \quad f_{i^\star} = t_{\text{trat}} + \tfrac{d(c_k, h) + d(h, \text{home}_{i^\star})}{v}.`} />
      <p>
        El <strong>tiempo de respuesta</strong> del llamado es{" "}
        <InlineMath tex={String.raw`R_k = t_{\text{esc}} - t_k`} />. Los KPI agregan sobre los{" "}
        <InlineMath tex={String.raw`n`} /> llamados servidos: respuesta media, p90, y{" "}
        <strong>cobertura</strong> dentro del umbral
      </p>
      <Equation tex={String.raw`\text{cov} = \frac{1}{n}\sum_{k=1}^{n} \mathbf{1}\{R_k \le \tau\}.`} />
      <p>
        La <strong>carga ofrecida</strong> normaliza el tiempo-servidor total contra la capacidad de la flota en el
        horizonte (es la utilización ofrecida, <em>puede superar 1</em> cuando la demanda excede a la flota):
      </p>
      <Equation tex={String.raw`\rho = \frac{\sum_{k} (f_{i^\star(k)} - r_{i^\star(k)})}{c \cdot T}.`} />

      <h3>Alcances y supuestos</h3>
      <ul>
        <li>
          <strong>Modelado:</strong> llegadas Poisson, ubicaciones uniformes, ruteo nearest-available exacto sobre
          caminos más cortos, ciclo de servicio completo (viaje + escena + traslado + retorno), y todos los KPI
          (media, p90, cobertura, carga).
        </li>
        <li>
          <strong>Supuestos:</strong> proceso estacionario en{" "}
          <InlineMath tex={String.raw`[0, T]`} />; velocidad y tiempo en escena constantes (servicio
          <em> determinista por tramo</em>, aleatorio solo por la geometría del llamado); un único hospital; bases
          repartidas round-robin entre la flota; simulación con semilla → trayectoria reproducible.
        </li>
        <li>
          <strong>Fuera de alcance:</strong> tráfico/congestión variable, triage por severidad, derivación a
          múltiples hospitales, reposicionamiento dinámico de unidades, abandono de llamados y horarios de turno.
        </li>
      </ul>

      <p>
        <strong>Qué muestra cada variante.</strong> <em>a2 / a3</em> (2-3 unidades, 1 base): subdimensionado,
        esperas largas y baja cobertura. <em>a4 vs. a4s1</em>: misma flota de 4, pero 2 bases recortan el viaje
        frente a 1 base — el efecto puro de <strong>ubicación</strong>. <em>a4s4</em>: 4 unidades en 4 bases, gran
        cobertura geográfica pero menos capacidad de pico. <em>a6</em>: flota holgada para esta demanda.{" "}
        <em>surge vs. surge6</em>: un alza a <InlineMath tex={String.raw`\lambda = 22`} /> satura a 4 unidades (
        <InlineMath tex={String.raw`\rho`} /> &gt; 1) mientras 6 la absorben. <em>quiet</em>: baja demanda, incluso
        una flota chica cubre bien. <em>big</em>: sistema grande y bien ubicado bajo carga alta.
      </p>
      <p>
        <strong>Cómo leer la viz.</strong> La grilla son las calles; los nodos <strong>base</strong> (acento) y el{" "}
        <strong>hospital</strong> (verde) están marcados. Cada <strong>llamado</strong> aparece como marcador rojo
        en su instante <InlineMath tex={String.raw`t_k`} /> y se apaga al ser alcanzado en{" "}
        <InlineMath tex={String.raw`t_{\text{esc}}`} />. Las <strong>ambulancias</strong> (magenta) se animan por sus
        tramos: base → escena → hospital → base. El HUD reporta los KPI — respuesta media y p90, cobertura{" "}
        <InlineMath tex={String.raw`\text{cov}`} /> dentro del umbral, y carga{" "}
        <InlineMath tex={String.raw`\rho`} />: cuando el rojo se acumula sin ser alcanzado y la carga pasa el 100%,
        la flota va por detrás de la demanda.
      </p>
    </>
  ) : (
    <>
      <h2>Ambulance dispatch: a stochastic, discrete-event EMS system over a grid-city.</h2>
      <p>
        <strong>The problem.</strong> Emergency calls arrive at <em>unpredictable</em> times and places; a finite
        fleet of ambulances must respond fast from their bases. More units and better siting shorten response
        times, but cost money. The canonical fleet-sizing / station-siting question is: <em>how many ambulances, at
        which stations, to cover what fraction of calls within a threshold?</em> Here the network is a{" "}
        <strong>grid-city</strong> of <InlineMath tex={String.raw`g \times g`} /> nodes with streets between
        neighbours; each call is served by the unit that can <strong>reach it earliest</strong>
        (nearest-available), accounting for those still busy. The ambulance drives to the scene, treats on-site,
        transports to the central hospital, and returns to base. It is a pure discrete-event simulation (DES) in
        Python, seeded and therefore reproducible.
      </p>

      <h3>Components &amp; variables</h3>
      <ul>
        <li>
          <strong>Sets:</strong> grid nodes <InlineMath tex={String.raw`V`} /> with{" "}
          <InlineMath tex={String.raw`|V| = g^2`} />; stations{" "}
          <InlineMath tex={String.raw`S \subseteq V`} /> (<InlineMath tex={String.raw`|S| = n_s`} />); ambulance
          fleet <InlineMath tex={String.raw`A`} /> (<InlineMath tex={String.raw`|A| = c`} />); central hospital{" "}
          <InlineMath tex={String.raw`h \in V`} /> at the centre.
        </li>
        <li>
          <strong>Parameters:</strong> call rate{" "}
          <InlineMath tex={String.raw`\lambda`} /> (calls/hour), response threshold{" "}
          <InlineMath tex={String.raw`\tau`} /> (min, default 8), horizon{" "}
          <InlineMath tex={String.raw`T`} /> (min), speed <InlineMath tex={String.raw`v = 1.3`} /> and on-scene
          time <InlineMath tex={String.raw`s_0 = 2`} /> min.
        </li>
        <li>
          <strong>Random variables:</strong> inter-arrival times{" "}
          <InlineMath tex={String.raw`\Delta_k \sim \text{Exp}(\lambda)`} /> and call node{" "}
          <InlineMath tex={String.raw`c_k \sim \text{Unif}(V)`} />.
        </li>
        <li>
          <strong>State / decision:</strong> for each ambulance{" "}
          <InlineMath tex={String.raw`i`} />, its node and free-time{" "}
          <InlineMath tex={String.raw`f_i`} />; the decision is the assignment{" "}
          <InlineMath tex={String.raw`i^\star(k)`} /> of call{" "}
          <InlineMath tex={String.raw`k`} /> to a unit.
        </li>
      </ul>

      <h3>Formalization</h3>
      <p>
        The model is a <strong>spatial multi-server queue with state-dependent service</strong> — an EMS system of
        type <InlineMath tex={String.raw`M/G/c`} /> where "service" is the full
        travel-treat-transport-return cycle and routing is <em>nearest-available</em>. Arrivals form a Poisson
        process: inter-call times are exponential,
      </p>
      <Equation tex={String.raw`\Delta_k \sim \text{Exp}\!\left(\tfrac{\lambda}{60}\right), \qquad t_k = t_{k-1} + \Delta_k, \qquad c_k \sim \text{Unif}(V).`} />
      <p>
        Node-to-node distance is the shortest path{" "}
        <InlineMath tex={String.raw`d(u,w)`} /> on the grid; travel time is{" "}
        <InlineMath tex={String.raw`d/v`} />. When call{" "}
        <InlineMath tex={String.raw`k`} /> arrives, each unit becomes ready at{" "}
        <InlineMath tex={String.raw`r_i = \max(t_k, f_i)`} /> and the <strong>earliest-arrival</strong> unit is
        chosen:
      </p>
      <Equation tex={String.raw`i^\star = \arg\min_{i \in A} \left[\, \max(t_k, f_i) + \frac{d(\text{node}_i,\, c_k)}{v} \,\right].`} />
      <p>
        The chosen unit runs the cycle and its free-time updates by chaining the legs:
      </p>
      <Equation tex={String.raw`t_{\text{sc}} = r_{i^\star} + \tfrac{d(\text{node}_{i^\star}, c_k)}{v}, \quad t_{\text{tr}} = t_{\text{sc}} + s_0, \quad f_{i^\star} = t_{\text{tr}} + \tfrac{d(c_k, h) + d(h, \text{home}_{i^\star})}{v}.`} />
      <p>
        The <strong>response time</strong> of a call is{" "}
        <InlineMath tex={String.raw`R_k = t_{\text{sc}} - t_k`} />. KPIs aggregate over the{" "}
        <InlineMath tex={String.raw`n`} /> served calls: mean response, p90, and{" "}
        <strong>coverage</strong> within the threshold
      </p>
      <Equation tex={String.raw`\text{cov} = \frac{1}{n}\sum_{k=1}^{n} \mathbf{1}\{R_k \le \tau\}.`} />
      <p>
        The <strong>offered load</strong> normalizes total server-busy time against the fleet's capacity over the
        horizon (it is the offered utilization, and <em>can exceed 1</em> when demand outstrips the fleet):
      </p>
      <Equation tex={String.raw`\rho = \frac{\sum_{k} (f_{i^\star(k)} - r_{i^\star(k)})}{c \cdot T}.`} />

      <h3>Scope &amp; assumptions</h3>
      <ul>
        <li>
          <strong>Modeled:</strong> Poisson arrivals, uniform call locations, exact nearest-available routing over
          shortest paths, the full service cycle (travel + scene + transport + return), and all KPIs (mean, p90,
          coverage, load).
        </li>
        <li>
          <strong>Assumptions:</strong> stationary process over{" "}
          <InlineMath tex={String.raw`[0, T]`} />; constant speed and on-scene time (service is
          <em> deterministic per leg</em>, random only through call geometry); a single hospital; stations assigned
          round-robin across the fleet; seeded simulation → reproducible trajectory.
        </li>
        <li>
          <strong>Out of scope:</strong> time-varying traffic/congestion, severity triage, routing to multiple
          hospitals, dynamic unit repositioning, call abandonment and shift schedules.
        </li>
      </ul>

      <p>
        <strong>What each variant shows.</strong> <em>a2 / a3</em> (2-3 units, 1 station): under-resourced, long
        waits and low coverage. <em>a4 vs. a4s1</em>: same fleet of 4, but 2 stations cut travel versus 1 station —
        the pure effect of <strong>siting</strong>. <em>a4s4</em>: 4 units across 4 stations, great geographic
        coverage but less surge capacity. <em>a6</em>: a comfortable fleet for this demand.{" "}
        <em>surge vs. surge6</em>: a spike to <InlineMath tex={String.raw`\lambda = 22`} /> overwhelms 4 units (
        <InlineMath tex={String.raw`\rho`} /> &gt; 1) while 6 absorb it. <em>quiet</em>: low demand, even a small
        fleet covers well. <em>big</em>: a large, well-sited system under heavy load.
      </p>
      <p>
        <strong>How to read the viz.</strong> The grid is the streets; the <strong>station</strong> nodes (accent)
        and the <strong>hospital</strong> (green) are marked. Each <strong>call</strong> appears as a red marker at
        its instant <InlineMath tex={String.raw`t_k`} /> and clears when reached at{" "}
        <InlineMath tex={String.raw`t_{\text{sc}}`} />. The <strong>ambulances</strong> (magenta) animate along
        their legs: base → scene → hospital → base. The HUD reports the KPIs — mean and p90 response, coverage{" "}
        <InlineMath tex={String.raw`\text{cov}`} /> within the threshold, and load{" "}
        <InlineMath tex={String.raw`\rho`} />: when red markers pile up unreached and load passes 100%, the fleet is
        falling behind demand.
      </p>
    </>
  );
}
