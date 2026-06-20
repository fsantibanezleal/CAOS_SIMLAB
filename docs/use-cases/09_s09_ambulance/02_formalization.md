# 02 · Formalization — S09 Ambulance Dispatch

The math, pulled **verified** from this scenario's Context block in `web/src/pages/Experiments.tsx`
(`S09Desc`) and from [`../../../simlab/scenarios/s09_ambulance.py`](../../../simlab/scenarios/s09_ambulance.py).
Symbols and equations below are kept consistent with the code; the canonical instance and scope are in
[01 · Assumptions](./01_assumptions.md).

## Model class

A **spatial multi-server queue with state-dependent service** — an EMS system of type **M/G/c**, where the
"service" of one job is the *full* travel → treat → transport → return cycle, and the routing rule is
**nearest-available**. There is no closed form for this (nearest-available, spatial, state-dependent), so it
is solved as a seeded **discrete-event simulation**.

## Sets

| Symbol | Meaning |
|---|---|
| `V` | grid junction nodes, with `\|V\| = g²` |
| `S ⊆ V` | stations, with `\|S\| = n_s` |
| `A` | ambulance fleet, with `\|A\| = c` |
| `h ∈ V` | the single central hospital (centre node) |

## Parameters

| Symbol | Meaning | Default |
|---|---|---|
| `λ` | call rate (calls/hour) | `12` |
| `τ` | response threshold (min) | `8` |
| `T` | horizon (min) | `90` |
| `v` | travel speed (grid-units/min) | `1.3` |
| `s₀` | on-scene treatment time (min) | `2` |

## Random variables

The call stream is a Poisson process: inter-arrival gaps are exponential at the per-minute rate, arrival
instants accumulate, and call locations are uniform over the grid.

```math
\Delta_k \sim \mathrm{Exp}\!\left(\tfrac{\lambda}{60}\right),
\qquad t_k = t_{k-1} + \Delta_k,
\qquad c_k \sim \mathrm{Unif}(V).
```

In code: `t += rng.exponential(1.0 / rate_per_min)` with `rate_per_min = λ/60`, looping until `t ≥ T`, and
`cn = rng.integers(0, g*g)`. The list `[(round(tₖ,3), cₖ)]` is fixed up front.

## State & decision variables

- **State** — for each ambulance `i`: its current `node_i` and its **free-time** `f_i` (the instant it
  becomes available again). All units start free at `t = 0`, parked at their home station.
- **Decision** — for each call `k`, the **assignment** `i⋆(k)` of that call to one unit.

## Travel cost

Node-to-node distance `d(u, w)` is the **shortest path length** on the distance-weighted road graph; travel
time over that path is `d / v`. (In code this is `router.length(u, w) / speed`, where `router` is a NetworkX
single-source-Dijkstra layer over the `_geo` grid — see [03 · Solvers applied](./03_solvers-applied.md).)

## Dynamics — dispatch and the service cycle

When call `k` arrives at instant `t_k`, each unit becomes **ready** at `r_i = max(t_k, f_i)` (it must finish
whatever it is doing). The **earliest-arrival** unit is chosen:

```math
i^\star = \arg\min_{i \in A}\left[\, \max(t_k, f_i) + \frac{d(\mathrm{node}_i,\, c_k)}{v} \,\right].
```

This is the **exact nearest-available** rule: the score is the soonest the unit could physically be at the
scene, accounting for both its position and how long it stays busy. The chosen unit then runs the cycle,
chaining the legs and advancing its free-time:

```math
t_{\mathrm{sc}} = r_{i^\star} + \frac{d(\mathrm{node}_{i^\star}, c_k)}{v},
\qquad
t_{\mathrm{tr}} = t_{\mathrm{sc}} + s_0,
\qquad
f_{i^\star} = t_{\mathrm{tr}} + \frac{d(c_k, h) + d(h, \mathrm{home}_{i^\star})}{v}.
```

That is: arrive at the **scene** at `t_sc`, finish **treatment** at `t_tr = t_sc + s₀`, then transport to the
hospital `h` and return to the unit's **home** base; the unit is free again at `f_{i⋆}`. In code (`_dispatch`)
the three legs `base→scene`, `scene→hospital`, `hospital→home` are expanded into timed legs by `timed_legs`
and appended to the agent's trace; the unit's `node` resets to `home` and its `free` advances to `f_{i⋆}`.

> **Note on geometry.** The return leg in the free-time update is `d(c_k, h) + d(h, home)` because the unit
> goes scene → hospital → base; the code routes `scene → hospital` then `hospital → home` as two shortest
> paths, so the chained return distance is exactly `d(c_k, h) + d(h, home)`.

## KPIs

The **response time** of a call is the time from arrival to the unit reaching the scene:

```math
R_k = t_{\mathrm{sc}} - t_k .
```

Over the `n` served calls, the lab reports mean response, the **p90** response, and the
**coverage** within the threshold — the fraction of calls reached within `τ`. The p90 is a
**nearest-rank** estimate (`sorted_responses[min(n−1, ⌊0.9·n⌋)]`), **not** an interpolated percentile; for
the small per-variant call counts here (e.g. `n = 10` → index 9) that index lands on the run's slowest
response, so read it as "roughly the worst-case tail," not a smoothed quantile:

```math
\mathrm{cov} = \frac{1}{n}\sum_{k=1}^{n} \mathbf{1}\{R_k \le \tau\}.
```

Finally the **offered load** `ρ` normalizes total server-busy time against the fleet's capacity over the
horizon. It is an *offered* utilization and **can exceed 1** when demand outstrips the fleet:

```math
\rho = \frac{\sum_{k} \bigl(f_{i^\star(k)} - r_{i^\star(k)}\bigr)}{c \cdot T}.
```

In code these surface as the trace `kpis`: `calls`, `mean_response`, `p90_response`, `coverage_pct`,
`load_pct` (= `100·busy_time / (c·T)`), and `n_ambulances`. `busy_time` accumulates `f_{i⋆} − r_{i⋆}` per
dispatch; `responses` collects `t_sc − t_k`.

---

Next: [03 · Solvers applied](./03_solvers-applied.md) · Back to the [node index](../09_s09_ambulance.md).
