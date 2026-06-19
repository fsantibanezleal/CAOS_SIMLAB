import { useTranslation } from "react-i18next";
import { Tabs } from "@/components/content/Tabs";
import { Callout } from "@/components/content/Callout";
import { Equation } from "@/components/content/Equation";
import { useLang } from "@/lib/useLang";

export default function Theory() {
  const { t } = useTranslation();
  const lang = useLang();
  const es = lang === "es";

  const tabs = [
    { id: "des", label: es ? "Fundamentos de DES" : "DES fundamentals", content: <Des es={es} /> },
    { id: "queue", label: es ? "Teoría de colas (M/M/c)" : "Queueing theory (M/M/c)", content: <Queue es={es} /> },
    { id: "valid", label: es ? "Validación y réplicas" : "Validation & replications", content: <Valid es={es} /> },
    { id: "abm", label: "ABM", content: <Abm es={es} /> },
  ];

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.theory")}</h1>
        <p className="lede">
          {es
            ? "Los conceptos desde cero — el motor de eventos, la teoría de colas y sus fórmulas, la honestidad estadística, y los modelos basados en agentes."
            : "The concepts from zero — the event engine, queueing theory and its formulas, statistical honesty, and agent-based models."}
        </p>
      </div>
      <Tabs tabs={tabs} ariaLabel={t("nav.theory")} />
    </div>
  );
}

function Des({ es }: { es: boolean }) {
  return (
    <article className="prose">
      <h2>{es ? "El reloj de eventos" : "The event clock"}</h2>
      <p>
        {es
          ? "En la Simulación de Eventos Discretos, el estado del sistema solo cambia en instantes puntuales llamados eventos. En vez de avanzar el tiempo en pasos fijos, el simulador mantiene una lista de eventos futuros ordenada por tiempo y salta directamente al siguiente. Entre eventos no pasa nada relevante, así que saltarlos es exacto y eficiente."
          : "In Discrete-Event Simulation, the system state changes only at distinct instants called events. Rather than advancing time in fixed steps, the simulator keeps a time-ordered list of future events and jumps straight to the next one. Nothing relevant happens between events, so skipping them is both exact and efficient."}
      </p>
      <h3>{es ? "Los ingredientes" : "The ingredients"}</h3>
      <ul>
        <li><strong>{es ? "Entidades" : "Entities"}</strong> — {es ? "los objetos que fluyen (clientes, pacientes, piezas)." : "the objects that flow (customers, patients, parts)."}</li>
        <li><strong>{es ? "Recursos" : "Resources"}</strong> — {es ? "lo escaso por lo que compiten (servidores, camas, máquinas)." : "the scarce things they compete for (servers, beds, machines)."}</li>
        <li><strong>{es ? "Eventos" : "Events"}</strong> — {es ? "llegada, inicio de servicio, salida." : "arrival, service start, departure."}</li>
        <li><strong>{es ? "Cola" : "Queue"}</strong> — {es ? "dónde esperan las entidades cuando el recurso está ocupado." : "where entities wait when the resource is busy."}</li>
        <li><strong>{es ? "Reloj y aleatoriedad" : "Clock & randomness"}</strong> — {es ? "el tiempo de simulación y los tiempos entre llegadas / de servicio, muestreados de distribuciones con una semilla fija." : "simulation time and the inter-arrival / service times, sampled from distributions with a fixed seed."}</li>
      </ul>
      <Callout variant="strong" title={es ? "Semilla = reproducibilidad" : "Seed = reproducibility"}>
        <p>
          {es
            ? "Toda la aleatoriedad sale de un generador con semilla. Misma semilla y mismos parámetros ⇒ exactamente la misma corrida. Por eso un trace puede reproducirse idéntico — la base de este laboratorio."
            : "All randomness comes from one seeded generator. Same seed and parameters ⇒ exactly the same run. That is why a trace can be replayed identically — the foundation of this lab."}
        </p>
      </Callout>
      <p>
        {es
          ? "En la pestaña Experimentos, la animación es literalmente este bucle de eventos reproduciéndose: cada punto que entra a la cola, cada servidor que se ocupa, cada salida, es un evento del trace."
          : "On the Experiments tab, the animation is literally this event loop playing back: each dot entering the queue, each server turning busy, each departure, is an event from the trace."}
      </p>
    </article>
  );
}

