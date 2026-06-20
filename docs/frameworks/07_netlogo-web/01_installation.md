# NetLogo Web (Tortoise) — 01 · installation

**NetLogo Web** is NetLogo compiled to **JavaScript** by the **Tortoise** compiler/runtime. It is *not* a
Python package and *not* a pip dependency — it is a **client-side JS engine**. You do not `pip install` it;
you **author a model** (in NetLogo desktop or on netlogoweb.org) and **export a standalone HTML file** that
already contains the engine inlined. That HTML is then embedded in the lab's React/Vite SPA and runs
**entirely in the visitor's browser** — zero server compute.

This is the **native-JS LIVE on-ramp lane** for ABM: the visitor lands on a page and a real, animated
simulator is already running, with sliders, on a no-GPU VPS that only serves static files — with no Pyodide
download at all. (The Mesa lane *also* runs live, but via Pyodide-Python, backed by a committed canonical
trace for instant first paint; see the [Mesa node](../04_mesa.md).)

> **Reading order for this node:** start here (install/obtain the engine), then
> [`02_usage.md`](./02_usage.md) (the real embed API + the runnable artifact), then
> [`03_applying.md`](./03_applying.md) (how to formalize + solve an ABM problem with it, and which lab
> scenarios use it). The landing page is the sibling [`../07_netlogo-web.md`](../07_netlogo-web.md).

## 1. What "installing" means here

