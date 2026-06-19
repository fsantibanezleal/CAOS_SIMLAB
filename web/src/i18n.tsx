import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "es";

type Dict = Record<string, string>;

const EN: Dict = {
  "app.title": "CAOS_SIMLAB",
  "app.tagline": "A didactic lab for Discrete-Event Simulation & Agent-Based Modeling",
  "nav.simulator": "Simulator",
  "nav.learn": "Learn",
  "nav.about": "About",
  "sim.loading": "Loading simulation…",
  "sim.play": "Play",
  "sim.pause": "Pause",
  "sim.restart": "Restart",
  "sim.speed": "Speed",
  "sim.time": "Time",
  "sim.lane.precomputed": "Replaying a precomputed, seeded run",
  "sim.lane.note": "Live parameter tuning (in-browser via Pyodide) is the next increment.",
  "sim.params": "Run configuration",
  "viz.source": "Arrivals",
  "viz.queue": "Queue",
  "viz.servers": "Servers",
  "viz.served": "Served",
  "kpi.title": "Results vs theory",
  "kpi.wq.sim": "Mean wait Wq (simulated)",
  "kpi.wq.theory": "Mean wait Wq (M/M/c theory)",
  "kpi.rho": "Utilization ρ",
  "kpi.pwait": "P(wait > 0)",
  "kpi.little": "Lq (Little's Law)",
  "kpi.note":
    "A single run is noisy: the simulated mean wanders around the theoretical long-run mean. Averaging many replications converges to theory — that is the validation lesson.",
  "kpi.unstable": "Unstable (ρ ≥ 1): the queue grows without bound.",
  "params.lam": "Arrival rate λ (/min)",
  "params.mu": "Service rate μ (/min)",
  "params.c": "Servers c",
  "params.n": "Customers",
  "learn.title": "Discrete-Event Simulation: the M/M/c queue",
  "about.title": "About CAOS_SIMLAB",
};

const ES: Dict = {
  "app.title": "CAOS_SIMLAB",
  "app.tagline": "Un laboratorio didáctico de Simulación de Eventos Discretos y Modelos Basados en Agentes",
  "nav.simulator": "Simulador",
  "nav.learn": "Teoría",
  "nav.about": "Acerca de",
  "sim.loading": "Cargando simulación…",
  "sim.play": "Reproducir",
  "sim.pause": "Pausar",
  "sim.restart": "Reiniciar",
  "sim.speed": "Velocidad",
  "sim.time": "Tiempo",
  "sim.lane.precomputed": "Reproduciendo una corrida precomputada con semilla fija",
  "sim.lane.note": "El ajuste de parámetros en vivo (en el navegador, vía Pyodide) es el siguiente incremento.",
  "sim.params": "Configuración de la corrida",
  "viz.source": "Llegadas",
  "viz.queue": "Cola",
  "viz.servers": "Servidores",
  "viz.served": "Atendidos",
  "kpi.title": "Resultados vs teoría",
  "kpi.wq.sim": "Espera media Wq (simulada)",
  "kpi.wq.theory": "Espera media Wq (teoría M/M/c)",
  "kpi.rho": "Utilización ρ",
  "kpi.pwait": "P(esperar > 0)",
  "kpi.little": "Lq (Ley de Little)",
  "kpi.note":
    "Una sola corrida es ruidosa: la media simulada oscila alrededor de la media teórica de largo plazo. Promediar muchas réplicas converge a la teoría — esa es la lección de validación.",
  "kpi.unstable": "Inestable (ρ ≥ 1): la cola crece sin límite.",
  "params.lam": "Tasa de llegada λ (/min)",
  "params.mu": "Tasa de servicio μ (/min)",
  "params.c": "Servidores c",
  "params.n": "Clientes",
  "learn.title": "Simulación de Eventos Discretos: la cola M/M/c",
  "about.title": "Acerca de CAOS_SIMLAB",
};

const DICTS: Record<Lang, Dict> = { en: EN, es: ES };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem("simlab.lang") as Lang) || "en",
  );
  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      setLang: (l) => {
        localStorage.setItem("simlab.lang", l);
        setLangState(l);
      },
      t: (key) => DICTS[lang][key] ?? DICTS.en[key] ?? key,
    }),
    [lang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
