# 01 · Assumptions — S09 Ambulance Dispatch

The canonical instance this node documents, then the scope: what *is* and what *isn't* modeled. Everything
here is read off the scenario code ([`../../../simlab/scenarios/s09_ambulance.py`](../../../simlab/scenarios/s09_ambulance.py))
and the shared road graph in [`../../../simlab/scenarios/_geo.py`](../../../simlab/scenarios/_geo.py); the
formalization that turns it into math is in [02 · Formalization](./02_formalization.md).

## The canonical instance

A **grid-city**: a `g × g` lattice of street junctions (default `g = 8`, so 64 nodes) with road segments
between four-neighbours, built on the shared `GridNetwork` in `_geo.py`. Distances are euclidean segment
lengths on the unit grid (spacing `1.0`). A finite fleet of ambulances sits at one or more **stations**;
calls fire over a window and each is served by whichever unit can **reach it earliest**.

| Element | Canonical value | Where it comes from |
|---|---|---|
| Grid `g × g` | `g = 8` (64 nodes) | `ParamSpec("grid", …, 8, 5, 11)` |
| Ambulances `c` | `4` (range 1–10) | `ParamSpec("n_ambulances", …, 4, 1, 10)` |
| Stations `n_s` | `2` (range 1–5) | `ParamSpec("n_stations", …, 2, 1, 5)` |
| Call rate `λ` | `12` calls/hour (range 2–40) | `ParamSpec("call_rate", …, 12.0, 2.0, 40.0)` |
| Response target `τ` | `8` min (range 2–20) | `ParamSpec("threshold", …, 8.0, 2.0, 20.0)` |
| Horizon `T` | `90` min (range 30–300) | `ParamSpec("horizon", …, 90.0, 30.0, 300.0)` |
| Travel speed `v` | `1.3` (grid-units/min) | `speed = 1.3` in `run()` |
| On-scene time `s₀` | `2.0` min | `on_scene = 2.0` in `run()` |

**Where things sit.** Up to five candidate station positions are fixed as grid fractions —
`(0.2,0.2), (0.8,0.8), (0.8,0.2), (0.2,0.8), (0.5,0.5)` (`STATION_POS`) — and the first `n_s` of them are
snapped to the nearest grid node (`_station_node`); duplicates are dropped. The **single hospital** `h`
is always the centre node `(0.5, 0.5)`. Ambulances are assigned to stations **round-robin** (`amb[k]` →
`stations[k % len(stations)]`), so with 4 units and 2 stations each station holds two units.

**The call stream.** Inter-arrival gaps are exponential at `λ/60` per minute and call locations are uniform
over the 64 nodes. Crucially, the *entire* call list `(tₖ, cₖ)` is drawn **up front** from one seeded NumPy
`Generator` (`make_rng(seed)`) before the simulation starts — the stochastic content is fixed by
`(params, seed)` and does not depend on how the event scheduler interleaves. See
[03 · Solvers applied](./03_solvers-applied.md) for why this matters for determinism.

## What *is* modeled

- **Poisson call arrivals** with exponential inter-arrival times, **uniform** call locations on the grid.
- **Exact nearest-available dispatch**: each call goes to the unit with the earliest *feasible* scene
  arrival, honouring every unit's busy-until clock — not a static "nearest station", but who can actually
  get there first given who is still out.
- The **full service cycle** for the chosen unit: base → scene (travel), **on-scene treatment** (`s₀`),
  scene → **hospital** (transport), hospital → **home base** (return). The unit is busy for the whole cycle.
- **Shortest-path travel** on the real road graph (NetworkX Dijkstra), for both the dispatch metric (path
  *lengths*) and the committed trip geometry (full node *paths*).
- All four **KPIs**: mean response, p90 response, coverage within `τ`, and offered load `ρ`.

## What is *not* modeled (out of scope)

- **Time-varying traffic / congestion** — speed `v` is constant; travel time is purely geometric.
- **Severity triage** — every call is identical; no priority classes, no differentiated service.
- **Multiple hospitals** — there is exactly one central hospital; every patient is transported there.
- **Dynamic repositioning** — a freed unit always returns to its *home* base; no move-up / relocation
  policy reshuffles idle units toward uncovered demand.
- **Call abandonment and shift schedules** — no reneging, no crews going off-shift mid-horizon.
- **Stochastic service** — on-scene and travel times are *deterministic per leg*; the only randomness is
  the call geometry (when and where). This keeps the model an honest spatial queue rather than smuggling in
  extra noise.

## Reproducibility

The model is a **pure function of `(params, seed)`**. Variates are drawn once up front, NetworkX shortest
paths are deterministic on the fixed graph, and dispatch is a deterministic argmin — so the same inputs
yield the same trace byte-for-byte ("replay = truth"). The shared `_geo.py` grid is used unchanged, so on
the unit grid these NetworkX paths reproduce the lab's earlier plain-distance Dijkstra exactly.

---

Next: [02 · Formalization](./02_formalization.md) · Back to the [node index](../09_s09_ambulance.md).
