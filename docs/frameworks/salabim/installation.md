# Salabim — Installation

Salabim is a pure-Python discrete-event simulation (DES) library with **built-in 2D/3D
animation** and **offline video export**. In CAOS_SIMLAB it lives in the **precompute /
offline lane only** — it is the offline movie-maker and a teaching counterpoint to SimPy,
never part of the live in-browser build (its animation is a desktop GUI; see
[`applying.md`](./applying.md)).

## Which requirements file

**`requirements-precompute.txt`** — the offline lane that generates committed traces and
rendered videos for heavy scenarios. Salabim is *not* in `requirements.txt` (the base /
live lane) on purpose: it is never loaded by the browser and is not part of the Pyodide
wheel closure.

```text
# requirements-precompute.txt  (offline lane)
salabim>=26.0          # DES teaching counterpoint + offline .mp4/.gif render (desktop/headless only)
```

> Note: as of this writing Salabim is installed in the lab `.venv` but not yet pinned in
> `requirements-precompute.txt`. Add the line above so the offline lane is reproducible.

## Exact install line and installed version

```bash
pip install "salabim>=26.0"
```

- **Installed version in this lab:** `salabim 26.0.6`
- **Verify:**

  ```bash
  .venv/Scripts/python.exe -c "import salabim as sim; print(sim.__version__)"
  # -> 26.0.6
  ```

- **License:** MIT (safe for a public repo — recorded in `LICENSES.md` / `ATTRIBUTION.md`).
- **Python tested here:** CPython 3.13.0 on Windows.

> Do not run `pip install` inside the lab session — everything is already installed. The
> line above documents *how* the environment was built and *what* version is pinned.

## Dependencies — what actually gets pulled in

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

### Important platform note — greenlet is **not** installed here

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

### Headless rendering note

To render frames **without opening a GUI window** (CI, a server, or just to avoid a popup),
create the environment with `blind_animation=True`. The animation engine is wired up but no
tkinter window is created. This is exactly how the offline-render pipeline produces an
`.mp4`/`.gif` on a machine that may have no display — see [`usage.md`](./usage.md).

### GPU / CUDA

**None.** Salabim is CPU-only pure Python. There is no CUDA path and no GPU acceleration —
and none is wanted, because Salabim's role here is offline rendering, not large-scale
compute. (For the lab's optional GPU exhibit see the Monte-Carlo / CuPy-Numba docs, not
this page.)

## Where it belongs in the lab architecture

- **Live lane (browser / Pyodide):** never. Salabim's animation is tkinter desktop and
  cannot run in a browser; the base `requirements.txt` excludes it.
- **Precompute lane (local machine):** yes — render heavy-scenario replay videos offline
  and commit the compact artifact; the SPA replays it under the *"precomputed due to cost"*
  banner.

See [`usage.md`](./usage.md) for a runnable example and [`applying.md`](./applying.md) for
how this maps onto the lab's scenarios and when to pick Salabim vs SimPy/Ciw.
