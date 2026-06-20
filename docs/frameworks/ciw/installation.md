# Ciw — Installation

**Ciw** is a pure-Python discrete-event simulation (DES) library specialised for
**open queueing networks** (multi-node, multi-class, with routing, blocking, baulking,
reneging and server schedules). In this lab it powers the **queueing-theory teaching
block**, where every simulation is paired with an analytical result so the student can
see "does my sim match theory?"

- **Library:** `ciw`
- **Installed version:** `3.2.7`
- **License:** MIT
- **Paradigm:** event-based queueing networks (headless — no built-in visualization)
- **Runtime footprint:** pure Python, CPU-only, light (no native code, no GPU)

## Which requirements file

Ciw lives in the **precompute** lane — `requirements-precompute.txt`.

It is *not* part of the live browser bundle. The live MVP runs SimPy/NumPy only (those
are in `requirements.txt`, the base/Pyodide closure). Ciw is used **offline** to
generate the validation traces and didactic numbers for the queueing chapter of
scenario **S01**; the web app then serves the committed artifact. Keeping Ciw out of the
base file keeps the Pyodide wheel closure small.

> Note: in `requirements-precompute.txt` the `ciw>=3.1` line is currently commented as a
> planned-on-demand dependency. The verified, working pin for this documentation is
> `ciw==3.2.7`. When the queueing precompute pipeline is wired up, uncomment/raise the
> line to `ciw>=3.2.7`.

## Install line

Everything is already installed in the project virtual environment, so you do **not**
need to run this. For reference / a fresh machine, the exact line is:

```bash
pip install "ciw==3.2.7"
```

Or, as part of the precompute lane (preferred — keeps versions in one place):

```bash
pip install -r requirements-precompute.txt
```

## Verifying the install

From the repo root:

```bash
.venv/Scripts/python.exe -c "import ciw; print('ciw', ciw.__version__)"
# -> ciw 3.2.7
```

## Key transitive dependencies

Ciw is deliberately lean. Its only hard runtime dependencies are scientific-Python
staples that are already present for the rest of the lab:

- **`numpy`** — numeric arrays / RNG support (already in `requirements.txt`, `>=1.26`).
- **`networkx`** — used internally for deadlock detection on routing graphs.
- **`pandas`** *(optional)* — only needed if you call `Simulation.get_all_records()` and
  then convert to a DataFrame yourself; the core simulation does not require it. The
  example in this folder avoids pandas and uses the standard-library `statistics` module,
  so the example runs with the base closure plus Ciw alone.

There is **no native/compiled code** in Ciw, which is exactly why it is a clean,
reproducible engine for the teaching block.

## Platform notes

- **OS:** cross-platform pure Python; verified here on **Windows 11 + CPython 3.13.0**.
- **Python:** Ciw 3.2.7 supports modern CPython (3.9+); 3.13 works.
- **CUDA / GPU:** **not applicable.** Ciw is CPU-only and single-threaded per run. To get
  multiple replications faster you parallelise *runs* across CPU cores (e.g. with
  `joblib`), not the engine internals. No CUDA toolkit is involved.

## Where it fits in the lab

| Scenario | Role of Ciw |
|---|---|
| **S01** (Bank / Clinic Teller Queue) | Analytic **M/M/c validation** — run the queue in Ciw, compare mean wait to the closed-form Erlang-C `Wq`, and publish the agreement as the teaching artifact. |

Deprecated engines **AgentPy** and **desmod** are *not* used anywhere in this lab —
mention only as "deprecated, don't use."
