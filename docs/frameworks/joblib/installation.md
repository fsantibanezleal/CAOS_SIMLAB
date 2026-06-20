# joblib — installation

**joblib** is a lightweight, pure-Python toolkit for *embarrassingly-parallel* work: it fans a list of
independent function calls across CPU processes (or threads) with one line, and transparently handles
worker creation, task dispatch, and result collection. In CAOS_SIMLAB it is the **v1 default driver for
Monte-Carlo replications** — it turns "run K independent seeded replications of a cheap model and collect
their KPIs" into a few lines, with no GPU and no boilerplate.

## Which requirements file

joblib belongs to the **precompute** lane — `requirements-precompute.txt`:

```
joblib>=1.4        # CPU-parallel replications (S10 Monte-Carlo / CI study)
```

It is **not** in the live/browser path. The precompute lane holds the heavier engines we run *offline* on
a workstation to generate committed trace/summary artifacts; the browser only replays those artifacts.
joblib's role is to make the offline replication sweep (S10) finish in seconds across all CPU cores.

> Note on the lane vs. the live gate: S10 itself is small enough (pure-Python, milliseconds, KB-scale
> traces) that the deterministic seed-42 trace classifies as `lane: "live"` and can also run in the browser
> via Pyodide. joblib is the **batch/precompute** tool used to generate larger replication sweeps and CI
> studies on the workstation — it is the multi-core engine, not a browser dependency.

## Install line and pinned version

Everything is already installed in the repo virtual environment; this is the exact line that provisions it:

```bash
pip install "joblib>=1.4"
```

**Installed and verified version in this lab: `joblib 1.5.3`.**

Check it yourself with the repo interpreter (paths are repo-relative; run from the repo root):

```bash
.venv/Scripts/python.exe -c "import joblib; print(joblib.__version__)"
# -> 1.5.3
```

## Dependencies

joblib is deliberately **dependency-light** — that is part of why it is the default. The core library has
**no required third-party runtime dependencies** (it vendors its own process-pool backend, `loky`, and a
cloud-pickle fork internally). The pieces that matter in practice:

- **`loky`** — joblib's default robust process-pool backend (vendored), used for the `loky` / `n_jobs`
  multiprocessing path. It is what makes worker processes resilient to crashes and reusable across calls.
- **`cloudpickle`** (vendored) — lets joblib pickle closures and locally-defined functions so they can be
  shipped to worker processes.
- **NumPy** — *not* a joblib dependency, but it is what our replication functions use (and joblib has a
  fast path for memory-mapping large NumPy arrays to workers). In this lab NumPy `2.4.6` is present from the
  core stack.

There are optional extras (`dask`, `ray` distributed backends) that we do **not** use — single-machine
multiprocessing is all S10 needs.

## Platform notes

- **OS:** pure Python, works identically on Windows, Linux, and macOS. The lab develops on Windows and
  deploys precomputed artifacts to a Linux VPS, so cross-platform reproducibility matters — see the gotcha
  below.
- **Windows `__main__` guard (important):** on Windows the default `loky`/multiprocessing backend
  *spawns* fresh interpreter processes, which re-import your module. Any script that calls
  `joblib.Parallel` at top level **must** guard its entry point with `if __name__ == "__main__":` (our
  `example.py` does). Without the guard, each spawned worker re-runs the launch code and you get an infinite
  process-spawn loop. This is a Windows/`spawn` quirk, not a joblib bug.
- **Functions must be picklable.** Worker processes receive the function and its arguments via pickle, so
  the replication function should be a module-level function (not a lambda or a deeply-nested closure) and
  its arguments should be plain/picklable values (ints, floats, NumPy arrays). Passing a *seed* and
  building the RNG *inside* the worker — as `example.py` does — is the clean, picklable pattern; passing a
  live `np.random.Generator` per call also works but is heavier.
- **No GPU / no CUDA.** joblib is strictly CPU-parallel. There is nothing to install or configure for the
  GPU; the GPU Monte-Carlo exhibits are a separate, optional lane (`requirements-gpu.txt`, CuPy / Numba
  CUDA) with a CPU fallback. For S10's replication study, **CPU-via-joblib is the intended path** and
  finishes in seconds — no GPU needed.

## Sanity check

A one-liner that proves the parallel path is live (run from the repo root with the repo interpreter):

```bash
.venv/Scripts/python.exe -c "from joblib import Parallel, delayed; print(Parallel(n_jobs=-1)(delayed(lambda i: i*i)(i) for i in range(6)))"
# -> [0, 1, 4, 9, 16, 25]
```

(For multi-process work in a real script, keep the `__main__` guard as noted above.)
