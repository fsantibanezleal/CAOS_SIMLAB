# Installing SciPy (`scipy.stats`)

SciPy is the scientific-computing companion to NumPy. CAOS_SIMLAB uses only its **statistics**
sub-package, `scipy.stats`, and only for one job: turning a sample of Monte-Carlo replications into an
honest **confidence interval** (normal-approximation and Student-t). See
[`usage.md`](./usage.md) for the API and a runnable example, and [`applying.md`](./applying.md) for how
it slots into scenario **S10**.

## Which requirements file

`scipy` belongs to the **precompute** lane (`requirements-precompute.txt`).

It is **not** in the core/live lane (`requirements.txt`). The live lane is the wheel closure that the
browser (Pyodide) must download on cold start, and it is kept deliberately minimal (`numpy`, `simpy`).
SciPy is a large native package (compiled Fortran/C/C++), so adding it to the core lane would inflate the
browser cold-start for no live benefit — the CI math runs **offline** in the precompute pipeline, and only
the resulting numbers (mean, CI bounds) are committed into the trace and replayed. This matches the
architecture's three-lane rule (live / precompute / host) in
[`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md).

It is also **not** the GPU lane (`requirements-gpu.txt`); that lane is for CuPy / Numba CUDA, which
accelerate *generating* thousands of replications. SciPy only *summarises* the resulting sample — it is
CPU work measured in microseconds and never needs a GPU.

## Install line

From the repo root, into the project virtual environment:

```bash
pip install -r requirements-precompute.txt
```

To install just this package explicitly (version-pinned to what the lab is verified against):

```bash
pip install "scipy==1.18.0"
```

## Installed version (verified)

| Field | Value |
|---|---|
| Package | `scipy` |
| Version | **1.18.0** |
| Imported as | `from scipy import stats` |
| License | BSD-3-Clause (permissive — safe for a public repo) |
| Verified on | Python 3.13.0, Windows-11 (10.0.26200) |

These numbers were read from the project `.venv` with `pip show scipy` and
`python -c "import scipy; print(scipy.__version__)"`.

## Dependencies

SciPy's only hard runtime dependency is **NumPy**:

| Dependency | Role | Already present? |
|---|---|---|
| `numpy` (>= 1.26; **2.4.6** installed) | array backend; `scipy.stats` returns/consumes NumPy arrays and scalars | Yes — it is in the **core** `requirements.txt`, so SciPy adds no new transitive runtime dep beyond itself |

SciPy is **required-by** several other precompute-lane packages already in the venv (`Mesa`,
`scikit-learn`, `jax`/`jaxlib`, `libpysal`), so it is present in the environment regardless; but it is also
**pinned explicitly** in `requirements-precompute.txt` (under the "Monte-Carlo / statistics (CPU)" section,
`scipy==1.18.0`, alongside `joblib`) so the CI math has a stable, declared version rather than relying on a
transitive resolution.

## Platform notes

- **Wheels, no compiler needed.** SciPy 1.18.0 ships prebuilt binary wheels for CPython 3.13 on Windows,
  macOS and Linux (x86-64 and arm64). `pip install` pulls the wheel; you do **not** need a Fortran/C
  toolchain on a normal install.
- **Pyodide / browser.** SciPy is *not* loaded in the browser. The live lane never imports it; only the
  offline pipeline does. So the size of SciPy is irrelevant to the deployed static site.
- **CUDA / GPU.** None. `scipy.stats` is pure CPU. The GPU lane (`requirements-gpu.txt`, CuPy/Numba) is a
  separate, optional concern for *producing* large replication batches; the CI summary on top of them is
  still SciPy on the CPU. There are no CUDA notes because there is no CUDA path here.
- **Determinism.** `scipy.stats.norm.ppf`, `t.ppf`, `*.interval`, and `sem` are deterministic pure
  functions of their inputs — no internal randomness — so they introduce no reproducibility risk. All
  randomness in CAOS_SIMLAB lives in the seeded NumPy `Generator` that produces the *sample*; SciPy only
  reduces that fixed sample to numbers.
