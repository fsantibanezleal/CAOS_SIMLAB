# Salabim — Usage

This page teaches the core Salabim API through a minimal, runnable M/M/1 queue, walks
through it step by step, and shows the **real captured output** of
[`example.py`](./example.py). It also explains the `.mp4`/`.gif` export path
*conceptually* — without opening a GUI window.

For *what Salabim is for in this lab* and *when to choose it over SimPy/Ciw*, read
[`applying.md`](./applying.md). For install details and the greenlet caveat, read
[`installation.md`](./installation.md).

---

## 1. The mental model

Salabim is a **process-interaction** DES, like SimPy: you describe the *life-story* of one
entity as a procedure that alternates *doing things* and *waiting*. The engine runs many
such processes "concurrently" on a single simulated clock driven by a future-event list
(FEL). The difference from SimPy is the API shape — Salabim is more object-oriented and
ships a batteries-included animation/statistics layer.

### Key concepts / API surface

| Concept | Salabim API | What it is |
|---|---|---|
| The world + clock + RNG | `sim.Environment(random_seed=..., yieldless=False, blind_animation=...)` | Owns simulated time, the FEL, the seeded RNG, and (optionally) the animation. |
| A process / entity | subclass `sim.Component`, define `def process(self): ...` | A generator describing one entity's life-story. |
| Wait for a duration | `yield self.hold(duration)` | Advance the clock; the entity is idle/being served. |
| Acquire a limited resource | `yield self.request(resource)` | Queue for, then seize, capacity on a `Resource`. |
| Release it | `self.release(resource)` | Hand the resource back to the next waiter. |
| A limited resource | `sim.Resource("name", capacity=c)` | The thing entities compete for (a server, a nurse, a bay). |
| A queue you manage | `sim.Queue("name")`, `self.enter(q)`, `self.leave(q)` | An explicit waiting line you can measure. |
| Random draws | `sim.Exponential(mean)`, `.sample()` | Distributions tied to the env's seeded RNG. |
| Run | `env.run(till=horizon)` | Pop events until the clock reaches `horizon`. |

### Built-in statistics (the didactic payoff)

Salabim attaches **monitors** to resources and queues automatically — no manual
bookkeeping. The ones used here:

- `queue.length.mean()` — time-average number waiting (`Lq`).
- `queue.length_of_stay.mean()` — average time an entity spends in the queue (`Wq`).
- `queue.length.maximum()` — worst-case queue length.
- `queue.number_of_arrivals` — how many entities entered the queue.
- `resource.occupancy.mean()` — time-average utilization (`rho`).
- `resource.claimers().length_of_stay.number_of_entries()` — number served.

These map one-to-one onto the queueing KPIs taught in the
[DES problem-type guide](../../problem-types/discrete-event-simulation.md), which is why
Salabim is a clean teaching counterpoint: the statistics come for free.

