# S05 Beer Game — solver applied

← Back to the use-case index: [../05_s05_beergame.md](../05_s05_beergame.md) ·
Prev: [02_formalization.md](./02_formalization.md) · Next: [04_results-and-reading.md](./04_results-and-reading.md)

Which dedicated tool solves this scenario, **how** it is wired, why it is the right tool, and which lane
(live vs precompute) this scenario runs on. Framework reference: the Mesa node at
[../../frameworks/04_mesa.md](../../frameworks/04_mesa.md).

---

## 1. The tool: Mesa 3 (agent-based modeling)

This scenario runs on **Mesa 3** (resolved 3.5.1), the de-facto Python ABM framework and the lab's default
ABM engine. The Beer Game is the textbook ABM: many autonomous agents each with state and one local rule,
from whose interaction a global pattern *emerges* — here the bullwhip effect across serial echelons. Mesa's
four core abstractions map one-to-one onto the formalization:

| Formal element ([02_formalization.md](./02_formalization.md)) | Mesa expression | In `s05_beergame.py` |
|---|---|---|
| Agent + state (`F`, `S`) | subclass `mesa.Agent` | `class EchelonAgent(mesa.Agent)` |
| The local rule (forecast → target → order) | `Agent` method | `EchelonAgent.place_order(received)` |
| Topology (serial line, **no grid**) | a plain model over the agent set | `BeerGameModel`, no `mesa.space` |
| Activation + time (one week, downstream→upstream) | `Model.step()` over `self.agents` | `for agent in self.agents:` |
| Seed (reproducibility) | `super().__init__(rng=<int>)` | `super().__init__(rng=int(seed))` |

### Why Mesa (and not a grid or a solver)

- **It is an ABM, not an optimization.** The question is "what global behaviour do these local order rules
  produce?", not "what is the optimal order policy?". There is no objective to hand to a solver — the
  *run* is the answer. That rules out OR-Tools/PyVRP (optimization) and SimPy/Ciw (resource-flow DES).
- **No space is needed.** Schelling (S02) and SIR (S03) use a `mesa.space` grid; the Beer Game is a tiny
  serial *network*, so the space is simply dropped. Each echelon is a real `mesa.Agent` holding its own
  forecast/order state, and the model steps them once per simulated week through `self.agents` — exactly the
  activation pattern the S02 Schelling template establishes, only without the grid.
- **Mesa's abstractions *are* the curriculum.** The `Agent`/`Model`/`AgentSet` vocabulary is the teaching
  point; the rules are fully visible in-repo, not hidden in a blackbox.

## 2. How it is wired (the concrete API/approach)

**Activation is deterministic and serial, not shuffled.** The general Mesa pattern is
`self.agents.shuffle_do("step")` (random order). The Beer Game deliberately does **not** shuffle: the agents
are created retailer → factory, so `self.agents` (the model's `AgentSet`) iterates in that creation order,
and `Model.step()` walks it in a plain loop:

```python
def step(self) -> None:
    incoming = float(self.demand[self.week])   # customer demand into the retailer
    for agent in self.agents:                  # retailer → wholesaler → distributor → factory
        incoming = agent.place_order(incoming) # each order becomes the next stage's demand
    self.week += 1
```

That fixed downstream→upstream order is the activation regime the Beer Game *needs*: a downstream echelon
must place its order before its upstream neighbour acts on it, so `incoming` carries the freshly-placed
order one stage up per iteration. Because each stage's order at week `t` still depends only on its incoming
order at week `t`, this tick-by-tick cascade is mathematically identical to a whole-horizon vectorized
sweep — the emitted trace is byte-for-byte unchanged.

**Lazy Mesa import.** Mesa (and its closure: pandas/scipy/networkx) is heavy, so the `EchelonAgent` +
`BeerGameModel` classes are built **lazily** inside `_models()` and cached, not at module top level.
Importing the scenario module (the `Scenario` subclass + `variants()`/`param_specs`) therefore needs **zero
heavy deps** (only numpy, which the live worker already has); Mesa is imported only when `run()` actually
executes a simulation. This keeps `import simlab.registry` cheap.

**Determinism.** `Model(rng=int(seed))` seeds `self.rng` — a NumPy `Generator` identical to
`np.random.default_rng(seed)` — which is the *only* source of randomness (the AR(1) noisy-demand pattern).
Same `(params, seed)` → same trace. This is the lab's "replay = truth" contract.

**The solve loop** (`BeerGameScenario.run`): build the seeded `BeerGameModel`, call `model.step()` once per
week, then read each echelon's recorded `orders` list, compute the bullwhip ratios against `Var(d)`, and
package the customer-demand + four order series and the five KPIs into the standard `ChartTrace`. In ABM
there is no separate "solver" step — the iterated `step()` *is* the solve.

## 3. The lane for this scenario: **live**

The lab classifies each scenario into a lane by a measured **4-gate AND rule** (`classify_lane` in
`simlab/core/scenario.py`): a scenario is `live` only if it is **pure-Python**, its **wheel closure is in
`LIVE_WHEELS`**, it **runs < 3 s** in the in-browser Worker, and it emits a **< 1 MB** trace.

**S05 passes the gate with huge margin and is tagged `live`** in
[`manifests/s05_beergame.json`](../../../manifests/s05_beergame.json) (and on every variant). The recorded
gate for the variants shows `run_ms` under 1 ms and `trace_bytes ≈ 2.5–2.7 KB` — far inside the 3 s / 1 MB
limits — and the scenario's wheel closure (`numpy`, `mesa`) is within `LIVE_WHEELS`. So the slider re-runs
the **real** model in the browser via Pyodide; "live" is the slider responsiveness, not a different model.

> **Why S05 is live even though Mesa has a heavy closure.** Mesa 3 was *measured* to run in Pyodide, so
> `mesa` is in `LIVE_WHEELS` (`simlab/core/scenario.py`) alongside `numpy`; what cannot be served live is
> Mesa's **SolaraViz** server, not the model itself. The authoritative per-scenario verdict is the
> **manifest gate**, which is measured: the Beer Game's tiny model (4 agents, ~52 weeks, numpy-only at
> runtime) clears the live bar with huge margin, so S05's manifest records `lane: "live"`. The
> [Mesa framework node](../../frameworks/04_mesa.md) carries the same framing. Either way the invariant
> holds — because a run is a pure function of `(params, seed)`, a live Pyodide run is **byte-equal** to the
> committed `data/artifacts/...` trace; the build verifies that equality, so live and precomputed render
> through one code path.

The first paint plays a tiny precomputed trace instantly while Pyodide warms in the background; once warm,
slider edits run live. See the live-lane guide:
[../../guides/02_live-lane-pyodide.md](../../guides/02_live-lane-pyodide.md).

## 4. Cross-references

- Framework node (install / usage / applying + verified example):
  [../../frameworks/04_mesa.md](../../frameworks/04_mesa.md)
- Mesa "applying it" (formalize → solve → trade-offs): [../../frameworks/04_mesa/03_applying.md](../../frameworks/04_mesa/03_applying.md)
- Problem-type guide: [../../problem-types/02_agent-based-modeling.md](../../problem-types/02_agent-based-modeling.md)
- Live-lane mechanics: [../../guides/02_live-lane-pyodide.md](../../guides/02_live-lane-pyodide.md)
- Scenario source: [`../../../simlab/scenarios/s05_beergame.py`](../../../simlab/scenarios/s05_beergame.py)

---

Continue: [04_results-and-reading.md](./04_results-and-reading.md).
