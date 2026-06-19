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
    { id: "s07", label: "S07 · " + L("Haul routing", "Ruteo de camiones"), content: <ScenarioExperiment manifestId="s07_haul" description={<S07Desc lang={lang} />} gridKpi={HAUL_KPI} /> },
    { id: "s08", label: "S08 · " + L("Vehicle routing (VRP)", "Ruteo de vehículos (VRP)"), content: <ScenarioExperiment manifestId="s08_vrp" description={<S08Desc lang={lang} />} gridKpi={VRP_KPI} /> },
    { id: "s09", label: "S09 · " + L("Ambulance dispatch", "Despacho ambulancias"), content: <ScenarioExperiment manifestId="s09_ambulance" description={<S09Desc lang={lang} />} gridKpi={AMBULANCE_KPI} /> },
    { id: "s10", label: "S10 · " + L("Monte-Carlo / CI", "Monte-Carlo / IC"), content: <ScenarioExperiment manifestId="s10_montecarlo" description={<S10Desc lang={lang} />} gridKpi={MONTECARLO_KPI} /> },
  ];

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.experiments")}</h1>
        <p className="lede">
          {L(
            "Ten worked case studies across DES, ABM and optimization — queues, segregation, epidemics, emergency flow, supply chains, scheduling, and three geospatial routing problems on a synthetic road network. Each explains the problem and what it addresses, offers ≥10 pre-simulated regimes to compare, an animated player, and a comparison of results.",
            "Diez casos de estudio sobre DES, ABM y optimización — colas, segregación, epidemias, flujo de urgencias, cadenas de suministro, programación y tres problemas de ruteo geoespacial sobre una red vial sintética. Cada uno explica el problema y lo que aborda, ofrece ≥10 regímenes pre-simulados para comparar, un reproductor animado y una comparación de resultados.",
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

function S07Desc({ lang }: { lang: string }) {
  const es = lang === "es";
  return es ? (
    <>
      <h2>El problema: ruteo de acarreo en faena (optimizar-luego-simular)</h2>
      <p>Una flota de camiones cicla entre un punto de <strong>carguío</strong> (terreno bajo) y un <strong>botadero</strong> cuesta arriba, sobre una red vial donde la <strong>elevación maneja el costo</strong>: cargados suben lento hacia el botadero y vuelven rápido vacíos. La ruta de acarreo se elige con un costo de arista <em>graduado</em> por pendiente (Dijkstra); luego un DES reproduce el ciclo. El <strong>cargador</strong> es un recurso compartido — el cuello de botella.</p>
      <p><strong>Qué aborda — emparejar la flota al cargador:</strong> agregar camiones sube el rendimiento solo hasta que el cargador se satura; más allá, los camiones <strong>hacen cola en el cargador</strong> y el rendimiento se estanca mientras la espera explota (compara 9 vs 12 camiones: mismas cargas, el doble de espera). Un segundo o tercer cargador levanta el techo. La pendiente alarga el ciclo cargado (compara <em>plano</em> vs <em>empinado</em>). La animación muestra los camiones subiendo lento y bajando rápido; el HUD cuenta cuántos van en ruta.</p>
    </>
  ) : (
    <>
      <h2>The problem: construction haul routing (optimize-then-simulate)</h2>
      <p>A truck fleet cycles between a <strong>load</strong> point (low ground) and an uphill <strong>dump</strong>, over a road network where <strong>elevation drives cost</strong>: loaded trucks climb slowly toward the dump and return fast empty. The haul route is chosen with a grade-<em>graded</em> edge cost (Dijkstra); a DES then replays the cycle. The shared <strong>loader</strong> is the bottleneck.</p>
      <p><strong>What it addresses — match the fleet to the loader:</strong> adding trucks lifts throughput only until the loader saturates; beyond that, trucks <strong>queue at the loader</strong> and throughput plateaus while the wait explodes (compare 9 vs 12 trucks: identical loads, double the wait). A second or third loader raises the ceiling. Grade lengthens the loaded climb (compare <em>flat</em> vs <em>steep</em>). The animation shows trucks crawling uphill and racing back; the HUD counts how many are en route.</p>
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
