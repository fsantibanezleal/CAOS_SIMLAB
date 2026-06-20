# Problem types — the section index

This is the index for the **four problem-type guides** of CAOS_SIMLAB: the decision maps that pick *which
kind of modelling* a question needs, and *which dedicated tool* answers it. Each guide says what the method
is, when to reach for it (and when not), the methods and KPIs it reports, the honest tool map, and how it
maps onto the lab's scenarios.

## How to read this wiki

- **The numbering (`01`…`04`) is the reading order.** It walks the lab's four families: discrete-event
  simulation first, then agent-based modeling, then optimization & routing, and finally the Monte-Carlo /
  replications methodology that sits underneath every stochastic scenario. Read top to bottom for the full
  decision curriculum, or jump straight to the family your question belongs to.
- **Each entry links to that family's own node** (`./problem-types/<NN_slug>.md`), and **each node has its
  own folder** (`./problem-types/<NN_slug>/`) holding the read-in-order pages — *what it is · when to use it
  · methods & KPIs · tools · scenarios* (the DES node adds an *honesty curriculum* page).
- **The dividing question.** *Simulate* (DES, ABM) vs *decide* (Optimization & Routing); and across both, the
  Monte-Carlo guide is the methodology for turning noisy single runs into an honest interval.

## The four problem types

1. [**01 · Discrete-Event Simulation (DES)**](./problem-types/01_discrete-event-simulation.md) — entities
   flowing through activities and queues for limited resources under randomness, when the *waiting* is what
   you measure. Tools: SimPy · Ciw · Salabim.
2. [**02 · Agent-Based Modeling (ABM)**](./problem-types/02_agent-based-modeling.md) — many autonomous agents
   with local rules, and a global pattern that *emerges* (segregation, epidemics, the bullwhip). Tools: Mesa ·
   Mesa-Geo · NetLogo Web · JuPedSim.
3. [**03 · Optimization & Routing**](./problem-types/03_optimization-routing.md) — "what is the *best*
   decision?" — schedules, routes, paths — then handed to a simulator to stress-test under uncertainty.
   Tools: OR-Tools · PyVRP · NetworkX · OSMnx.
4. [**04 · Monte-Carlo & Replications**](./problem-types/04_monte-carlo-replications.md) — report an
   *interval, not a point*: replications, confidence intervals, warm-up bias, and the honest verdict on when a
   GPU actually helps. Tools: joblib · SciPy · CuPy/Numba/Taichi/JAX.

## See also

- [README.md](./README.md) — the documentation home, the scenario → tool map, and the honesty notes.
- [frameworks.md](./frameworks.md) — the 18 framework nodes (install / usage / applying + a verified example).
- [use-cases.md](./use-cases.md) — the 11 worked scenarios, each solved end to end.
- [guides.md](./guides.md) — the runtime how-tos (precompute pipeline, live lane, GPU lane).
- [architecture.md](./architecture.md) — the deterministic-replay, two-plane design and the measured gate.
