# 05 · Scenarios (ABM in this lab) + build checklist

← back to [Agent-Based Modeling](../02_agent-based-modeling.md)

The catalog assigns **three** scenarios to ABM. Each links its live engine and its in-repo Mesa equivalent, so
the two-engine setup teaches engine-independence rather than confusing the learner. Together they cover the ABM
canon — emergence, threshold dynamics, feedback/delay — without redundancy (see
[03 · Methods & KPIs](./03_methods-and-kpis.md)).

| # | Scenario | Engine(s) | Method | Lane | Use-case node |
|---|---|---|---|---|---|
| **S02** | Schelling Segregation | NetLogo Web (live) + Mesa 3 (repo) | emergence from preference | live | [02_s02_schelling](../../use-cases/02_s02_schelling.md) |
| **S03** | SIR / SEIR Epidemic | NetLogo Web (live) + Mesa 3 (repo) | contact / threshold | live | [03_s03_sir](../../use-cases/03_s03_sir.md) |
| **S05** | Beer Game (bullwhip) | Mesa 3 (policy/feedback) | feedback / delay | live | [05_s05_beergame](../../use-cases/05_s05_beergame.md) |

---

## S02 — Schelling Segregation · live

The canonical emergence model: households with a mild same-group preference relocate when too few neighbors
match; a *global* segregation pattern emerges that *no individual intended*.

- **Tunable:** tolerance threshold, fraction empty, group ratio, grid size.
- **Engine:** [NetLogo Web](../../frameworks/07_netlogo-web.md) for the live card (or Pyodide-Mesa replaying
  frames to Canvas2D); a [Mesa](../../frameworks/04_mesa.md) equivalent in the repo teaches engine-
  independence. A ~50×50 grid stepping at 5–10 Hz needs only Canvas2D (no Pixi).
- **Source / manifest:** [`s02_schelling.py`](../../../simlab/scenarios/s02_schelling.py) ·
  [`s02_schelling.json`](../../../manifests/s02_schelling.json).
- **Full node:** [S02 · Schelling Segregation](../../use-cases/02_s02_schelling.md).

## S03 — SIR / SEIR Epidemic · live

Spatial agents infect neighbors stochastically; the live grid animates **beside** a real-time S/I/R curve, so
the learner sees the agent-level mechanism *and* the aggregate compartment view together (the didactic hook is
exactly that contrast). Teaches R₀, the epidemic peak, the herd-immunity threshold.

- **Tunable:** infection probability, recovery time, initial infected, contact radius, (optional) latent
  period.
- **Engine:** [NetLogo Web](../../frameworks/07_netlogo-web.md) live + [Mesa](../../frameworks/04_mesa.md) in
  the repo.
- **Source / manifest:** [`s03_sir.py`](../../../simlab/scenarios/s03_sir.py) ·
  [`s03_sir.json`](../../../manifests/s03_sir.json).
- **Full node:** [S03 · SIR Epidemic](../../use-cases/03_s03_sir.md).

## S05 — Beer Game (Supply-Chain Bullwhip) · ABM policy / feedback

Four echelons (retailer → wholesaler → distributor → factory) each run a local **ordering policy** under
shipping/information **delays**; small demand changes amplify into upstream oscillations — the **bullwhip
effect**. This is modeled as **ABM (policy / feedback loop)**, *not* a DES queue clone: the object of study is
the feedback dynamic (see the boundary case in [02 · When to use](./02_when-to-use.md)).

- **Tunable:** base-stock / target inventory, lead time, demand-shock size/timing, number of echelons.
- **Engine:** [Mesa](../../frameworks/04_mesa.md) (policy/feedback).
- **Source / manifest:** [`s05_beergame.py`](../../../simlab/scenarios/s05_beergame.py) ·
  [`s05_beergame.json`](../../../manifests/s05_beergame.json).
- **Full node:** [S05 · Beer Game](../../use-cases/05_s05_beergame.md).

> **Why these three are good ABM on-ramps:** Schelling teaches emergence from preference; SIR teaches
> thresholds and the agent↔compartment bridge; the Beer Game teaches feedback and delay. Together they cover
> the ABM canon without redundancy. (Wolf–Sheep predator–prey is intentionally a repo-only bonus — it adds no
> new *method* beyond S02/S03's agent-grid + charts.)

---

## Implementation checklist

When you build a real ABM scenario in this lab:

1. **Identify the four ingredients** — agents (state + `step()`), space (grid / network / geo), local rules,
   activation regime. Write them down before coding. See [01 · What it is](./01_what-it-is.md).
2. **Confirm it's ABM, then pick the lane** — light and tunable → **live**
   ([NetLogo Web](../../frameworks/07_netlogo-web.md), or Pyodide-Mesa). Heavy / large-N / geo / pedestrian →
   **precompute** ([Mesa](../../frameworks/04_mesa.md) / [Mesa-Geo](../../frameworks/05_mesa-geo.md) /
   [JuPedSim](../../frameworks/06_jupedsim.md) headless → trace → replay). Run it past the
   [4-gate rule](../../architecture/03_the-gate.md) and record the verdict. See
   [02 · When to use](./02_when-to-use.md).
3. **Use the real framework** — Mesa for Python (Mesa-Geo for maps), NetLogo Web for live cards, JuPedSim for
   crowds. Not AgentPy (deprecated), not desmod, not a bespoke NumPy loop as the methodology. See
   [04 · Tools](./04_tools.md).
4. **Use the Mesa 3 `AgentSet` API** for activation (`shuffle_do` / `do` / staged), not the removed pre-3.0
   `Scheduler` classes. See [Mesa usage](../../frameworks/04_mesa/02_usage.md).
5. **Collect both levels** of data (model + agent) via `DataCollector`; that series **is** your trace. See
   [the trace contract](../../architecture/02_determinism-and-trace.md).
6. **Seed the RNG** so `(params, seed)` reproduces exactly — the trace is the source of truth.
7. **Pair live with Mesa** — give each live card its Mesa equivalent in the repo so the two engines teach
   engine-independence instead of confusing the learner.
8. **Record licenses** — every embedded NetLogo model and any dataset goes into
   [ATTRIBUTION.md](../../../ATTRIBUTION.md) / [LICENSES.md](../../../LICENSES.md); prefer CC0; author your own
   model when a license is restrictive.

---

## References (grounding)

- Use-case nodes: [S02 Schelling](../../use-cases/02_s02_schelling.md) ·
  [S03 SIR](../../use-cases/03_s03_sir.md) · [S05 Beer Game](../../use-cases/05_s05_beergame.md).
- Framework nodes: [Mesa](../../frameworks/04_mesa.md) · [NetLogo Web](../../frameworks/07_netlogo-web.md) ·
  [Mesa-Geo](../../frameworks/05_mesa-geo.md) · [JuPedSim](../../frameworks/06_jupedsim.md).
- Architecture: [the gate](../../architecture/03_the-gate.md) ·
  [precompute pipeline](../../architecture/05_precompute-pipeline.md) ·
  [determinism & trace](../../architecture/02_determinism-and-trace.md).
- Data policy + licenses: [ATTRIBUTION.md](../../../ATTRIBUTION.md) · [LICENSES.md](../../../LICENSES.md).
