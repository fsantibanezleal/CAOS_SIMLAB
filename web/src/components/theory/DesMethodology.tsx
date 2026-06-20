import { SubTabs } from "@/components/content/SubTabs";
import { Callout } from "@/components/content/Callout";
import { Equation } from "@/components/content/Equation";
import { Refs } from "@/components/content/Cite";

export function DesMethodology({ es }: { es: boolean }) {
  const tabs = [
    // ───────────────────────────────────────────────────────────────────────
    // SUB-TAB 1 — The DES worldview
    // ───────────────────────────────────────────────────────────────────────
    {
      id: "worldview",
      label: es ? "Cosmovisión DES" : "DES worldview",
      content: (
        <div className="prose">
          <h2>
            {es
              ? "La cosmovisión DES: eventos, procesos y la lista de eventos futuros"
              : "The DES worldview: events, processes, and the future-event list"}
          </h2>

          <p>
            {es
              ? "Una simulación de eventos discretos (DES) modela un sistema como una secuencia de eventos que ocurren en instantes discretos del tiempo (simulado) y cambian de forma instantánea el estado del sistema. Entre dos eventos consecutivos no ocurre nada de interés —el estado es, por construcción, constante a trozos— de modo que el reloj de simulación no avanza en pasos fijos, sino que salta de un tiempo de evento al siguiente. Este avance al próximo evento es el mecanismo que define a la DES y la razón por la que puede simular ocho horas de un call center, o un año de una fábrica, en milisegundos: gasta cómputo solo donde el estado realmente cambia (Law & Kelton, 2015; Banks, Carson, Nelson & Nicol, 2010)."
              : "A discrete-event simulation (DES) models a system as a sequence of events that occur at discrete points in (simulated) time and instantaneously change the system state. Between two consecutive events nothing of interest happens — the state is, by construction, piecewise-constant — so the simulation clock does not advance in fixed ticks but jumps from one event time to the next. This next-event time advance is the defining mechanism of DES and the reason a DES can simulate eight hours of a call center, or a year of a factory, in milliseconds: it spends compute only where the state actually changes (Law & Kelton, 2015; Banks, Carson, Nelson & Nicol, 2010)."}
          </p>

          <p>
            {es
              ? "El motor contable que lo hace posible es la lista de eventos futuros (FEL), una cola de prioridad de avisos de evento ordenada por su tiempo programado de ocurrencia. El bucle central es brutalmente simple: extraer el evento inminente (el de menor marca temporal), avanzar el reloj a ese tiempo, ejecutar la rutina de transición de estado del evento (que puede programar nuevos eventos futuros y/o cancelar pendientes), actualizar los acumuladores estadísticos y repetir hasta cumplir una condición de parada. Los empates en tiempos iguales se rompen con una regla determinista y documentada para que las corridas sean reproducibles. Esta es la cosmovisión de programación de eventos: el modelador escribe una rutina por tipo de evento (p. ej. llegada, fin de servicio) y el ejecutivo las intercala a través de la FEL."
              : "The bookkeeping engine that makes this possible is the future-event list (FEL), a priority queue of event notices ordered by their scheduled time of occurrence. The core loop is brutally simple: remove the imminent event (the one with the smallest timestamp), advance the clock to that time, execute the event's state-transition routine (which may schedule new future events and/or cancel pending ones), update statistical accumulators, and repeat until a stopping condition is met. Ties at equal timestamps are broken by a documented, deterministic rule so that runs are reproducible. This is the event-scheduling worldview: the modeler writes one routine per event type (e.g. arrival, service-completion) and the executive interleaves them through the FEL."}
          </p>

          <p>
            {es
              ? "El mismo modelo físico puede expresarse, en cambio, en la cosmovisión de interacción de procesos, donde el modelador describe el ciclo de vida de cada entidad activa (un cliente entra, quizá espera un servidor libre, retiene el servidor durante un tiempo de servicio y luego se va) como una única rutina secuencial que se suspende y reanuda en los puntos donde transcurre tiempo simulado o se disputa un recurso. Ambas cosmovisiones son matemáticamente equivalentes —un runtime de interacción de procesos se implementa encima de un ejecutivo de programación de eventos y de la FEL— pero el código de interacción de procesos se lee como la historia de una entidad y escala mejor a flujos complejos. SimPy es interacción de procesos: cada proceso es una función generadora de Python, y cada yield de un evento (timeout, request de recurso, …) es exactamente el punto donde el proceso devuelve el control al ejecutivo, que registra la reanudación como un evento futuro en la FEL (documentación de SimPy 4). La cola M/M/c insignia se construye sobre SimPy y se valida de forma independiente con un segundo motor DES real, Ciw, cuyo estudio de réplicas M/M/c se contrasta con el resultado cerrado Erlang-C. El modelado basado en agentes (ABM), por contraste, es la cosmovisión opuesta: el tiempo avanza en pasos fijos y cada agente actúa en cada paso —una cosmovisión distinta y complementaria que este laboratorio también alberga, sobre el marco de ABM real Mesa 3 (mesa.Agent / mesa.Model / AgentSet). Mesa es el marco de Python que ejemplifica esa cosmovisión basada en agentes, y es exactamente el motor que ejecutan los escenarios de agentes de este laboratorio (S02 Schelling, S03 SIR, S05 Beer Game — ver la sección ABM)."
              : "The same physical model can instead be expressed in the process-interaction worldview, where the modeler describes the life cycle of each active entity (a customer flows in, possibly waits for a free server, holds the server for a service time, then departs) as a single sequential routine that is suspended and resumed at the points where simulated time elapses or a resource is contended. The two worldviews are mathematically equivalent — a process-interaction runtime is implemented on top of an event-scheduling executive and FEL — but process-interaction code reads like the story of one entity and scales better to complex flows. SimPy is process-interaction: each process is an ordinary Python generator function, and every yield of an event (timeout, resource request, …) is exactly the point where the process hands control back to the executive, which records the resumption as a future event on the FEL (SimPy 4 documentation). The flagship M/M/c queue is built on SimPy and independently validated by a real second DES engine, Ciw, whose M/M/c replication study is checked against the closed-form Erlang-C result. Agent-based modeling (ABM), by contrast, is the opposite worldview: time advances in fixed steps and every agent acts each step — a different, complementary worldview that this lab also hosts, on the real ABM framework Mesa 3 (mesa.Agent / mesa.Model / AgentSet). Mesa is the Python framework that exemplifies that agent-based worldview, and it is exactly the engine this lab's agent scenarios run on (S02 Schelling, S03 SIR, S05 Beer Game — see the ABM section)."}
          </p>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "El estado cambia solo en los eventos. La DES es apropiada cuando el sistema es naturalmente dirigido por eventos y el estado es constante a trozos. La dinámica continua (flujo de fluidos, poblaciones gobernadas por EDO) necesita otro formalismo o un modelo híbrido (combinado)."
                  : "State changes only at events. DES is appropriate when the system is naturally event-driven and state is piecewise-constant. Continuous dynamics (fluid flow, populations governed by ODEs) need a different formalism or a hybrid (combined) model.",
                es
                  ? "La FEL es la única fuente de verdad del tiempo. Todo cambio del futuro debe programarse en la FEL; la lógica que muta el estado «entre» eventos sin un aviso de evento rompe la causalidad."
                  : "The FEL is the single source of truth for time. Any change to the future must be scheduled on the FEL; logic that mutates state \"between\" events without an event notice breaks causality.",
                es
                  ? "Se requiere ruptura determinista de empates para la reproducibilidad; los eventos simultáneos con efectos colaterales entre sí son una fuente clásica de no-determinismo si el orden queda implícito."
                  : "Deterministic tie-breaking is required for reproducibility; simultaneous events with side-effects on each other are a classic source of nondeterminism if the order is left implicit.",
                es
                  ? "La interacción de procesos añade un costo de abstracción del scheduler. Los generadores de SimPy son cómodos, pero cada yield es un cambio de contexto a nivel de Python; los modelos muy finos (millones de eventos triviales) pueden ser más rápidos en un bucle explícito de programación de eventos."
                  : "Process-interaction adds a scheduler abstraction cost. SimPy generators are convenient but each yield is a Python-level context switch; very fine-grained models (millions of trivial events) can be faster in an explicit event-scheduling loop.",
                es
                  ? "Las actividades de duración cero («instantáneas») pueden crear cascadas de eventos en un mismo instante; modélalas con cuidado y documenta el orden pretendido."
                  : "Zero-duration (\"instantaneous\") activities can create event cascades at a single timestamp; model them carefully and document the intended order.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <h3>{es ? "Relaciones gobernantes" : "Governing relations"}</h3>
          <p>
            {es
              ? "Sea S(t) el estado del sistema y la FEL contiene los tiempos de evento programados {τ₁ ≤ τ₂ ≤ …}. El reloj avanza por"
              : "Let S(t) be the system state and let the FEL hold scheduled event times {τ₁ ≤ τ₂ ≤ …}. The clock advances by"}
          </p>
          <Equation
            tex={String.raw`t_{k+1} \;=\; \min\{\,\tau \in \text{FEL} : \tau > t_k \,\},`}
            caption={es ? "Avance al tiempo del evento inminente, nunca por un Δt fijo." : "Advance to the time of the imminent event, never by a fixed Δt."}
          />
          <p>
            {es
              ? "es decir, al tiempo del evento inminente, nunca por un Δt fijo. El estado es constante a trozos entre eventos:"
              : "i.e. to the time of the imminent event, never by a fixed Δt. The state is piecewise-constant between events:"}
          </p>
          <Equation
            tex={String.raw`S(t) = S(t_k) \quad \text{for } t_k \le t < t_{k+1}.`}
            caption={es ? "El estado se mantiene constante entre dos tiempos de evento." : "The state holds constant between two event times."}
          />
          <p>
            {es
              ? "Un estadístico promediado en el tiempo (p. ej. el número medio en el sistema L) es entonces una integral sobre la función escalón, calculada exactamente como una suma de rectángulos:"
              : "A time-average statistic (e.g. mean number in system L) is therefore an integral over the step function, computed exactly as a sum of rectangles:"}
          </p>
          <Equation
            tex={String.raw`\bar{L}(T) \;=\; \frac{1}{T}\int_0^{T} L(t)\,dt \;=\; \frac{1}{T}\sum_{k} L(t_k)\,\bigl(t_{k+1}-t_k\bigr).`}
            caption={es ? "Promedio temporal como suma exacta de rectángulos sobre la función escalón." : "Time-average as an exact sum of rectangles over the step function."}
          />
          <p>
            {es
              ? "En SimPy, un proceso es un generador P cuya ejecución entre dos yield es la rutina de transición de estado de un evento; env.timeout(d) programa el aviso de reanudación en t_k + d sobre la FEL."
              : "In SimPy, a process is a generator P whose execution between two yields is one event's state-transition routine; env.timeout(d) schedules the resumption notice at t_k + d on the FEL."}
          </p>

          <h3>{es ? "Rol de modelado en este laboratorio" : "Modeling role in this lab"}</h3>
          <p>
            {es
              ? "El M/M/c insignia es un modelo de interacción de procesos de manual: un proceso generador emite procesos cliente a tiempos exponenciales entre llegadas; cada proceso cliente hace request a un Resource(capacity=c), hace yield de un timeout para su servicio exponencial y libera. La FEL intercala llegadas y fines de servicio automáticamente. La carga didáctica de esta sub-pestaña es dejar que el aprendiz vea que el reloj salta (la figura del bucle de eventos) en lugar de tictaquear —que es exactamente lo que hace que el throughput simulado coincida con el resultado analítico Erlang-C de la Sub-pestaña 8."
              : "The M/M/c flagship is a textbook process-interaction model: a generator process emits customer processes at exponential interarrival times; each customer process requests a Resource(capacity=c), yields a timeout for its exponential service, and releases. The FEL interleaves arrivals and service-completions automatically. The didactic payload of this sub-tab is to let the learner see that the clock is jumping (the event-loop figure) rather than ticking — which is exactly what makes the simulated throughput match the analytic Erlang-C result in Sub-tab 8."}
          </p>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 720 280"
              role="img"
              aria-label={
                es
                  ? "Línea de tiempo del bucle de eventos: el número en el sistema N(t) como función escalón continua por la derecha; el reloj salta de evento en evento en lugar de tictaquear uniformemente."
                  : "Event-loop timeline: number-in-system N(t) as a right-continuous step function; the clock jumps from event to event rather than ticking uniformly."
              }
            >
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="60" y1="220" x2="690" y2="220" />
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="60" y1="30" x2="60" y2="220" />
              <text fill="var(--color-fg)" fontSize="12" x="350" y="258">
                {es ? "tiempo simulado t  (el reloj SALTA entre eventos marcados)" : "simulated time t  (clock JUMPS between marked events)"}
              </text>
              <text fill="var(--color-fg)" fontSize="12" x="14" y="120" transform="rotate(-90 14,120)">
                {es ? "N(t) en el sistema" : "N(t) in system"}
              </text>
              <line stroke="var(--color-border)" strokeWidth="1" x1="60" y1="180" x2="690" y2="180" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="44" y="184">1</text>
              <line stroke="var(--color-border)" strokeWidth="1" x1="60" y1="140" x2="690" y2="140" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="44" y="144">2</text>
              <line stroke="var(--color-border)" strokeWidth="1" x1="60" y1="100" x2="690" y2="100" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="44" y="104">3</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="44" y="224">0</text>
              <polyline
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                points="60,220 120,220 120,180 230,180 230,140 330,140 330,180 430,180 430,140 520,140 520,100 600,100 600,140 660,140 660,180 690,180"
              />
              <g fill="var(--color-good)">
                <circle cx="120" cy="220" r="4" />
                <circle cx="230" cy="220" r="4" />
                <circle cx="430" cy="220" r="4" />
                <circle cx="520" cy="220" r="4" />
              </g>
              <g fill="var(--color-warn)">
                <circle cx="330" cy="220" r="4" />
                <circle cx="600" cy="220" r="4" />
                <circle cx="660" cy="220" r="4" />
              </g>
              {[
                [120, 180],
                [230, 140],
                [330, 140],
                [430, 140],
                [520, 100],
                [600, 100],
                [660, 140],
              ].map(([x, y], i) => (
                <line key={i} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" x1={x} y1={y} x2={x} y2="220" />
              ))}
              <text fill="var(--color-fg-faint)" fontSize="11" x="104" y="236">t1</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="214" y="236">t2</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="316" y="236">t3</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="414" y="236">t4</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="506" y="236">t5</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="586" y="236">t6</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="646" y="236">t7</text>
              <circle fill="var(--color-good)" cx="500" cy="44" r="4" />
              <text fill="var(--color-fg)" fontSize="12" x="510" y="48">{es ? "llegada (+1)" : "arrival (+1)"}</text>
              <circle fill="var(--color-warn)" cx="610" cy="44" r="4" />
              <text fill="var(--color-fg)" fontSize="12" x="620" y="48">{es ? "salida (−1)" : "departure (−1)"}</text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "N(t) es continua por la derecha y constante a trozos; el ejecutivo avanza el reloj solo al próximo tiempo de evento de la FEL."
                : "N(t) is right-continuous and piecewise-constant; the executive advances the clock only to the next event time on the FEL."}
            </figcaption>
          </figure>

          <Refs ids={["lawkelton2015", "banks2010", "simpy"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },

    // ───────────────────────────────────────────────────────────────────────
    // SUB-TAB 2 — Simulation-study lifecycle
    // ───────────────────────────────────────────────────────────────────────
    {
      id: "lifecycle",
      label: es ? "Ciclo de vida del estudio" : "Study lifecycle",
      content: (
        <div className="prose">
          <h2>{es ? "El ciclo de vida del estudio de simulación" : "The simulation-study lifecycle"}</h2>

          <p>
            {es
              ? "Un modelo de simulación no vale nada sin el estudio disciplinado que lo rodea. Ambos libros canónicos exponen esencialmente el mismo ciclo de vida; adoptamos la formulación consolidada de diez pasos de Banks, Carson, Nelson & Nicol (2010) y Law (2015). (1) Formulación del problema fija los objetivos, las medidas de desempeño y el alcance —¿qué decisión informará este modelo? (2) Modelo conceptual abstrae el sistema real en entidades, atributos, eventos, recursos y lógica al nivel correcto de detalle (ni una caricatura ni un gemelo digital de minucias irrelevantes). (3) Recolección de datos y modelado de entradas reúne datos reales y ajusta distribuciones de probabilidad a las entradas estocásticas (Sub-pestaña 3). (4) Traducción del modelo codifica el modelo conceptual en un lenguaje o librería de simulación (aquí, SimPy). (5) Verificación pregunta «¿construí el modelo bien?» —¿es el código una implementación fiel del modelo conceptual? (6) Validación pregunta «¿construí el modelo correcto?» —¿se comporta el modelo como el sistema real? (Sub-pestaña 6)."
              : "A simulation model is worthless without the disciplined study around it. Both canonical textbooks lay out essentially the same lifecycle; we adopt the consolidated ten-step formulation of Banks, Carson, Nelson & Nicol (2010) and Law (2015). (1) Problem formulation fixes the objectives, performance measures, and scope — what decision will this model inform? (2) Conceptual model abstracts the real system into entities, attributes, events, resources, and logic at the right level of detail (neither a cartoon nor a digital twin of irrelevant minutiae). (3) Data collection & input modeling gathers real data and fits probability distributions to the stochastic inputs (Sub-tab 3). (4) Model translation codes the conceptual model in a simulation language or library (here, SimPy). (5) Verification asks \"did I build the model right?\" — is the code a faithful implementation of the conceptual model? (6) Validation asks \"did I build the right model?\" — does the model behave like the real system? (Sub-tab 6)."}
          </p>

          <p>
            {es
              ? "Estos pasos no son una cascada. Verificación y validación retroalimentan a la codificación, al modelo conceptual e incluso a la formulación del problema; el ciclo es iterativo y los libros lo dibujan con bucles de realimentación explícitos. Solo cuando el modelo está verificado y validado se gana el derecho a usarse para experimentar. (7) Diseño experimental elige los escenarios, factores y niveles a correr y —crucial para modelos estocásticos— el número de réplicas y la longitud de corrida necesarios para la precisión estadística deseada (Sub-pestañas 5 y 7). (8) Corridas de producción y análisis ejecutan el diseño. (9) Más corridas se añaden si el análisis muestra que no se alcanzó la meta de precisión o surgieron preguntas nuevas. (10) Documentación e informe registra supuestos, parámetros, semillas y resultados para que el estudio sea reproducible —la disciplina codificada por las guías STRESS (Monks et al., 2019) y retomada en la Sub-pestaña 6."
              : "These steps are not a waterfall. Verification and validation feed back to coding, conceptual modeling, and even problem formulation; the lifecycle is iterative, and the textbooks draw it with explicit feedback loops. Only once the model is verified and validated does it earn the right to be used for experimentation. (7) Experimental design chooses the scenarios, factors, and levels to run, and — crucially for stochastic models — the number of replications and run length needed for the desired statistical precision (Sub-tabs 5 and 7). (8) Production runs & analysis execute the design. (9) More runs are added if the analysis shows the precision target was missed or new questions arose. (10) Documentation & reporting records assumptions, parameters, seeds, and results so the study is reproducible — the discipline codified by the STRESS guidelines (Monks et al., 2019) and revisited in Sub-tab 6."}
          </p>

          <p>
            {es
              ? "El costo de saltarse un paso se acumula aguas abajo: un simulador bello, rápido y verificado pero jamás validado produce disparates con confianza; un modelo validado corrido una sola réplica produce un único número sin barra de error. La pedagogía de este laboratorio recorre cada paso sobre el caso M/M/c, donde el paso 6 (validación) goza de un lujo raro: una verdad de terreno en forma cerrada (Erlang-C) contra la cual contrastar."
              : "The cost of skipping a step compounds downstream: a beautiful, fast, verified simulator that was never validated produces confident nonsense; a validated model run for one replication produces a single unqualified number with no error bar. This lab's pedagogy is to walk the learner through every step on the M/M/c case, where step 6 (validation) has a rare luxury — a closed-form ground truth (Erlang-C) to check against."}
          </p>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "El ciclo de vida es iterativo, no lineal; tratarlo como una cascada es el error metodológico más común."
                  : "The lifecycle is iterative, not linear; treating it as a waterfall is the most common methodological error.",
                es
                  ? "El nivel de detalle es una decisión de modelado, no un valor por defecto; más detalle no es más válido y cuesta datos, tiempo de cómputo y esfuerzo de verificación."
                  : "Level of detail is a modeling decision, not a default; more detail is not more valid and costs data, runtime, and verification effort.",
                es
                  ? "Los pasos 5–6 (V&V) son condiciones necesarias para usar un modelo, jamás prueba suficiente de corrección —ningún modelo está plenamente validado, solo «validado para su propósito previsto»."
                  : "Steps 5–6 (V&V) are necessary conditions to use a model, never sufficient proof of correctness — no model is fully validated, only \"validated for its intended purpose.\"",
                es
                  ? "La documentación (paso 10) se omite con frecuencia bajo presión de tiempo y es la mayor amenaza individual a la reproducibilidad."
                  : "Documentation (step 10) is frequently skipped under time pressure and is the single largest threat to reproducibility.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <h3>{es ? "Relaciones gobernantes" : "Governing relations"}</h3>
          <p>
            {es
              ? "El ciclo de vida es procedimental más que ecuacional, pero recurren dos puertas cuantitativas: la puerta de validación (estadístico de salida θ̂ vs. valor del sistema real/analítico θ₀ dentro de tolerancia)"
              : "The lifecycle is procedural rather than equational, but two quantitative gates recur: the validation gate (model output statistic θ̂ vs. real-system/analytic value θ₀ within tolerance)"}
          </p>
          <Equation
            tex={String.raw`\bigl|\hat\theta - \theta_0\bigr| \;\le\; \varepsilon \quad\text{(operational validity, Sub-tab 6),}`}
            caption={es ? "Validez operacional: la salida concuerda con la verdad de terreno dentro de ε." : "Operational validity: output agrees with ground truth within ε."}
          />
          <p>
            {es
              ? "y la puerta de precisión sobre el experimento (semiamplitud h del intervalo de confianza por debajo de la meta, Sub-pestaña 5)"
              : "and the precision gate on the experiment (half-width h of the confidence interval below target, Sub-tab 5)"}
          </p>
          <Equation
            tex={String.raw`h \;=\; t_{n-1,\,1-\alpha/2}\,\frac{s}{\sqrt{n}} \;\le\; h^\star .`}
            caption={es ? "Puerta de precisión: la semiamplitud del IC debe caer bajo la meta h⋆." : "Precision gate: the CI half-width must fall below the target h⋆."}
          />

          <h3>{es ? "Rol de modelado en este laboratorio" : "Modeling role in this lab"}</h3>
          <p>
            {es
              ? "Esta sub-pestaña es el mapa de todo el producto: cada una de las demás sub-pestañas es uno o dos pasos del ciclo de vida. La figura de flujo funciona también como el modelo mental de navegación de la sección."
              : "This sub-tab is the map of the whole product: each of the other sub-tabs is one or two steps of the lifecycle. The flow figure doubles as the section's navigation mental-model."}
          </p>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 760 420"
              role="img"
              aria-label={
                es
                  ? "Ciclo de vida del estudio de simulación: diez pasos etiquetados con flujo hacia adelante y bucles de realimentación desde verificación y validación hacia codificación y modelado conceptual."
                  : "Simulation-study lifecycle: ten labelled steps with forward flow and feedback loops from verification and validation back to coding and conceptual modeling."
              }
            >
              <defs>
                <marker id="ah-lc" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-fg)" />
                </marker>
                <marker id="ahp-lc" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-magenta)" />
                </marker>
              </defs>
              {[
                [20, 20, 100, 46, es ? "1 Formulación del problema" : "1 Problem formulation"],
                [20, 90, 100, 116, es ? "2 Modelo conceptual" : "2 Conceptual model"],
                [20, 160, 100, 186, es ? "3 Datos y entradas" : "3 Data & input model"],
                [20, 230, 100, 256, es ? "4 Codificación (SimPy)" : "4 Coding (SimPy)"],
              ].map(([x, y, tx, ty, label], i) => (
                <g key={`c1-${i}`}>
                  <rect fill="transparent" stroke="var(--color-accent)" strokeWidth="1.6" rx="6" x={x as number} y={y as number} width="160" height="42" />
                  <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x={tx as number} y={ty as number}>{label}</text>
                </g>
              ))}
              {[
                [300, 90, 380, 116, es ? "5 Verificación" : "5 Verification"],
                [300, 160, 380, 186, es ? "6 Validación" : "6 Validation"],
              ].map(([x, y, tx, ty, label], i) => (
                <g key={`vv-${i}`}>
                  <rect fill="transparent" stroke="var(--color-magenta)" strokeWidth="1.8" x={x as number} y={y as number} width="160" height="42" />
                  <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x={tx as number} y={ty as number}>{label}</text>
                </g>
              ))}
              {[
                [580, 90, 660, 116, es ? "7 Diseño experimental" : "7 Experimental design"],
                [580, 160, 660, 186, es ? "8 Corridas y análisis" : "8 Runs & analysis"],
                [580, 230, 660, 256, es ? "9 ¿Más corridas?" : "9 More runs?"],
                [580, 320, 660, 346, es ? "10 Documentar e informar" : "10 Document & report"],
              ].map(([x, y, tx, ty, label], i) => (
                <g key={`c3-${i}`}>
                  <rect fill="transparent" stroke="var(--color-accent)" strokeWidth="1.6" rx="6" x={x as number} y={y as number} width="160" height="42" />
                  <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x={tx as number} y={ty as number}>{label}</text>
                </g>
              ))}
              {[
                [100, 62, 100, 88],
                [100, 132, 100, 158],
                [100, 202, 100, 228],
                [180, 251, 300, 118],
                [380, 132, 380, 158],
                [460, 181, 580, 116],
                [660, 132, 660, 158],
                [660, 202, 660, 228],
                [660, 272, 660, 318],
              ].map(([x1, y1, x2, y2], i) => (
                <line key={`fa-${i}`} stroke="var(--color-fg)" strokeWidth="1.6" markerEnd="url(#ah-lc)" x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
              {[
                "M300,175 C230,200 210,250 182,250",
                "M300,100 C220,70 150,70 100,86",
                "M620,250 C520,290 470,210 462,196",
              ].map((d, i) => (
                <path key={`fb-${i}`} fill="none" stroke="var(--color-magenta)" strokeWidth="1.4" strokeDasharray="5 4" markerEnd="url(#ahp-lc)" d={d} />
              ))}
              <text fill="var(--color-fg-faint)" fontSize="11" x="20" y="400">
                {es ? "Sólido = flujo hacia adelante · magenta punteado = realimentación (iterar, no cascada)." : "Solid = forward flow · dashed magenta = feedback (iterate, not waterfall)."}
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Ciclo de diez pasos según Banks, Carson, Nelson & Nicol (2010) y Law (2015), con los bucles de realimentación V&V dibujados explícitamente."
                : "Ten-step lifecycle after Banks, Carson, Nelson & Nicol (2010) and Law (2015), with the V&V feedback loops drawn explicitly."}
            </figcaption>
          </figure>

          <Refs ids={["banks2010", "lawkelton2015", "monks2019"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },

    // ───────────────────────────────────────────────────────────────────────
    // SUB-TAB 3 — Input modeling
    // ───────────────────────────────────────────────────────────────────────
    {
      id: "input-modeling",
      label: es ? "Modelado de entradas" : "Input modeling",
      content: (
        <div className="prose">
          <h2>
            {es
              ? "Modelado de entradas: ajuste de distribuciones y bondad de ajuste"
              : "Input modeling: fitting distributions and goodness-of-fit"}
          </h2>

          <p>
            {es
              ? "Las entradas estocásticas —tiempos entre llegadas, tiempos de servicio, tiempos de operación/falla de máquinas— son el combustible de una DES, y aquí «basura entra, basura sale» es literal: un modelo exquisitamente codificado alimentado con la distribución de entrada equivocada produce respuestas precisamente equivocadas. El modelado de entradas es la elección disciplinada de una distribución de probabilidad para cada entrada aleatoria, en tres movimientos: (i) hipotetizar una familia (desde la física, desde un histograma, desde la teoría), (ii) estimar sus parámetros a partir de datos (típicamente por máxima verosimilitud) y (iii) probar el ajuste con un procedimiento de bondad de ajuste antes de confiar en él (Law, 2015, cap. 6; Banks et al., 2010, cap. 9)."
              : "Stochastic inputs — interarrival times, service times, machine up/down times — are the fuel of a DES, and \"garbage in, garbage out\" is brutally literal here: an exquisitely coded model driven by the wrong input distribution produces precisely wrong answers. Input modeling is the disciplined choice of a probability distribution for each random input, in three moves: (i) hypothesize a family (from physics, from a histogram, from theory), (ii) estimate its parameters from data (typically by maximum likelihood), and (iii) test the fit with a goodness-of-fit procedure before trusting it (Law, 2015, ch. 6; Banks et al., 2010, ch. 9)."}
          </p>

          <p>
            {es
              ? "La distribución más importante para colas es la exponencial, y la razón es un teorema, no una conveniencia. Si las llegadas forman un proceso de Poisson de tasa λ —el modelo canónico de «muchos clientes independientes que llegan rara e independientemente»— entonces el número de llegadas en cualquier intervalo de longitud t es Poisson(λt), y equivalentemente los tiempos entre llegadas son i.i.d. exponenciales de media 1/λ. El puente es el evento «ninguna llegada en [0,t]»: su probabilidad bajo la ley de conteo de Poisson es P(N(t)=0)=e^(−λt), que es exactamente la función de supervivencia de una Exponencial(λ). Por tanto, llegadas de Poisson ⇔ tiempos entre llegadas exponenciales. La falta de memoria que define a la exponencial (P(X>s+t | X>s)=P(X>t)) es lo que hace de la cola M/M/c una cadena de Markov en tiempo continuo y le da la solución cerrada Erlang-C usada para validación en este laboratorio."
              : "The single most important distribution for queueing is the exponential, and the reason is a theorem, not a convenience. If arrivals form a Poisson process with rate λ — the canonical model for \"many independent customers each arriving rarely and independently\" — then the number of arrivals in any interval of length t is Poisson(λt), and equivalently the interarrival times are i.i.d. exponential with mean 1/λ. The bridge is the event \"no arrival in [0,t]\": its probability under the Poisson count law is P(N(t)=0)=e^(−λt), which is exactly the survival function of an Exponential(λ). Hence Poisson arrivals ⇔ exponential interarrivals. The exponential's defining memorylessness (P(X>s+t | X>s)=P(X>t)) is what makes the M/M/c queue a continuous-time Markov chain and gives it the closed-form Erlang-C solution used for validation in this lab."}
          </p>

          <p>
            {es
              ? "Estimar la tasa es una línea: el EMV de la tasa de una exponencial es el recíproco de la media muestral. Probar el ajuste es donde vive la disciplina. La prueba Chi-cuadrado agrupa los datos y compara conteos observados vs. esperados; la prueba de Kolmogorov–Smirnov (K–S) compara las CDF empírica y ajustada por su máxima distancia vertical; la prueba de Anderson–Darling es K–S reponderada para ser sensible en las colas (a menudo la parte que importa para la congestión). Una advertencia que descoloca a muchos: cuando los parámetros se estiman de los mismos datos usados para probar, los valores críticos estándar son anticonservadores, y una muestra grande rechazará cualquier modelo paramétrico simple —así que la bondad de ajuste es una baranda, no un oráculo, y los gráficos Q–Q siguen siendo esenciales junto a la prueba formal."
              : "Estimating the rate is one line: the MLE of an exponential's rate is the reciprocal of the sample mean. Testing the fit is where discipline lives. The Chi-square test bins the data and compares observed vs. expected counts; the Kolmogorov–Smirnov (K–S) test compares the empirical and fitted CDFs by their maximum vertical distance; the Anderson–Darling test is K–S re-weighted to be sensitive in the tails (often the part that matters for congestion). A small caution that trips up practitioners: when parameters are estimated from the same data used to test, the standard critical values are anticonservative, and a large sample will reject any simple parametric model — so goodness-of-fit is a guardrail, not an oracle, and Q–Q plots remain essential alongside the formal test."}
          </p>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Supuesto i.i.d. El ajuste clásico supone observaciones independientes e idénticamente distribuidas. Entradas autocorrelacionadas o no estacionarias (tasas de llegada según la hora del día) requieren modelos de procesos puntuales / Poisson no estacionario, no una única distribución ajustada."
                  : "i.i.d. assumption. Classical fitting assumes independent, identically distributed observations. Autocorrelated or nonstationary inputs (time-of-day arrival rates) need point-process / nonstationary Poisson models, not a single fitted distribution.",
                es
                  ? "Estimar-y-luego-probar sobre los mismos datos infla el rechazo; con n grande todo modelo paramétrico es rechazado. Usa gráficos Q–Q y juicio; reserva un conjunto de validación cuando sea posible."
                  : "Estimation-then-test on the same data inflates rejection; with large n every parametric model is rejected. Use Q–Q plots and judgment; reserve a holdout where possible.",
                es
                  ? "Sensibilidad en las colas. K–S es débil en las colas; Anderson–Darling o chequeos específicos de cola importan para salidas dominadas por la congestión."
                  : "Tail sensitivity. K–S is weak in the tails; Anderson–Darling or tail-specific checks matter for congestion-driven outputs.",
                es
                  ? "La exponencial es una elección de modelado, no una ley de la naturaleza. Los tiempos de servicio reales suelen ser menos variables que la exponencial (lognormal/gamma); aquí se usa la exponencial porque entrega el benchmark analítico, y eso es en sí mismo un supuesto documentado del escenario M/M/c."
                  : "Exponential is a modeling choice, not a law of nature. Real service times are often less variable than exponential (lognormal/gamma); the exponential is used here because it yields the analytic benchmark, and that is itself a documented assumption of the M/M/c scenario.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <h3>{es ? "Ecuaciones gobernantes" : "Governing equations"}</h3>
          <p>{es ? "Densidad, CDF y supervivencia exponenciales; media y propiedad de falta de memoria:" : "Exponential density, CDF, and survival; mean and the memoryless property:"}</p>
          <Equation
            tex={String.raw`f(x)=\lambda e^{-\lambda x},\quad F(x)=1-e^{-\lambda x},\quad \bar F(x)=e^{-\lambda x},\quad \mathbb{E}[X]=\tfrac{1}{\lambda},\quad x\ge 0.`}
            caption={es ? "Familia exponencial: densidad, acumulada, supervivencia y media." : "Exponential family: density, CDF, survival, and mean."}
          />
          <Equation
            tex={String.raw`P(X>s+t \mid X>s)=\frac{e^{-\lambda(s+t)}}{e^{-\lambda s}}=e^{-\lambda t}=P(X>t)\quad \text{(memorylessness).}`}
            caption={es ? "Falta de memoria: el pasado no condiciona el futuro." : "Memorylessness: the past does not condition the future."}
          />
          <p>{es ? "Ley de conteo de Poisson y el puente conteo↔tiempo entre llegadas:" : "Poisson count law and the count↔interarrival bridge:"}</p>
          <Equation
            tex={String.raw`P\bigl(N(t)=k\bigr)=\frac{(\lambda t)^k e^{-\lambda t}}{k!}\;\Longrightarrow\; P\bigl(N(t)=0\bigr)=e^{-\lambda t}=\bar F_{\text{Exp}(\lambda)}(t).`}
            caption={es ? "Llegadas de Poisson ⇔ tiempos entre llegadas exponenciales." : "Poisson arrivals ⇔ exponential interarrivals."}
          />
          <p>{es ? "EMV de la tasa a partir de una muestra x₁,…,xₙ:" : "MLE of the rate from a sample x₁,…,xₙ:"}</p>
          <Equation
            tex={String.raw`\hat\lambda_{\text{MLE}}=\frac{n}{\sum_{i=1}^{n}x_i}=\frac{1}{\bar x}.`}
            caption={es ? "El EMV de la tasa es el recíproco de la media muestral." : "The rate MLE is the reciprocal of the sample mean."}
          />
          <p>{es ? "Estadísticos de bondad de ajuste:" : "Goodness-of-fit statistics:"}</p>
          <Equation
            tex={String.raw`\chi^2=\sum_{i=1}^{k}\frac{(O_i-E_i)^2}{E_i},\qquad D_n=\sup_{x}\bigl|F_n(x)-F(x)\bigr|,\qquad A^2=-n-\frac1n\sum_{i=1}^{n}(2i-1)\!\left[\ln F(x_{(i)})+\ln\bigl(1-F(x_{(n+1-i)})\bigr)\right].`}
            caption={es ? "Chi-cuadrado, Kolmogorov–Smirnov y Anderson–Darling." : "Chi-square, Kolmogorov–Smirnov, and Anderson–Darling."}
          />

          <h3>{es ? "Rol de modelado en este laboratorio" : "Modeling role in this lab"}</h3>
          <p>
            {es
              ? "La «M/M» en M/M/c es dos modelos de entrada exponenciales: tiempos entre llegadas markovianos (sin memoria, es decir, exponenciales) y servicio markoviano. Esta sub-pestaña justifica por qué el laboratorio usa random.expovariate(lam) para los tiempos entre llegadas y de servicio, y entrega al aprendiz el kit de bondad de ajuste para verificar que una exponencial ajustada es defendible —incluida la advertencia honesta de que la exponencial se elige en parte porque compra el objetivo de validación en forma cerrada."
              : "The \"M/M\" in M/M/c is two exponential input models: Markovian (memoryless, i.e. exponential) interarrivals and Markovian service. This sub-tab justifies why the lab uses random.expovariate(lam) for interarrivals and service, and gives the learner the goodness-of-fit toolkit to check that a fitted exponential is defensible — including the honest caveat that the exponential is chosen partly because it buys the closed-form validation target."}
          </p>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 720 300"
              role="img"
              aria-label={
                es
                  ? "Histograma de tiempos entre llegadas observados con una densidad exponencial ajustada superpuesta; el recuadro muestra la CDF empírica vs. ajustada y la máxima brecha vertical de Kolmogorov–Smirnov."
                  : "Histogram of observed interarrival times with an overlaid fitted exponential density; inset shows empirical vs fitted CDF and the Kolmogorov-Smirnov maximum vertical gap."
              }
            >
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="50" y1="240" x2="430" y2="240" />
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="50" y1="30" x2="50" y2="240" />
              <text fill="var(--color-fg)" fontSize="12" x="200" y="272">{es ? "tiempo entre llegadas x" : "interarrival time x"}</text>
              <text fill="var(--color-fg)" fontSize="12" x="20" y="120" transform="rotate(-90 20,120)">{es ? "densidad" : "density"}</text>
              {[
                [55, 70, 170],
                [97, 115, 125],
                [139, 150, 90],
                [181, 180, 60],
                [223, 200, 40],
                [265, 214, 26],
                [307, 223, 17],
                [349, 229, 11],
              ].map(([x, y, h], i) => (
                <rect key={i} fill="var(--color-accent)" opacity="0.35" x={x} y={y} width="40" height={h} />
              ))}
              <path fill="none" stroke="var(--color-magenta)" strokeWidth="2.5" d="M55,60 C110,120 160,170 220,200 C290,224 360,233 425,237" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="250" y="60">{es ? "ajustada  f(x)=λe^(−λx),  λ̂=1/x̄" : "fitted  f(x)=λe^(−λx),  λ̂=1/x̄"}</text>
              <g transform="translate(470,40)">
                <rect x="0" y="0" width="220" height="180" fill="none" stroke="var(--color-border)" />
                <text fill="var(--color-fg-faint)" fontSize="11" x="6" y="-6">{es ? "CDF: empírica (sólida) vs ajustada (punteada)" : "CDF: empirical (solid) vs fitted (dashed)"}</text>
                <polyline fill="none" stroke="var(--color-fg)" strokeWidth="2" points="10,170 50,170 50,130 90,130 90,95 130,95 130,60 170,60 170,30 210,30" />
                <path fill="none" stroke="var(--color-magenta)" strokeWidth="2" strokeDasharray="4 3" d="M10,170 C60,120 110,70 160,45 C185,33 200,28 210,25" />
                <line stroke="var(--color-warn)" strokeWidth="2" x1="90" y1="95" x2="90" y2="60" />
                <text fill="var(--color-fg-faint)" fontSize="11" x="96" y="84">Dₙ</text>
              </g>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Ajusta y luego verifica: superpón la exponencial ajustada y lee la brecha K–S Dₙ = supₓ|Fₙ(x)−F(x)| sobre la CDF."
                : "Fit, then verify: overlay the fitted exponential, then read the K–S gap Dₙ = supₓ|Fₙ(x)−F(x)| on the CDF."}
            </figcaption>
          </figure>

          <Refs ids={["lawkelton2015", "banks2010"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },

    // ───────────────────────────────────────────────────────────────────────
    // SUB-TAB 4 — RNG, seeding, CRN
    // ───────────────────────────────────────────────────────────────────────
    {
      id: "rng-crn",
      label: es ? "RNG, semillas y CRN" : "RNG, seeding & CRN",
      content: (
        <div className="prose">
          <h2>
            {es
              ? "Generación de números aleatorios, sembrado y números aleatorios comunes"
              : "Random-number generation, seeding, and common random numbers"}
          </h2>

          <p>
            {es
              ? "Toda entrada estocástica se remonta a un flujo de números U(0,1), producidos no por azar físico sino por un generador de números pseudoaleatorios (PRNG) determinista. Ese determinismo es una virtud: dada la misma semilla, un PRNG reproduce exactamente la misma secuencia, y eso es lo que hace reproducible a una simulación estocástica. Un PRNG utilizable debe (i) tener un período mucho mayor que lo que consuma cualquier corrida, (ii) pasar baterías empíricas estrictas de uniformidad e independencia (TestU01) y (iii) soportar múltiples flujos independientes. Dos generadores dominan la práctica: el Mersenne Twister MT19937 (Matsumoto & Nishimura, 1998), de período 2^19937−1, que es el motor por defecto de Python (random); y los generadores recursivos múltiples combinados de L'Ecuyer, MRG32k3a (L'Ecuyer, 1999), diseñados específicamente para que el período pueda particionarse limpiamente en flujos y subflujos (L'Ecuyer, Simard, Chen & Kelton, 2002)."
              : "Every stochastic input traces back to a stream of U(0,1) numbers, produced not by physical randomness but by a deterministic pseudo-random number generator (PRNG). This determinism is a feature: given the same seed, a PRNG replays the exact same sequence, which is what makes a stochastic simulation reproducible. A usable PRNG must (i) have a period far longer than any run will consume, (ii) pass stringent empirical batteries of uniformity and independence (TestU01), and (iii) support multiple independent streams. Two generators dominate practice: the Mersenne Twister MT19937 (Matsumoto & Nishimura, 1998), with period 2^19937−1, which is Python's default random engine; and L'Ecuyer's combined multiple-recursive generators, MRG32k3a (L'Ecuyer, 1999), engineered specifically so the period can be cleanly partitioned into streams and substreams (L'Ecuyer, Simard, Chen & Kelton, 2002)."}
          </p>

          <p>
            {es
              ? "La reproducibilidad es innegociable: un resultado de simulación que no puedes regenerar no es un resultado. En la práctica se siembra cada corrida explícitamente y se registra la semilla (las guías STRESS lo exigen como ítem de reporte). Pero hay una sutileza más allá de una única semilla global. Al correr muchas réplicas, o al comparar dos configuraciones, conviene que los flujos que alimentan partes distintas del modelo sean independientes y sin solapamiento —compartir un único generador global entre «llegadas» y «servicio» arriesga correlación accidental, y resembrar de forma ingenua puede situar dos réplicas en partes solapadas del período. La solución limpia es un generador con flujos nombrados (uno por proceso estocástico) y subflujos (uno por réplica): exactamente para lo que se diseñó MRG32k3a, y lo que hoy ofrece numpy.random.Generator con SeedSequence.spawn() en Python."
              : "Reproducibility is non-negotiable: a simulation result you cannot regenerate is not a result. In practice you seed every run explicitly and record the seed (the STRESS guidelines make this a reporting item). But there is a subtlety beyond a single global seed. When you run many replications, or compare two system configurations, you want the streams feeding different parts of the model to be independent and non-overlapping — sharing one global generator across \"arrivals\" and \"service\" risks accidental correlation, and naive re-seeding can land two replications on overlapping parts of the period. The clean solution is a generator with named streams (one per stochastic process) and substreams (one per replication): exactly what MRG32k3a was designed for, and what numpy.random.Generator with SeedSequence.spawn() now offers in Python."}
          </p>

          <p>
            {es
              ? "La maquinaria de flujos también habilita una técnica de reducción de varianza casi gratuita: los números aleatorios comunes (CRN). Para comparar dos configuraciones A y B (digamos c=3 vs. c=4 servidores), alimenta ambas con los mismos números aleatorios para los mismos propósitos —los mismos instantes de llegada, los mismos sorteos de servicio— de modo que la única diferencia entre corridas sea la variable de decisión, no la suerte del sorteo. Como los dos estimadores quedan positivamente correlacionados, la varianza de su diferencia baja: Var(θ̂_A−θ̂_B)=Var(θ̂_A)+Var(θ̂_B)−2Cov(θ̂_A,θ̂_B), y una covarianza positiva la reduce. CRN exige sincronización —el mismo número aleatorio debe usarse para el mismo propósito lógico en ambos sistemas— y por eso importan los flujos por propósito (no un único flujo global)."
              : "The streams machinery also unlocks a variance-reduction technique that is almost free: common random numbers (CRN). To compare two configurations A and B (say c=3 vs. c=4 servers), drive both with the same random numbers for the same purposes — the same arrival instants, the same raw service draws — so that the only difference between the two runs is the decision variable, not the luck of the draw. Because the two estimators become positively correlated, the variance of their difference drops: Var(θ̂_A−θ̂_B)=Var(θ̂_A)+Var(θ̂_B)−2Cov(θ̂_A,θ̂_B), and a positive covariance shrinks it. CRN requires synchronization — the same random number must be used for the same logical purpose in both systems — which is precisely why per-purpose streams (not one global stream) matter."}
          </p>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Pseudo-aleatorio ≠ aleatorio. La calidad depende del algoritmo; nunca uses un LCG casero o de baja calidad para trabajo serio. MT19937 sirve para simulación pero no es criptográficamente seguro."
                  : "Pseudo-random ≠ random. Quality depends on the algorithm; never use a home-rolled or low-quality LCG for serious work. MT19937 is fine for simulation but is not cryptographically secure.",
                es
                  ? "Siembra y registra, siempre. Una semilla no registrada hace irreproducible una corrida; es un ítem de reporte STRESS."
                  : "Seed and record, always. An unrecorded seed makes a run irreproducible; this is a STRESS reporting item.",
                es
                  ? "El solapamiento de flujos es un peligro real al resembrar de forma ingenua; prefiere flujos generados/independientes (SeedSequence.spawn, o flujos MRG32k3a) por sobre semillas ad-hoc."
                  : "Stream overlap is a real hazard when re-seeding naively; prefer spawned/independent streams (SeedSequence.spawn, or MRG32k3a streams) over ad-hoc seeds.",
                es
                  ? "CRN puede salir el tiro por la culata. Ayuda solo si induce correlación positiva entre los estimadores comparados; una mala sincronización (los mismos sorteos usados para propósitos distintos entre sistemas) puede inducir correlación negativa y aumentar la varianza."
                  : "CRN can backfire. It helps only if it induces positive correlation between the compared estimators; poor synchronization (the same draws used for different purposes across systems) can induce negative correlation and increase variance.",
                es
                  ? "CRN requiere sincronización, más difícil cuando los dos sistemas consumen números aleatorios a tasas distintas; los flujos dedicados por propósito mitigan esto."
                  : "CRN requires synchronization, which is harder when the two systems consume random numbers at different rates; dedicated per-purpose streams mitigate this.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <h3>{es ? "Ecuaciones gobernantes" : "Governing equations"}</h3>
          <p>
            {es
              ? "Un generador recursivo múltiple combinado (L'Ecuyer, 1999; la forma MRG32k3a) combina dos recurrencias de orden 3 módulo primos distintos:"
              : "A combined multiple-recursive generator (L'Ecuyer, 1999; the MRG32k3a form) combines two order-3 recurrences modulo distinct primes:"}
          </p>
          <Equation
            tex={String.raw`x_{1,n}=(a_{11}x_{1,n-1}+a_{12}x_{1,n-2}+a_{13}x_{1,n-3})\bmod m_1,`}
            caption={es ? "Primera recurrencia de orden 3 módulo m₁." : "First order-3 recurrence modulo m₁."}
          />
          <Equation
            tex={String.raw`x_{2,n}=(a_{21}x_{2,n-1}+a_{22}x_{2,n-2}+a_{23}x_{2,n-3})\bmod m_2,`}
            caption={es ? "Segunda recurrencia de orden 3 módulo m₂." : "Second order-3 recurrence modulo m₂."}
          />
          <Equation
            tex={String.raw`u_n=\bigl((x_{1,n}-x_{2,n})\bmod m_1\bigr)\big/(m_1+1),`}
            caption={es ? "Salida combinada en (0,1) con m₁=2³²−209, m₂=2³²−22853." : "Combined (0,1) output with m₁=2³²−209, m₂=2³²−22853."}
          />
          <p>
            {es
              ? "con m₁=2³²−209, m₂=2³²−22853, dando período ≈ 2^191, particionado en ≈ 2^51 flujos de longitud 2^127, cada uno dividido en subflujos de longitud 2^76 (L'Ecuyer et al., 2002)."
              : "with m₁=2³²−209, m₂=2³²−22853, yielding period ≈ 2^191, partitioned into ≈ 2^51 streams of length 2^127, each split into substreams of length 2^76 (L'Ecuyer et al., 2002)."}
          </p>
          <p>{es ? "Reducción de varianza CRN para la diferencia de dos estimadores:" : "CRN variance reduction for the difference of two estimators:"}</p>
          <Equation
            tex={String.raw`\operatorname{Var}\bigl(\hat\theta_A-\hat\theta_B\bigr)= \operatorname{Var}(\hat\theta_A)+\operatorname{Var}(\hat\theta_B) -2\operatorname{Cov}(\hat\theta_A,\hat\theta_B),`}
            caption={es ? "CRN reduce varianza si y solo si Cov(θ̂_A,θ̂_B) > 0." : "CRN reduces variance iff Cov(θ̂_A,θ̂_B) > 0."}
          />

          <h3>{es ? "Rol de modelado en este laboratorio" : "Modeling role in this lab"}</h3>
          <p>
            {es
              ? "Los 12 regímenes M/M/c pre-simulados son reproducibles precisamente porque cada uno fue sembrado y la semilla es parte del manifiesto. El generador del laboratorio es PCG64 (el motor por defecto de numpy.random.Generator); cada réplica r usa una semilla distinta —make_rng(seed+r)— sobre un mismo PCG64, cuyo enorme período hace que el solapamiento entre estos flujos sea despreciable en la práctica. El laboratorio expone un control de semilla para que un aprendiz confirme la reproducibilidad bit a bit. (Los números aleatorios comunes —CRN— descritos arriba son la técnica de referencia para comparar configuraciones como c=3 vs c=4; este laboratorio no incluye hoy un escenario de comparación con CRN, pero la teoría aplica directamente si se añadiera.)"
              : "The 12 pre-simulated M/M/c regimes are reproducible precisely because each was seeded and the seed is part of the manifest. The lab's generator is PCG64 (numpy.random.Generator's default engine); each replication r uses a different seed — make_rng(seed+r) — on a single PCG64, whose enormous period makes overlap between these streams negligible in practice. The lab exposes a seed control so a learner can confirm bit-for-bit reproducibility. (Common random numbers — CRN — described above are the textbook technique for comparing configurations such as c=3 vs c=4; this lab does not currently include a CRN comparison scenario, but the theory applies directly were one added.)"}
          </p>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 720 280"
              role="img"
              aria-label={
                es
                  ? "Números aleatorios comunes: dos configuraciones A y B se alimentan de los mismos flujos sembrados de llegada y servicio, de modo que sus salidas difieren solo por la variable de decisión."
                  : "Common random numbers: two configurations A and B are driven by the same seeded arrival and service streams so their outputs differ only by the decision variable."
              }
            >
              <defs>
                <marker id="ah-crn" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <rect fill="transparent" stroke="var(--color-accent)" strokeWidth="1.6" x="40" y="60" width="170" height="40" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="125" y="85">{es ? "flujo de llegadas (subflujo r)" : "arrivals stream (substream r)"}</text>
              <rect fill="transparent" stroke="var(--color-accent)" strokeWidth="1.6" x="40" y="170" width="170" height="40" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="125" y="195">{es ? "flujo de servicio (subflujo r)" : "service stream (substream r)"}</text>
              <rect fill="transparent" stroke="var(--color-good)" strokeWidth="1.8" x="360" y="40" width="150" height="50" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="435" y="60">{es ? "Config A" : "Config A"}</text>
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="435" y="78">c = 3</text>
              <rect fill="transparent" stroke="var(--color-warn)" strokeWidth="1.8" x="360" y="180" width="150" height="50" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="435" y="200">{es ? "Config B" : "Config B"}</text>
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="435" y="218">c = 4</text>
              {[
                [210, 80, 358, 60],
                [210, 80, 358, 200],
                [210, 190, 358, 78],
                [210, 190, 358, 218],
              ].map(([x1, y1, x2, y2], i) => (
                <line key={`s-${i}`} stroke="var(--color-fg)" strokeWidth="1.4" markerEnd="url(#ah-crn)" x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
              <rect fill="transparent" stroke="var(--color-accent)" strokeWidth="1.6" x="560" y="40" width="130" height="50" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="625" y="62">θ̂_A</text>
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="625" y="80">(Wq, L…)</text>
              <rect fill="transparent" stroke="var(--color-accent)" strokeWidth="1.6" x="560" y="180" width="130" height="50" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="625" y="202">θ̂_B</text>
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="625" y="220">(Wq, L…)</text>
              <line stroke="var(--color-fg)" strokeWidth="1.4" markerEnd="url(#ah-crn)" x1="510" y1="65" x2="558" y2="65" />
              <line stroke="var(--color-fg)" strokeWidth="1.4" markerEnd="url(#ah-crn)" x1="510" y1="205" x2="558" y2="205" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="360" y="135">
                {es ? "mismos sorteos, mismos propósitos  ⇒  Cov(θ̂_A,θ̂_B) > 0  ⇒  Var(θ̂_A−θ̂_B) ↓" : "same draws, same purposes  ⇒  Cov(θ̂_A,θ̂_B) > 0  ⇒  Var(θ̂_A−θ̂_B) ↓"}
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Números aleatorios comunes: sincroniza los flujos entre las configuraciones comparadas para cancelar la suerte del muestreo de la diferencia."
                : "Common random numbers: synchronize the streams across compared configurations to cancel sampling luck from the difference."}
            </figcaption>
          </figure>

          <Refs ids={["matsumoto1998", "lecuyer1999", "lecuyer2002", "lawkelton2015"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },

    // ───────────────────────────────────────────────────────────────────────
    // SUB-TAB 5 — Output analysis: replications & CIs
    // ───────────────────────────────────────────────────────────────────────
    {
      id: "output-analysis",
      label: es ? "Análisis de salidas" : "Output analysis",
      content: (
        <div className="prose">
          <h2>
            {es
              ? "Análisis de salidas: réplicas e intervalos de confianza"
              : "Output analysis: replications and confidence intervals"}
          </h2>

          <p>
            {es
              ? "El error de principiante más común en simulación estocástica es correr el modelo una vez, leer el tiempo de espera promedio y reportarlo como «la» respuesta. No lo es: una sola corrida es una muestra de un proceso aleatorio, y su promedio es a su vez una variable aleatoria con error de muestreo. Corre el mismo modelo con otra semilla y obtendrás otro número. El remedio es el cimiento del análisis de salidas: las réplicas independientes. Corre el modelo n veces con flujos de números aleatorios independientes (subflujos distintos, no solo semillas distintas), recoge el estadístico resumen por corrida X₁,…,Xₙ (p. ej. la espera media en cola de cada corrida) y trata esos como tu muestra i.i.d. Como los Xᵢ son independientes e idénticamente distribuidos entre réplicas, la estadística clásica se aplica directamente a ellos —aunque las observaciones dentro de una corrida estén fuertemente autocorrelacionadas (las esperas de clientes consecutivos lo están), los resúmenes entre corridas no lo están."
              : "The single most common beginner error in stochastic simulation is to run the model once, read off the average waiting time, and report it as \"the\" answer. It is not: a single run is one sample from a random process, and its average is itself a random variable with sampling error. Run the same model with a different seed and you get a different number. The remedy is the bedrock of output analysis: independent replications. Run the model n times with independent random-number streams (different substreams, not just different seeds), collect the per-run summary statistic X₁,…,Xₙ (e.g. each run's mean queue wait), and treat those as your i.i.d. sample. Because the Xᵢ are independent and identically distributed across replications, the classical statistics apply directly to them — even though the within-run observations are heavily autocorrelated (consecutive customers' waits are correlated), the between-run summaries are not."}
          </p>

          <p>
            {es
              ? "Con los resúmenes de réplicas formas la media muestral X̄ y la varianza muestral s², y reportas un intervalo de confianza en vez de un estimador puntual desnudo. Con Xᵢ aproximadamente normal, el IC exacto al 100(1−α)% usa el valor crítico t de Student con n−1 grados de libertad; cuando n es grande (los regímenes de este laboratorio usan cientos de réplicas), t_{n−1} ≈ z y la aproximación normal con z_{1−α/2} es indistinguible —es la que implementa el laboratorio (z=1.96 al 95%):"
              : "From the replication summaries you form the sample mean X̄ and sample variance s², and report a confidence interval rather than a bare point estimate. For approximately normal Xᵢ, the exact 100(1−α)% CI uses the Student-t critical value with n−1 degrees of freedom; when n is large (this lab's regimes use hundreds of replications), t_{n−1} ≈ z and the normal approximation with z_{1−α/2} is indistinguishable — and is what the lab implements (z=1.96 at 95%):"}
          </p>
          <Equation
            tex={String.raw`\bar X \;\pm\; z_{1-\alpha/2}\,\frac{s}{\sqrt{n}}\qquad(\text{normal approx; } z_{0.975}=1.96),`}
            caption={es ? "Intervalo de confianza al 100(1−α)% por aproximación normal (válida para n grande)." : "100(1−α)% confidence interval via the normal approximation (valid for large n)."}
          />
          <p>
            {es
              ? "La semiamplitud del IC, h≈z_{1−α/2}·s/√n (forma normal de muestra grande; con n moderado, h=t_{n−1,1−α/2}·s/√n), es la expresión honesta de la precisión, y decrece como 1/√n —cuadruplicar las réplicas reduce la semiamplitud a la mitad. Esto da una receta secuencial: seguir añadiendo réplicas hasta que h baje de una meta h⋆ (o una meta relativa h/|X̄|), justo el bucle «¿más corridas?» del paso 9 del ciclo de vida. La normalidad de los Xᵢ suele ser razonable porque cada Xᵢ es a su vez un promedio de muchas observaciones dentro de la corrida (argumento del teorema central del límite), pero con n pequeño o métricas de cola pesada conviene verificarla."
              : "The CI's half-width h≈z_{1−α/2}·s/√n (the large-sample normal form; for moderate n, h=t_{n−1,1−α/2}·s/√n) is the honest expression of precision, and it shrinks like 1/√n — quadrupling the replications halves the half-width. This gives a sequential recipe: keep adding replications until h drops below a target h⋆ (or a relative target h/|X̄|), exactly the step-9 \"more runs?\" loop of the lifecycle. The normality of Xᵢ is usually reasonable because each Xᵢ is itself an average of many within-run observations (a central-limit argument), but for small n or heavy-tailed metrics it should be checked."}
          </p>

          <p>
            {es
              ? "Este marco de réplicas es el caso de simulación terminante (la Sub-pestaña 7 lo distingue del estado estacionario). Es limpio, robusto y la recomendación por defecto de ambos libros; es también exactamente lo que implementa este laboratorio. La trampa a señalar: el intervalo solo es válido si las réplicas son verdaderamente independientes —reusar la misma semilla global, o flujos solapados, destruye en silencio la independencia que la fórmula supone, y por eso la maquinaria de flujos de la Sub-pestaña 4 es un prerrequisito, no un adorno."
              : "This replication framework is the terminating-simulation case (Sub-tab 7 distinguishes it from steady-state). It is clean, robust, and the default recommendation of both textbooks; it is also exactly what this lab implements. The pitfall to flag: the interval is only valid if the replications are truly independent — same global seed reused, or overlapping streams, silently destroys the independence the formula assumes, which is why Sub-tab 4's streams machinery is a prerequisite, not a nicety."}
          </p>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "La independencia entre réplicas es obligatoria. Reusar una semilla o flujos solapados invalida el IC; usa subflujos generados/independientes."
                  : "Independence between replications is mandatory. Reusing a seed or overlapping streams invalidates the CI; use spawned/independent substreams.",
                es
                  ? "Normalidad aproximada de los Xᵢ. Suele cumplirse por el TCL (cada Xᵢ es un promedio), pero verifícala con n pequeño o métricas por corrida de cola pesada; si no, usa bootstrap para el IC."
                  : "Approximate normality of the Xᵢ. Usually OK by CLT (each Xᵢ is an average), but check for small n or heavy-tailed per-run metrics; otherwise bootstrap the CI.",
                es
                  ? "El IC cuantifica solo el error de muestreo, no el error de modelo. Un intervalo preciso alrededor de un modelo equivocado (inválido) es precisamente equivocado."
                  : "The CI quantifies sampling error only, not model error. A precise interval around a wrong (invalid) model is precisely wrong.",
                es
                  ? "La convergencia 1/√n es lenta: reducir la semiamplitud a la mitad cuesta 4× las corridas. La reducción de varianza (CRN, Sub-pestaña 4) compra precisión más barata para comparaciones."
                  : "1/√n convergence is slow: halving the half-width costs 4× the runs. Variance reduction (CRN, Sub-tab 4) buys precision more cheaply for comparisons.",
                es
                  ? "Este enfoque supone simulaciones terminantes (inicio/fin claros). La salida de estado estacionario necesita primero la remoción del calentamiento (Sub-pestañas 6–7)."
                  : "This framing assumes terminating simulations (clear start/stop). Steady-state output needs warm-up removal first (Sub-tabs 6–7).",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <h3>{es ? "Ecuaciones gobernantes" : "Governing equations"}</h3>
          <Equation
            tex={String.raw`\bar X=\frac1n\sum_{i=1}^{n}X_i,\qquad s^2=\frac{1}{n-1}\sum_{i=1}^{n}(X_i-\bar X)^2 .`}
            caption={es ? "Media muestral y varianza muestral de los resúmenes por réplica." : "Sample mean and sample variance of the per-replication summaries."}
          />
          <p>{es ? "Intervalo de confianza al 100(1−α)% (aproximación normal de muestra grande, la implementada; el factor t de Student exacto en el límite de n pequeño):" : "100(1−α)% confidence interval (large-sample normal approximation, as implemented; the exact Student-t factor in the small-n limit):"}</p>
          <Equation
            tex={String.raw`\bar X \;\pm\; z_{1-\alpha/2}\,\frac{s}{\sqrt{n}},\qquad h=z_{1-\alpha/2}\,\frac{s}{\sqrt{n}} \quad\xrightarrow[\;n\text{ small}\;]{}\quad t_{n-1,\,1-\alpha/2}\,\frac{s}{\sqrt{n}} .`}
            caption={es ? "IC y su semiamplitud h (normal para n grande; t de Student para n pequeño)." : "The CI and its half-width h (normal for large n; Student-t for small n)."}
          />
          <p>
            {es
              ? "Réplicas requeridas para una meta absoluta de semiamplitud h⋆ (aproximación de muestra fija, usando un s piloto y el cuantil normal z_{1−α/2}):"
              : "Replications required for a target absolute half-width h⋆ (fixed-sample approximation, using a pilot s and the normal quantile z_{1−α/2}):"}
          </p>
          <Equation
            tex={String.raw`n^\star \;\approx\; \left(\frac{z_{1-\alpha/2}\,s}{h^\star}\right)^{2},`}
            caption={es ? "Tamaño de muestra inicial, luego continuar secuencialmente con la semiamplitud t exacta hasta h ≤ h⋆." : "Initial sample size, then continue sequentially with the exact t half-width until h ≤ h⋆."}
          />

          <h3>{es ? "Rol de modelado en este laboratorio" : "Modeling role in this lab"}</h3>
          <p>
            {es
              ? "El laboratorio corre n réplicas independientes por régimen y dibuja la banda del IC alrededor de la media junto a la línea Erlang-C. El aprendiz observa cómo la banda se estrecha al crecer n (deslizador) y ve la ley 1/√n en acción, y que el valor analítico cae dentro de la banda —el corazón visual de la historia de validación."
              : "The lab runs n independent replications per regime and renders the CI band around the mean alongside the Erlang-C line. The learner watches the band tighten as n grows (slider) and sees the 1/√n law in action, and that the analytic value lands inside the band — the visual heart of the validation story."}
          </p>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 720 300"
              role="img"
              aria-label={
                es
                  ? "n medias por réplica forman una distribución muestral de la media global; la banda sombreada es el intervalo de confianza X̄ más/menos z·s/√n (aproximación normal), y el valor analítico cae dentro de ella."
                  : "n per-replication means form a sampling distribution of the grand mean; the shaded band is the confidence interval X-bar plus or minus z times s over root n (normal approximation), and the analytic value lies inside it."
              }
            >
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="60" y1="250" x2="690" y2="250" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="375" y="284">
                {es ? "media por réplica  X̄ᵢ   →   media global  X̄" : "per-replication mean  X̄ᵢ   →   grand mean  X̄"}
              </text>
              <g fill="var(--color-accent)" opacity="0.7">
                {[
                  [250, 235],
                  [300, 235],
                  [335, 235],
                  [360, 235],
                  [375, 235],
                  [390, 235],
                  [415, 235],
                  [450, 235],
                  [500, 235],
                  [320, 222],
                  [430, 222],
                  [375, 210],
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="4" />
                ))}
              </g>
              <rect fill="var(--color-accent)" opacity="0.18" x="330" y="40" width="90" height="200" />
              <path fill="var(--color-accent)" fillOpacity="0.18" stroke="var(--color-magenta)" strokeWidth="2" d="M200,240 C300,240 320,60 375,60 C430,60 450,240 550,240" />
              <line stroke="var(--color-magenta)" strokeWidth="2" x1="375" y1="50" x2="375" y2="250" />
              <text fill="var(--color-fg-faint)" fontSize="11" textAnchor="middle" x="375" y="44">X̄</text>
              <line stroke="var(--color-good)" strokeWidth="2" strokeDasharray="5 4" x1="405" y1="60" x2="405" y2="250" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="470" y="120">{es ? "valor Erlang-C θ₀ (dentro del IC)" : "Erlang-C value θ₀ (inside CI)"}</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="330" y="258">X̄ − h</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="420" y="258">X̄ + h</text>
              <text fill="var(--color-fg-faint)" fontSize="11" textAnchor="middle" x="375" y="270">h = z₍1−α/2₎ · s/√n</text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Cada réplica es una muestra; sus medias se dispersan alrededor de X̄ con la banda sombreada X̄±h que (para modelos válidos) contiene el valor analítico."
                : "Each replication is one sample; their means scatter around X̄ with the shaded X̄±h band that (for valid models) contains the analytic value."}
            </figcaption>
          </figure>

          <Refs ids={["lawkelton2015", "banks2010", "little1961"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },

    // ───────────────────────────────────────────────────────────────────────
    // SUB-TAB 6 — V&V and Erlang-C
    // ───────────────────────────────────────────────────────────────────────
    {
      id: "verification-validation",
      label: es ? "V&V y Erlang-C" : "V&V & Erlang-C",
      content: (
        <div className="prose">
          <h2>
            {es
              ? "Verificación, validación y el ejemplo trabajado Erlang-C"
              : "Verification, validation, and the Erlang-C worked example"}
          </h2>

          <p>
            {es
              ? "La verificación y validación (V&V) responden dos preguntas distintas que se confunden constantemente. La verificación pregunta: ¿construimos el modelo bien? —¿es el código ejecutable una implementación fiel y sin errores del modelo conceptual? La validación pregunta: ¿construimos el modelo correcto? —¿concuerda el comportamiento del modelo con el sistema real que representa, para el propósito previsto? El marco canónico de Sargent (Sargent, 2013) lo descompone además en validez del modelo conceptual (¿son razonables la teoría y los supuestos para el uso previsto?), verificación del modelo computarizado (¿es correcto el programa?), validez operacional (¿tiene el comportamiento de salida exactitud suficiente?) y validez de los datos (¿son los datos de entrada adecuados y correctos?). Un punto central y humilde del trabajo de Sargent: ningún modelo es absolutamente válido —la validez siempre es relativa al propósito previsto y al dominio de aplicabilidad, y se establece con un grado de confianza, nunca se prueba."
              : "Verification and validation (V&V) answer two different questions that are constantly conflated. Verification asks: did we build the model right? — is the executable code a faithful, bug-free implementation of the conceptual model? Validation asks: did we build the right model? — does the model's behavior agree with the real system it represents, for the model's intended purpose? Sargent's canonical framework (Sargent, 2013) decomposes this further into conceptual-model validity (are the theory and assumptions reasonable for the intended use?), computerized-model verification (is the program correct?), operational validity (does the output behavior have sufficient accuracy?), and data validity (are the input data adequate and correct?). A central, humbling point of Sargent's work: no model is absolutely valid — validity is always relative to the intended purpose and the domain of applicability, and is established to a degree of confidence, never proven."}
          </p>

          <p>
            {es
              ? "Las técnicas de verificación son en gran medida prácticas de ingeniería de software aplicadas con ojo estadístico: rastrear a mano una sola entidad por el código y confirmar que cada evento dispara correctamente; correr casos degenerados con respuestas conocidas (p. ej. un servidor, sin variabilidad); probar condiciones extremas (sobrecarga, sistema vacío); usar chequeos de continuidad (cambios pequeños de entrada producen cambios pequeños de salida); e instrumentar la bitácora de eventos. Las técnicas de validación son comparativas: validez aparente (¿los expertos del dominio hallan plausible el comportamiento?), validación con datos históricos (¿reproduce el modelo un conjunto real reservado?), análisis de sensibilidad y —el patrón oro cuando está disponible— comparación con un resultado analítico conocido."
              : "Verification techniques are largely software-engineering practices applied with statistical eyes: trace a single entity through the code by hand and confirm each event fires correctly; run degenerate cases with known answers (e.g. one server, no variability); test extreme conditions (overload, empty system); use continuity checks (small input changes produce small output changes); and instrument the event log. Validation techniques are comparative: face validity (do domain experts find the behavior plausible?), historical-data validation (does the model reproduce a held-out real data set?), sensitivity analysis, and — the gold standard when available — comparison to a known analytic result."}
          </p>

          <p>
            {es
              ? "Este laboratorio goza de ese patrón oro. La cola M/M/c es uno de los pocos modelos realistas con solución de estado estacionario en forma cerrada, la fórmula Erlang-C, que da la probabilidad exacta de que un cliente que llega deba esperar y, a partir de ella, el número medio exacto en cola L_q y la espera media W_q. El protocolo de validación es por tanto inequívoco y totalmente trabajado: simular cada uno de los 12 regímenes con muchas réplicas independientes, calcular el IC de W_q (Sub-pestaña 5) y confirmar que el valor analítico Erlang-C cae dentro del intervalo. Cuando lo hace en los 11 regímenes estables —y la distribución simulada del número en el sistema coincide con la teórica— el simulador queda validado contra la verdad de terreno, y cualquier discrepancia es un error a cazar (verificación), no un juicio de modelado. El régimen inestable (ρ≥1) no tiene W_q de estado estacionario finito, así que no hay objetivo analítico que contrastar; sirve en cambio como prueba de condición extrema. Finalmente, todo el estudio se reporta según las guías STRESS (Monks et al., 2019): objetivos, la lógica exacta del modelo, todas las distribuciones y parámetros, el software y su versión, las semillas aleatorias y el número de réplicas —para que un tercero pueda regenerar cada número."
              : "This lab enjoys that gold standard. The M/M/c queue is one of the few realistic models with a closed-form steady-state solution, the Erlang-C formula, which gives the exact probability that an arriving customer must wait, and from it the exact mean number in queue L_q and mean wait W_q. The validation protocol is therefore unambiguous and fully worked: simulate each of the 12 regimes with many independent replications, compute the CI for W_q (Sub-tab 5), and confirm the analytic Erlang-C value falls inside the interval. When it does across all 11 stable regimes — and the simulated number-in-system distribution matches the theoretical one — the simulator is validated against ground truth, and any discrepancy is a bug to hunt (verification) rather than a modeling judgment call. The unstable regime (ρ≥1) has no finite steady-state W_q, so there is no analytic target to check against; it instead serves as an extreme-condition test. Finally, the whole study is reported per the STRESS guidelines (Monks et al., 2019): objectives, the exact model logic, all distributions and parameters, the software and version, the random seeds, and the number of replications — so a third party can regenerate every number."}
          </p>

          <Callout variant="strong" title={es ? "La tesis del laboratorio" : "The lab's thesis"}>
            {es
              ? "Un simulador en el que puedes confiar porque reproduce una respuesta analítica conocida. Los 12 regímenes cubren ρ de carga ligera a saturación (uno inestable, sin objetivo finito); la figura muestra el W_q simulado con su IC superpuesto sobre la curva suave Erlang-C en los 11 regímenes estables: la prueba visual de la validación."
              : "A simulator you can trust because it reproduces a known analytic answer. The 12 regimes span ρ from light to saturation (one unstable, with no finite target); the figure shows the simulated W_q with its CI overlaid on the smooth Erlang-C curve across the 11 stable regimes — the visual proof of validation."}
          </Callout>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Verificación ≠ validación. Un código sin errores (verificado) puede codificar igualmente el modelo equivocado (inválido), y viceversa."
                  : "Verification ≠ validation. Bug-free code (verified) can still encode the wrong model (invalid), and vice versa.",
                es
                  ? "Ningún modelo es absolutamente válido (Sargent): la validez es relativa al propósito previsto y al dominio; se establece a un nivel de confianza, nunca se prueba."
                  : "No model is absolutely valid (Sargent): validity is relative to intended purpose and domain; established to a confidence level, never proven.",
                es
                  ? "La validación contra benchmark analítico es un lujo de modelos tratables (M/M/c). La mayoría de los modelos reales carecen de forma cerrada y deben recurrir a validación con datos históricos, validez aparente y análisis de sensibilidad."
                  : "Analytic-benchmark validation is a luxury of tractable models (M/M/c). Most real models lack a closed form and must fall back on historical-data validation, face validity, and sensitivity analysis.",
                es
                  ? "Los supuestos de Erlang-C deben cumplirse para que el benchmark sea verdad de terreno válida: llegadas de Poisson, servicio exponencial, c servidores idénticos, FCFS, cola/población infinita y estabilidad ρ<1. Si la simulación se desvía de estos, un desajuste es esperado, no un error."
                  : "Erlang-C assumptions must hold for the benchmark to be valid ground truth: Poisson arrivals, exponential service, c identical servers, FCFS, infinite queue/population, and stability ρ<1. If the simulation deviates from these, a mismatch is expected, not a bug.",
                es
                  ? "El reporte STRESS es necesario para la reproducibilidad pero no establece por sí mismo la validez."
                  : "STRESS reporting is necessary for reproducibility but does not by itself establish validity.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <h3>{es ? "Ecuaciones gobernantes" : "Governing equations"}</h3>
          <p>
            {es
              ? "Define la intensidad de tráfico y la carga ofrecida para c servidores, tasa de llegada λ, tasa de servicio μ:"
              : "Define traffic intensity and offered load for c servers, arrival rate λ, service rate μ:"}
          </p>
          <Equation
            tex={String.raw`a=\frac{\lambda}{\mu},\qquad \rho=\frac{\lambda}{c\mu}=\frac{a}{c}\quad(\text{stable iff }\rho<1).`}
            caption={es ? "Carga ofrecida a y utilización ρ; el sistema es estable si ρ<1." : "Offered load a and utilization ρ; the system is stable iff ρ<1."}
          />
          <p>{es ? "Erlang-C — probabilidad de que un cliente que llega deba esperar (todos los servidores ocupados):" : "Erlang-C — probability that an arriving customer must wait (all servers busy):"}</p>
          <Equation
            tex={String.raw`C(c,a)=P(\text{wait})= \frac{\dfrac{a^{c}}{c!}\,\dfrac{1}{1-\rho}} {\displaystyle\sum_{k=0}^{c-1}\frac{a^{k}}{k!}+\frac{a^{c}}{c!}\,\frac{1}{1-\rho}} .`}
            caption={es ? "Fórmula Erlang-C: probabilidad de demora." : "Erlang-C formula: probability of delay."}
          />
          <p>{es ? "Longitud media en cola y tiempos de espera de estado estacionario (Erlang-C + ley de Little):" : "Steady-state mean queue length and waiting times (Erlang-C + Little's law):"}</p>
          <Equation
            tex={String.raw`L_q=\frac{\rho\,C(c,a)}{1-\rho},\qquad W_q=\frac{L_q}{\lambda}=\frac{C(c,a)}{c\mu-\lambda},\qquad W=W_q+\frac{1}{\mu},\qquad L=\lambda W .`}
            caption={es ? "L_q, W_q, W y L derivados de Erlang-C y la ley de Little." : "L_q, W_q, W and L derived from Erlang-C and Little's law."}
          />
          <p>
            {es
              ? "Puerta de validación (validez operacional): para cada régimen estable el W_q^Erlang analítico debe caer en el IC simulado (semiamplitud por aproximación normal, la implementada),"
              : "Validation gate (operational validity): for each stable regime the analytic W_q^Erlang must lie in the simulated CI (half-width via the implemented normal approximation),"}
          </p>
          <Equation
            tex={String.raw`W_q^{\text{Erlang}} \in \Bigl[\bar X_{W_q}-h,\;\bar X_{W_q}+h\Bigr],\qquad h=z_{1-\alpha/2}\,\frac{s}{\sqrt n}.`}
            caption={es ? "Puerta de validación: el valor analítico debe caer dentro del IC simulado." : "Validation gate: the analytic value must lie inside the simulated CI."}
          />

          <h3>{es ? "Rol de modelado en este laboratorio" : "Modeling role in this lab"}</h3>
          <p>
            {es
              ? "Esta es la tesis de CAOS_SIMLAB: un simulador en el que puedes confiar porque reproduce una respuesta analítica conocida. Los 12 regímenes cubren ρ de ligero a saturación (el inestable carece de objetivo finito); la figura muestra el W_q simulado con su IC superpuesto sobre la curva suave Erlang-C en los 11 regímenes estables, la prueba visual de validación. La misma pantalla lleva la tarjeta de reporte STRESS (semilla, versión, clientes por corrida, réplicas) para que la demostración sea ella misma reproducible."
              : "This is the thesis of CAOS_SIMLAB: a simulator you can trust because it reproduces a known analytic answer. The 12 regimes span ρ from light to saturation (the unstable one has no finite target); the figure shows the simulated W_q with its CI overlaid on the smooth Erlang-C curve across the 11 stable regimes, the visual proof of validation. The same screen carries the STRESS report card (seed, version, customers per run, replications) so the demonstration is itself reproducible."}
          </p>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 720 320"
              role="img"
              aria-label={
                es
                  ? "Validación: el W_q medio simulado con barras de error de intervalo de confianza a través de doce regímenes de carga cae sobre la curva Erlang-C en forma cerrada, que sube abruptamente cuando la utilización se acerca a 1."
                  : "Validation: simulated mean wait W_q with confidence-interval error bars across twelve load regimes lie on the closed-form Erlang-C curve, which rises steeply as utilization approaches 1."
              }
            >
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="60" y1="270" x2="690" y2="270" />
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="60" y1="30" x2="60" y2="270" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="375" y="304">{es ? "utilización  ρ = λ/(cμ)  →  1" : "utilization  ρ = λ/(cμ)  →  1"}</text>
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="20" y="150" transform="rotate(-90 20,150)">{es ? "espera media  Wq" : "mean wait  Wq"}</text>
              <path fill="none" stroke="var(--color-magenta)" strokeWidth="2.5" d="M70,262 C250,258 400,250 520,225 C600,205 645,120 675,40" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="430" y="120">{es ? "Erlang-C analítico  Wq = C(c,a)/(cμ−λ)" : "analytic Erlang-C  Wq = C(c,a)/(cμ−λ)"}</text>
              <g>
                {[
                  [120, 252, 268, 260, 4],
                  [200, 250, 266, 258, 4],
                  [290, 246, 262, 254, 4],
                  [380, 238, 258, 248, 4],
                  [470, 220, 246, 233, 4],
                  [545, 186, 220, 203, 4],
                  [610, 120, 170, 145, 5],
                  [655, 55, 115, 85, 5],
                ].map(([x, y1, y2, cy, r], i) => (
                  <g key={i}>
                    <line stroke="var(--color-accent)" strokeWidth="1.6" x1={x} y1={y1} x2={x} y2={y2} />
                    <circle fill="var(--color-accent)" cx={x} cy={cy} r={r} />
                  </g>
                ))}
              </g>
              <circle fill="var(--color-accent)" cx="450" cy="40" r="4" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="462" y="44">{es ? "Wq simulado ± IC" : "simulated Wq ± CI"}</text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Validación contra la verdad de terreno: el W_q simulado con barras de error de IC sigue la curva Erlang-C en forma cerrada a través de los 11 regímenes estables; las barras se ensanchan al acercarse ρ→1 (mayor varianza). El régimen inestable (ρ≥1) no tiene objetivo finito."
                : "Validation against ground truth: simulated W_q with CI error bars tracks the closed-form Erlang-C curve across the 11 stable regimes; error bars widen as ρ→1 (higher variance). The unstable regime (ρ≥1) has no finite target."}
            </figcaption>
          </figure>

          <Refs ids={["sargent2013", "monks2019", "banks2010", "erlang1917"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },

    // ───────────────────────────────────────────────────────────────────────
    // SUB-TAB 7 — Terminating vs steady-state, warm-up, run length
    // ───────────────────────────────────────────────────────────────────────
    {
      id: "warm-up",
      label: es ? "Terminante vs. estacionario" : "Terminating vs. steady-state",
      content: (
        <div className="prose">
          <h2>
            {es
              ? "Corridas terminantes vs. de estado estacionario, calentamiento y longitud de corrida"
              : "Terminating vs. steady-state runs, warm-up, and run length"}
          </h2>

          <p>
            {es
              ? "El análisis de salidas se bifurca en un punto que determina todo lo demás: ¿es la simulación terminante o de estado estacionario? Una simulación terminante tiene un inicio y un fin naturales y bien definidos, dictados por el propio sistema —un banco que abre vacío a las 9:00 y cierra a las 17:00, el turno diario de un call center, un proyecto que termina. Sus medidas de desempeño son de horizonte finito y dependen de la condición inicial (usualmente vacía), que es justo lo que se quiere. Para sistemas terminantes la maquinaria de réplicas e IC de la Sub-pestaña 5 se aplica directa y limpiamente: cada réplica es un «día» y el arranque vacío es parte de la pregunta."
              : "Output analysis splits at a fork that determines everything downstream: is the simulation terminating or steady-state? A terminating simulation has a natural, well-defined start and stop dictated by the system itself — a bank that opens empty at 9:00 and closes at 17:00, a call center's daily shift, a project that finishes. Its performance measures are finite-horizon and depend on the (usually empty) initial condition, which is exactly as intended. For terminating systems the replication-CI machinery of Sub-tab 5 applies directly and cleanly: each replication is one \"day,\" and the empty start is part of the question."}
          </p>

          <p>
            {es
              ? "Una simulación de estado estacionario (no terminante) pregunta por el comportamiento de largo plazo de un sistema que, en principio, corre por siempre —una línea de manufactura 24/7, un hospital, un pool de servidores perpetuamente ocupado. Aquí la condición inicial es un artefacto, no parte de la pregunta, y crea el problema del sesgo de inicialización (o transitorio inicial): una simulación casi siempre arranca vacía y ociosa, que no es una condición típica de estado estacionario, así que las primeras observaciones están sesgadas a la baja (una cola que empieza vacía subrepresenta la congestión de largo plazo). Promediar desde t=0 contamina entonces la estimación de estado estacionario. El remedio estándar es un período de calentamiento: descartar («truncar») las primeras ℓ observaciones o unidades de tiempo y calcular estadísticas solo sobre el resto, para que los datos retenidos reflejen condiciones de estado estacionario."
              : "A steady-state (non-terminating) simulation asks about the long-run behavior of a system that, in principle, runs forever — a 24/7 manufacturing line, a hospital, a perpetually busy server pool. Here the initial condition is an artifact, not part of the question, and it creates the initialization bias (or initial-transient) problem: a simulation almost always starts empty and idle, which is not a typical steady-state condition, so early observations are biased low (a queue that starts empty under-represents the long-run congestion). Averaging from t=0 therefore contaminates the steady-state estimate. The standard remedy is a warm-up period: discard (\"truncate\") the first ℓ observations or time units and compute statistics only over the remainder, so the retained data reflect steady-state conditions."}
          </p>

          <p>
            {es
              ? "¿Cuán largo es el calentamiento? El procedimiento gráfico más usado es el método de Welch (Welch, 1983): correr varias réplicas independientes, promediar la métrica entre réplicas en cada índice de tiempo para amortiguar el ruido, aplicar luego una media móvil de ventana w a esa serie promediada y elegir visualmente el tiempo ℓ a partir del cual la curva suavizada se aplana —ese ℓ es la longitud de calentamiento a descartar. La lógica de fondo es que el promedio de conjunto entre réplicas estima la media dependiente del tiempo E[Y_t], cuya convergencia a la media estacionaria es exactamente el transitorio que se quiere recortar. La decisión acompañante es la longitud de corrida: tras el calentamiento, la corrida debe ser lo bastante larga para que las observaciones restantes ahoguen cualquier sesgo residual y den un IC estrecho; en la práctica se fija el calentamiento con Welch y luego se alargan las corridas (o se añaden réplicas) hasta cumplir la meta de semiamplitud de la Sub-pestaña 5. Una guía pragmática (Banks et al.) es que la corrida posterior al calentamiento sea al menos diez veces el calentamiento."
              : "How long is the warm-up? The most widely used graphical procedure is Welch's method (Welch, 1983): run several independent replications, average the metric across replications at each time index to damp noise, then apply a moving average of window w to that averaged series, and visually pick the time ℓ beyond which the smoothed curve has flattened — that ℓ is the warm-up length to discard. The governing logic is that the ensemble average across replications estimates the time-dependent mean E[Y_t], whose convergence to the steady-state mean is exactly the transient you want to clip. The companion decision is run length: after warm-up, the run must be long enough that the remaining observations both swamp any residual bias and yield a tight CI; in practice one fixes a warm-up via Welch, then lengthens runs (or adds replications) until the half-width target of Sub-tab 5 is met. A pragmatic guideline (Banks et al.) is to make the post-warm-up run length at least ten times the warm-up."}
          </p>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Elige primero el régimen correcto. Aplicar calentamiento de estado estacionario a una pregunta terminante (o viceversa) responde el problema equivocado."
                  : "Pick the right regime first. Applying steady-state warm-up to a terminating question (or vice versa) answers the wrong problem.",
                es
                  ? "El método de Welch es gráfico y subjetivo en la decisión final de «¿dónde se aplanó?»; la ventana w intercambia suavizado contra enmascarar el verdadero punto de aplanamiento. Estima un calentamiento, no una garantía de sesgo cero."
                  : "Welch's method is graphical and subjective in the final \"where did it flatten?\" call; the window w trades smoothing against masking the true flattening point. It estimates a warm-up, not a guarantee of zero bias.",
                es
                  ? "El arranque vacío y ocioso es el culpable habitual, pero otras condiciones iniciales (no típicas) también sesgan; inicializar más cerca del estado estacionario acorta —no elimina— el transitorio."
                  : "Empty-and-idle start is the usual culprit, but other (non-typical) initial conditions also bias; initializing closer to steady state shortens — not eliminates — the transient.",
                es
                  ? "Descartar muy poco deja sesgo; descartar demasiado desperdicia datos e infla la varianza. El calentamiento es un compromiso sesgo–varianza."
                  : "Discarding too little leaves bias; discarding too much wastes data and inflates variance. The warm-up is a bias–variance trade-off.",
                es
                  ? "Longitud de corrida y calentamiento interactúan: una corrida post-calentamiento demasiado corta deja sesgo residual incluso tras truncar."
                  : "Run length and warm-up interact: a too-short post-warm-up run leaves residual bias even after truncation.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <h3>{es ? "Ecuaciones gobernantes" : "Governing equations"}</h3>
          <p>
            {es
              ? "Media dependiente del tiempo (transitoria) estimada por el promedio de conjunto sobre R réplicas en el índice de tiempo j:"
              : "Time-dependent (transient) mean estimated by the ensemble average over R replications at time index j:"}
          </p>
          <Equation
            tex={String.raw`\bar Y_j=\frac1R\sum_{r=1}^{R}Y_{rj}\;\xrightarrow[\;j\to\infty\;]{}\;\mu=\mathbb E[Y_\infty].`}
            caption={es ? "El promedio de conjunto converge a la media estacionaria al crecer j." : "The ensemble average converges to the steady-state mean as j grows."}
          />
          <p>
            {es
              ? "Media móvil de Welch con ventana w (la serie suavizada cuyo aplanamiento localiza el calentamiento ℓ):"
              : "Welch moving average with window w (the smoothed series whose flattening locates the warm-up ℓ):"}
          </p>
          <Equation
            tex={String.raw`\bar Y_j(w)= \begin{cases} \dfrac{1}{2w+1}\displaystyle\sum_{s=-w}^{w}\bar Y_{j+s}, & j>w,\\[2.2ex] \dfrac{1}{2j-1}\displaystyle\sum_{s=-(j-1)}^{\,j-1}\bar Y_{j+s}, & 1\le j\le w . \end{cases}`}
            caption={es ? "Media móvil de Welch con tratamiento de borde para j ≤ w." : "Welch moving average with edge handling for j ≤ w."}
          />
          <p>
            {es
              ? "Estimador de estado estacionario corregido por calentamiento (truncado), descartando las primeras ℓ observaciones de una corrida de longitud m:"
              : "Truncated (warm-up-corrected) steady-state estimator discarding the first ℓ observations of a run of length m:"}
          </p>
          <Equation
            tex={String.raw`\hat\mu \;=\; \frac{1}{m-\ell}\sum_{j=\ell+1}^{m} Y_j .`}
            caption={es ? "Promedio solo sobre las observaciones retenidas tras el calentamiento." : "Average only over the retained post-warm-up observations."}
          />

          <h3>{es ? "Rol de modelado en este laboratorio" : "Modeling role in this lab"}</h3>
          <p>
            {es
              ? "Los regímenes M/M/c se corren contra el objetivo de estado estacionario Erlang-C: cada réplica arranca vacía y ociosa, lo que introduce sesgo de inicialización. Este laboratorio no aplica un calentamiento explícito; en cambio, toma n (clientes por corrida) lo bastante grande como para que el sesgo de inicialización sea despreciable frente a la media de toda la corrida, de modo que la estimación cae igualmente dentro del IC alrededor de la curva Erlang-C. La figura ilustra el método general de Welch (suavizar el promedio de conjunto, localizar el aplanamiento ℓ, descartar el transitorio), no un control del laboratorio: muestra por qué un arranque vacío sesga a la baja y cómo se corregiría con truncamiento si se necesitara."
              : "The M/M/c regimes are run against the Erlang-C steady-state target: each replication starts empty-and-idle, which introduces initialization bias. This lab applies no explicit warm-up; instead it takes n (customers per run) large enough that the initialization bias is negligible relative to the whole-run mean, so the estimate still lands inside the CI around the Erlang-C curve. The figure illustrates the general Welch method (smooth the ensemble average, locate the flattening ℓ, discard the transient), not a lab control: it shows why an empty start biases low and how truncation would correct it if needed."}
          </p>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 720 300"
              role="img"
              aria-label={
                es
                  ? "Sesgo de inicialización y calentamiento: la métrica promediada por conjunto sube desde un arranque vacío y se aplana a su nivel de estado estacionario; la región del transitorio inicial sombreada antes del corte de calentamiento se descarta."
                  : "Initialization bias and warm-up: the ensemble-averaged metric rises from an empty start and flattens to its steady-state level; the shaded initial-transient region before the warm-up cutoff is discarded."
              }
            >
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="60" y1="250" x2="690" y2="250" />
              <line stroke="var(--color-fg)" strokeWidth="1.5" x1="60" y1="30" x2="60" y2="250" />
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="375" y="284">{es ? "tiempo simulado t" : "simulated time t"}</text>
              <text fill="var(--color-fg)" fontSize="12" textAnchor="middle" x="20" y="140" transform="rotate(-90 20,140)">{es ? "métrica  Ȳⱼ (entre réplicas)" : "metric  Ȳⱼ (across reps)"}</text>
              <rect fill="var(--color-accent)" fillOpacity="0.18" x="60" y="30" width="200" height="220" />
              <text fill="var(--color-fg-faint)" fontSize="11" textAnchor="middle" x="160" y="48">{es ? "descartado" : "discarded"}</text>
              <text fill="var(--color-fg-faint)" fontSize="11" textAnchor="middle" x="160" y="64">{es ? "transitorio inicial" : "initial transient"}</text>
              <line stroke="var(--color-good)" strokeWidth="2" strokeDasharray="6 4" x1="60" y1="90" x2="690" y2="90" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="640" y="84">{es ? "estado estacionario μ" : "steady-state μ"}</text>
              <polyline
                fill="none"
                stroke="var(--color-fg-faint)"
                strokeWidth="1"
                opacity="0.7"
                points="60,250 90,205 120,175 150,150 180,128 210,118 240,104 270,99 300,95 330,88 360,93 390,90 420,86 450,92 480,89 510,87 540,91 570,88 600,90 630,89 660,91 690,90"
              />
              <path fill="none" stroke="var(--color-accent)" strokeWidth="2.6" d="M60,250 C120,180 200,120 260,100 C340,90 460,90 690,90" />
              <line stroke="var(--color-magenta)" strokeWidth="2" x1="260" y1="30" x2="260" y2="250" />
              <text fill="var(--color-fg-faint)" fontSize="11" x="266" y="240">{es ? "corte de calentamiento ℓ" : "warm-up cutoff ℓ"}</text>
              <text fill="var(--color-fg-faint)" fontSize="11" x="380" y="120">{es ? "retener y promediar  →  μ̂ = (1/(m−ℓ)) Σ_{j>ℓ} Yⱼ" : "retain & average  →  μ̂ = (1/(m−ℓ)) Σ_{j>ℓ} Yⱼ"}</text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Método de Welch: suaviza el promedio de conjunto, halla dónde se aplana en ℓ, descarta el transitorio sombreado y promedia el resto."
                : "Welch's method: smooth the ensemble average, find where it flattens at ℓ, discard the shaded transient, average the rest."}
            </figcaption>
          </figure>

          <Refs ids={["welch1983", "lawkelton2015", "banks2010"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
  ];

  return (
    <SubTabs
      orientation="vertical"
      ariaLabel={es ? "Metodología DES" : "DES methodology"}
      tabs={tabs}
    />
  );
}
