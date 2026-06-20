# Mesa — usage

How to actually build and run an agent-based model with **Mesa 3.5.1**. We cover the core concepts, walk
through a minimal **Schelling segregation** model step by step, and paste the **real captured output** of
running it.

> Run the example yourself from the repo root:
> `\.venv/Scripts/python.exe docs/frameworks/mesa/example.py`

---

## 1. The core concepts

Mesa organizes every model around four ideas — the same four that define ABM in general
(see [problem-types/agent-based-modeling.md](../../problem-types/agent-based-modeling.md)). In Mesa they
are literally the classes you subclass:

| Concept | In Mesa | What you write |
|---|---|---|
| **Agent** | subclass `mesa.Agent` | per-agent **state** (attributes) + a `step()` method (the local rule) |
| **Model** | subclass `mesa.Model` | the world: builds the space, creates agents, defines the per-tick `step()` |
| **Space** | `mesa.space.SingleGrid` / `MultiGrid` / `NetworkGrid` / cell-space | *who is a neighbor*: grid (Moore/von-Neumann), graph, or real geometry (Mesa-Geo) |
| **Activation** | `model.agents` (an **`AgentSet`**) | how/when agents act each tick — e.g. `agents.shuffle_do("step")` |

### Mesa 3 changed activation — this matters

In **Mesa 2** you instantiated explicit scheduler objects (`RandomActivation`, `SimultaneousActivation`,
`StagedActivation`) and called `self.schedule.step()`. **Mesa 3 removed those.** Every model now owns an
**`AgentSet`** at `self.agents`, and you express the activation regime directly on it:

| Old (Mesa 2) scheduler | New (Mesa 3) `AgentSet` call | Regime |
|---|---|---|
| `RandomActivation` | `self.agents.shuffle_do("step")` | random order each tick |
| `BaseScheduler` | `self.agents.do("step")` | fixed order |
| `SimultaneousActivation` | `self.agents.do("step")` then `self.agents.do("advance")` | read-all-then-write |
| `StagedActivation` | `self.agents.do("stage_a"); self.agents.do("stage_b")` | multi-phase |

The agent's *rule* (`step()`) is unchanged; only the **call site** moved into the `AgentSet` API. The
example below uses `shuffle_do("step")` — random activation.

### Seeding / determinism (Mesa 3.5)

`mesa.Model.__init__` takes `rng=<int>`. That seeds **both** `model.random` (a Python `random.Random`) and
`model.rng` (a NumPy `Generator`). Routing *all* randomness through these makes the whole run reproducible.

> In 3.5.1 the older `seed=` keyword still works but emits a `FutureWarning` ("use `rng` instead"). The
> example passes `rng=` to stay clean.

---

## 2. Minimal example, walked through

The full script is [`example.py`](./example.py). It is a small Schelling segregation model: two groups of
households live on a grid; a household is **happy** if at least `HOMOPHILY` of its 8 (Moore) neighbors
share its type, otherwise it **relocates to a random empty cell**. Nobody programs "segregation" — it
**emerges**.

### 2.1 The agent — state + one local rule

```python
class SchellingAgent(mesa.Agent):
    def __init__(self, model, agent_type):
        super().__init__(model)        # Mesa 3: pass the model; it auto-registers the agent
        self.type = agent_type         # state: which group (0 or 1)

    def step(self):
        neighbors = self.model.grid.iter_neighbors(self.pos, moore=True)
        same = sum(1 for n in neighbors if n.type == self.type)
        if same < self.model.homophily:
            self.model.grid.move_to_empty(self)   # unhappy -> relocate (seeded RNG)
        else:
            self.model.happy += 1                  # happy -> count it
```

Key points:
- `super().__init__(model)` is the Mesa-3 contract — you pass the model, and Mesa registers the agent into
  `model.agents` and assigns a `unique_id`. You do **not** pass an id yourself.
