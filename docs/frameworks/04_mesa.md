# Mesa — Agent-Based Modeling (framework node)

**Mesa 3** is the canonical Python framework for **Agent-Based Modeling (ABM)** and this lab's default ABM
engine. You describe many autonomous **agents** (each with state and one local `step()` rule), place them
in a **space** (grid, network, or real geometry), choose an **activation** regime, and run time forward —
then watch the **global pattern emerge**. Nobody programs the macro outcome: segregated neighborhoods, an
epidemic wave, the supply-chain bullwhip effect all appear *from the interactions*. Reach for Mesa when the
question is "what behavior will these local rules produce?", the model is small-to-medium (≤ ~1e5 agents),
and you want clean, teachable abstractions — `Agent` / `Model` / space / `AgentSet` — that *are* the ABM
concepts. Reach for something else for million-agent GPU scale ([gpu-abm-chapter](./18_gpu-abm-chapter.md)),
real maps ([mesa-geo](./05_mesa-geo.md)), or an instant zero-server in-browser classic
([netlogo-web](./07_netlogo-web.md)).

**How this lab uses it.** Mesa is a **precompute-lane** engine, not a live one. Its only first-class
visualization (SolaraViz) is a stateful Python server bound to a localhost port — fine for local teaching,
wrong for a static SPA on a shared no-GPU VPS. So the lab runs Mesa **headless and seeded** in the local
`.venv`, records the deterministic trajectory to a compact Arrow/JSON artifact, commits it, and the web
viewer **replays** it (zero compute on the VPS, no Mesa in the browser). The three ABM scenarios — **S02
Schelling**, **S03 SIR**, **S05 Beer Game** — run on *real* Mesa 3 offline; the `Agent.step()` /
`Model.step()` code is in-repo so the abstractions stay the curriculum, not a blackbox. That truthful split
(real engine offline, lightweight replay online) is the whole architectural trade-off, and it is documented
honestly in [03_applying.md](./04_mesa/03_applying.md).

## Read in order

1. [01_installation.md](./04_mesa/01_installation.md) — exact `pip install "mesa>=3.0"` line, the resolved
   **3.5.1** version, which requirements lane it belongs to (`requirements-precompute.txt`, *not* live),
   key transitive deps (numpy 2.4.6 / pandas / networkx / tqdm), and platform / no-CUDA notes.
2. [02_usage.md](./04_mesa/02_usage.md) — the real API and concepts (the four ingredients; the Mesa-2→3
   activation break; `rng=` seeding), the Schelling example walked through step by step, and its **real
   captured output** (re-run and verified).
3. [03_applying.md](./04_mesa/03_applying.md) — how to *formalize* an ABM and *solve* it with Mesa, the
   precompute-then-replay pattern, the honest trade-offs, and when to pick Mesa vs the alternatives.
4. [example.py](./04_mesa/example.py) — the runnable, ruff-clean Schelling model.

Run the example from the repo root with the project venv:

```bash
.venv/Scripts/python.exe docs/frameworks/04_mesa/example.py
```

## Where Mesa is used in the lab

| Scenario | Source | What emerges |
|---|---|---|
| **S02 Schelling** | [s02_schelling.py](../../simlab/scenarios/s02_schelling.py) | segregation from a mild local preference |
| **S03 SIR** | [s03_sir.py](../../simlab/scenarios/s03_sir.py) | an epidemic wave on a lattice contact grid |
| **S05 Beer Game** | [s05_beergame.py](../../simlab/scenarios/s05_beergame.py) | the bullwhip effect across serial echelons |

## Related nodes

- Problem-type guide: [Agent-Based Modeling](../problem-types/02_agent-based-modeling.md)
- Same problem type, different tools: [Mesa-Geo](./05_mesa-geo.md) (real maps) ·
  [NetLogo Web](./07_netlogo-web.md) (in-browser) · [JuPedSim](./06_jupedsim.md) (crowd flow) ·
  [GPU-ABM chapter](./18_gpu-abm-chapter.md) (FLAME GPU 2 / ABMax / AMBER, reference only)
