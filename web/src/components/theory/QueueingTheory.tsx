import { SubTabs } from "@/components/content/SubTabs";
import { Callout } from "@/components/content/Callout";
import { Equation } from "@/components/content/Equation";
import { Refs } from "@/components/content/Cite";

export function QueueingTheory({ es }: { es: boolean }) {
  const tabs = [
    {
      id: "kendall",
      label: es ? "Notación de Kendall y M/M/c" : "Kendall notation & M/M/c",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Un sistema de colas se especifica de forma compacta mediante la notación de Kendall, introducida por David G. Kendall en 1953. En su forma original de tres factores se escribe A/B/c, donde A es la distribución de los tiempos entre llegadas, B la distribución del tiempo de servicio y c el número de servidores paralelos idénticos. El símbolo M (“markoviano” / “sin memoria”) denota la distribución exponencial; D denota tiempos deterministas (constantes); G (o GI) denota una distribución general (independiente). La notación se extendió luego a la forma de seis factores A/B/c/K/N/D, añadiendo la capacidad del sistema K, el tamaño de la población llamante N y la disciplina de cola D (FCFS, LCFS, prioridad, …); cuando se omiten los tres últimos, valen por defecto K=∞, N=∞ y FCFS."
                : "A queueing system is specified compactly by Kendall's notation, introduced by David G. Kendall in 1953. In its original three-factor form a system is written A/B/c, where A is the inter-arrival-time distribution, B is the service-time distribution, and c is the number of parallel, identical servers. The symbol M (“Markovian” / “memoryless”) denotes the exponential distribution; D denotes deterministic (constant) times; G (or GI) denotes a general (independent) distribution. The notation was later extended to the six-factor form A/B/c/K/N/D adding the system capacity K, the calling-population size N, and the queue discipline D (FCFS, LCFS, priority, …); when the last three are omitted they default to K=∞, N=∞, and FCFS."}
            </p>
            <p>
              {es
                ? "La cola M/M/c (también M/M/s) es, por tanto, el modelo con llegadas de Poisson (tiempos entre llegadas exponenciales de tasa λ), tiempos de servicio exponenciales de tasa μ por servidor y c servidores idénticos que atienden una única cola FCFS compartida de capacidad ilimitada, alimentada por una población infinita. Un cliente que encuentra un servidor libre entra en servicio de inmediato; en caso contrario se une al final de la cola y espera. Como tanto el proceso de llegadas como el de cada servidor carecen de memoria, el número de clientes en el sistema N(t) es una cadena de Markov en tiempo continuo: esta es la propiedad que hace al modelo resoluble en forma cerrada y lo convierte en la referencia natural contra la cual se valida un simulador estocástico."
                : "The M/M/c queue (also written M/M/s) is therefore the model with Poisson arrivals (exponential inter-arrival times of rate λ), exponential service times of rate μ per server, and c identical servers drawing from a single shared FCFS queue of unbounded capacity, fed by an infinite calling population. A customer who finds a free server enters service immediately; otherwise it joins the tail of the queue and waits. Because both the arrival process and each server's service process are memoryless, the number of customers in the system N(t) is a continuous-time Markov chain — the property that makes the model exactly solvable in closed form and the natural reference against which a stochastic simulator is validated."}
            </p>
            <p>
              {es
                ? "La M/M/c es el modelo multiservidor de espera canónico. Con c=1 se reduce a la clásica M/M/1; cuando c→∞ tiende al modelo M/M/∞ (“servidores amplios”) en el que nadie espera. Su solución en forma cerrada — la fórmula de retardo Erlang-C — es el patrón de medida del escenario insignia de SIMLAB: el simulador de eventos discretos debe reproducir L, L_q, W, W_q y la probabilidad de espera dentro del error de Monte-Carlo."
                : "The M/M/c is the canonical multi-server delay model. With c=1 it reduces to the classic M/M/1 queue; as c→∞ it tends to the M/M/∞ (“ample-server”) model in which no customer ever waits. Its closed-form solution — the Erlang-C delay formula — is the yardstick for the SIMLAB flagship scenario: the discrete-event simulator must reproduce L, L_q, W, W_q and the delay probability to within Monte-Carlo error."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Llegadas de Poisson: los tiempos entre llegadas son i.i.d. Exp(λ); las llegadas son independientes del estado del sistema (sin balking, sin reneging, sin llegadas en lotes)."
                  : "Poisson arrivals: inter-arrival times are i.i.d. Exp(λ); arrivals are independent of system state (no balking, no reneging, no batch arrivals).",
                es
                  ? "Servicio exponencial: cada tiempo de servicio es i.i.d. Exp(μ), independiente del proceso de llegadas y de la longitud de la cola."
                  : "Exponential service: each service time is i.i.d. Exp(μ), independent of the arrival process and of the queue length.",
                es
                  ? "c servidores homogéneos que comparten una única cola FCFS; conservativos en trabajo (un servidor nunca está ocioso mientras un cliente espera)."
                  : "c homogeneous servers sharing one FCFS queue; work-conserving (a server is never idle while a customer waits).",
                es
                  ? "Sala de espera infinita (K=∞) y población llamante infinita (N=∞)."
                  : "Infinite waiting room (K=∞) and infinite calling population (N=∞).",
                es
                  ? "Se asume estado estacionario: todas las fórmulas siguientes son resultados estacionarios (de largo plazo) válidos solo cuando se cumple la condición de estabilidad (Sub-pestaña 3); nada dicen del transitorio."
                  : "Steady state assumed: all formulae below are stationary (long-run) results valid only when the stability condition (Sub-tab 3) holds; they say nothing about the transient.",
                es
                  ? "Los sistemas reales violan la falta de memoria (variabilidad del servicio ≠ exponencial), tienen buffers finitos, λ variable en el tiempo e impaciencia del cliente — capturados solo por simulación o por aproximaciones G/G/c (Sub-pestaña 8)."
                  : "Real systems violate memorylessness (service-time variability ≠ exponential), have finite buffers, time-varying λ, and customer impatience — captured only by simulation or by G/G/c approximations (Sub-tab 8).",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`\text{A/B/c/K/N/D}\qquad\Longrightarrow\qquad \text{M/M/c} \equiv \text{M/M/c}/\infty/\infty/\text{FCFS}`}
            caption={es ? "Notación de Kendall reducida a M/M/c con sus valores por defecto." : "Kendall notation reduced to M/M/c with its defaults."}
          />
          <Equation
            tex={String.raw`\lambda = \frac{1}{\mathbb{E}[\text{inter-arrival time}]},\qquad \mu = \frac{1}{\mathbb{E}[\text{service time}]}.`}
            caption={es ? "Las dos tasas primitivas: λ (llegadas) y μ (servicio por servidor)." : "The two primitive rates: λ (arrivals) and μ (service per server)."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "Fija el contrato del simulador: SimPy usa un único Resource(capacity=c) con muestreadores exponenciales de tiempos entre llegadas y de servicio. Los 12 regímenes barren (λ, μ, c) manteniendo fija la clase de modelo, de modo que cada régimen tiene un objetivo Erlang-C exacto."
                : "Sets the contract for the simulator: SimPy uses a single Resource(capacity=c) with exponential inter-arrival and service samplers. The 12 regimes sweep (λ, μ, c) holding the model class fixed, so each regime has an exact Erlang-C target."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 640 280"
              role="img"
              aria-label={es ? "Esquema M/M/c: fuente, cola FCFS, c servidores y salida." : "M/M/c schematic: source, FCFS queue, c servers and sink."}
            >
              <defs>
                <marker id="qt-arrow-mmc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="320" y="24" textAnchor="middle" fill="var(--color-fg)" fontSize="13">
                {es ? "M/M/c — llegadas Poisson(λ), c servidores cada Exp(μ), una cola compartida" : "M/M/c — Poisson(λ) arrivals, c servers each Exp(μ), one shared queue"}
              </text>
              {/* Source */}
              <circle cx="50" cy="140" r="26" fill="var(--color-accent-soft)" stroke="var(--color-fg)" strokeWidth="1.5" />
              <text x="50" y="184" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "Fuente" : "Source"}</text>
              {/* Arrival flow */}
              <path d="M76,140 L140,140" stroke="var(--color-accent)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-mmc)" />
              <text x="108" y="128" textAnchor="middle" fill="var(--color-fg)" fontSize="13" fontStyle="italic">λ</text>
              {/* Queue buffer: 5 squares */}
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={`q-${i}`} x={140 + i * 20} y={125} width="18" height="30" fill="var(--color-accent-soft)" stroke="var(--color-fg)" strokeWidth="1.5" />
              ))}
              <text x="190" y="112" textAnchor="middle" fill="var(--color-fg)" fontSize="13">{es ? "L_q en espera" : "L_q waiting"}</text>
              <text x="190" y="176" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "Cola (FCFS), capacidad ∞" : "Queue (FCFS), capacity ∞"}</text>
              {/* Routing fan */}
              <path d="M240,140 L300,87" stroke="var(--color-accent)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-mmc)" />
              <path d="M240,140 L300,140" stroke="var(--color-accent)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-mmc)" />
              <path d="M240,140 L300,193" stroke="var(--color-accent)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-mmc)" />
              {/* Servers */}
              {[
                { y: 70 },
                { y: 123 },
                { y: 176 },
              ].map((s, i) => (
                <g key={`srv-${i}`}>
                  <rect x="300" y={s.y} width="60" height="34" rx="6" fill="var(--color-magenta)" stroke="var(--color-fg)" strokeWidth="1.5" />
                  <text x="330" y={s.y + 22} textAnchor="middle" fill="var(--color-fg)" fontSize="13" fontStyle="italic">μ</text>
                </g>
              ))}
              <text x="330" y="232" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">⋮</text>
              <text x="410" y="140" textAnchor="start" fill="var(--color-fg-faint)" fontSize="11">{es ? "c servidores, tasa μ c/u" : "c servers, rate μ each"}</text>
              {/* Departure flows */}
              <path d="M360,87 L560,135" stroke="var(--color-magenta)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-mmc)" />
              <path d="M360,140 L560,140" stroke="var(--color-magenta)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-mmc)" />
              <path d="M360,193 L560,145" stroke="var(--color-magenta)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-mmc)" />
              {/* Sink */}
              <circle cx="590" cy="140" r="26" fill="var(--color-accent-soft)" stroke="var(--color-fg)" strokeWidth="1.5" />
              <text x="590" y="184" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "Salida" : "Sink"}</text>
              <text x="320" y="268" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">
                {es ? "Estable sii ρ = λ/(cμ) < 1   •   carga ofrecida a = λ/μ" : "Stable iff ρ = λ/(cμ) < 1   •   offered load a = λ/μ"}
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Esquema M/M/c: una fuente de Poisson emite a tasa λ hacia un buffer FCFS que alimenta c servidores paralelos (cada uno Exp(μ)) y luego una salida."
                : "M/M/c schematic: a Poisson source emits at rate λ into a FCFS buffer feeding c parallel servers (each Exp(μ)) and then a sink."}
            </figcaption>
          </figure>

          <Refs ids={["kendall1953", "grossharris2018", "erlang1917"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "ctmc",
      label: es ? "CTMC nacimiento–muerte" : "Birth–death CTMC",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Sea N(t) el número de clientes en el sistema (en espera más en servicio) en el instante t. Bajo los supuestos M/M/c, {N(t)} es una cadena de Markov en tiempo continuo (CTMC) sobre el espacio de estados {0,1,2,…} y, de hecho, un proceso de nacimiento–muerte: desde el estado n la cadena solo puede pasar a n+1 (una llegada, “nacimiento”) o a n−1 (un fin de servicio, “muerte”). Como la exponencial carece de memoria, el tiempo residual entre llegadas y los tiempos residuales de servicio son siempre exponenciales nuevas, de modo que la permanencia en cada estado es exponencial y la próxima transición depende solo del estado actual."
                : "Let N(t) be the number of customers in the system (waiting plus in service) at time t. Under the M/M/c assumptions {N(t)} is a continuous-time Markov chain (CTMC) on the state space {0,1,2,…}, and in fact a birth–death process: from state n the chain can only move to n+1 (an arrival, a “birth”) or to n−1 (a service completion, a “death”). Because the exponential distribution is memoryless, the residual inter-arrival time and the residual service times are always fresh exponentials, so the sojourn in each state is exponential and the next transition depends only on the current state."}
            </p>
            <p>
              {es
                ? "La tasa de nacimiento es constante: las llegadas ocurren a tasa λ_n=λ en todo estado. La tasa de muerte depende de cuántos servidores estén ocupados. Con n≤c clientes presentes hay n servidores activos, cada uno completando a tasa μ, por lo que la tasa agregada es nμ; con n≥c los c servidores están ocupados y la tasa se satura en cμ. Así μ_n=mín(n,c)μ."
                : "The birth rate is constant: arrivals occur at rate λ_n=λ in every state. The death rate depends on how many servers are busy. When n≤c customers are present, n servers are active, each completing at rate μ, so the aggregate completion rate is nμ; when n≥c all c servers are busy and the completion rate saturates at cμ. Hence μ_n=min(n,c)μ."}
            </p>
            <p>
              {es
                ? "En régimen estacionario la cadena satisface las ecuaciones de balance detallado (balance local) propias de los procesos de nacimiento–muerte: el flujo de probabilidad de n a n+1 iguala al de n+1 a n, es decir λP_n=μ_{n+1}P_{n+1}. Estas equivalen a las ecuaciones de balance global “lo que entra = lo que sale” en cada estado, pero son mucho más fáciles de resolver porque se telescopan. Resolviendo recursivamente desde P_0 se obtiene la distribución estacionaria de dos regímenes mostrada abajo, y la probabilidad de sistema vacío P_0 sale de la normalización ∑ P_n=1 (la cola geométrica converge si y solo si ρ<1)."
                : "In steady state the chain satisfies the detailed-balance (local-balance) equations characteristic of birth–death processes: the probability flux from state n to n+1 equals the flux back from n+1 to n, i.e. λP_n=μ_{n+1}P_{n+1}. These are equivalent to the global-balance equations “rate in = rate out” at every state but are far easier to solve, because they telescope. Solving recursively from P_0 gives the two-regime steady-state distribution shown below, and the empty-system probability P_0 follows from normalization ∑ P_n=1 (the geometric tail converges iff ρ<1)."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Requiere la propiedad de falta de memoria de llegadas y servicio — la única forma de que el estado conjunto colapse al conteo escalar N(t). Para servicio no exponencial el conteo por sí solo no es Markov (se necesita la variable suplementaria de servicio transcurrido, o una cadena embebida)."
                  : "Requires the memoryless property of both arrivals and service — the only way the joint state collapses to the scalar count N(t). For non-exponential service the count alone is not Markov (need the elapsed-service supplementary variable, or an embedded chain).",
                es
                  ? "El balance detallado se cumple porque el proceso es de nacimiento–muerte (transiciones solo a vecinos próximos). Las CTMC generales satisfacen el balance global pero no el detallado."
                  : "Detailed balance holds because the process is birth–death (transitions only to nearest neighbours). General CTMCs satisfy global but not detailed balance.",
                es
                  ? "La cola geométrica y por tanto P_0 existen solo si ρ<1; en otro caso no existe distribución estacionaria."
                  : "The geometric tail and hence P_0 exist only if ρ<1; otherwise no stationary distribution exists.",
                es
                  ? "FCFS frente a cualquier otra disciplina conservativa no apropiativa no cambia P_n (el proceso de conteo es independiente de la disciplina); la disciplina solo afecta a las distribuciones de tiempo de espera por cliente, no a las medias aquí usadas."
                  : "FCFS vs. any other work-conserving non-preemptive discipline does not change P_n (the count process is discipline-independent); discipline only affects per-customer waiting-time distributions, not the means used here.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`\mu_n=\min(n,c)\,\mu .`}
            caption={es ? "Tasa de muerte dependiente del estado: crece linealmente hasta saturarse en cμ." : "State-dependent death rate: grows linearly until it saturates at cμ."}
          />
          <Equation
            tex={String.raw`\lambda\,P_n=\mu_{n+1}\,P_{n+1},\qquad n=0,1,2,\dots`}
            caption={es ? "Balance detallado: flujo n→n+1 igual al flujo n+1→n." : "Detailed balance: flux n→n+1 equals flux n+1→n."}
          />
          <Equation
            tex={String.raw`P_n=
\begin{cases}
\dfrac{a^{\,n}}{n!}\,P_0, & 0\le n\le c,\\[2.2ex]
\dfrac{a^{\,n}}{c!\,c^{\,n-c}}\,P_0=\dfrac{a^{c}}{c!}\,\rho^{\,n-c}\,P_0, & n\ge c,
\end{cases}
\qquad a=\frac{\lambda}{\mu},\ \ \rho=\frac{a}{c}=\frac{\lambda}{c\mu}.`}
            caption={es ? "Distribución estacionaria de dos regímenes obtenida por recursión desde P_0." : "Two-regime steady-state distribution obtained by recursion from P_0."}
          />
          <Equation
            tex={String.raw`P_0=\left[\sum_{n=0}^{c-1}\frac{a^{\,n}}{n!}+\frac{a^{c}}{c!}\,\frac{1}{1-\rho}\right]^{-1}.`}
            caption={es ? "Probabilidad de sistema vacío por normalización (cola geométrica converge sii ρ<1)." : "Empty-system probability by normalization (geometric tail converges iff ρ<1)."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "Esta CTMC es lo que el DES muestrea por Monte-Carlo: SimPy realiza exactamente estas transiciones evento a evento. Validación = el histograma empírico de ocupación de estados de la simulación converge a P_n, y el conteo medio temporal converge a L=∑ nP_n."
                : "This CTMC is what the DES samples by Monte-Carlo: SimPy realizes exactly these transitions event-by-event. Validation = the empirical state-occupancy histogram from the simulation converges to P_n, and the time-average count converges to L=∑ nP_n."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 760 240"
              role="img"
              aria-label={es ? "Cadena CTMC de nacimiento–muerte con nacimiento λ y muerte min(n,c)μ." : "Birth–death CTMC chain with birth λ and death min(n,c)μ."}
            >
              <defs>
                <marker id="qt-arrow-ctmc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="380" y="20" textAnchor="middle" fill="var(--color-fg)" fontSize="13">
                {es ? "CTMC de nacimiento–muerte para N(t): nacimiento λ, muerte mín(n,c)μ" : "Birth–death CTMC for N(t): birth λ, death min(n,c)μ"}
              </text>
              {/* States */}
              {[
                { x: 60, l: "0" },
                { x: 160, l: "1" },
                { x: 260, l: "2" },
                { x: 460, l: "c−1" },
                { x: 560, l: "c" },
                { x: 660, l: "c+1" },
              ].map((s, i) => (
                <g key={`st-${i}`}>
                  <circle cx={s.x} cy="120" r="24" fill="var(--color-accent-soft)" stroke="var(--color-fg)" strokeWidth="1.5" />
                  <text x={s.x} y="125" textAnchor="middle" fill="var(--color-fg)" fontSize="13">{s.l}</text>
                </g>
              ))}
              {/* ellipsis gap between state 2 (260) and c-1 (460) */}
              <text x="360" y="125" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="13">···</text>
              <text x="710" y="125" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="13">···</text>
              {/* Birth arcs (above), labeled λ */}
              {[
                { a: 84, b: 136 },
                { a: 184, b: 236 },
                { a: 484, b: 536 },
                { a: 584, b: 636 },
              ].map((e, i) => (
                <g key={`birth-${i}`}>
                  <path d={`M${e.a},108 Q${(e.a + e.b) / 2},78 ${e.b},108`} stroke="var(--color-accent)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-ctmc)" />
                  <text x={(e.a + e.b) / 2} y="74" textAnchor="middle" fill="var(--color-fg)" fontSize="12">λ</text>
                </g>
              ))}
              {/* Death arcs (below), reversed direction, state-dependent rate */}
              {[
                { a: 136, b: 84, l: "μ" },
                { a: 236, b: 184, l: "2μ" },
                { a: 536, b: 484, l: "cμ" },
                { a: 636, b: 584, l: "cμ" },
              ].map((e, i) => (
                <g key={`death-${i}`}>
                  <path d={`M${e.a},132 Q${(e.a + e.b) / 2},162 ${e.b},132`} stroke="var(--color-magenta)" strokeWidth="2" fill="none" markerEnd="url(#qt-arrow-ctmc)" />
                  <text x={(e.a + e.b) / 2} y="180" textAnchor="middle" fill={i >= 2 ? "var(--color-warn)" : "var(--color-fg)"} fontSize="12">{e.l}</text>
                </g>
              ))}
              {/* Saturation marker between c-1 (460) and c (560) */}
              <line x1="510" y1="40" x2="510" y2="200" stroke="var(--color-warn)" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x="510" y="216" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">
                {es ? "la tasa de muerte se satura en cμ para n ≥ c" : "death rate saturates at cμ for n ≥ c"}
              </text>
              <text x="380" y="232" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">λ Pₙ = μₙ₊₁ Pₙ₊₁</text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Cadena lineal de nacimiento–muerte con tasa de subida constante λ y tasa de bajada dependiente del estado mín(n,c)μ, resaltando la saturación en n=c."
                : "Linear birth–death chain with constant up-rate λ and state-dependent down-rate min(n,c)μ, highlighting the saturation at n=c."}
            </figcaption>
          </figure>

          <Refs ids={["grossharris2018", "kendall1953"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "stability",
      label: es ? "Estabilidad y carga" : "Stability & load",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Dos cantidades adimensionales lo organizan todo. La carga ofrecida (en Erlangs) es a=λ/μ: el número medio de llegadas durante un tiempo medio de servicio o, equivalentemente, el número medio de servidores que un único flujo de trabajo mantendría ocupados. La utilización del servidor (intensidad de tráfico por servidor) es ρ=a/c=λ/(cμ): la fracción de tiempo a largo plazo que un servidor dado está ocupado y la probabilidad de que un servidor elegido al azar esté ocupado."
                : "Two dimensionless quantities organize everything. The offered load (in Erlangs) is a=λ/μ, the mean number of arrivals during one mean service time — equivalently, the mean number of servers a single stream of work would keep busy. The server utilization (traffic intensity per server) is ρ=a/c=λ/(cμ), the long-run fraction of time a given server is busy and the probability a randomly chosen server is busy."}
            </p>
            <p>
              {es
                ? "El sistema es estable — tiene una distribución estacionaria propia y una cola que no diverge — si y solo si ρ<1, es decir λ<cμ. La intuición es un balance de flujo: la capacidad máxima de servicio es cμ trabajos por unidad de tiempo; si las llegadas λ la superan, el trabajo se acumula sin límite y N(t)→∞ casi seguramente. Exactamente en ρ=1 la cadena es recurrente nula: regresa a todo estado pero la longitud esperada de cola diverge, por lo que no existe estado estacionario finito. Para ρ>1 la cadena es transitoria. Los Erlangs son adimensionales (tasa ÷ tasa) y aditivos entre flujos independientes; por eso los ingenieros de tráfico telefónico dimensionan grupos de troncales en Erlangs: a indica el trabajo, c la capacidad y ρ la presión."
                : "The system is stable — possesses a proper stationary distribution and a non-divergent queue — iff ρ<1, i.e. λ<cμ. The intuition is a flow balance: the maximum service capacity is cμ jobs per unit time; if arrivals λ exceed it, work accumulates without bound and N(t)→∞ almost surely. At exactly ρ=1 the chain is null-recurrent: it returns to every state but the expected queue length diverges, so no finite steady state exists. For ρ>1 the chain is transient. Erlangs are dimensionless (rate ÷ rate) and additive across independent traffic streams, which is why telephone-traffic engineers size trunk groups in Erlangs: a tells you the work, c the capacity, and ρ the pressure."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "La estabilidad ρ<1 es necesaria y suficiente para M/M/c (y para cualquier G/G/c conservativa con estas tasas medias). Es una afirmación sobre medias; no acota la varianza de la cola."
                  : "Stability ρ<1 is necessary and sufficient for M/M/c (and for any work-conserving G/G/c with these mean rates). It is a statement about means; it does not bound variance of the queue.",
                es
                  ? "ρ es la utilización por servidor; la utilización del sistema (probabilidad de que todos los servidores estén ocupados) es la Erlang-C C(c,a) de la Sub-pestaña 4 — no las confundas."
                  : "ρ is the per-server utilization; the system utilization (probability all servers busy) is the Erlang-C C(c,a) of Sub-tab 4 — do not conflate them.",
                es
                  ? "La a de Erlang ignora la discretitud de los servidores: a puede superar a c (entonces ρ>1, inestable) o ser no entera."
                  : "Erlang's a ignores the discreteness of servers: a can exceed c (then ρ>1, unstable) or be a non-integer.",
                es
                  ? "Son afirmaciones de equilibrio; un sistema arrancado vacío necesita un calentamiento antes de que las estimaciones de la simulación coincidan — se maneja descartando un prefijo transitorio."
                  : "These are equilibrium statements; a system launched empty needs a warm-up before the simulation estimates match — handled by discarding a transient prefix.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`a=\frac{\lambda}{\mu}\ \text{[Erlang]},\qquad \rho=\frac{\lambda}{c\mu}\in[0,1),\qquad \text{stable}\iff\rho<1 .`}
            caption={es ? "Carga ofrecida, utilización por servidor y condición de estabilidad." : "Offered load, per-server utilization and stability condition."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "ρ es el eje x del laboratorio. Los 12 regímenes se eligen para trepar el eje ρ hacia la rodilla en ρ→1; la lógica de calentamiento/descarte del estimador se justifica aquí."
                : "ρ is the x-axis of the lab. The 12 regimes are chosen to crawl up the ρ axis toward the knee at ρ→1; the warm-up/discard logic in the estimator is justified here."}
            </p>
          </Callout>

          <Callout variant="note" title={es ? "Figura" : "Figure"}>
            <p>
              {es
                ? "Reutiliza la curva de la rodilla fig-knee de la Sub-pestaña 7 (comparte el eje ρ)."
                : "Reuses the knee curve fig-knee of Sub-tab 7 (shares the ρ axis)."}
            </p>
          </Callout>

          <Refs ids={["erlang1917", "grossharris2018"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "erlangc",
      label: es ? "Erlang-C y métricas" : "Erlang-C & metrics",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "La cantidad más importante es la probabilidad de que un cliente que llega deba esperar (todos los servidores ocupados a su llegada). Sumando la distribución estacionaria sobre los estados congestionados n≥c y usando la cola geométrica se obtiene la fórmula Erlang-C (la “fórmula de retardo” de Erlang, 1917), mostrada abajo. Por PASTA (Sub-pestaña 6) esta probabilidad estacionaria en el tiempo coincide con la probabilidad de que un cliente que llega vea todos los servidores ocupados, de modo que C(c,a) es realmente la fracción de clientes demorados."
                : "The single most important quantity is the probability that an arriving customer must wait (all servers busy on arrival). Summing the stationary distribution over the congested states n≥c and using the geometric tail gives the Erlang-C formula (Erlang's “delay formula”, 1917), shown below. By PASTA (Sub-tab 6) this time-stationary probability equals the probability an arriving customer sees all servers busy, so C(c,a) is genuinely the fraction of customers delayed."}
            </p>
            <p>
              {es
                ? "Todo lo demás se deduce. El tiempo medio de espera en cola es la probabilidad de retardo por la espera media condicionada a que haya retardo; un cliente demorado espera a que se libere el próximo de c servidores ocupados, y como el atasco delante también se vacía a tasa cμ, la espera condicionada es exponencial de media 1/(cμ−λ), dando W_q=C(c,a)/[cμ(1−ρ)]. El número medio en cola es, por la ley de Little aplicada solo a la cola, L_q=λW_q. Sumando el servicio se obtienen las métricas del sistema: W=W_q+1/μ y L=L_q+a=λW, donde a=λ/μ es exactamente el número medio de servidores ocupados (clientes en servicio)."
                : "Everything else follows. The expected waiting time in queue is the delay probability times the mean wait given a delay; a delayed customer waits for the next of c busy servers to free up — an Exp(cμ) event, but the backlog ahead also clears at rate cμ, giving an exponential conditional wait of mean 1/(cμ−λ), so W_q=C(c,a)/[cμ(1−ρ)]. The expected number waiting in queue is, by Little's Law applied to the queue alone, L_q=λW_q. Adding the service time gives the system metrics: W=W_q+1/μ and L=L_q+a=λW, where a=λ/μ is exactly the mean number of busy servers (mean customers in service), so L=L_q+a is “in queue + in service”."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Exacto solo para M/M/c en estado estacionario con ρ<1. Para servicio no exponencial usa Erlang-C como aproximación o las formas G/G/c de la Sub-pestaña 8."
                  : "Exact only for M/M/c in steady state with ρ<1. For non-exponential service use Erlang-C as an approximation or the G/G/c forms of Sub-tab 8.",
                es
                  ? "C(c,a) es numéricamente delicada: aᶜ/c! desborda para c grande. Calcúlala con la recursión estable del bloqueo Erlang-B B(c,a) y conviértela."
                  : "C(c,a) is numerically delicate: aᶜ/c! overflows for large c. Compute via the stable recursion for the Erlang-B blocking B(c,a) and convert.",
                es
                  ? "Erlang-C (retardo, sala de espera infinita) es distinta de Erlang-B (pérdida, sala de espera cero, M/M/c/c). No las intercambies."
                  : "Erlang-C (delay, infinite waiting room) is distinct from Erlang-B (loss, zero waiting room, M/M/c/c). Do not interchange.",
                es
                  ? "Que la espera condicionada sea exponencial de media 1/(cμ−λ) depende de la falta de memoria de los c servicios en curso."
                  : "The conditional wait being exponential of mean 1/(cμ−λ) relies on memorylessness of all c ongoing services.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`C(c,a)\;=\;\mathbb{P}(\text{wait}>0)\;=\;\frac{\dfrac{a^{c}}{c!}\,\dfrac{1}{1-\rho}}{\displaystyle\sum_{n=0}^{c-1}\frac{a^{\,n}}{n!}+\frac{a^{c}}{c!}\,\frac{1}{1-\rho}}\;=\;\frac{a^{c}}{c!}\,\frac{1}{1-\rho}\,P_0 .`}
            caption={es ? "Fórmula de retardo Erlang-C: probabilidad de que un cliente que llega deba esperar." : "Erlang-C delay formula: probability an arriving customer must wait."}
          />
          <Equation
            tex={String.raw`W_q=\frac{C(c,a)}{c\mu-\lambda}=\frac{C(c,a)}{c\mu(1-\rho)} .`}
            caption={es ? "Tiempo medio de espera en cola." : "Expected waiting time in queue."}
          />
          <Equation
            tex={String.raw`L_q=\lambda\,W_q=\frac{\rho}{1-\rho}\,C(c,a)=\frac{a^{c+1}}{c\,c!\,(1-\rho)^2}\,P_0 .`}
            caption={es ? "Número medio en cola, por la ley de Little aplicada a la cola." : "Expected number waiting in queue, by Little's Law applied to the queue."}
          />
          <Equation
            tex={String.raw`W=W_q+\frac{1}{\mu},\qquad L=L_q+a=\lambda W .`}
            caption={es ? "Métricas del sistema: en cola + en servicio." : "System metrics: in queue + in service."}
          />
          <Equation
            tex={String.raw`B(0,a)=1,\quad B(j,a)=\frac{a\,B(j-1,a)}{j+a\,B(j-1,a)},\qquad C(c,a)=\frac{c\,B(c,a)}{c-a\,[\,1-B(c,a)\,]} .`}
            caption={es ? "Recursión estable Erlang-B y conversión a Erlang-C (evita el desborde de aᶜ/c!)." : "Stable Erlang-B recursion and conversion to Erlang-C (avoids aᶜ/c! overflow)."}
          />

          <Callout variant="strong" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "Estos cinco números son el oráculo de validación. Para cada uno de los 12 regímenes la app imprime los analíticos {C, W_q, L_q, W, L} junto a las estimaciones simuladas con intervalos de confianza; el acuerdo (dentro del IC) es el criterio de aprobación mostrado al usuario."
                : "These five numbers are the validation oracle. For each of the 12 regimes the app prints the analytic {C, W_q, L_q, W, L} next to the simulated estimates with confidence intervals; agreement (within CI) is the pass criterion shown to the user."}
            </p>
          </Callout>

          <Refs ids={["erlang1917", "erlang1909", "grossharris2018"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "little",
      label: es ? "Ley de Little (L=λW)" : "Little's Law (L=λW)",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "La ley de Little afirma que, para cualquier sistema estable en estado estacionario, el número medio temporal de elementos en el sistema es igual a la tasa media de llegadas por el tiempo medio que un elemento pasa en el sistema: L=λW. John D. C. Little la demostró rigurosamente en 1961 bajo hipótesis notablemente débiles: no requiere supuesto alguno sobre la distribución de llegadas, la de servicio, el número de servidores ni la disciplina de cola — solo que existan los tres promedios a largo plazo y que el sistema esté en régimen estacionario con tasa de entrada igual a la de salida. La intuición es un argumento de conservación/área: al integrar el conteo N(t) sobre un horizonte largo, esa área iguala la suma de todos los tiempos individuales de permanencia; dividiendo ambas vistas por el horizonte resulta L=λW (y análogamente L_q=λW_q para el subsistema cola)."
                : "Little's Law states that, for any stable system in steady state, the time-average number of items in the system equals the average arrival rate times the average time an item spends in the system: L=λW. John D. C. Little proved it rigorously in 1961 under remarkably weak hypotheses: it requires no assumption about the arrival distribution, the service distribution, the number of servers, or the queue discipline — only that the three long-run averages exist and the system is in a stationary regime where the rate in equals the rate out. The intuition is a conservation/area argument: integrate the count N(t) over a long horizon; that area equals the sum of all individual sojourn times; dividing both views by the horizon gives L=λW (and equivalently L_q=λW_q for the queue subsystem, since the law applies to any well-defined sub-region with a consistent boundary)."}
            </p>
            <p>
              {es
                ? "Su utilidad aquí es doble. Primero, permite obtener las métricas de “número” a partir de las de “tiempo” (y viceversa) sin re-resolver la cadena — L_q=λW_q, L=λW. Segundo, es una verificación cruzada del simulador independiente de la distribución: cualesquiera sean los valores que la simulación mida por separado para L, λ y W, la identidad L=λW debe cumplirse dentro del error de Monte-Carlo, sin importar los detalles del modelo — una prueba de cordura que detecta errores del estimador que la comparación con Erlang-C podría pasar por alto."
                : "Its power in this lab is twofold. First, it lets us derive the “number” metrics from the “time” metrics (and vice-versa) without re-solving the chain — L_q=λW_q, L=λW. Second, it is a distribution-free cross-check on the simulator: whatever the simulation measures for L, λ and W separately, the identity L=λW must hold to within Monte-Carlo error regardless of model details — a sanity test that catches estimator bugs the Erlang-C comparison might miss."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Necesita un régimen estacionario (o al menos asintóticamente estacionario, tasa-entrada = tasa-salida); no se cumple durante el transitorio/sobrecarga."
                  : "Needs a stationary (or at least asymptotically stationary, rate-in = rate-out) regime; does not hold during transient/overload.",
                es
                  ? "Los tres promedios (L, λ, W) deben ser finitos — falla cuando ρ→1 donde L, W→∞."
                  : "The three averages (L, λ, W) must be finite — fails as ρ→1 where L, W→∞.",
                es
                  ? "Es una identidad entre medias de largo plazo, no una afirmación sobre distribuciones ni sobre cualquier instantánea de tiempo finito."
                  : "It is an identity among long-run means, not a statement about distributions or about any finite-time snapshot.",
                es
                  ? "El “sistema” debe tener una frontera consistente: aplícala al sistema completo (L=λW) o al subsistema solo-cola (L_q=λW_q), no a una frontera mixta."
                  : "“System” must have a consistent boundary: apply it to the whole system (L=λW) or to the queue-only subsystem (L_q=λW_q), not a mixed boundary.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`L=\lambda W,\qquad L_q=\lambda W_q .`}
            caption={es ? "Ley de Little para el sistema completo y para el subsistema cola." : "Little's Law for the whole system and for the queue subsystem."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "A la vez un atajo de derivación (enlaza los pares de métricas tiempo/número de la Sub-pestaña 4) y una auditoría del estimador independiente del modelo, ejecutada en cada réplica de la simulación. No tiene figura dedicada; se anota como la flecha-puente entre los paneles de métricas de tiempo y de número en la UI de lectura de métricas."
                : "Both a derivation shortcut (links the time/number metric pairs of Sub-tab 4) and a model-agnostic estimator audit run on every simulation replication. No dedicated figure; annotated as the bridge arrow between the time-metrics and number-metrics panels in the metrics readout UI."}
            </p>
          </Callout>

          <Refs ids={["little1961", "grossharris2018"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "pasta",
      label: "PASTA",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "PASTA (“las llegadas de Poisson ven promedios temporales”) es el principio de que, cuando las llegadas forman un proceso de Poisson, la fracción a largo plazo de clientes que llegan y encuentran el sistema en un estado dado coincide con la fracción a largo plazo de tiempo que el sistema pasa en ese estado. Formalmente, para cualquier conjunto de estados B, el promedio temporal del indicador iguala al promedio sobre los instantes inmediatamente anteriores a cada llegada A_k⁻ (ecuación abajo). La razón profunda es la propiedad de no anticipación del proceso de Poisson: como los tiempos entre llegadas carecen de memoria, un instante de llegada es “típico” — no aporta información sobre el estado actual, así que las llegadas muestrean el estado igual que lo haría un observador uniforme en el tiempo. (Para llegadas no Poisson esto falla: por ejemplo, con llegadas deterministas un cliente puede llegar sistemáticamente justo cuando el anterior acaba de salir.)"
                : "PASTA (“Poisson Arrivals See Time Averages”) is the principle that, when arrivals form a Poisson process, the long-run fraction of arriving customers that find the system in a given state equals the long-run fraction of time the system spends in that state. Formally, for any state set B, the time-average of the indicator equals the average over the instants just before each arrival A_k⁻ (equation below), where A_k⁻ is the instant just before the k-th arrival. The deep reason is the lack-of-anticipation property of the Poisson process: because inter-arrival times are memoryless, an arrival epoch is “typical” — it carries no information about the current state, so arrivals sample the state exactly as a uniform-in-time observer would. (For non-Poisson arrivals this fails: e.g. with deterministic arrivals a customer may systematically arrive when the previous one just left.)"}
            </p>
            <p>
              {es
                ? "PASTA es el puente que hace operacionalmente significativa la distribución estacionaria P_n. La Erlang-C C(c,a)=∑_{n≥c}P_n es un promedio temporal; PASTA la asciende a la probabilidad de retardo experimentada por el cliente — lo que de verdad importa al usuario (“¿qué fracción de clientes espera?”). Sin PASTA, el promedio temporal P_n de las ecuaciones de balance y el promedio sobre clientes a la llegada diferirían en general."
                : "PASTA is the bridge that makes the time-stationary distribution P_n operationally meaningful. The Erlang-C C(c,a)=∑_{n≥c}P_n is a time average; PASTA promotes it to the customer-experienced delay probability — the quantity a user actually cares about (“what fraction of customers wait?”). Without PASTA, the time-average P_n computed from the balance equations and the customer-average seen on arrival would generally differ."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Requiere que el proceso de llegadas sea Poisson (la condición de no anticipación / LAA). Las llegadas de renovación pero no Poisson NO ven promedios temporales — necesitan la distribución promedio sobre clientes (p. ej. vía la cadena embebida GI/M/c)."
                  : "Requires the arrival process to be Poisson (the lack-of-anticipation / LAA condition). Renewal-but-non-Poisson arrivals do not see time averages — they need the customer-average distribution (e.g. via the GI/M/c embedded chain).",
                es
                  ? "PASTA iguala promedios/proporciones, no el comportamiento trayectoria a trayectoria."
                  : "PASTA equates averages/proportions, not pathwise behaviour.",
                es
                  ? "Justifica estimar C(c,a) en el simulador o bien promediando en el tiempo el indicador de todos-ocupados, o bien contando llegadas demoradas — ambos convergen al mismo valor; esta equivalencia es en sí una verificación cruzada interna útil."
                  : "It justifies estimating C(c,a) in the simulator either by time-averaging the all-busy indicator or by counting delayed arrivals — both converge to the same value; this equivalence is itself a useful internal cross-check.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`\lim_{t\to\infty}\frac{1}{t}\int_0^t \mathbf{1}\{N(s)\in\mathcal{B}\}\,ds
\;=\;
\lim_{n\to\infty}\frac{1}{n}\sum_{k=1}^{n}\mathbf{1}\{N(A_k^-)\in\mathcal{B}\},`}
            caption={es ? "El promedio temporal del indicador iguala el promedio sobre los instantes previos a cada llegada." : "The time-average of the indicator equals the average over the instants just before each arrival."}
          />
          <Equation
            tex={String.raw`\mathbb{P}_{\text{arrival}}(N\in\mathcal{B})=\mathbb{P}_{\text{time}}(N\in\mathcal{B})\quad\text{(Poisson arrivals).}`}
            caption={es ? "Promedio visto por las llegadas = promedio temporal, bajo llegadas de Poisson." : "Arrival-seen average = time average, under Poisson arrivals."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "Autoriza dos estimadores independientes de la probabilidad de retardo en el DES y garantiza que apuntan al mismo C(c,a) — una verificación de consistencia incorporada, distinta de la auditoría por la ley de Little."
                : "Licenses two independent estimators of the delay probability in the DES and guarantees they target the same C(c,a) — a built-in consistency check distinct from the Little's-Law audit."}
            </p>
          </Callout>

          <Refs ids={["wolff1982", "grossharris2018"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "knee",
      label: es ? "Rodilla ρ→1 y Kingman" : "ρ→1 knee & Kingman",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "A medida que la utilización sube hacia uno, el tiempo de espera no crece de forma lineal: estalla. En M/M/c las métricas de cola llevan el factor 1/(1−ρ), de modo que W_q∝1/(1−ρ)→∞ cuando ρ→1. Esta es la “rodilla” (knee): W_q es moderado y varía poco hasta ρ≈0,7–0,8, y luego se dobla bruscamente hacia arriba y diverge en ρ=1. Operativamente, es la razón por la que fijar objetivos de utilización muy altos es peligroso: llevar un servidor del 90% al 95% de utilización aproximadamente duplica la espera. La divergencia es intrínseca a la congestión bajo aleatoriedad, no propia del supuesto exponencial."
                : "As utilization rises toward one, waiting time does not grow linearly — it explodes. For M/M/c the queue metrics carry the factor 1/(1−ρ), so W_q∝1/(1−ρ)→∞ as ρ→1. This is the “knee”: W_q is modest and slowly varying up to ρ≈0.7–0.8, then bends sharply upward and diverges at ρ=1. Operationally it is the reason high-utilization targets are dangerous: pushing a server from 90% to 95% utilization roughly doubles the wait. The divergence is intrinsic to congestion under randomness, not specific to exponential assumptions."}
            </p>
            <p>
              {es
                ? "La forma general es la aproximación de tráfico pesado de Kingman (fórmula “VUT”), demostrada por J. F. C. Kingman en 1961 para la cola G/G/1 (distribuciones generales de llegada y servicio, un servidor). Con C_a² y C_s² los coeficientes de variación al cuadrado de los tiempos entre llegadas y de servicio, cuando ρ→1 se cumple la fórmula mostrada abajo, que se lee como Utilización × Variabilidad × Tiempo. Revela que la congestión la impulsa la variabilidad, no solo la carga: un sistema perfectamente determinista D/D/1 (C_a²=C_s²=0) nunca hace cola, mientras que el tráfico en ráfagas (C²>1) hace cola mucho peor que el de Poisson. Para M/M/1 ambos CV valen 1, así que (C_a²+C_s²)/2=1 y Kingman recupera el exacto W_q=ρ/[μ(1−ρ)] en el límite de tráfico pesado. Aunque la ley de Kingman es de un servidor, la misma rodilla 1/(1−ρ) y el escalado por variabilidad rigen el caso multiservidor G/G/c mediante aproximaciones tipo Kingman y Allen–Cunneen; por eso la lección de M/M/c se generaliza mucho más allá del modelo exponencial."
                : "The general form is Kingman's heavy-traffic approximation (the “VUT” formula), proved by J. F. C. Kingman in 1961 for the G/G/1 queue (general inter-arrival and service distributions, single server). Let C_a²=Var(inter-arrival)/E[·]² and C_s²=Var(service)/E[·]² be the squared coefficients of variation. Then, as ρ→1, the formula below holds. Read left to right this is Utilization × Variability × Time: the ρ/(1−ρ) utilization factor (the knee), the average of the two squared CVs (variability), and the service-time scale. It exposes that congestion is driven by variability, not just load: a perfectly deterministic D/D/1 system (C_a²=C_s²=0) never queues, while bursty traffic (C²>1) queues far worse than Poisson. For M/M/1 both CVs equal 1, so (C_a²+C_s²)/2=1 and Kingman recovers the exact W_q=ρ/[μ(1−ρ)] in the heavy-traffic limit — the formula's consistency check. Although Kingman's law is a single-server result, the same 1/(1−ρ) knee and variability scaling govern the multi-server G/G/c case via Kingman-type and Allen–Cunneen approximations, which is why the M/M/c lesson generalizes well beyond the exponential model."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "La fórmula de Kingman es una aproximación asintótica (ρ→1); es menos exacta a ρ bajo/moderado, donde puede sobreestimar W_q."
                  : "Kingman's formula is an asymptotic (ρ→1) approximation; it is least accurate at low/moderate ρ where it can overestimate W_q.",
                es
                  ? "Demostrada para G/G/1; el uso multiservidor (c>1) descansa en extensiones tipo Kingman / Allen–Cunneen, que son aproximaciones, no teoremas."
                  : "Proved for G/G/1; multi-server use (c>1) relies on Kingman-type / Allen–Cunneen extensions, which are approximations, not theorems.",
                es
                  ? "Necesita que los dos primeros momentos (media + varianza) de ambas distribuciones sean finitos; el servicio de cola pesada (C_s²=∞) la rompe."
                  : "Needs the first two moments (mean + variance) of both distributions to be finite; heavy-tailed service (C_s²=∞) breaks it.",
                es
                  ? "El W_q exacto de M/M/c (Sub-pestaña 4) debe preferirse siempre que el modelo sea genuinamente markoviano; Kingman es el puente hacia la realidad no exponencial."
                  : "The exact M/M/c W_q (Sub-tab 4) should be preferred whenever the model is genuinely Markovian; Kingman is the bridge to non-exponential reality.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`W_q\propto\frac{1}{1-\rho}\;\xrightarrow[\rho\to1]{}\;\infty .`}
            caption={es ? "La espera lleva el factor 1/(1−ρ) y diverge en ρ=1." : "The wait carries the 1/(1−ρ) factor and diverges at ρ=1."}
          />
          <Equation
            tex={String.raw`W_q\;\approx\;\left(\frac{\rho}{1-\rho}\right)\!\left(\frac{C_a^2+C_s^2}{2}\right)\frac{1}{\mu}.`}
            caption={es ? "Aproximación de Kingman (VUT): Utilización × Variabilidad × Tiempo." : "Kingman's approximation (VUT): Utilization × Variability × Time."}
          />
          <Equation
            tex={String.raw`W_q^{\text{M/M/c}}=\frac{C(c,a)}{c\mu(1-\rho)},\qquad W_q^{\text{G/G/1}}\approx\frac{\rho}{1-\rho}\cdot\frac{C_a^2+C_s^2}{2}\cdot\frac{1}{\mu}.`}
            caption={es ? "M/M/c exacto frente a la aproximación G/G/1 de Kingman." : "Exact M/M/c versus Kingman's G/G/1 approximation."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "Explica la forma que traza el barrido de 12 regímenes y advierte por qué los regímenes superiores (ρ=0,9, 0,95, 0,99) necesitan corridas largas y gran calentamiento: la varianza del estimador también estalla como 1/(1−ρ)."
                : "Explains the shape the 12-regime sweep traces and warns why the top regimes (ρ=0.9, 0.95, 0.99) need long runs and large warm-up: the variance of the estimator also blows up like 1/(1−ρ)."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 520 360"
              role="img"
              aria-label={es ? "Curva de la rodilla: W_q frente a ρ divergiendo en ρ=1." : "Knee curve: W_q versus ρ diverging at ρ=1."}
            >
              <defs>
                <marker id="qt-arrow-knee" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--color-fg)" />
                </marker>
              </defs>
              <text x="260" y="22" textAnchor="middle" fill="var(--color-fg)" fontSize="13">
                {es ? "Tráfico pesado: W_q ∝ 1/(1−ρ) (Kingman)" : "Heavy traffic: W_q ∝ 1/(1−ρ) (Kingman)"}
              </text>
              {/* Knee shading */}
              <rect x="388" y="30" width="82" height="270" fill="var(--color-accent-soft)" opacity="0.5" />
              <text x="429" y="318" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "la rodilla" : "the knee"}</text>
              {/* Gridlines at x ticks */}
              {[60, 162, 265, 367, 429, 470].map((gx, i) => (
                <line key={`grid-${i}`} x1={gx} y1="300" x2={gx} y2="30" stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3 3" />
              ))}
              {/* Axes */}
              <line x1="60" y1="300" x2="470" y2="300" stroke="var(--color-fg)" strokeWidth="1.5" markerEnd="url(#qt-arrow-knee)" />
              <line x1="60" y1="300" x2="60" y2="30" stroke="var(--color-fg)" strokeWidth="1.5" markerEnd="url(#qt-arrow-knee)" />
              {/* x tick labels */}
              {[
                { x: 60, l: "0" },
                { x: 162, l: "0.25" },
                { x: 265, l: "0.5" },
                { x: 367, l: "0.75" },
                { x: 429, l: "0.9" },
              ].map((t, i) => (
                <text key={`xt-${i}`} x={t.x} y="315" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{t.l}</text>
              ))}
              <text x="470" y="315" textAnchor="middle" fill="var(--color-warn)" fontSize="11">1.0</text>
              <text x="24" y="165" textAnchor="middle" fill="var(--color-fg)" fontSize="13" transform="rotate(-90 24 165)">W_q</text>
              <text x="265" y="340" textAnchor="middle" fill="var(--color-fg)" fontSize="12">ρ = λ/(cμ)</text>
              {/* Curve */}
              <path
                d="M60,277 L162,270 L265,254 Q310,240 347,223 Q372,205 388,185 Q412,140 429,70 L449,30"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Asymptote at rho=1 */}
              <line x1="470" y1="300" x2="470" y2="30" stroke="var(--color-warn)" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x="430" y="46" textAnchor="middle" fill="var(--color-warn)" fontSize="12">ρ → 1: W_q → ∞</text>
              {/* Annotation callout near rho=0.9 */}
              <circle cx="429" cy="70" r="3" fill="var(--color-accent)" />
              <text x="360" y="100" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">
                {es ? "90%→95% util ≈ 2× espera" : "90%→95% util ≈ 2× wait"}
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "El palo de hockey W_q(ρ)∝1/(1−ρ) con asíntota vertical en ρ=1 y la región de la rodilla sombreada."
                : "The hockey-stick W_q(ρ)∝1/(1−ρ) with a vertical asymptote at ρ=1 and the knee region shaded."}
            </figcaption>
          </figure>

          <Refs ids={["kingman1961", "pollaczek1930", "grossharris2018"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "pooling",
      label: es ? "Pooling y economías de escala" : "Pooling & economies of scale",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Un resultado central y contraintuitivo: a utilización fija ρ, aumentar el número de servidores c (escalando λ para mantener ρ constante) reduce drásticamente el tiempo de espera W_q. Equivalentemente, agrupar (“pooling”) m estaciones M/M/1 separadas (cada una con carga ρ) en una sola M/M/m con cola compartida es muchísimo mejor que operarlas aisladas, aunque la utilización agregada sea idéntica. Esta es la economía de escala del pooling — el núcleo cuantitativo de por qué una sola fila compartida en un banco supera a una fila por cajero, y por qué consolidar agentes de un call-center en un único grupo de habilidades recorta la espera."
                : "A central, counterintuitive result: at a fixed utilization ρ, increasing the number of servers c (and scaling λ to hold ρ constant) sharply reduces the waiting time W_q. Equivalently, pooling m separate M/M/1 stations (each load ρ) into one M/M/m station with a shared queue is dramatically better than running them in isolation, even though aggregate utilization is identical. This is the economy of scale of pooling — the quantitative core of why one shared line at a bank beats one line per teller, and why consolidating call-center agents into a single skill group cuts wait."}
            </p>
            <p>
              {es
                ? "El mecanismo: con c servidores hay más formas de que un servidor libre absorba una llegada antes de que se forme cola, así que la probabilidad de todos ocupados C(c,a) cae con fuerza al crecer c a ρ fijo; y la espera condicionada se encoge porque el atasco se vacía a la tasa agrupada cμ en vez de μ. Ambos efectos se componen en W_q=C(c,a)/[cμ(1−ρ)]. Numéricamente, a ρ=0,8: una M/M/1 (c=1) tiene C(1,a)=ρ=0,8 y un W_q grande; duplicar a c=2 (con λ duplicada) recorta W_q a poco menos de la mitad (1,78 vs 4,0); en c=5 a cerca de un séptimo (0,55); en c=10 a una vigésima parte (0,20). El beneficio marginal decrece (regla de personal raíz-cuadrada c≈a+β√a, que mantiene la probabilidad de retardo casi constante), pero la dirección es monótona: a igual presión ρ, los grupos mayores esperan menos. La salvedad clave es ρ fijo: el pooling ayuda porque aumenta la granularidad de la capacidad efectiva, no porque cambie la carga por servidor."
                : "The mechanism: with c servers there are more ways for a free server to absorb an arrival before a queue forms, so the all-busy probability C(c,a) falls steeply with c at fixed ρ; and the conditional wait shrinks because the backlog clears at the pooled rate cμ rather than μ. Both effects compound in W_q=C(c,a)/[cμ(1−ρ)]. Numerically, at ρ=0.8: a single M/M/1 (c=1) has C(1,a)=ρ=0.8 and a large W_q; doubling to c=2 (with λ doubled) cuts W_q to a bit under half (1.78 vs 4.0); at c=5 to about a seventh (0.55); at c=10 to about a twentieth (0.20). The marginal benefit diminishes (square-root staffing — the square-root safety-staffing rule c≈a+β√a keeps the delay probability roughly constant), but the direction is monotone: for the same pressure ρ, bigger pools wait less. The crucial caveat is fixed ρ: pooling helps because it raises effective capacity granularity, not by changing the load per server."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "El beneficio se muestra a ρ fijo; comparar sistemas a distinto ρ confunde el pooling con la reducción de carga."
                  : "The benefit is shown at fixed ρ; comparing systems at different ρ confounds pooling with load reduction.",
                es
                  ? "Asume una única cola FCFS compartida y servidores homogéneos e intercambiables. Las ganancias del pooling se erosionan con heterogeneidad de servidores, restricciones de enrutamiento por habilidad o costos de preparación/desplazamiento por servidor."
                  : "Assumes a single shared FCFS queue and homogeneous, interchangeable servers. Pooling gains erode with server heterogeneity, skill-based routing constraints, or per-server setup/travel costs.",
                es
                  ? "Rendimientos decrecientes: cada servidor añadido ayuda menos (personal raíz-cuadrada). Más allá de la rodilla el servidor marginal aún ayuda, pero operativamente se dota personal a una probabilidad de retardo objetivo, no a c→∞."
                  : "Diminishing returns: each added server helps less (square-root staffing). Beyond the knee the marginal server still helps, but operationally one staffs to a target delay probability, not c→∞.",
                es
                  ? "El pooling real puede tener costos ocultos (caminata más larga a un mostrador compartido, pérdida de afinidad cliente–servidor) ausentes en la idealización M/M/c."
                  : "Real pooling can have hidden costs (longer walk to a shared desk, loss of customer–server affinity) not in the M/M/c idealization.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`W_q=\frac{C(c,a)}{c\mu(1-\rho)} .`}
            caption={es ? "Ambos efectos del pooling (C(c,a) cae, el atasco se vacía a cμ) se componen aquí." : "Both pooling effects (C(c,a) drops, backlog clears at cμ) compound here."}
          />
          <Equation
            tex={String.raw`W_q(c)=\frac{C(c,a)}{c\mu(1-\rho)},\quad a=c\rho\ \ (\rho\text{ fixed}),\qquad \text{square-root staffing: } c\approx a+\beta\sqrt{a}.`}
            caption={es ? "W_q frente a c a ρ fijo, y la regla de personal raíz-cuadrada." : "W_q versus c at fixed ρ, and the square-root safety-staffing rule."}
          />

          <Callout variant="strong" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "La lección estelar del laboratorio. Un subconjunto de los 12 regímenes fija ρ y barre c∈{1,2,5,10}; la app traza el W_q simulado y analítico lado a lado para mostrar la caída monótona pronunciada — la figura siguiente."
                : "The headline lesson of the lab. A subset of the 12 regimes fixes ρ and sweeps c∈{1,2,5,10}; the app plots simulated and analytic W_q side by side to show the steep monotone drop — the figure below."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 520 360"
              role="img"
              aria-label={es ? "Gráfico de barras de pooling: W_q para c=1,2,5,10 a ρ fija." : "Pooling bar chart: W_q for c=1,2,5,10 at fixed ρ."}
            >
              <text x="260" y="22" textAnchor="middle" fill="var(--color-fg)" fontSize="13">
                {es ? "Pooling a ρ = 0.8 fija: más servidores ⇒ mucho menos espera" : "Pooling at fixed ρ = 0.8: more servers ⇒ far less waiting"}
              </text>
              {/* Axes */}
              <line x1="70" y1="300" x2="470" y2="300" stroke="var(--color-fg)" strokeWidth="1.5" />
              <line x1="70" y1="300" x2="70" y2="30" stroke="var(--color-fg)" strokeWidth="1.5" />
              <text x="34" y="165" textAnchor="middle" fill="var(--color-fg)" fontSize="12" transform="rotate(-90 34 165)">
                {es ? "W_q (espera media en cola)" : "W_q (mean wait in queue)"}
              </text>
              {/* Bars: width 60, centered at x=130,230,330,430; h=270*Wq/4 */}
              {[
                { cx: 130, h: 270, v: "4.000", c: "c=1", warn: true },
                { cx: 230, h: 120, v: "1.778", c: "c=2", warn: false },
                { cx: 330, h: 37.4, v: "0.554", c: "c=5", warn: false },
                { cx: 430, h: 13.8, v: "0.205", c: "c=10", warn: false },
              ].map((b, i) => (
                <g key={`bar-${i}`}>
                  <rect
                    x={b.cx - 30}
                    y={300 - b.h}
                    width="60"
                    height={b.h}
                    fill={b.warn ? "var(--color-warn)" : "var(--color-accent-soft)"}
                    stroke="var(--color-accent)"
                    strokeWidth="1.5"
                    opacity={b.warn ? 0.55 : 1}
                  />
                  <text x={b.cx} y={300 - b.h - 6} textAnchor="middle" fill="var(--color-fg)" fontSize="12">{b.v}</text>
                  <text x={b.cx} y="316" textAnchor="middle" fill="var(--color-fg)" fontSize="12">{b.c}</text>
                </g>
              ))}
              {/* Trend overlay connecting bar tops */}
              <polyline
                points="130,30 230,180 330,262.6 430,286.2"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                fill="none"
                opacity="0.6"
              />
              <text x="260" y="338" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">
                {es ? "Misma utilización por servidor; λ escalada con c (a = cρ).  M/M/c, μ = 1." : "Same per-server utilization; λ scaled with c (a = cρ).  M/M/c, μ = 1."}
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Cuatro barras mostrando W_q colapsando al crecer c a ρ=0,8 y μ=1 fijos — la lección de economía de escala. Valores: 4.000, 1.778, 0.554, 0.205 para c=1,2,5,10 (oráculo analítico vía recursión Erlang-B↔C)."
                : "Four bars showing W_q collapsing as c grows at fixed ρ=0.8, μ=1 — the economy-of-scale lesson. Values: 4.000, 1.778, 0.554, 0.205 for c=1,2,5,10 (analytic oracle via Erlang-B↔C recursion)."}
            </figcaption>
          </figure>

          <Refs ids={["erlang1917", "kingman1961", "grossharris2018"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "references",
      label: es ? "Referencias" : "References",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "Todas las entradas siguientes fueron verificadas mediante búsqueda web para autor, año, título, sede e identificador DOI el 2026-06-19. Listas para BibTeX."
                : "All entries below were verified by web search for author, year, title, venue, and DOI/identifier on 2026-06-19. BibTeX-ready."}
            </p>
            <ul>
              {[
                "Erlang, A. K. (1909). The Theory of Probabilities and Telephone Conversations. Nyt Tidsskrift for Matematik B, 20, 33–39.",
                "Erlang, A. K. (1917). Solution of Some Problems in the Theory of Probabilities of Significance in Automatic Telephone Exchanges. The Post Office Electrical Engineers' Journal, 10, 189–197.",
                "Kendall, D. G. (1953). Stochastic Processes Occurring in the Theory of Queues and their Analysis by the Method of the Imbedded Markov Chain. The Annals of Mathematical Statistics, 24(3), 338–354. DOI: 10.1214/aoms/1177728975.",
                "Little, J. D. C. (1961). A Proof for the Queuing Formula: L = λW. Operations Research, 9(3), 383–387. DOI: 10.1287/opre.9.3.383.",
                "Kingman, J. F. C. (1961). The single server queue in heavy traffic. Mathematical Proceedings of the Cambridge Philosophical Society, 57(4), 902–904. DOI: 10.1017/S0305004100036094.",
                "Pollaczek, F. (1930). Über eine Aufgabe der Wahrscheinlichkeitstheorie. Mathematische Zeitschrift, 32, 64–100. DOI: 10.1007/BF01194620.",
                "Wolff, R. W. (1982). Poisson Arrivals See Time Averages. Operations Research, 30(2), 223–231. DOI: 10.1287/opre.30.2.223.",
                "Shortle, J. F., Thompson, J. M., Gross, D., & Harris, C. M. (2018). Fundamentals of Queueing Theory (5th ed.). Wiley. ISBN 9781118943526; DOI: 10.1002/9781119453765.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Callout variant="note" title={es ? "Nota sobre la fórmula P–K" : "Note on the P–K formula"}>
            <p>
              {es
                ? "La fórmula de Pollaczek–Khinchine caracteriza la cola M/G/1 (un servidor, servicio general). Se cita aquí porque (i) aporta el término de variabilidad C_s² que la ley G/G/1 de Kingman generaliza, y (ii) demuestra los límites del tratamiento puramente markoviano M/M/c. Es el “modelo siguiente” natural más allá de M/M/c para servicio no exponencial."
                : "The Pollaczek–Khinchine formula characterizes the M/G/1 queue (single server, general service). It is cited here because it (i) supplies the variability term C_s² that Kingman's G/G/1 law generalizes, and (ii) demonstrates the limits of the pure-Markovian M/M/c treatment. It is the natural “next model” beyond M/M/c for non-exponential service."}
            </p>
          </Callout>

          <Refs
            ids={["erlang1909", "erlang1917", "kendall1953", "little1961", "kingman1961", "pollaczek1930", "wolff1982", "grossharris2018"]}
            label={es ? "Referencias:" : "References:"}
          />
        </div>
      ),
    },
  ];

  return <SubTabs orientation="vertical" ariaLabel={es ? "Teoría de colas M/M/c" : "M/M/c queueing theory"} tabs={tabs} />;
}
