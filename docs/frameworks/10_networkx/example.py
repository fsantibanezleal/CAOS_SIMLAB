"""NetworkX demo for CAOS_SIMLAB — shortest paths on a small weighted grid road graph.

This mirrors the road-graph layer behind scenarios S07 (construction haul routing) and
S09 (ambulance dispatch): a junction grid with weighted edges, on which we run

  1. Dijkstra single-source-single-target shortest path (the cheapest route), and
  2. k-shortest *simple* paths (the k cheapest distinct routes — alternative routes).

Everything is fully deterministic. NetworkX shortest-path algorithms are themselves
deterministic on a fixed graph; we additionally seed Python's RNG and sort every node
set we iterate so that graph construction is byte-for-byte reproducible across runs and
platforms. No OSM download, no network access, no native code — pure Python, runs live.

Run (cwd = repo root):
    .venv/Scripts/python.exe docs/frameworks/10_networkx/example.py
"""
from __future__ import annotations

import random

import networkx as nx

SEED = 42
ROWS, COLS = 4, 5  # a small 4x5 junction grid (20 nodes)


def build_grid(rows: int, cols: int, seed: int) -> nx.Graph:
    """A weighted grid graph: nodes are (row, col) junctions, edges connect 4-neighbours.

    Each edge gets a deterministic "travel time" weight: a base of 1.0 plus a small,
    reproducible per-edge surcharge derived from a seeded RNG. Sorting the edge list
    before assigning weights guarantees the same weights every run, on every machine.
    """
    g = nx.grid_2d_graph(rows, cols)  # undirected; nodes are (r, c) tuples
    rng = random.Random(seed)
    # Iterate edges in a canonical, sorted order so the RNG draw -> edge mapping is stable.
    for u, v in sorted(g.edges()):
        # base cost 1.0 (a unit grid step) + a 0.00..0.99 surcharge (e.g. local congestion/grade)
        g[u][v]["weight"] = round(1.0 + rng.random(), 3)
    return g


def main() -> None:
    g = build_grid(ROWS, COLS, SEED)
    src, dst = (0, 0), (ROWS - 1, COLS - 1)  # top-left junction to bottom-right junction

    print(f"Grid road graph: {g.number_of_nodes()} junctions, "
          f"{g.number_of_edges()} road segments (4x5, weighted)")
    print(f"Origin {src} -> Destination {dst}\n")

    # 1) Dijkstra: the single cheapest route on non-negative 'weight' edges.
    path = nx.dijkstra_path(g, src, dst, weight="weight")
    length = nx.dijkstra_path_length(g, src, dst, weight="weight")
    print("Dijkstra shortest path (cheapest route):")
    print("  nodes:  " + " -> ".join(str(n) for n in path))
    print(f"  hops:   {len(path) - 1}")
    print(f"  length: {length:.3f} (sum of edge travel times)\n")

    # 2) k-shortest simple paths: the k cheapest *distinct* routes, in increasing length.
    #    shortest_simple_paths is a lazy generator (Yen's algorithm); take the first k.
    k = 3
    print(f"k-shortest simple paths (k={k}, alternative routes):")
    gen = nx.shortest_simple_paths(g, src, dst, weight="weight")
    for i, p in enumerate(gen, start=1):
        if i > k:
            break
        plen = sum(g[a][b]["weight"] for a, b in zip(p, p[1:]))
        print(f"  #{i}: length {plen:.3f}  |  {' -> '.join(str(n) for n in p)}")

    # Sanity: path #1 from the k-shortest generator must equal the Dijkstra optimum.
    first = next(iter(nx.shortest_simple_paths(g, src, dst, weight="weight")))
    assert first == path, "k-shortest #1 must match the Dijkstra optimum"
    print("\nCheck: k-shortest path #1 == Dijkstra optimum -> OK")


if __name__ == "__main__":
    main()
