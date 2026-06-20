# Attribution

Data sources used by the scenarios, with their licenses and how we handle them in this **public** repo.

**Honesty first.** Today every map/route scenario runs on a **self-contained synthetic road network** — a
grid-of-junctions graph with a procedural elevation field, built in `simlab/scenarios/_geo.py`. There is **no
OpenStreetMap, no tiles, no DEM** anywhere in the engine. The only external dataset in the lab is one
classic public benchmark instance for the job-shop scenario (see S06 below). We commit only compact,
redistributable, **rendered** artifacts; if/when a future scenario ingests a real raw dataset (OSM extract,
DEM, agency feed), that raw data will **never** be committed — the pipeline will show how to fetch +
preprocess it yourself.

## Sources (per scenario)

| Scenario | Source | License | What we commit |
|---|---|---|---|
| S01 queue (M/M/c) | synthetic (generated from seeds) | n/a | the generator code + seeds |
| S02 Schelling | synthetic (generated from seeds) | n/a | the generator code + seeds |
| S03 SIR | synthetic (generated from seeds) | n/a | the generator code + seeds |
| S04 ED flow | synthetic (hand-chosen rates/params, seeded variates) | n/a | the generator code + seeds |
| S05 Beer Game | synthetic (generated from seeds) | n/a | the generator code + seeds |
| S06 job-shop | OR-Library — Fisher–Thompson ft06 (6×6, optimal makespan 55) + generated instances | public benchmark | instance ids + results |
| S07 haul | synthetic (hand-built `GridNetwork` ridge terrain in `_geo.py`) | n/a | rendered route geometry + elevation samples |
| S08 VRP | synthetic (seeded customers/demands on a `GridNetwork` grid) | n/a | instance seeds + rendered routes |
| S09 ambulance | synthetic (seeded Poisson calls on a `GridNetwork` grid) | n/a | rendered route geometry + params |
| S10 Monte-Carlo | synthetic (replicated M/M/c runs, seeded) | n/a | the generator code + seeds |
| S11 mine haul | synthetic (hand-built `GridNetwork` hills terrain in `_geo.py`) | n/a | the plan + rendered routes |

Notes:

- **S06 is the one real external dataset.** `ft06` is the 1963 Fisher–Thompson 6×6 job-shop instance from
  the public OR-Library, with a proven-optimal makespan of 55; the other instances are generated from seeds.
- **S04 is not calibrated to any published dataset.** The arrival rate, triage/treatment rates, urgent
  fraction, etc. are hand-chosen illustrative parameters with seeded exponential variates — not derived from
  NHS A&E or any other real distribution.
- **S07 / S08 / S09 / S11 carry no real geography.** No street network, no terrain raster, no agency call
  log. Routes are shortest paths (Dijkstra) on a procedurally generated grid graph; the elevation field is a
  deterministic analytic surface (ramp / ridge / hills) — see `_geo.py`.

## OpenStreetMap (ODbL) — the share-alike trap (not yet relevant)

**No scenario currently uses OpenStreetMap data**, so the ODbL obligation does not apply to anything in this
repo today. We keep the policy here so it is in force *if/when* a future scenario ingests OSM:

A pruned OSM road graph is a *Derivative Database* and would obligate ODbL on the whole work. To avoid
that, we would **never** commit raw `.graphml`/`.osm`/`.pbf` (CI blocks them); we would commit only
**Produced Work** (rendered route/line geometry as plain JSON) plus this attribution:

> Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).

Any future map-based scenario that actually uses OSM would repeat the credit in its UI.
