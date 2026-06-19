"""The local precompute pipeline + CLI.

Runs every **variant** of a scenario, measures each, writes a compact seeded trace per variant
(`data/artifacts/<id>/<variant>-seed<seed>.json`) and one scenario manifest
(`manifests/<id>.json`) listing them with their gate verdicts. The same code path serves both lanes:
a "live" scenario still gets committed traces so the app can replay instantly on first paint while
Pyodide loads, and the learner can compare ≥10 regimes without any compute.

    python -m simlab.pipeline               # run all scenarios in the registry
    python -m simlab.pipeline s01_queue     # run one
    python -m simlab.pipeline s01_queue --seed 7
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

from .core.manifest import build_scenario_manifest, write_manifest
from .core.scenario import classify_lane
from .registry import SCENARIOS, get_scenario

REPO_ROOT = Path(__file__).resolve().parent.parent


def precompute(scenario_id: str, seed: int = 42, out_root: Path | str = REPO_ROOT) -> dict[str, Any]:
    """Run + measure + persist every variant of one scenario. Returns a summary dict."""
    out_root = Path(out_root)
    sc = get_scenario(scenario_id)

    entries: list[dict[str, Any]] = []
    for var in sc.variants():
        params = sc.coerce(var.params)
        t0 = time.perf_counter()
        trace = sc.run(params, seed)
        run_ms = (time.perf_counter() - t0) * 1000.0

        rel = Path("data") / "artifacts" / sc.id / f"{var.id}-seed{seed}.json"
        trace_bytes = trace.write(out_root / rel)
        gate = classify_lane(sc.pure_python, run_ms, trace_bytes)

        entries.append({
            "id": var.id,
            "label_en": var.label_en,
            "label_es": var.label_es,
            "note_en": var.note_en,
            "note_es": var.note_es,
            "params": params,
            "lane": gate.lane,
            "gate": {
                "pure_python": gate.pure_python,
                "run_ms": gate.run_ms,
                "trace_bytes": gate.trace_bytes,
                "reasons": gate.reasons,
            },
            "kpis": trace.kpis,
            "analytic": trace.analytic,
            "trace": str(rel).replace("\\", "/"),
        })

    manifest = build_scenario_manifest(sc, seed, entries)
    write_manifest(manifest, out_root / "manifests" / f"{sc.id}.json")

    return {
        "id": sc.id,
        "variants": len(entries),
        "lane": manifest["lane"],
        "manifest": f"manifests/{sc.id}.json",
        "variant_ids": [e["id"] for e in entries],
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="CAOS_SIMLAB precompute pipeline")
    ap.add_argument("scenario", nargs="?", help="scenario id (omit to run all)")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args(argv)

    ids = [args.scenario] if args.scenario else list(SCENARIOS)
    results = [precompute(sid, seed=args.seed) for sid in ids]
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
