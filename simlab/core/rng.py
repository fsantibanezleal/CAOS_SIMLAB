"""Single source of randomness for a run.

Every scenario draws ALL its randomness from one seeded generator so a run is reproducible from
(params, seed) alone — the foundation of "replay = truth". Draw your random variates up front
(vectorised) where possible so determinism does not depend on the event-scheduler's interleaving.
"""
from __future__ import annotations

import numpy as np


def make_rng(seed: int) -> np.random.Generator:
    """Return a seeded NumPy Generator. The only RNG a scenario should use."""
    return np.random.default_rng(int(seed))
