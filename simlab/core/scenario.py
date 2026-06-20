"""The Scenario interface + the live/precompute gate.

A Scenario declares its tunable parameters and knows how to `run(params, seed) -> Trace`. The gate
(`classify_lane`) decides, FROM MEASUREMENT, whether a scenario may run live in the browser or must be
precomputed. The rule is the 4-gate AND — (1) pure-Python · (2) `wheels ⊆ LIVE_WHEELS` (so it imports in the
browser worker) · (3) run < 3 s · (4) trace < 1 MB; failing any gate forces precompute. This is what
prevents "live mislabeling" (e.g. tagging an OR-Tools scenario live when native code cannot run in WASM).
"""
from __future__ import annotations

from dataclasses import dataclass

from .trace import Trace

# --- the gates (tunable, recorded in every manifest) ---
GATE_MAX_RUN_MS = 3000.0          # must finish a run in-Worker on a mid laptop in < 3 s
GATE_MAX_TRACE_BYTES = 1_000_000  # animatable trace must be < ~1 MB
# Wheels the live Pyodide worker CAN load (pure-Python or with a Pyodide wheel). A scenario runs LIVE only if
# its `wheels` are all in this set — otherwise its engine can't import in the browser, so it's precomputed +
# replayed. This was MEASURED, not assumed: Mesa 3 runs in Pyodide (needs `sqlite3` via loadPackage; cold
# start ~3 s for numpy+pandas+scipy+networkx+sqlite3+mesa, a 20-step 2500-agent run ~2.3 s — verified in a
# real browser). So ABM runs LIVE on real Mesa, not a stand-in. Only NATIVE engines stay precompute-only:
# OR-Tools (C++/no WASM) — those scenarios set pure_python=False. The worker loads each scenario's closure
# on demand. (ABM also offers a NetLogo Web card; see web/public/netlogo + docs/frameworks/07_netlogo-web.)
LIVE_WHEELS = frozenset({
    "numpy", "simpy", "ciw", "mesa", "pandas", "scipy", "networkx", "sqlite3", "joblib",
})


@dataclass
class ParamSpec:
    """One tunable knob, surfaced as a slider/stepper in the app."""
    key: str
    label: str
    default: float
    min: float
    max: float
    step: float = 1.0
    kind: str = "float"  # "float" | "int"


@dataclass
class Variant:
    """A named, pre-simulated parameter set for a scenario.

    Each scenario ships a *family* of variants (≥10) so the app can offer a selector and the learner can
    compare regimes side by side — e.g. a light queue vs a near-saturated one vs an unstable one. Labels
    are bilingual (the app picks by language); `note_*` is a one-line "what this variant shows".
    """
    id: str
    label_en: str
    label_es: str
    params: dict
    note_en: str = ""
    note_es: str = ""


@dataclass
class GateResult:
    pure_python: bool
    run_ms: float
    trace_bytes: int
    lane: str            # "live" | "precomputed"
    reasons: list[str]   # why it was forced to precompute (empty => live)


def classify_lane(
    pure_python: bool, run_ms: float, trace_bytes: int, wheels: list[str] | tuple[str, ...] = ()
) -> GateResult:
    """Apply the gate (AND rule). live iff pure-Python AND run<3s AND trace<1MB AND wheels ⊆ LIVE_WHEELS."""
    reasons: list[str] = []
    if not pure_python:
        reasons.append("not pure-Python (cannot run in Pyodide/WASM)")
    if run_ms > GATE_MAX_RUN_MS:
        reasons.append(f"run {run_ms:.0f}ms > {GATE_MAX_RUN_MS:.0f}ms gate")
    if trace_bytes > GATE_MAX_TRACE_BYTES:
        reasons.append(f"trace {trace_bytes}B > {GATE_MAX_TRACE_BYTES}B gate")
    heavy = sorted(set(wheels) - LIVE_WHEELS)
    if heavy:
        reasons.append(f"needs wheels {heavy} not in the live worker (precompute + replay)")
    lane = "live" if not reasons else "precomputed"
    return GateResult(pure_python, round(float(run_ms), 1), int(trace_bytes), lane, reasons)


class Scenario:
    """Base class for every scenario. Subclasses set the metadata and implement `run`."""
    id: str = ""
    title: str = ""
    method: str = ""            # "DES" | "ABM" | "optimization" | "hybrid"
    tier: int = 1               # 1 intro · 2 core · 3 advanced
    viz: str = ""               # queue-network | agent-grid | geospatial-map | charts
    dimensionality: str = "2d"  # 2d | 3d
    engine: str = ""            # simpy | numpy | ortools | ...
    # Can this scenario's engine run in Pyodide? Native-code engines (OR-Tools) set this False so the
    # gate forces precompute regardless of run time.
    pure_python: bool = True
    # The minimal wheel closure the live lane must load (UX lever: keep it tiny). Subclasses override.
    wheels: list[str] = []
    param_specs: list[ParamSpec] = []

    def default_params(self) -> dict[str, float]:
        return {p.key: p.default for p in self.param_specs}

    def variants(self) -> list["Variant"]:
        """The pre-simulated parameter family. Default: a single variant from the defaults.

        Scenarios override this to ship ≥10 regimes for side-by-side comparison.
        """
        return [Variant("default", "Default", "Por defecto", self.default_params())]

    def coerce(self, params: dict) -> dict:
        """Merge with defaults and coerce int params (UI sends floats)."""
        merged = {**self.default_params(), **(params or {})}
        for spec in self.param_specs:
            if spec.kind == "int":
                merged[spec.key] = int(round(float(merged[spec.key])))
            else:
                merged[spec.key] = float(merged[spec.key])
        return merged

    def run(self, params: dict, seed: int) -> Trace:  # pragma: no cover - abstract
        raise NotImplementedError
