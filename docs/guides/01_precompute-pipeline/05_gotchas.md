# 05 · Determinism, honesty rules, and gotchas

The precompute lane only earns "replay = truth" if it is **bit-reproducible** and **honest** about what the
numbers are. These are the rules the pipeline (and CI) enforce, plus the practical traps that bite in practice.

## Determinism rules (non-negotiable)

- **Seed everything.** Every stochastic engine — the SimPy RNG, Mesa, PyVRP/HGS, the Monte-Carlo streams — is
  fed the run's seed so the committed trace is exactly reproducible from the repo. Re-running the pipeline for
  a fixed `(code, params, seed)` **must reproduce the committed bytes**. If it does not, the run is
  non-deterministic and the trace cannot be trusted as truth. See
  [../architecture/02_determinism-and-trace.md](../../architecture/02_determinism-and-trace.md).
- **GPU runs would need per-replication seeding.** The GPU lane is a **reference-only** chapter — no GPU
  exhibit ships (S10's Monte-Carlo study runs on **joblib + SciPy**, live; CuPy/Numba are intentionally out
  of scope). Documented for completeness: because GPU thread-scheduling is non-deterministic across runs, a
  GPU exhibit *would* fix the seed *per replication* (xoroshiro128p for Numba, cuRAND for CuPy) and snapshot
  the deterministic state into the trace so the result reproduces on any machine, GPU or not. Detail in
  [../03_gpu-lane.md](../03_gpu-lane.md).
- **One engine, two lanes.** Because `sc.run` is the same call the browser makes, the live result must equal
  the committed trace for the same `(params, seed)`. The build verifies byte-equality between a live Pyodide
  run and the committed artifact for the default params; divergence means the lane is mislabeled and the check
  fails ([../02_live-lane-pyodide.md](../02_live-lane-pyodide.md)).

## Honesty rules

- **Never commit raw data.** Road/graph work (OSMnx) commits only **rendered geometry** as plain JSON — never
  raw `.graphml` / `.osm` / `.pbf`. CI blocks those extensions (ODbL — see
  [`../../../ATTRIBUTION.md`](../../../ATTRIBUTION.md)).
- **Label synthetic vs sourced.** Synthetic scenarios say so; the one real external dataset (OR-Library
  `ft06` for S06 job-shop) is cited. No invented or unsourced numbers ship.
- **No "live mislabeling."** A scenario is `live` only if it *measurably* clears all four gate conditions. The
  manifest records the measured numbers and CI re-checks them, so an OR-Tools scenario cannot be tagged live
  just because its trace happens to be small — `pure_python = False` forces precompute regardless.

## Gotchas

- **Don't hand-edit committed JSON.** Traces and manifests are generated. A hand-edit breaks byte-equality
  with a fresh run and will fail the replay check. Change the model/params and **re-run** instead.
- **Encoding: never write these files with a BOM.** The trace/manifest writers use
  `write_text(..., encoding="utf-8")` (no BOM). Do not regenerate or "fix" them with tools that prepend a BOM
  or re-encode UTF-8 (it produces mojibake and can break JSON parsers downstream).
- **Re-run after model or variant changes — and commit both trees together.** If you change `sc.run`, the
  variants, or the params but forget to re-run, the app replays a **stale** trace that no longer matches the
  code. Always commit `data/artifacts/` and `manifests/` in the same change as the code that produced them.
- **Native engines are precompute-only, by design.** OR-Tools (S06, S07, S08, S11) is C++ with no WASM
  build, so its scenarios set `pure_python = False` and never enter the browser wheel closure. Do not try to
  "promote" them to live. (S09 is **not** in this list — it has no OR-Tools at all; it is a live SimPy +
  NetworkX DES, see below. And S07 is a *hybrid*: its native route plan is precomputed and committed as
  data, but the pure-Python **SimPy replay** runs **live** over those committed plans.)
- **Keep the live wheel closure tiny.** Every entry in `requirements.txt` is a wheel Pyodide must fetch at
  cold start. The live core is intentionally just `numpy` + `simpy`; the heavy engines live in
  `requirements-precompute.txt` / `requirements-gpu.txt` and **never** enter the browser. Adding a heavy dep
  to the live core would slow every visitor's first paint.
- **Salabim is desktop-only.** It renders mp4/gif via tkinter and is **not** web-embeddable — use it for the
  offline DES movie chapter, not as a trace source the player consumes.
- **Seed collisions don't happen, but param changes silently re-key.** The artifact filename is
  `<variant_id>-seed<seed>.json`; changing a variant's `id` writes a new file and orphans the old one — delete
  the stale artifact so it isn't shipped.

## Per-scenario engines (where each trace comes from)

S01 SimPy + Ciw (Erlang-C validation) · S02/S03/S05 Mesa · S04 SimPy · S06 OR-Tools CP-SAT ·
S07 NetworkX + OR-Tools CP-SAT (route plan, precomputed) + SimPy (replay, live) ·
S08 OR-Tools + PyVRP (CVRP, no SimPy) · S09 SimPy + NetworkX (closed-form nearest-available dispatch, no
OR-Tools) · S10 joblib + SciPy · S11 OR-Tools GLOP LP + SimPy. Detail per problem type in
[../../problem-types/](../../problem-types/) and per tool in [../../frameworks/](../../frameworks.md).

Back to the node index: [../01_precompute-pipeline.md](../01_precompute-pipeline.md).
