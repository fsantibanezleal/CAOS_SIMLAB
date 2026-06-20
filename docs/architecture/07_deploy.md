# 07 · Deploy — GitHub Pages + CI

The host plane is the trivial third leg of the design: **GitHub Pages serves the built SPA and the committed
traces. No backend, no VPS.** Because the site is static, deploy is just "build the SPA, overlay the
committed artifacts, publish."

## What ships

The Vite build in `web/` produces `dist/`. Before the build, the `prebuild` hook
([`web/copy-data.mjs`](../../web/copy-data.mjs)) overlays the committed simulation artifacts and the live-lane
source into the build:

- `data/artifacts/**` → committed seeded traces (one per variant).
- `manifests/**` → per-scenario manifests (lane verdicts, gate numbers, viz binding, param specs).
- `pyodide/simlab-sources.json` → the inlined `simlab/**/*.py`, so the live lane runs the same engine code.

So a deploy carries the exact engine source plus every committed trace. **Committing a new trace and pushing
re-publishes the site** — "git-as-data": the data layer is the git history, there is no runtime DB.

## The deploy workflow ([`.github/workflows/deploy-pages.yml`](../../.github/workflows/deploy-pages.yml))

- **Trigger:** push to `main` touching `web/**`, `data/artifacts/**`, `manifests/**`, or the workflow itself
  (plus `workflow_dispatch`). Editing only Python source under `simlab/` does *not* re-publish — you
  re-run the pipeline, commit the regenerated traces, and *those* trigger the deploy.
- **Build job** (working dir `web/`): `actions/setup-node@v4` (Node 22, npm cache) → `npm ci` →
  `npm run build` → `cp dist/index.html dist/404.html` (SPA deep-link fallback: Pages serves `404.html` for
  unknown paths so client-side routes resolve) → `upload-pages-artifact`.
- **Deploy job:** `actions/deploy-pages@v4`, with `pages: write` + `id-token: write` permissions and a
  `concurrency: { group: pages, cancel-in-progress: true }` so overlapping pushes don't race.
- **Domain:** custom domain `simlab.fasl-work.com`. (For GitHub-Pages-via-Actions deploys, the custom domain
  must be set on the Pages config — a `CNAME` file alone does not bind it on Actions deploys; the management
  repo holds the exact DNS + `gh api … pages -f cname=…` step.)

## CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml))

Two jobs run on push to `main`/`develop`, on PRs, and on dispatch.

**`test`** (Python 3.12, pip cache): installs the live core + dev + the **precompute engines**
(`requirements.txt` + `requirements-dev.txt` + `requirements-precompute.txt`) — mesa, ciw, ortools, pyvrp,
networkx, osmnx, joblib, scipy — so the tests and the pipeline exercise **every scenario's real dedicated
tool**. The GPU lane is not installed (no CUDA on the runner) and not needed (S10 runs joblib on CPU). It
then runs `ruff check .`, `python -m pytest`, and a **pipeline smoke** (`python -m simlab.pipeline
s01_queue`) that regenerates a trace + manifest. This is where "live mislabeling cannot ship" is enforced —
the gate is recomputed from a real run, not trusted.

**`guards`** (public-repo hygiene): fails the build if a real `.env` is tracked (only `.env.example` is
allowed), if any raw/heavy data is tracked (`.graphml/.osm/.pbf/.h5/.nc/.parquet` — commit rendered artifacts
only), or if a **local machine path** leaked into a tracked file (`D:\_Repos`, `/d/_Repos`, `C:\Users\`). The
guard excludes the `.github/**` tree (so the guard's own pattern strings don't trip it).

## The full chain, end to end

```text
edit simlab/ engine  →  python -m simlab.pipeline  →  commit data/artifacts + manifests
   →  push to develop  →  PR → main  →  deploy-pages.yml builds + overlays + publishes
   →  GitHub Pages serves dist/ at simlab.fasl-work.com  (static, no backend)
```

## Read next

- [05_precompute-pipeline.md](./05_precompute-pipeline.md) — how the committed traces are produced.
- [01_overview.md](./01_overview.md) — why static, top to bottom.
