import { Link } from "react-router-dom";
import { Callout } from "@/components/content/Callout";
import { useLang } from "@/lib/useLang";

export default function Introduction() {
  const lang = useLang();
  return (
    <div className="page-body">
      {lang === "es" ? <Es /> : <En />}
    </div>
  );
}

function En() {
  return (
    <article className="prose">
      <div className="page-head">
        <h1>A hands-on lab for simulation modeling</h1>
        <p className="lede">
          CAOS_SIMLAB teaches <strong>Discrete-Event Simulation (DES)</strong> and{" "}
          <strong>Agent-Based Modeling (ABM)</strong> the way they are actually practised: you open a worked
          case study, pick from a family of pre-simulated regimes, watch the dynamics run, and check the
          result against theory — then learn how the model was built so you can build your own.
        </p>
      </div>

      <section>
        <h2>What is simulation, and why?</h2>
        <p>
          Many systems are too complex, stochastic, or risky to reason about with a formula or a spreadsheet:
          a hospital emergency department, a bank of servers, a fleet of haul trucks, an epidemic. Simulation
          builds a <em>computational model</em> of the system, runs it forward under randomness, and measures
          what happens — so you can ask "what if?" before changing the real thing.
        </p>
        <div className="two-col">
          <div className="card">
            <h3>Discrete-Event Simulation (DES)</h3>
            <p className="muted">
              The system jumps between discrete events (an arrival, a service start, a departure) while time
              skips from one event to the next. Ideal for queues, flows, and resource contention — banks,
              clinics, factories, logistics. Engine here: <span className="mono">SimPy</span>.
            </p>
          </div>
          <div className="card">
            <h3>Agent-Based Modeling (ABM)</h3>
            <p className="muted">
              Many autonomous agents follow simple local rules; global behaviour <em>emerges</em> that no
              single agent intended — segregation, epidemics, flocking, traffic. Engine (coming): {" "}
              <span className="mono">Mesa</span>.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>How this lab works</h2>
        <p>
          A simulation run here is a <strong>pure function of its parameters and a random seed</strong>: the
          same inputs always produce the same result. We exploit that for honesty and speed:
        </p>
        <ul className="tick-list">
          <li><strong>Pre-simulated regimes.</strong> Each case study ships a family of ≥10 parameter sets, computed offline into compact <em>seeded traces</em>. You switch between them instantly and compare.</li>
          <li><strong>Deterministic replay.</strong> The trace is the source of truth; the animation just plays it back. What you see is exactly what was computed — reproducible to the seed.</li>
          <li><strong>Validation against theory.</strong> Where a closed-form answer exists (it does for the M/M/c queue), every regime is checked against it, so you can see the simulator agree — or wander, when a single run is noisy.</li>
        </ul>
        <Callout variant="strong" title="It's a static site — no server simulates on demand">
          <p>
            All compute is offline (the committed traces) or, for light models, in your own browser. There is
            no backend, nothing to attack, and nothing to pay for — the architecture the heavy case studies
            (routing, dispatch) will reuse.
          </p>
        </Callout>
      </section>

      <section>
        <h2>What you'll find</h2>
        <ul>
          <li><Link to="/">Experiments</Link> — worked case studies, each with a detailed write-up, ≥10 comparable regimes, an animated player, and a sim-vs-theory comparison.</li>
          <li><Link to="/theory">Theory</Link> — the concepts from zero: the event loop, queueing theory and the M/M/c formulas, and why replications and validation matter.</li>
          <li><Link to="/build">How to build</Link> — the end-to-end recipe for building a simulation program of this kind, with the real code.</li>
        </ul>
        <p className="faint small">
          The scenarios are educational, not tuned for real-world service planning.
        </p>
      </section>
    </article>
  );
}

