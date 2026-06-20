# Ciw — 01 · Installation

> Wiki node: [02_ciw](../02_ciw.md) · next: [02 · Usage](./02_usage.md) → [03 · Applying](./03_applying.md)

**Ciw** is a pure-Python discrete-event simulation (DES) library specialised for
**open queueing networks** — multi-node, multi-class, with routing, blocking, baulking,
reneging and server schedules. In this lab it powers the **queueing-theory teaching
block**, where every simulation is paired with an analytical result so the learner can
ask, and answer, *"does my sim match theory?"*

| | |
|---|---|
| **Library (PyPI)** | `ciw` |
| **Pinned version** | `3.2.7` |
| **License** | MIT (safe for a public repo) |
| **Paradigm** | event-scheduling queueing networks (headless — no built-in visualization) |
| **Runtime footprint** | pure Python, CPU-only, single-threaded per run, no native code, no GPU |
| **Requirements lane** | pinned in `requirements-precompute.txt` (the local install set); also a **live** wheel — the browser worker `micropip.install`s `ciw`, so the S01 cross-check runs live (`ciw ⊆ LIVE_WHEELS`) |

---

## 1. The exact install line

Everything is already installed in the project virtual environment, so on this machine
you do **not** need to run anything. For a fresh machine, the exact, verified line is:

```bash
pip install "ciw==3.2.7"
```

Preferred — install via the precompute lane so every version is pinned in one place:

```bash
pip install -r requirements-precompute.txt
```

---

## 2. Which requirements file — and why

Ciw is pinned in `requirements-precompute.txt`, **not** the base `requirements.txt`.

The base `requirements.txt` is the minimal **local** install set; it is *not* the full
live closure. At runtime the Pyodide Web Worker loads the live wheels itself — it
`loadPackage`s numpy/pandas/scipy/networkx/sqlite3 and `micropip.install`s
simpy/**ciw**/mesa/joblib (`LIVE_WHEELS` in `simlab/core/scenario.py`). So **Ciw runs live
in the browser** as S01's in-run cross-check: it is one of the wheels the worker installs,
and `ciw ⊆ LIVE_WHEELS`. The pin lives in `requirements-precompute.txt` because that file
is also where the heavier offline engines (Mesa, OR-Tools) are declared for local
precompute runs; it does not mean Ciw is precompute-only. (A *standalone* Ciw network study
that exceeded the live gate would run offline and ship a committed artifact — but S01's Ciw
cross-check does not.) See the [precompute pipeline guide](../../guides/01_precompute-pipeline.md)
and [architecture.md](../../architecture.md) for the two-lane design.

> **Note on the pin.** In `requirements-precompute.txt` the `ciw>=3.1` line is currently
> commented as a *planned-on-demand* dependency. The verified, working pin for this
> documentation is `ciw==3.2.7`. When the queueing precompute pipeline is wired up,
> uncomment / raise the line to `ciw>=3.2.7`.

---

## 3. Key transitive dependencies

Ciw is deliberately lean. Its only hard runtime dependencies are scientific-Python
staples already present for the rest of the lab:

- **`numpy`** — numeric arrays / RNG support (already in `requirements.txt`, `>=1.26`).
- **`networkx`** — used *internally* for deadlock detection on routing graphs (you never
  import it yourself for a simple queue). NetworkX has its own
  [framework node](../10_networkx.md) in the optimization half of the lab.
- **`pandas`** *(optional)* — only needed if you call `Simulation.get_all_records()` and
  then build a DataFrame yourself; the core simulation does not require it. The
  [`example.py`](./example.py) in this folder **avoids pandas** and uses the
  standard-library `statistics` module, so it runs with the base closure plus Ciw alone.

There is **no native / compiled code** in Ciw — exactly why it is a clean, reproducible
engine for the teaching block.

---

## 4. Verifying the install

From the repo root:

```bash
.venv/Scripts/python.exe -c "import ciw; print('ciw', ciw.__version__)"
# -> ciw 3.2.7
```

Then run the folder's example end-to-end (it should print `PASS: sim ~= theory`):

```bash
.venv/Scripts/python.exe docs/frameworks/02_ciw/example.py
```

The full walk-through of that output is in [02 · Usage](./02_usage.md).

---

## 5. Platform notes

- **OS:** cross-platform pure Python; verified here on **Windows 11 + CPython 3.13.0**.
- **Python:** Ciw 3.2.7 supports modern CPython (3.9+); 3.13 works.
- **CUDA / GPU:** **not applicable.** Ciw is CPU-only and single-threaded per run. To run
  many replications faster you parallelise *runs* across CPU cores (e.g. with
  [`joblib`](../12_joblib.md)), **not** the engine internals — a single Ciw run does not get
  faster. No CUDA toolkit is involved.

---

## 6. Where it fits in the lab

| Scenario | Role of Ciw |
|---|---|
| **S01** (Bank / Clinic Teller Queue) | Analytic **M/M/c cross-check** — SimPy drives the live, animated queue; Ciw is the in-run cross-check (`ciw_xcheck`, 10 capped warmed-up replications) comparing the mean wait to the closed-form Erlang-C `Wq` and recording `theory_in_ci` + `rel_err`. Both run in the live lane; Ciw provides the theory anchor. |

Deprecated engines **AgentPy** and **desmod** are *not* used anywhere in this lab — they
appear only as a "deprecated, don't use" signpost. For DES use **SimPy / Ciw / Salabim**
(see the [DES problem-type guide](../../problem-types/01_discrete-event-simulation.md)).
