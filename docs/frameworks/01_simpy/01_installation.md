# SimPy — Installation

SimPy is the **primary discrete-event-simulation (DES) engine** of CAOS_SIMLAB and the teaching
default for the whole DES half of the lab. This page covers how it is installed, which requirements
file owns it, what comes with it, and the platform notes that matter for the live (browser) lane.

Read order for this node: **you are on 01.** Next: [`02_usage.md`](./02_usage.md) (the API + the
runnable example), then [`03_applying.md`](./03_applying.md) (when to reach for it and which lab
scenarios use it). The landing page is [`../01_simpy.md`](../01_simpy.md).

## At a glance

| | |
|---|---|
| Package | `simpy` |
| Installed version | **4.1.2** |
| License | MIT |
| Requirements file | **`requirements.txt`** (core runtime) |
| Problem type | Discrete-event simulation (DES) |
| Runtime footprint | Pure Python, **zero third-party dependencies**, CPU-only |
| Browser (Pyodide) | **Yes** — loads and runs in a Web Worker |
| GPU / CUDA | Not applicable — SimPy is a pure-Python event loop |
| Python support | CPython 3.8–3.14 (lab runs 3.13) |

## The exact install line

SimPy is part of the **core** requirements, so it is installed with the rest of the live-lane runtime:

```bash
pip install -r requirements.txt
```

The pin that brings it in (see `requirements.txt`):

```text
simpy>=4.1
```

If you ever need just SimPy on its own (e.g. a scratch environment), the exact line for the version
this lab is verified against is:

```bash
pip install "simpy==4.1.2"
```

> Use the lab's `.venv` for everything — never a global interpreter. All commands on this page assume
> the repo-root virtual environment (`.venv/Scripts/python.exe` on Windows,
> `.venv/bin/python` on macOS/Linux).

## Why it lives in `requirements.txt` (core), not precompute/gpu

CAOS_SIMLAB splits its dependencies into four files by *where the code runs*:

- **`requirements.txt` (core)** — the runtime that powers the **live lane** and is also the wheel
  closure the browser (Pyodide) must download on cold start. It is kept deliberately tiny:
  `numpy` and `simpy` only. SimPy belongs here because the light DES scenarios (S01, S04) run
  *live in the browser*, and SimPy is the engine that does it.
- `requirements-precompute.txt` — the local pipeline dependencies (e.g. OR-Tools CP-SAT/GLOP,
  PyVRP, OSMnx) that are **native code**, never enter the browser closure, and only run offline.
- `requirements-gpu.txt` — the optional, local-only GPU lane (CuPy/Numba). Never on the deploy path.
- `requirements-dev.txt` — tests and tooling.

SimPy is in core precisely because it is **pure Python with no compiled extensions** — that is what
lets it be part of the small browser closure. Every dependency in core costs cold-start time in
Pyodide, and SimPy adds almost nothing: it is a single pure-Python package.

## Verify the install

From the repo root:

```bash
.venv/Scripts/python.exe -c "import simpy; print(simpy.__version__)"
```

Expected output:

```text
4.1.2
```

A second, end-to-end check is to run the bundled example — it imports SimPy, builds an `Environment`,
a `Resource`, processes, and runs the event loop, so a clean run proves the whole engine works:

```bash
.venv/Scripts/python.exe docs/frameworks/01_simpy/example.py
```

The expected output (deterministic) is captured in [`02_usage.md`](./02_usage.md#4-verified-output).

## Transitive dependencies

There are **none**. SimPy 4.1.2 declares no runtime dependencies of its own — this is one of its
defining properties and a core reason it was chosen (research report 01). The only thing alongside it
in the core file is NumPy (used by other scenarios, not required by SimPy). Confirm with:

```bash
.venv/Scripts/python.exe -m pip show simpy
```

The `Requires:` field is empty.

## Platform notes

- **Python version.** SimPy 4.1.2 supports CPython 3.8–3.14. The lab's local environment runs on
  **Python 3.13**. SimPy uses only the standard library, so it is unaffected by platform specifics.
- **OS.** Works identically on Windows, macOS, and Linux (including the GPU-less VPS that
  serves the app). No system libraries, no display server, no compiler needed.
- **Browser (Pyodide).** Because SimPy is pure Python, it loads inside Pyodide in a Web Worker with
  no special build step, which is what makes the light DES scenarios genuinely **live in-browser**.
  Note that SimPy has *no built-in animation*, and that is deliberate here: the engine emits a
  structured event trace and the React front end owns the pixels.
- **No CUDA notes apply.** SimPy is a single-threaded event loop over a future-event list; there is
  nothing for a GPU to accelerate. Heavy DES work (many replications, large graphs) is parallelised
  across CPU cores with `joblib` in the precompute lane, not on a GPU — see the
  [Monte-Carlo replications](../../problem-types/04_monte-carlo-replications.md) guide.

## Honest limit to keep in mind

Pure-Python DES is roughly **10–20× slower than a C++ engine** on a heavy benchmark (e.g. M/M/1 with
~500k arrivals), and it degrades as queues grow. This never affects installation, but it dictates
*where* a scenario runs: light models stay live; long horizons / large fleets / thousands of
replications go to the precompute lane and ship as a committed trace. See
[`02_usage.md`](./02_usage.md) and [`03_applying.md`](./03_applying.md).

## License & attribution

SimPy is **MIT-licensed** — safe for a public repo and compatible with the lab's other tools. It is
recorded in [`LICENSES.md`](../../../LICENSES.md) and [`ATTRIBUTION.md`](../../../ATTRIBUTION.md).

- SimPy docs: <https://simpy.readthedocs.io/>
- SimPy on PyPI (4.1.2, MIT, pure Python, 3.8–3.14): <https://pypi.org/project/simpy/>
