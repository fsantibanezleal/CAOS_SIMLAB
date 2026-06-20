import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Chrome / UI strings. Long-form page content (theory, experiment descriptions) is rendered by
// language-branching React components (see useLang), not stored here, to keep rich formatting readable.

const LANG_KEY = "caos.simlab.lang";

export const SUPPORTED_LANGUAGES = ["en", "es"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const en = {
  product: { name: "CAOS_SIMLAB" },
  nav: { introduction: "Introduction", experiments: "Experiments", theory: "Theory", build: "How to build" },
  header: {
    github: "Source on GitHub",
    personal: "Personal site",
    portfolio: "Portfolio",
    toggleTheme: "Toggle light / dark",
    toggleLanguage: "Switch language",
    lightThemeShort: "Light",
    darkThemeShort: "Dark",
  },
  footer: {
    attribution: "Built by Felipe Santibáñez-Leal",
    complement: "A CAOS research investigation",
    license: "MIT licensed · open source",
    version: "v",
  },
  common: { loading: "Loading…", error: "Could not load" },
  viz: { source: "Arrivals", queue: "Queue", servers: "Servers", served: "Served" },
  sim: {
    play: "Play",
    pause: "Pause",
    restart: "Restart",
    speed: "Speed",
    time: "Time",
    variants: "Pre-simulated regimes",
    runConfig: "Run configuration",
    laneLive: "live-capable",
    lanePrecomputed: "precomputed",
    seed: "seed",
    tabSimulator: "Simulator",
    tabCharts: "Summary charts",
    tabContext: "Context",
    tabLive: "Live (your browser)",
  },
  live: {
    intro: "Tune the parameters and run the real Python scenario right here — it executes in your browser via Pyodide (WebAssembly), no server. The result is animated by the same player.",
    badge: "computed live in your browser",
    params: "Parameters",
    seed: "Seed",
    run: "Run in browser",
    rerun: "Run again",
    reset: "Reset to defaults",
    verify: "Verify against the committed trace",
    loadingRuntime: "Loading the Python runtime (one-time, ~download)…",
    running: "Running the scenario…",
    error: "Live run failed",
    firstRunNote: "The first run downloads the Python runtime once; later runs are instant.",
    nativeTitle: "Precomputed only — no live lane",
    nativeBody: "This scenario's engine is a native-code solver (OR-Tools) with no WebAssembly build, so it can't run in the browser worker — it runs in the local pipeline and the seeded trace is replayed here. Use the Simulator tab to compare the pre-simulated regimes (details below).",
    verifyMatch: "✓ Reproduces the committed trace exactly — replay = truth.",
    verifyMismatch: "Differs slightly from the committed trace (browser runtime/library version) — still a valid, reproducible run.",
    matchesVariant: "These are the exact parameters + seed of regime",
  },
  kpi: {
    title: "Result vs theory",
    wqSim: "Mean wait Wq — simulated",
    wqTheory: "Mean wait Wq — M/M/c theory",
    rho: "Utilization ρ",
    pwait: "P(wait > 0)",
    lq: "Lq (Little's Law)",
    sim: "simulated",
    theory: "theory",
    note: "A single run is noisy: the simulated mean wanders around the theoretical long-run value. Averaging many replications converges to theory — that is the validation lesson.",
    unstable: "Unstable (ρ ≥ 1): no steady state — the queue grows without bound, so theoretical Wq = ∞.",
  },
  compare: {
    title: "Compare all regimes",
    note: "Simulated mean wait (points) against the closed-form M/M/c theory (line), across every pre-simulated regime. Click a point to load that regime above.",
    axisRho: "Utilization ρ",
    axisWq: "Mean wait Wq",
    colVariant: "Regime",
    colRho: "ρ",
    colServers: "c",
    colWqSim: "Wq sim",
    colWqTheory: "Wq theory",
  },
};

const es: typeof en = {
  product: { name: "CAOS_SIMLAB" },
  nav: { introduction: "Introducción", experiments: "Experimentos", theory: "Teoría", build: "Cómo construir" },
  header: {
    github: "Código en GitHub",
    personal: "Sitio personal",
    portfolio: "Portafolio",
    toggleTheme: "Cambiar claro / oscuro",
    toggleLanguage: "Cambiar idioma",
    lightThemeShort: "Claro",
    darkThemeShort: "Oscuro",
  },
  footer: {
    attribution: "Hecho por Felipe Santibáñez-Leal",
    complement: "Una investigación de CAOS",
    license: "Licencia MIT · código abierto",
    version: "v",
  },
  common: { loading: "Cargando…", error: "No se pudo cargar" },
  viz: { source: "Llegadas", queue: "Cola", servers: "Servidores", served: "Atendidos" },
  sim: {
    play: "Reproducir",
    pause: "Pausar",
    restart: "Reiniciar",
    speed: "Velocidad",
    time: "Tiempo",
    variants: "Regímenes pre-simulados",
    runConfig: "Configuración de la corrida",
    laneLive: "ejecutable en vivo",
    lanePrecomputed: "precomputado",
    seed: "semilla",
    tabSimulator: "Simulador",
    tabCharts: "Gráficos de resumen",
    tabContext: "Contexto",
    tabLive: "En vivo (tu navegador)",
  },
  live: {
    intro: "Ajusta los parámetros y ejecuta el escenario real de Python aquí mismo — corre en tu navegador con Pyodide (WebAssembly), sin servidor. El resultado se anima con el mismo reproductor.",
    badge: "calculado en vivo en tu navegador",
    params: "Parámetros",
    seed: "Semilla",
    run: "Ejecutar en el navegador",
    rerun: "Ejecutar de nuevo",
    reset: "Restablecer valores",
    verify: "Verificar contra el trace comprometido",
    loadingRuntime: "Cargando el entorno Python (una vez, ~descarga)…",
    running: "Ejecutando el escenario…",
    error: "Falló la ejecución en vivo",
    firstRunNote: "La primera corrida descarga el entorno Python una vez; las siguientes son instantáneas.",
    nativeTitle: "Solo precomputado — sin modo en vivo",
    nativeBody: "El motor de este escenario es un solver de código nativo (OR-Tools) sin build de WebAssembly, así que no puede correr en el worker del navegador — corre en el pipeline local y aquí se reproduce el trace sembrado. Usa la pestaña Simulador para comparar los regímenes pre-simulados (detalles abajo).",
    verifyMatch: "✓ Reproduce exactamente el trace comprometido — replay = verdad.",
    verifyMismatch: "Difiere levemente del trace comprometido (versión del runtime/librería del navegador) — sigue siendo una corrida válida y reproducible.",
    matchesVariant: "Estos son los parámetros + semilla exactos del régimen",
  },
  kpi: {
    title: "Resultado vs teoría",
    wqSim: "Espera media Wq — simulada",
    wqTheory: "Espera media Wq — teoría M/M/c",
    rho: "Utilización ρ",
    pwait: "P(esperar > 0)",
    lq: "Lq (Ley de Little)",
    sim: "simulado",
    theory: "teoría",
    note: "Una sola corrida es ruidosa: la media simulada oscila alrededor del valor teórico de largo plazo. Promediar muchas réplicas converge a la teoría — esa es la lección de validación.",
    unstable: "Inestable (ρ ≥ 1): no hay estado estacionario — la cola crece sin límite, así que Wq teórico = ∞.",
  },
  compare: {
    title: "Comparar todos los regímenes",
    note: "Espera media simulada (puntos) contra la teoría cerrada M/M/c (línea), en cada régimen pre-simulado. Haz clic en un punto para cargar ese régimen arriba.",
    axisRho: "Utilización ρ",
    axisWq: "Espera media Wq",
    colVariant: "Régimen",
    colRho: "ρ",
    colServers: "c",
    colWqSim: "Wq sim",
    colWqTheory: "Wq teoría",
  },
};

export function persistLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

function initialLang(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY) as Language | null;
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "en";
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: initialLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
