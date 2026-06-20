# 09 · PyVRP — state-of-the-art vehicle routing (HGS)

**PyVRP** (MIT) is a competition-grade open-source solver for the **Vehicle
Routing Problem** and its mainstream variants — CVRP, VRPTW, pickup-and-delivery,
multi-depot, multi-trip, heterogeneous fleet, prize-collecting. It implements
**Hybrid Genetic Search (HGS)**, the lineage that won the 2021 DIMACS VRPTW
challenge and the static EURO-NeurIPS 2022 competition, wrapping a fast C++ core
in a clean Python `Model` builder. You describe an instance, give it a stopping
budget and a seed, and it returns the best feasible routing it found — and it
keeps tightening the routes the longer you let it run.

**When to use it:** when the task genuinely *is* routing ("which vehicle visits
which stops, in what order, respecting capacity/time-windows, to minimise
distance or cost?") **and solution quality matters**. In this lab PyVRP is the
**state-of-the-art contrast to OR-Tools**: on the identical instance, the
specialised HGS solver finds materially shorter routes than a general solver's
defaults, which is the whole point of showing both. Because it is **native C++ /
Python it cannot run in the browser**, so it lives in the **precompute lane** —
it runs offline to generate committed solution traces, and the web app replays
them. This pairing drives scenario **S08 (VRP/VRPTW)**, whose optimized routes
are then handed to a **SimPy** replay to demonstrate that an optimum on paper is
fragile under stochastic delay (the lab's optimize-then-simulate lesson).

## Read in order

1. [`01_installation.md`](./09_pyvrp/01_installation.md) — exact `pip` line,
   `requirements-precompute.txt` lane, installed version (**PyVRP 0.13.4** on
   **Python 3.13.0**), dependencies, platform/CUDA notes.
2. [`02_usage.md`](./09_pyvrp/02_usage.md) — the `Model` API and core concepts,
   the integer-engine / determinism / index-numbering gotchas, and the runnable
   example walked through with its real captured output.
3. [`03_applying.md`](./09_pyvrp/03_applying.md) — how to formalize a routing
   problem and solve it, the lab scenario that uses it, the honest research
   trade-offs, and when to pick PyVRP vs OR-Tools / VROOM / OSMnx+NetworkX.
4. [`example.py`](./09_pyvrp/example.py) — a minimal, deterministic CVRP solved
   with HGS (depot + 8 clients, tight capacity), runnable from the repo root.

## Scenarios that use it

- **S08 — Vehicle Routing Problem** (precompute lane; OR-Tools baseline **+**
  PyVRP SOTA contrast → SimPy replay):
  [`simlab/scenarios/s08_vrp.py`](../../simlab/scenarios/s08_vrp.py) ·
  manifest [`manifests/s08_vrp.json`](../../manifests/s08_vrp.json)

## Related

- Problem-type guide: [Optimization & routing](../problem-types/03_optimization-routing.md)
- Lab lanes: [precompute pipeline](../guides/01_precompute-pipeline.md) ·
  [live (Pyodide) lane](../guides/02_live-lane-pyodide.md)
- Upstream: PyVRP <https://github.com/PyVRP/PyVRP> · HGS paper
  <https://arxiv.org/abs/2403.13795>
