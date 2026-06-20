# Frameworks — the section index

This is the index for the **18 framework nodes** of CAOS_SIMLAB: for each problem type, the
dedicated state-of-the-art tool, documented the same way — *what it is, how to install it, how to use
it, how to apply it* — with a runnable, verified `example.py` where the framework is Python.

## How to read this wiki

- **The numbering (`01`…`18`) is the reading order.** It walks problem type by problem type:
  discrete-event simulation first, then agent-based modeling, then optimization & routing, then the
  Monte-Carlo / GPU lane, and finally a reference chapter on heavy/GPU ABM. Read top to bottom for the
  full curriculum, or jump straight to the tool you need.
- **Each entry below links to that framework's own node** (`./frameworks/<NN_slug>.md`), and **each node
  has its own folder** (`./frameworks/<NN_slug>/`) holding the same three pages —
  `01_installation.md`, `02_usage.md`, `03_applying.md` — plus a verified `example.py` (except the two
  non-Python nodes: NetLogo Web is JS, and the GPU-ABM chapter is reference-only).
- **Read a node in order:** start at its index, then installation → usage → applying, then run the
  example. The node index always ends with the lab scenarios that use the framework and links to its
  sibling tools and problem-type guide.
- **Two lanes underlie everything:** a lightweight **live** lane (SimPy/Mesa in the browser, NetLogo Web
  natively) and a no-restriction **local precompute** lane that runs the heavy dedicated engines and
  commits a seeded trace the static site replays. Each node states which lane it lives in.

---

## Discrete-Event Simulation (DES)

Entities flowing through activities and queues for limited resources under randomness — when the
*waiting* is what you measure. See the [DES problem-type guide](./problem-types/01_discrete-event-simulation.md).

1. [**01 · SimPy**](./frameworks/01_simpy.md) — the lab's primary, process-based DES engine; pure-Python, zero deps, runs live in the browser via Pyodide.
2. [**02 · Ciw**](./frameworks/02_ciw.md) — queueing-network DES whose strength is validating the simulation against closed-form queueing theory (Erlang-C).
3. [**03 · Salabim**](./frameworks/03_salabim.md) — DES with built-in 2D/3D animation and offline video export; the precompute-lane movie-maker.

## Agent-Based Modeling (ABM)

Many autonomous agents with local rules, and a global pattern that *emerges*. See the
[ABM problem-type guide](./problem-types/02_agent-based-modeling.md).

4. [**04 · Mesa**](./frameworks/04_mesa.md) — the canonical Python ABM framework and the lab's default ABM engine (Schelling, SIR, Beer Game).
5. [**05 · Mesa-Geo**](./frameworks/05_mesa-geo.md) — Mesa's geospatial extension: agents whose position is a real geometry on a real map.
6. [**06 · JuPedSim**](./frameworks/06_jupedsim.md) — microscopic pedestrian dynamics (C++ core) for crowd / evacuation flow where physical space changes the answer.
7. [**07 · NetLogo Web**](./frameworks/07_netlogo-web.md) — the classic NetLogo language compiled to JavaScript; the live, instant-play in-browser ABM engine (no Pyodide).

## Optimization & Routing

"What is the *best* decision?" — the complement to the simulators. See the
[Optimization & Routing guide](./problem-types/03_optimization-routing.md).

8. [**08 · OR-Tools**](./frameworks/08_ortools.md) — Google's optimization engine (CP-SAT, Routing, GLOP); the lab's optimize-then-simulate workhorse.
9. [**09 · PyVRP**](./frameworks/09_pyvrp.md) — competition-grade vehicle-routing solver (Hybrid Genetic Search); the state-of-the-art VRP contrast to OR-Tools.
10. [**10 · NetworkX**](./frameworks/10_networkx.md) — the graph + shortest-path layer (Dijkstra, A*, k-shortest paths) that feeds the optimizers and simulators.
11. [**11 · OSMnx**](./frameworks/11_osmnx.md) — real OpenStreetMap street networks as routable NetworkX graphs: cost matrix + drawable route geometry.

## Monte-Carlo & GPU

Report an *interval, not a point* — and an honest look at when a GPU actually helps. See the
[Monte-Carlo & Replications guide](./problem-types/04_monte-carlo-replications.md).

12. [**12 · joblib**](./frameworks/12_joblib.md) — the v1 default CPU-parallel driver for seeded Monte-Carlo replications; one line of order-preserving parallelism.
13. [**13 · scipy.stats**](./frameworks/13_scipy-stats.md) — the statistics layer: turns a sample of replications into an honest confidence interval (z and Student-t).
14. [**14 · Numba**](./frameworks/14_numba.md) — JIT-compiled kernels, one source to two targets (`@njit` CPU + `@cuda.jit` GPU); the S10 GPU exhibit on identical arithmetic.
15. [**15 · CuPy**](./frameworks/15_cupy.md) — NumPy/SciPy on the GPU (same array API on the device); the optional array-Monte-Carlo GPU appendix, CUDA-detect with CPU fallback.
16. [**16 · Taichi**](./frameworks/16_taichi.md) — Python-embedded DSL for parallel field/grid kernels; the niche cellular-automata / diffusion engine that scales CPU→GPU.
17. [**17 · JAX**](./frameworks/17_jax.md) — XLA-compiled array library with `vmap`/`jit` and splittable RNG; the vectorized-functional alternative for batched replications.

## Reference chapter

18. [**18 · GPU-ABM chapter**](./frameworks/18_gpu-abm-chapter.md) — a *reference chapter* (not shipped) on the million-agent engines FLAME GPU 2 · ABMax · AMBER, and the honest reasons none is installed here.

---

## See also

- [docs/README.md](./README.md) — the documentation home, the scenario → tool map, and the honesty notes.
- Section indexes: [problem-types.md](./problem-types.md) (the decision map per problem type) ·
  [use-cases.md](./use-cases.md) (the 11 worked scenarios) · [guides.md](./guides.md) (the runtime how-tos).
- [architecture.md](./architecture.md) — the deterministic-replay, two-plane design and the measured gate.
- Pipeline guides: [precompute pipeline](./guides/01_precompute-pipeline.md) ·
  [live lane (Pyodide)](./guides/02_live-lane-pyodide.md) · [GPU lane](./guides/03_gpu-lane.md).
- Data policy + licenses: [../ATTRIBUTION.md](../ATTRIBUTION.md) · [../LICENSES.md](../LICENSES.md).
