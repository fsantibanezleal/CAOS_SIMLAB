import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Tabs } from "@/components/content/Tabs";
import { SubTabs } from "@/components/content/SubTabs";
import { Callout } from "@/components/content/Callout";
import { Equation } from "@/components/content/Equation";
import { Refs, ReferenceList } from "@/components/content/Cite";
import {
  BirthDeathChain, EmergenceGrid, ErlangCKnee, EventLoopTimeline, MMcSchematic, PoolingBars,
  ReplicationsCI, SIRFlow,
} from "@/components/figures/Figures";
import { useLang } from "@/lib/useLang";
import type { CitationId } from "@/data/citations";

const REFS_LABEL = { en: "References:", es: "Referencias:" };

export default function Theory() {
  const { t } = useTranslation();
  const es = useLang() === "es";
  const refsLabel = es ? REFS_LABEL.es : REFS_LABEL.en;

  function Assume({ title, items }: { title: string; items: ReactNode[] }) {
    return (
      <div className="assume">
        <p className="assume-title">{title}</p>
        <ul>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
      </div>
    );
  }
  function R({ ids }: { ids: CitationId[] }) {
    return <Refs ids={ids} label={refsLabel} />;
  }
  const aTitle = es ? "Supuestos y límites" : "Assumptions & limits";

  // ── Queueing sub-tabs ──
  const queueTabs = [
    {
      id: "kendall",
      label: es ? "Notación y modelo M/M/c" : "Notation & the M/M/c model",
      content: (
        <div className="prose">
          <div className="fig-row">
            <div>
              <p>{es
                ? "La notación de Kendall A/B/c describe una estación de servicio: A = proceso de llegadas, B = distribución del tiempo de servicio, c = número de servidores idénticos en paralelo. «M» significa markoviano (sin memoria): llegadas de Poisson con tasa λ ⇒ tiempos entre llegadas exponenciales, y servicio exponencial con tasa μ por servidor."
                : "Kendall's A/B/c notation describes a service station: A = arrival process, B = service-time distribution, c = number of identical parallel servers. \"M\" means Markovian (memoryless): Poisson arrivals at rate λ ⇒ exponential interarrival times, and exponential service at rate μ per server."}</p>
              <p>{es
                ? "El M/M/c es el caballo de batalla de la teoría de colas y el escenario insignia de este laboratorio: un banco o una clínica donde clientes aleatorios compiten por c servidores. Su valor didáctico es que tiene solución cerrada exacta, así que el simulador puede validarse contra la teoría."
                : "The M/M/c is the workhorse of queueing theory and this lab's flagship scenario: a bank or clinic where random customers compete for c servers. Its didactic value is that it has an exact closed-form solution, so the simulator can be validated against theory."}</p>
            </div>
            <MMcSchematic cap={es ? "Estación M/M/c: llegadas Poisson → cola FIFO → c servidores → salida." : "M/M/c station: Poisson arrivals → FIFO queue → c servers → departures."} />
          </div>
          <Assume title={aTitle} items={[
            es ? "Llegadas de Poisson (independientes, tasa constante λ)." : "Poisson arrivals (independent, constant rate λ).",
            es ? "Servicio exponencial idéntico en cada servidor (tasa μ); disciplina FIFO." : "Identical exponential service at each server (rate μ); FIFO discipline.",
            es ? "Capacidad y población infinitas; sin abandono ni rechazo (a diferencia de M/M/c/K)." : "Infinite capacity and population; no balking or reneging (unlike M/M/c/K).",
          ]} />
          <R ids={["kendall1953", "grossharris2018"]} />
        </div>
      ),
    },
    {
      id: "ctmc",
      label: es ? "Cadena de nacimiento-muerte" : "Birth–death CTMC",
      content: (
        <div className="prose">
          <p>{es
            ? "El número de clientes en el sistema N(t) es una cadena de Markov de tiempo continuo de tipo nacimiento-muerte. La tasa de «nacimiento» (llegada) es λ en todo estado; la tasa de «muerte» (salida) es n·μ mientras n ≤ c servidores están ocupados, y se satura en c·μ para n ≥ c."
            : "The number in system N(t) is a birth–death continuous-time Markov chain. The \"birth\" (arrival) rate is λ in every state; the \"death\" (departure) rate is n·μ while n ≤ c servers are busy, saturating at c·μ for n ≥ c."}</p>
          <BirthDeathChain cap={es ? "CTMC del M/M/c: nacimiento λ, muerte min(n,c)·μ." : "M/M/c CTMC: birth λ, death min(n,c)·μ."} />
          <p>{es ? "El balance detallado entre estados adyacentes da la distribución estacionaria:" : "Detailed balance between adjacent states gives the steady-state distribution:"}</p>
          <Equation tex="P_n = \begin{cases} \dfrac{a^{n}}{n!}\,P_0, & 0 \le n \le c \\[1.2em] \dfrac{a^{n}}{c!\,c^{\,n-c}}\,P_0, & n \ge c \end{cases} \qquad a=\frac{\lambda}{\mu}" />
          <Equation tex="P_0 = \left[\sum_{n=0}^{c-1}\frac{a^{n}}{n!} + \frac{a^{c}}{c!}\,\frac{1}{1-\rho}\right]^{-1}" caption={es ? "Probabilidad de sistema vacío (normalización), con ρ = a/c." : "Empty-system probability (normalization), with ρ = a/c."} />
          <R ids={["grossharris2018", "kendall1953"]} />
        </div>
      ),
    },
    {
      id: "erlangc",
      label: "Erlang-C (Wq, Lq)",
      content: (
        <div className="prose">
          <p>{es
            ? "La fórmula de Erlang-C da la probabilidad de que una llegada deba esperar (todos los servidores ocupados):"
            : "The Erlang-C formula gives the probability an arrival must wait (all servers busy):"}</p>
          <Equation tex="C(c,a) = \frac{\dfrac{a^{c}}{c!}\,\dfrac{1}{1-\rho}}{\displaystyle\sum_{k=0}^{c-1}\frac{a^{k}}{k!} + \dfrac{a^{c}}{c!}\,\dfrac{1}{1-\rho}}" />
          <p>{es ? "De ahí salen las métricas operativas (espera y longitud medias en cola):" : "From it follow the operational metrics (mean wait and queue length):"}</p>
          <Equation tex="W_q = \frac{C(c,a)}{c\mu - \lambda}, \qquad L_q = \lambda W_q, \qquad W = W_q + \frac{1}{\mu}, \qquad L = \lambda W" />
          <p className="measure">{es
            ? "Esta es la referencia exacta contra la que el laboratorio contrasta el Wq simulado en sus 12 regímenes — la columna «Wq teoría» de la tabla de comparación."
            : "This is the exact reference against which the lab checks the simulated Wq across its 12 regimes — the \"Wq theory\" column in the comparison table."}</p>
          <R ids={["erlang1917", "grossharris2018", "little1961"]} />
        </div>
      ),
    },
    {
      id: "little",
      label: es ? "Ley de Little" : "Little's Law",
      content: (
        <div className="prose">
          <p className="measure">{es
            ? "Una de las identidades más generales de la teoría de colas, válida para casi cualquier sistema estable sin importar las distribuciones: el número medio de clientes en el sistema es igual a la tasa de llegada por el tiempo medio de permanencia."
            : "One of the most general identities in queueing theory, valid for almost any stable system regardless of the distributions: the mean number of customers in the system equals the arrival rate times the mean time spent in it."}</p>
          <Equation tex="L = \lambda\, W \qquad\Longrightarrow\qquad L_q = \lambda\, W_q" caption={es ? "Ley de Little, en sistema completo y en cola." : "Little's Law, for the whole system and for the queue."} />
          <p>{es ? "El laboratorio la usa como verificación de cordura: el Lq medido debe igualar λ·Wq en cada régimen." : "The lab uses it as a sanity check: the measured Lq must equal λ·Wq in every regime."}</p>
          <R ids={["little1961"]} />
        </div>
      ),
    },
    {
      id: "kingman",
      label: es ? "El codo ρ→1 (Kingman)" : "The ρ→1 knee (Kingman)",
      content: (
        <div className="prose">
          <div className="fig-row rev">
            <ErlangCKnee cap={es ? "La espera diverge cuando ρ → 1." : "Waiting diverges as ρ → 1."} />
            <div>
              <p>{es
                ? "Como Wq lleva (cμ − λ) en el denominador, la espera crece sin límite cuando la utilización ρ se acerca a 1. La aproximación de tráfico pesado de Kingman para colas generales G/G/1 muestra que esto no es exclusivo del M/M/c:"
                : "Because Wq carries (cμ − λ) in the denominator, waiting grows without bound as utilization ρ approaches 1. Kingman's heavy-traffic approximation for general G/G/1 queues shows this is not special to M/M/c:"}</p>
              <Equation tex="W_q \;\approx\; \left(\frac{\rho}{1-\rho}\right)\!\left(\frac{c_a^{2}+c_s^{2}}{2}\right)\frac{1}{\mu}" caption={es ? "c_a, c_s = coef. de variación de llegadas y servicio." : "c_a, c_s = coefficients of variation of arrivals and service."} />
              <p>{es ? "El factor ρ/(1−ρ) explica el «codo»: pequeños aumentos de carga cerca de la saturación disparan la espera." : "The ρ/(1−ρ) factor explains the \"knee\": small load increases near saturation send the wait soaring."}</p>
            </div>
          </div>
          <R ids={["kingman1961", "pollaczek1930"]} />
        </div>
      ),
    },
    {
      id: "pooling",
      label: es ? "Pooling (economías de escala)" : "Pooling (economies of scale)",
      content: (
        <div className="prose">
          <p>{es
            ? "A utilización fija ρ, agrupar la demanda en más servidores compartidos reduce drásticamente la espera. Comparar los regímenes M/M/1, c=2, c=5 y c=10 — todos a ρ=0.8 — lo hace evidente:"
            : "At fixed utilization ρ, pooling demand across more shared servers sharply reduces waiting. Comparing the M/M/1, c=2, c=5 and c=10 regimes — all at ρ=0.8 — makes it obvious:"}</p>
          <PoolingBars cap={es ? "Wq teórico a ρ=0.8 para c crecientes." : "Theoretical Wq at ρ=0.8 for increasing c."} />
          <p className="measure">{es
            ? "Por eso un único pool grande supera a muchas colas pequeñas separadas — el argumento detrás de las filas únicas en bancos y aeropuertos."
            : "This is why one large pool beats many separate small queues — the argument behind single-line systems in banks and airports."}</p>
          <R ids={["grossharris2018"]} />
        </div>
      ),
    },
  ];

  // ── DES methodology sub-tabs ──
  const desTabs = [
    {
      id: "worldview",
      label: es ? "El paradigma DES" : "The DES worldview",
      content: (
        <div className="prose">
          <p>{es
            ? "En la Simulación de Eventos Discretos el estado solo cambia en instantes puntuales (eventos). El motor mantiene una lista de eventos futuros (FEL) ordenada por tiempo y avanza el reloj directamente al siguiente evento — no en pasos fijos. SimPy usa el enfoque de interacción de procesos: cada entidad es un proceso (un generador de Python) que hace yield del paso del tiempo y de las solicitudes de recursos."
            : "In Discrete-Event Simulation the state changes only at distinct instants (events). The engine keeps a time-ordered future-event list (FEL) and advances the clock straight to the next event — not in fixed steps. SimPy uses the process-interaction worldview: each entity is a process (a Python generator) that yields the passage of time and resource requests."}</p>
          <EventLoopTimeline cap={es ? "N(t) salta evento a evento; el estado es constante por tramos." : "N(t) jumps event-to-event; state is piecewise-constant."} />
          <R ids={["lawkelton2015", "banks2010", "simpy"]} />
        </div>
      ),
    },
    {
      id: "lifecycle",
      label: es ? "Ciclo del estudio" : "Study lifecycle",
      content: (
        <div className="prose">
          <p>{es ? "Un estudio de simulación riguroso sigue un ciclo bien definido (Law; Banks et al.):" : "A rigorous simulation study follows a well-defined cycle (Law; Banks et al.):"}</p>
          <ol>
            <li>{es ? "Formulación del problema y objetivos." : "Problem formulation & objectives."}</li>
            <li>{es ? "Modelo conceptual (entidades, recursos, eventos, KPIs)." : "Conceptual model (entities, resources, events, KPIs)."}</li>
            <li>{es ? "Datos y modelado de entradas (ajuste de distribuciones)." : "Data & input modeling (distribution fitting)."}</li>
            <li>{es ? "Codificación." : "Coding."}</li>
            <li>{es ? "Verificación (¿el código implementa el modelo?)." : "Verification (does the code implement the model?)."}</li>
            <li>{es ? "Validación (¿el modelo representa la realidad?)." : "Validation (does the model represent reality?)."}</li>
            <li>{es ? "Diseño de experimentos." : "Experimental design."}</li>
            <li>{es ? "Análisis de salidas (réplicas, IC)." : "Output analysis (replications, CIs)."}</li>
            <li>{es ? "Documentación y reporte." : "Documentation & reporting."}</li>
          </ol>
          <Callout variant="note" title={es ? "Es iterativo" : "It is iterative"}>
            <p>{es ? "Verificación y validación retroalimentan la codificación y el modelo conceptual: rara vez es un flujo lineal de una pasada." : "Verification and validation feed back into coding and the conceptual model: it is rarely a one-pass linear flow."}</p>
          </Callout>
          <R ids={["lawkelton2015", "banks2010", "sargent2013"]} />
        </div>
      ),
    },
    {
      id: "rng",
      label: es ? "Aleatoriedad y semillas" : "Randomness & seeds",
      content: (
        <div className="prose">
          <p className="measure">{es
            ? "Toda la aleatoriedad proviene de un generador pseudoaleatorio sembrado. Misma semilla y mismos parámetros ⇒ exactamente la misma corrida — la base del replay determinista del laboratorio. Generadores de alta calidad (Mersenne Twister; las familias de L'Ecuyer) garantizan largos periodos y buena equidistribución; sus flujos/subflujos permiten números aleatorios comunes (CRN) para comparar configuraciones reduciendo varianza."
            : "All randomness comes from one seeded pseudo-random generator. Same seed and parameters ⇒ exactly the same run — the basis of the lab's deterministic replay. High-quality generators (Mersenne Twister; L'Ecuyer's families) guarantee long periods and good equidistribution; their streams/substreams enable common random numbers (CRN) to compare configurations with reduced variance."}</p>
          <R ids={["matsumoto1998", "lecuyer1999"]} />
        </div>
      ),
    },
    {
      id: "output",
      label: es ? "Réplicas e IC" : "Replications & CIs",
      content: (
        <div className="prose">
          <div className="fig-row rev">
            <ReplicationsCI cap={es ? "Cada corrida es una muestra; la media ± IC encierra el valor real." : "Each run is one sample; the mean ± CI brackets the true value."} />
            <div>
              <p>{es
                ? "Una sola corrida es un experimento aleatorio: su media oscila alrededor del valor verdadero. La práctica correcta es correr N réplicas independientes y reportar un intervalo de confianza:"
                : "A single run is a random experiment: its mean wanders around the true value. The correct practice is to run N independent replications and report a confidence interval:"}</p>
              <Equation tex="\bar{X} \pm t_{\,n-1,\,1-\alpha/2}\;\frac{s}{\sqrt{n}}" />
              <p>{es ? "La suite de tests del proyecto hace justamente esto: promedia 24 réplicas y verifica que caiga dentro del 15% de Erlang-C." : "The project's test suite does exactly this: it averages 24 replications and checks it lands within 15% of Erlang-C."}</p>
            </div>
          </div>
          <R ids={["lawkelton2015", "banks2010"]} />
        </div>
      ),
    },
    {
      id: "warmup",
      label: es ? "Calentamiento y V&V" : "Warm-up & V&V",
      content: (
        <div className="prose">
          <p>{es
            ? "Las simulaciones de estado estacionario arrancan vacías y no son representativas hasta pasado un transitorio inicial; el método de Welch promedia ensembles para fijar el punto de truncamiento (calentamiento) que se descarta. Las simulaciones terminantes (p. ej. «un día de clínica») se analizan de extremo a extremo sin descartar nada."
            : "Steady-state simulations start empty and are unrepresentative until an initial transient passes; Welch's method ensemble-averages to set the truncation (warm-up) point that is discarded. Terminating simulations (e.g. \"one clinic day\") are analyzed end-to-end with nothing discarded."}</p>
          <p>{es
            ? "Verificación pregunta «¿construí bien el modelo?» (sin bugs); validación pregunta «¿es el modelo correcto?» (concuerda con la realidad o la teoría). El M/M/c permite ambas porque tiene solución cerrada — el cruce con Erlang-C ES la validación."
            : "Verification asks \"did I build the model right?\" (no bugs); validation asks \"is it the right model?\" (agrees with reality or theory). M/M/c allows both because it has a closed form — the Erlang-C cross-check IS the validation."}</p>
          <R ids={["welch1983", "sargent2013"]} />
        </div>
      ),
    },
  ];

  // ── ABM sub-tabs ──
  const abmTabs = [
    {
      id: "basics",
      label: es ? "Agentes y planificador" : "Agents & scheduler",
      content: (
        <div className="prose">
          <p>{es
            ? "Un modelo basado en agentes consta de muchos agentes autónomos (estado + reglas) que interactúan en un entorno (una grilla, una red). El planificador decide el orden de actuación; el régimen de activación (simultáneo, aleatorio o por etapas) puede cambiar el resultado y debe declararse. El motor del laboratorio será Mesa."
            : "An agent-based model consists of many autonomous agents (state + rules) interacting in an environment (a grid, a network). The scheduler decides the order of action; the activation regime (simultaneous, random, or staged) can change the outcome and must be declared. The lab's engine will be Mesa."}</p>
          <R ids={["bonabeau2002", "kazil2020", "terhoeven2025"]} />
        </div>
      ),
    },
    {
      id: "emergence",
      label: es ? "Emergencia" : "Emergence",
      content: (
        <div className="prose">
          <p>{es
            ? "La emergencia es la firma del ABM: un comportamiento global que ningún agente programó surge de reglas locales simples. El modelo de segregación de Schelling es el ejemplo canónico — una preferencia local leve produce segregación global."
            : "Emergence is the signature of ABM: global behaviour that no agent programmed arises from simple local rules. Schelling's segregation model is the canonical example — a mild local preference produces global segregation."}</p>
          <EmergenceGrid cap={es ? "Regla local de vecindad de Moore → patrón global emergente." : "Local Moore-neighbourhood rule → emergent global pattern."} />
          <R ids={["schelling1971", "bonabeau2002"]} />
        </div>
      ),
    },
    {
      id: "models",
      label: es ? "Modelos canónicos" : "Canonical models",
      content: (
        <div className="prose">
          <div className="fig-row">
            <div>
              <p>{es
                ? "El modelo epidémico SIR (Kermack–McKendrick) divide la población en Susceptibles, Infectados y Recuperados; la infección fluye S→I a tasa βSI/N y la recuperación I→R a tasa γ. Su número reproductivo básico y el umbral de inmunidad de rebaño son:"
                : "The SIR epidemic model (Kermack–McKendrick) splits the population into Susceptible, Infected and Recovered; infection flows S→I at rate βSI/N and recovery I→R at rate γ. Its basic reproduction number and herd-immunity threshold are:"}</p>
              <Equation tex="R_0 = \frac{\beta}{\gamma}, \qquad \text{herd immunity at } 1 - \frac{1}{R_0}" />
            </div>
            <SIRFlow cap={es ? "Compartimentos SIR con tasas β y γ." : "SIR compartments with rates β and γ."} />
          </div>
          <p>{es
            ? "Otros clásicos que el laboratorio incluirá: la segregación de Schelling, las bandadas de Boids (Reynolds: separación, alineación, cohesión) y Sugarscape (Epstein & Axtell), pioneros de la ciencia social generativa de abajo hacia arriba."
            : "Other classics the lab will include: Schelling segregation, Reynolds' Boids flocking (separation, alignment, cohesion), and Sugarscape (Epstein & Axtell), pioneers of bottom-up generative social science."}</p>
          <R ids={["kermack1927", "schelling1971", "reynolds1987", "epstein1996"]} />
        </div>
      ),
    },
    {
      id: "odd",
      label: es ? "Protocolo ODD" : "The ODD protocol",
      content: (
        <div className="prose">
          <p className="measure">{es
            ? "Como los ABM son difíciles de reproducir, la comunidad adoptó el protocolo ODD (Overview, Design concepts, Details; Grimm et al.) para describirlos de forma estándar y replicable. Cada ABM del laboratorio se documentará siguiendo ODD."
            : "Because ABMs are hard to reproduce, the community adopted the ODD protocol (Overview, Design concepts, Details; Grimm et al.) to describe them in a standard, replicable way. Every ABM in the lab will be documented following ODD."}</p>
          <R ids={["grimm2006", "grimm2020"]} />
        </div>
      ),
    },
  ];

  const topTabs = [
    { id: "queueing", label: es ? "Teoría de colas (M/M/c)" : "Queueing theory (M/M/c)", content: <SubTabs tabs={queueTabs} orientation="vertical" ariaLabel="queueing" /> },
    { id: "des", label: es ? "Metodología DES" : "DES methodology", content: <SubTabs tabs={desTabs} orientation="vertical" ariaLabel="des" /> },
    { id: "abm", label: es ? "Modelos de agentes (ABM)" : "Agent-based modeling", content: <SubTabs tabs={abmTabs} orientation="vertical" ariaLabel="abm" /> },
    { id: "refs", label: es ? "Referencias" : "References", content: <div className="prose"><ReferenceList heading={es ? "Bibliografía" : "Bibliography"} /></div> },
  ];

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.theory")}</h1>
        <p className="lede">{es
          ? "Los fundamentos, con rigor y referencias: la teoría de colas que el simulador valida, la metodología del estudio de simulación, y los modelos basados en agentes."
          : "The foundations, with rigor and references: the queueing theory the simulator validates, the methodology of a simulation study, and agent-based models."}</p>
      </div>
      <Tabs tabs={topTabs} ariaLabel={t("nav.theory")} />
    </div>
  );
}
