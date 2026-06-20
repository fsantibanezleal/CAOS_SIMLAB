# 02 · Determinism & the trace — `run = f(params, seed)`, replay = truth

The reproducibility contract is the foundation everything else rests on:

> **A run is a pure function of `(params, seed)`.** The same inputs always produce the same **trace** — a
> compact JSON timeline of events + KPIs. The trace is the source of truth; the front end only animates it.

Because a run is pure, the result computed *live* in the browser must equal the result *committed* to the
repo for the same `(params, seed)`. That equality is what we call **replay = truth**, and the build enforces
it (see [04_live-lane-pyodide.md](./04_live-lane-pyodide.md) for the byte/numeric verify path).

## Where determinism comes from

All randomness in a run is drawn from **one** seeded generator. `simlab/core/rng.py` is the only RNG a
scenario is allowed to use:

```python
def make_rng(seed: int) -> np.random.Generator:
    """Return a seeded NumPy Generator. The only RNG a scenario should use."""
    return np.random.default_rng(int(seed))
```

Two disciplines keep this honest:

- **Single stream.** A scenario never reaches for `random.random()`, the OS entropy, or a second
  un-seeded generator. Every stochastic engine in the lab (SimPy's interarrival/service draws, Mesa's agent
  decisions, PyVRP/HGS, the Monte-Carlo replication streams) is fed from the seeded NumPy `Generator`.
- **Draw up front where possible.** `rng.py`'s own guidance: draw your variates up front (vectorised) so
  determinism does not depend on the event-scheduler's interleaving. This matters most for DES, where the
  order in which the scheduler resumes processes could otherwise perturb which draw lands where.

The payoff: re-running `python -m simlab.pipeline <id>` regenerates the **exact same committed bytes**, and a
live Pyodide run of the same `(scenario, params, seed)` is byte-comparable to that committed trace.

## The trace schema (`simlab/core/trace.py`)

A `Trace` is a dataclass that serialises to one compact JSON object. It is the **single artifact both lanes
produce and the web player consumes** — produced identically whether the run happened live in Pyodide or
offline in the pipeline, so one render path serves both lanes.

```python
SCHEMA = "simlab.trace/v1"

@dataclass
class Trace:
    scenario: str               # scenario id, e.g. "s01_queue"
    title: str
    method: str                 # "DES" | "ABM" | "optimization" | "hybrid"
    seed: int
    params: dict[str, Any]      # the exact inputs this trace was run with
    kpis: dict[str, Any]        # summary metrics surfaced in the UI
    analytic: dict[str, Any]    # optional closed-form / second-engine reference (validation scenarios)
    t_end: float                # last event time (timeline length)
    events: list[dict[str, Any]]  # the animatable timeline
```

### Serialised shape (`to_dict`)

```json
{
  "schema": "simlab.trace/v1",
  "scenario": "...", "title": "...", "method": "...",
  "seed": 42,
  "params": { ... },
  "kpis": { ... },
  "analytic": { ... },
  "timeline": { "t_end": 0.0, "events": [ { "t": 0.0, "kind": "arrival", ... }, ... ] }
}
```

### The pieces, and why each exists

- **`scenario` / `title` / `method` / `seed` / `params`** — the run's identity. `(scenario, params, seed)` is
  the full input; everything else in the trace is a deterministic function of it. This is what lets the app
  *re-run* a trace live and check the result.
- **`kpis`** — the summary metrics (mean wait, throughput, makespan, …) the UI shows without scrubbing the
  whole timeline.
- **`analytic`** — for validation scenarios, a reference the run is checked against: a closed-form result
  (S01's Erlang-C) and/or a **real second-engine** cross-check (S01 also runs a seeded **Ciw** M/M/c
  replication study). Carrying the reference *inside the trace* means the honesty claim travels with the
  artifact, not in prose someone has to trust.
- **`timeline` = `{t_end, events}`** — the animatable record. Each event is `{"t": <time>, "kind": <str>,
  ...payload}`; `kind` is scenario-defined (`arrival` / `start` / `depart` / a grid frame / a route step).
  `add_event` rounds `t` to 4 decimals and tracks `t_end`, so the player knows the timeline length up front.

### Compactness is a gate input, not a nicety

`to_json` uses compact separators (`","`, `":"`) and event times are rounded — because **committed trace
bytes are one of the gate thresholds** (< ~1 MB; see [03_the-gate.md](./03_the-gate.md)). `Trace.write`
returns the on-disk size in bytes, which the pipeline feeds straight into `classify_lane`:

```python
def write(self, path) -> int:
    p = Path(path); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(self.to_json(), encoding="utf-8")
    return p.stat().st_size   # this number IS the trace_bytes the gate measures
```

## Specialised trace builders

`Trace` is the base; the viz-specific subclasses in `simlab/core/` (`GridTrace`, `RouteTrace`,
`GanttTrace`, `FlowTrace`, `ChartTrace`) add typed helpers for their renderer (grid dims + legend, route
geometry + bounds, Gantt rows, flow edges, chart series) while serialising to the **same** versioned schema.
That is what lets one front-end render path animate a queue network, an agent grid, a road map and a Gantt
chart from a single trace contract — the renderer keys off `viz` in the manifest, not off a different file
format.

## Read next

- [03_the-gate.md](./03_the-gate.md) — how the measured run decides live vs precompute.
- [04_live-lane-pyodide.md](./04_live-lane-pyodide.md) — how the browser re-runs and verifies a trace.
