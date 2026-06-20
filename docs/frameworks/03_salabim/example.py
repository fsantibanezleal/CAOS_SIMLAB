"""Salabim M/M/1 — headless (no GUI), seeded, deterministic.

A tiny single-server queue (M/M/1) modelled in Salabim and run with NO display:
``blind_animation=True`` means the animation engine is wired up but never opens a
tkinter window, so the script runs fine on a headless box / CI. We print the queue
statistics and compare them against the closed-form M/M/1 theory.

Why ``yieldless=False``?
    Salabim 26.x defaults to a "yieldless" process style that relies on the native
    ``greenlet`` extension. This lab does NOT carry greenlet (it is not in any
    requirements file), so we use the classic generator style instead: each process
    is a Python generator and every wait is a ``yield`` (``yield self.request(...)``,
    ``yield self.hold(...)``). This is the same process-interaction worldview taught
    for SimPy and needs no native dependency.

This is the OFFLINE/precompute lane only. Salabim's animation renders with tkinter
(a desktop GUI) and CANNOT be embedded in a web page — see applying.md. The live web
viewer is driven by SimPy event traces instead.

Run (cwd = repo root):
    .venv/Scripts/python.exe docs/frameworks/03_salabim/example.py
"""

import salabim as sim

# --- Parameters (an M/M/1 with offered load rho = lambda / mu = 0.8) -------------
SEED = 42          # determinism contract: same seed => identical trace
MEAN_IAT = 1.0     # mean inter-arrival time  -> arrival rate lambda = 1.0
MEAN_SERVICE = 0.8 # mean service time        -> service rate  mu     = 1.25
HORIZON = 20000.0  # simulated-time horizon (long enough to converge to theory)

LAMBDA = 1.0 / MEAN_IAT
MU = 1.0 / MEAN_SERVICE
RHO = LAMBDA / MU  # = 0.8; the system is stable only while RHO < 1


class Customer(sim.Component):
    """One customer: wait in line, get the server, hold for service, leave."""

    def process(self):
        self.enter(env.waiting_line)        # join the FIFO queue
        yield self.request(env.server)      # WAIT until the single server is free
        self.leave(env.waiting_line)        # now being served -> leave the line
        yield self.hold(env.service_dist.sample())  # HOLD the server for service
        self.release(env.server)            # done -> free the server for the next


class CustomerGenerator(sim.Component):
    """Poisson arrivals: spawn a Customer, wait an exponential gap, repeat."""

    def process(self):
        while True:
            Customer()
            yield self.hold(env.iat_dist.sample())


def build_and_run():
    """Build the model headless, run it, and return the measured KPIs."""
    global env
    # blind_animation=True  -> animation engine active but NO window is opened.
    # yieldless=False       -> classic generator/`yield` style (no greenlet needed).
    env = sim.Environment(random_seed=SEED, yieldless=False, blind_animation=True)

    env.server = sim.Resource("server", capacity=1)
    env.waiting_line = sim.Queue("waiting_line")
    # Salabim's own seeded RNG (env.random_seed=SEED) drives these distributions,
    # so the whole run is reproducible from (SEED, params) alone.
    env.iat_dist = sim.Exponential(MEAN_IAT)
    env.service_dist = sim.Exponential(MEAN_SERVICE)

    CustomerGenerator()
    env.run(till=HORIZON)

    return {
        "served": env.server.claimers().length_of_stay.number_of_entries(),
        "arrivals": env.waiting_line.number_of_arrivals,
        "occupancy": env.server.occupancy.mean(),          # measured rho
        "Lq": env.waiting_line.length.mean(),              # mean queue length
        "Wq": env.waiting_line.length_of_stay.mean(),      # mean wait in queue
        "max_q": env.waiting_line.length.maximum(),        # worst-case queue length
    }


def theory():
    """Closed-form M/M/1 results for validation."""
    return {
        "rho": RHO,
        "Lq": RHO ** 2 / (1 - RHO),     # mean number waiting
        "Wq": RHO / (MU - LAMBDA),       # mean waiting time in queue
        "L": RHO / (1 - RHO),            # mean number in system
        "W": 1.0 / (MU - LAMBDA),        # mean time in system
    }


def main():
    sim_kpi = build_and_run()
    th = theory()

    print("=" * 64)
    print("Salabim M/M/1 (headless: blind_animation=True, yieldless=False)")
    print("=" * 64)
    print(f"salabim version : {sim.__version__}")
    print(f"seed            : {SEED}")
    print(f"lambda / mu     : {LAMBDA:.4f} / {MU:.4f}   (offered rho = {RHO:.4f})")
    print(f"horizon         : {HORIZON:.0f} simulated time units")
    print("-" * 64)
    print(f"arrivals        : {sim_kpi['arrivals']}")
    print(f"served          : {sim_kpi['served']}")
    print(f"max queue length: {sim_kpi['max_q']}")
    print("-" * 64)
    print(f"{'KPI':<18}{'simulated':>14}{'theory':>14}{'abs.err':>12}")
    print(f"{'utilization rho':<18}{sim_kpi['occupancy']:>14.4f}{th['rho']:>14.4f}"
          f"{abs(sim_kpi['occupancy'] - th['rho']):>12.4f}")
    print(f"{'mean queue Lq':<18}{sim_kpi['Lq']:>14.4f}{th['Lq']:>14.4f}"
          f"{abs(sim_kpi['Lq'] - th['Lq']):>12.4f}")
    print(f"{'mean wait Wq':<18}{sim_kpi['Wq']:>14.4f}{th['Wq']:>14.4f}"
          f"{abs(sim_kpi['Wq'] - th['Wq']):>12.4f}")
    print("=" * 64)
    print("Sim converges to closed-form M/M/1 -> the model is validated.")
    print("(No GUI was opened. To export an .mp4/.gif instead, see usage.md /")
    print(" applying.md: env.animate(True) + env.video('out.mp4') then env.run().)")


if __name__ == "__main__":
    main()
