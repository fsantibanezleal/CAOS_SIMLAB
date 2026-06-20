# 02 · Formalization — sets, parameters, variables, model, KPIs

> Verified against the scenario's Context block (the `S11Desc` formalization in the web Experiments page)
> and the code in [`../../../simlab/scenarios/s11_minehaul.py`](../../../simlab/scenarios/s11_minehaul.py)
> (`simlab/scenarios/s11_minehaul.py`). The notation below is exactly the Context block's; the code
> identifiers are given in parentheses so each symbol maps to a real line.

## Model class

A **two-stage hybrid (plan-then-simulate)** with two coupled optimization problems:

1. a **linear program** (LP) for the plant **blend** — solved by **OR-Tools GLOP** (a simplex);
2. a **deterministic discrete-event simulation** (DES) for the **execution** — solved by **SimPy**.

A graph **shortest-path** problem (Dijkstra over a graded edge cost) links the two: it turns each
planned source→destination flow into a real haul time over the terrain.

## Sets

- **Phases / sources** `i ∈ S` — the load points, each a node `phase_nodes[i]` with grade `g_i` and an
  availability `a_i`. The default set is the three phases; when a stockpile is pre-built it joins `S` as a
  fourth source (`is_stock = True`).
- **Destinations** — the set `{ plant, dump, stocks }`. The plant is a sink with a grade target; the dump
  a waste sink; each stockpile a **sink-and-source** node.
- **Fleet** — `K` trucks (`n_trucks`), each a SimPy process.

## Parameters

| Symbol | Meaning | Code |
|---|---|---|
| `g_i` | ore grade of phase `i` (grades **straddle** the target) | `PHASE_GRADES = (1.6, 2.5, 3.4)` |
| `a_i` | per-source availability (a tonnage cap the plan may draw this shift) | `s["supply"] = demand * 0.7` |
| `D` | plant demand (tonnes) | `plant_demand` |
| `g*` | plant grade target | `grade_target` |
| `τ` | grade tolerance band (±) | `grade_tol` |
| `q` | truck capacity per trip | `TRUCK_CAP = 2.0` |
| `ρ` | uphill grade penalty on loaded edges | `ROAD_GRADE = 6.0` |
| `H` | shift length | `horizon` |
| `cap_stock` | stockpile capacity | `stock_cap = 60.0` |
| `ℓ(0)` | initial stockpile level | `init_stock` |
| — | load / tip time, speed | `LOAD_TIME=1.5`, `TIP_TIME=0.5`, `SPEED=1.0` |

The effective demand is clamped to available supply: `demand_eff = min(D, Σ_i a_i)` (`demand_eff`).

## Decision variables

- **Blend plan** `x_i ≥ 0` — tonnes drawn from each source `i` to the plant; the LP's decision
  (`xs = [solver.NumVar(0, a_i, …)]`, read out as `plan_x`).
- **Linearization slacks** `d⁺, d⁻ ≥ 0` — the positive/negative grade deviation, used to turn the
  absolute-value objective into an LP (`dpos`, `dneg`).
- **Dispatch (in the DES)** — which **flow** each free truck serves on each cycle. Not a closed-form
  variable but a **policy**: a free truck picks the feasible flow it can reach soonest / the flow furthest
  behind, with the plant tier first for plant-duty trucks (`pick_flow`).

## State variables (DES)

- The instant each shared **loader** becomes free (a `simpy.Resource` per source; FIFO by arrival).
- The **stockpile level** `ℓ(t)` (`stock["level"]`), with sampled frames `stock_frames` for the viz.
- Per-flow **delivered** progress `done_f` (`fl["done"]`) accumulated against each flow's `target`.
- Per-truck position and its accumulated travel **legs** (`agents[k]["legs"]`).

## (1) Blending LP (OR-Tools GLOP)

Choose `x_i ≥ 0` to **minimize the grade deviation**, linearized with slacks, subject to meeting demand,
respecting each source's availability, and defining the blended grade versus the target:

```
minimize   d⁺ + d⁻
subject to Σ_{i∈S} x_i = D
           0 ≤ x_i ≤ a_i
           Σ_{i∈S} g_i · x_i − g* · D = d⁺ − d⁻
```

In the code (with `D` replaced by `demand_eff`):

```python
solver.Add(sum(xs) == demand_eff)
solver.Add(sum(src[i]["grade"] * xs[i] for i in range(len(src))) - gt * demand_eff == dpos - dneg)
solver.Minimize(dpos + dneg)
```

Because the phase grades **straddle** the target `g*` and each availability `a_i` is capped, **no single
phase can satisfy the plant** — the optimal plan is a *genuine blend*. The realized plan grade is
`plan_grade = Σ_i g_i x_i / demand_eff` (`plan_grade`).

