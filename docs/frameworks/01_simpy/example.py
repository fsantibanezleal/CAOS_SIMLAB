"""Minimal M/M/c queue in SimPy — the DES "hello world" for CAOS_SIMLAB.

This is the smallest honest demonstration of the process-interaction worldview that
SimPy gives you: customers arrive as a Poisson process, compete for a pool of ``c``
identical servers (a ``simpy.Resource``), wait in a FIFO queue when all servers are
busy, get served for an exponential time, then leave. We record each customer's
waiting time and the busy-time of the server pool, then print the mean wait and the
server utilization.

The point of the example is twofold:

1. Show the SimPy shape — an ``env``, a ``Resource``, generator processes that
   ``yield`` timeouts and resource requests, and ``env.run(until=...)``.
2. Validate against queueing *theory*. An M/M/c queue has a closed-form mean wait
   (the Erlang-C result), so we print the simulated mean next to the analytic one.
   A simulation that does not converge to a known answer when one exists is a bug,
   not a result.

Everything is deterministic: we seed a ``random.Random`` instance and pass it around,
so the same script always prints the same numbers. No display, no files, no network —
pure-Python and Pyodide-friendly, exactly as the live lane requires.

Run (from the repo root):
    .venv/Scripts/python.exe docs/frameworks/01_simpy/example.py
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

import simpy

# ---------------------------------------------------------------------------
# Parameters of the M/M/c queue. (params, seed) fully determine the run.
# ---------------------------------------------------------------------------
SEED = 42
N_SERVERS = 3          # c  — number of identical parallel servers
ARRIVAL_RATE = 2.4     # lambda — mean arrivals per unit time (Poisson process)
SERVICE_RATE = 1.0     # mu     — mean services per unit time per busy server
SIM_TIME = 20_000.0    # simulated-time horizon (long enough for a tight estimate)
WARMUP = 1_000.0       # discard the initial transient before collecting stats


@dataclass
class Stats:
    """Collected observations. Kept in one object so processes can mutate it."""

    waits: list[float] = field(default_factory=list)   # per-customer queue wait (Wq)
    busy_time: float = 0.0                              # total server-busy time (server-units)


def customer(env: simpy.Environment, servers: simpy.Resource,
             rng: random.Random, stats: Stats) -> "simpy.events.Process":
    """Life-story of one customer: queue for a server, hold it, then leave."""
    t_arrive = env.now
    with servers.request() as req:        # join the FIFO queue for a free server
        yield req                         # WAIT until a server is free
        wait = env.now - t_arrive
        service_time = rng.expovariate(SERVICE_RATE)
        yield env.timeout(service_time)   # HOLD the server for the service duration
    # leaving the `with` block releases the server for the next waiting customer

    if t_arrive >= WARMUP:                 # only record once the system has settled
        stats.waits.append(wait)
        stats.busy_time += service_time


def arrivals(env: simpy.Environment, servers: simpy.Resource,
             rng: random.Random, stats: Stats):
    """Generate a Poisson arrival stream: exponential inter-arrival gaps."""
    while True:
        yield env.timeout(rng.expovariate(ARRIVAL_RATE))
        env.process(customer(env, servers, rng, stats))


def erlang_c_mean_wait(lam: float, mu: float, c: int) -> float:
    """Closed-form mean queue wait (Wq) for an M/M/c queue — the analytic reference.

    rho = lam / (c*mu) must be < 1 for a stable queue. Returns the theoretical mean
    time a customer spends waiting in the queue (not counting service).
    """
    a = lam / mu                      # offered load in Erlangs
    rho = a / c                       # per-server utilization
    # Erlang-C probability that an arriving customer must wait (queues at all):
    sum_terms = sum(a**n / math.factorial(n) for n in range(c))
    last_term = (a**c / math.factorial(c)) * (1.0 / (1.0 - rho))
    p_wait = last_term / (sum_terms + last_term)
    return p_wait / (c * mu - lam)    # Erlang-C mean wait Wq


def main() -> None:
    rng = random.Random(SEED)         # the ONE source of randomness -> determinism
    env = simpy.Environment()
    servers = simpy.Resource(env, capacity=N_SERVERS)
    stats = Stats()

    env.process(arrivals(env, servers, rng, stats))
    env.run(until=SIM_TIME)

    measured_window = SIM_TIME - WARMUP
    mean_wait = sum(stats.waits) / len(stats.waits)
    utilization = stats.busy_time / (N_SERVERS * measured_window)
    rho_theory = ARRIVAL_RATE / (N_SERVERS * SERVICE_RATE)
    wq_theory = erlang_c_mean_wait(ARRIVAL_RATE, SERVICE_RATE, N_SERVERS)

    print("M/M/c queue simulation (SimPy)")
    print(f"  parameters : c={N_SERVERS}, lambda={ARRIVAL_RATE}, mu={SERVICE_RATE}, "
          f"seed={SEED}")
    print(f"  horizon    : {SIM_TIME:.0f} (warm-up discarded: {WARMUP:.0f})")
    print(f"  customers  : {len(stats.waits)} measured after warm-up")
    print("  results (simulated vs. theory):")
    print(f"    mean wait Wq   : {mean_wait:8.4f}   theory(Erlang-C): {wq_theory:8.4f}")
    print(f"    utilization rho: {utilization:8.4f}   theory(lambda/c.mu): {rho_theory:8.4f}")


if __name__ == "__main__":
    main()
