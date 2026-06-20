# NetLogo Web (Tortoise) — installation

**NetLogo Web** is NetLogo compiled to **JavaScript** by the **Tortoise** compiler/runtime. It is *not* a
Python package and *not* a pip dependency — it is a **client-side JS engine**. You do not `pip install` it;
you **author a model** (in NetLogo desktop or on netlogoweb.org) and **export a standalone HTML file** that
already contains the engine inlined. That HTML is then embedded in the lab's React/Vite SPA and runs
**entirely in the visitor's browser** — zero server compute.

This is the **LIVE on-ramp lane** for ABM: the visitor lands on a page and a real, animated simulator is
already running, with sliders, on a no-GPU VPS that only serves static files. (Contrast the Mesa lane,
which is offline precompute → committed trace → replay; see [`../mesa/installation.md`](../mesa/installation.md).)

## What "installing" means here

| Item | Value |
|---|---|
| Component | NetLogo Web / **Tortoise** compiler + runtime engine |
| Distribution | **JavaScript** (browser), not PyPI / not a wheel |
| How you obtain it | Bundled inside the **standalone HTML** that NetLogo exports, *or* the `tortoise-compiler.js` + `tortoise-engine.js` artifacts from the Tortoise / Galapagos repos |
| Requirements file it belongs to | **None.** It is *not* in `requirements.txt`, `requirements-precompute.txt`, or `requirements-gpu.txt` |
| Engine license | Open source (Tortoise repo); runtime deps are MIT / EPL-1.0 |
| Authoring tool license | NetLogo desktop is **GPL-2.0+** |
| Model-code license | **Mixed** — *Code Examples* are **CC0** (public domain); most Models Library models are **CC BY-NC-SA** (noncommercial, *not* an open-source license). See [applying.md](./applying.md) §4 |
| Problem type | Agent-Based Modeling (ABM), live in browser |
| Server compute | **Zero** — pure client-side JS |

> Because NetLogo Web is JavaScript, there is **no `example.py`** for this framework and **no pip line**.
> Everything below is an authoring + embedding workflow, not a Python install. The runnable artifact lives
> in [usage.md](./usage.md) as an HTML/JS embed snippet.

## Step 1 — author or pick a model

Two authoring paths, both producing a standalone HTML you can serve from `web/public/`:

**A. NetLogo desktop (recommended for authoring our own models).**
Download NetLogo desktop (free, GPL-2.0+) from the Northwestern CCL site. Build or open a model, lay out
the Interface (sliders, buttons, plots, the view), then use **File → Save As NetLogo Web…**. This writes a
single `.html` file with the Tortoise engine **bundled inside** it.

> Caveat: the NetLogo Web version bundled with desktop may lag behind the live site. For the freshest engine,
> upload the same model to **netlogoweb.org** and export from there (Step 1B).

**B. netlogoweb.org (freshest engine + quick edits).**
Open <https://netlogoweb.org>, load a model from the Models Library or upload your `.nlogo` file, then use
the **Export → HTML** button (top-right of the model). This downloads a standalone HTML built with the
**latest** deployed Tortoise.

Either way the output is **one self-contained `.html` file**: the NetLogo source, the Interface widgets, and
the compiled JS engine are all in it. No external network calls are required to run it.

## Step 2 — (optional) obtain the engine artifacts directly

If you want to drive the runtime yourself (compile NetLogo source to JS at build time, or mount a model into
a custom React widget instead of an `<iframe>`), the engine ships as two artifacts:

- **`tortoise-compiler.js`** — turns NetLogo source/model into JavaScript (`compilerJS`, a Scala.js build).
- **`tortoise-engine.js`** — the runtime that executes the compiled JS (Scala.js + CoffeeScript; pulls in
  Mori, Tone.js, crypto-js, vectorious).

These are produced by / published from the **Tortoise** repo (<https://github.com/NetLogo/Tortoise>) and
consumed by **Galapagos** (<https://github.com/NetLogo/Galapagos>), the web front-end that powers
netlogoweb.org. For this lab the **standalone-HTML path (Step 1) is the default** because it is far simpler
and needs no build wiring; the raw-artifact path is documented only for the advanced "custom widget" case in
[usage.md](./usage.md) §4.

## Step 3 — place the HTML in the SPA's static assets

Drop the exported file under the web app's public assets so Vite serves it verbatim:

```
web/public/netlogo/s02-schelling.html
web/public/netlogo/s03-sir.html
```

Vite copies `web/public/**` to the build output untouched, so each model is reachable at
`<BASE_URL>/netlogo/<model>.html` and embeddable with an `<iframe>` (see [usage.md](./usage.md)).

## Platform / runtime notes

- **No OS install, no toolchain, no CUDA.** The engine is JavaScript; it runs in any modern browser
  (Chromium / Firefox / Safari). There is nothing to compile on the VPS and no GPU involvement.
- **No Pyodide.** Unlike the lab's NumPy/SimPy live scenarios (which run Python *in* the browser via
  Pyodide), NetLogo Web is native JS — it does **not** load the Pyodide runtime, so its cold-start is
  smaller and independent of the wheel closure.
- **Practical in-browser scale** is ~1e3–1e4 agents — perfect for the canonical on-ramp models (Schelling,
  SIR) and intentionally below Mesa's ~1e5 object-per-agent ceiling. Heavy/large ABM stays in the offline
  Mesa / FLAME-GPU-2 / ABMax / AMBER lanes (see [applying.md](./applying.md)).
- **Offline-capable** once served: the standalone HTML has no runtime dependencies on netlogoweb.org.

## Verify it works

There is no `python -c "import …"` check (it is not a Python module). Verify by serving the exported HTML
and opening it:

```bash
# from web/public/netlogo/ — any static server works; example using the project's web dev server:
# (cwd = web/) npm run dev   →   open http://localhost:5173/netlogo/s02-schelling.html
```

A correct export shows the NetLogo **view** animating with **Setup/Go** buttons and sliders responding —
all without any server-side process. If you see only NetLogo source text, the file was saved as `.nlogo`
(plain source), not exported as **NetLogo Web HTML** — re-do Step 1.

## Grounding / references

- ABM-frameworks research (decision: "Power the LIVE in-browser ABM scenarios with NetLogo Web (Tortoise);
  compiles to JavaScript and runs entirely client-side, so the no-GPU VPS just serves static files"):
  `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`.
- Tortoise (JS compiler + runtime, engine artifacts): <https://github.com/NetLogo/Tortoise>
- Galapagos (the netlogoweb.org front-end): <https://github.com/NetLogo/Galapagos>
- NetLogo Web: <https://netlogoweb.org>
- NetLogo copyright / license (GPL-2.0+) & FAQ (Models Library license mix; Code Examples are CC0):
  <https://docs.netlogo.org/copyright> · <https://docs.netlogo.org/faq>
- Models Library (mixed CC0 / CC BY-NC-SA): <https://github.com/NetLogo/models>
