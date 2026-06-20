import { SubTabs } from "@/components/content/SubTabs";
import { Callout } from "@/components/content/Callout";
import { Equation } from "@/components/content/Equation";
import { Refs } from "@/components/content/Cite";

export function AbmTheory({ es }: { es: boolean }) {
  const tabs = [
    {
      id: "what-is-abm",
      label: es ? "¿Qué es un ABM?" : "What is an ABM?",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Un modelo basado en agentes (ABM) representa un sistema como una colección de entidades autónomas que toman decisiones — los agentes — situadas en un entorno, que interactúan entre sí y con dicho entorno según un conjunto de reglas de comportamiento. El compromiso metodológico que lo define es de abajo hacia arriba (bottom-up): el modelador especifica únicamente las entidades de micro-nivel y sus reglas locales, y el comportamiento de macro-nivel (a escala de sistema) no está escrito en ninguna parte — debe emerger de las interacciones simuladas. Esto invierte la postura clásica top-down de los modelos de ecuaciones agregadas, donde se escribe directamente la ley a escala de sistema (p. ej. una ecuación diferencial para una media poblacional) y los individuos nunca aparecen."
                : "An agent-based model (ABM) represents a system as a collection of autonomous decision-making entities — agents — situated in an environment, interacting with one another and with that environment according to a set of behavioral rules. The defining methodological commitment is bottom-up: the modeler specifies only the micro-level entities and their local rules, and the macro-level (system-level) behavior is not written down anywhere — it must emerge from the simulated interactions. This inverts the classical top-down stance of aggregate equation models, in which one writes the system-level law directly (e.g. a differential equation for a population mean) and the individuals never appear."}
            </p>
            <p>
              {es
                ? "Bonabeau (2002) precisa la propuesta de valor: el ABM es apropiado cuando (i) las interacciones entre agentes son no lineales, discontinuas o gobernadas por umbrales; (ii) los agentes son heterogéneos; (iii) la topología de las interacciones importa (espacio, redes); y (iv) los agentes se adaptan o aprenden, de modo que su comportamiento cambia en el tiempo. Cuando esto ocurre, las descripciones agregadas (de campo medio) pierden información causalmente relevante, y el individuo debe convertirse en la unidad de cómputo."
                : "Bonabeau (2002) frames the value proposition precisely: ABM is appropriate when (i) interactions between agents are nonlinear, discontinuous, or governed by thresholds; (ii) agents are heterogeneous; (iii) the topology of interactions matters (space, networks); and (iv) agents adapt or learn so that their behavior changes over time. When these hold, aggregate (mean-field) descriptions lose information that is causally relevant, and the individual must be made the unit of computation."}
            </p>
            <p>{es ? "Los tres ingredientes estructurales son:" : "The three structural ingredients are:"}</p>
            <ul>
              <li>
                {es
                  ? "Agentes. Entidades discretas con un estado interno (atributos como posición, riqueza, estado de salud, opinión), un campo perceptivo (qué del entorno y de los demás agentes pueden percibir) y un comportamiento (una regla que mapea el estado percibido a una acción). Los agentes pueden ser heterogéneos —diferir en atributos o incluso en conjuntos de reglas— y adaptativos, cambiando su regla o parámetros en respuesta a la experiencia."
                  : "Agents. Discrete entities with internal state (attributes such as position, wealth, health status, opinion), a perceptual field (what of the environment and of other agents they can sense), and a behavior (a rule mapping perceived state to action). Agents may be heterogeneous — differing in attributes or even in rule sets — and may be adaptive, changing their rule or parameters in response to experience."}
              </li>
              <li>
                {es
                  ? "Entorno. El medio donde viven los agentes y a través del cual se median muchas interacciones. Suele ser una grilla/retícula (con vecindarios de Moore o de von Neumann), un espacio continuo, una red/grafo o un conjunto sin estructura espacial. El entorno puede tener su propio estado (campos de recursos, obstáculos) y su propia dinámica (regeneración de recursos, difusión)."
                  : "Environment. The medium in which agents live and through which many interactions are mediated. It is commonly a grid/lattice (with Moore or von Neumann neighborhoods), continuous space, a network/graph, or a featureless aspatial pool. The environment may carry its own state (resource fields, obstacles) and its own dynamics (resource regrowth, diffusion)."}
              </li>
              <li>
                {es
                  ? "Reglas. La lógica de actualización local. Las reglas suelen ser condicionales y estocásticas: «si el vecindario percibido satisface la condición C, ejecutar la acción a (posiblemente con probabilidad p).» Pueden ser agente–agente, agente–entorno o entorno–entorno."
                  : "Rules. The local update logic. Rules are typically conditional and stochastic, expressed as “if the perceived neighborhood satisfies condition C, take action a (possibly with probability p).” Rules can be agent–agent, agent–environment, or environment–environment."}
              </li>
            </ul>
            <p>
              {es
                ? "El tiempo avanza en pasos discretos (ticks). En cada tick un planificador (scheduler) decide qué agentes actúan y en qué orden (tema de la Sub-pestaña 2). Como las reglas leen y escriben estado compartido, el orden y la concurrencia de las actualizaciones son en sí mismos decisiones de modelado que pueden cambiar los resultados — un hecho que distingue la contabilidad del ABM de la contabilidad por cola de eventos del DES."
                : "Time advances in discrete steps (ticks). On each tick a scheduler decides which agents act and in what order (the subject of Sub-tab 2). Because agent rules read and write shared state, the order and concurrency of updates are themselves modeling choices that can change results — a fact that distinguishes ABM bookkeeping from the event-queue bookkeeping of DES."}
            </p>
          </div>

          <Equation
            tex={String.raw`x_i(t+\Delta t) = f_i\!\big(x_i(t),\, \{x_j(t)\}_{j\in N_i(t)},\, E(t),\, \xi_i(t)\big),`}
            caption={
              es
                ? "Esqueleto formal: el agente i con estado x_i percibe un vecindario N_i y se actualiza mediante un mapa (posiblemente estocástico) f_i; E(t) es el estado del entorno y ξ_i(t) una entrada aleatoria i.i.d."
                : "Formal skeleton: agent i with state x_i perceives a neighborhood N_i and updates via a (possibly stochastic) map f_i; E(t) is the environment state and ξ_i(t) an i.i.d. random input."
            }
          />
          <Equation
            tex={String.raw`M(t) = \Phi\big(\{x_i(t)\}_i, E(t)\big).`}
            caption={
              es
                ? "El macro-observable es un funcional de toda la configuración; la pregunta científica central es cómo depende M de los mapas locales f_i."
                : "The macro-observable is a functional of the whole configuration; the central scientific question is how M depends on the local maps f_i."
            }
          />

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Micro-especificación cerrada. El modelo vale solo lo que vale su conjunto de reglas; no hay macro-ley de respaldo, así que un comportamiento omitido está silenciosamente ausente de la dinámica."
                  : "Closed micro-specification. The model is only as good as the rule set; there is no macro-law to fall back on, so an omitted behavior is silently absent from the dynamics.",
                es
                  ? "La semántica de acceso al estado importa. Los resultados pueden depender de si los agentes leen el estado actual (ya actualizado) o previo (pre-paso) de los vecinos — ver Sub-pestaña 2."
                  : "State-access semantics matter. Results can depend on whether agents read the current (already updated) or previous (pre-step) state of neighbors — see Sub-tab 2.",
                es
                  ? "Estocasticidad → distribuciones, no puntos. Una sola corrida es un único sorteo; las conclusiones requieren ensembles sobre semillas aleatorias."
                  : "Stochasticity → distributions, not points. A single run is one draw; conclusions require ensembles over random seeds.",
                es
                  ? "El costo computacional escala con el número de agentes y la densidad de interacción; los modelos de EDO de campo medio son baratos en comparación y deben preferirse cuando sus supuestos se cumplen."
                  : "Computational cost scales with agent count and interaction density; mean-field ODE models are cheap by comparison and should be preferred when their assumptions hold.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["bonabeau2002", "epstein1996"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "scheduler",
      label: es ? "Planificador y activación" : "Scheduler & activation",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "El planificador (scheduler) o régimen de activación determina qué agentes se actualizan en cada tick y en qué orden, y cómo cada agente lee el estado compartido. Como los agentes de un ABM mutan un mundo común, el planificador no es un detalle de implementación: es parte del modelo, y cambiarlo puede cambiar el resultado emergente. Conceptualmente existen tres regímenes canónicos. Mesa 2 los exponía como objetos planificador explícitos (RandomActivation / SimultaneousActivation / StagedActivation); Mesa 3 — el motor sobre el que corre este laboratorio — los eliminó y entrega en su lugar un AgentSet en model.agents, sobre el que el régimen se expresa directamente con métodos como do() (orden fijo) y shuffle_do() (orden barajado). Los escenarios de agentes de este laboratorio recorren su AgentSet (self.agents) y aplican una actualización simultánea por lotes: todas las transiciones de un paso se deciden contra la configuración del inicio del paso y luego se confirman juntas, que es la activación simultánea/síncrona descrita más abajo. Los regímenes aleatorio y por etapas se presentan aquí como la taxonomía conceptual completa, no como modos que el laboratorio alterne."
                : "The scheduler (activation regime) governs which agents are stepped on each tick and in what order, and how each agent reads shared state. Because ABM agents mutate a common world, the scheduler is not an implementation detail — it is part of the model, and changing it can change the emergent outcome. Conceptually there are three canonical regimes. Mesa 2 exposed them as explicit scheduler objects (RandomActivation / SimultaneousActivation / StagedActivation); Mesa 3 — the engine this lab runs on — removed those and instead gives every model an AgentSet at model.agents, on which the regime is expressed directly through methods like do() (fixed order) and shuffle_do() (shuffled order). This lab's agent scenarios iterate their AgentSet (self.agents) and apply a simultaneous batch update: every transition for a step is decided against the start-of-step configuration and then committed together — the simultaneous/synchronous activation described below. The random and staged regimes are presented here as the full conceptual taxonomy, not as modes the lab switches between."}
            </p>
            <p>
              {es
                ? "Activación aleatoria (asíncrona, secuencial). En cada tick, el conjunto de agentes se baraja en un orden aleatorio nuevo y se actualizan de uno en uno; cada agente lee el estado ya actualizado de los agentes que se movieron antes en el mismo tick. Esto elimina artefactos de un orden de iteración fijo y es el default seguro para la mayoría de ABMs sociales (Schelling, Sugarscape). El costo es que el orden intra-tick aún introduce correlaciones que hay que promediar a través de semillas."
                : "Random activation (asynchronous, sequential). Each tick, the agent set is shuffled into a fresh random order and stepped one at a time; each agent reads the already-updated state of agents that moved earlier in the same tick. This removes any artifact from a fixed iteration order and is the safe default for most social ABMs (Schelling, Sugarscape). The cost is that within-tick order still introduces correlations one must average over across seeds."}
            </p>
            <p>
              {es
                ? "Activación simultánea (síncrona) — el régimen de este laboratorio. Todos los agentes calculan primero su próximo estado a partir de una instantánea congelada del tick anterior (fase step), y luego se confirman todos los estados juntos (fase advance). Ningún agente ve el movimiento de otro dentro del tick. Esto es exactamente lo que hacen los escenarios de agentes del laboratorio sobre Mesa 3: el step() del modelo recorre el AgentSet (self.agents), decide todas las infecciones/recuperaciones (S03 SIR) o reubicaciones (S02 Schelling) leyendo el estado del inicio del paso, y recién entonces las aplica en bloque. Es el régimen correcto cuando el modelo busca aproximar un sistema de ecuaciones en diferencias acopladas actualizadas en bloque — p. ej. flocking tipo autómata celular, donde cada boid reacciona a dónde estaban sus vecinos. Las actualizaciones síncronas pueden crear sus propios artefactos (dos agentes intercambiando celdas, oscilaciones tipo «blinker») que los esquemas asíncronos evitan."
                : "Simultaneous activation (synchronous) — this lab's regime. All agents first compute their next state from a frozen snapshot of the previous tick (a step phase), then all states are committed together (an advance phase). No agent sees another's move within the tick. This is exactly what the lab's Mesa 3 agent scenarios do: the model's step() iterates the AgentSet (self.agents), decides every infection/recovery (S03 SIR) or relocation (S02 Schelling) by reading the start-of-step state, and only then applies them in a batch. This is the correct regime when the model is meant to approximate a system of coupled difference equations updated in lockstep — e.g. cellular-automaton style flocking where every boid reacts to where its neighbors were. Synchronous updates can create artifacts of their own (e.g. two agents swapping cells, “blinker” oscillations) that asynchronous schemes avoid."}
            </p>
            <p>
              {es
                ? "Activación por etapas (staged). Un tick se descompone en etapas ordenadas (p. ej. percibir → decidir → mover → comer); todos los agentes completan la etapa k antes de que cualquiera inicie la etapa k+1. Esto expresa modelos con estructura de fases real y permite que algunas etapas sean simultáneas y otras secuenciales. Sugarscape es naturalmente por etapas (mirar → mover → cosechar → metabolizar → morir/reproducir)."
                : "Staged activation. A single tick is decomposed into ordered stages (e.g. sense → decide → move → eat); all agents complete stage k before any agent begins stage k+1. This expresses models with genuine phase structure and lets some stages run simultaneously while others are sequential. Sugarscape is naturally staged (look → move → harvest → metabolize → die/reproduce)."}
            </p>
          </div>

          <Callout variant="strong" title={es ? "Regla metodológica" : "Methodological rule"}>
            <p>
              {es
                ? "Declarar el régimen de activación en la descripción del modelo (es un ítem «Scheduling» del protocolo ODD, Sub-pestaña 4) y probar la sensibilidad a él. Si las conclusiones cambian entre activación aleatoria y simultánea, el resultado es un artefacto del esquema de actualización, no de las reglas."
                : "State the activation regime in the model description (it is an ODD “Scheduling” item, Sub-tab 4) and test sensitivity to it. If conclusions flip between random and simultaneous activation, the result is an artifact of the update scheme, not of the rules."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 760 240"
              role="img"
              aria-label={es ? "Tres regímenes de activación contrastados" : "Three activation regimes contrasted"}
            >
              <defs>
                <marker id="sched-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="20" y="24" fontSize={15} fill="var(--color-fg)">
                {es ? "Regímenes de activación" : "Activation regimes"}
              </text>
              {/* Panel a: random */}
              <text x="20" y="56" fontSize={12} fill="var(--color-accent)">
                {es ? "(a) Aleatoria: orden barajado, secuencial" : "(a) Random: shuffled order, sequential"}
              </text>
              {[3, 1, 4, 2].map((n, i) => (
                <g key={`r${i}`}>
                  <rect x={20 + i * 50} y={70} width={30} height={30} rx={4} fill="var(--color-accent)" fillOpacity={0.18} stroke="var(--color-fg)" />
                  <text x={35 + i * 50} y={90} fontSize={13} textAnchor="middle" fill="var(--color-fg)">
                    {n}
                  </text>
                  {i < 3 && (
                    <line x1={50 + i * 50} y1={85} x2={68 + i * 50} y2={85} stroke="var(--color-fg)" strokeWidth={1.4} markerEnd="url(#sched-arrow)" />
                  )}
                </g>
              ))}
              {/* Panel b: simultaneous */}
              <text x="300" y="56" fontSize={12} fill="var(--color-magenta)">
                {es ? "(b) Simultánea: snapshot → commit" : "(b) Simultaneous: snapshot → commit"}
              </text>
              <rect x="300" y="70" width="80" height="30" rx={4} fill="var(--color-magenta)" fillOpacity={0.15} stroke="var(--color-fg)" />
              <text x="340" y="90" fontSize={11} textAnchor="middle" fill="var(--color-fg)">
                step
              </text>
              <line x1="382" y1="85" x2="408" y2="85" stroke="var(--color-fg)" strokeWidth={1.4} markerEnd="url(#sched-arrow)" />
              <rect x="410" y="70" width="80" height="30" rx={4} fill="var(--color-magenta)" fillOpacity={0.15} stroke="var(--color-fg)" />
              <text x="450" y="90" fontSize={11} textAnchor="middle" fill="var(--color-fg)">
                advance
              </text>
              {/* Panel c: staged */}
              <text x="20" y="140" fontSize={12} fill="var(--color-good)">
                {es ? "(c) Por etapas: etapa k completa antes de k+1" : "(c) Staged: stage k completes before k+1"}
              </text>
              {[1, 2, 3].map((s, i) => (
                <g key={`s${i}`}>
                  <rect x={20 + i * 150} y={155} width={120} height={34} rx={4} fill="var(--color-good)" fillOpacity={0.14} stroke="var(--color-fg)" />
                  <text x={80 + i * 150} y={177} fontSize={11} textAnchor="middle" fill="var(--color-fg)">
                    {es ? `etapa ${s}` : `stage ${s}`}
                  </text>
                  {i < 2 && (
                    <line x1={140 + i * 150} y1={172} x2={168 + i * 150} y2={172} stroke="var(--color-fg)" strokeWidth={1.4} markerEnd="url(#sched-arrow)" />
                  )}
                </g>
              ))}
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Los tres regímenes: (a) orden barajado secuencial; (b) instantánea congelada de dos fases (step→advance); (c) etapas ordenadas en bloque."
                : "The three regimes: (a) shuffled sequential order; (b) two-phase frozen snapshot (step→advance); (c) ordered lockstep stages."}
            </figcaption>
          </figure>

          <Equation
            tex={String.raw`x_{\pi(k)} \leftarrow f_{\pi(k)}\big(x_{\pi(k)}, \{x_j\}_{j\in N_{\pi(k)}}\big),\quad k=1,\dots,n,\ \ \pi\sim\mathrm{Unif}(S_n).`}
            caption={
              es
                ? "Aleatoria (secuencial): se sortea una permutación π cada tick; los estados vecinos x_j son los valores actuales (posiblemente ya actualizados)."
                : "Random (sequential): a permutation π is drawn each tick; neighbor states x_j are the current (possibly already-updated) values."
            }
          />
          <Equation
            tex={String.raw`x_i(t+\Delta t) = f_i\big(\tilde x_i, \{\tilde x_j\}_{j\in N_i(t)}\big)\quad \forall i \text{ at once},\quad \tilde x_j = x_j(t).`}
            caption={
              es
                ? "Simultánea (dos fases): con instantánea congelada x̃_j = x_j(t), todos los agentes se actualizan a la vez."
                : "Simultaneous (two-phase): with frozen snapshot x̃_j = x_j(t), all agents update at once."
            }
          />
          <Equation
            tex={String.raw`\text{Staged: for } s=1,\dots,S,\ \text{apply } f_i^{(s)} \text{ to all } i \text{ before advancing to } s+1.`}
            caption={
              es
                ? "Por etapas: para etapas s=1,…,S, aplicar f_i^(s) a todos los i antes de avanzar a s+1."
                : "Staged: for stages s=1,…,S, apply f_i^(s) to all i before advancing to s+1."
            }
          />

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "La activación aleatoria asume que el ordenamiento intra-tick es variación de ruido a promediar; reportar resultados sobre muchas semillas."
                  : "Random activation assumes within-tick ordering is nuisance variation to be averaged out; report results over many seeds.",
                es
                  ? "La activación simultánea asume un reloj global con sentido y puede introducir artefactos de paridad/oscilación; requiere una API de agente de dos fases (step/advance)."
                  : "Simultaneous activation assumes a meaningful global clock and can introduce parity/oscillation artifacts; requires a two-phase (step/advance) agent API.",
                es
                  ? "La activación por etapas asume que la descomposición en fases es parte de la ciencia, no una conveniencia."
                  : "Staged activation assumes the phase decomposition is part of the science, not a convenience.",
                es
                  ? "Las tres asumen que el modelador eligió explícitamente — un bucle de orden fijo implícito es un bug latente."
                  : "All three assume the modeler has explicitly chosen — an implicit fixed-order loop is a latent bug.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["masad2015", "kazil2020", "terhoeven2025"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "emergence",
      label: es ? "Emergencia" : "Emergence",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "La emergencia es la aparición de estructura, regularidad o función a escala de sistema que no está codificada en la regla de ningún agente y que no se predeciría al inspeccionar las reglas aisladamente. Es el fenómeno para cuyo estudio existe el ABM. El resultado canónico de Schelling —que una preferencia individual leve por vecinos similares produce segregación espacial casi total (Sub-pestaña 6)— es el ejemplo de libro de texto: ningún agente quiere una ciudad segregada, y sin embargo la ciudad se segrega. Los boids de Reynolds (Sub-pestaña 8) son otro: tres reglas locales de dirección, sin líder ni plan global, y aun así emerge una bandada coherente."
                : "Emergence is the appearance of system-level structure, regularity, or function that is not encoded in any agent's rule and that one would not predict by inspecting the rules in isolation. It is the phenomenon ABM exists to study. The canonical Schelling result — that mild individual preference for like-neighbors produces near-total spatial segregation (Sub-tab 6) — is the textbook example: no agent wants a segregated city, yet the city segregates. Reynolds's boids (Sub-tab 8) are another: three local steering rules, no leader and no global plan, yet coherent flocking emerges."}
            </p>
            <p>
              {es
                ? "El lema de Epstein para la lógica explicativa es generativo: «Si no lo hiciste crecer, no lo explicaste.» Un ABM explica un macro-patrón exhibiendo un conjunto de agentes y reglas locales cuya interacción genera ese patrón en la simulación. Es una afirmación de suficiencia (estas micro-reglas bastan para producir el macro-hecho), no de unicidad — que es justamente el origen de la dificultad de validación de la Sub-pestaña 5."
                : "Epstein's slogan for the explanatory logic is generative: “If you didn't grow it, you didn't explain it.” An ABM explains a macro-pattern by exhibiting a set of agents and local rules whose interaction generates that pattern in simulation. This is a sufficiency claim (these micro-rules suffice to produce the macro-fact), not a uniqueness claim — which is precisely the source of the validation difficulty in Sub-tab 5."}
            </p>
            <p>
              {es
                ? "La emergencia está ligada a la no linealidad y la interacción: si los agentes no interactuaran (o lo hicieran solo de forma aditiva), el agregado sería una simple suma de partes independientes y la agregación de campo medio no perdería nada. La emergencia requiere que el macro-observable sea un funcional no separable de la configuración — que el todo difiera genuinamente de la suma de las partes. En la práctica, los regímenes emergentes suelen estar separados por umbrales tipo transición de fase en un parámetro de control (la tolerancia de Schelling, el R₀ de la epidemia), donde un cambio pequeño del parámetro produce un cambio cualitativo del estado global."
                : "Emergence is tied to nonlinearity and interaction: if agents did not interact (or interacted only additively), the aggregate would be a simple sum of independent parts and mean-field aggregation would lose nothing. Emergence requires that the macro-observable be a non-separable functional of the configuration — that the whole genuinely differ from the sum of parts. Practically, emergent regimes are often separated by phase-transition-like thresholds in a control parameter (Schelling's tolerance, the epidemic's R₀), where a small parameter change produces a qualitative change in the global state."}
            </p>
            <p>
              {es
                ? "Aplica una disciplina de honestidad: no todo patrón llamativo es «emergencia». Los patrones implicados directamente por una regla (una regla que dice «formar una línea» produce líneas) son resultantes, no emergentes. Los casos interesantes son aquellos en que el macro-patrón es sorprendente respecto de la micro-regla y robusto a través de regímenes de activación y semillas."
                : "A discipline of honesty applies: not every striking pattern is “emergence.” Patterns that are directly implied by a rule (a rule that says “form a line” produces lines) are resultant, not emergent. The interesting cases are those where the macro-pattern is surprising relative to the micro-rule and robust across activation regimes and seeds."}
            </p>
          </div>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 760 360"
              role="img"
              aria-label={es ? "Emergencia: regla local sobre grilla produce patrón global" : "Emergence: local rule on a grid produces a global pattern"}
            >
              <defs>
                <marker id="emerge-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="20" y="26" fontSize={16} fill="var(--color-fg)">
                {es ? "Emergencia: regla local → patrón global" : "Emergence: local rule → global pattern"}
              </text>
              <text x="20" y="44" fontSize={11} fill="var(--color-fg-faint)">
                {es ? "ningún agente codifica la macro-estructura" : "no agent encodes the macro-structure"}
              </text>
              {/* LEFT PANEL: local rule, 3x3 Moore */}
              <text x="20" y="74" fontSize={12} fill="var(--color-fg-faint)">
                {es ? "REGLA LOCAL" : "LOCAL RULE"}
              </text>
              {Array.from({ length: 9 }).map((_, k) => {
                const r = Math.floor(k / 3);
                const c = k % 3;
                const isCenter = r === 1 && c === 1;
                const isLike = k === 0 || k === 2 || k === 7;
                const fill = isCenter ? "var(--color-accent)" : isLike ? "var(--color-magenta)" : "var(--color-fg)";
                const op = isCenter ? 0.55 : isLike ? 0.4 : 0.08;
                return (
                  <rect
                    key={`m${k}`}
                    x={60 + c * 60}
                    y={90 + r * 60}
                    width={50}
                    height={50}
                    rx={4}
                    fill={fill}
                    fillOpacity={op}
                    stroke="var(--color-border)"
                  />
                );
              })}
              <text x="160" y="300" fontSize={11} textAnchor="middle" fill="var(--color-fg-faint)">
                {es ? "contar vecinos similares" : "count like-neighbors"}
              </text>
              <text x="160" y="320" fontSize={11} textAnchor="middle" fill="var(--color-fg)">
                {es ? "si fracción similar < tolerancia → mover" : "if like-fraction < tolerance → move"}
              </text>
              {/* MIDDLE arrow */}
              <line x1="330" y1="190" x2="430" y2="190" stroke="var(--color-fg-faint)" strokeWidth={2} markerEnd="url(#emerge-arrow)" />
              <text x="380" y="178" fontSize={10} textAnchor="middle" fill="var(--color-fg-faint)">
                {es ? "iterar · muchos agentes · muchos ticks" : "iterate · many agents · many ticks"}
              </text>
              {/* RIGHT PANEL: global pattern 16x16 clusters */}
              <text x="440" y="74" fontSize={12} fill="var(--color-fg-faint)">
                {es ? "PATRÓN GLOBAL" : "GLOBAL PATTERN"}
              </text>
              {Array.from({ length: 256 }).map((_, k) => {
                const r = Math.floor(k / 16);
                const c = k % 16;
                // organic-ish 2-cluster split with a jagged boundary
                const boundary = 8 + Math.round(2.2 * Math.sin(r * 0.9) + 1.4 * Math.cos(r * 1.7));
                const typeA = c < boundary;
                return (
                  <rect
                    key={`g${k}`}
                    x={440 + c * 18}
                    y={90 + r * 14}
                    width={16}
                    height={12}
                    rx={1.5}
                    fill={typeA ? "var(--color-accent)" : "var(--color-magenta)"}
                    fillOpacity={0.32}
                  />
                );
              })}
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Panel izquierdo: la regla local de Schelling (fracción de vecinos similares en un vecindario de Moore 3×3). Panel derecho: el estado final segregado en dos clusters contiguos separados por una frontera dentada. Ninguna celda «quiere» individualmente este resultado."
                : "Left panel: the Schelling local rule (like-fraction over a 3×3 Moore neighborhood). Right panel: the segregated end-state in two contiguous clusters separated by a jagged boundary. No cell individually “wants” this outcome."}
            </figcaption>
          </figure>

          <Equation
            tex={String.raw`M\big(\{x_i\}\big) \neq \sum_i g(x_i) \qquad \text{(non-separable functional).}`}
            caption={
              es
                ? "La emergencia es la afirmación de que el macro-observable no se factoriza sobre los agentes (funcional no separable)."
                : "Emergence is the statement that the macro-observable does not factor over agents (non-separable functional)."
            }
          />
          <Equation
            tex={String.raw`m(\theta) = 0 \ \text{ for } \theta<\theta_c, \qquad m(\theta) > 0 \ \text{ for } \theta>\theta_c.`}
            caption={
              es
                ? "Cerca de un parámetro de control θ, un parámetro de orden tipo transición de fase m(θ) exhibe un umbral θ_c — p. ej. índice de segregación vs. tolerancia, o tamaño final de la epidemia vs. R₀ cruzando R₀=1."
                : "Near a control parameter θ, a phase-transition-like order parameter m(θ) exhibits a threshold θ_c — e.g. the segregation index vs. tolerance, or epidemic final size vs. R₀ across R₀=1."
            }
          />

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Suficiencia, no necesidad: generar un patrón muestra que las reglas pueden producirlo, nunca que son las únicas reglas que podrían (equifinalidad — Sub-pestaña 5)."
                  : "Sufficiency, not necessity: generating a pattern shows the rules can produce it, never that they are the only rules that could (equifinality — Sub-tab 5).",
                es
                  ? "La sorpresa es relativa al observador; la robustez a través de semillas/regímenes es la prueba objetiva."
                  : "Surprise is observer-relative; robustness across seeds/regimes is the objective test.",
                es
                  ? "Requiere interacción genuina (macro-funcional no separable) — de lo contrario, el campo medio basta."
                  : "Requires genuine interaction (non-separable macro-functional) — otherwise mean-field suffices.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["schelling1971", "reynolds1987", "epstein1996", "bonabeau2002"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "odd-protocol",
      label: es ? "El protocolo ODD" : "The ODD protocol",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "El protocolo ODD (Grimm et al. 2006, primera actualización 2010, segunda 2020) es el estándar de facto para describir modelos basados en individuos/agentes de modo que puedan entenderse, replicarse y compararse. Surgió para combatir la crónica falta de reproducibilidad de los artículos de ABM, donde las descripciones en prosa omitían justamente los detalles (planificación, inicialización, valores de parámetros) necesarios para reimplementar el modelo. ODD prescribe una secuencia fija de secciones en orden fijo, de modo que el lector siempre sabe dónde encontrar cada dato. ODD significa Overview (visión general), Design concepts (conceptos de diseño), Details (detalles), desplegado en siete elementos:"
                : "The ODD protocol (Grimm et al. 2006, first update 2010, second update 2020) is the de-facto standard for describing individual-/agent-based models so that they can be understood, replicated, and compared. It was introduced to combat the chronic non-reproducibility of ABM papers, where prose descriptions omitted exactly the details (scheduling, initialization, parameter values) needed to re-implement the model. ODD prescribes a fixed sequence of sections in a fixed order, so a reader always knows where to find a given fact. ODD stands for Overview, Design concepts, Details, expanded into seven elements:"}
            </p>
            <ol>
              <li>
                {es
                  ? "Propósito y patrones — por qué existe el modelo y los patrones con que se juzga su utilidad (la actualización de 2020 integra los patrones en el elemento de propósito para apoyar el modelado orientado a patrones)."
                  : "Purpose and patterns — why the model exists, and the patterns used to judge its usefulness (the 2020 update folds patterns into the purpose element to support pattern-oriented modeling)."}
              </li>
              <li>
                {es
                  ? "Entidades, variables de estado y escalas — los tipos de agentes y el entorno, las variables de estado que caracterizan a cada uno, y la resolución y extensión espacial/temporal."
                  : "Entities, state variables, and scales — the kinds of agents and the environment, the state variables that characterize each, and the spatial/temporal resolution and extent."}
              </li>
              <li>
                {es
                  ? "Visión general de procesos y planificación — qué hacen los agentes y el entorno en cada paso de tiempo y en qué orden (aquí se declara el régimen de activación de la Sub-pestaña 2)."
                  : "Process overview and scheduling — what the agents and environment do each time step and in what order (this is where the activation regime of Sub-tab 2 is declared)."}
              </li>
            </ol>
            <p>
              {es
                ? "Estos tres constituyen el Overview. El único elemento Design concepts documenta luego cómo encarna el modelo once conceptos recurrentes: Principios básicos; Emergencia; Adaptación; Objetivos; Aprendizaje; Predicción; Percepción (sensing); Interacción; Estocasticidad; Colectivos; Observación. Es la auditoría conceptual del modelo — p. ej. «qué emerge realmente vs. qué se impone», «qué perciben los agentes», «dónde se usa el azar». Por último, el bloque Details entrega todo lo necesario para reimplementar:"
                : "These three constitute the Overview. The single Design concepts element then documents how the model embodies eleven recurring concepts: Basic principles; Emergence; Adaptation; Objectives; Learning; Prediction; Sensing; Interaction; Stochasticity; Collectives; Observation. It is the conceptual audit of the model — e.g. “what truly emerges vs. what is imposed,” “what do agents sense,” “where is randomness used.” Finally the Details block gives everything needed to re-implement:"}
            </p>
            <ol start={4}>
              <li>
                {es
                  ? "Inicialización — el estado inicial (cuántos agentes, dónde, con qué distribución de atributos; ¿es siempre igual o estocástico?)."
                  : "Initialization — the initial state (how many agents, where, with what attribute distribution; is it always the same or stochastic)."}
              </li>
              <li>
                {es
                  ? "Datos de entrada — datos externos que dirigen el modelo, si los hay (a menudo «el modelo no usa datos de entrada externos»)."
                  : "Input data — external driving data, if any (often “the model uses no external input data”)."}
              </li>
              <li>
                {es
                  ? "Submodelos — la especificación completa de cada proceso nombrado en el elemento 3, con todas las ecuaciones y los valores de los parámetros."
                  : "Submodels — the full specification of every process named in element 3, with all equations and parameter values."}
              </li>
            </ol>
            <p>
              {es
                ? "El beneficio metodológico: una descripción ODD es suficientemente completa para recodificar a partir de ella, ordenada para que nada quede oculto y separable (conceptos vs. mecánica), por lo que la librería documenta cada modelo entregado con una tarjeta ODD compacta."
                : "The methodological payoff: an ODD description is complete enough to re-code from, ordered so nothing is hidden, and separable (concepts vs. mechanics), which is why the lab documents each shipped model with a compact ODD card."}
            </p>
          </div>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 720 460"
              role="img"
              aria-label={es ? "El protocolo ODD como estructura etiquetada" : "The ODD protocol as a labelled structure"}
            >
              <defs>
                <marker id="odd-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6 Z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="60" y="26" fontSize={15} fill="var(--color-fg)">
                {es ? "Protocolo ODD (Grimm et al. 2006 / 2010 / 2020)" : "ODD protocol (Grimm et al. 2006 / 2010 / 2020)"}
              </text>
              {/* spine arrow */}
              <line x1="30" y1="70" x2="30" y2="400" stroke="var(--color-fg)" strokeWidth={1.6} markerEnd="url(#odd-arrow)" />
              <text x="22" y="240" fontSize={10} fill="var(--color-fg-faint)" transform="rotate(-90 22 240)">
                {es ? "orden fijo" : "fixed order"}
              </text>
              {/* Container A OVERVIEW */}
              <rect x="60" y="50" width="640" height="90" rx={10} fill="transparent" stroke="var(--color-border)" />
              <rect x="60" y="50" width="8" height="90" rx={3} fill="var(--color-accent)" />
              <text x="80" y="70" fontSize={12} fill="var(--color-accent)">
                {es ? "OVERVIEW (visión general)" : "OVERVIEW"}
              </text>
              {[
                es ? "1 Propósito y patrones" : "1 Purpose & patterns",
                es ? "2 Entidades, variables, escalas" : "2 Entities, state variables, scales",
                es ? "3 Procesos y planificación" : "3 Process overview & scheduling",
              ].map((t, i) => (
                <g key={`oa${i}`}>
                  <rect x={84 + i * 205} y={84} width={195} height={42} rx={6} fill="var(--color-accent)" fillOpacity={0.12} stroke="var(--color-border)" />
                  <text x={84 + i * 205 + 97} y={109} fontSize={11} textAnchor="middle" fill="var(--color-fg)">
                    {t}
                  </text>
                </g>
              ))}
              {/* Container B DESIGN CONCEPTS */}
              <rect x="60" y="155" width="640" height="120" rx={10} fill="transparent" stroke="var(--color-border)" />
              <rect x="60" y="155" width="8" height="120" rx={3} fill="var(--color-magenta)" />
              <text x="80" y="175" fontSize={12} fill="var(--color-magenta)">
                {es ? "DESIGN CONCEPTS (conceptos de diseño) — 11" : "DESIGN CONCEPTS — 11"}
              </text>
              {[
                es ? "Principios básicos" : "Basic principles",
                "Emergence",
                es ? "Adaptación" : "Adaptation",
                es ? "Objetivos" : "Objectives",
                es ? "Aprendizaje" : "Learning",
                es ? "Predicción" : "Prediction",
                "Sensing",
                es ? "Interacción" : "Interaction",
                es ? "Estocasticidad" : "Stochasticity",
                es ? "Colectivos" : "Collectives",
                es ? "Observación" : "Observation",
              ].map((t, i) => {
                const col = i % 6;
                const row = Math.floor(i / 6);
                return (
                  <g key={`dc${i}`}>
                    <rect x={84 + col * 102} y={188 + row * 40} width={96} height={32} rx={6} fill="var(--color-magenta)" fillOpacity={0.1} stroke="var(--color-border)" />
                    <text x={84 + col * 102 + 48} y={208 + row * 40} fontSize={9.5} textAnchor="middle" fill="var(--color-fg)">
                      {t}
                    </text>
                  </g>
                );
              })}
              {/* Container C DETAILS */}
              <rect x="60" y="290" width="640" height="90" rx={10} fill="transparent" stroke="var(--color-border)" />
              <rect x="60" y="290" width="8" height="90" rx={3} fill="var(--color-accent)" />
              <text x="80" y="310" fontSize={12} fill="var(--color-accent)">
                {es ? "DETAILS (detalles)" : "DETAILS"}
              </text>
              {[
                es ? "4 Inicialización" : "4 Initialization",
                es ? "5 Datos de entrada" : "5 Input data",
                es ? "6 Submodelos" : "6 Submodels",
              ].map((t, i) => (
                <g key={`dt${i}`}>
                  <rect x={84 + i * 205} y={324} width={195} height={42} rx={6} fill="var(--color-accent)" fillOpacity={0.12} stroke="var(--color-border)" />
                  <text x={84 + i * 205 + 97} y={349} fontSize={11} textAnchor="middle" fill="var(--color-fg)">
                    {t}
                  </text>
                </g>
              ))}
              <text x="60" y="420" fontSize={10} fill="var(--color-fg-faint)">
                {es
                  ? "7 elementos; replica un modelo solo desde su bloque Details"
                  : "7 elements; replicate a model from its Details block alone"}
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "El protocolo como estructura: tres contenedores apilados (O, D, D) en orden fijo, con sus chips de elementos; Design concepts despliega los once conceptos recurrentes."
                : "The protocol as structure: three stacked containers (O, D, D) in fixed order, with their element chips; Design concepts unfolds the eleven recurring concepts."}
            </figcaption>
          </figure>

          <Callout variant="note" title={es ? "Ecuaciones" : "Equations"}>
            <p>
              {es
                ? "ODD es un estándar de documentación y no tiene ecuaciones propias; su elemento Submodels es el contenedor en el que se transcribe cada ecuación específica de modelo de este documento (utilidad de Schelling, tasas SIR, dirección de boids, metabolismo de Sugarscape)."
                : "ODD is a documentation standard and has no equations of its own; its Submodels element is the container into which every model-specific equation in this document (Schelling utility, SIR rates, boids steering, Sugarscape metabolism) is transcribed."}
            </p>
          </Callout>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "ODD estandariza la descripción, no el diseño — un modelo bien descrito puede seguir siendo un mal modelo."
                  : "ODD standardizes description, not design — a well-described model can still be a bad model.",
                es
                  ? "El elemento Design concepts es cualitativo; su rigor depende de la honestidad del autor."
                  : "The Design concepts element is qualitative; its rigor depends on author honesty.",
                es
                  ? "El orden estricto puede sentirse verboso para modelos diminutos; la librería usa una tarjeta ODD condensada preservando el orden de los elementos."
                  : "Strict ordering can feel verbose for tiny models; the lab uses a condensed ODD card while preserving the element order.",
                es
                  ? "ODD cubre un único modelo; los sistemas acoplados/híbridos pueden necesitar las extensiones ODD+D o multi-modelo."
                  : "ODD covers a single model; coupled/hybrid systems may need the ODD+D or multi-model extensions.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["grimm2006", "grimm2010", "grimm2020"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "validation",
      label: es ? "Validación de ABM" : "Validation challenges",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "La validación de ABM es más difícil que la de los modelos de ecuaciones, y las dificultades son estructurales, no incidentales."
                : "ABM validation is harder than for equation models, and the difficulties are structural, not incidental."}
            </p>
            <p>
              {es
                ? "Equifinalidad (el problema inverso está mal planteado). Como un ABM solo demuestra suficiencia — un conjunto de reglas que puede generar el patrón objetivo — muchos conjuntos de reglas distintos pueden reproducir igual de bien los mismos macro-datos. Ajustar la salida agregada, por tanto, no identifica el micro-mecanismo. La mitigación estándar es el modelado orientado a patrones (POM): exigir que el modelo reproduzca múltiples patrones a múltiples escalas simultáneamente, lo que poda el espacio de mecanismos admisibles mucho más que un único ajuste agregado."
                : "Equifinality (the inverse problem is ill-posed). Because an ABM only demonstrates sufficiency — a rule set that can generate the target pattern — many distinct rule sets may reproduce the same macro-data equally well. Matching aggregate output therefore does not identify the micro-mechanism. The standard mitigation is pattern-oriented modeling (POM): require the model to reproduce multiple patterns at multiple scales simultaneously, which prunes the space of admissible mechanisms far more sharply than a single aggregate fit."}
            </p>
            <p>
              {es
                ? "Explosión de parámetros y calibración. Agentes heterogéneos con reglas ricas acarrean muchos parámetros, a menudo no observables individualmente. La calibración se vuelve de alta dimensión y costosa; los parámetros estimados pueden estar débilmente identificados. Se requiere análisis de sensibilidad (de a uno y global, p. ej. Sobol/descomposición de varianza) para saber qué parámetros realmente mueven las salidas."
                : "Parameter explosion and calibration. Heterogeneous agents with rich rules carry many parameters, often unobservable individually. Calibration becomes high-dimensional and expensive; estimated parameters may be weakly identified. Sensitivity analysis (one-at-a-time and global, e.g. Sobol/variance decomposition) is needed to learn which parameters actually drive outputs."}
            </p>
            <p>
              {es
                ? "Estocasticidad y necesidad de ensembles. Las salidas son variables aleatorias. Una sola corrida puede engañar; las afirmaciones deben apoyarse en distribuciones sobre semillas, atendiendo a si la varianza misma (no solo la media) es el objeto de interés. Los resultados raros pero consecuentes (eventos de báscula) requieren suficientes réplicas para estimar las colas."
                : "Stochasticity and the need for ensembles. Outputs are random variables. A single run can mislead; claims must rest on distributions over seeds, with attention to whether variance itself (not just the mean) is the object of interest. Rare-but-consequential outcomes (tipping events) require enough replicates to estimate tails."}
            </p>
            <p>
              {es
                ? "Verificación vs. validación. La verificación pregunta «¿construimos el modelo correctamente?» (el código implementa las reglas previstas — pruebas unitarias, invariantes, chequeos de conservación). La validación pregunta «¿construimos el modelo correcto?» (el modelo corresponde al sistema objetivo). Un contraste útil es el docking / alineamiento (Axtell et al.): reimplementar el modelo en un segundo marco y confirmar que los resultados coinciden, separando la dinámica genuina de los artefactos de implementación. La librería aplica la verificación más fuerte disponible a su modelo insignia de cola M/M/c: las métricas de estado estacionario del simulador DES se contrastan con la fórmula cerrada de Erlang-C, un oráculo analítico exacto — un lujo que la mayoría de los ABM no tiene, y justamente por eso la cola ancla la credibilidad de la librería."
                : "Verification vs. validation. Verification asks “did we build the model right?” (the code implements the intended rules — unit tests, invariants, conservation checks). Validation asks “did we build the right model?” (the model corresponds to the target system). A useful cross-check is docking / alignment (Axtell et al.): re-implement the model in a second framework and confirm the results coincide, separating genuine dynamics from implementation artifacts. The lab applies the strongest available verification to its M/M/c queue flagship: the DES simulator's steady-state metrics are checked against the closed-form Erlang-C result, an exact analytic oracle — a luxury most ABMs lack, and precisely why the queue anchors the lab's credibility."}
            </p>
            <p>
              {es
                ? "Artefactos de planificación. Como advierte la Sub-pestaña 2, las conclusiones deben mostrarse robustas al régimen de activación; de lo contrario reflejan el esquema de actualización y no el mecanismo modelado."
                : "Schedule artifacts. As Sub-tab 2 warns, conclusions must be shown robust to the activation regime; otherwise they reflect the update scheme rather than the modeled mechanism."}
            </p>
          </div>

          <Equation
            tex={String.raw`1-\rho = e^{-R_0\,\rho}`}
            caption={
              es
                ? "Relación de tamaño final como oráculo de validación del SIR de agentes frente al límite EDO: la única ρ∈(0,1) que la resuelve es la tasa de ataque analítica a la que el modelo de agentes debe aproximarse cuando N→∞ con contactos bien mezclados."
                : "Final-size relation as a validation oracle for the agent SIR against the ODE limit: the unique ρ∈(0,1) solving it is the analytic attack rate the agent model must approach as N→∞ with well-mixed contacts."
            }
          />

          <Callout variant="honest" title={es ? "Erlang-C como oráculo" : "Erlang-C as oracle"}>
            <p>
              {es
                ? "Erlang-C (el oráculo de cola, transcrito en la pista DES) juega el mismo papel para el modelo insignia M/M/c: un P(espera) exacto contra el cual probar el simulador."
                : "Erlang-C (the queue oracle, transcribed in the DES track) plays the same role for the M/M/c flagship: an exact P(wait) to test the simulator against."}
            </p>
          </Callout>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "La equifinalidad significa que un buen ajuste es consistencia, no prueba; nunca leer identificación de mecanismo de un único calce agregado."
                  : "Equifinality means a good fit is consistency, not proof; never read mechanism identification from a single aggregate match.",
                es
                  ? "La calibración es tan confiable como lo sea la identificabilidad de los parámetros; reportar sensibilidad."
                  : "Calibration is only as trustworthy as the identifiability of the parameters; report sensitivity.",
                es
                  ? "Todas las afirmaciones cuantitativas son afirmaciones de ensemble; una sola corrida es anécdota."
                  : "All quantitative claims are ensemble claims; a single run is anecdote.",
                es
                  ? "Verificación (código correcto) y validación (modelo apto) son distintas; pasar una no garantiza la otra."
                  : "Verification (code correct) and validation (model apt) are distinct; passing one does not grant the other.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs
            ids={["sargent2013", "grimm2006", "kermack1927", "erlang1917", "lawkelton2015"]}
            label={es ? "Referencias:" : "References:"}
          />
        </div>
      ),
    },
    {
      id: "schelling",
      label: es ? "Schelling (1971)" : "Schelling (1971)",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Dynamic Models of Segregation (1971) de Thomas C. Schelling es el ABM fundacional de las ciencias sociales y la demostración más limpia de emergencia. Agentes de dos tipos ocupan celdas de una grilla; algunas celdas están vacías. Cada agente está satisfecho si la fracción de sus vecinos de Moore ocupados que comparten su tipo es al menos un umbral de tolerancia τ (el caso famoso de Schelling: un agente solo quiere no estar en minoría estricta localmente). Los agentes insatisfechos se reubican — a una celda vacía aleatoria o a la satisfactoria más cercana — y el proceso itera hasta una (casi) estacionariedad."
                : "Thomas C. Schelling's Dynamic Models of Segregation (1971) is the founding ABM of the social sciences and the cleanest demonstration of emergence. Agents of two types occupy cells of a grid; some cells are empty. Each agent is satisfied if the fraction of its occupied Moore-neighbors that share its type is at least a tolerance threshold τ (Schelling's famous case: an agent wants merely not to be in a strict minority locally). Unsatisfied agents relocate — to a random empty cell, or the nearest satisfactory one — and the process iterates until (near-)stationarity."}
            </p>
            <p>
              {es
                ? "El resultado sorprendente: incluso una preferencia leve por el propio tipo (p. ej. τ=1/3 a 1/2 — agentes felices de vivir como minoría de un tercio o la mitad) lleva al sistema a una fuerte segregación global, con un índice de segregación (fracción media de vecinos similares) muy por encima de lo que cualquier agente exige. La segregación es un macro-estado emergente y no intencionado: ningún agente es «suficientemente racista» para querer una ciudad segregada, y aun así la ciudad se segrega. Esta disociación entre micro-preferencia y macro-resultado es justamente la lección de la Sub-pestaña 3, y hace de Schelling la primera demo interactiva de la librería (deslizador en τ, índice de segregación en vivo, formación visible de clusters)."
                : "The startling result: even a mild own-type preference (e.g. τ=1/3 to 1/2 — agents happy to live in a one-third or half minority) drives the system to strong global segregation, with a segregation index (mean fraction of like-neighbors) far above what any agent demands. Segregation is an emergent, unintended macro-state: no agent is “racist enough” to want a segregated city, yet the city segregates. This dissociation between micro-preference and macro-outcome is exactly the lesson of Sub-tab 3, and it makes Schelling the lab's first interactive demo (slider on τ, live segregation index, visible cluster formation)."}
            </p>
            <p>
              {es
                ? "Nota de figura: el panel izquierdo de SVG-EMERGENCE (Sub-pestaña 3) es literalmente la regla de fracción-similar de Schelling, y su panel derecho el estado final segregado. No se necesita figura aparte; el lienzo React en vivo renderiza la grilla real."
                : "Figure note: the left panel of SVG-EMERGENCE (Sub-tab 3) is literally the Schelling like-fraction rule, and its right panel the segregated end-state. No separate figure is needed; the live React canvas renders the actual grid."}
            </p>
          </div>

          <Equation
            tex={String.raw`s_i = \frac{\big|\{\,j\in N_i : c_j=c_i\,\}\big|}{|N_i|}, \qquad |N_i|>0.`}
            caption={
              es
                ? "El agente i tiene tipo c_i∈{0,1} y vecindario ocupado N_i; s_i es la fracción de vecinos del mismo tipo."
                : "Agent i has type c_i∈{0,1} and occupied neighborhood N_i; s_i is the like-fraction of same-type neighbors."
            }
          />
          <Equation
            tex={String.raw`u_i = \mathbb{1}\!\left[\,s_i \ge \tau\,\right], \qquad \text{move } i \iff u_i = 0 .`}
            caption={
              es
                ? "El agente i está satisfecho si y solo si s_i ≥ τ; de lo contrario se reubica."
                : "Agent i is satisfied iff s_i ≥ τ; otherwise it relocates."
            }
          />
          <Equation
            tex={String.raw`S = \frac{1}{n}\sum_{i=1}^{n} s_i,`}
            caption={
              es
                ? "El macro-observable es el índice de segregación (fracción similar media sobre los agentes ocupados); la afirmación de emergencia es S ≫ τ en estacionariedad para τ moderado."
                : "The macro-observable is the segregation index (mean like-fraction over occupied agents); the emergence claim is S ≫ τ at stationarity for moderate τ."
            }
          />

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Dos tipos, una sola tolerancia — la forma clásica ignora gradientes de intensidad, ingreso, escuelas, etc."
                  : "Two types, single tolerance — the classic form ignores intensity gradients, income, schools, etc.",
                es
                  ? "Solo percepción local (vecindario de Moore/von Neumann); sin información global."
                  : "Local sensing only (Moore/von Neumann neighborhood); no global information.",
                es
                  ? "Se requieren celdas vacías para la movilidad; la densidad afecta si el equilibrio es alcanzable."
                  : "Empty cells required for mobility; density affects whether equilibrium is reachable.",
                es
                  ? "El resultado depende de la regla de reubicación (aleatoria vs. satisfactoria más cercana) y del régimen de activación — reportarlo."
                  : "Outcome depends on relocation rule (random vs. nearest-satisfactory) and on activation regime — report it.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["schelling1971", "epstein1996"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "sir",
      label: es ? "Epidemia SIR (1927)" : "SIR epidemic (1927)",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "El modelo compartimental SIR, del artículo de 1927 de Kermack y McKendrick A Contribution to the Mathematical Theory of Epidemics, divide a la población en compartimentos Susceptible, Infeccioso y Recuperado (removido). En la forma de acción de masas, los susceptibles se vuelven infecciosos a una tasa proporcional al producto SI (la probabilidad de que se encuentre un par aleatorio S–I), y los infecciosos se recuperan a una tasa per cápita constante γ. Con tamaño poblacional N=S+I+R y tasa de transmisión β, las EDO que la gobiernan son:"
                : "The SIR compartmental model, from Kermack & McKendrick's 1927 A Contribution to the Mathematical Theory of Epidemics, partitions a population into Susceptible, Infectious, and Recovered (removed) compartments. In the mass-action form, susceptibles become infectious at rate proportional to the product SI (the chance a random S–I pair meets), and infectious individuals recover at a constant per-capita rate γ. With population size N=S+I+R and transmission rate β, the governing ODEs are:"}
            </p>
          </div>

          <Equation
            tex={String.raw`\frac{dS}{dt} = -\frac{\beta\,S\,I}{N}, \qquad \frac{dI}{dt} = \frac{\beta\,S\,I}{N} - \gamma I, \qquad \frac{dR}{dt} = \gamma I .`}
            caption={es ? "Las tres EDO del SIR de acción de masas." : "The three mass-action SIR ODEs."}
          />

          <div className="prose">
            <p>
              {es
                ? "El número reproductivo básico — el número esperado de infecciones secundarias a partir de un individuo infeccioso en una población totalmente susceptible — es:"
                : "The basic reproduction number — the expected number of secondary infections from one infectious individual in a fully susceptible population — is:"}
            </p>
          </div>

          <Equation tex={String.raw`R_0 = \frac{\beta}{\gamma}.`} caption={es ? "Número reproductivo básico." : "Basic reproduction number."} />

          <div className="prose">
            <p>
              {es
                ? "Una epidemia crece (dI/dt>0 al inicio) si y solo si R₀·(S/N) > 1, es decir si R₀>1 cuando S≈N. El pico de infecciosos ocurre cuando dI/dt=0, es decir cuando la fracción susceptible cae a S/N = 1/R₀. Esto da de inmediato el umbral de inmunidad de rebaño: una vez que una fracción"
                : "An epidemic grows (dI/dt>0 at the start) iff R₀·(S/N) > 1, i.e. iff R₀>1 when S≈N. The infectious peak occurs when dI/dt=0, i.e. when the susceptible fraction falls to S/N = 1/R₀. This immediately gives the herd-immunity threshold: once a fraction"}
            </p>
          </div>

          <Equation tex={String.raw`p_c = 1 - \frac{1}{R_0}`} caption={es ? "Umbral de inmunidad de rebaño." : "Herd-immunity threshold."} />

          <div className="prose">
            <p>
              {es
                ? "de la población es inmune, cada infección produce en promedio menos de un caso secundario y la epidemia no puede crecer. Por último, la relación de tamaño final da la tasa de ataque total ρ (fracción alguna vez infectada) como la única raíz en (0,1) de:"
                : "of the population is immune, each infection produces on average fewer than one secondary case and the epidemic cannot grow. Finally, the final-size relation gives the total attack rate ρ (fraction ever infected) as the unique root in (0,1) of:"}
            </p>
          </div>

          <Equation tex={String.raw`1-\rho = e^{-R_0\,\rho}.`} caption={es ? "Relación de tamaño final (tasa de ataque)." : "Final-size relation (attack rate)."} />

          <div className="prose">
            <p>
              {es
                ? "La versión de agentes. En la implementación del laboratorio sobre Mesa 3 (mesa.space.SingleGrid, un agente mesa.Agent por celda), cada celda lleva un estado de salud discreto ∈{S,I,R} sobre una retícula con vecindarios de Moore. En cada tick, una celda susceptible se infecta con probabilidad 1−(1−β)^k a partir de sus k vecinos infectados, y una celda infectada se recupera con probabilidad γ por tick (de modo que el período infeccioso medio es 1/γ ticks). Bajo mezcla suficiente y N grande, estas micro-reglas reproducen la EDO anterior — el grado de vecindario de Moore juega el papel de ⟨k⟩, de modo que la β efectiva ≈ ⟨k⟩·β_por-contacto y la tasa de recuperación ≈ γ — lo que permite comparar el modelo de agentes contra el R₀ cerrado, el umbral de inmunidad de rebaño y la curva de tamaño final. El valor del modelo de agentes está justamente donde la EDO falla: estructura espacial (el clustering en la grilla baja el R₀ efectivo y la tasa de ataque por debajo de la predicción de mezcla perfecta), discretitud (extinción estocástica cuando I es pequeño aun con R₀>1) y heterogeneidad local. El rédito didáctico es mostrar las corridas de agentes apartándose de la EDO de campo medio porque el contagio sólo viaja entre vecinos espaciales, no entre pares cualesquiera."
                : "The agent version. In the lab's Mesa 3 implementation (mesa.space.SingleGrid, one mesa.Agent per cell), each cell carries a discrete health state ∈{S,I,R} on a lattice with Moore neighborhoods. On each tick a susceptible cell becomes infected with probability 1−(1−β)^k from its k infected neighbors, and an infected cell recovers with probability γ per tick (so the mean infectious period is 1/γ ticks). Under sufficient mixing and large N these micro-rules reproduce the ODE above — the Moore-neighborhood degree plays the role of ⟨k⟩, so the effective β ≈ ⟨k⟩·β_per-contact and the recovery rate ≈ γ — letting one compare the agent model against the closed-form R₀, herd-immunity threshold, and final-size curve. The agent model's value is precisely where the ODE fails: spatial structure (grid clustering lowers the effective R₀ and the attack rate below the well-mixed prediction), discreteness (stochastic fade-out when I is small even with R₀>1), and local heterogeneity. The didactic payoff is showing the agent runs departing from the mean-field ODE because contagion only travels between spatial neighbors, not between arbitrary pairs."}
            </p>
          </div>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 640 240"
              role="img"
              aria-label={es ? "Flujo compartimental SIR S→I→R con tasas β y γ" : "SIR compartmental flow S→I→R with rates β and γ"}
            >
              <defs>
                <marker id="sir-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6 Z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="20" y="28" fontSize={15} fill="var(--color-fg)">
                {es ? "Flujo compartimental SIR (Kermack–McKendrick 1927)" : "SIR compartmental flow (Kermack–McKendrick 1927)"}
              </text>
              {/* S box */}
              <rect x="40" y="80" width="120" height="80" rx={10} fill="var(--color-accent)" fillOpacity={0.15} stroke="var(--color-fg)" />
              <text x="100" y="125" fontSize={13} textAnchor="middle" fill="var(--color-fg)">
                {es ? "S  Susceptible" : "S  Susceptible"}
              </text>
              {/* arrow S->I */}
              <line x1="160" y1="120" x2="258" y2="120" stroke="var(--color-fg)" strokeWidth={2} markerEnd="url(#sir-arrow)" />
              <text x="209" y="108" fontSize={11} textAnchor="middle" fill="var(--color-fg)">
                β S I / N
              </text>
              {/* I box */}
              <rect x="260" y="80" width="120" height="80" rx={10} fill="var(--color-magenta)" fillOpacity={0.18} stroke="var(--color-fg)" />
              <text x="320" y="125" fontSize={13} textAnchor="middle" fill="var(--color-fg)">
                {es ? "I  Infeccioso" : "I  Infectious"}
              </text>
              {/* arrow I->R */}
              <line x1="380" y1="120" x2="478" y2="120" stroke="var(--color-fg)" strokeWidth={2} markerEnd="url(#sir-arrow)" />
              <text x="429" y="108" fontSize={11} textAnchor="middle" fill="var(--color-fg)">
                γ I
              </text>
              {/* R box */}
              <rect x="480" y="80" width="120" height="80" rx={10} fill="var(--color-good)" fillOpacity={0.15} stroke="var(--color-fg)" />
              <text x="540" y="125" fontSize={13} textAnchor="middle" fill="var(--color-fg)">
                {es ? "R  Recuperado" : "R  Recovered"}
              </text>
              {/* SIRS waning back-arrow */}
              <path d="M540,160 C540,200 100,200 100,162" fill="none" stroke="var(--color-fg-faint)" strokeWidth={1.2} strokeDasharray="5 4" markerEnd="url(#sir-arrow)" />
              <text x="320" y="196" fontSize={10} textAnchor="middle" fill="var(--color-fg-faint)">
                {es ? "(SIRS: pérdida de inmunidad)" : "(SIRS: waning)"}
              </text>
              {/* caption strip */}
              <text x="320" y="228" fontSize={10.5} textAnchor="middle" fill="var(--color-fg-faint)">
                R₀ = β/γ;  p_c = 1 − 1/R₀;  1−ρ = e^(−R₀ρ)
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Cadena compartimental S→I→R: fuerza de infección βSI/N y recuperación γI; la flecha punteada de retorno R⇢S marca la extensión SIRS (pérdida de inmunidad)."
                : "Compartment chain S→I→R: force of infection βSI/N and recovery γI; the dashed back-arrow R⇢S flags the SIRS (waning) extension."}
            </figcaption>
          </figure>

          <Equation
            tex={String.raw`\beta \approx \langle k\rangle\, p_{\text{inf}}, \qquad \gamma \approx p_{\text{rec}}, \qquad \text{mean infectious period} = \tfrac{1}{p_{\text{rec}}}\ \text{ticks}.`}
            caption={
              es
                ? "Mapeo agente↔EDO: tasa efectiva de transmisión, tasa de recuperación y período infeccioso medio en el límite de N grande y mezcla perfecta."
                : "Agent↔ODE mapping: effective transmission rate, recovery rate, and mean infectious period in the large-N, well-mixed limit."
            }
          />

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Población cerrada, sin demografía (sin nacimientos/muertes) en la escala de tiempo de la epidemia; N constante."
                  : "Closed population, no demography (no births/deaths) over the epidemic timescale; constant N.",
                es
                  ? "Acción de masas / mezcla perfecta en la forma EDO — todo par igualmente probable de contactarse (el supuesto que el modelo de agentes existe para relajar)."
                  : "Mass action / well-mixed in the ODE form — every pair equally likely to contact (the assumption the agent model exists to relax).",
                es
                  ? "Tasas constantes β, γ; inmunidad permanente (sin S←R; para pérdida de inmunidad, añadir un término SIRS)."
                  : "Constant rates β, γ; permanent immunity (no S←R; for waning add an SIRS term).",
                es
                  ? "La correspondencia agente–EDO solo se cumple en el límite de N grande y mezcla perfecta; la estructura la rompe."
                  : "The agent–ODE correspondence holds only in the large-N, well-mixed limit; structure breaks it.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["kermack1927", "bonabeau2002"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "boids",
      label: es ? "Boids / flocking (1987)" : "Boids / flocking (1987)",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Los Boids de Craig Reynolds (Flocks, Herds, and Schools: A Distributed Behavioral Model, SIGGRAPH 1987) son el ABM canónico del movimiento coordinado y un hito de la computación gráfica. Cada «boid» es un agente en espacio continuo con posición y velocidad, que se dirige usando solo percepción local (vecinos dentro de un radio y un campo de visión frontal). No hay líder ni coreografía global; la bandada coherente emerge de tres reglas de dirección aplicadas a los compañeros cercanos:"
                : "Craig Reynolds's Boids (Flocks, Herds, and Schools: A Distributed Behavioral Model, SIGGRAPH 1987) is the canonical ABM of coordinated motion and a landmark in computer graphics. Each “boid” is an agent in continuous space with position and velocity, steering itself using only local perception (neighbors within a radius and a forward field of view). There is no leader and no global choreography; coherent flocking emerges from three steering rules applied to nearby flockmates:"}
            </p>
            <ol>
              <li>
                {es
                  ? "Separación — dirigirse para evitar amontonarse con los compañeros locales (repulsión de corto alcance)."
                  : "Separation — steer to avoid crowding local flockmates (short-range repulsion)."}
              </li>
              <li>
                {es
                  ? "Alineación — dirigirse hacia el rumbo (velocidad) medio de los compañeros locales."
                  : "Alignment — steer toward the average heading (velocity) of local flockmates."}
              </li>
              <li>
                {es
                  ? "Cohesión — dirigirse hacia la posición media (centro de masa) de los compañeros locales."
                  : "Cohesion — steer toward the average position (center of mass) of local flockmates."}
              </li>
            </ol>
            <p>
              {es
                ? "Cada regla produce un vector de aceleración; la dirección del boid es una suma ponderada, limitada por una fuerza y una velocidad máximas. La bandada emergente es fluida, se divide y se reúne alrededor de obstáculos, y fue célebremente usada para los enjambres de murciélagos en Batman Returns (1992) — una demostración contundente de que el movimiento colectivo complejo no necesita un controlador central, solo reglas locales: la emergencia prototípica de la Sub-pestaña 3 en espacio continuo."
                : "Each rule yields an acceleration vector; the boid's steering is a weighted sum, capped by a maximum force and speed. The emergent flock is fluid, splits and merges around obstacles, and was famously used for the bat swarms in Batman Returns (1992) — a striking demonstration that complex collective motion needs no central controller, only local rules, the prototypical Sub-tab 3 emergence in continuous space."}
            </p>
          </div>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 760 220"
              role="img"
              aria-label={es ? "Las tres reglas de dirección de Boids y una bandada emergente" : "The three Boids steering rules and an emergent flock"}
            >
              <defs>
                <marker id="boid-arrow" markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto">
                  <path d="M0,0 L6,2.5 L0,5 Z" fill="var(--color-fg)" />
                </marker>
              </defs>
              {/* Separation */}
              <text x="20" y="28" fontSize={12} fill="var(--color-accent)">
                {es ? "1 Separación" : "1 Separation"}
              </text>
              <circle cx="90" cy="110" r="5" fill="var(--color-fg)" />
              <line x1="90" y1="110" x2="55" y2="80" stroke="var(--color-fg)" strokeWidth={1.4} markerEnd="url(#boid-arrow)" />
              <line x1="90" y1="110" x2="130" y2="85" stroke="var(--color-fg)" strokeWidth={1.4} markerEnd="url(#boid-arrow)" />
              <line x1="90" y1="110" x2="100" y2="150" stroke="var(--color-fg)" strokeWidth={1.4} markerEnd="url(#boid-arrow)" />
              {/* Alignment */}
              <text x="210" y="28" fontSize={12} fill="var(--color-accent)">
                {es ? "2 Alineación" : "2 Alignment"}
              </text>
              {[0, 1, 2, 3].map((i) => (
                <line key={`al${i}`} x1={220 + i * 25} y1={120 - i * 6} x2={250 + i * 25} y2={114 - i * 6} stroke="var(--color-magenta)" strokeWidth={1.6} markerEnd="url(#boid-arrow)" />
              ))}
              {/* Cohesion */}
              <text x="410" y="28" fontSize={12} fill="var(--color-accent)">
                {es ? "3 Cohesión" : "3 Cohesion"}
              </text>
              <circle cx="480" cy="110" r="4" fill="var(--color-good)" />
              {[[440, 70], [525, 80], [435, 150], [530, 145]].map(([x, y], i) => (
                <line key={`co${i}`} x1={x} y1={y} x2={480 - (480 - x) * 0.4} y2={110 - (110 - y) * 0.4} stroke="var(--color-fg)" strokeWidth={1.4} markerEnd="url(#boid-arrow)" />
              ))}
              {/* Emergent flock */}
              <text x="600" y="28" fontSize={12} fill="var(--color-accent)">
                {es ? "4 Bandada emergente" : "4 Emergent flock"}
              </text>
              {[[610, 90], [635, 80], [660, 95], [685, 78], [710, 92], [630, 115], [665, 120], [700, 118]].map(([x, y], i) => (
                <path key={`fl${i}`} d={`M${x},${y} l8,3 l-8,3 l2,-3 Z`} fill="var(--color-magenta)" fillOpacity={0.7} />
              ))}
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Las tres reglas: separación (flechas que apartan), alineación (flechas que se vuelven paralelas), cohesión (flechas que jalan al centroide), y la bandada coherente que emerge de su suma ponderada."
                : "The three rules: separation (arrows pushing apart), alignment (arrows turning parallel), cohesion (arrows pulling to a centroid), and the coherent flock that emerges from their weighted sum."}
            </figcaption>
          </figure>

          <Equation
            tex={String.raw`\mathbf{a}_i^{\text{sep}} = -\!\!\sum_{j\in N_i} \frac{\mathbf{p}_j-\mathbf{p}_i}{\lVert \mathbf{p}_j-\mathbf{p}_i\rVert^{2}}, \qquad \mathbf{a}_i^{\text{ali}} = \frac{1}{|N_i|}\sum_{j\in N_i}\mathbf{v}_j - \mathbf{v}_i,`}
            caption={
              es
                ? "Aceleraciones de separación (repulsión inversa al cuadrado) y alineación (hacia la velocidad media de los vecinos) para el boid i con vecindario N_i."
                : "Separation (inverse-square repulsion) and alignment (toward neighbors' mean velocity) accelerations for boid i with neighborhood N_i."
            }
          />
          <Equation
            tex={String.raw`\mathbf{a}_i^{\text{coh}} = \Big(\frac{1}{|N_i|}\sum_{j\in N_i}\mathbf{p}_j\Big) - \mathbf{p}_i .`}
            caption={es ? "Aceleración de cohesión: hacia el centro de masa de los vecinos." : "Cohesion acceleration: toward the neighbors' center of mass."}
          />
          <Equation
            tex={String.raw`\mathbf{a}_i = \mathrm{clip}\big(w_s\,\mathbf{a}_i^{\text{sep}} + w_a\,\mathbf{a}_i^{\text{ali}} + w_c\,\mathbf{a}_i^{\text{coh}},\ a_{\max}\big),`}
            caption={
              es
                ? "Dirección combinada: suma ponderada (pesos w_s, w_a, w_c) limitada por una fuerza máxima a_max."
                : "Combined steering: weighted sum (weights w_s, w_a, w_c) capped by a max force a_max."
            }
          />
          <Equation
            tex={String.raw`\mathbf{v}_i \leftarrow \mathrm{clip}(\mathbf{v}_i + \mathbf{a}_i\,\Delta t,\ v_{\max}), \qquad \mathbf{p}_i \leftarrow \mathbf{p}_i + \mathbf{v}_i\,\Delta t.`}
            caption={
              es
                ? "Integración: la velocidad se limita a v_max y la posición avanza con el paso Δt. (Reynolds 1987 especifica los tres comportamientos cualitativamente; estas formas vectoriales son la transcripción estándar.)"
                : "Integration: velocity is capped at v_max and position advances by step Δt. (Reynolds 1987 specifies the three behaviors qualitatively; these vector forms are the standard transcription.)"
            }
          />

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Solo percepción local — el radio y el campo de visión definen el vecindario; los resultados dependen de ambos."
                  : "Local perception only — radius and FOV define the neighborhood; results depend on both.",
                es
                  ? "Suma ponderada de tres aceleraciones — los pesos relativos sintonizan el régimen (bandada apretada vs. suelta); ningún conjunto de pesos es «correcto», son perillas de modelado."
                  : "Weighted sum of three accelerations — relative weights tune the regime (tight vs. loose flock); no weight set is “correct,” they are modeling knobs.",
                es
                  ? "Se requieren topes de fuerza/velocidad para un movimiento estable; el paso de integración afecta la estabilidad."
                  : "Force/speed caps required for stable motion; integration step affects stability.",
                es
                  ? "Puramente conductual/descriptivo — los Boids reproducen la apariencia del flocking, no la biomecánica ni la biología de decisión de animales reales."
                  : "Purely behavioral/descriptive — Boids reproduce appearance of flocking, not the biomechanics or decision biology of real animals.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["reynolds1987", "bonabeau2002"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "sugarscape",
      label: es ? "Sugarscape (1996)" : "Sugarscape (1996)",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Sugarscape, del libro de Epstein y Axtell Growing Artificial Societies: Social Science from the Bottom Up (MIT Press / Brookings, 1996), es el ABM fundacional de la ciencia social generativa: hace crecer fenómenos macro-sociales — distribuciones de riqueza sesgadas, migración, comercio, transmisión cultural, combate, enfermedad — a partir de agentes que siguen unas pocas reglas locales simples sobre un paisaje de recursos. El entorno es una grilla de celdas, cada una con una capacidad de azúcar y un nivel actual que se regenera con el tiempo. Cada agente tiene atributos genéticos fijos: visión (qué tan lejos ve a lo largo de los ejes), metabolismo (azúcar quemada por paso) y una dotación de azúcar almacenada (riqueza)."
                : "Sugarscape, from Epstein & Axtell's Growing Artificial Societies: Social Science from the Bottom Up (MIT Press / Brookings, 1996), is the foundational generative social science ABM: it grows macro-social phenomena — skewed wealth distributions, migration, trade, cultural transmission, combat, disease — from agents following a few simple local rules on a resource landscape. The environment is a grid of cells, each with a sugar capacity and current sugar level that regrows over time. Each agent has fixed genetic attributes: vision (how far it can see along the axes), metabolism (sugar burned per step), and an endowment of stored sugar (wealth)."}
            </p>
            <p>
              {es
                ? "La regla de movimiento base, M, es local y voraz: mira hasta el límite de tu visión en las cuatro direcciones de la retícula, identifica la celda desocupada con más azúcar, muévete allí y cosecha toda su azúcar. En cada paso, la riqueza del agente cambia según el azúcar cosechada menos el metabolismo; un agente cuya riqueza llega a cero muere (inanición). De este montaje mínimo emerge una distribución de riqueza robusta y muy sesgada (una desigualdad tipo Pareto / Gini alto) puramente por la heterogeneidad en visión, metabolismo y posición — no por una regla que prescriba la desigualdad. Al añadir más reglas (reemplazo/reproducción, estaciones, contaminación, un segundo recurso «especia» con comercio, combate, cultura y enfermedad transmisibles) se generan los fenómenos sociales correspondientes, todos de abajo hacia arriba. Sugarscape es el ejemplo canónico de emergencia impulsada por recursos y de la planificación por etapas (Sub-pestaña 2); se trata aquí como modelo de referencia, no como un escenario que el laboratorio ejecute en vivo."
                : "The base movement rule, M, is local and greedy: look out to the limit of your vision along the four lattice directions, identify the unoccupied cell with the most sugar, move there, and harvest all its sugar. Each step the agent's wealth changes by harvested sugar minus metabolism; an agent whose wealth hits zero dies (starvation). From this minimal setup a robust, highly skewed wealth distribution emerges (a Pareto-like / Gini-large inequality) purely from heterogeneity in vision, metabolism, and position — not from any rule that prescribes inequality. Layering further rules (replacement/reproduction, seasons, pollution, a second resource “spice” with trade, combat, transmissible culture and disease) generates the corresponding social phenomena, all bottom-up. Sugarscape is the canonical exemplar of resource-driven emergence and of staged scheduling (Sub-tab 2); it is treated here as a reference model, not as a scenario the lab runs live."}
            </p>
          </div>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 760 300"
              role="img"
              aria-label={es ? "Regla local voraz de Sugarscape y curva de Lorenz / cuña de Gini" : "Sugarscape greedy local rule and Lorenz curve / Gini wedge"}
            >
              <defs>
                <marker id="sugar-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="20" y="26" fontSize={15} fill="var(--color-fg)">
                {es ? "Regla local voraz → riqueza global sesgada" : "Greedy local rule → skewed global wealth"}
              </text>
              {/* Left: sugar field with vision and move */}
              <text x="20" y="56" fontSize={12} fill="var(--color-fg-faint)">
                {es ? "REGLA M: mirar → mover → cosechar" : "RULE M: look → move → harvest"}
              </text>
              {Array.from({ length: 25 }).map((_, k) => {
                const r = Math.floor(k / 5);
                const c = k % 5;
                const sugar = ((r * 5 + c * 3) % 7) / 7;
                return (
                  <rect
                    key={`sg${k}`}
                    x={40 + c * 44}
                    y={70 + r * 40}
                    width={40}
                    height={36}
                    rx={3}
                    fill="var(--color-good)"
                    fillOpacity={0.1 + 0.5 * sugar}
                    stroke="var(--color-border)"
                  />
                );
              })}
              <circle cx="62" cy="148" r="8" fill="var(--color-accent)" />
              <line x1="70" y1="148" x2="240" y2="108" stroke="var(--color-fg)" strokeWidth={1.6} markerEnd="url(#sugar-arrow)" />
              <text x="155" y="100" fontSize={10} textAnchor="middle" fill="var(--color-fg-faint)">
                {es ? "celda libre con más azúcar" : "free cell with most sugar"}
              </text>
              {/* Right: Lorenz curve */}
              <text x="470" y="56" fontSize={12} fill="var(--color-fg-faint)">
                {es ? "DESIGUALDAD EMERGENTE (Lorenz / Gini)" : "EMERGENT INEQUALITY (Lorenz / Gini)"}
              </text>
              <line x1="470" y1="250" x2="470" y2="80" stroke="var(--color-fg)" strokeWidth={1.2} />
              <line x1="470" y1="250" x2="720" y2="250" stroke="var(--color-fg)" strokeWidth={1.2} />
              {/* equality line */}
              <line x1="470" y1="250" x2="720" y2="80" stroke="var(--color-fg-faint)" strokeWidth={1} strokeDasharray="4 4" />
              {/* Lorenz curve (convex sag) */}
              <path d="M470,250 C580,248 660,210 720,80" fill="none" stroke="var(--color-magenta)" strokeWidth={2} />
              <path d="M470,250 C580,248 660,210 720,80 L720,250 Z" fill="var(--color-magenta)" fillOpacity={0.12} />
              <text x="595" y="200" fontSize={10} fill="var(--color-fg-faint)">
                {es ? "área = Gini" : "area = Gini"}
              </text>
              <text x="595" y="270" fontSize={10} textAnchor="middle" fill="var(--color-fg-faint)">
                {es ? "fracción de población" : "population fraction"}
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Izquierda: la regla M voraz — el agente mira en los cuatro ejes y se mueve a la celda libre con más azúcar. Derecha: la curva de Lorenz que se hunde bajo la línea de igualdad; el área entre ambas es el coeficiente de Gini emergente."
                : "Left: the greedy rule M — the agent looks along the four axes and moves to the free cell with the most sugar. Right: the Lorenz curve sagging below the equality line; the area between them is the emergent Gini coefficient."}
            </figcaption>
          </figure>

          <Equation
            tex={String.raw`w_i(t+1) = w_i(t) + h_i(t) - m_i(t), \qquad \text{agent dies if } w_i \le 0 .`}
            caption={
              es
                ? "Actualización de riqueza del agente i en su celda elegida (azúcar cosechada h_i menos metabolismo m_i); el agente muere si su riqueza llega a cero."
                : "Wealth update for agent i at its chosen cell (harvested sugar h_i minus metabolism m_i); the agent dies if wealth hits zero."
            }
          />
          <Equation
            tex={String.raw`\text{sugar}_c(t+1) = \min\big(K_c,\ \text{sugar}_c(t) + \alpha\big).`}
            caption={
              es
                ? "Regla de regeneración G_α: el azúcar de la celda crece hacia su capacidad K_c a tasa α."
                : "Growback rule G_α: cell sugar regrows toward capacity K_c at rate α."
            }
          />
          <Equation
            tex={String.raw`\mathrm{Gini} = \frac{\sum_{i}\sum_{j}\lvert w_i - w_j\rvert}{2\,n\sum_i w_i},`}
            caption={
              es
                ? "El macro-observable emergente es la desigualdad de la distribución de riqueza (coeficiente de Gini), que sube a valores altos solo por la regla M."
                : "The emergent macro-observable is the wealth distribution's inequality (Gini coefficient), which rises to large values from the simple rule M alone."
            }
          />

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Estilizado, no empírico — Sugarscape demuestra mecanismos (la desigualdad puede surgir de la heterogeneidad); no es un modelo calibrado de ninguna economía real."
                  : "Stylized, not empirical — Sugarscape demonstrates mechanisms (inequality can arise from heterogeneity); it is not a calibrated model of any real economy.",
                es
                  ? "Optimización local voraz — la regla base no tiene previsión, planificación ni interacción estratégica."
                  : "Greedy local optimization — the base rule has no foresight, planning, or strategic interaction.",
                es
                  ? "Grilla discreta + visión solo en los ejes — la geometría moldea los resultados; estos no son invariantes a la rotación."
                  : "Discrete grid + axis-only vision — geometry shapes outcomes; results are not rotation-invariant.",
                es
                  ? "Las variantes de reglas ricas multiplican parámetros rápido (la equifinalidad, Sub-pestaña 5, acecha en cuanto se añade comercio/combate)."
                  : "Rich-rule variants multiply parameters fast (equifinality, Sub-tab 5, looms once you add trade/combat).",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["epstein1996", "schelling1971"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "mesa",
      label: es ? "Mesa 3: el motor de ABM del laboratorio" : "Mesa 3: the lab's ABM engine",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Los escenarios de agentes de este laboratorio corren sobre Mesa 3, el marco de ABM en Python de referencia (Kazil, Masad y Crooks 2020; originalmente Masad y Kazil 2015; Mesa 3 en ter Hoeven et al. 2025). S02 Schelling, S03 SIR y S05 Beer Game están construidos con sus abstracciones reales — mesa.Agent para las entidades, mesa.Model para el mundo, mesa.space.SingleGrid para las grillas (S02/S03; el Beer Game es una red serial sin espacio) y el AgentSet del modelo (self.agents) para la activación. El patrón concreto que verás en el código es:"
                : "This lab's agent scenarios run on Mesa 3, the reference Python ABM framework (Kazil, Masad & Crooks 2020; originally Masad & Kazil 2015; Mesa 3 in ter Hoeven et al. 2025). S02 Schelling, S03 SIR and S05 Beer Game are built on its real abstractions — mesa.Agent for the entities, mesa.Model for the world, mesa.space.SingleGrid for the grids (S02/S03; the Beer Game is a serial network with no space), and the model's AgentSet (self.agents) for activation. The concrete pattern you will see in the code is:"}
            </p>
            <ul>
              <li>
                {es
                  ? "Subclase de mesa.Agent — cada hogar (S02), celda (S03) o eslabón (S05) es un mesa.Agent con su estado propio (grupo, estado de salud, pronóstico) y su regla local; al construirse con super().__init__(model) Mesa lo registra solo en model.agents y le asigna un unique_id."
                  : "Subclass mesa.Agent — each household (S02), cell (S03) or echelon (S05) is a mesa.Agent carrying its own state (group, health state, forecast) and its local rule; built with super().__init__(model), Mesa registers it into model.agents and assigns a unique_id automatically."}
              </li>
              <li>
                {es
                  ? "Subclase de mesa.Model con un espacio Mesa — el mundo es un mesa.Model; S02/S03 usan mesa.space.SingleGrid (un agente por celda, vecindarios de Moore vía grid.iter_neighbors(..., moore=True)), mientras que el Beer Game prescinde del espacio por ser una red serial de cuatro etapas."
                  : "Subclass mesa.Model with a Mesa space — the world is a mesa.Model; S02/S03 use mesa.space.SingleGrid (one agent per cell, Moore neighborhoods via grid.iter_neighbors(..., moore=True)), while the Beer Game drops the space because it is a four-stage serial network."}
              </li>
              <li>
                {es
                  ? "Activación por el AgentSet (self.agents) + actualización simultánea por lotes — el paso del modelo recorre self.agents (el AgentSet de Mesa 3, sin los planificadores eliminados de Mesa 2), decide todas las transiciones contra la configuración del inicio del paso y las aplica en bloque; toda la aleatoriedad fluye por el RNG sembrado de Mesa (Model(rng=seed) siembra self.random y self.rng), así run(params, seed) es una función pura — la base del visor de reproducción determinista."
                  : "Activation via the AgentSet (self.agents) + a simultaneous batch update — the model's step iterates self.agents (Mesa 3's AgentSet, without Mesa 2's removed schedulers), decides every transition against the start-of-step configuration, then applies them in a batch; all randomness flows through Mesa's seeded RNG (Model(rng=seed) seeds self.random and self.rng), so run(params, seed) is a pure function — the basis of the deterministic-replay viewer."}
              </li>
            </ul>
            <p>
              {es
                ? "Eso vale para los tres modelos del laboratorio, y las mismas abstracciones de Mesa son las que lo llevan más allá cuando un modelo propio crece. Lo que el marco ofrece — y lo que justifica elegirlo tanto aquí como para tu propio trabajo — es:"
                : "That holds for all three of the lab's models, and the same Mesa abstractions are what carry it further as your own model grows. What the framework offers — and what justifies choosing it both here and for your own work — is:"}
            </p>
            <ul>
              <li>
                {es
                  ? "Clases base Model y Agent — se hereda de Agent (dándole estado y un método step() que codifica su regla local) y de Model (que contiene la población de agentes, el entorno y el planificador) — útil cuando los agentes son heterogéneos y no se reducen a una sola operación de grilla."
                  : "Model and Agent base classes — you subclass Agent (giving it state and a step() method encoding its local rule) and Model (holding the agent population, the environment, and the schedule) — useful when agents are heterogeneous and do not reduce to a single grid operation."}
              </li>
              <li>
                {es
                  ? "Módulos de espacio — grillas (SingleGrid, MultiGrid, con vecindarios de Moore/von Neumann), ContinuousSpace (p. ej. para Boids), HexGrid y espacios de red — que proveen el entorno de la Sub-pestaña 1 sin reimplementarlo."
                  : "Space modules — grids (SingleGrid, MultiGrid, with Moore/von Neumann neighborhoods), ContinuousSpace (e.g. for Boids), HexGrid, and network spaces — supplying the environment of Sub-tab 1 without reimplementing it."}
              </li>
              <li>
                {es
                  ? "Regímenes de activación — históricamente los planificadores RandomActivation, SimultaneousActivation y StagedActivation del módulo time (Mesa 3 los generaliza mediante métodos de activación de AgentSet como shuffle_do y do) — la realización directa de la Sub-pestaña 2 cuando se necesita elegir y alternar el orden de actualización."
                  : "Activation regimes — historically the time module's RandomActivation, SimultaneousActivation, and StagedActivation schedulers (Mesa 3 generalizes these via AgentSet activation methods like shuffle_do and do) — the direct realization of Sub-tab 2 when you need to choose and switch the update order."}
              </li>
              <li>
                {es
                  ? "DataCollector — registra variables a nivel de modelo y de agente en cada paso, en tablas ordenadas para el análisis de ensembles que exige la Sub-pestaña 5."
                  : "DataCollector — records model- and agent-level variables each step into tidy tables for the ensemble analysis Sub-tab 5 requires."}
              </li>
              <li>
                {es
                  ? "Visualización — un servidor interactivo en navegador (deslizadores de parámetros + gráficos y grillas en vivo) para prototipar modelos rápidamente."
                  : "Visualization — a browser-based interactive server (parameter sliders + live plots and grids) for prototyping models quickly."}
              </li>
            </ul>
            <p>
              {es
                ? "Un matiz de despliegue honesto: el cierre de wheels de Mesa (numpy + mesa, con pandas/scipy/networkx/sqlite3 como dependencias) sí carga en Pyodide — fue medido, no asumido — así que el ABM se re-ejecuta en vivo en el navegador (S02 Schelling, S03 SIR, S05 Beer Game), con un arranque en frío de ≈3 s durante el cual una traza canónica comprometida pinta el primer cuadro al instante. Las colas DES (SimPy: S01 Banco/Clínica, S04 Urgencias) también corren en vivo. Lo único que se precomputa son los escenarios de solver nativo (OR-Tools), que no tienen build de WebAssembly. Misma honestidad para ambas pistas: la semilla fija el resultado, la traza es la verdad, el visor la reproduce."
                : "An honest deployment nuance: Mesa's wheel closure (numpy + mesa, with pandas/scipy/networkx/sqlite3 as dependencies) does load in Pyodide — measured, not assumed — so the ABM re-runs live in the browser (S02 Schelling, S03 SIR, S05 Beer Game), with a ~3 s cold start during which a committed canonical trace paints the first frame instantly. The DES queues (SimPy: S01 Bank/Clinic, S04 ED) also run live. The only precomputed scenarios are the native-solver ones (OR-Tools), which have no WebAssembly build. Same honesty for both lanes: the seed fixes the result, the trace is the truth, the viewer replays it."}
            </p>
          </div>

          <Callout variant="strong" title={es ? "La arquitectura en una línea" : "The architecture in one line"}>
            <p>
              {es
                ? "SimPy (con validación cruzada Ciw) maneja las colas dirigidas por eventos; Mesa 3 maneja los agentes dirigidos por reglas; ambos alimentan el mismo visor de reproducción determinista (deterministic-replay)."
                : "SimPy (with Ciw cross-validation) handles the event-driven queues; Mesa 3 handles the rule-driven agents; both feed the same deterministic-replay viewer."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 760 140"
              role="img"
              aria-label={es ? "Bucle de actualización Mesa 3 del laboratorio: estado(t) → Model.step() sobre AgentSet → estado(t+1) → frame → visor" : "Lab's Mesa 3 update loop: state(t) → Model.step() over AgentSet → state(t+1) → frame → viewer"}
            >
              <defs>
                <marker id="mesa-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6 Z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="20" y="28" fontSize={14} fill="var(--color-fg)">
                {es ? "Bucle de actualización Mesa 3 del laboratorio (un step por tick)" : "The lab's Mesa 3 update loop (one step per tick)"}
              </text>
              {[
                { t: es ? "estado(t)" : "state(t)", x: 20 },
                { t: "Model.step()", x: 175 },
                { t: es ? "estado(t+1)" : "state(t+1)", x: 330 },
                { t: "frame trace", x: 470 },
                { t: es ? "Visor replay" : "Replay viewer", x: 625 },
              ].map((b, i) => (
                <g key={`mb${i}`}>
                  <rect x={b.x} y={60} width={i === 4 ? 115 : 130} height={44} rx={8} fill="var(--color-accent)" fillOpacity={0.12} stroke="var(--color-fg)" />
                  <text x={b.x + (i === 4 ? 57 : 65)} y={87} fontSize={11.5} textAnchor="middle" fill="var(--color-fg)">
                    {b.t}
                  </text>
                </g>
              ))}
              {[150, 305, 460, 600].map((x, i) => (
                <line key={`ma${i}`} x1={x} y1={82} x2={x + 22} y2={82} stroke="var(--color-fg)" strokeWidth={1.6} markerEnd="url(#mesa-arrow)" />
              ))}
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "El bucle real del laboratorio: cada tick, el Model.step() de Mesa 3 recorre el AgentSet (self.agents), decide todas las transiciones contra el estado(t) y las aplica como actualización por lotes para producir el estado(t+1), se registra un frame, y la traza alimenta el visor de reproducción determinista. Este bucle de Mesa corre en vivo en Pyodide (S02/S03/S05); la traza canónica comprometida solo provee el primer cuadro instantáneo mientras el runtime calienta."
                : "The lab's actual loop: each tick, Mesa 3's Model.step() iterates the AgentSet (self.agents), decides every transition against state(t) and applies them as a batch update to produce state(t+1), a frame is recorded, and the trace feeds the deterministic-replay viewer. This Mesa loop runs live in Pyodide (S02/S03/S05); the committed canonical trace only supplies the instant first paint while the runtime warms up."}
            </figcaption>
          </figure>

          <Equation
            tex={String.raw`\text{run}(\text{seed}) \ \text{is a pure function of inputs given a fixed seed and update rule.}`}
            caption={
              es
                ? "Contrato de determinismo: dada una semilla fija (el RNG sembrado de Mesa, Model(rng=seed)) y la regla de actualización por lotes, run(seed) es función pura de las entradas — la base del visor de reproducción determinista, ya corra Mesa en vivo en el navegador o desde la traza comprometida."
                : "Determinism contract: given a fixed seed (Mesa's seeded RNG, Model(rng=seed)) and the batch update rule, run(seed) is a pure function of inputs — the basis of the deterministic-replay viewer, whether Mesa runs live in the browser or from the committed trace."
            }
          />

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Mesa 3 corre en vivo en el navegador vía Pyodide: las escenas ABM (S02 Schelling, S03 SIR, S05 Beer Game) cargan su cierre de wheels (numpy + mesa, con pandas/scipy/networkx/sqlite3 como dependencias) en el worker y se ejecutan ahí — medido, no asumido (≈3 s de arranque en frío). Mientras el runtime calienta, una traza canónica comprometida pinta el primer cuadro al instante. Lo único que se precomputa son los escenarios de solver nativo (OR-Tools: S06, S08, S11), que no tienen build de WebAssembly."
                  : "Mesa 3 runs live in the browser via Pyodide: the ABM scenes (S02 Schelling, S03 SIR, S05 Beer Game) load their wheel closure (numpy + mesa, with pandas/scipy/networkx/sqlite3 as dependencies) into the worker and execute there — measured, not assumed (~3 s cold start). While the runtime warms up, a committed canonical trace paints the first frame instantly. The only precomputed scenarios are the native-solver ones (OR-Tools: S06, S08, S11), which have no WebAssembly build.",
                es
                  ? "Los escenarios fijan el régimen de activación a actualización por lotes (Sub-pestaña 2): el step() del modelo decide todo contra el estado del inicio del paso y luego lo aplica (los agentes que cambian se reubican uno a uno en el nuevo estado). Explorar activación aleatoria o por etapas sería trivial sobre el mismo AgentSet de Mesa (shuffle_do / do por etapas), pero el laboratorio no lo alterna."
                  : "The scenarios fix the activation regime to a batch update (Sub-tab 2): the model's step() decides everything against the start-of-step state, then applies it (changed agents relocate one-by-one into the new state). Exploring random or staged activation would be trivial on the same Mesa AgentSet (shuffle_do / staged do), but the lab does not switch between them.",
                es
                  ? "Mesa escala a agentes heterogéneos, planificación compleja, espacios de red y grandes conjuntos de modelos; es interpretado, por lo que poblaciones enormes (≳1e5 agentes) pueden necesitar batching/vectorización o motores compilados (FLAME GPU 2, ABMax). Para tu propio trabajo, la misma elección que hace el laboratorio se sostiene salvo a esa escala."
                  : "Mesa scales to heterogeneous agents, complex scheduling, network spaces, and large model suites; it is interpreted, so very large populations (≳1e5 agents) may need batching/vectorization or compiled engines (FLAME GPU 2, ABMax). For your own work, the same choice the lab makes holds except at that scale.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Refs ids={["kazil2020", "masad2015", "terhoeven2025", "simpy"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
  ];

  return <SubTabs orientation="vertical" ariaLabel={es ? "Teoría de modelado basado en agentes" : "Agent-based modeling theory"} tabs={tabs} />;
}