function Queue({ es }: { es: boolean }) {
  return (
    <article className="prose">
      <h2>{es ? "La cola M/M/c" : "The M/M/c queue"}</h2>
      <p>
        {es
          ? "Notación de Kendall A/B/c: A = distribución de llegadas, B = distribución de servicio, c = número de servidores. M significa markoviano (exponencial, sin memoria). Definimos la tasa de llegada λ, la tasa de servicio por servidor μ, y la carga ofrecida a = λ/μ (en Erlangs)."
          : "Kendall notation A/B/c: A = arrival distribution, B = service distribution, c = number of servers. M means Markovian (exponential, memoryless). Define the arrival rate λ, the per-server service rate μ, and the offered load a = λ/μ (in Erlangs)."}
      </p>
      <h3>{es ? "Utilización" : "Utilization"}</h3>
      <Equation tex="\rho = \frac{\lambda}{c\,\mu}" caption={es ? "Fracción de la capacidad en uso; el sistema es estable solo si ρ < 1." : "Fraction of capacity in use; the system is stable only if ρ < 1."} />
      <h3>{es ? "Probabilidad de esperar (Erlang-C)" : "Probability of waiting (Erlang-C)"}</h3>
      <Equation tex="C(c,a) = \frac{\dfrac{a^{c}}{c!}\,\dfrac{1}{1-\rho}}{\displaystyle\sum_{k=0}^{c-1}\frac{a^{k}}{k!} + \dfrac{a^{c}}{c!}\,\dfrac{1}{1-\rho}}" caption={es ? "Probabilidad de que una llegada encuentre todos los servidores ocupados." : "Probability that an arrival finds all servers busy."} />
      <h3>{es ? "Espera media en cola" : "Mean wait in queue"}</h3>
      <Equation tex="W_q = \frac{C(c,a)}{c\,\mu - \lambda}" caption={es ? "Tiempo medio en cola antes de ser atendido." : "Mean time spent in queue before service."} />
      <h3>{es ? "Ley de Little" : "Little's Law"}</h3>
      <p>
        {es ? "Una identidad notable, válida para casi cualquier sistema estable: el número medio en el sistema es la tasa de llegada por el tiempo medio en el sistema." : "A remarkable identity, valid for almost any stable system: the mean number in the system equals the arrival rate times the mean time in the system."}
      </p>
      <Equation tex="L = \lambda\,W \qquad\Longrightarrow\qquad L_q = \lambda\,W_q" />
      <Callout variant="honest" title={es ? "El codo de ρ→1" : "The ρ→1 knee"}>
        <p>
          {es
            ? "Como Wq lleva (cμ − λ) en el denominador, la espera crece sin límite cuando ρ se acerca a 1. Por eso el régimen «casi saturada» (ρ=0.95) sufre esperas enormes y el «inestable» (ρ>1) no tiene estado estacionario: la fórmula da Wq = ∞."
            : "Because Wq has (cμ − λ) in the denominator, the wait grows without bound as ρ approaches 1. That is why the 'near-saturation' regime (ρ=0.95) suffers huge waits and the 'unstable' one (ρ>1) has no steady state — the formula gives Wq = ∞."}
        </p>
      </Callout>
    </article>
  );
}

