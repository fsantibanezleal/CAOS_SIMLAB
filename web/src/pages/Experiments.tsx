import { useTranslation } from "react-i18next";
import { Tabs } from "@/components/content/Tabs";
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

function S11Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: acarreo minero multidestino — un plan óptimo de flujo vs una flota fija (planificar-luego-simular)</h2>
      <p>Una mina envía mineral desde varias <strong>fases</strong> (puntos de carguío, cada uno con su <em>ley</em> de mineral) hacia tres <strong>tipos de destino</strong>: una <strong>planta</strong> con una ley objetivo, un <strong>botadero</strong> (estéril), y <strong>acopios (stocks)</strong> intermedios — un nodo que es sumidero y, una vez que tiene material, <em>origen</em> para viajes posteriores. Una flota <strong>fija</strong> realiza ciclos de acarreo. Hay dos problemas de optimización acoplados: el <strong>blending</strong> de la alimentación de planta (un LP) y la <strong>ejecución</strong> del plan por la flota (un DES).</p>

      <h3>Componentes y variables</h3>
      <p><strong>Conjuntos:</strong> fases/orígenes <em>i ∈ S</em> (cada una con ley g<sub>i</sub> y disponibilidad a<sub>i</sub>); destinos = {"{"}planta, botadero, acopios{"}"}; la flota de <em>K</em> camiones (capacidad q por viaje). <strong>Parámetros:</strong> demanda de planta <em>D</em>, ley objetivo <em>g*</em> y banda ±<em>τ</em>; tiempos de carga/descarga; el costo de arista <em>graduado</em> por pendiente del terreno; capacidad de cada acopio y su nivel inicial. <strong>Variables de decisión:</strong> el plan de mezcla x<sub>i</sub> (toneladas de cada origen a la planta) — lo resuelve el LP; y, en la simulación, qué <em>flujo</em> sirve cada camión en cada ciclo (la regla de despacho).</p>

      <h3>Formalización</h3>
      <p><strong>(1) LP de blending (OR-Tools GLOP):</strong> elegir x<sub>i</sub> ≥ 0 para minimizar la desviación de ley, linealizada con d⁺, d⁻ ≥ 0:</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", paddingLeft: "1rem" }}>min  d⁺ + d⁻<br />s.a.  Σ<sub>i</sub> x<sub>i</sub> = D&nbsp;&nbsp;(demanda);&nbsp;&nbsp;0 ≤ x<sub>i</sub> ≤ a<sub>i</sub>&nbsp;&nbsp;(disponibilidad);<br />&nbsp;&nbsp;&nbsp;&nbsp;Σ<sub>i</sub> g<sub>i</sub> x<sub>i</sub> − g*·D = d⁺ − d⁻&nbsp;&nbsp;(ley mezclada vs objetivo).</p>
      <p>Como las leyes de las fases <em>rodean</em> al objetivo y la disponibilidad de cada una es limitada, ninguna fase sola satisface la planta: <strong>el plan es una mezcla genuina</strong>. <strong>(2) Costo de ruta:</strong> cada par origen→destino se rutea por el camino más corto bajo el costo graduado costo(a→b) = dist × (1 + ρ·max(0, Δelev)) (Dijkstra). <strong>(3) Ejecución (DES):</strong> los <em>K</em> camiones ciclan carga → acarreo graduado → descarga → retorno; el despacho hace el trabajo factible <em>alcanzable más pronto</em> manteniendo la planta como prioridad. La <strong>ley lograda</strong> es ĝ = (Σ tons·g<sub>origen</sub>) / (Σ tons) sobre lo realmente entregado a la planta; la <strong>adherencia al plan</strong> = entregado / planificado. Un acopio tiene un nivel ℓ(t) que <em>sube</em> al recibir y <em>baja</em> al despachar (ℓ ≥ q para poder originar).</p>

      <h3>Alcances y supuestos</h3>
      <p><strong>Modela:</strong> un <em>turno</em> con fases, leyes, demanda y disponibilidad <strong>dadas</strong>; el plan óptimo de flujo + blending; y su realización por una flota fija bajo rutas graduadas, contención de cargador y disponibilidad de áreas. <strong>La lección:</strong> <em>un plan óptimo es necesario pero no suficiente</em> — una flota insuficiente entrega una versión degradada y, como la fase rica está lejos, <strong>la ley es lo primero que se desajusta</strong>; con suficientes camiones el plan se realiza y la ley vuelve a la banda. <strong>Supuestos:</strong> determinístico y con semilla; capacidad de camión y tiempos fijos; el LP es estático (no re-optimiza en vivo). <strong>Queda fuera</strong> (sería otra herramienta): la planificación por períodos / secuenciamiento de bloques, la ley de corte (Lane), y el despacho re-optimizando en tiempo real. Solver nativo (OR-Tools) ⇒ caso <strong>precomputado</strong>, sin modo en vivo.</p>

      <h3>Qué muestra cada variante</h3>
      <p><strong>undertrucked → base → overtrucked</strong>: la misma demanda con flota creciente — la ley sube de muy baja a dentro de la banda (el plan se realiza). <strong>two_phase_rich</strong>: una meta alta exige la fase rica lejana, que una flota chica no alcanza. <strong>surge / surge12</strong>: un alza de demanda desajusta la ley hasta sumar camiones. <strong>stock_source</strong>: un acopio rico pre-armado alimenta la planta — mira la barra <em>vaciarse</em>. <strong>stock_buffer</strong>: un acopio se <em>llena</em> desde una fase. <strong>low_target</strong>: meta baja apoyada en fases cercanas (fácil). <strong>dump_heavy</strong>: poca planta, casi todo al botadero. <strong>barrier</strong>: un muro alarga la ruta de la fase rica.</p>
      <p><strong>Cómo leer la animación.</strong> Nodos: <strong>fases</strong> (azul), <strong>planta</strong> (verde, con meta de ley), <strong>botadero</strong> (ámbar), <strong>acopio</strong> (magenta) con una <strong>barra de nivel</strong> que sube/baja; las polilíneas de color son los flujos planificados; los camiones suben lento por la ruta graduada; el HUD cuenta los viajes a planta. En la tabla compara <strong>ley lograda vs objetivo</strong> y la <strong>adherencia al plan</strong> al cambiar la flota.</p>
    </>
  ) : (
    <>
      <h2>The problem: multi-destination mine haul — an optimal flow plan vs a fixed fleet (plan-then-simulate)</h2>
      <p>A mine sends ore from several <strong>phases</strong> (load points, each with an ore <em>grade</em>) to three <strong>destination kinds</strong>: a <strong>plant</strong> with a grade target, a <strong>dump</strong> (waste), and intermediate <strong>stockpiles</strong> — a node that is a sink and, once it holds material, a <em>source</em> for later trips. A <strong>fixed</strong> fleet runs haul cycles. Two coupled optimization problems: the plant-feed <strong>blend</strong> (an LP) and the fleet's <strong>execution</strong> of the plan (a DES).</p>

      <h3>Components &amp; variables</h3>
      <p><strong>Sets:</strong> phases/sources <em>i ∈ S</em> (each with grade g<sub>i</sub> and availability a<sub>i</sub>); destinations = {"{"}plant, dump, stocks{"}"}; a fleet of <em>K</em> trucks (capacity q per trip). <strong>Parameters:</strong> plant demand <em>D</em>, grade target <em>g*</em> with band ±<em>τ</em>; load/tip times; the slope-<em>graded</em> edge cost; each stock's capacity and initial level. <strong>Decision variables:</strong> the blend plan x<sub>i</sub> (tonnes from each source to the plant) — solved by the LP; and, in the simulation, which <em>flow</em> each truck serves per cycle (the dispatch rule).</p>

      <h3>Formalization</h3>
      <p><strong>(1) Blending LP (OR-Tools GLOP):</strong> choose x<sub>i</sub> ≥ 0 to minimize the grade deviation, linearized with d⁺, d⁻ ≥ 0:</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", paddingLeft: "1rem" }}>min  d⁺ + d⁻<br />s.t.  Σ<sub>i</sub> x<sub>i</sub> = D&nbsp;&nbsp;(demand);&nbsp;&nbsp;0 ≤ x<sub>i</sub> ≤ a<sub>i</sub>&nbsp;&nbsp;(availability);<br />&nbsp;&nbsp;&nbsp;&nbsp;Σ<sub>i</sub> g<sub>i</sub> x<sub>i</sub> − g*·D = d⁺ − d⁻&nbsp;&nbsp;(blended grade vs target).</p>
      <p>Because the phase grades <em>straddle</em> the target and each phase's availability is capped, no single phase satisfies the plant: <strong>the plan is a genuine blend</strong>. <strong>(2) Route cost:</strong> each source→destination pair is routed by the shortest path under the graded cost cost(a→b) = dist × (1 + ρ·max(0, Δelev)) (Dijkstra). <strong>(3) Execution (DES):</strong> the <em>K</em> trucks cycle load → graded haul → tip → return; dispatch does the feasible job <em>reachable soonest</em> with the plant as priority. The <strong>achieved grade</strong> is ĝ = (Σ tons·g<sub>source</sub>) / (Σ tons) over what was actually delivered to the plant; <strong>plan adherence</strong> = delivered / planned. A stock holds a level ℓ(t) that <em>rises</em> on tip-in and <em>falls</em> on draw-out (ℓ ≥ q to be able to source).</p>

      <h3>Scope &amp; assumptions</h3>
      <p><strong>Models:</strong> one <em>shift</em> with phases, grades, demand and availability <strong>given</strong>; the optimal flow + blend plan; and its realization by a fixed fleet under graded routes, loader contention and area availability. <strong>The lesson:</strong> <em>an optimal plan is necessary but not sufficient</em> — an under-sized fleet realizes a degraded version and, because the rich phase is far, <strong>the grade target slips first</strong>; with enough trucks the plan is realized and the grade returns to band. <strong>Assumptions:</strong> deterministic and seeded; fixed truck capacity and service times; the LP is static (no live re-optimization). <strong>Out of scope</strong> (a separate tool): period scheduling / block sequencing, cut-off-grade (Lane's algorithm), and real-time re-optimizing dispatch. Native solver (OR-Tools) ⇒ a <strong>precomputed</strong> case, no live lane.</p>

      <h3>What each variant shows</h3>
      <p><strong>undertrucked → base → overtrucked</strong>: the same demand with a growing fleet — the grade climbs from far-off to inside the band (the plan is realized). <strong>two_phase_rich</strong>: a high target needs the distant rich phase a small fleet can't deliver. <strong>surge / surge12</strong>: a demand surge throws the grade off until trucks are added. <strong>stock_source</strong>: a pre-built rich stock feeds the plant — watch the bar <em>drain</em>. <strong>stock_buffer</strong>: a stock <em>fills</em> from a phase. <strong>low_target</strong>: a low target leans on the near phases (easy). <strong>dump_heavy</strong>: little to the plant, most to the dump. <strong>barrier</strong>: a wall lengthens the rich phase's road.</p>
      <p><strong>How to read the viz.</strong> Nodes: <strong>phases</strong> (blue), <strong>plant</strong> (green, grade target), <strong>dump</strong> (amber), <strong>stock</strong> (magenta) with a <strong>fill bar</strong> that rises/falls; the coloured polylines are the planned flows; trucks crawl uphill on the graded route; the HUD counts trips to the plant. In the table, compare <strong>grade achieved vs target</strong> and <strong>plan adherence</strong> as you change the fleet.</p>
    </>
  );
}