> **Two process styles.** Salabim 26.x defaults to *yieldless* (greenlet) — but this lab
> has no greenlet, so we pass `yieldless=False` and use the classic generator style with
> `yield`. See [`installation.md`](./installation.md#important-platform-note--greenlet-is-not-installed-here).

---

## 2. The minimal example, walked through

Below is the heart of [`example.py`](./example.py) — a single-server M/M/1 queue. Offered
load is `rho = lambda / mu = 1.0 / 1.25 = 0.8`, so the system is stable and should converge
to the closed-form M/M/1 results.

```python
import salabim as sim

class Customer(sim.Component):
    def process(self):
        self.enter(env.waiting_line)               # 1. join the FIFO line
        yield self.request(env.server)             # 2. WAIT until the server is free
        self.leave(env.waiting_line)               # 3. being served -> leave the line
        yield self.hold(env.service_dist.sample())  # 4. HOLD the server for service
        self.release(env.server)                   # 5. done -> free it for the next

class CustomerGenerator(sim.Component):
    def process(self):
        while True:
            Customer()                              # spawn an arrival
            yield self.hold(env.iat_dist.sample())  # wait an exponential gap, repeat

# blind_animation=True -> animation engine active but NO window opens (headless).
# yieldless=False      -> classic generator/`yield` style (no greenlet needed).
env = sim.Environment(random_seed=42, yieldless=False, blind_animation=True)
env.server = sim.Resource("server", capacity=1)
env.waiting_line = sim.Queue("waiting_line")
env.iat_dist = sim.Exponential(1.0)      # mean inter-arrival 1.0  -> lambda = 1.0
env.service_dist = sim.Exponential(0.8)  # mean service 0.8        -> mu     = 1.25
CustomerGenerator()
env.run(till=20000)

print("Lq:", env.waiting_line.length.mean())
print("Wq:", env.waiting_line.length_of_stay.mean())
print("rho:", env.server.occupancy.mean())
```

Step by step:

1. **`self.enter(env.waiting_line)`** — the customer joins an explicit FIFO queue we can
   measure. (Salabim also tracks the resource's own requesters, but an explicit `Queue`
   makes the waiting-line statistics first-class.)
2. **`yield self.request(env.server)`** — the customer asks for the single server. If it is
   busy, the process *parks here* and the engine moves on to other events; when the server
   frees up, this customer is resumed. This `yield` is a wait point.
3. **`self.leave(env.waiting_line)`** — the moment service starts, the customer is no longer
   waiting, so it leaves the line.
4. **`yield self.hold(...)`** — the customer holds the server for an exponentially-distributed
   service time. The clock advances by that amount for this entity.
5. **`self.release(env.server)`** — service done; the server is freed and the next waiter (if
   any) is admitted.

The `CustomerGenerator` is the arrival stream: spawn a `Customer`, wait an exponential gap,
repeat — i.e. a Poisson process. `random_seed=42` makes both the inter-arrival and service
draws reproducible, so the **same `(seed, params)` reproduces the exact same trace** — the
lab's determinism contract.

### Validation against theory

`example.py` also computes the closed-form M/M/1 results and prints sim-vs-theory side by
side, because *a single number from a simulation is meaningless until you can trust it*:

```text
rho = lambda / mu
Lq  = rho^2 / (1 - rho)      # mean number waiting
Wq  = rho / (mu - lambda)    # mean waiting time
```

At a long horizon the simulated KPIs converge to these — that convergence *is* the
validation, and it is the strongest "does my sim match theory?" move in DES teaching.

---

## 3. Verified output

Captured by actually running, from the repo root:

```bash
.venv/Scripts/python.exe docs/frameworks/salabim/example.py
```

```text
================================================================
Salabim M/M/1 (headless: blind_animation=True, yieldless=False)
================================================================
salabim version : 26.0.6
seed            : 42
lambda / mu     : 1.0000 / 1.2500   (offered rho = 0.8000)
horizon         : 20000 simulated time units
----------------------------------------------------------------
arrivals        : 19971
served          : 19970
max queue length: 30
----------------------------------------------------------------
KPI                    simulated        theory     abs.err
utilization rho           0.7970        0.8000      0.0030
mean queue Lq             3.2184        3.2000      0.0184
mean wait Wq              3.2231        3.2000      0.0231
================================================================
Sim converges to closed-form M/M/1 -> the model is validated.
(No GUI was opened. To export an .mp4/.gif instead, see usage.md /
 applying.md: env.animate(True) + env.video('out.mp4') then env.run().)
```

Reading it: the measured utilization (0.7970) and queue statistics (`Lq` 3.2184, `Wq`
3.2231) sit within ~0.02 of the exact M/M/1 theory (0.8000 / 3.2000 / 3.2000). The model is
validated, and **no GUI window was opened** — `blind_animation=True` kept it headless. Re-run
it and the numbers are identical: the run is deterministic from `(seed=42, params)`.

> One run is still just one (long) sample. The lab's honesty curriculum requires N seeded
> replications + a confidence interval for any *claim*; this single converged run is a
> sanity/validation check, not the final reporting format. See the
> [DES guide §4](../../problem-types/discrete-event-simulation.md).

---

## 4. The `.mp4` / `.gif` export path (conceptual — no GUI here)

This is Salabim's headline feature and its only real reason to exist in this lab: it can
turn a DES run into a **ready-made replay video, offline**. The example above deliberately
does **not** do this (it would touch the renderer); here is the path conceptually.

### How it works

1. **Enable animation** on the environment and add animation objects (an
   `AnimateQueue` for the line, an `AnimateText` clock, etc.):

   ```python
   env = sim.Environment(random_seed=42, yieldless=False)
   env.animate(True)                 # turn the animation layer on
   env.animation_parameters(...)     # canvas size, speed, fps, background
   # add sim.AnimateQueue(...), sim.AnimateText(...), etc.
   ```

2. **Bind a video target** *before* running and Salabim writes frames as the model runs:

   ```python
   env.video("docs/.../haul_replay.mp4")  # or ".gif"
   env.run(till=HORIZON)
   env.video_close()                       # finalize the file
   ```

   The frame rate, resolution and real-time-to-sim-time speed are set via
   `animation_parameters`. For `.mp4`/`.avi` an `ffmpeg` binary must be on `PATH`; `.gif`
   needs only Pillow.

### Doing it headless (no popup window)

On a server / CI / or just to avoid a window, create the environment with
`blind_animation=True`. The animation engine renders frames to the video file but **never
opens a tkinter window**:

```python
env = sim.Environment(random_seed=42, yieldless=False, blind_animation=True)
env.animate(True)
env.video("out.mp4")
env.run(till=HORIZON)
env.video_close()
```

> This is render-only — it produces a file, not an interactive view. It is exactly the
> offline-render shape the lab wants: compute on the local machine, commit the compact
> video artifact, replay it in the SPA. The interactive, parameter-editable view in the web
> app is **not** Salabim — it is the React viewer over a SimPy event trace. Salabim's
> animation cannot be embedded in a browser at all (it is tkinter). See
> [`applying.md`](./applying.md) for why, and where each lane draws the line.
