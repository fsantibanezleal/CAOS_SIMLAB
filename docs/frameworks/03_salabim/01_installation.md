# Salabim — 01 · Installation

Salabim is a pure-Python discrete-event simulation (DES) library with **built-in 2D/3D
animation** and **offline video export**. In CAOS_SIMLAB it lives in the **precompute /
offline lane only** — it is the offline movie-maker and a teaching counterpoint to SimPy,
never part of the live in-browser build (its animation is a desktop GUI; see
[`03_applying.md`](./03_applying.md)).

Read order for this node: **you are here (01)** → [`02_usage.md`](./02_usage.md) (the API +
runnable example) → [`03_applying.md`](./03_applying.md) (where the lab uses it, and the
trade-offs). The landing page for the node is the sibling
[`../03_salabim.md`](../03_salabim.md).

---

## 1. Which requirements lane

The lab splits its Python dependencies into two lanes:

| Lane | File | Loaded by | Salabim here? |
|---|---|---|---|
| **Base / live** | `requirements.txt` | the browser (Pyodide wheel closure) + the live SPA | **No** — never shipped to the browser |
| **Precompute / offline** | `requirements-precompute.txt` | the local machine that renders heavy artifacts | **Yes** — this is Salabim's home |

Salabim is deliberately **absent from `requirements.txt`**: it is never loaded by Pyodide
and would only bloat the wheel closure for a feature (tkinter animation) the browser cannot
run anyway. It belongs in the offline lane that produces committed traces and rendered
videos:

```text
# requirements-precompute.txt  (offline lane)
salabim>=26.0          # DES teaching counterpoint + offline .mp4/.gif render (desktop/headless only)
```

> Note: at the time of writing Salabim is installed in the lab `.venv` but may not yet be
> pinned in `requirements-precompute.txt`. Add the line above so the offline lane is
> reproducible from a clean checkout.

## 2. Exact install line and installed version

```bash
pip install "salabim>=26.0"
```

- **Installed version in this lab:** `salabim 26.0.6`
- **Verify:**

  ```bash
  .venv/Scripts/python.exe -c "import salabim as sim; print(sim.__version__)"
  # -> 26.0.6
  ```

- **License:** MIT (safe for a public repo — recorded in
  [`LICENSES.md`](../../../LICENSES.md) / [`ATTRIBUTION.md`](../../../ATTRIBUTION.md)).
- **Python tested here:** CPython 3.13.0 on Windows.

> Do not run `pip install` inside the lab session — everything is already installed. The
> line above documents *how* the environment was built and *what* version is pinned.

## 3. Dependencies — what actually gets pulled in

Salabim's core is **pure Python with zero mandatory dependencies** (`pip show salabim`
reports an empty `Requires:` field). Everything beyond the headless engine is an *optional*
extra that Salabim imports lazily, only when you exercise that feature:

| Capability | Optional dependency | Needed when… |
|---|---|---|
| **Yieldless process style** (the 26.x *default*) | `greenlet` (native) | you create `Environment()` without `yieldless=False`. |
| Live desktop animation window | `tkinter` (ships with CPython) + a display | you call `env.animate(True)` with a screen attached. |
| Image compositing for frames | `Pillow` | animation / video with image components. |
| Numeric helpers in some animations | `numpy` (already a core lab dep) | certain animation objects. |
| **Video export** (`.mp4` / `.gif` / `.avi`) | an `ffmpeg` binary on `PATH` (for mp4/avi) | you call `env.video("out.mp4")`. GIF needs only Pillow. |

The practical takeaway: a *headless, no-video* DES run (exactly what
[`example.py`](./example.py) does) needs **nothing but Salabim itself** in classic
generator mode. Each extra above is a deliberate opt-in.

### 3.1 Important platform note — greenlet is **not** installed here

Salabim 26.x defaults to the **yieldless** process style, which is built on the native
`greenlet` extension. This lab deliberately does **not** carry `greenlet` (it is in no
requirements file), so the default mode raises `ModuleNotFoundError: No module named
'greenlet'`. The lab uses the **classic generator style** instead:

```python
env = sim.Environment(random_seed=42, yieldless=False)
```

In this mode every process is a Python generator and every wait is a `yield`
(`yield self.request(...)`, `yield self.hold(...)`) — the same process-interaction model
taught for SimPy, with **no native dependency**. This is what
[`example.py`](./example.py) uses, and it is the recommended mode for the lab unless you
explicitly add `greenlet` to the precompute lane.

> If you *do* want yieldless mode (slightly terser process code, no `yield`), add
> `greenlet` to `requirements-precompute.txt` and drop the `yieldless=False`. The lab's
> default stays generator-style so the offline lane has zero native build deps.

### 3.2 Headless rendering note

To render frames **without opening a GUI window** (CI, a server, or just to avoid a popup),
create the environment with `blind_animation=True`. The animation engine is wired up but no
tkinter window is created. This is exactly how the offline-render pipeline produces an
`.mp4`/`.gif` on a machine that may have no display — see [`02_usage.md`](./02_usage.md) §4.

### 3.3 GPU / CUDA

**None.** Salabim is CPU-only pure Python. There is no CUDA path and no GPU acceleration —
and none is wanted, because Salabim's role here is offline rendering, not large-scale
compute. (For the lab's optional GPU exhibit see the Monte-Carlo / CuPy / Numba / Taichi
docs, not this page.)

## 4. Where it belongs in the lab architecture

- **Live lane (browser / Pyodide):** never. Salabim's animation is tkinter desktop and
  cannot run in a browser; the base `requirements.txt` excludes it.
- **Precompute lane (local machine):** yes — render heavy-scenario replay videos offline
  and commit the compact artifact; the SPA replays it under the *"precomputed due to cost"*
  banner.
- **VPS:** never runs Salabim; it only serves the SPA + committed artifacts.

See [`02_usage.md`](./02_usage.md) for a runnable example and
[`03_applying.md`](./03_applying.md) for how this maps onto the lab's scenarios and when to
pick Salabim vs SimPy / Ciw.