function S07Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: ruteo de acarreo en faena — una cola cerrada de fuente finita (optimizar-luego-simular)</h2>
      <p>Una flota fija de camiones recircula sin fin entre un punto de <strong>carguío</strong> (terreno bajo) y un <strong>botadero</strong>, sobre una red vial sintética donde <strong>un cordón de terreno alto separa ambos</strong> y la <strong>elevación maneja el costo</strong>. Cada camión repite un ciclo de cuatro fases: <strong>carga</strong> en el cargador compartido, <strong>acarreo cargado</strong> cruzando el cordón, <strong>descarga</strong>, y <strong>retorno vacío</strong> rápido. La ruta minimiza un costo de arista <em>graduado</em> — costo(a→b) = distancia × (1 + pendiente × max(0, subida)), penalizando solo lo cuesta arriba — resuelto exacto con <strong>Dijkstra</strong>; el retorno vacío usa distancia simple. Ese es el paso <em>optimizar</em>. Luego un bucle de eventos discretos con semilla <em>simula</em> el ciclo.</p>
      <p><strong>El trade-off de ruta que crea el cordón.</strong> Subir recto por la cima es corto pero trepa fuerte; desviarse a un <strong>paso</strong> bajo es más largo pero casi plano. Como solo se penaliza subir, la ruta óptima <strong>salta en una pendiente crítica</strong> (aquí g* ≈ 3,4): bajo ella gana la subida directa, sobre ella la ruta salta al paso. Mueve el paso, la columna de carga, o pon una <strong>barrera</strong> en la línea directa y la ruta vuelve a cambiar — independiente de la pendiente.</p>
      <p><strong>El modelo — por qué no es la M/M/c de S01.</strong> Los camiones son una <strong>población finita que llama</strong>, no un flujo infinito: un camión no puede volver a pedir el cargador hasta terminar su ida y vuelta. Es la clásica <strong>cola de reparación de máquinas (fuente finita), M/M/1//N</strong> — los camiones son las N “máquinas”, el <strong>cargador es el servidor</strong>, el recurso que ata; las llegadas dependen del estado.</p>
      <p><strong>Qué aborda — emparejar la flota al cargador.</strong> El rendimiento nunca supera la tasa del cargador (techo = cargadores ÷ tiempo de carga); al crecer la flota se <strong>satura</strong> en ese techo y cada camión extra solo agrega cola y costo. El atajo minero es el <strong>factor de emparejamiento</strong> MF = (camiones × tiempo de carga) ÷ (cargadores × tiempo de ciclo): <strong>MF &lt; 1</strong> sub-equipa (cargador ocioso), <strong>MF ≈ 1</strong> empareja (cargador a pleno, ~sin cola), <strong>MF &gt; 1</strong> sobre-equipa (cola persistente, rendimiento clavado). Con variabilidad el óptimo práctico cae un poco bajo MF = 1.</p>
      <p><strong>Qué muestra cada variante.</strong> <em>r_low/r_mid/r_switch/r_steep</em> barren la pendiente cruzando el salto (directa → paso); <em>r_passR</em> mueve el paso; <em>r_wall</em> redirige por una barrera aun a pendiente baja; <em>f_t2</em> (cargador ocioso) → <em>f_t6</em> → <em>f_t12</em> (sobre-equipado: cargas casi iguales, ~el doble de espera); <em>f_l2t12 / f_l3t12</em> (más cargadores suben el techo); <em>x_steep2 / x_flat</em> acoplan pendiente y flota.</p>
      <p><strong>Cómo leer la animación.</strong> El <strong>campo sombreado</strong> muestra el cordón (cálido) y el paso bajo (frío); los camiones suben lento por la ruta graduada y bajan rápido vacíos; los nodos marcan <strong>carguío</strong> (verde) y <strong>botadero</strong> (ámbar); la línea tenue es la ruta elegida (se mueve al paso al subir la pendiente); el HUD cuenta los camiones en ruta. En la tabla, mira cómo <strong>rendimiento/hr</strong> se aplana mientras <strong>espera cargador/carga</strong> sigue subiendo cruzado MF ≈ 1.</p>
    </>
  ) : (
    <>
      <h2>The problem: construction haul routing — a closed finite-source queue (optimize-then-simulate)</h2>
      <p>A fixed fleet of trucks endlessly recirculates between a <strong>load</strong> point (low ground) and a <strong>dump</strong>, over a synthetic road network where <strong>a ridge of high ground walls the two apart</strong> and <strong>elevation drives cost</strong>. Each truck repeats a four-phase cycle: <strong>load</strong> at the shared loader, <strong>loaded haul</strong> crossing the ridge, <strong>dump</strong>, and a fast <strong>empty return</strong>. The route minimizes a grade-<em>graded</em> edge cost — cost(a→b) = distance × (1 + grade × max(0, climb)), only uphill segments penalized — solved exactly with <strong>Dijkstra</strong>; the empty return uses plain distance. That is the <em>optimize</em> step. A seeded discrete-event loop then <em>simulates</em> the cycle.</p>
      <p><strong>The route trade-off the ridge creates.</strong> Going straight over the crest is short but climbs hard; detouring to a low <strong>pass</strong> is longer but nearly flat. Because only climbing is penalized, the optimal route <strong>switches at a critical grade</strong> (here g* ≈ 3.4): below it the direct climb wins, above it the route flips to the pass. Move the pass, the lift column, or drop a <strong>barrier</strong> across the direct line and the route changes again — independent of grade.</p>
      <p><strong>The model — why this is not the M/M/c of S01.</strong> The trucks are a <strong>finite calling population</strong>, not an infinite arrival stream: a truck cannot demand the loader again until it finishes its haul-and-return. This is the classic <strong>machine-repair (finite-source) queue, M/M/1//N</strong> — trucks are the N “machines”, the <strong>loader is the repair server</strong>, the binding resource; arrivals are state-dependent.</p>
      <p><strong>What it addresses — match the fleet to the loader.</strong> Throughput can never exceed the loader's rate (ceiling = loaders ÷ load time); as the fleet grows it <strong>saturates</strong> at that ceiling and each extra truck adds only queue and cost. The mining shorthand is the <strong>match factor</strong> MF = (trucks × load time) ÷ (loaders × travel-cycle time): <strong>MF &lt; 1</strong> under-trucks (loader idles), <strong>MF ≈ 1</strong> is matched (loader full, ~no queue), <strong>MF &gt; 1</strong> over-trucks (persistent queue, throughput pinned). Under variability the practical optimum sits slightly below MF = 1.</p>
      <p><strong>What each variant shows.</strong> <em>r_low/r_mid/r_switch/r_steep</em> sweep grade across the switch (direct → pass); <em>r_passR</em> moves the pass; <em>r_wall</em> reroutes via a barrier even at low grade; <em>f_t2</em> (loader idles) → <em>f_t6</em> → <em>f_t12</em> (over-trucked: near-identical loads, ~double the wait); <em>f_l2t12 / f_l3t12</em> (extra loaders lift the ceiling); <em>x_steep2 / x_flat</em> couple grade and fleet.</p>
      <p><strong>How to read the viz.</strong> The <strong>shaded field</strong> shows the ridge (warm) and the low pass (cool); trucks crawl uphill on the graded route and race back empty; node colours mark <strong>load</strong> (green) and <strong>dump</strong> (amber); the faint line is the chosen haul route (it visibly moves to the pass as grade rises); the HUD counts trucks en route. In the KPI table, watch <strong>throughput/hr</strong> flatten while <strong>loader wait/load</strong> keeps climbing once you cross MF ≈ 1.</p>
    </>
  );
}

