# 05 · Scenarios (ABM in this lab) + build checklist

← back to [Agent-Based Modeling](../02_agent-based-modeling.md)

The catalog assigns **three** scenarios to ABM. All three run live on **Mesa 3 in Pyodide** (`engine = "mesa"`),
each backed by a committed trace for instant first paint; S02 additionally has a standalone NetLogo Web card
(off-nav, linked from its page) so a second engine can show the same problem and teach engine-independence
rather than confusing the learner. Together the three cover the ABM canon — emergence, threshold dynamics,
feedback/delay — without redundancy (see [03 · Methods & KPIs](./03_methods-and-kpis.md)).

| # | Scenario | Engine(s) | Method | Lane | Use-case node |
|---|---|---|---|---|---|
| **S02** | Schelling Segregation | Mesa 3 (live in Pyodide) · + standalone NetLogo Web card | emergence from preference | live | [02_s02_schelling](../../use-cases/02_s02_schelling.md) |
| **S03** | SIR / SEIR Epidemic | Mesa 3 (live in Pyodide) | contact / threshold | live | [03_s03_sir](../../use-cases/03_s03_sir.md) |
| **S05** | Beer Game (bullwhip) | Mesa 3 (live in Pyodide, policy/feedback) | feedback / delay | live | [05_s05_beergame](../../use-cases/05_s05_beergame.md) |

---

## S02 — Schelling Segregation · live

The canonical emergence model: households with a mild same-group preference relocate when too few neighbors
match; a *global* segregation pattern emerges that *no individual intended*.

- **Tunable:** tolerance threshold, fraction empty, group ratio, grid size.
- **Engine:** the scenario itself runs on [Mesa 3](../../frameworks/04_mesa.md) **live in Pyodide**
  (`engine = "mesa"`), replaying a committed trace for instant first paint; a standalone
  [NetLogo Web](../../frameworks/07_netlogo-web.md) Schelling card (off-nav `/sandbox/netlogo`, linked from this
  scenario's page) shows the same problem in a second engine and teaches engine-independence. A ~50×50 grid
  stepping at 5–10 Hz needs only Canvas2D (no Pixi).
- **Source / manifest:** [`s02_schelling.py`](../../../simlab/scenarios/s02_schelling.py) ·
  [`s02_schelling.json`](../../../manifests/s02_schelling.json).
- **Full node:** [S02 · Schelling Segregation](../../use-cases/02_s02_schelling.md).

## S03 — SIR / SEIR Epidemic · live

Spatial agents infect neighbors stochastically; the live grid animates **beside** a real-time S/I/R curve, so
the learner sees the agent-level mechanism *and* the aggregate compartment view together (the didactic hook is
exactly that contrast). Teaches R₀, the epidemic peak, the herd-immunity threshold.

- **Tunable:** infection probability, recovery time, initial infected, contact radius, (optional) latent
  period.
- **Engine:** [Mesa 3](../../frameworks/04_mesa.md) **live in Pyodide** (`engine = "mesa"`), replaying a
  committed trace for instant first paint. **No NetLogo SIR card ships** — there is no SIR `.nlogo`/HTML in the
  repo; NetLogo SIR is only "same problem, other tool" (see [03_s03_sir](../../use-cases/03_s03_sir.md)).
- **Source / manifest:** [`s03_sir.py`](../../../simlab/scenarios/s03_sir.py) ·
  [`s03_sir.json`](../../../manifests/s03_sir.json).
- **Full node:** [S03 · SIR Epidemic](../../use-cases/03_s03_sir.md).

## S05 — Beer Game (Supply-Chain Bullwhip) · ABM policy / feedback

Four echelons (retailer → wholesaler → distributor → factory) each run a local **ordering policy** under
shipping/information **delays**; small demand changes amplify into upstream oscillations — the **bullwhip
effect**. This is modeled as **ABM (policy / feedback loop)**, *not* a DES queue clone: the object of study is
the feedback dynamic (see the boundary case in [02 · When to use](./02_when-to-use.md)).

- **Tunable:** demand level (base + shock size), demand pattern (step / spike / AR(1) noise) and its timing,
  lead time L, forecast smoothing θ, horizon (weeks). The chain is **fixed at four echelons**; the order-up-to
  target S = (L+1)·forecast is *derived* from those params, not a separate slider.
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
5. **Record both levels** of data (model + agent) — Mesa offers a `DataCollector`, or record the per-tick
   series directly (what the lab's scenarios do, e.g. S05); either way that series **is** your trace. See
   [the trace contract](../../architecture/02_determinism-and-trace.md).
6. **Seed the RNG** so `(params, seed)` reproduces exactly — the trace is the source of truth.
7. **Run on Mesa, optionally pair a NetLogo card** — the lab's ABM scenarios run live on Mesa 3 in Pyodide;
   where a second engine adds teaching value, ship a standalone NetLogo Web card (as S02 does) so the two
   engines teach engine-independence instead of confusing the learner. NetLogo is optional, not per-scenario.
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
