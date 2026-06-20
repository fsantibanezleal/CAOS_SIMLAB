# 01 · What discrete-event simulation is

> Part of the [Discrete-Event Simulation guide](../01_discrete-event-simulation.md). This page builds the
> mental model: the event-driven clock, the five concepts that make up the whole vocabulary, and the two
> worldviews that decide how you *write* a model.

A discrete-event simulation advances time by **jumping from event to event**, not by ticking a fixed
clock. Nothing in the model changes *between* events, so there is no reason to simulate the gaps — you
leap straight to the next thing that happens. This is what makes DES efficient for systems that are
mostly "waiting": queues, service desks, hospitals, factories, road networks.

Contrast this with a **time-stepped** simulation (the natural style for agent-based models — see the
[ABM guide](../02_agent-based-modeling.md)), which advances the clock by a fixed Δt and re-evaluates every
entity at every tick whether or not anything changed. For a system that spends most of its time idle —
a bank that serves a customer every few minutes but is "doing nothing" in between — the event-driven
clock is dramatically cheaper: it only does work when work actually happens.

## The five concepts

Five concepts make up the whole vocabulary of DES. Master these and you can read any DES model:

- **Entities** — the things that flow through the system and carry state: customers, patients, trucks,
  jobs, parts. They are created (arrive), move between activities, and eventually leave (depart). Each
  entity typically carries attributes (a priority class, an arrival timestamp) used to compute KPIs.
- **Resources** — the limited things entities compete for: tellers, nurses, treatment bays, machines,
  loaders. An entity that needs a busy resource must **wait in a queue**. The *scarcity* of resources is
  what creates contention, and contention is what DES exists to measure.
- **Events** — instantaneous state changes scheduled at a specific simulated time: "arrival", "service
  complete", "breakdown", "shift change". Each event can schedule future events (an arrival schedules
  the next arrival; a service-start schedules its own completion).
- **The future-event list (FEL)** — the engine's beating heart: a time-ordered queue of all events that
  are scheduled but have not yet happened. The simulation loop is simply *pop the earliest event,
  advance the clock to its time, execute it (which may schedule more events), repeat* — until the clock
  reaches the horizon or the list empties.
- **The simulated clock** — a single number holding "now" in simulated time. It has nothing to do with
  wall-clock time: a model can simulate a 24-hour hospital day in milliseconds, or a millisecond-scale
  network in minutes, depending on event density.

### The event loop, concretely

The whole engine is this loop, and it is worth holding in your head because every honesty rule later
follows from it:

```text
while FEL not empty and clock < horizon:
    event = FEL.pop_earliest()      # the next thing that happens
    clock = event.time              # time JUMPS to it (nothing happened in between)
    event.execute()                 # changes state; may schedule new future events
```

Because the clock only ever moves *to the next scheduled event*, the simulation does zero work during
idle stretches — that is the whole efficiency argument for DES.

## Two worldviews: process-interaction vs event-scheduling

There are two classic ways to *write* a DES model, and the engine you pick effectively chooses one for
you:

- **Process-interaction** — you describe the **life-story of one entity** as a procedure that
  alternates *doing things* and *waiting*: "arrive, request a nurse, hold for the treatment time,
  release the nurse, depart". The engine runs many such processes concurrently and handles the FEL
  bookkeeping invisibly. This is by far the more readable, teachable style, and it is exactly what
  [**SimPy**](../../frameworks/01_simpy.md) gives you with Python generators and the `yield` keyword —
  each `yield` is a point where the process *waits* (for a timeout, for a resource) and hands control
  back to the engine. The concrete shape is on the
  [Methods & KPIs page](./03_methods-and-kpis.md#process-interaction-in-practice-the-simpy-shape).
- **Event-scheduling** — you describe the system as a set of **event handlers** (an "arrival routine",
  a "departure routine") that directly insert future events into the FEL. It is lower-level and closer
  to the engine mechanics; it can be faster and is natural for pure **queueing networks**, which is the
  style [**Ciw**](../../frameworks/02_ciw.md) uses internally.

CAOS_SIMLAB teaches the **process-interaction** worldview first (it reads like a story and matches how
people describe systems), and uses the event-scheduling view as the bridge to queueing *theory* in the
Ciw lesson. Both produce identical dynamics; they are two ways of writing the same FEL-driven clock.

A third, even more readable variant exists: [**Salabim**](../../frameworks/03_salabim.md) offers
process-interaction *without* Python's `yield` (its components subclass a base class and define a
`process` method), trading a small amount of explicitness for prose-like code. It is a teaching
counterpoint, not the live engine — see [05 · The DES toolbox](./05_tools.md).

## Next

- [02 · When to use it](./02_when-to-use.md) — the four conditions that make a problem a DES, and the
  boundaries against the neighbouring methods.
- [03 · Methods & KPIs](./03_methods-and-kpis.md) — what you actually measure, and the SimPy
  process-interaction shape in code.
- Back to the [DES section index](../01_discrete-event-simulation.md).