function S08Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: ruteo de vehículos capacitado (VRP, OR-Tools)</h2>
      <p>Un depósito y N clientes con demanda sobre una red vial; hay que rutear K vehículos con <strong>capacidad</strong> limitada para servir a todos minimizando la distancia total. Las distancias son caminos más cortos en la grilla. Es <strong>optimización combinatoria</strong> pura: el solver de ruteo de <strong>OR-Tools</strong> es código nativo, por lo que el caso es precomputado y se reproduce el plan óptimo como vehículos recorriendo la red.</p>
      <p><strong>Qué aborda — el compromiso distancia total ↔ ruta más larga:</strong> con menos vehículos la distancia total baja pero la ruta más larga crece (peor balance de jornada); un coeficiente de <em>span global</em> equilibra las rutas, de modo que sumar vehículos acorta la ruta máxima a costa de algo de distancia total. Compara capacidad ajustada, número de vehículos y densidad de clientes; la animación muestra cada vehículo (un color por ruta) saliendo del depósito y volviendo.</p>
    </>
  ) : (
    <>
      <h2>The problem: capacitated vehicle routing (VRP, OR-Tools)</h2>
      <p>A depot and N customers with demand on a road network; route K <strong>capacity</strong>-limited vehicles to serve everyone minimizing total distance. Distances are grid shortest paths. This is pure <strong>combinatorial optimization</strong>: the <strong>OR-Tools</strong> routing solver is native code, so the case is precomputed and the optimal plan is replayed as vehicles driving the network.</p>
      <p><strong>What it addresses — the total-distance ↔ longest-route trade-off:</strong> fewer vehicles cut total distance but lengthen the longest route (worse shift balance); a <em>global-span</em> cost balances the routes, so adding vehicles shortens the max route at the cost of some total distance. Compare tight capacity, vehicle count, and customer density; the animation shows each vehicle (one colour per route) leaving the depot and returning.</p>
    </>
  );
}

