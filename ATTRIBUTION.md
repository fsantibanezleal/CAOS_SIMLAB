# Attribution

Data sources used by the scenarios, with their licenses and how we handle them in this **public** repo.
We commit only compact, redistributable, **rendered** artifacts; raw datasets and raw OpenStreetMap
extracts are **never** committed — the pipelines show how to fetch + preprocess them yourself.

## Sources (per scenario, as they land)

| Scenario | Source | License | What we commit |
|---|---|---|---|
| S01–S05 | synthetic (generated from seeds) | n/a | the generator code + seeds |
| S04 ED flow | calibrated to NHS A&E published distributions | OGL v3.0 | derived parameters only |
| S06 job-shop | OR-Library benchmark instances | public benchmark | instance ids + results |
| S07 haul | OpenStreetMap geometry · Copernicus/SRTM DEM | ODbL · open | rendered geometry + elevation samples |
| S08 VRP | Solomon / Gehring-Homberger benchmarks | public benchmark | instance ids + solutions |
| S09 ambulance | Seattle Real-Time Fire 911 / NYC EMS Open Data · OSM | public domain / open · ODbL | aggregated params + rendered geometry |

## OpenStreetMap (ODbL) — the share-alike trap

A pruned OSM road graph is a *Derivative Database* and would obligate ODbL on the whole work. To avoid
that, we **never** commit raw `.graphml`/`.osm`/`.pbf` (CI blocks them); we commit only **Produced Work**
(rendered route/line geometry as plain JSON) plus this attribution:

> Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).

Each map-based scenario repeats the credit in its UI.
