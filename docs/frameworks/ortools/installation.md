# OR-Tools — Installation

Google OR-Tools is an operations-research toolkit. In this lab it is the **optimization** engine: it
provides three distinct solvers used by the scenarios — **CP-SAT** (constraint programming / scheduling),
**Routing** (vehicle routing on top of CP), and **GLOP** (a linear-programming simplex).

## Which requirements file it belongs to

OR-Tools lives in the **precompute** lane, not the core runtime:

- File: `requirements-precompute.txt`
- Line: `ortools>=9.10`
- Installed version in this lab: **9.15.6755**

Why precompute and not core? OR-Tools is **native code** (a large C++ core wrapped for Python). It cannot be
loaded by Pyodide in the browser, so it never enters the live wheel closure that the web viewer downloads.
The core runtime (`requirements.txt`) is deliberately kept to `numpy` + `simpy` so the browser cold-start
stays small. OR-Tools is installed only in the local pipeline virtual environment, where it generates the
committed, deterministic traces (optimal schedules, blend plans) that the web app replays.

This is the "deterministic-replay" pattern of the lab: heavy native solvers run **offline**; only their
compact JSON/Arrow output is served.

## Install line

Everything is already installed in this repo's `.venv` — **do not re-run pip here**. For reference, the
exact installation is:

```bash
pip install -r requirements-precompute.txt        # installs ortools>=9.10 (and the rest of the lane)
# or, just this package:
pip install "ortools>=9.10"
```

Verify the installed version:

```bash
.venv/Scripts/python.exe -c "import importlib.metadata as m; print(m.version('ortools'))"
# -> 9.15.6755
```

## Platform notes

- **Pure-pip, no system dependencies.** OR-Tools ships prebuilt binary wheels for Windows, macOS and Linux
  (CPython 3.9–3.13). No compiler, no `apt`/`brew` packages, no separate solver install are required —
  `pip install ortools` is the whole story.
- This lab runs it on **Windows 11, Python 3.13.0** (the `.venv` interpreter).
- License: **Apache-2.0** — permissive and compatible with a public repo (no copyleft obligations).
- Key transitive deps pulled in by the wheel: `protobuf`, `absl-py`, `numpy`, `pandas`. The C++ solver core
  is bundled inside the wheel itself, so there is no external native library to find at runtime.

## CUDA / GPU notes

**None — OR-Tools is CPU-only.** CP-SAT, Routing and GLOP are all CPU solvers; there is no CUDA build and the
GPU is irrelevant to this entire dimension. The research is explicit: "No GPU is needed anywhere in this
dimension — all of these are CPU solvers. The RTX 4070 is irrelevant to routing." OR-Tools therefore does
**not** appear in `requirements-gpu.txt`. Performance scales with CPU cores (CP-SAT can use multiple search
workers), but for reproducible committed traces this lab pins **one worker** with a **fixed random seed**, so
GPU and even multi-core parallelism are deliberately switched off in favour of determinism.
