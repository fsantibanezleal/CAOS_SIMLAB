# Mesa — installation

**Mesa** is the canonical Python framework for **Agent-Based Modeling (ABM)**: you write `Agent` and
`Model` classes, place agents in a space (grid / network / cell-space), and run time forward. This lab
teaches ABM *with Mesa's abstractions as the curriculum* and uses Mesa in the **offline precompute lane**
(see [02_usage.md](./02_usage.md) and [03_applying.md](./03_applying.md)).

← Back to the framework landing page: [../04_mesa.md](../04_mesa.md)

## Version documented here

| Item | Value |
|---|---|
| Package | `mesa` |
| Installed version | **3.5.1** |
| License | Apache-2.0 |
| Problem type | Agent-Based Modeling (ABM) |
| Requirements file | **`requirements-precompute.txt`** (precompute lane — *not* the browser/live lane) |

## Exact install line

```bash
pip install "mesa>=3.0"
```

The pin in `requirements-precompute.txt` is `mesa>=3.0`; the version actually resolved in the project venv
is **3.5.1**. (Do **not** run this yourself in this repo — everything is already installed in the project
virtual environment.)

> **Why pin `>=3.0` and not `>=2`?** Mesa 3 is a hard API break from Mesa 2 (the scheduler objects were
> removed and activation moved onto an `AgentSet`; the RNG seeding contract changed). The lab's code and
> this documentation are written against the Mesa 3 shape, so a `>=3.0` floor is load-bearing — a Mesa 2
> resolution would not run the example. See the migration table in [02_usage.md](./02_usage.md).

## Which requirements file it belongs to — and why

The lab has three dependency lanes:

| File | Lane | Mesa here? |
|---|---|---|
| `requirements.txt` | **Live** — the small wheel closure that the browser (Pyodide) must load | **No** |
| `requirements-precompute.txt` | **Precompute** — heavier engines run offline to generate committed traces | **Yes** |
| `requirements-gpu.txt` | GPU precompute | No |

Mesa lives in **`requirements-precompute.txt`**, not in the live `requirements.txt`. The reason is
architectural, and it is the single most important fact about Mesa in this project:

> Mesa's only first-class visualization (SolaraViz) is a **stateful Python (Solara) server bound to a
> localhost port**. That is fine for local teaching and notebooks, but wrong for a static SPA on a shared,
> no-GPU VPS. So the lab runs Mesa **headless** in the local pipeline, records the trajectory, commits the
> compact artifact, and the web app **replays** it. Mesa never runs in production.

The trade-off is this: the ABM scenarios (S02 Schelling, S03 SIR, S05 Beer Game) **run on Mesa** during
precompute, but Mesa never ships to the browser. Instead, the traces are committed as compact Arrow/JSON
artifacts and replayed statically. This is covered honestly in [03_applying.md](./03_applying.md).

## Key transitive dependencies

Mesa 3.5.1 pulls in (already present in the project venv; the versions below are what actually resolved):

| Dependency | Resolved here | Why Mesa needs it |
|---|---|---|
| **`numpy`** | **2.4.6** | array math + the seeded NumPy `Generator` exposed as `model.rng` |
| **`pandas`** | **3.0.3** | `DataCollector` returns tidy per-step / per-agent `DataFrame`s |
| **`networkx`** | **3.6.1** | backs `NetworkGrid` (network-space ABMs) |
| **`tqdm`** | — | progress bars for `batch_run` parameter sweeps |

Visualization extras (Solara, Altair, Matplotlib) are **optional** and are *not* required for the headless
precompute path this lab uses. The example in [02_usage.md](./02_usage.md) imports only `mesa` + the
`mesa.space.SingleGrid` it builds the world on.

## Platform notes

- **Pure Python**, no native/compiled extensions of its own — installs cleanly on Windows / macOS / Linux.
  (Its dependency NumPy ships prebuilt wheels, so there is no C toolchain requirement.)
- **No CUDA / no GPU.** Mesa is CPU-only. For million-agent GPU runs the research routes to **FLAME GPU 2**
  (CUDA), **ABMax** (JAX) or **AMBER** (Polars) — none of which is needed for the lab's small canonical
  models, and all of which are documented as a reference chapter only
  ([../gpu-abm-chapter/](../18_gpu-abm-chapter.md)). There are therefore **no CUDA notes** for Mesa.
- **Not Pyodide-shippable in practice.** Even though Mesa is pure Python, shipping it (plus pandas +
  networkx) into the browser wheel closure would bloat cold-start; this is exactly why the live lane uses
  NumPy directly. See [03_applying.md](./03_applying.md).

## Verify the install

```bash
.venv/Scripts/python.exe -c "import mesa; print(mesa.__version__)"
# -> 3.5.1
```

## Grounding / references

- Mesa-frameworks research: `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md` (decision: "Teach
  ABM with Mesa 3 … de-facto Python standard, Apache-2.0 … Mesa is for the repo and for precomputed runs,
  NOT for serving live sims").
- Mesa 3 (JOSS 2025): <https://joss.theoj.org/papers/10.21105/joss.07668>
- Mesa docs / repo (Apache-2.0): <https://mesa.readthedocs.io/latest/> · <https://github.com/projectmesa/mesa>
