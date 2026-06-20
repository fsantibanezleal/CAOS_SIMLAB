import { useTranslation } from "react-i18next";
import { Callout } from "@/components/content/Callout";
import { EXTERNAL_LINKS } from "@/lib/links";
import { useLang } from "@/lib/useLang";

const SIMPY_CODE = `import simpy, numpy as np

def mmc(lam, mu, c, n, seed):
    rng = np.random.default_rng(seed)          # one seeded RNG
    inter   = rng.exponential(1/lam, size=n)   # draw all variates up front
    service = rng.exponential(1/mu,  size=n)   # -> determinism
    env = simpy.Environment()
    servers = simpy.Resource(env, capacity=c)
    waits = []

    def customer(i):
        t_arr = env.now
        with servers.request() as req:         # join the queue
            yield req                           # wait for a free server
            waits.append(env.now - t_arr)       # time spent waiting
            yield env.timeout(service[i])       # being served

    def source():
        for i in range(n):
            yield env.timeout(inter[i])         # next arrival
            env.process(customer(i))

    env.process(source()); env.run()
    return float(np.mean(waits))                # mean wait Wq`;

const PIPELINE_CODE = `# create the venv + install (PowerShell or bash)
./scripts/setup.ps1            # or ./scripts/setup.sh

# run the test suite (reproducibility + theory validation)
.venv/Scripts/python -m pytest

# pre-simulate every variant -> committed traces + manifest
.venv/Scripts/python -m simlab.pipeline s01_queue

# run the web viewer locally
cd web && npm install && npm run dev`;

export default function Build() {
  const { t } = useTranslation();
  const es = useLang() === "es";

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.build")}</h1>
        <p className="lede">
          {es
            ? "La receta de punta a punta para construir un programa de simulación como los de este laboratorio — del modelo conceptual al trace validado y al visor web. Todo el código es abierto."
            : "The end-to-end recipe for building a simulation program like the ones in this lab — from the conceptual model to the validated trace and the web viewer. All the code is open."}
        </p>
      </div>

      <article className="prose">
        <ol className="steps">
          <li>
            <h3>{es ? "1 · Modelo conceptual" : "1 · Conceptual model"}</h3>
            <p>
              {es
                ? "Antes de codificar, nombra las piezas: ¿qué entidades fluyen? ¿qué recursos escasos comparten? ¿qué eventos cambian el estado? ¿qué KPIs medirás? Para una cola: entidades = clientes, recurso = c servidores, eventos = llegada/inicio/salida, KPI = espera media Wq."
                : "Before coding, name the parts: what entities flow? what scarce resources do they share? what events change the state? which KPIs will you measure? For a queue: entities = customers, resource = c servers, events = arrival/start/departure, KPI = mean wait Wq."}
            </p>
          </li>
          <li>
            <h3>{es ? "2 · Distribuciones y semilla" : "2 · Distributions & seed"}</h3>
            <p>
              {es
                ? "Elige distribuciones para los tiempos (aquí, exponenciales para llegadas y servicio) y saca TODA la aleatoriedad de un único generador con semilla. Muestrear los valores por adelantado hace la corrida reproducible sin depender del orden del planificador."
                : "Choose distributions for the times (here, exponential for arrivals and service) and draw ALL randomness from a single seeded generator. Sampling the values up front makes the run reproducible independent of the scheduler's ordering."}
            </p>
          </li>
          <li>
            <h3>{es ? "3 · Implementar con SimPy" : "3 · Implement with SimPy"}</h3>
            <p>
              {es ? "SimPy modela los procesos como generadores de Python que hacen yield del paso del tiempo y de las solicitudes de recursos:" : "SimPy models processes as Python generators that yield the passage of time and resource requests:"}
            </p>
            <pre className="codeblock"><code>{SIMPY_CODE}</code></pre>
          </li>
          <li>
            <h3>{es ? "4 · Emitir un trace" : "4 · Emit a trace"}</h3>
            <p>
              {es
                ? "En vez de solo devolver un número, registra cada evento (tiempo, tipo, id) y los KPIs en un objeto compacto serializable a JSON — el trace. Es lo que el visor web reproduce, y lo que se commitea al repo."
                : "Instead of just returning a number, record each event (time, kind, id) and the KPIs into a compact JSON-serializable object — the trace. It is what the web viewer replays, and what gets committed to the repo."}
            </p>
          </li>
          <li>
            <h3>{es ? "5 · Validar" : "5 · Validate"}</h3>
            <p>
              {es
                ? "Contrasta el simulador con una referencia: una fórmula cerrada (Erlang-C para M/M/c) o un caso conocido. Promedia muchas réplicas para domar el ruido, y reporta un intervalo de confianza. Si no concuerda, hay un bug o un supuesto mal puesto."
                : "Check the simulator against a reference: a closed form (Erlang-C for M/M/c) or a known case. Average many replications to tame the noise, and report a confidence interval. If it disagrees, there's a bug or a wrong assumption."}
            </p>
          </li>
          <li>
            <h3>{es ? "6 · Decidir el carril y el manifest" : "6 · Decide the lane & manifest"}</h3>
            <p>
              {es
                ? "Mide la corrida: si es Python puro, su cierre de wheels cabe en el worker del navegador (LIVE_WHEELS: numpy, simpy, ciw, mesa, pandas, scipy, networkx, sqlite3, joblib), corre en < 3 s y el trace pesa < 1 MB, puede ejecutarse en vivo; si no, se precomputa y se reproduce. El veredicto, con los números medidos, queda en el manifest del escenario — auditable."
                : "Measure the run: if it's pure-Python, its wheel closure fits the browser worker (LIVE_WHEELS: numpy, simpy, ciw, mesa, pandas, scipy, networkx, sqlite3, joblib), runs in < 3 s and the trace is < 1 MB, it can run live; otherwise it's precomputed and replayed. The verdict, with the measured numbers, is recorded in the scenario manifest — auditable."}
            </p>
            <Callout variant="note" title={es ? "La regla de compuertas" : "The gate rule"}>
              <p className="mono small">live ⇔ pure_python AND wheels ⊆ LIVE_WHEELS AND run_ms &lt; 3000 AND trace_bytes &lt; 1_000_000</p>
              <p className="mono small">LIVE_WHEELS = &#123;numpy, simpy, ciw, mesa, pandas, scipy, networkx, sqlite3, joblib&#125;</p>
            </Callout>
          </li>
          <li>
            <h3>{es ? "7 · Correr el pipeline y el visor" : "7 · Run the pipeline & viewer"}</h3>
            <p>{es ? "Reproducible en cualquier máquina:" : "Reproducible on any machine:"}</p>
            <pre className="codeblock"><code>{PIPELINE_CODE}</code></pre>
          </li>
        </ol>

        <Callout variant="strong" title={es ? "Lee el código completo" : "Read the full code"}>
          <p>
            {es ? "Todo el motor (" : "The whole engine ("}
            <span className="mono">simlab/</span>
            {es ? "), los escenarios, el pipeline y este visor son abiertos en " : "), the scenarios, the pipeline and this viewer are open at "}
            <a href={EXTERNAL_LINKS.github} target="_blank" rel="noreferrer noopener">GitHub</a>.
          </p>
        </Callout>
      </article>
    </div>
  );
}