function Es() {
  return (
    <article className="prose">
      <div className="page-head">
        <h1>Un laboratorio práctico de modelado por simulación</h1>
        <p className="lede">
          CAOS_SIMLAB enseña <strong>Simulación de Eventos Discretos (DES)</strong> y{" "}
          <strong>Modelos Basados en Agentes (ABM)</strong> tal como se practican de verdad: abres un caso de
          estudio, eliges entre una familia de regímenes pre-simulados, observas la dinámica, y contrastas el
          resultado con la teoría — y luego aprendes cómo se construyó el modelo para construir el tuyo.
        </p>
      </div>

      <section>
        <h2>¿Qué es la simulación y para qué?</h2>
        <p>
          Muchos sistemas son demasiado complejos, estocásticos o riesgosos para razonarlos con una fórmula o
          una planilla: una urgencia hospitalaria, un banco de servidores, una flota de camiones, una
          epidemia. La simulación construye un <em>modelo computacional</em> del sistema, lo corre hacia
          adelante bajo aleatoriedad y mide qué pasa — para preguntar "¿qué pasaría si?" antes de tocar lo real.
        </p>
        <div className="two-col">
          <div className="card">
            <h3>Simulación de Eventos Discretos (DES)</h3>
            <p className="muted">
              El sistema salta entre eventos discretos (una llegada, un inicio de servicio, una salida)
              mientras el tiempo brinca de un evento al siguiente. Ideal para colas, flujos y contención de
              recursos — bancos, clínicas, fábricas, logística. Motor aquí: <span className="mono">SimPy</span>.
            </p>
          </div>
          <div className="card">
            <h3>Modelos Basados en Agentes (ABM)</h3>
            <p className="muted">
              Muchos agentes autónomos siguen reglas locales simples; <em>emerge</em> un comportamiento global
              que ningún agente buscó — segregación, epidemias, bandadas, tráfico. Motor (próximamente):{" "}
              <span className="mono">Mesa</span>.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>Cómo funciona este laboratorio</h2>
        <p>
          Una corrida de simulación aquí es una <strong>función pura de sus parámetros y una semilla
          aleatoria</strong>: las mismas entradas siempre producen el mismo resultado. Lo aprovechamos para
          honestidad y velocidad:
        </p>
        <ul className="tick-list">
          <li><strong>Regímenes pre-simulados.</strong> Cada caso de estudio trae una familia de ≥10 juegos de parámetros, computados offline en <em>traces con semilla</em> compactos. Cambias entre ellos al instante y comparas.</li>
          <li><strong>Replay determinista.</strong> El trace es la fuente de verdad; la animación solo lo reproduce. Lo que ves es exactamente lo que se computó — reproducible hasta la semilla.</li>
          <li><strong>Validación contra la teoría.</strong> Donde existe respuesta cerrada (la hay para la cola M/M/c), cada régimen se contrasta con ella, para ver al simulador coincidir — u oscilar, cuando una sola corrida es ruidosa.</li>
        </ul>
        <Callout variant="strong" title="Es un sitio estático — ningún servidor simula bajo demanda">
          <p>
            Todo el cómputo es offline (los traces commiteados) o, para modelos livianos, en tu propio
            navegador. No hay backend, nada que atacar ni nada que pagar — la arquitectura que reutilizarán los
            casos pesados (ruteo, despacho).
          </p>
        </Callout>
      </section>

      <section>
        <h2>Qué vas a encontrar</h2>
        <ul>
          <li><Link to="/">Experimentos</Link> — casos de estudio, cada uno con explicación detallada, ≥10 regímenes comparables, un reproductor animado y una comparación sim-vs-teoría.</li>
          <li><Link to="/theory">Teoría</Link> — los conceptos desde cero: el bucle de eventos, la teoría de colas y las fórmulas M/M/c, y por qué importan las réplicas y la validación.</li>
          <li><Link to="/build">Cómo construir</Link> — la receta de punta a punta para construir un programa de simulación de este tipo, con el código real.</li>
        </ul>
        <p className="faint small">Los escenarios son educativos, no ajustados para planificación de servicios reales.</p>
      </section>
    </article>
  );
}
