# NetLogo Web (Tortoise) — 02 · usage

How to take a NetLogo model that has been exported to **standalone HTML** (see
[`01_installation.md`](./01_installation.md)) and embed it as a **LIVE, client-side simulation card** inside
the lab's React/Vite SPA — with the IDE chrome stripped so the visitor sees only the running model.

> **No Python `example.py` here.** NetLogo Web is JavaScript, not a pip pipeline, so this node has **no
> `example.py`** to `python …` and **no captured stdout block** like the Python framework nodes. The
> "runnable artifact" is the **HTML/JS embed** in §3 below, and its "output" is the **rendered, animated
> card** described in §4 (you verify it by serving the HTML and looking at it — see
> [`01_installation.md`](./01_installation.md) §6). The facts about the export format and license model are
> grounded in NetLogo's own docs (see References).

---

## 1. The mental model

There are three layers, and keeping them separate is the whole trick:

```text
NetLogo source (.nlogo)         standalone HTML (engine inlined)        React/Vite SPA
┌──────────────────────┐  Save As/  ┌───────────────────────────┐  serve  ┌─────────────────────┐
│ turtles / patches +   │  Export   │ Tortoise engine JS +       │ static  │ <iframe> live card  │
│ Interface widgets     ├──────────►│ Interface widgets + model  ├────────►│ (chrome stripped)   │
└──────────────────────┘  to HTML   └───────────────────────────┘         └─────────────────────┘
   authoring time              one self-contained file                 zero server compute
```

- **Authoring layer** — NetLogo source: `turtles`, `patches`, `to setup` / `to go`, sliders.
- **Engine layer** — the **Tortoise** runtime compiled the model to JS and inlined it in the HTML. This is
  what actually steps the simulation, draws the view, and wires the buttons/sliders. You do not write JS for
  the model itself.
- **Host layer** — your SPA. It does **not** simulate anything; it just frames the HTML and (optionally)
  passes parameters in. All compute is in the visitor's browser.

## 2. Key concepts you control from the host

| Concept | Where it lives | How the SPA touches it |
|---|---|---|
| **The model** | inside the exported HTML | served as a static asset; loaded by `<iframe src>` |
| **Interface widgets** (Setup/Go buttons, sliders, plots, the view) | inside the HTML | shown to the user; the user clicks/drags them directly |
| **IDE "chrome"** (code tab, file menus, info tab, model header) | inside the HTML | **hidden via injected CSS** so only the model shows |
| **Determinism** | NetLogo `random-seed` | set in the model's `setup` (e.g. `random-seed 42`) so the live card is reproducible — matches the lab's seeded-replay ethos |

The lab's house rule is **seed everything**. In NetLogo that means putting `random-seed <fixed>` at the top
of `setup`, so the in-browser run is the *same* run every visitor sees on first load — consistent with how
the Python scenarios pin `rng=`/`seed=`.

### The two-element NetLogo program you are exporting

So the embed is concrete, here is the minimal Schelling-style NetLogo source that produces an exportable
card. The two procedures `setup` and `go` are the entire model contract — `setup` seeds and initializes,
`go` is the per-tick step the **Go** button loops:

```netlogo
;; minimal seeded NetLogo model — the source you Save As NetLogo Web HTML
globals [ pct-similar ]                ; reported on the Interface
turtles-own [ happy? ]

to setup
  clear-all
  random-seed 42                       ; <-- determinism: same run every first load
  ask patches [ if random 100 < density [ sprout 1 [ set color one-of [ red blue ] ] ] ]
  update-happiness
  reset-ticks
end

to go
  if all? turtles [ happy? ] [ stop ]  ; halt when segregation settles
  ask turtles with [ not happy? ] [ move-to one-of patches with [ not any? turtles-here ] ]
  update-happiness
  tick
end

to update-happiness                    ; "happy" if >= %-similar-wanted neighbours match
  ask turtles [
    let mates count (turtles-on neighbors) with [ color = [color] of myself ]
    let total count turtles-on neighbors
    set happy? (total = 0) or (mates / total * 100 >= pct-similar-wanted)
  ]
end
```

`density` and `pct-similar-wanted` are **slider** widgets laid out on the Interface; the visitor drags them
live. You do not ship this `.nlogo` text to the SPA — you **export it to HTML** (the engine is inlined) and
serve that. The source is shown only so the embed below is not a black box.

## 3. The minimal embed (the runnable artifact)

### 3a. Strip the IDE chrome

A standalone export includes the full NetLogo Web shell (a header, the **NetLogo Code** tab, an **Info**
tab, and toolbar). For a clean live card we want only the model's Interface (the view + its widgets). The
NetLogo Web shell tags those areas with stable class names; hide everything except the Interface with a
small CSS override. The simplest, most robust place to apply it is **inside the exported HTML itself** (so
it travels with the file), appended just before `</head>`:

```html
<!-- injected into the exported standalone HTML, before </head> -->
<style>
  /* Hide NetLogo Web IDE chrome — show only the running model's Interface */
  .netlogo-tab-area,            /* the Code / Info / Interface tab bar */
  .netlogo-code-tab,            /* the source editor */
  .netlogo-info-tab,            /* the Info/markdown tab */
  .netlogo-model-title,         /* the model header/title */
  .netlogo-powered-by { display: none !important; }
  body { margin: 0; background: transparent; }
  .netlogo-model { border: 0 !important; box-shadow: none !important; }
</style>
```

> Class names vary slightly across NetLogo Web releases — open your exported file, inspect the elements you
> want gone, and confirm the selectors. **Pin one engine version per model** so the selectors stay valid.

