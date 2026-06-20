# web/ — the single-page viewer

The public app: **enter → land in a running simulation**, move the sliders, watch the dynamics; the
theory and method details are one tab away. Pure static — deployed to GitHub Pages at
[simlab.fasl-work.com](https://simlab.fasl-work.com).

**Stack (CAOS web baseline):** React 19 + Vite 6 + TypeScript · react-i18next (English default, Spanish
second) · light/dark theme · `react-router-dom` · `zustand` (state) · **KaTeX** (rendered math in the
Theory/Context pages) · `lucide-react` (icons).

**Rendering** is hand-rolled for full control over the didactic value-readout overlays: **inline SVG** for
networks, gauges, route maps, and charts, plus **Canvas2D** for the agent grids (Schelling, SIR). No
heavyweight graph/map dependency — the trace schema drives every view directly.

**The two lanes share one render path.** The **live** lane runs `simlab` in a **Pyodide** Web Worker
(NumPy via `loadPackage`, SimPy via `micropip`, the `simlab` sources inlined), so you can edit parameters
and re-run in the browser; byte-equality against the committed trace enforces *replay = truth*. The
**precomputed** lane loads a committed seeded trace from `data/artifacts/` (overlaid into the build) and
replays it through the *same* components with a timeline scrubber.

`public/CNAME` pins the custom domain. `copy-data.mjs` (the `predev`/`prebuild` hook) overlays
`../data/artifacts/` + `../manifests/` into the app. Deploy is GitHub Actions on `main` (build `web/`,
publish to Pages) — see the management repo for the workflow + DNS.

```bash
npm install
npm run dev      # local dev (copies data, then Vite)
npm run build    # tsc + vite build → dist/
npm run preview  # serve the production build locally
```
