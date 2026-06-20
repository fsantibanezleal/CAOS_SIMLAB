# Use cases — the section index

This is the index for the **11 worked scenarios** of CAOS_SIMLAB (S01–S11): each one is a real problem solved
end to end — the assumptions, the formalization, the dedicated solver(s) applied, and how to read the
results. Together they exercise every problem type and almost every framework in the lab.

## How to read this wiki

- **The numbering (`01`…`11`) is the scenario order S01–S11.** The early scenarios are the lightweight
  *live* exhibits (queues, ABM classics); the later ones are the heavier *precompute* hybrids (optimize-then-
  simulate routing, the Monte-Carlo study, the mine haul). Read top to bottom for the full progression, or
  jump to the scenario you need.
- **Each entry links to that scenario's own node** (`./use-cases/<NN_sNN_slug>.md`), and **each node has its
  own folder** (`./use-cases/<NN_sNN_slug>/`) holding the read-in-order pages — *assumptions · formalization ·
  solvers applied · results and reading*.
- **Lane.** *live* = runs in the visitor's browser (Pyodide / NetLogo Web); *precompute* = computed offline in
  the local `.venv`, committed as a seeded trace the static site replays. Either way, *replay = truth*.

## The scenarios

1. [**01 · S01 — Bank / Clinic Queue (M/M/c)**](./use-cases/01_s01_queue.md) — the DES "hello world": waiting
   times that explode as the place gets busy; SimPy live, validated against Erlang-C and a Ciw replication.
   *(DES · live)*
2. [**02 · S02 — Schelling Segregation**](./use-cases/02_s02_schelling.md) — strong segregation emerging from
   a mild local preference on a lattice city; Mesa 3 (+ NetLogo Web). *(ABM · live)*
3. [**03 · S03 — SIR Epidemic**](./use-cases/03_s03_sir.md) — an epidemic wave from per-cell local-contact
   rules on a grid; Mesa 3 (+ NetLogo Web). *(ABM · live)*
4. [**04 · S04 — Emergency Department Flow**](./use-cases/04_s04_ed.md) — a tandem priority queueing network
   (triage → treatment) with a daytime surge; SimPy multi-stage priority DES. *(DES · live)*
5. [**05 · S05 — Beer Game (bullwhip)**](./use-cases/05_s05_beergame.md) — demand swings amplified upstream in
   a serial supply chain under base-stock policies; Mesa 3 feedback/delay. *(ABM · live)*
6. [**06 · S06 — Job-Shop Scheduling**](./use-cases/06_s06_jobshop.md) — minimize makespan on the
   Fisher–Thompson `ft06` benchmark; pure combinatorial optimization with OR-Tools CP-SAT. *(Optimization ·
   precompute)*
7. [**07 · S07 — Construction Haul Routing**](./use-cases/07_s07_haul.md) — the haul route switches at a
   critical grade, behind a shared-loader bottleneck; OR-Tools + SimPy + OSMnx/NetworkX. *(Optimization + DES ·
   precompute)*
8. [**08 · S08 — Vehicle Routing (CVRP)**](./use-cases/08_s08_vrp.md) — minimum-distance capacitated routes,
   the same instance through two SOTA engines; OR-Tools + PyVRP + SimPy. *(Optimization · precompute)*
9. [**09 · S09 — Ambulance Dispatch**](./use-cases/09_s09_ambulance.md) — nearest-available dispatch over a
   city graph, a spatial multi-server EMS queue; OR-Tools + SimPy + graph. *(Optimization + DES · live)*
10. [**10 · S10 — Monte-Carlo CI Study**](./use-cases/10_s10_montecarlo.md) — how many seeded replications to
    match the Erlang-C answer; the running mean and 95% CI over the S01/S04 base models. joblib (+ CuPy/Numba)
    + SciPy. *(Monte-Carlo · precompute)*
11. [**11 · S11 — Mine Multi-Destination Haul**](./use-cases/11_s11_minehaul.md) — a blend LP picks phase
    tonnages for a target grade, then a fixed fleet realizes the plan over haul roads; OR-Tools GLOP LP +
    SimPy. *(Optimization + DES · precompute)*

## Scenario → problem type

| Problem type | Scenarios |
|---|---|
| [Discrete-Event Simulation](./problem-types/01_discrete-event-simulation.md) | S01, S04 (+ the DES legs of S07/S08/S09/S11, and S10's base models) |
| [Agent-Based Modeling](./problem-types/02_agent-based-modeling.md) | S02, S03, S05 |
| [Optimization & Routing](./problem-types/03_optimization-routing.md) | S06, S07, S08, S09, S11 |
| [Monte-Carlo & Replications](./problem-types/04_monte-carlo-replications.md) | S10 (the dedicated exhibit; the methodology applies to every stochastic scenario) |

## See also

- [README.md](./README.md) — the documentation home, the scenario → tool map, and the honesty notes.
- [problem-types.md](./problem-types.md) — the decision map per problem type.
- [frameworks.md](./frameworks.md) — install / usage / applying per engine.
- [guides.md](./guides.md) — the runtime how-tos (precompute pipeline, live lane, GPU lane).
- [architecture.md](./architecture.md) — the deterministic-replay, two-plane design and the measured gate.