### 3b. Embed via `<iframe>` (the recommended path)

An `<iframe>` is the cleanest isolation: the model's JS, globals, and CSS can never collide with the SPA.
This is the path the research recommends ("embed via iframe / the `netlogo-engine.js` runtime").

```html
<!-- Plain HTML version of the live card -->
<iframe
  src="/netlogo/s02-schelling.html"
  title="Schelling segregation — live (NetLogo Web)"
  width="640" height="560"
  loading="lazy"
  sandbox="allow-scripts allow-same-origin"
  style="border:0; width:100%; aspect-ratio: 8 / 7;">
</iframe>
```

`sandbox="allow-scripts allow-same-origin"` lets the Tortoise engine run while still isolating the frame.
`loading="lazy"` defers loading the engine until the card scrolls into view — important because each model
HTML carries its own copy of the engine.

### 3c. As a React component in the Vite SPA

In the actual SPA (React 19 + Vite 6), wrap the iframe in a small component and resolve the asset through
Vite's `BASE_URL` (the app is served under a base path on GitHub Pages / the VPS):

```tsx
// web/src/components/sim/NetLogoCard.tsx
const BASE = import.meta.env.BASE_URL; // e.g. "/" locally, "/simlab/" in prod

type Props = { model: string; title: string; ratio?: string };

/** A LIVE NetLogo Web card: client-side ABM, zero server compute.
 *  `model` is a file under web/public/netlogo/, e.g. "s02-schelling.html". */
export function NetLogoCard({ model, title, ratio = "8 / 7" }: Props) {
  return (
    <iframe
      src={`${BASE}netlogo/${model}`}
      title={title}
      loading="lazy"
      sandbox="allow-scripts allow-same-origin"
      style={{ border: 0, width: "100%", aspectRatio: ratio }}
    />
  );
}
```

```tsx
// usage in a scenario page
<NetLogoCard model="s02-schelling.html" title="S02 — Schelling segregation (live)" />
<NetLogoCard model="s03-sir.html"      title="S03 — SIR epidemic (live)" />
```

### 3d. Advanced: the raw runtime (no iframe)

If you must render the model *inside* a React node (no iframe — e.g. to share theme CSS), load the
`tortoise-engine.js` runtime and mount the compiled model into a container element. This is the
**Galapagos** path and is materially more work (you own engine versioning, sizing, and CSS-collision risk),
so the lab defaults to the iframe in 3b/3c. Sketch only:

```html
<div id="netlogo-host"></div>
<script src="/netlogo/tortoise-engine.js"></script>
<script>
  // pseudocode: the Galapagos session API mounts a compiled model into the host element
  // and exposes a controller to run setup/go and read/write globals (slider values).
  // See https://github.com/NetLogo/Galapagos for the concrete session API.
</script>
```

## 4. What you should see (in lieu of stdout)

Because there is no Python process, the "output" is the rendered card, not a console dump. A correct embed
shows, with **zero network/server compute** after the static file loads:

- The NetLogo **view** (the 2-D world) animating once **Go** is pressed (or auto-running if the model loops).
- **Sliders** that change behavior live (e.g. Schelling's `pct-similar-wanted` / `density`, SIR's infection
  probability).
- **Plots** updating each tick (e.g. SIR's S/I/R curves, or Schelling's `% happy`).
- **No** Code tab, Info tab, or model header (stripped in 3a).

For the seeded Schelling source in §2, a correct run **settles** — the `go` loop self-stops once every
turtle is happy (`if all? turtles [ happy? ] [ stop ]`), and because `setup` calls `random-seed 42`, the
final segregated pattern is **identical on every first load**. That reproducibility *is* the verification
for this JS engine: re-run twice from the same seed and the view ends in the same configuration.

If instead you see the NetLogo source code as text, the file is plain `.nlogo` source, not a NetLogo Web
HTML export — re-export per [`01_installation.md`](./01_installation.md) §2.

## 5. Verified facts (engine + export model)

Since there is nothing to execute as a Python script, here are the load-bearing facts, each verified against
NetLogo's own documentation rather than asserted from memory:

- **Tortoise compiles NetLogo to JavaScript** and provides the runtime engine; netlogoweb.org runs models
  fully client-side with no plugin. (Tortoise repo.)
- **Export to standalone HTML exists two ways**: desktop **File → Save As NetLogo Web…**, or on
  netlogoweb.org **Export → HTML** (top-right). The result is a self-contained `.html` you embed in an
  `<iframe>`. (NetLogo docs / dev list.)
- **License split is real**: *Code Examples* in the Models Library are **CC0 / public domain**; most other
  Models Library models are **CC BY-NC-SA** (noncommercial, *not* open source). (NetLogo FAQ.) This drives
  the model-sourcing rule in [`03_applying.md`](./03_applying.md) §4.

## 6. Grounding / references

- ABM-frameworks research (LIVE-lane decision + the chrome-strip + iframe embed pattern):
  `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`.
- Tortoise (NetLogo → JS compiler + runtime): <https://github.com/NetLogo/Tortoise>
- Galapagos (netlogoweb.org front-end / session API): <https://github.com/NetLogo/Galapagos>
- NetLogo Web: <https://netlogoweb.org>
- NetLogo FAQ (license mix; Code Examples CC0): <https://docs.netlogo.org/faq>
- "Save As NetLogo Web" / Export HTML + iframe embed (dev list):
  <https://www.mail-archive.com/netlogo-devel@googlegroups.com/msg01250.html>
- ABM problem-type guide: [`../../problem-types/02_agent-based-modeling.md`](../../problem-types/02_agent-based-modeling.md)