## (2) Graded route cost (Dijkstra)

Each source→destination pair is routed by the **shortest path** under an edge cost that penalizes **only
uphill** loaded travel (the empty return uses plain Euclidean distance):

```
cost(a → b) = dist(a, b) · ( 1 + ρ · max(0, elev_b − elev_a) )
```

Code: `loaded_cost(a, b)` and `net.shortest_path(a, b, cost=loaded_cost)` over the `GridNetwork`
"hills" terrain (a deterministic sum of Gaussian bumps, in `simlab/scenarios/_geo.py`). Paths are cached
per `(a, b, loaded)` key. The strong penalty `ρ = 6.0` makes the far high-grade phase's loaded haul
genuinely long — which is what an under-sized fleet cannot keep up with.

## (3) Execution dynamics (DES)

The `K` trucks cycle **drive empty → queue & hold loader → load → graded haul → tip → return**, then
re-decide. Each step is real SimPy:

- drive to the source on plain distance (`timed_legs(... )`), then `with loader_for(src).request(): yield req`
  — a **shared `simpy.Resource`** with capacity 1, so two trucks aimed at the same phase queue FIFO;
- hold the loader for `LOAD_TIME`, then haul the load on the **graded** cost to the destination;
- on a **plant** tip: accumulate `plant_tons += q` and `plant_grade += q · g_src`;
- on a **stock** tip: `ℓ += q`; on a **stock-source** load: `ℓ −= q` (only feasible when `ℓ ≥ q`);
- a truck **retires** when there is no time to *finish* a load before `H` (it undoes its claim if so),
  but a cycle already begun is recorded in full (the env drains all events with no `until`).

Dispatch tiers (`pick_flow`): **plant-duty** trucks serve `("plant",)` first then the housekeeping
`("dump","stock")`; **aux** trucks own `("dump","stock")` first then backstop the plant. Within the
housekeeping tier the truck takes the flow **furthest behind** (lowest `done/target`), breaking ties by
reachability — so the dump is always serviced and a buffer still fills.

## Objective vs KPIs

The LP's **objective** is the blend deviation `d⁺ + d⁻` (minimized on paper). What the simulation
**measures** after executing the plan:

- **Achieved plant grade** over what was *actually* delivered:

  ```
  ĝ = Σ (tons · g_src) / Σ tons
  ```

  (`grade_achieved`), with `grade_dev = |ĝ − g*|` and `in_band = 1 if |ĝ − g*| ≤ τ else 0`.

- **Plan adherence** over the **plant-feed** flows only (buffer/dump are housekeeping and do not dilute
  the metric):

  ```
  adherence = Σ_f delivered_f / Σ_f planned_f      (f ∈ plant flows)
  ```

  (`plan_adherence_pct`, capped at 100%).

- **Throughput counts:** `plant_tons`, `loads_plant`, `loads_dump`, `loads_stock`, and `n_trucks`.
- **Analytic block** (the *plan* vs realization, for honesty): `plan_grade`, `plan_x` (the LP allocation),
  `demand_eff`, `stock_peak`, `stock_end`.

The headline reading: **an optimal plan is necessary but not sufficient** — fleet size, not the LP, decides
whether the band is hit, and the **base 6-truck fleet does NOT land in band**. With `g* = 2.9`, `τ = 0.15`
the band is `[2.75, 3.05]`; the 6-truck `base` reaches only `ĝ = 2.547` (`grade_dev = 0.353`, ≈ 2.35× the
`τ = 0.15` tolerance — well outside the band), with `plan_adherence = 63.3%` and **`in_band = 0`**. The
realized blend (`ĝ = 2.547`) falls short of the plan's blend (`plan_grade = 2.9`) by **2.547 vs 2.9**: the
LP plan is optimal, yet the fleet cannot haul enough of the far high-grade phase before the shift ends, so
the executed mix is poorer than the plan. Only a **larger (over-trucked) fleet** lands `ĝ` inside `g* ± τ`:
the ~12-truck `overtrucked` variant reaches `ĝ = 2.86` (`grade_dev = 0.04`, `adherence = 100%`,
`in_band = 1`), and `surge12` (16 trucks) is likewise in-band; a `low_target` variant (looser target) also
fits with the 6-truck fleet. The genuinely **under-sized** 3-truck `undertrucked` case starves the far
high-grade phase hardest — `ĝ = 1.78`, `adherence = 33.3%`, far below the band — even though its LP plan was
optimal.

## Next

- How the tools actually solve this: [03 · Solvers applied](./03_solvers-applied.md).
- The variants and how to read the viz: [04 · Results & reading](./04_results-and-reading.md).
- Node index: [11 · S11](../11_s11_minehaul.md).
