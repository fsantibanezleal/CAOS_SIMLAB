# NetworkX — Usage

This is a hands-on how-to for the slice of NetworkX the lab actually uses: building a weighted graph
and computing **shortest paths** and **k-shortest paths** on it. That slice is the road/network layer
under scenarios **S07** (construction haul routing) and **S09** (ambulance dispatch). For installation
see [`01_installation.md`](./01_installation.md); for the *why/when* see
[`03_applying.md`](./03_applying.md).

## Key concepts

NetworkX models a network as a **graph object** holding **nodes** and **edges**, where each edge can
carry arbitrary attributes — here a numeric `weight` standing for travel time or distance.

| Concept | API | What it is |
|---|---|---|
| Undirected graph | `nx.Graph()` | nodes + undirected edges (a two-way road network) |
| Directed graph | `nx.DiGraph()` | one-way edges (e.g. one-way streets, or asymmetric uphill/downhill costs) |
| A node | any hashable | here, a `(row, col)` junction tuple |
| An edge attribute | `g[u][v]["weight"]` | the edge's travel-time/distance cost |
| Grid generator | `nx.grid_2d_graph(rows, cols)` | a ready-made lattice of `(r, c)` nodes — a toy road grid |
| Dijkstra path | `nx.dijkstra_path(g, s, t, weight=...)` | the **cheapest** route from `s` to `t` (non-negative weights) |
| Dijkstra length | `nx.dijkstra_path_length(g, s, t, weight=...)` | the cost of that route (sum of edge weights) |
| A\* path | `nx.astar_path(g, s, t, heuristic=..., weight=...)` | Dijkstra + an admissible heuristic; fewer node expansions on big graphs |
| k-shortest paths | `nx.shortest_simple_paths(g, s, t, weight=...)` | a **generator** yielding distinct simple paths in increasing length (Yen's algorithm) |
| Single-source tree | `nx.single_source_dijkstra(g, s, weight=...)` | all shortest distances + paths from one source (used by S09 dispatch) |
| All-pairs matrix | `nx.all_pairs_dijkstra_path_length(g, weight=...)` | the N×N travel-time matrix that feeds an optimizer |

Two facts to internalise:

1. **Dijkstra requires non-negative weights.** Travel times and distances are always ≥ 0, so this is
   the right default for road networks. (If you ever have negative weights, you would need
   Bellman-Ford instead — not the case here.)
2. **`shortest_simple_paths` is lazy.** It is a generator implementing Yen's k-shortest-loopless-paths
   algorithm. You ask for paths one at a time with `next()` or a `for` loop and stop once you have the
   `k` you want — it does not enumerate all routes up front. Its **first** yielded path is exactly the
   Dijkstra optimum.

### Determinism

NetworkX shortest-path algorithms are **deterministic on a fixed graph** — same graph in, same path
out, every time, on every platform. The only randomness in the example is in *building* the graph
(assigning per-edge weights), and that is made reproducible by:

- seeding Python's RNG (`random.Random(SEED)`), and
- iterating edges in a **sorted** canonical order before drawing weights, so the RNG-draw → edge
  mapping never depends on dict/hash iteration order.

This matches the lab's "replay = truth" contract (see [`../../architecture.md`](../../architecture.md)):
a committed routing trace must reproduce byte-for-byte from the repo.

## Minimal runnable example, walked through

The full script is [`example.py`](./example.py). Here is the logic step by step.

**Step 1 — build a small weighted grid graph.** `nx.grid_2d_graph(4, 5)` gives a 4×5 lattice: 20
junction nodes named `(r, c)`, with undirected edges to 4-neighbours. We then assign each edge a
deterministic `weight = 1.0 + rng.random()` (a unit grid step plus a small reproducible surcharge
standing for local congestion/grade). Sorting the edges first makes the weights identical every run.

```python
g = nx.grid_2d_graph(rows, cols)
rng = random.Random(seed)
for u, v in sorted(g.edges()):
    g[u][v]["weight"] = round(1.0 + rng.random(), 3)
```

**Step 2 — Dijkstra shortest path.** Ask for the cheapest route from the top-left junction `(0, 0)`
to the bottom-right `(3, 4)`, and its total length.

```python
path = nx.dijkstra_path(g, (0, 0), (3, 4), weight="weight")
length = nx.dijkstra_path_length(g, (0, 0), (3, 4), weight="weight")
```

**Step 3 — k-shortest simple paths.** Pull the first `k = 3` distinct routes in increasing length
from the lazy generator, and compute each one's length by summing its edge weights.

```python
gen = nx.shortest_simple_paths(g, (0, 0), (3, 4), weight="weight")
for i, p in enumerate(gen, start=1):
    if i > k:
        break
    plen = sum(g[a][b]["weight"] for a, b in zip(p, p[1:]))
```

**Step 4 — sanity check.** The first k-shortest path must equal the Dijkstra optimum (they are the
same "cheapest route", computed two different ways). The script asserts this.

## Verified output

Run from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/10_networkx/example.py
```

Captured stdout (real run from the new path, deterministic — identical across repeated runs):

```text
Grid road graph: 20 junctions, 31 road segments (4x5, weighted)
Origin (0, 0) -> Destination (3, 4)

Dijkstra shortest path (cheapest route):
  nodes:  (0, 0) -> (1, 0) -> (1, 1) -> (1, 2) -> (1, 3) -> (1, 4) -> (2, 4) -> (3, 4)
  hops:   7
  length: 8.986 (sum of edge travel times)

k-shortest simple paths (k=3, alternative routes):
  #1: length 8.986  |  (0, 0) -> (1, 0) -> (1, 1) -> (1, 2) -> (1, 3) -> (1, 4) -> (2, 4) -> (3, 4)
  #2: length 9.029  |  (0, 0) -> (1, 0) -> (1, 1) -> (1, 2) -> (1, 3) -> (2, 3) -> (2, 4) -> (3, 4)
  #3: length 9.123  |  (0, 0) -> (1, 0) -> (1, 1) -> (1, 2) -> (1, 3) -> (2, 3) -> (3, 3) -> (3, 4)

Check: k-shortest path #1 == Dijkstra optimum -> OK
```

### Reading the output

- **The optimum is not the fewest-hops path.** All routes here take 7 hops across the grid, but the
  weighted optimum (8.986) is the one whose *summed surcharges* are smallest, not the one with the
  fewest steps. That is the whole point of a weighted graph: cost, not distance-in-steps, decides.
- **The k-shortest list is tight and increasing.** #1 = 8.986 < #2 = 9.029 < #3 = 9.123. The three
  routes share the first leg and diverge near the destination — exactly the kind of "near-tie
  alternatives" that matter when you later stress the chosen route under uncertainty (a small delay on
  one edge can make route #2 actually faster than route #1).
- **#1 == Dijkstra optimum.** The assertion at the end confirms the two algorithms agree, which is the
  built-in consistency guarantee of Yen's algorithm.

## Extending it (still pure Python, still live-capable)

- **A\*** for big single-pair queries: `nx.astar_path(g, s, t, heuristic=h, weight="weight")` where
  `h(u, t)` is an *admissible* (never-overestimating) estimate such as straight-line distance. It
  returns the same optimum as Dijkstra while expanding fewer nodes.
- **All-pairs / a cost matrix to feed a router:**
  `dict(nx.all_pairs_dijkstra_path_length(g, weight="weight"))` builds the N×N travel-time matrix that
  OR-Tools or PyVRP consume. Per the research, *the matrix — not the solver — is usually the real
  bottleneck*; cap live instances small (≈ ≤ 20–30 stops) and precompute the matrix for anything
  larger (see [`03_applying.md`](./03_applying.md)).
- **Directed / asymmetric costs:** build with `nx.DiGraph()` when uphill and downhill differ (this is
  exactly how S07 encodes `grade × elevation gain` — the same edge costs more going up than down).
- **Real road graphs:** swap the synthetic grid for `osmnx.graph_from_place(...)`, which returns a
  NetworkX graph with real geometry. Then the same `dijkstra_path` / `shortest_simple_paths` calls
  work unchanged (remember ODbL attribution; commit rendered geometry only).
