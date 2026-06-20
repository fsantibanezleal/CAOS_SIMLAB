# 01 · Assumptions — the canonical instance, scope & assumptions

> Source of truth: [`../../../simlab/scenarios/s11_minehaul.py`](../../../simlab/scenarios/s11_minehaul.py)
> (`simlab/scenarios/s11_minehaul.py`) and the scenario's Context block in the web Experiments page.
> Nothing here is invented — every number is read from the code.

## The story

A mine runs one **shift**. Ore is loaded at several **phases** (load points), each with a fixed ore
**grade**, and hauled by a **fixed fleet** of trucks to three kinds of **destination**:

- a **plant** — the final sink, which must be fed at a **target grade** within a tolerance band and up to
  a **demand** in tonnes;
- a **dump** — the waste sink for low-grade / excess production;
- one or more **stockpiles** — an intermediate node that is a *sink* (trucks tip into it) and, once it
  holds enough material, a *source* (trucks draw from it on later trips), tracked by a level `ℓ(t)`.

Two optimization problems are **coupled**. First a linear program (the *plan*) chooses how many tonnes to
draw from each phase so the **blended** plant feed lands on the grade target. Then the fixed fleet must
**execute** that plan over real haul roads inside the shift. The teaching point: a plan that is optimal on
paper degrades when an under-sized fleet cannot deliver it — and the **grade slips first**.

## The canonical instance (defaults from the code)

A 14×14 grid of road junctions with a deterministic "hills" elevation field (a sum of Gaussian bumps; no
RNG). Stations sit spread across the map so haul routes are long and wind through the terrain:

| Element | Where / value (default) | Code reference |
|---|---|---|
| Grid | 14 × 14 junctions | `ParamSpec("grid", …, 14)` |
| Plant | top-right corner | `plant_node = at(0.88, 0.84)` |
| Phase · low (grade 1.6) | top-left — **near** the plant | `phase_nodes[0] = at(0.14, 0.86)` |
| Phase · mid (grade 2.5) | bottom-right — near | `phase_nodes[1] = at(0.86, 0.16)` |
| Phase · high (grade 3.4) | **far** bottom-left corner | `phase_nodes[2] = at(0.10, 0.12)` |
| Dump | bottom edge | `dump_node = at(0.50, 0.08)` |
| Stockpile | interior, off the central wall | `stock_node = at(0.30, 0.40)` |
| Phase grades | `(1.6, 2.5, 3.4)` low / mid / high | `PHASE_GRADES` |

Key fixed constants (module-level, not exposed as sliders):

- **Truck capacity** `q = 2.0` t per trip (`TRUCK_CAP`).
- **Load time** `1.5`, **tip time** `0.5`, **speed** `1.0` (`LOAD_TIME`, `TIP_TIME`, `SPEED`).
- **Uphill penalty** `ρ = 6.0` on loaded climbs (`ROAD_GRADE`) — strong, so loaded routes visibly wind
  around hills.
- **Stockpile capacity** `60.0` t (`stock_cap`).
- **Nominal production** `80.0` t — a fixed reference used to size the dump flow (`nominal_production`).

Tunable parameters (`param_specs`), default · [min, max, step]:

| Param (`code name`) | Default | Range | Meaning |
|---|---|---|---|
| Grid (`grid`) | 14 | 12–18, 1 | grid side length |
| Trucks (`n_trucks`) | 6 | 1–16, 1 | fleet size `K` |
| Plant demand (`plant_demand`) | 60.0 | 10–160, 5 | `D` tonnes to the plant |
| Plant grade target (`grade_target`) | 2.9 | 1.5–3.4, 0.1 | `g*` |
| Grade band ± (`grade_tol`) | 0.15 | 0.05–0.5, 0.05 | `τ` |
| Stocks (`n_stocks`) | 1 | 0–1, 1 | whether a stockpile exists |
| Initial stock (`init_stock`) | 0.0 | 0–60, 5 | pre-built stock tonnes |
| Stock ore grade (`stock_grade`) | 3.0 | 1.5–3.4, 0.1 | grade of pre-built stock |
| Wall on a haul road (`barrier`) | 0 | 0–1, 1 | L-shaped wall on the rich phase's road |
| Shift length (`horizon`) | 90.0 | 30–240, 10 | `H`, the shift the fleet runs in |

> Note: the variant builder `v(...)` sets `hz=145.0` as its own default for the shipped variants, so the
> committed traces use a 145-unit shift unless a variant overrides it (e.g. the surge variants extend it).

## What IS modeled

- **One shift** with phases, grades, demand, tolerance and per-phase **availability** all **given** as
  inputs (the per-phase availability is a model cap, `supply = demand * 0.7` per phase, not exogenous
  geology).
- The **optimal blend plan**: a linear program that mixes phase tonnages to hit the plant grade target
  while meeting demand and respecting each source's availability.
- **Graded haul roads**: every source→destination pair is routed by Dijkstra shortest path on the grid,
  under an edge cost that penalizes only **uphill** loaded travel; the empty return uses plain distance.
- **Execution by a fixed fleet**: `K` trucks each run a real `simpy` process (drive → load → graded haul
  → tip → return); each load point is a **shared `simpy.Resource`** loader, so two trucks aimed at the
  same phase genuinely **queue** for it. Dispatch sends a free truck to the feasible flow it can reach /
  the flow that is furthest behind, with the plant kept as priority.
- **Stockpile dynamics**: the level `ℓ(t)` rises on tip-in and falls on draw-out; a stock can only source
  once it holds at least one truck-load.
- **Three destination kinds at once**: plant-feed flows, a stock-fill (or stock-drain) flow, and a dump
  flow run concurrently, with a couple of auxiliary trucks owning the housekeeping (dump + stock) flows.

## What is NOT modeled (out of scope)

These would each be a *different* tool or scene, deliberately left out:

- **Period scheduling / block sequencing** — the LP plans a single shift, not a multi-period mine plan.
- **Cut-off grade economics** (Lane's algorithm) — which material is ore vs waste is *given*, not derived.
- **Real-time re-optimizing dispatch** — the LP is **static**: it is solved once up front and never
  re-optimized live as the shift unfolds.
- **Stochastic variability** — there are **no random variates**. Truck capacity and service times are
  fixed; the fleet's staggered release and the dispatch policy are fixed functions of the inputs. The
  scenario seed is **inert** (carried for the trace schema, but nothing samples from it).

## Determinism

The whole run is a **pure function of `(params, seed)`** and reproduces **byte-for-byte**. The LP is
solved by GLOP's deterministic simplex; the DES has no stochastic variates and uses a fixed truck-release
stagger (`0.03 * truck`). Because OR-Tools GLOP is **native** code that cannot run in the browser
(Pyodide), this scenario lives **only in the precompute lane**: the committed trace replays the GLOP plan
plus the SimPy fleet realizing a (possibly degraded) version of it. See
[03 · Solvers applied](./03_solvers-applied.md) for the lane detail.

## Next

- The exact math: [02 · Formalization](./02_formalization.md).
- Back to the node index: [11 · S11 — Mine multi-destination haul](../11_s11_minehaul.md).
