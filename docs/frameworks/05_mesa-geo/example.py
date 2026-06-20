"""Mesa-Geo minimal example for CAOS_SIMLAB.

Demonstrates the geospatial-ABM core of Mesa-Geo WITHOUT any network/tile
download: we hand-build Shapely geometries, wrap them in GeoAgents, register
them in a GeoSpace, run one deterministic step, and report positions plus a
couple of GeoSpace spatial queries (neighbours, distance).

Scenario relevance (see 03_applying.md): this is the kernel of the geospatial
variants of S07 (construction haul routing) and S09 (ambulance dispatch) — real
maps are loaded the same way, only the geometry source differs (OSMnx/GeoJSON
instead of hand-built points).

Deterministic: the model is seeded via Mesa's `rng`, so the random walk is
reproducible across runs and platforms.

Run from the repo root:
    .venv/Scripts/python.exe docs/frameworks/05_mesa-geo/example.py
"""

from __future__ import annotations

import mesa
import mesa_geo as mg
from shapely.geometry import Point

# Web-Mercator (metres). Mesa-Geo's default GeoSpace CRS; distances come out in
# metres, which is what the spatial queries below report.
CRS = "epsg:3857"
SEED = 42  # fixed seed -> deterministic, reproducible run


class Truck(mg.GeoAgent):
    """A point GeoAgent that takes one fixed-size random step per tick.

    `geometry` is a Shapely object living in `self.geometry`; we move the agent
    by replacing that geometry with a new Point. `self.random` is Mesa's seeded
    RNG, so the walk is deterministic for a given SEED.
    """

    STEP_METRES = 50.0

    def step(self) -> None:
        dx = self.random.uniform(-self.STEP_METRES, self.STEP_METRES)
        dy = self.random.uniform(-self.STEP_METRES, self.STEP_METRES)
        x, y = self.geometry.x, self.geometry.y
        self.geometry = Point(x + dx, y + dy)


class FleetModel(mesa.Model):
    """A tiny geospatial model: a GeoSpace holding two Truck GeoAgents."""

    def __init__(self, seed: int = SEED) -> None:
        super().__init__(rng=seed)
        self.space = mg.GeoSpace(crs=CRS, warn_crs_conversion=False)

        # Two hand-built start points (no download). Coordinates are arbitrary
        # metres in EPSG:3857; ~150 m apart so the neighbour query is meaningful.
        starts = [Point(0.0, 0.0), Point(120.0, 90.0)]
        agents = [Truck(self, geometry=p, crs=CRS) for p in starts]
        self.space.add_agents(agents)

    def step(self) -> None:
        # Mesa 3 AgentSet: deterministic, shuffled by the model RNG.
        self.agents.shuffle_do("step")


def _fmt(pt: Point) -> str:
    return f"({pt.x:8.2f}, {pt.y:8.2f})"


def main() -> None:
    model = FleetModel(seed=SEED)

    print(f"Mesa {mesa.__version__} | Mesa-Geo {mg.__version__} | CRS {CRS}")
    print(f"Agents in GeoSpace: {len(model.space.agents)}\n")

    print("Initial positions (metres, EPSG:3857):")
    for a in model.space.agents:
        print(f"  agent {a.unique_id}: {_fmt(a.geometry)}")

    # Spatial query BEFORE moving: distance between the two trucks.
    a0, a1 = list(model.space.agents)
    d0 = model.space.distance(a0, a1)
    print(f"\nDistance agent {a0.unique_id} <-> agent {a1.unique_id}: {d0:.2f} m")

    # One deterministic tick.
    model.step()

    print("\nPositions after 1 step:")
    for a in model.space.agents:
        print(f"  agent {a.unique_id}: {_fmt(a.geometry)}")

    d1 = model.space.distance(a0, a1)
    print(f"\nDistance after step: {d1:.2f} m")

    # GeoSpace neighbour query: agents within a 200 m buffer of agent a0.
    # Note: this includes a0 itself (its own geometry intersects the buffer).
    near = [n.unique_id for n in model.space.get_neighbors_within_distance(a0, 200.0)]
    print(f"Within 200 m of agent {a0.unique_id} (incl. self): {sorted(near)}")

    # Export the live state as a GeoDataFrame — this is the artifact shape we
    # would serialize (GeoJSON/Arrow) for the static replay viewer.
    gdf = model.space.get_agents_as_GeoDataFrame()
    print(f"\nGeoDataFrame rows={len(gdf)}, columns={list(gdf.columns)}, crs={gdf.crs}")


if __name__ == "__main__":
    main()