- `self.pos` is filled in by the grid when the agent is placed.
- `iter_neighbors(self.pos, moore=True)` gives the 8 surrounding occupied cells' agents.
- `move_to_empty(self)` uses the **model's seeded RNG**, so relocation is reproducible.

### 2.2 The model — build the world, then define a tick

```python
class SchellingModel(mesa.Model):
    def __init__(self, width=20, height=20, density=0.80,
                 minority_fraction=0.30, homophily=3, seed=42):
        super().__init__(rng=seed)              # seeds model.random + model.rng
        self.homophily = homophily
        self.happy = 0
        self.grid = SingleGrid(width, height, torus=True)

        for _, pos in self.grid.coord_iter():   # visit every cell
            if self.random.random() < density:
                agent_type = 1 if self.random.random() < minority_fraction else 0
                agent = SchellingAgent(self, agent_type)
                self.grid.place_agent(agent, pos)

        self.total_agents = len(self.agents)

    def step(self):
        self.happy = 0
        self.agents.shuffle_do("step")          # random activation, one tick
```

Key points:
- `SingleGrid(width, height, torus=True)` — one agent per cell; `torus=True` wraps the edges so no agent is
  a special edge case.
- All randomness flows through `self.random` (seeded) — that is what makes the trace reproducible.
- `self.agents` is the `AgentSet` Mesa maintains for you; `shuffle_do("step")` shuffles then calls each
  agent's `step()`.

### 2.3 Run it headless

```python
model = SchellingModel(seed=42)
for step in range(20):
    model.step()
    print(step + 1, model.happy_fraction())
```

No SolaraViz, no server, no plotting — just a deterministic trajectory of the **happy fraction** over time.
That trajectory is exactly the kind of artifact the lab would commit and replay in the SPA.

---

## 3. Verified output

Actually executed in the project venv:

```text
$ .venv/Scripts/python.exe docs/frameworks/mesa/example.py
```

```text
Schelling on a 20x20 grid | agents=322 | homophily>=3 | seed=42
step  happy_fraction
   1  0.7609
   2  0.8106
   3  0.8851
   4  0.9161
   5  0.9286
   6  0.9379
   7  0.9348
   8  0.9534
   9  0.9689
  10  0.9689
  11  0.9689
  12  0.9752
  13  0.9783
  14  0.9845
  15  0.9845
  16  0.9845
  17  0.9845
  18  0.9845
  19  0.9845
  20  0.9845

Final: 317/322 agents happy (98.4%) after 20 steps.
```

**Reading the output (the didactic point).** The happy fraction starts at **0.76** (the random initial
placement already leaves most households content), then climbs as unhappy ones relocate, and settles near
**0.98**. The system reaches a near-stable, highly segregated arrangement from a mild local preference that
no agent ever expressed as a goal — that is **emergence**, the whole reason ABM exists.

**Reproducibility.** Re-running prints the *identical* trajectory (same seed -> same RNG draws -> same
relocations). This is the property the precompute lane depends on: compute once locally, commit the trace,
replay forever.

---

## 4. Going further (still all CPU / headless)

- **`mesa.DataCollector`** — declare model- and agent-level reporters once, then call `collect(self)` each
  tick; `get_model_vars_dataframe()` returns a tidy pandas `DataFrame` ready to write to Arrow/JSON.
- **`mesa.batch_run(...)`** — sweep parameter combinations with multiple seeds in parallel (uses `tqdm`),
  for sensitivity studies.
- **Spaces** — swap `SingleGrid` for `NetworkGrid` (contact-network SIR), `MultiGrid` (several agents per
  cell), or Mesa-Geo's GeoSpace (real maps).

## Grounding / references

- ABM problem-type guide: [../../problem-types/agent-based-modeling.md](../../problem-types/agent-based-modeling.md)
- Research: `wip/caos-simlab/research/02-abm-frameworks-2026-06-18.md`
- Mesa docs: <https://mesa.readthedocs.io/latest/> · Schelling tutorial in the Mesa examples.
