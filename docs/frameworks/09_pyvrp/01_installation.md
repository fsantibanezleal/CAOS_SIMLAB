# PyVRP — 01 · Installation

PyVRP is a state-of-the-art open-source solver for the Vehicle Routing Problem
(VRP) and its common variants (CVRP, VRPTW, prize-collecting, multi-depot,
multi-trip, heterogeneous fleet). It implements **Hybrid Genetic Search (HGS)** —
a population-based metaheuristic with an efficient local search — in a C++ core
exposed through a clean Python API. In this lab it is the **state-of-the-art
contrast** to Google OR-Tools for scenario **S08 (Vehicle Routing Problem)**.

This page is the first read in the node. Once installed, continue to
[`02_usage.md`](./02_usage.md) for the API and the worked example, then
[`03_applying.md`](./03_applying.md) for how it fits the lab.

## Which requirements lane

PyVRP belongs to the **precompute** lane: `requirements-precompute.txt`.

- It compiles to native code (a C++ extension module), so it **cannot run in the
  browser** (Pyodide/WASM) and is **not** part of the live, in-browser MVP. See
  the lab's [precompute pipeline guide](../../guides/01_precompute-pipeline.md) and
  the [live-lane (Pyodide) guide](../../guides/02_live-lane-pyodide.md) for why this
  split exists.
- It is used **offline** on a developer machine to generate the committed
  solution traces that the web app replays. The VPS and browser only ever see
  the resulting JSON/Arrow artifacts, never PyVRP itself.

The line in `requirements-precompute.txt`:

```
pyvrp>=0.9        # S08 SOTA VRP contrast
```

The floor is `>=0.9` (the first release with the stable high-level `Model`
builder used throughout this node); the version actually installed and verified is
newer (below).

## Exact install line and installed version

> Do not run this — everything is already installed in the project `.venv`.
> Recorded here for reproducibility.

```
pip install pyvrp
```

Installed and verified version: **PyVRP 0.13.4** on **Python 3.13.0**.

PyVRP ships **prebuilt binary wheels** on PyPI for the common platforms, so the
above installs without a C++ toolchain. The wheel for this machine contains the
compiled extension modules:

```
pyvrp/_pyvrp.cp313-win_amd64.pyd
pyvrp/search/_search.cp313-win_amd64.pyd
```

(`cp313` = CPython 3.13, `win_amd64` = 64-bit Windows on AMD64 — match the wheel
to your interpreter version and platform.)

## Key transitive dependencies

PyVRP declares a small, pure-Python-friendly dependency set (the heavy lifting is
already compiled into the wheel):

| Package      | Installed | Role |
|--------------|-----------|------|
| `numpy`      | 2.4.6     | array I/O for instances, distance matrices, results |
| `matplotlib` | 3.11.0    | optional plotting helpers (`pyvrp.plotting`) |
| `vrplib`     | 2.2.0     | read/write standard CVRPLIB / Solomon instance files |
| `tqdm`       | 4.68.3    | progress display during `solve(... display=True)` |

The whole stack is permissively licensed: **PyVRP is MIT**, and the
dependencies above are BSD/PSF/MIT-compatible — safe for this public repo.

## Verify the install

Confirm a working install at any time with:

```
python -c "from pyvrp import show_versions; show_versions()"
```

which prints the PyVRP version alongside numpy/matplotlib/vrplib/tqdm and the
Python version. On this machine that yields:

```
INSTALLED VERSIONS
------------------
     pyvrp: 0.13.4
     numpy: 2.4.6
matplotlib: 3.11.0
    vrplib: 2.2.0
      tqdm: 4.68.3
    Python: 3.13.0
```

## Platform notes

- **Windows / macOS / Linux, x86-64 and Apple Silicon** are covered by prebuilt
  wheels, so a plain `pip install pyvrp` works without compiling.
- If a wheel is **not** available for your platform/Python combination, pip falls
  back to building from source, which needs a **C++20 toolchain** (e.g. MSVC
  Build Tools on Windows, a recent GCC/Clang elsewhere) and Meson. Prefer a
  Python version that has a published wheel to avoid this.

## CUDA / GPU notes

**None — PyVRP is CPU-only and needs no GPU.** HGS is a CPU metaheuristic; the
GPU on the precompute machine is irrelevant to it. There is no CUDA build, no GPU
requirement-file involvement, and nothing in `requirements-gpu.txt` pertains to
PyVRP. Solve time is controlled purely by the CPU runtime/iteration budget you
pass to `Model.solve(...)`. (The lab's GPU lane is reserved for ABM/physics
scenarios — see the [GPU lane guide](../../guides/03_gpu-lane.md).)

---

Next: [`02_usage.md`](./02_usage.md) — the `Model` API and the runnable example,
walked through with its captured output.
