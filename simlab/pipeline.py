"""The local precompute pipeline + CLI.

Runs a scenario, measures it, writes a compact trace (`data/artifacts/<id>/`) and a manifest
(`manifests/<id>.json`), and reports the gate verdict (live vs precomputed). The same code path serves
both lanes: a "live" scenario also gets a tiny committed trace so the app can show a running sim on first
paint while Pyodide loads.

    python -m simlab.pipeline               # run all scenarios in the registry
    python -m simlab.pipeline s01_queue     # run one
    python -m simlab.pipeline s01_queue --seed 7 --param lam=4 --param c=2
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

from .core.manifest import build_manifest, write_manifest
from .core.scenario import classify_lane
from .registry import SCENARIOS, get_scenario

REPO_ROOT = Path(__file__).resolve().parent.parent


def precompute(scenario_id: str, seed: int = 42, params: dict | None = None,
               out_root: Path | str = REPO_ROOT) -> dict[str, Any]:
    """Run + measure + persist one scenario. Returns a summary dict."""
    out_root = Path(out_root)
    sc = get_scenario(scenario_id)
    full_params = sc.coerce(params or {})

    t0 = time.perf_counter()
    trace = sc.run(full_params, seed)
    run_ms = (time.perf_counter() - t0) * 1000.0

    trace_path = out_root / "data" / "artifacts" / sc.id / f"trace-seed{seed}.json"
    trace_bytes = trace.write(trace_path)

    gate = classify_lane(sc.pure_python, run_ms, trace_bytes)
    manifest = build_manifest(sc, seed, full_params, gate)
    manifest_path = write_manifest(manifest, out_root / "manifests" / f"{sc.id}.json")

    return {
        "id": sc.id,
        "lane": gate.lane,
        "run_ms": gate.run_ms,
        "trace_bytes": gate.trace_bytes,
        "reasons": gate.reasons,
        "trace": str(trace_path.relative_to(out_root)),
        "manifest": str(manifest_path.relative_to(out_root)),
        "kpis": trace.kpis,
        "analytic": trace.analytic,
    }


def _parse_params(pairs: list[str]) -> dict[str, float]:
    out: dict[str, float] = {}
    for pair in pairs or []:
        key, _, val = pair.partition("=")
        out[key.strip()] = float(val)
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="CAOS_SIMLAB precompute pipeline")
    ap.add_argument("scenario", nargs="?", help="scenario id (omit to run all)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--param", action="append", default=[], help="override, e.g. --param lam=4")
    args = ap.parse_args(argv)

    ids = [args.scenario] if args.scenario else list(SCENARIOS)
    results = [precompute(sid, seed=args.seed, params=_parse_params(args.param)) for sid in ids]
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
