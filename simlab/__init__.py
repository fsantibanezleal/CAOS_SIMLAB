"""simlab — the shared simulation engine for CAOS_SIMLAB.

ONE engine imported by the notebooks (teaching), the local pipeline (precompute) and — via Pyodide —
the web app (live). Building this shared interface first is what keeps the three surfaces from drifting:
a scenario is defined once here and rendered everywhere.

Design contract (see the repo README + ADR "deterministic-replay public simulation viewers"):
- A run is fully determined by (params, seed). Same inputs => same trace => "replay = truth".
- Light scenarios run live in the browser (Pyodide). Heavy scenarios are precomputed into a committed
  trace + manifest and replayed. The live/precompute lane is DECIDED by measurement (the 3-gate rule in
  `simlab.core.scenario.classify_lane`), recorded in the manifest, never guessed.
"""

__version__ = "0.16.000"
