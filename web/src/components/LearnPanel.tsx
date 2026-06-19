import { useI18n } from "../i18n";

export function LearnPanel() {
  const { lang, t } = useI18n();
  return (
    <article className="prose card">
      <h2>{t("learn.title")}</h2>
      {lang === "es" ? <Es /> : <En />}
    </article>
  );
}

function En() {
  return (
    <>
      <p>
        <strong>Discrete-Event Simulation (DES)</strong> models a system as a sequence of events that change
        its state at discrete instants — an arrival, a service start, a departure — while time jumps from
        one event to the next. It is the workhorse for queues, hospitals, factories and logistics.
      </p>
      <h3>The M/M/c queue</h3>
      <p>
        Customers arrive at random with rate <em>λ</em> (Poisson arrivals → exponential gaps), each service
        takes an exponential time with rate <em>μ</em>, and there are <em>c</em> identical servers. The two
        “M”s mean <em>Markovian</em> (memoryless) arrivals and service; <em>c</em> is the number of servers.
      </p>
      <ul>
        <li><strong>Utilization ρ = λ / (c·μ)</strong> — the fraction of server capacity in use. If ρ ≥ 1 the queue is unstable and grows forever.</li>
        <li><strong>Wq</strong> — mean time a customer waits <em>in queue</em> before service.</li>
        <li><strong>Lq</strong> — mean number of customers waiting. <strong>Little's Law</strong>: Lq = λ · Wq.</li>
        <li><strong>P(wait)</strong> — probability an arrival finds all servers busy (the Erlang-C formula).</li>
      </ul>
      <h3>Why validate against theory?</h3>
      <p>
        The M/M/c queue has an exact closed-form answer (Erlang-C). So we can check the simulator: run it,
        measure the average wait, and compare to the formula. A <em>single</em> run is noisy — its average
        bounces around the true value. Averaging many independent <em>replications</em> converges to the
        theoretical mean. That discipline — replications, confidence intervals, validation — is the heart of
        honest simulation, and the rest of CAOS_SIMLAB builds on it.
      </p>
      <p className="muted">
        This run replays a single seeded simulation so the animation is reproducible. The simulated Wq you
        see will differ from the theoretical Wq precisely because one run is noisy.
      </p>
    </>
  );
}

function Es() {
  return (
    <>
      <p>
        La <strong>Simulación de Eventos Discretos (DES)</strong> modela un sistema como una secuencia de
        eventos que cambian su estado en instantes discretos — una llegada, un inicio de servicio, una
        salida — mientras el tiempo salta de un evento al siguiente. Es la herramienta base para colas,
        hospitales, fábricas y logística.
      </p>
      <h3>La cola M/M/c</h3>
      <p>
        Los clientes llegan al azar con tasa <em>λ</em> (llegadas Poisson → tiempos exponenciales entre
        llegadas), cada servicio dura un tiempo exponencial con tasa <em>μ</em>, y hay <em>c</em> servidores
        idénticos. Las dos “M” significan llegadas y servicio <em>markovianos</em> (sin memoria); <em>c</em>
        es el número de servidores.
      </p>
      <ul>
        <li><strong>Utilización ρ = λ / (c·μ)</strong> — la fracción de capacidad en uso. Si ρ ≥ 1 la cola es inestable y crece sin límite.</li>
        <li><strong>Wq</strong> — tiempo medio que un cliente espera <em>en la cola</em> antes del servicio.</li>
        <li><strong>Lq</strong> — número medio de clientes esperando. <strong>Ley de Little</strong>: Lq = λ · Wq.</li>
        <li><strong>P(esperar)</strong> — probabilidad de que una llegada encuentre todos los servidores ocupados (fórmula de Erlang-C).</li>
      </ul>
      <h3>¿Por qué validar contra la teoría?</h3>
      <p>
        La cola M/M/c tiene una solución exacta cerrada (Erlang-C). Así podemos verificar el simulador:
        correrlo, medir la espera media y compararla con la fórmula. Una <em>sola</em> corrida es ruidosa —
        su promedio oscila alrededor del valor real. Promediar muchas <em>réplicas</em> independientes
        converge a la media teórica. Esa disciplina — réplicas, intervalos de confianza, validación — es el
        corazón de una simulación honesta, y el resto de CAOS_SIMLAB se construye sobre ella.
      </p>
      <p className="muted">
        Esta corrida reproduce una simulación con semilla fija para que la animación sea reproducible. El Wq
        simulado que ves diferirá del Wq teórico precisamente porque una sola corrida es ruidosa.
      </p>
    </>
  );
}
