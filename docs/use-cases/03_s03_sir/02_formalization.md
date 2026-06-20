# 02 · Formalization — S03 SIR Epidemic

← Back to the use-case index: [../03_s03_sir.md](../03_s03_sir.md) ·
Assumptions: [01_assumptions.md](./01_assumptions.md)

The math of the model, pulled from the **verified** in-app Context block and the scenario source
([`s03_sir.py`](../../../simlab/scenarios/s03_sir.py)). Symbols match the code: `S, I, R = 0, 1, 2`.

---

## Model class

A **stochastic agent-based SIR on a 2-D grid** — a probabilistic cellular automaton, the discrete spatial
analogue of the continuous (mass-action) Kermack–McKendrick compartmental SIR. It is a **discrete-time
Markov process** over the joint cell-state configuration, with a **synchronous** update.

## Sets & indices

- `(i, j)` — a cell of the lattice, `i, j ∈ {0, …, n−1}`. Equivalently a flat row-major index
  `flat = j·n + i` (the order the grid is populated and the frame is serialized).
- `N(i, j)` — the **Moore neighbourhood**: the (up to) 8 cells touching `(i, j)`; the grid is **non-toroidal**
  so edge/corner cells have fewer neighbours.
- Compartments `{S, I, R}`.

## Parameters

| Symbol | Code | Meaning | Domain |
|---|---|---|---|
| `n` | `size` | grid side (population is `n²`) | int, 10–60 (default 38) |
| `β` | `beta` | infection probability **per infected neighbour** | 0.02–0.6 (default 0.20) |
| `γ` | `gamma` | recovery probability **per step** | 0.02–0.6 (default 0.20) |
| `i₀` | `init_infected` | initial infected fraction | 0.002–0.2 (default 0.02) |
| `T` | `steps` | maximum number of steps | int, 20–160 (default 80) |
| — | `seed` | RNG seed (reproducibility) | int |

## State variables

- `x_{ij}(t) ∈ {S, I, R}` — the health state of cell `(i, j)` at step `t` (the agent's `self.state`).
- `k_{ij}(t) = |{ (a,b) ∈ N(i,j) : x_{ab}(t) = I }|` — the number of **infected Moore-neighbours** of cell
  `(i, j)` (the code's `infected_neighbors()`), `0 ≤ k ≤ 8`.

There are no *decision* variables: ABM is **build-then-observe**, not optimize. The "answer" is the emergent
trajectory, not a prescribed control.

## Initial condition

Each cell independently starts Infected with probability `i₀`, else Susceptible:

```
x_{ij}(0) = I  with prob. i₀ ,   x_{ij}(0) = S  otherwise
```

If the seeded draw lights **no** cell, the centre cell is forced Infected (so a stochastic all-S start
cannot make the run inert). All draws use the seeded `self.random`, so the initial board is reproducible.

## Dynamics (the one synchronous sweep)

Per step, transitions are decided against the **start-of-step** configuration `x(t)` and applied together to
give `x(t+1)`.

**Infection (S → I).** A susceptible cell with `k` infected neighbours escapes each independent contact with
probability `(1 − β)`, hence:

```
P(S → I | k) = 1 − (1 − β)^k
```

Concretely the cell draws `u ~ U(0,1)` and becomes Infected iff `u < 1 − (1 − β)^k` (if `k = 0` it stays S;
the code skips the draw entirely when `k == 0`).

**Recovery (I → R).** An infected cell recovers with a fixed per-step probability, independent of the
neighbourhood, and `R` is absorbing:

```
P(I → R) = γ ,    P(R → ·) = 0
```

It draws another `u ~ U(0,1)` and becomes Recovered iff `u < γ`.

> **Update order is deterministic, not shuffled.** The sweep iterates the model's `AgentSet`
> (`self.agents`) in its **stable order**, collects the cells that flip into `new_infected` / `new_recovered`
> lists, then applies both lists *after* the scan. Because every read uses the unmodified `state`, the update
> is genuinely **synchronous** (all transitions are computed from `x(t)`), and because the order and the RNG
> are fixed, the run is reproducible.

## Reproduction number & epidemic threshold

Linking to the continuous SIR via the effective rates `β_eff ≈ ⟨k⟩·β` and `γ_eff = γ` gives the approximate
reproduction number and the **epidemic threshold** (the outbreak grows iff `R₀ > 1`):

```
R₀ ≈ (⟨k⟩ · β) / γ ,    R₀ > 1  ⟺  the outbreak takes off
```

where `⟨k⟩ ≤ 8` is the mean number of contacts on the Moore grid. The mean infectious period is `1/γ` steps.

## Final-size reference (well-mixed only)

The **attack rate** is the finally-recovered fraction `R(∞)`. Under *perfect mixing* it satisfies the
final-size relation:

```
1 − ρ = e^{−R₀ · ρ}       (ρ = R(∞), well-mixed reference)
```

The grid's **spatial structure** leaves the measured attack rate **below** this prediction, because contact
is local (the disease spreads as a front, not across a homogeneous population). The relation is a yardstick,
not the model's law.

## Objective / constraints

There is **no objective and no constraints** — this is a descriptive simulation, not an optimization. The
"output" is the observed trajectory and its summary KPIs.

## KPIs (outputs)

Per step the run records the population fractions and, at the end, the summary KPIs (verified in
`run()` → `tr.kpis`):

- **Series** (fractions of the `n²` population): `S(t)`, `I(t)`, `R(t)` over `x = 0, 1, … , T_run`.
- `peak_infected_frac` — `max_t I(t)` (the height of the infected peak).
- `peak_step` — the step at which the peak occurs.
- `attack_rate` — `R(T_run)`, the final recovered fraction (the attack rate).
- `duration_steps` — steps actually run (the loop **breaks early** the moment `I = 0`, i.e. burnout, or at
  the step cap `T`).
- `beta`, `gamma` — echoed for the HUD.

The artifact is a **`GridTrace`** (`schema = simlab.gridtrace/v1`): per-step frames of the flat row-major
cell array, the `S/I/R` time series, the KPIs, and a legend mapping `{S, I, R}` to bilingual labels +
theme colours. `analytic` is empty (an ABM has no closed form).

---

Next: [03 · Solvers applied](./03_solvers-applied.md) — how Mesa expresses all of this and the lane it runs
in.
