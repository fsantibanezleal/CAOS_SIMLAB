# data/ — three-tier data policy

This repo is **public**. Heavy and license-encumbered data never lives in git; only compact, reproducible
artifacts do.

| Tier | Where | In git? | What |
|---|---|---|---|
| **Raw** | `data/raw/` | **No** (gitignored) | originals you download (OSM extracts, DEMs, open CSVs). Reproduced by the pipeline, never committed. |
| **Samples** | `data/samples/` | Only if small + redistributable | trimmed, license-clean excerpts for quick local runs. |
| **Artifacts** | `data/artifacts/<scenario>/` | **Yes** | compact **seeded traces** the app replays — the "git-as-data" payload. |

Provenance (source URL, license, size, exact download + preprocess commands) is recorded per scenario in
the pipeline and in [`../ATTRIBUTION.md`](../ATTRIBUTION.md), so the corpus is reproducible without
storing it. CI rejects raw OSM (`.graphml`/`.osm`/`.pbf`) and other heavy formats — see
[`../.gitignore`](../.gitignore) and the workflow guards.
