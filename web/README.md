# web/ — the single-page viewer (building)

The public app: **enter → land in a running simulation**, move the sliders, watch the dynamics; the
theory and method details are one tab away. Pure static — deployed to GitHub Pages at
`simlab.fasl-work.com`.

Planned stack (CAOS web baseline): **React 19 + Vite 6** + react-i18next (English default, Spanish
second) + light/dark. Rendering: **@xyflow/react** (queue/process networks), **Canvas2D** (agent grids),
**deck.gl + MapLibre GL** (geospatial routes, 2D). The **live** lane runs `simlab` in a **Pyodide** Web
Worker; the **precomputed** lane loads a committed trace from `../data/artifacts/` and replays it through
the *same* render path.

`public/CNAME` pins the custom domain. The Pages deploy workflow (Actions on `main`, building `web/` and
overlaying `data/artifacts/` + `manifests/`) is added when this app is scaffolded in Phase 1.

> Not yet scaffolded — the engine, scenario S01, and its trace/manifest are in place first so the viewer
> has real data to render.