| Item | Value |
|---|---|
| Component | NetLogo Web / **Tortoise** compiler + runtime engine |
| Distribution | **JavaScript** (browser), not PyPI / not a wheel |
| How you obtain it | Bundled inside the **standalone HTML** that NetLogo exports, *or* the `tortoise-compiler.js` + `tortoise-engine.js` artifacts from the Tortoise / Galapagos repos |
| Requirements file it belongs to | **None.** It is *not* in `requirements.txt`, `requirements-precompute.txt`, or `requirements-gpu.txt` |
| Engine license | Open source (Tortoise repo); runtime deps are MIT / EPL-1.0 |
| Authoring-tool license | NetLogo desktop is **GPL-2.0+** (used to author only; never redistributed) |
| Model-code license | **Mixed** — *Code Examples* are **CC0** (public domain); most Models Library models are **CC BY-NC-SA** (noncommercial, *not* an open-source license). See [`03_applying.md`](./03_applying.md) §4 |
| Problem type | Agent-Based Modeling (ABM), live in browser |
| Server compute | **Zero** — pure client-side JS |
| Practical in-browser scale | ~1e3–1e4 agents (below Mesa's ~1e5 object-per-agent ceiling) |

> Because NetLogo Web is JavaScript, there is **no `example.py`** for this framework, **no pip line**, and
> **no `requirements*.txt` entry**. Everything below is an authoring + embedding workflow, not a Python
> install. The runnable artifact lives in [`02_usage.md`](./02_usage.md) as an HTML/JS embed snippet.

### Where this sits relative to the lab's other lanes

| Lane | Engine | Where it runs | Cold start |
|---|---|---|---|
| **LIVE / native JS** (this node) | NetLogo Web (Tortoise) | visitor's browser, native JS | smallest — no runtime download beyond the HTML |
| **LIVE / Python-in-browser** | SimPy, Ciw, **Mesa**, joblib/SciPy, NetworkX via **Pyodide** (`⊆ LIVE_WHEELS`) | visitor's browser, WASM | larger — must fetch/micropip the wheel closure first (~3 s for Mesa) |
| **Offline → replay (native code only)** | OR-Tools / JuPedSim / GPU engines | precompute box, committed trace, static replay | n/a — the browser only replays a JSON/Arrow trace |

NetLogo Web is the only engine that **simulates live in the browser without Pyodide** (compiled JS), which is
exactly why it owns the "enter → a running simulator, instantly" on-ramp. Mesa runs live too, but via Pyodide
(it pays the WASM cold start). The offline-replay lane is reserved for **native code** that cannot run in
WASM (OR-Tools, JuPedSim, GPU engines) — not for Mesa.

## 2. Step 1 — author or pick a model

Two authoring paths, both producing a standalone HTML you can serve from `web/public/`:

**A. NetLogo desktop (recommended for authoring our own models).**
Download NetLogo desktop (free, GPL-2.0+) from the Northwestern CCL site. Build or open a model, lay out
the Interface (sliders, buttons, plots, the view), then use **File → Save As NetLogo Web…**. This writes a
single `.html` file with the Tortoise engine **bundled inside** it.

> Caveat: the NetLogo Web version bundled with desktop may lag behind the live site. For the freshest engine,
> upload the same model to **netlogoweb.org** and export from there (path B).

**B. netlogoweb.org (freshest engine + quick edits).**
Open <https://netlogoweb.org>, load a model from the Models Library or upload your `.nlogo` file, then use
the **Export → HTML** button (top-right of the model). This downloads a standalone HTML built with the
**latest** deployed Tortoise.

Either way the output is **one self-contained `.html` file**: the NetLogo source, the Interface widgets, and
the compiled JS engine are all in it. No external network calls are required to run it.

> **Seed it now, not later.** Put `random-seed <fixed>` at the top of `setup` *before* you export, so the
> committed HTML is reproducible on first load. This is the same determinism discipline the Python scenarios
> enforce with `rng=`/`seed=`. See [`02_usage.md`](./02_usage.md) §2.

## 3. Step 2 — (optional) obtain the engine artifacts directly

If you want to drive the runtime yourself (compile NetLogo source to JS at build time, or mount a model into
a custom React widget instead of an `<iframe>`), the engine ships as two artifacts:

- **`tortoise-compiler.js`** — turns NetLogo source/model into JavaScript (`compilerJS`, a Scala.js build).
- **`tortoise-engine.js`** — the runtime that executes the compiled JS (Scala.js + CoffeeScript; pulls in
  Mori, Tone.js, crypto-js, vectorious).

These are produced by / published from the **Tortoise** repo (<https://github.com/NetLogo/Tortoise>) and
consumed by **Galapagos** (<https://github.com/NetLogo/Galapagos>), the web front-end that powers
netlogoweb.org. For this lab the **standalone-HTML path (Step 1) is the default** because it is far simpler
and needs no build wiring; the raw-artifact path is documented only for the advanced "custom widget" case in
[`02_usage.md`](./02_usage.md) §3d.

## 4. Step 3 — place the HTML in the SPA's static assets

Drop the exported file under the web app's public assets so Vite serves it verbatim:

```text
web/public/netlogo/s02-schelling.html
web/public/netlogo/s03-sir.html
```

Vite copies `web/public/**` to the build output untouched, so each model is reachable at
`<BASE_URL>/netlogo/<model>.html` and embeddable with an `<iframe>` (see [`02_usage.md`](./02_usage.md)).

## 5. Platform / runtime notes

- **No OS install, no toolchain, no CUDA.** The engine is JavaScript; it runs in any modern browser
  (Chromium / Firefox / Safari). There is nothing to compile on the VPS and no GPU involvement.
- **No Pyodide.** Unlike the lab's NumPy/SimPy live scenarios (which run Python *in* the browser via
  Pyodide), NetLogo Web is native JS — it does **not** load the Pyodide runtime, so its cold-start is
  smaller and independent of the wheel closure.
- **Practical in-browser scale** is ~1e3–1e4 agents — perfect for the canonical on-ramp models (Schelling,
  SIR) and intentionally below Mesa's ~1e5 object-per-agent ceiling. Heavy/large ABM stays in the offline
  Mesa / FLAME-GPU-2 / ABMax / AMBER lanes (see [`03_applying.md`](./03_applying.md) §5 and the
  [GPU-ABM reference chapter](../18_gpu-abm-chapter.md)).
- **Offline-capable** once served: the standalone HTML has no runtime dependencies on netlogoweb.org.
- **Each HTML carries its own engine copy.** Two model cards on a page means two engine copies downloaded;
  use `loading="lazy"` on the iframes (see [`02_usage.md`](./02_usage.md) §3b) so the engine loads only when
  a card scrolls into view.

## 6. Verify it works

There is no `python -c "import …"` check (it is not a Python module). Verify by serving the exported HTML
and opening it:

```bash
# from web/ — any static server works; example using the project's web dev server:
npm run dev    # then open http://localhost:5173/netlogo/s02-schelling.html
```

A correct export shows the NetLogo **view** animating with **Setup/Go** buttons and sliders responding —
all without any server-side process. If you see only NetLogo source text, the file was saved as `.nlogo`
(plain source), not exported as **NetLogo Web HTML** — re-do Step 1. Always screenshot-verify the embedded
card before deploy (the lab's screenshot-verify rule applies — building blind is how broken UI ships).

## 7. Grounding / references

- ABM-frameworks research (decision: "Power the LIVE in-browser ABM scenarios with NetLogo Web (Tortoise);
  compiles to JavaScript and runs entirely client-side, so the no-GPU VPS just serves static files"):
  `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`.
- Tortoise (JS compiler + runtime, engine artifacts): <https://github.com/NetLogo/Tortoise>
- Galapagos (the netlogoweb.org front-end): <https://github.com/NetLogo/Galapagos>
- NetLogo Web: <https://netlogoweb.org>
- NetLogo copyright / license (GPL-2.0+) & FAQ (Models Library license mix; Code Examples are CC0):
  <https://docs.netlogo.org/copyright> · <https://docs.netlogo.org/faq>
- Models Library (mixed CC0 / CC BY-NC-SA): <https://github.com/NetLogo/models>
- ABM problem-type guide: [`../../problem-types/02_agent-based-modeling.md`](../../problem-types/02_agent-based-modeling.md)