function Valid({ es }: { es: boolean }) {
  return (
    <article className="prose">
      <h2>{es ? "Por qué una sola corrida no basta" : "Why one run is not enough"}</h2>
      <p>
        {es
          ? "Una simulación estocástica es un experimento aleatorio: cada corrida da un resultado distinto. La espera media de una sola corrida es un estimador ruidoso del valor verdadero de largo plazo. En Experimentos verás el Wq simulado diferir del Wq teórico — no es un error, es varianza muestral."
          : "A stochastic simulation is a random experiment: each run gives a different result. The mean wait from a single run is a noisy estimate of the true long-run value. In Experiments you will see the simulated Wq differ from the theoretical Wq — that is not a bug, it is sampling variance."}
      </p>
      <h3>{es ? "Réplicas e intervalos de confianza" : "Replications & confidence intervals"}</h3>
      <p>
        {es ? "La solución es correr N réplicas independientes (distintas semillas) y promediar, reportando un intervalo de confianza:" : "The fix is to run N independent replications (different seeds) and average, reporting a confidence interval:"}
      </p>
      <Equation tex="\bar{X} \pm t_{\,n-1,\,1-\alpha/2}\;\frac{s}{\sqrt{n}}" caption={es ? "Intervalo de confianza para la media sobre n réplicas." : "Confidence interval for the mean over n replications."} />
      <p>
        {es
          ? "La suite de tests de este proyecto hace exactamente esto: promedia 24 réplicas del régimen moderado y verifica que caiga dentro del 15% de la teoría de Erlang-C. Es la prueba de validación."
          : "This project's test suite does exactly this: it averages 24 replications of the moderate regime and checks it lands within 15% of the Erlang-C theory. That is the validation test."}
      </p>
      <h3>{es ? "Calentamiento (transitorio inicial)" : "Warm-up (initial transient)"}</h3>
      <p>
        {es
          ? "Un sistema que arranca vacío no está en su régimen estacionario hasta pasado un tiempo. Para métricas de estado estacionario se descarta ese 'calentamiento' inicial. (Aquí mostramos la corrida completa con fines didácticos.)"
          : "A system that starts empty is not in steady state until some time has passed. For steady-state metrics, that initial 'warm-up' is discarded. (Here we show the full run for teaching purposes.)"}
      </p>
      <Callout variant="honest" title={es ? "Verificación vs validación" : "Verification vs validation"}>
        <p>
          {es
            ? "Verificación = ¿construí bien el modelo? (sin bugs). Validación = ¿es el modelo correcto? (concuerda con la realidad o con la teoría). El M/M/c permite ambas porque tiene solución cerrada — un lujo que la mayoría de los sistemas reales no tienen."
            : "Verification = did I build the model right? (no bugs). Validation = is it the right model? (agrees with reality or theory). M/M/c allows both because it has a closed form — a luxury most real systems lack."}
        </p>
      </Callout>
    </article>
  );
}

function Abm({ es }: { es: boolean }) {
  return (
    <article className="prose">
      <h2>{es ? "Modelos Basados en Agentes" : "Agent-Based Models"}</h2>
      <p>
        {es
          ? "Donde DES modela el flujo de entidades por recursos, ABM modela muchos agentes autónomos que siguen reglas locales. No se programa el comportamiento global — este emerge de las interacciones. El patrón: agente + entorno + reglas + un planificador que decide el orden de actuación."
          : "Where DES models the flow of entities through resources, ABM models many autonomous agents following local rules. Global behaviour is not programmed — it emerges from interactions. The pattern: agent + environment + rules + a scheduler deciding the order of action."}
      </p>
      <ul>
        <li><strong>{es ? "Agente" : "Agent"}</strong> — {es ? "estado + reglas (p. ej. una persona con una preferencia)." : "state + rules (e.g. a person with a preference)."}</li>
        <li><strong>{es ? "Entorno" : "Environment"}</strong> — {es ? "el espacio (una grilla, una red) y los vecinos." : "the space (a grid, a network) and the neighbours."}</li>
        <li><strong>{es ? "Emergencia" : "Emergence"}</strong> — {es ? "segregación (Schelling), epidemias (SIR), bandadas." : "segregation (Schelling), epidemics (SIR), flocking."}</li>
      </ul>
      <Callout variant="note" title={es ? "Próximamente en Experimentos" : "Coming to Experiments"}>
        <p>
          {es
            ? "Los escenarios ABM (epidemia SIR, segregación de Schelling) llegan en una próxima fase, con el motor Mesa y el mismo patrón de regímenes pre-simulados y replay determinista."
            : "The ABM scenarios (SIR epidemic, Schelling segregation) arrive in a later phase, using the Mesa engine and the same pre-simulated-regime + deterministic-replay pattern."}
        </p>
      </Callout>
    </article>
  );
}
