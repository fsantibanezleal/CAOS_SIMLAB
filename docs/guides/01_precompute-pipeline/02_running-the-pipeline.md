# 02 · Running the pipeline — the CLI

The pipeline CLI is [`simlab/pipeline.py`](../../../simlab/pipeline.py), run as a module. The wrapper scripts
([`scripts/precompute.ps1`](../../../scripts/precompute.ps1) ·
[`scripts/precompute.sh`](../../../scripts/precompute.sh)) just `cd` to the repo root and pass every argument
straight through to `python -m simlab.pipeline`, so the wrapper and the module are interchangeable.

## Invocations

```powershell
# one scenario
.\scripts\precompute.ps1 s01_queue

# every scenario in the registry (no positional arg)
.\scripts\precompute.ps1

# pin a non-default seed
.\scripts\precompute.ps1 s06_jobshop --seed 7

# call the module directly (identical effect)
.\.venv\Scripts\python.exe -m simlab.pipeline s06_jobshop --seed 7
```
```bash
# macOS / Linux / Git-Bash
./scripts/precompute.sh s01_queue
./scripts/precompute.sh                 # all scenarios
./scripts/precompute.sh s06_jobshop --seed 7
```

## Arguments

| Argument | Default | Meaning |
|---|---|---|
| `scenario` (positional, optional) | *(all)* | A scenario id. Omit it to run **every** scenario in the registry. |
| `--seed` | `42` | The master seed fed to every variant of every scenario this run. |

The known scenario ids come from the registry ([`simlab/registry.py`](../../../simlab/registry.py)):
`s01_queue`, `s02_schelling`, `s03_sir`, `s04_ed`, `s05_beergame`, `s06_jobshop`, `s07_haul`, `s08_vrp`,
`s09_ambulance`, `s10_montecarlo`, `s11_minehaul`. An unknown id raises a `KeyError` that lists the valid ones.

## What it prints

`main` runs each requested scenario and prints a JSON array of per-scenario summaries to stdout:

```json
[
  {
    "id": "s01_queue",
    "variants": 12,
    "lane": "live",
    "manifest": "manifests/s01_queue.json",
    "variant_ids": ["light", "moderate", "near_saturated", "..."]
  }
]
```

- `variants` — how many preset regimes were run for the scenario.
- `lane` — the **scenario-level** verdict: `"live"` only if *all* its variants cleared the gate, otherwise
  `"precomputed"` (see [03_internals.md](./03_internals.md)).
- `manifest` — the manifest path written for the scenario.
- `variant_ids` — the variant ids that were produced.

The summary is the index of what changed; the authoritative gate numbers and KPIs live inside each manifest
([04_outputs.md](./04_outputs.md)).

## Seeding semantics

`--seed` is the single master seed for the run. Each scenario derives its stochastic streams from it
deterministically, so `(scenario, params, seed)` fully determines the trace and its committed bytes. Changing
the seed produces a *different but equally reproducible* trace; the artifact filename encodes the seed
(`<variant_id>-seed<seed>.json`) so different seeds do not overwrite each other. The default `42` is what the
committed traces use unless a scenario doc states otherwise.

## When to re-run

Re-run a scenario whenever you change its model code, its variants, or its params — then commit the updated
`data/artifacts/` and `manifests/` together. Because deploy is "git-as-data" (committing a trace and pushing
re-publishes the static site, see [03_internals.md](./03_internals.md)), the commit *is* the release for that
scenario. The pipeline is idempotent for a fixed `(code, params, seed)`: re-running must reproduce the
committed bytes — if it does not, see the determinism rules in [05_gotchas.md](./05_gotchas.md).

Next: [03_internals.md](./03_internals.md) — what happens inside one `precompute(...)` call.
