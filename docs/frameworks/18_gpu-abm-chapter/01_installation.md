# 18 · Heavy / GPU ABM — installation (reference chapter, NOT shipped)

This is a **reference chapter**, not a pip pipeline. It documents the three heavy agent-based-modeling
engines the research evaluated for the *million-agent* case — **FLAME GPU 2**, **ABMax**, and **AMBER** —
and records, honestly, **why none of them is in our requirements files** and how each *would* be installed
if a future scenario ever justified it.

> **There is no `example.py` in this node.** None of these three is a clean, pip-installable, runnable
> pipeline on this Windows / Python 3.13 box, so there is nothing to seed-run and capture. The other GPU
> guides ([CuPy](../15_cupy/01_installation.md), [Numba](../14_numba/01_installation.md),
> [Taichi](../16_taichi/01_installation.md), [JAX](../17_jax/01_installation.md)) **do** ship verified runnable
> examples — that is exactly the line this chapter draws: *installable + verifiable here* vs.
> *documented-but-deferred*.

The canonical context for "when does heavy compute actually pay off?" is
[`agent-based-modeling.md`](../../problem-types/02_agent-based-modeling.md) §2.6 and the Monte-Carlo verdict in
[`04_monte-carlo-replications.md`](../../problem-types/04_monte-carlo-replications.md). The short version, grounded
in the research: **the highest-ROI use of parallel compute in this lab is not one giant agent population —
it is thousands of independent seeded replications**, which run in seconds on ordinary CPU cores via
[joblib](../12_joblib/01_installation.md). Million-agent GPU-ABM is a *post-v1 stretch*, and our ten
scenarios do not need it.

---

## Why none of these is in `requirements*.txt`

| Engine | Backend | License | Why it is NOT installed here |
|---|---|---|---|
| **FLAME GPU 2** | CUDA (single GPU) | **AGPL-3.0** (copyleft) | No PyPI wheel — conda/source build with a pinned CUDA 12 toolchain; AGPL is a poor fit for a permissive public repo; documented laptop-class **8 GB-VRAM OOM**. |
| **ABMax** | JAX (`vmap`/JIT, CPU or GPU) | Apache-2.0 (permissive) | `pip install abmax` **fails on this Windows box**: `WinError 206 — the filename or extension is too long` while unpacking a deep `orbax` path during the JAX-ecosystem dependency resolve. |
| **AMBER** | Polars columnar (**CPU**) | permissive | Niche, thin upstream packaging; the columnar idiom it teaches is already covered for our scale by Mesa-headless + joblib; no scenario needs it. |

All three are recorded in [`requirements-gpu.txt`](../../../requirements-gpu.txt) as a **commented
"reference-only — NOT installed"** block, pointing at this chapter. They are deliberately **absent** from:

- [`requirements.txt`](../../../requirements.txt) — the live/browser base (numpy + simpy only; the deploy
  contract is the committed trace, never a GPU);
- [`requirements-precompute.txt`](../../../requirements-precompute.txt) — the CPU offline pipeline
  (OR-Tools, Mesa, joblib, …);
- [`requirements-gpu.txt`](../../../requirements-gpu.txt) **active** lines — that lane ships the engines that
  *do* install and run here: CuPy, Numba, Taichi, JAX.

Keeping these three out of every lane is what lets a learner clone CAOS_SIMLAB and run **every** example
without a CUDA toolkit, a conda environment, or a long-path Windows workaround.

---

## FLAME GPU 2 — how it *would* be installed

FLAME GPU 2 (`pyflamegpu`) is CUDA-coupled C++ with Python bindings. **There is no PyPI wheel**; you install
it via conda or build from source, and the install is welded to a specific CUDA toolkit version.

**Conda (the least painful path), reference only — do NOT run here:**

```bash
# Requires a working NVIDIA driver + CUDA 12 toolkit already present
conda create -n flamegpu python=3.11
conda activate flamegpu
conda install -c flamegpu -c conda-forge pyflamegpu
```

**From source (full control over CUDA arch / SEATBELTS), reference only:**

```bash
git clone https://github.com/FLAMEGPU/FLAMEGPU2.git
cd FLAMEGPU2
cmake -S . -B build -DFLAMEGPU_BUILD_PYTHON=ON -DCMAKE_CUDA_ARCHITECTURES=89
cmake --build build --config Release -j
# then pip install the produced wheel from build/.../dist
```

CUDA notes:

- **Toolkit, not just a driver.** FLAME GPU 2 JIT-compiles agent functions, so it needs the CUDA **toolkit**
  (nvcc/NVRTC + headers), the same class of requirement flagged for
  [CuPy](../15_cupy/01_installation.md).
- **Compute Capability** must match the build (`CMAKE_CUDA_ARCHITECTURES`); the lab's reference GPU
  (RTX 4070 Laptop) is CC 8.9 → `89`.