function S09Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: despacho de ambulancias (EMS estocástico)</h2>
      <p>Los llamados de emergencia llegan como un proceso de <strong>Poisson</strong> en ubicaciones aleatorias de la red. Las ambulancias esperan en <strong>bases</strong>; cada llamado lo atiende la unidad que puede <strong>llegar antes</strong> (nearest-available, contando a las que siguen ocupadas). La ambulancia viaja a la escena, atiende, traslada al hospital y vuelve a su base. DES puro, con semilla.</p>
      <p><strong>Qué aborda — dimensionar y ubicar la flota:</strong> con pocas unidades la <em>carga ofrecida</em> supera el 100% (el sistema se desborda: cobertura baja, respuesta larga); a igual flota, <strong>más bases bien ubicadas</strong> bajan el tiempo de viaje (compara 4 ambulancias en 1 vs 2 vs 4 bases); y un <strong>alza de demanda</strong> hunde la cobertura hasta que se agregan unidades. La métrica clave es la <strong>cobertura dentro de la meta de respuesta</strong>. La animación muestra los llamados como anillos rojos pulsantes y las ambulancias despachadas hacia ellos; el HUD cuenta los llamados pendientes.</p>
    </>
  ) : (
    <>
      <h2>The problem: ambulance dispatch (stochastic EMS)</h2>
      <p>Emergency calls arrive as a <strong>Poisson</strong> process at random locations on the network. Ambulances wait at <strong>stations</strong>; each call is served by the unit that can <strong>reach it earliest</strong> (nearest-available, accounting for those still busy). The ambulance drives to the scene, treats, transports to hospital, and returns to base. Pure DES, seeded.</p>
      <p><strong>What it addresses — fleet sizing and station siting:</strong> with too few units the <em>offered load</em> exceeds 100% (the system is overwhelmed: low coverage, long response); for a fixed fleet, <strong>more well-sited stations</strong> cut travel time (compare 4 ambulances over 1 vs 2 vs 4 stations); and a <strong>demand surge</strong> collapses coverage until units are added. The headline metric is <strong>coverage within the response target</strong>. The animation shows calls as pulsing red rings with ambulances dispatched toward them; the HUD counts pending calls.</p>
    </>
  );
}
