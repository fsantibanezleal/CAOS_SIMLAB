"""The scenario registry — the one place that lists every shippable scenario.

The pipeline, the tests and (eventually, via a generated index) the web app all read from here, so adding
a scenario is a single edit.
"""
from __future__ import annotations

from .core.scenario import Scenario
from .scenarios.s01_queue import QueueScenario

SCENARIOS: dict[str, Scenario] = {s.id: s for s in [QueueScenario()]}


def get_scenario(scenario_id: str) -> Scenario:
    try:
        return SCENARIOS[scenario_id]
    except KeyError as exc:  # pragma: no cover - defensive
        raise KeyError(f"unknown scenario '{scenario_id}'; known: {sorted(SCENARIOS)}") from exc
