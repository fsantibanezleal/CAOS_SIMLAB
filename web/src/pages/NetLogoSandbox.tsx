import { NetLogoCard } from "@/components/sim/NetLogoCard";

/**
 * Isolated sandbox page (not in the nav) for validating the NetLogo Web live-ABM lane.
 * Route: /sandbox/netlogo. Deliberately minimal — it proves the engine compiles and runs
 * a model fully client-side, independent of the Pyodide worker and the precomputed players.
 */
export default function NetLogoSandbox() {
  return (
    <section className="page netlogo-sandbox">
      <header className="page-head">
        <h1>NetLogo Web — Live ABM sandbox</h1>
        <p className="lede">
          Prototype of the client-side ABM lane. The model below compiles and runs entirely
          in your browser via the NetLogo Web (Tortoise) engine — no Python, no server.
        </p>
      </header>
      <NetLogoCard model="schelling.html" title="Schelling Segregation (NetLogo Web)" height={560} />
    </section>
  );
}