- **8 GB VRAM ceiling.** The research documents OOM on laptop-class 8 GB GPUs at large populations — cap
  agent counts, prefer compact agent state.
- **AGPL-3.0.** This copyleft license is *why* it is documented as a chapter and never vendored: shipping it
  as a dependency would impose AGPL obligations on a repo we keep permissively licensed. Cite it; do not
  bundle it.

## ABMax — how it *would* be installed (and why it fails here)

ABMax is a **JAX-based** ABM library: agents as array columns, the step function `vmap`-batched and
JIT-compiled — conceptually "Mesa rules, JAX execution."

**The intended install, reference only — it FAILS on this box:**

```bash
pip install abmax
```

**Observed failure on Windows 11 / Python 3.13 (this machine):** the resolve pulls the JAX training-state
ecosystem (it depends transitively on `orbax`), and unpacking a deeply-nested `orbax` checkpoint path
overflows the legacy Windows `MAX_PATH` (260 chars):

```text
OSError: [WinError 206] The filename or extension is too long
```

(This is the same path-length wall already noted in the [JAX install guide](../17_jax/01_installation.md), which
is precisely why JAX is used in this lab as the **bare `vmap`+`jit` primitive over our own vectorized
step**, not via the ABMax wrapper.) Because the failure is in a transitive dependency's on-disk layout, not
in ABMax's own code, the honest options are:

- **Linux / WSL2** — the long-path limit does not bite there; ABMax installs cleanly into a Linux venv.
- **Windows long-paths enabled** — `git config --system core.longpaths true` plus the registry
  `LongPathsEnabled=1` *may* let the unpack succeed, but it is a per-machine system tweak we will not require
  of a learner.
- **Don't.** For our scale, JAX's `vmap`+`jit` (already installed and [verified](../17_jax/02_usage.md)) gives the
  same vectorized idiom without the dependency. That is the chosen path.

License is **Apache-2.0** (permissive) — so the blocker is purely the Windows install, not licensing.

## AMBER — how it *would* be installed

AMBER is a **Polars-columnar, CPU-only** big-ABM accelerator: it stores the whole population as a Polars
DataFrame and expresses each tick as vectorized column operations, reporting large speedups over
object-per-agent Mesa on big, homogeneous models (e.g. large SIR).

**Reference only — do NOT run here:**

```bash
pip install polars        # the columnar engine AMBER is built on
pip install amber-abm     # (upstream packaging is thin; source install may be needed)
```

Notes:

- **No GPU, no CUDA.** AMBER's whole pitch is "big sims without a GPU at all" — it is a pure-CPU,
  vectorized-DataFrame accelerator. That makes it the *least* exotic of the three to install, but its niche
  packaging and the fact that **our scenarios top out at ~10³–10⁵ agents** (comfortable for headless Mesa)
  means there is no payoff to vendoring it.
- It would belong conceptually to the **precompute** lane (CPU, offline), not the GPU lane — but it is
  documented here alongside the heavy-ABM options for one coherent chapter.

---

## Platform notes (this machine)

- **OS:** Windows 11, Python 3.13, project `.venv`.
- **Verified absent:** `pyflamegpu`, `abmax`, and `amber` are confirmed *not* importable in the `.venv`
  (intentional — chapter only). `orbax` *is* present (a JAX-ecosystem dependency), which is consistent with
  the ABMax→orbax long-path failure story above.
- **Reference GPU** (if any of these were ever exercised locally): RTX 4070 Laptop, 8 GB VRAM, CUDA 12 — and
  the 8 GB ceiling is the operative constraint.

## Sanity check (confirm the chapter's premise — absence is correct)

There is nothing to "install-verify" here; the verification is that the three are deliberately **absent**.
You can confirm the premise of the chapter holds in your environment:

```bash
.venv/Scripts/python.exe -c "import importlib.util as u; \
print({m: bool(u.find_spec(m)) for m in ['pyflamegpu','abmax','amber','orbax']})"
```

Expected on the reference machine: `{'pyflamegpu': False, 'abmax': False, 'amber': False, 'orbax': True}` —
the heavy engines absent, `orbax` present (the dependency behind ABMax's Windows install failure).

## Related

- [`02_usage.md`](./02_usage.md) — the *idiom* each engine uses (message-passing / `vmap` / columnar), with
  illustrative snippets.
- [`03_applying.md`](./03_applying.md) — when million-agent scale justifies them, and why our eleven scenarios
  do not reach for them.
- [`agent-based-modeling.md`](../../problem-types/02_agent-based-modeling.md) §2.6 — the heavy/GPU lane in the
  ABM curriculum.
- [GPU lane guide](../../guides/03_gpu-lane.md) — the lab-wide CPU-fallback / precompute-only policy.
- Installable GPU siblings that **do** run here: [CuPy](../15_cupy/01_installation.md) ·
  [Numba](../14_numba/01_installation.md) · [Taichi](../16_taichi/01_installation.md) ·
  [JAX](../17_jax/01_installation.md).
