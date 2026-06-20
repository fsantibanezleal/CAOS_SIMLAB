# Mesa — installation

**Mesa** is the canonical Python framework for **Agent-Based Modeling (ABM)**: you write `Agent` and
`Model` classes, place agents in a space (grid / network / cell-space), and run time forward. This lab
teaches ABM *with Mesa's abstractions as the curriculum* and runs Mesa **live in the browser via Pyodide**
for the ABM scenarios (S02/S03/S05), backed by a committed canonical-replay artifact for instant first paint
(see [02_usage.md](./02_usage.md) and [03_applying.md](./03_applying.md)).

← Back to the framework landing page: [../04_mesa.md](../04_mesa.md)

## Version documented here

| Item | Value |
|---|---|
| Package | `mesa` |
| Installed version | **3.5.1** |
| License | Apache-2.0 |
| Problem type | Agent-Based Modeling (ABM) |
| Requirements file | pinned in **`requirements-precompute.txt`** as **`mesa==3.5.1`** (local install set); also a **live** wheel — the browser worker `micropip.install`s `mesa`, so the ABM scenarios run live (`mesa ⊆ LIVE_WHEELS`) |

## Exact install line

```bash
pip install "mesa>=3.0"
```

The exact pin in `requirements-precompute.txt` is **`mesa==3.5.1`** — the version installed and verified to
import & run in the project venv. The `pip install "mesa>=3.0"` line above is the human-friendly *floor* to
install a Mesa-3-shaped package; the committed file is hard-pinned to the resolved `==3.5.1` for byte-for-byte
reproducibility. (Do **not** run this yourself in this repo — everything is already installed in the project
virtual environment.)

> **Why a `>=3.0` floor and not `>=2`?** Mesa 3 is a hard API break from Mesa 2 (the scheduler objects were
> removed and activation moved onto an `AgentSet`; the RNG seeding contract changed). The lab's code and
> this documentation are written against the Mesa 3 shape, so a Mesa-3 floor is load-bearing — a Mesa 2
> resolution would not run the example. This is only the *design rationale* for the floor: the committed pin
> is the exact `mesa==3.5.1` (a `>=` would not be byte-reproducible). See the migration table in
> [02_usage.md](./02_usage.md).

## Which requirements file it belongs to — and why

The lab has three dependency files:

| File | What it is | Mesa here? |
|---|---|---|
| `requirements.txt` | the minimal **local** base install set (not the full live closure) | **No** |
| `requirements-precompute.txt` | the local install set for the heavier engines | **Yes** |
| `requirements-gpu.txt` | GPU precompute | No |

Mesa is pinned in **`requirements-precompute.txt`**, not in the base `requirements.txt`. But that pin does
**not** mean Mesa is precompute-only — the live wheel closure is decided at runtime by the worker and the
gate, not by `requirements.txt`:

> The browser worker loads the live wheels itself: it `loadPackage`s numpy/pandas/scipy/networkx/sqlite3 and
> `micropip.install`s simpy/ciw/**mesa**/joblib. Because `mesa ⊆ LIVE_WHEELS` (`simlab/core/scenario.py`) and
> the ABM scenarios are pure-Python and pass the 4-gate rule, **Mesa runs LIVE in Pyodide**. What Mesa cannot
> serve is **SolaraViz** — its first-class visualization is a stateful Python (Solara) server bound to a
> localhost port, fine for local teaching but wrong for a static SPA on GitHub Pages (zero server compute). The lab's
> React/SVG viewer owns the pixels instead; SolaraViz never runs on the live (Pages) deploy, but the Mesa *engine* does.

The trade-off is this: the ABM scenarios (S02 Schelling, S03 SIR, S05 Beer Game) **run live on Mesa 3 in the
browser**, and the same seeded models are *also* run headless in the local pipeline to commit a canonical
replay trace (instant first paint + byte-for-byte reproducibility). This is covered in
[03_applying.md](./03_applying.md).

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
- **Pyodide-shippable — and shipped live.** Mesa is pure Python; the browser worker `micropip.install`s it
  (with pandas/networkx/sqlite3 loaded), and it was *measured* to clear the 4-gate live rule (~3 s cold
  start). So the ABM scenarios run real Mesa 3 live in Pyodide — they do **not** fall back to a hand-rolled
  NumPy model. See [03_applying.md](./03_applying.md).

## Verify the install

```bash
.venv/Scripts/python.exe -c "import mesa; print(mesa.__version__)"
# -> 3.5.1
```

## Grounding / references

- Mesa-frameworks research: the project's internal ABM-frameworks research note (decision: "Teach
  ABM with Mesa 3 … de-facto Python standard, Apache-2.0"). Note: the research's earlier
  "NOT for serving live sims" caveat was about SolaraViz (the server-bound viz); a later measurement showed
  the Mesa *engine* itself runs live in Pyodide, which is why the ABM scenarios are classified `live`.
- Mesa 3 (JOSS 2025): <https://joss.theoj.org/papers/10.21105/joss.07668>
- Mesa docs / repo (Apache-2.0): <https://mesa.readthedocs.io/latest/> · <https://github.com/projectmesa/mesa>
