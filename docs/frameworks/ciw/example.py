"""Ciw M/M/c validation: simulate mean waiting time, compare to closed-form Erlang-C.

Scenario S01 ("Bank / Clinic Teller Queue") is the lab's queueing on-ramp. Its whole
pedagogical point is *validation*: a discrete-event simulation should agree with the
analytical M/M/c result. This script runs an M/M/c queue in Ciw, estimates the mean
waiting time across independent seeded replications, and prints it next to the Erlang-C
closed form Wq. They should match within a small confidence interval.

Model:  single service centre, Poisson arrivals (rate LAMBDA), exponential service
(rate MU per server), c identical servers, infinite queue, FIFO. This is M/M/c.

Deterministic: ciw.seed(s) is set per replication, so the output is reproducible.

Run from the repo root:
    .venv/Scripts/python.exe docs/frameworks/ciw/example.py
"""

import math
import statistics

import ciw

# --- M/M/c parameters --------------------------------------------------------
LAMBDA = 3.0   # arrival rate (customers / time unit)
MU = 1.0       # service rate per server (customers / time unit / server)
C = 4          # number of servers
# Stability requires rho = LAMBDA / (C * MU) < 1.  Here rho = 3 / 4 = 0.75.

# --- Simulation controls -----------------------------------------------------
MAX_TIME = 8000.0   # length of each simulated run (time units)
WARMUP = 1000.0     # discard records that arrived during the transient warm-up
REPLICATIONS = 30   # independent runs => a confidence interval on the estimate
SEED0 = 0           # base seed; replication k uses SEED0 + k


def erlang_c_wq(lam: float, mu: float, c: int) -> float:
    """Closed-form mean waiting time in queue Wq for M/M/c (Erlang-C).

    a   = offered load = lam / mu (in Erlangs)
    rho = a / c        = server utilisation (< 1 for stability)
    C(c, a) = Erlang-C probability that an arriving customer must wait
    Wq      = C(c, a) / (c*mu - lam)
    """
    a = lam / mu
    rho = a / c
    if rho >= 1.0:
        raise ValueError("Unstable system: rho = lam/(c*mu) must be < 1.")

    # Erlang-C probability of waiting, computed in a numerically stable way.
    # Numerator term: a**c / c!  scaled by 1/(1-rho).
    # Denominator: sum_{k=0}^{c-1} a**k / k!  +  (a**c / c!) / (1 - rho).
    sum_terms = sum(a**k / math.factorial(k) for k in range(c))
    last_term = a**c / math.factorial(c)
    prob_wait = (last_term / (1.0 - rho)) / (sum_terms + last_term / (1.0 - rho))

    wq = prob_wait / (c * mu - lam)
    return wq


def run_replication(seed: int) -> float:
    """Run one M/M/c simulation and return the mean post-warm-up waiting time."""
    network = ciw.create_network(
        arrival_distributions=[ciw.dists.Exponential(rate=LAMBDA)],
        service_distributions=[ciw.dists.Exponential(rate=MU)],
        number_of_servers=[C],
    )
    ciw.seed(seed)
    sim = ciw.Simulation(network)
    sim.simulate_until_max_time(MAX_TIME)

    recs = sim.get_all_records()
    waits = [r.waiting_time for r in recs if r.arrival_date >= WARMUP]
    return statistics.mean(waits)


def main() -> None:
    theory_wq = erlang_c_wq(LAMBDA, MU, C)

    per_rep = [run_replication(SEED0 + k) for k in range(REPLICATIONS)]
    sim_mean = statistics.mean(per_rep)
    sim_sd = statistics.stdev(per_rep)
    stderr = sim_sd / math.sqrt(REPLICATIONS)
    half_ci = 1.96 * stderr  # ~95% normal CI on the mean across replications

    rel_err = abs(sim_mean - theory_wq) / theory_wq

    a = LAMBDA / MU
    rho = a / C

    print("M/M/c queue validation with Ciw")
    print("=" * 48)
    print(f"lambda (arrival rate) : {LAMBDA}")
    print(f"mu     (service rate) : {MU}")
    print(f"c      (servers)      : {C}")
    print(f"offered load a=l/mu   : {a:.4f} Erlangs")
    print(f"utilisation rho       : {rho:.4f}")
    print("-" * 48)
    print(f"replications          : {REPLICATIONS}")
    print(f"run length / warm-up  : {MAX_TIME:g} / {WARMUP:g}")
    print("-" * 48)
    print(f"Erlang-C theory   Wq  : {theory_wq:.5f}")
    print(f"Ciw simulation    Wq  : {sim_mean:.5f}")
    print(f"95% CI (sim mean)     : [{sim_mean - half_ci:.5f}, {sim_mean + half_ci:.5f}]")
    print(f"relative error        : {rel_err * 100:.2f}%")
    covered = (sim_mean - half_ci) <= theory_wq <= (sim_mean + half_ci)
    print(f"theory inside 95% CI  : {covered}")
    print("=" * 48)
    print("PASS: sim ~= theory" if rel_err < 0.05 else "CHECK: error above 5%")


if __name__ == "__main__":
    main()
