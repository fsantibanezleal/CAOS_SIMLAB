import { SubTabs } from "@/components/content/SubTabs";
import { Callout } from "@/components/content/Callout";
import { Equation } from "@/components/content/Equation";
import { Refs } from "@/components/content/Cite";

export function OptimizationTheory({ es }: { es: boolean }) {
  const tabs = [
    {
      id: "lp",
      label: es ? "Programación lineal y dualidad" : "Linear programming & duality",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "La programación lineal (LP) es el problema de minimizar (o maximizar) una función objetivo lineal sujeta a restricciones lineales de igualdad y desigualdad. En forma estándar se escribe: minimizar c·x sujeto a Ax=b y x≥0, donde x∈ℝⁿ es el vector de decisiones, c el vector de costos, A una matriz m×n de coeficientes y b el lado derecho. El conjunto factible {x : Ax=b, x≥0} es un poliedro convexo, y como el objetivo es lineal, si existe un óptimo finito siempre se alcanza en un vértice (punto extremo) del poliedro. Esta es la observación geométrica fundamental, formalizada por George Dantzig en 1947: la búsqueda continua sobre un poliedro convexo se reduce a una búsqueda combinatoria sobre su conjunto finito de vértices."
                : "Linear programming (LP) is the problem of minimizing (or maximizing) a linear objective subject to linear equality and inequality constraints. In standard form: minimize c·x subject to Ax=b and x≥0, where x∈ℝⁿ is the decision vector, c the cost vector, A an m×n coefficient matrix, and b the right-hand side. The feasible set {x : Ax=b, x≥0} is a convex polyhedron, and because the objective is linear, a finite optimum — when one exists — is always attained at a vertex (extreme point) of the polyhedron. This is the founding geometric observation, formalized by George Dantzig in 1947: continuous optimization over a convex polyhedron reduces to a combinatorial search over its finite set of vertices."}
            </p>
            <p>
              {es
                ? "Dos familias de algoritmos lo resuelven. El método símplex (Dantzig) camina de vértice en vértice por las aristas del poliedro, mejorando el objetivo en cada paso hasta que ningún vecino mejora — entonces ese vértice es óptimo. Es exponencial en el peor caso (Klee–Minty) pero extraordinariamente rápido en la práctica. Los métodos de punto interior (Karmarkar 1984) atraviesan el interior del poliedro siguiendo una trayectoria central y convergen al óptimo en tiempo polinómico demostrable; ganan en problemas muy grandes y dispersos. OR-Tools expone ambos a través de GLOP, su solver LP de punto flotante, que es exactamente el motor que SimLab usa para el plan de mezcla de S11."
                : "Two algorithm families solve it. The simplex method (Dantzig) walks from vertex to vertex along the edges of the polyhedron, improving the objective at each step until no neighbour improves — that vertex is then optimal. It is worst-case exponential (Klee–Minty) yet extraordinarily fast in practice. Interior-point methods (Karmarkar 1984) cut through the interior of the polyhedron along a central path and converge to the optimum in provable polynomial time; they win on very large, sparse problems. OR-Tools exposes both through GLOP, its floating-point LP solver — exactly the engine SimLab drives for the S11 blend plan."}
            </p>
            <p>
              {es
                ? "Toda LP (el primal) tiene una LP gemela (el dual) construida a partir de la misma A, b, c. El teorema de dualidad fuerte dice que si el primal tiene óptimo finito, el dual también, y sus valores óptimos coinciden: c·x*=b·y*. Las variables duales y son precios sombra — el valor marginal de relajar cada restricción. La holgura complementaria liga ambos: en el óptimo, para cada par primal-dual o bien la restricción está activa o bien su variable vale cero (x_j·(c−Aᵀy)_j=0 y y_i·(Ax−b)_i=0). La dualidad da un certificado de optimalidad (un par primal-dual factible con valores iguales prueba la optimalidad sin enumerar vértices) y la interpretación económica de los recursos escasos."
                : "Every LP (the primal) has a twin LP (the dual) built from the same A, b, c. Strong duality states that if the primal has a finite optimum, so does the dual, and their optimal values coincide: c·x*=b·y*. The dual variables y are shadow prices — the marginal value of relaxing each constraint. Complementary slackness ties them together: at the optimum, for each primal–dual pair either the constraint is binding or its variable is zero (x_j·(c−Aᵀy)_j=0 and y_i·(Ax−b)_i=0). Duality provides an optimality certificate (a feasible primal–dual pair with equal values proves optimality without enumerating vertices) and the economic reading of scarce resources."}
            </p>
            <p>
              {es
                ? "El plan de mezcla de planta de S11 es una LP pura resuelta con GLOP. Cada fuente i (una fase con ley de mineral g_i y suministro a_i) aporta x_i toneladas; la planta exige una demanda total D y una ley mezclada cercana a la meta g*. La desviación de ley |Σ g_i x_i − g* D| no es lineal, así que se lineariza con dos variables no negativas de holgura d⁺,d⁻: se impone Σ g_i x_i − g* D = d⁺ − d⁻ y se minimiza d⁺+d⁻ (la desviación absoluta). Las restricciones son Σ x_i = D y 0 ≤ x_i ≤ a_i. Como las leyes de las fases rodean la meta, ninguna fase sola la cumple: el óptimo es una mezcla genuina — el resultado central que el plan entrega."
                : "The S11 plant-blend plan is a pure LP solved with GLOP. Each source i (a phase with ore grade g_i and supply a_i) contributes x_i tonnes; the plant requires a total demand D and a blended grade near the target g*. The grade deviation |Σ g_i x_i − g* D| is not linear, so it is linearized with two non-negative slack variables d⁺,d⁻: impose Σ g_i x_i − g* D = d⁺ − d⁻ and minimize d⁺+d⁻ (the absolute deviation). The constraints are Σ x_i = D and 0 ≤ x_i ≤ a_i. Because the phase grades straddle the target, no single phase satisfies it: the optimum is a genuine blend — the headline result the plan delivers."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Linealidad: objetivo y restricciones son lineales en x; descarta economías de escala, costos fijos o términos producto (que requieren MILP o programación no lineal)."
                  : "Linearity: objective and constraints are linear in x; rules out economies of scale, fixed charges, or product terms (which need MILP or nonlinear programming).",
                es
                  ? "Divisibilidad: las variables son continuas. Si la decisión es indivisible (un camión entero, una máquina encendida/apagada) hace falta integralidad — la Sub-pestaña 2."
                  : "Divisibility: variables are continuous. If the decision is indivisible (a whole truck, a machine on/off) integrality is required — Sub-tab 2.",
                es
                  ? "La linealización del valor absoluto con d⁺,d⁻ es exacta solo porque se minimiza la desviación (en un óptimo nunca d⁺ y d⁻ son ambos positivos); maximizar |·| no se linealiza así."
                  : "The absolute-value linearization with d⁺,d⁻ is exact only because the deviation is minimized (at an optimum d⁺ and d⁻ are never both positive); maximizing |·| does not linearize this way.",
                es
                  ? "La dualidad fuerte requiere factibilidad y acotación; un primal infactible o no acotado rompe c·x*=b·y* (dualidad débil c·x ≥ b·y siempre se cumple)."
                  : "Strong duality requires feasibility and boundedness; an infeasible or unbounded primal breaks c·x*=b·y* (weak duality c·x ≥ b·y always holds).",
                es
                  ? "El plan LP es necesario pero no suficiente: supone suministro y haul ilimitados. Una flota fija puede no realizarlo en el turno — el tema de la Sub-pestaña 6."
                  : "The LP plan is necessary but not sufficient: it assumes unlimited supply and haulage. A fixed fleet may fail to realize it within the shift — the subject of Sub-tab 6.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`\min_{x}\ c^{\top}x\quad\text{s.t.}\quad Ax=b,\ \ x\ge 0,\qquad x\in\mathbb{R}^{n},\ A\in\mathbb{R}^{m\times n}.`}
            caption={es ? "Forma estándar de la LP: objetivo lineal sobre un poliedro convexo." : "LP standard form: linear objective over a convex polyhedron."}
          />
          <Equation
            tex={String.raw`\textbf{Primal: }\ \min\ c^{\top}x,\ Ax\ge b,\ x\ge 0
\qquad\Longleftrightarrow\qquad
\textbf{Dual: }\ \max\ b^{\top}y,\ A^{\top}y\le c,\ y\ge 0.`}
            caption={es ? "Par primal–dual; en el óptimo c·x* = b·y* (dualidad fuerte)." : "Primal–dual pair; at the optimum c·x* = b·y* (strong duality)."}
          />
          <Equation
            tex={String.raw`x_j\,\bigl(c-A^{\top}y\bigr)_j=0,\qquad y_i\,\bigl(Ax-b\bigr)_i=0\qquad\text{(complementary slackness).}`}
            caption={es ? "Holgura complementaria: cada par está activo o su variable es cero." : "Complementary slackness: each pair is binding or its variable is zero."}
          />
          <Equation
            tex={String.raw`\min_{x,\,d^{+},d^{-}}\ d^{+}+d^{-}\quad\text{s.t.}\quad
\sum_i x_i = D,\ \ \sum_i g_i x_i - g^{*}D = d^{+}-d^{-},\ \ 0\le x_i\le a_i,\ \ d^{+},d^{-}\ge 0.`}
            caption={es ? "La LP de mezcla de S11 (GLOP): desviación absoluta de ley minimizada con d⁺, d⁻." : "The S11 blend LP (GLOP): absolute grade deviation minimized via d⁺, d⁻."}
          />

          <Callout variant="strong" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "GLOP resuelve esta LP en el carril de precómputo de S11. El vector solución plan_x = (x_i) es el plan de flujo que la flota debe realizar; plan_grade = (Σ g_i x_i)/D es la ley óptima alcanzable. La simulación de ejecución luego mide cuánto de ese óptimo entrega realmente una flota fija."
                : "GLOP solves this LP in the S11 precompute lane. The solution vector plan_x = (x_i) is the flow plan the fleet must realize; plan_grade = (Σ g_i x_i)/D is the optimal achievable grade. The execution simulation then measures how much of that optimum a fixed fleet actually delivers."}
            </p>
          </Callout>

          <Refs ids={["dantzig1963", "karmarkar1984", "vonneumann1947", "ortools"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "milp",
      label: es ? "Programación entera (MILP)" : "Integer & mixed-integer (MILP)",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "La programación lineal entera mixta (MILP) es una LP a la que se añade la exigencia de que algunas (o todas) las variables tomen valores enteros: minimizar c·x sujeto a Ax≤b, x≥0 y x_j∈ℤ para j en un subconjunto. La integralidad es lo que captura las decisiones indivisibles del mundo real — un vehículo se asigna o no a una ruta, una máquina está encendida o apagada, un trabajo se programa antes o después de otro. Pero ese único requisito cambia radicalmente la dificultad: el conjunto factible deja de ser convexo (es una retícula de puntos enteros dentro del poliedro) y los algoritmos de LP ya no bastan."
                : "Mixed-integer linear programming (MILP) is an LP with the added requirement that some (or all) variables take integer values: minimize c·x subject to Ax≤b, x≥0, and x_j∈ℤ for j in a subset. Integrality is what captures real-world indivisible decisions — a vehicle is assigned to a route or not, a machine is on or off, a job is scheduled before or after another. But that single requirement changes the difficulty radically: the feasible set is no longer convex (it is a lattice of integer points inside the polyhedron) and LP algorithms no longer suffice."}
            </p>
            <p>
              {es
                ? "La técnica básica es la relajación lineal: se descarta la integralidad y se resuelve la LP resultante. Su óptimo es una cota inferior del MILP (el conjunto factible entero está contenido en el poliedro continuo). Si la solución LP resulta entera, también es óptima del MILP — fin. Si no, se ramifica (branch-and-bound, Land y Doig 1960): se elige una variable fraccionaria x_j=2,7 y se crean dos subproblemas, uno con x_j≤2 y otro con x_j≥3, recursivamente. Cada nodo resuelve su LP relajada; las ramas cuya cota es peor que la mejor solución entera conocida se podan sin explorar. Los planos de corte (Gomory 1958) refuerzan el método añadiendo desigualdades válidas que recortan partes fraccionarias del poliedro sin eliminar ningún punto entero, ajustando la relajación al casco convexo entero. Los solvers modernos combinan ambos en branch-and-cut."
                : "The basic technique is the LP relaxation: drop integrality and solve the resulting LP. Its optimum is a lower bound on the MILP (the integer feasible set sits inside the continuous polyhedron). If the LP solution happens to be integral, it is also MILP-optimal — done. Otherwise we branch (branch-and-bound, Land & Doig 1960): pick a fractional variable x_j=2.7 and create two subproblems, one with x_j≤2 and one with x_j≥3, recursively. Each node solves its relaxed LP; branches whose bound is worse than the best known integer solution are pruned unexplored. Cutting planes (Gomory 1958) strengthen the method by adding valid inequalities that slice off fractional parts of the polyhedron without removing any integer point, tightening the relaxation toward the integer convex hull. Modern solvers combine both in branch-and-cut."}
            </p>
            <p>
              {es
                ? "Hay una clase afortunada en que la integralidad sale gratis. Si la matriz de restricciones A es totalmente unimodular (TU) — todo subdeterminante cuadrado vale 0, +1 o −1 — y b es entero, entonces todo vértice de la LP es entero automáticamente, así que resolver la LP relajada ya da la solución entera. Los problemas de asignación y de transporte tienen esta estructura: su matriz de incidencia nodo–arco en un grafo bipartito es TU. Por eso el emparejamiento óptimo de n trabajadores a n tareas, o el envío óptimo de oferta a demanda, se resuelve por LP pura sin ramificar. En cambio, los problemas con restricciones de eliminación de subrutas (VRP/TSP, Sub-pestaña 5) o de no solapamiento (job-shop, Sub-pestaña 3) no son TU y son NP-difíciles: el número de configuraciones enteras crece exponencialmente y no se conoce algoritmo de tiempo polinómico (salvo que P=NP)."
                : "There is a lucky class where integrality comes for free. If the constraint matrix A is totally unimodular (TU) — every square subdeterminant is 0, +1, or −1 — and b is integer, then every vertex of the LP is automatically integral, so solving the LP relaxation already yields the integer solution. Assignment and transportation problems have this structure: their node–arc incidence matrix on a bipartite graph is TU. That is why optimally matching n workers to n tasks, or optimally shipping supply to demand, is solved by pure LP with no branching. By contrast, problems with subtour-elimination constraints (VRP/TSP, Sub-tab 5) or no-overlap constraints (job-shop, Sub-tab 3) are not TU and are NP-hard: the number of integer configurations grows exponentially and no polynomial-time algorithm is known (unless P=NP)."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "La cota de la relajación LP es válida solo si todas las demás restricciones son lineales; la calidad de la cota (la brecha de integralidad) determina cuánto poda branch-and-bound."
                  : "The LP-relaxation bound is valid only if all other constraints are linear; the bound quality (the integrality gap) determines how much branch-and-bound prunes.",
                es
                  ? "La total unimodularidad es suficiente, no necesaria, para vértices enteros; verificarla en general es costoso, pero asignación/transporte/flujo en redes la tienen por construcción."
                  : "Total unimodularity is sufficient, not necessary, for integer vertices; checking it in general is costly, but assignment/transportation/network-flow have it by construction.",
                es
                  ? "Branch-and-bound es exacto pero de peor caso exponencial; en instancias grandes puede no cerrar la brecha en tiempo razonable y se detiene en un óptimo aproximado con garantía (la brecha de optimalidad — Sub-pestaña 7)."
                  : "Branch-and-bound is exact but worst-case exponential; on large instances it may not close the gap in reasonable time and stops at an approximate optimum with a guarantee (the optimality gap — Sub-tab 7).",
                es
                  ? "La NP-dureza es una afirmación de peor caso: muchas instancias estructuradas se resuelven rápido. El tamaño por sí solo no predice la dificultad; la estructura sí."
                  : "NP-hardness is a worst-case statement: many structured instances solve fast. Size alone does not predict difficulty; structure does.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`\min_{x}\ c^{\top}x\quad\text{s.t.}\quad Ax\le b,\ \ x\ge 0,\ \ x_j\in\mathbb{Z}\ \ (j\in I).`}
            caption={es ? "MILP: una LP con un subconjunto I de variables forzadas a ser enteras." : "MILP: an LP with a subset I of variables forced integer."}
          />
          <Equation
            tex={String.raw`z_{\text{LP}}\;=\;\min\{c^{\top}x : Ax\le b,\ x\ge 0\}\ \le\ z_{\text{MILP}}\;=\;\min\{c^{\top}x:\dots,\ x_j\in\mathbb{Z}\}.`}
            caption={es ? "La relajación lineal es una cota inferior del óptimo entero." : "The LP relaxation is a lower bound on the integer optimum."}
          />
          <Equation
            tex={String.raw`\text{branch on } x_j=\bar{x}_j\notin\mathbb{Z}:\quad
\bigl(x_j\le\lfloor\bar{x}_j\rfloor\bigr)\ \ \text{or}\ \ \bigl(x_j\ge\lceil\bar{x}_j\rceil\bigr).`}
            caption={es ? "Ramificación: dividir una variable fraccionaria en dos subproblemas." : "Branching: split a fractional variable into two subproblems."}
          />
          <Equation
            tex={String.raw`A\ \text{totally unimodular}\ \wedge\ b\in\mathbb{Z}^{m}\ \Longrightarrow\ \text{every LP vertex is integral (assignment / transportation).}`}
            caption={es ? "Total unimodularidad: la LP ya da soluciones enteras, sin ramificar." : "Total unimodularity: the LP already gives integer solutions, no branching."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "Es el marco que sustenta S08 (VRP) y la formulación alternativa MILP de S06 (job-shop). SimLab usa la maquinaria entera de OR-Tools (CP-SAT y el solver de rutas) precisamente porque estas decisiones — qué arco recorre cada vehículo, en qué orden corre cada operación — son indivisibles."
                : "It is the framework underlying S08 (VRP) and the alternative MILP formulation of S06 (job-shop). SimLab uses OR-Tools' integer machinery (CP-SAT and the routing solver) precisely because these decisions — which arc each vehicle traverses, in what order each operation runs — are indivisible."}
            </p>
          </Callout>

          <Refs ids={["land1960", "gomory1958", "papadimitriou1998", "garey1979"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "cpsat",
      label: es ? "Programación con restricciones (CP-SAT)" : "Constraint programming (CP-SAT)",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "La programación con restricciones (CP) es un paradigma alternativo para problemas combinatorios. En lugar de expresar todo como desigualdades lineales sobre números reales y relajar, la CP trabaja con variables de dominio finito y restricciones de alto nivel y muy expresivas — entre ellas restricciones globales como all-different, cumulative o no-overlap que encapsulan estructura combinatoria entera de una sola vez. El motor alterna propagación (podar de los dominios de las variables todo valor que ninguna solución puede tomar) y búsqueda (fijar tentativamente una variable y propagar de nuevo), retrocediendo al fallar. Frente al MILP, la CP brilla cuando el problema es muy combinatorio y con restricciones lógicas/disyuntivas rígidas (programación, secuenciación), donde la relajación lineal es débil; el MILP brilla cuando la estructura lineal/poliédrica es fuerte y hay buenas cotas duales."
                : "Constraint programming (CP) is an alternative paradigm for combinatorial problems. Instead of casting everything as linear inequalities over reals and relaxing, CP works with finite-domain variables and high-level, highly expressive constraints — including global constraints such as all-different, cumulative, or no-overlap that encapsulate integer combinatorial structure in one stroke. The engine alternates propagation (pruning from each variable's domain every value no solution can take) and search (tentatively fixing a variable and propagating again), backtracking on failure. Versus MILP, CP shines when the problem is heavily combinatorial with rigid logical/disjunctive constraints (scheduling, sequencing), where the LP relaxation is weak; MILP shines when the linear/polyhedral structure is strong and good dual bounds exist."}
            </p>
            <p>
              {es
                ? "El job-shop es el caso de prueba canónico de la CP. Hay un conjunto de trabajos; cada trabajo es una secuencia ordenada de operaciones, y cada operación necesita una máquina concreta durante un tiempo fijo. Dos restricciones lo definen: precedencia (las operaciones de un trabajo corren en orden — la k-ésima no empieza antes de que termine la (k−1)-ésima) y recurso disyuntivo (una máquina hace una sola operación a la vez — dos operaciones en la misma máquina no se solapan). El objetivo es minimizar el makespan C_max, el instante en que termina la última operación de cualquier trabajo. La restricción de no solapamiento es la disyunción combinatoria dura: para cada par de operaciones en una máquina, una va antes que la otra, y elegir todas esas direcciones es lo que hace el problema NP-difícil."
                : "The job-shop is the canonical CP test case. There is a set of jobs; each job is an ordered sequence of operations, and each operation needs a specific machine for a fixed duration. Two constraints define it: precedence (a job's operations run in order — the k-th does not start before the (k−1)-th finishes) and the disjunctive resource (a machine does one operation at a time — two operations on the same machine must not overlap). The objective is to minimize the makespan C_max, the instant the last operation of any job finishes. The no-overlap constraint is the hard combinatorial disjunction: for every pair of operations on a machine, one precedes the other, and choosing all those orderings is what makes the problem NP-hard."}
            </p>
            <p>
              {es
                ? "S06 modela exactamente esto en CP-SAT (el solver de OR-Tools). Por cada operación crea una variable de inicio s y otra de fin e enlazadas por una variable de intervalo de duración d; las precedencias son s_{j,k} ≥ e_{j,k−1}; el recurso disyuntivo es add_no_overlap sobre todos los intervalos de cada máquina; el makespan es add_max_equality sobre los fines de los últimos pasos, y se minimiza. CP-SAT es un solver de SAT con aprendizaje de cláusulas perezoso (lazy clause generation): combina el retroceso dirigido por conflictos de los solvers SAT modernos con la propagación de la CP, aprendiendo cláusulas que evitan reexplorar regiones inviables. Esto le permite no solo encontrar la mejor solución sino demostrar su optimalidad. El banco clásico Fisher–Thompson ft06 (6 trabajos × 6 máquinas, 1963) tiene óptimo demostrado de makespan 55 — el oráculo de validación que S06 reproduce."
                : "S06 models exactly this in CP-SAT (the OR-Tools solver). For each operation it creates a start variable s and an end variable e bound by an interval variable of duration d; precedences are s_{j,k} ≥ e_{j,k−1}; the disjunctive resource is add_no_overlap over all of a machine's intervals; the makespan is add_max_equality over the last operations' ends, and it is minimized. CP-SAT is a SAT solver with lazy clause generation: it fuses the conflict-driven backtracking of modern SAT solvers with CP propagation, learning clauses that avoid re-exploring infeasible regions. This lets it not merely find the best solution but prove its optimality. The classic Fisher–Thompson ft06 benchmark (6 jobs × 6 machines, 1963) has a proven optimal makespan of 55 — the validation oracle S06 reproduces."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Determinismo: duraciones fijas, máquinas siempre disponibles, sin averías ni preparaciones. S06 siembra las instancias y corre CP-SAT con un trabajador y semilla fija — el trazo es replicable byte a byte."
                  : "Determinism: fixed durations, machines always available, no breakdowns or setups. S06 seeds instances and runs CP-SAT single-worker with a fixed seed — the trace is byte-for-byte reproducible.",
                es
                  ? "No apropiación: una vez iniciada, una operación corre hasta terminar (la no-overlap de S06 lo asume); el job-shop apropiativo es un modelo distinto."
                  : "Non-preemption: once started, an operation runs to completion (S06's no-overlap assumes this); preemptive job-shop is a different model.",
                es
                  ? "Optimalidad demostrable pero no garantizada en cualquier plazo: CP-SAT corre con límite de tiempo (10 s en S06). En instancias mayores puede devolver FEASIBLE (factible, no probado óptimo) — el KPI optimal lo distingue."
                  : "Provable but not time-guaranteed optimality: CP-SAT runs under a time limit (10 s in S06). On larger instances it may return FEASIBLE (feasible, not proven optimal) — the optimal KPI flags which.",
                es
                  ? "El makespan es uno de varios objetivos posibles (también: tardanza total, makespan ponderado); cambiar el objetivo cambia la solución óptima aunque las restricciones sean idénticas."
                  : "Makespan is one of several possible objectives (also: total tardiness, weighted completion); changing the objective changes the optimum even with identical constraints.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`s_{j,k}\ \ge\ e_{j,k-1}\quad(\text{precedence}),\qquad e_{j,k}=s_{j,k}+d_{j,k}\quad(\text{interval}).`}
            caption={es ? "Precedencia: la operación k de un trabajo no empieza antes de terminar la k−1." : "Precedence: a job's operation k does not start before operation k−1 ends."}
          />
          <Equation
            tex={String.raw`\text{no-overlap}_m:\quad \forall\, (j,k)\ne(j',k')\ \text{on machine } m:\ \ e_{j,k}\le s_{j',k'}\ \ \vee\ \ e_{j',k'}\le s_{j,k}.`}
            caption={es ? "Recurso disyuntivo: dos operaciones de una misma máquina no se solapan." : "Disjunctive resource: two operations on one machine do not overlap."}
          />
          <Equation
            tex={String.raw`\min\ C_{\max}\quad\text{s.t.}\quad C_{\max}=\max_{j}\,e_{j,\,|J_j|-1},\ \ \text{precedence}\ \wedge\ \text{no-overlap}_m\ \forall m.`}
            caption={es ? "El modelo job-shop: minimizar el makespan sujeto a precedencia y no solapamiento." : "The job-shop model: minimize makespan subject to precedence and no-overlap."}
          />
          <Equation
            tex={String.raw`\textbf{ft06}\ (6\times 6,\ \text{Fisher--Thompson 1963}):\qquad C_{\max}^{\,*}=55\ \ (\text{proven optimal}).`}
            caption={es ? "El banco ft06: óptimo demostrado de 55 — el oráculo de S06." : "The ft06 benchmark: proven optimum 55 — the S06 oracle."}
          />

          <Callout variant="strong" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "S06 es la cara de optimización pura del laboratorio (frente a los simuladores estocásticos). Como CP-SAT es código nativo, el escenario se precalcula y el trazo comprometido es el calendario óptimo, dibujado como diagrama de Gantt. Reproducir ft06=55 es la prueba de que el solver y la canalización de trazos son correctos."
                : "S06 is the lab's pure-optimization face (versus the stochastic simulators). Because CP-SAT is native code, the scenario is precomputed and the committed trace is the optimal schedule, drawn as a Gantt chart. Reproducing ft06=55 is the proof that the solver and the trace pipeline are correct."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 640 280"
              role="img"
              aria-label={es ? "Diagrama de Gantt esquemático de un job-shop con makespan C_max." : "Schematic job-shop Gantt chart with makespan C_max."}
            >
              <text x="320" y="22" textAnchor="middle" fill="var(--color-fg)" fontSize="13">
                {es ? "Job-shop: operaciones por máquina, sin solapamiento, minimizando C_max" : "Job-shop: operations per machine, no overlap, minimizing C_max"}
              </text>
              {/* Axes */}
              <line x1="80" y1="60" x2="80" y2="240" stroke="var(--color-fg)" strokeWidth="1.5" />
              <line x1="80" y1="240" x2="600" y2="240" stroke="var(--color-fg)" strokeWidth="1.5" />
              <text x="340" y="266" textAnchor="middle" fill="var(--color-fg)" fontSize="12">{es ? "tiempo" : "time"}</text>
              {/* Machine rows */}
              {[
                { y: 76, l: "M1" },
                { y: 116, l: "M2" },
                { y: 156, l: "M3" },
                { y: 196, l: "M4" },
              ].map((m, i) => (
                <text key={`mlab-${i}`} x="68" y={m.y + 18} textAnchor="end" fill="var(--color-fg-faint)" fontSize="11">{m.l}</text>
              ))}
              {/* Operation bars: {row y, x, w, jobcolor} — three jobs across four machines */}
              {[
                { y: 76, x: 90, w: 70, c: "var(--color-accent)", t: "J1" },
                { y: 76, x: 300, w: 90, c: "var(--color-magenta)", t: "J2" },
                { y: 116, x: 170, w: 60, c: "var(--color-accent)", t: "J1" },
                { y: 116, x: 90, w: 70, c: "var(--color-good)", t: "J3" },
                { y: 156, x: 240, w: 80, c: "var(--color-accent)", t: "J1" },
                { y: 156, x: 170, w: 60, c: "var(--color-magenta)", t: "J2" },
                { y: 196, x: 330, w: 70, c: "var(--color-good)", t: "J3" },
                { y: 196, x: 410, w: 60, c: "var(--color-accent)", t: "J1" },
              ].map((b, i) => (
                <g key={`op-${i}`}>
                  <rect x={b.x} y={b.y} width={b.w} height="26" rx="4" fill={b.c} stroke="var(--color-fg)" strokeWidth="1" opacity="0.85" />
                  <text x={b.x + b.w / 2} y={b.y + 18} textAnchor="middle" fill="var(--color-bg)" fontSize="11">{b.t}</text>
                </g>
              ))}
              {/* Makespan marker */}
              <line x1="470" y1="60" x2="470" y2="248" stroke="var(--color-warn)" strokeWidth="1.5" strokeDasharray="5 4" />
              <text x="470" y="54" textAnchor="middle" fill="var(--color-warn)" fontSize="12">C_max</text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Gantt esquemático: cada barra es una operación en su máquina; las operaciones de un trabajo (mismo color) respetan precedencia y ninguna máquina solapa dos barras. C_max es el extremo derecho — la cantidad que CP-SAT minimiza."
                : "Schematic Gantt: each bar is an operation on its machine; a job's operations (same color) respect precedence and no machine overlaps two bars. C_max is the right edge — the quantity CP-SAT minimizes."}
            </figcaption>
          </figure>

          <Refs ids={["fisher1963", "ohrimenko2009", "rossi2006", "rossit2019", "ortools"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "shortest",
      label: es ? "Caminos mínimos y rutas graduadas" : "Shortest paths & graded routing",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "El problema del camino más corto pide la ruta de mínimo costo entre dos nodos de un grafo con pesos en las aristas. El algoritmo de Dijkstra (1959) lo resuelve cuando todos los pesos son no negativos. Es un algoritmo de fijación de etiquetas (label-setting): mantiene una distancia provisional a cada nodo, extrae repetidamente el nodo no visitado de menor distancia, lo declara definitivo y relaja sus aristas salientes (mejora la distancia de cada vecino si pasar por el nodo recién fijado es más barato). La corrección descansa en una invariante codiciosa: como los pesos son no negativos, cuando un nodo se extrae con la mínima distancia provisional, ningún camino posterior puede mejorarla — el primer arribo a un nodo por orden de distancia es el óptimo. Con un montículo binario el costo es O((V+E) log V)."
                : "The shortest-path problem asks for the minimum-cost route between two nodes of a weighted graph. Dijkstra's algorithm (1959) solves it when all weights are non-negative. It is a label-setting algorithm: it keeps a tentative distance to each node, repeatedly extracts the unvisited node of smallest distance, declares it final, and relaxes its outgoing edges (improving each neighbour's distance if routing through the just-settled node is cheaper). Correctness rests on a greedy invariant: because weights are non-negative, when a node is extracted with the minimum tentative distance no later path can improve it — the first arrival at a node in distance order is optimal. With a binary heap the cost is O((V+E) log V)."}
            </p>
            <p>
              {es
                ? "SimLab corre Dijkstra sobre una red sintética de cuadrícula de cruces (_geo.py): nodos en una grilla, aristas a los vecinos ortogonales, con un campo de elevación superpuesto. El paso clave es la función de costo enchufable. Para un viaje vacío el costo es la mera distancia euclídea entre cruces. Para un haul cargado el costo penaliza la subida: cost(a→b) = dist(a,b)·(1 + grade·max(0,Δelev)), donde Δelev = elev(b)−elev(a) y grade es la penalización de pendiente. El max(0,·) es esencial: solo trepar cuesta de más; bajar o ir en llano cuesta la distancia base. Esto rompe la simetría — subir un cerro es caro, bajarlo no — de modo que la ruta óptima de ida (cargado) puede diferir de la de vuelta (vacío)."
                : "SimLab runs Dijkstra on a synthetic grid-of-junctions network (_geo.py): nodes on a lattice, edges to orthogonal neighbours, with an overlaid elevation field. The key step is the pluggable cost function. For an empty trip the cost is plain Euclidean distance between junctions. For a loaded haul the cost penalizes climbing: cost(a→b) = dist(a,b)·(1 + grade·max(0,Δelev)), where Δelev = elev(b)−elev(a) and grade is the grade penalty. The max(0,·) is essential: only ascent costs extra; descent or flat travel costs the base distance. This breaks symmetry — going up a hill is dear, going down is not — so the optimal outbound route (loaded) can differ from the return route (empty)."}
            </p>
            <p>
              {es
                ? "S07 explota esto para un genuino salto de ruta. Una cuesta (un cordón de terreno alto) separa el punto de carga del botadero, con un paso bajo a un lado. Ir recto sobre la cresta es corto pero trepa mucho; desviarse al paso es más largo pero casi plano. Como solo se penaliza la subida, la ruta óptima cambia bruscamente en una pendiente crítica g*. Igualando el costo de la ruta directa (longitud L_dir, trepada C_dir) con el de la desviación (L_det, C_det) y despejando se obtiene g* = ΔL/ΔC = (L_det−L_dir)/(C_dir−C_det): por debajo de g* gana la subida directa; por encima, la ruta salta al paso. Es un cambio de óptimo discreto provocado por un parámetro continuo, y S07 lo barre por ambos lados (y muestra que un muro en la línea directa reencamina el haul aun a pendiente baja, independientemente de g*)."
                : "S07 exploits this for a genuine route switch. A ridge of high ground separates the load point from the dump, with a low pass to one side. Going straight over the crest is short but climbs hard; detouring to the pass is longer but nearly flat. Because only climbing is penalized, the optimal route switches sharply at a critical grade g*. Equating the cost of the direct route (length L_dir, climb C_dir) with the detour (L_det, C_det) and solving gives g* = ΔL/ΔC = (L_det−L_dir)/(C_dir−C_det): below g* the direct climb wins; above it, the route flips to the pass. It is a discrete change of optimum driven by a continuous parameter, and S07 sweeps across it from both sides (and shows that a wall on the direct line reroutes the haul even at low grade, independently of g*)."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Dijkstra exige pesos no negativos. El costo graduado dist·(1+grade·max(0,Δelev)) es siempre ≥0 por construcción, así que Dijkstra es válido; con pesos negativos haría falta Bellman–Ford."
                  : "Dijkstra requires non-negative weights. The graded cost dist·(1+grade·max(0,Δelev)) is always ≥0 by construction, so Dijkstra is valid; negative weights would need Bellman–Ford.",
                es
                  ? "El grafo de _geo.py es una grilla sintética (sin OSM ni mapas reales). Las celdas bloqueadas (barreras) se eliminan del grafo, lo que puede desconectarlo — S07 verifica que el botadero siga alcanzable."
                  : "The _geo.py graph is a synthetic grid (no OSM, no real maps). Blocked cells (barriers) are removed from the graph, which can disconnect it — S07 checks the dump stays reachable.",
                es
                  ? "El salto de ruta en g* supone exactamente dos rutas candidatas competidoras (directa vs. paso); con terreno multipaso pueden coexistir varios saltos y la fórmula g*=ΔL/ΔC aplica a cada par adyacente."
                  : "The route switch at g* assumes exactly two competing candidate routes (direct vs. pass); with multi-pass terrain several switches can coexist, and g*=ΔL/ΔC applies pairwise.",
                es
                  ? "El modelo penaliza la pendiente, no la velocidad ni el consumo reales del camión; es una abstracción del costo de acarreo, no un modelo físico de tren motriz."
                  : "The model penalizes grade, not the truck's real speed or fuel burn; it is an abstraction of haul cost, not a physical powertrain model.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`d(v)\ \leftarrow\ \min\bigl(d(v),\ d(u)+w(u,v)\bigr)\quad\text{for each edge }(u,v)\ \text{when }u\text{ is settled (Dijkstra relaxation).}`}
            caption={es ? "Relajación de Dijkstra: fijar el nodo de menor etiqueta y mejorar a sus vecinos." : "Dijkstra relaxation: settle the smallest-label node and improve its neighbours."}
          />
          <Equation
            tex={String.raw`\text{non-negative weights}\ \Rightarrow\ \text{first settle is optimal};\qquad \text{cost}=O\bigl((V+E)\log V\bigr)\ \text{(binary heap).}`}
            caption={es ? "Corrección codiciosa y complejidad de Dijkstra." : "Dijkstra's greedy correctness and complexity."}
          />
          <Equation
            tex={String.raw`\operatorname{cost}(a\to b)=\operatorname{dist}(a,b)\,\bigl(1+\text{grade}\cdot\max(0,\ \Delta\text{elev})\bigr),\qquad \Delta\text{elev}=\text{elev}(b)-\text{elev}(a).`}
            caption={es ? "Costo de arista graduado: solo la subida penaliza (S07/S11, _geo.py)." : "Graded edge cost: only ascent is penalized (S07/S11, _geo.py)."}
          />
          <Equation
            tex={String.raw`g^{*}=\frac{\Delta L}{\Delta C}=\frac{L_{\text{det}}-L_{\text{dir}}}{C_{\text{dir}}-C_{\text{det}}}\quad:\quad
g<g^{*}\Rightarrow\text{direct},\ \ g>g^{*}\Rightarrow\text{pass}.`}
            caption={es ? "La pendiente crítica donde la ruta óptima salta directo↔paso." : "The critical grade where the optimal route switches direct↔pass."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "Dijkstra es el paso de optimización (el optimize de optimize-then-simulate) en S07, S08 y S11: resuelve exactamente cada haul/leg cargado o vacío. La pendiente crítica g* es un KPI analítico (switch_grade_est) que S07 reporta junto a la ruta que la variante realmente tomó, mostrando teoría y simulación lado a lado."
                : "Dijkstra is the optimize step (the optimize of optimize-then-simulate) in S07, S08 and S11: it solves each loaded/empty haul leg exactly. The critical grade g* is an analytic KPI (switch_grade_est) that S07 reports next to the route the variant actually took, showing theory and simulation side by side."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 640 300"
              role="img"
              aria-label={es ? "Cordón con un paso: ruta directa sobre la cresta vs. desvío plano por el paso." : "Ridge with a pass: direct over the crest vs. flat detour via the pass."}
            >
              <text x="320" y="22" textAnchor="middle" fill="var(--color-fg)" fontSize="13">
                {es ? "Salto de ruta en g* = ΔL/ΔC: directo (corto, trepa) vs. paso (largo, plano)" : "Route switch at g* = ΔL/ΔC: direct (short, climbs) vs. pass (long, flat)"}
              </text>
              {/* ridge contour band */}
              <path d="M40,150 Q200,60 360,150 Q500,220 600,150" stroke="var(--color-border)" strokeWidth="1" fill="none" />
              <path d="M40,170 Q200,90 360,170 Q500,235 600,170" stroke="var(--color-border)" strokeWidth="1" fill="none" />
              <text x="200" y="78" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "cresta (alto)" : "crest (high)"}</text>
              {/* low pass notch */}
              <text x="120" y="150" textAnchor="middle" fill="var(--color-good)" fontSize="11">{es ? "paso (bajo)" : "pass (low)"}</text>
              {/* Load and dump */}
              <circle cx="360" cy="250" r="16" fill="var(--color-good)" stroke="var(--color-fg)" strokeWidth="1.5" />
              <text x="360" y="282" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "carguío" : "load"}</text>
              <circle cx="360" cy="50" r="16" fill="var(--color-warn)" stroke="var(--color-fg)" strokeWidth="1.5" />
              <text x="360" y="38" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "botadero" : "dump"}</text>
              {/* Direct route */}
              <path d="M360,234 L360,66" stroke="var(--color-magenta)" strokeWidth="2.5" fill="none" strokeDasharray="2 0" />
              <text x="372" y="150" textAnchor="start" fill="var(--color-magenta)" fontSize="11">{es ? "directo: corto, trepa" : "direct: short, climbs"}</text>
              {/* Detour via pass */}
              <path d="M360,234 L120,150 L120,150 L360,66" stroke="var(--color-accent)" strokeWidth="2.5" fill="none" />
              <text x="140" y="200" textAnchor="middle" fill="var(--color-accent)" fontSize="11">{es ? "paso: largo, plano" : "pass: long, flat"}</text>
              <text x="320" y="296" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">
                {es ? "solo penaliza la subida ⇒ el óptimo salta en g*" : "only ascent is penalized ⇒ the optimum switches at g*"}
              </text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "El acarreo cargado elige entre la subida directa corta y el desvío plano por el paso; como solo trepar penaliza, la ruta óptima salta en g*=ΔL/ΔC (S07)."
                : "The loaded haul chooses between the short direct climb and the flat detour via the pass; since only ascent is penalized, the optimal route switches at g*=ΔL/ΔC (S07)."}
            </figcaption>
          </figure>

          <Refs ids={["dijkstra1959", "papadimitriou1998"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "vrp",
      label: es ? "Ruteo de vehículos (VRP)" : "Vehicle routing (VRP)",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "El ruteo de vehículos es una familia jerárquica de problemas. En la base está el problema del viajante (TSP): visitar un conjunto de nodos exactamente una vez y volver al origen minimizando la distancia total — el arquetipo NP-difícil de la optimización combinatoria. El VRP con capacidad (CVRP) lo generaliza a K vehículos que parten de un depósito común: cada cliente tiene una demanda, cada vehículo una capacidad, y hay que partir los clientes en rutas (una por vehículo) que respeten la capacidad y minimicen la distancia. Introducido por Dantzig y Ramser en 1959 como el “problema de despacho de camiones”, es el caballo de batalla de la logística. Añadiendo ventanas de tiempo (cada cliente debe atenderse en un intervalo) se obtiene el VRPTW, y así sucesivamente — una jerarquía de restricciones cada vez más realistas sobre el mismo esqueleto."
                : "Vehicle routing is a hierarchical family of problems. At the base is the Traveling Salesman Problem (TSP): visit a set of nodes exactly once and return to the start, minimizing total distance — the archetypal NP-hard combinatorial-optimization problem. The Capacitated VRP (CVRP) generalizes it to K vehicles leaving a common depot: each customer has a demand, each vehicle a capacity, and one must partition customers into routes (one per vehicle) that respect capacity and minimize distance. Introduced by Dantzig & Ramser in 1959 as the “truck dispatching problem,” it is the workhorse of logistics. Adding time windows (each customer must be served in an interval) gives the VRPTW, and so on — a hierarchy of ever more realistic constraints over the same skeleton."}
            </p>
            <p>
              {es
                ? "La formulación MILP de flujo de arcos del CVRP usa variables binarias x_{ij}∈{0,1} (el arco i→j se recorre o no). Tres clases de restricciones lo definen: grado (cada cliente tiene exactamente una entrada y una salida), capacidad (la demanda total de cada ruta no excede la capacidad del vehículo) y eliminación de subrutas (impedir ciclos desconectados que no pasen por el depósito). Esta última es la difícil: el número de subrutas posibles es exponencial, así que se añaden bajo demanda (lazy) o mediante restricciones de capacidad redondeada. El objetivo natural es la distancia total Σ d_{ij} x_{ij}; pero minimizar solo eso tiende a dejar vehículos ociosos y a producir una ruta muy larga y varias cortas. Por eso a menudo se añade un objetivo de makespan — minimizar la ruta más larga — para equilibrar la carga entre vehículos."
                : "The CVRP arc-flow MILP uses binary variables x_{ij}∈{0,1} (arc i→j is traversed or not). Three constraint classes define it: degree (each customer has exactly one in-arc and one out-arc), capacity (each route's total demand does not exceed the vehicle capacity), and subtour elimination (forbid disconnected cycles that avoid the depot). The last is the hard one: the number of possible subtours is exponential, so they are added on demand (lazily) or via rounded-capacity constraints. The natural objective is total distance Σ d_{ij} x_{ij}; but minimizing that alone tends to leave vehicles idle and produce one very long route plus several short ones. Hence a makespan objective — minimize the longest route — is often added to balance load across vehicles."}
            </p>
            <p>
              {es
                ? "S08 modela exactamente esto con el solver de rutas de OR-Tools. Los clientes están en una grilla; la matriz de distancias D[a][b] son caminos mínimos de Dijkstra entre nodos especiales (depósito + clientes), escalados a enteros. Una dimensión de capacidad (AddDimensionWithVehicleCapacity) impone el límite por vehículo; una dimensión de distancia con un coeficiente de costo de span global (SetGlobalSpanCostCoefficient) penaliza la ruta más larga, lo que obliga a usar los vehículos añadidos y revela el compromiso distancia-total vs. ruta-más-larga. El VRP es demasiado grande para resolverse de forma exacta a escala, así que OR-Tools usa metaheurísticas: una solución inicial codiciosa (PATH_CHEAPEST_ARC) refinada por búsqueda local guiada (GUIDED_LOCAL_SEARCH), que penaliza progresivamente los rasgos que aparecen en óptimos locales para escapar de ellos. Es un solver de tipo anytime: corre con límite de tiempo y devuelve la mejor solución hallada."
                : "S08 models exactly this with the OR-Tools routing solver. Customers sit on a grid; the distance matrix D[a][b] holds Dijkstra shortest paths between special nodes (depot + customers), scaled to integers. A capacity dimension (AddDimensionWithVehicleCapacity) imposes the per-vehicle limit; a distance dimension with a global-span cost coefficient (SetGlobalSpanCostCoefficient) penalizes the longest route, which forces added vehicles to actually be used and surfaces the total-distance vs. longest-route trade-off. The VRP is too large to solve exactly at scale, so OR-Tools uses metaheuristics: a greedy initial solution (PATH_CHEAPEST_ARC) refined by guided local search (GUIDED_LOCAL_SEARCH), which progressively penalizes features appearing in local optima to escape them. It is an anytime solver: it runs under a time limit and returns the best solution found."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "Las metaheurísticas no garantizan optimalidad: S08 reporta la mejor ruta hallada en el límite de tiempo (3 s). En instancias pequeñas suele ser óptima; en grandes, casi óptima sin prueba."
                  : "Metaheuristics do not guarantee optimality: S08 reports the best route found within the time limit (3 s). On small instances it is usually optimal; on large ones, near-optimal without proof.",
                es
                  ? "El objetivo combinado (distancia + span global) es una elección de diseño: cambiar el coeficiente del span reequilibra entre distancia total mínima y rutas parejas; no hay un único “correcto”."
                  : "The combined objective (distance + global span) is a design choice: changing the span coefficient retunes the balance between minimum total distance and even routes; there is no single “right” one.",
                es
                  ? "Las distancias son caminos mínimos en la grilla sintética, simétricos aquí; el VRP real puede ser asimétrico (calles de un sentido) y dinámico (tráfico variable), no cubierto."
                  : "Distances are shortest paths on the synthetic grid, symmetric here; real VRP can be asymmetric (one-way streets) and dynamic (varying traffic), not covered.",
                es
                  ? "S08 es optimización pura (no estocástica): instancias sembradas, solver de un hilo con límite de tiempo, trazo precalculado que la web reproduce como vehículos recorriendo la red."
                  : "S08 is pure optimization (not stochastic): seeded instances, single-thread solver with a time limit, a precomputed trace the web replays as vehicles driving the network.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`\min\ \sum_{i,j} d_{ij}\,x_{ij}\quad\text{s.t.}\quad
\sum_{j} x_{ij}=1\ \forall i,\ \ \sum_{i} x_{ij}=1\ \forall j\quad(\text{degree}),\qquad x_{ij}\in\{0,1\}.`}
            caption={es ? "Flujo de arcos del VRP: variables binarias y restricciones de grado." : "VRP arc-flow: binary variables and degree constraints."}
          />
          <Equation
            tex={String.raw`\sum_{i\in S}\sum_{j\notin S} x_{ij}\ \ge\ \Bigl\lceil \tfrac{\sum_{i\in S} q_i}{Q}\Bigr\rceil\quad\forall\, S\subseteq\text{customers}\quad(\text{rounded-capacity / subtour elimination}).`}
            caption={es ? "Eliminación de subrutas con capacidad redondeada (Q = capacidad, q = demanda)." : "Rounded-capacity subtour elimination (Q = capacity, q = demand)."}
          />
          <Equation
            tex={String.raw`\underbrace{\min\ \sum_{k}\sum_{i,j} d_{ij}\,x_{ij}^{k}}_{\text{total distance}}\ +\ \alpha\,\underbrace{\max_{k}\ \mathrm{len}(\text{route}_k)}_{\text{makespan / global span}}\quad(\alpha=\text{span coefficient}).`}
            caption={es ? "Objetivo combinado: distancia total más penalización de la ruta más larga." : "Combined objective: total distance plus a longest-route penalty."}
          />

          <Callout variant="strong" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "S08 es el escenario VRP del laboratorio. Sus KPIs (total_distance, vehicles_used, max_route_time) hacen visible el compromiso: las variantes “más vehículos” acortan la ruta más larga pero suben la distancia total, justo lo que el coeficiente de span global controla. El trazo óptimo se reproduce como vehículos coloreados recorriendo la red."
                : "S08 is the lab's VRP scenario. Its KPIs (total_distance, vehicles_used, max_route_time) make the trade-off visible: the “more vehicles” variants shorten the longest route but raise total distance — exactly what the global-span coefficient controls. The optimal trace replays as colored vehicles driving the network."}
            </p>
          </Callout>

          <Refs ids={["dantzig1959vrp", "tothvigo2014", "applegate2006", "voudouris1999", "ortools"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "matchfactor",
      label: es ? "Acarreo minero y match factor" : "Mine haulage & the match factor",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "El acarreo minero une optimización y simulación en un solo escenario. Primero se optimiza (Dijkstra para la ruta, LP para la mezcla); luego se simula la ejecución con una flota fija. La clave es que el ciclo del camión es una cola de fuente finita cerrada (closed finite-source), no la cola de fuente infinita de la teoría clásica. Una flota fija de N camiones recircula entre el carguío y el botadero: un camión carga, hace el haul, descarga y vuelve — para siempre. El cargador compartido es el recurso vinculante. Como la “población llamante” es la propia flota finita, este es el modelo de reparación de máquinas (machine-repair), una cola M/M/1//N: cuando hay más camiones en cola por el cargador, quedan menos circulando, así que la tasa de llegadas al cargador cae con la congestión — un bucle de realimentación negativa ausente en M/M/c. El rendimiento se satura en la tasa del cargador por más camiones que se añadan."
                : "Mine haulage fuses optimization and simulation in one scenario. First it optimizes (Dijkstra for the route, LP for the blend); then it simulates execution with a fixed fleet. The crux is that the truck cycle is a closed finite-source queue, not the infinite-source queue of classical theory. A fixed fleet of N trucks recirculates between the load point and the dump: a truck loads, hauls, tips, returns — forever. The shared loader is the binding resource. Because the “calling population” is the finite fleet itself, this is the machine-repair model, an M/M/1//N queue: when more trucks are queued at the loader, fewer are circulating, so the arrival rate at the loader falls with congestion — a negative-feedback loop absent in M/M/c. Throughput saturates at the loader rate no matter how many trucks are added."}
            </p>
            <p>
              {es
                ? "La regla de oro para dimensionar la flota es el match factor (Morgan y Peterson 1968). Es el cociente entre la tasa de llegada de camiones al cargador y la tasa de servicio del cargador: MF = (N·t_L)/(c·t_cycle), con N camiones, c cargadores, t_L el tiempo de carga y t_cycle el tiempo de ciclo de un camión (carga + haul + descarga + regreso). MF=1 es el balance perfecto: los camiones llegan justo cuando el cargador queda libre, sin colas y sin que el cargador se desocupe. MF<1 (sub-equipado) deja al cargador ocioso, limitado por la flota — añadir un camión sube el rendimiento casi linealmente. MF>1 (sobre-equipado) hace que los camiones esperen en cola; el rendimiento ya está saturado en la tasa del cargador, así que el camión extra apenas aporta toneladas y solo engorda la cola. S07 barre N con un cargador fijo para que el usuario vea cómo la espera por carga crece y el rendimiento se aplana al cruzar MF=1."
                : "The rule of thumb for sizing the fleet is the match factor (Morgan & Peterson 1968). It is the ratio of the trucks' arrival rate at the loader to the loader's service rate: MF = (N·t_L)/(c·t_cycle), with N trucks, c loaders, t_L the load time, and t_cycle one truck's cycle time (load + haul + tip + return). MF=1 is the perfect balance: trucks arrive just as the loader frees up — no queueing, no idle loader. MF<1 (under-trucked) leaves the loader idle, fleet-limited — adding a truck raises throughput almost linearly. MF>1 (over-trucked) makes trucks queue; throughput is already saturated at the loader rate, so the extra truck adds almost no tonnes and merely lengthens the queue. S07 sweeps N at a fixed loader so the user watches the loader-wait-per-load grow and throughput flatten as MF crosses 1."}
            </p>
            <p>
              {es
                ? "S11 lleva esto al nivel de plan-vs-realidad. El plan de mezcla LP (Sub-pestaña 1) calcula el flujo óptimo de toneladas desde cada fase para clavar la ley de la planta. Pero la ejecución usa una flota fija que despacha al flujo más atrasado. La fase rica está lejos, así que sus hauls son largos; una flota sub-equipada no entrega su tonelaje planificado en el turno, y la primera víctima es la ley: la mezcla lograda se desliza por debajo de la meta porque falta justamente la fase rica y lejana. Un plan óptimo es necesario pero no suficiente — lo degrada la flota fija, y la ley es lo primero que cede. Es exactamente la lección que SimLab quiere mostrar: optimizar y simular son dos pasos distintos, y la brecha entre el plan y lo realizado es donde vive la ingeniería de operaciones."
                : "S11 raises this to the plan-vs-reality level. The LP blend plan (Sub-tab 1) computes the optimal flow of tonnes from each phase to hit the plant grade. But execution uses a fixed fleet that dispatches to whichever flow is furthest behind. The rich phase is far away, so its hauls are long; an under-sized fleet cannot deliver its planned tonnage within the shift, and the first casualty is grade: the achieved blend slips below target because precisely the far, high-grade phase is short. An optimal plan is necessary but not sufficient — a fixed fleet degrades it, and grade slips first. This is exactly the lesson SimLab is built to show: optimizing and simulating are two distinct steps, and the gap between the plan and the realized result is where operations engineering lives."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "La cola M/M/1//N supone tiempos exponenciales para una expresión cerrada; S07/S11 simulan con tiempos de viaje deterministas derivados de la geometría, así que el modelo de fuente finita es el marco conceptual, no la distribución exacta simulada."
                  : "The M/M/1//N queue assumes exponential times for a closed-form expression; S07/S11 simulate with deterministic geometry-derived travel times, so the finite-source model is the conceptual frame, not the exact simulated distribution.",
                es
                  ? "El match factor es un cociente de tiempos medios — una guía de dimensionamiento, no una garantía de rendimiento; ignora la variabilidad que hace que MF≈1 aún tenga algo de cola (la rodilla de Kingman aplica)."
                  : "The match factor is a ratio of mean times — a sizing guide, not a throughput guarantee; it ignores the variability that makes MF≈1 still queue a little (Kingman's knee applies).",
                es
                  ? "S11 asume suministro de fases generoso y dispatch al flujo más atrasado; otras políticas de despacho darían otra adherencia al plan con la misma flota."
                  : "S11 assumes generous phase supply and dispatch-to-furthest-behind; other dispatch policies would give different plan adherence with the same fleet.",
                es
                  ? "“La ley se desliza primero” es un resultado de esta geometría (fase rica lejana); reubicar las fases cambiaría qué restricción cede antes."
                  : "“Grade slips first” is a result of this geometry (rich phase far away); relocating the phases would change which constraint gives first.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`\text{closed finite-source: } M/M/1//N\ \ (\text{machine-repair});\qquad \lambda_n=(N-n)\lambda\ \ \text{(arrival rate falls with congestion).}`}
            caption={es ? "El ciclo del camión como cola de fuente finita: la tasa de llegadas baja con la cola." : "The truck cycle as a finite-source queue: arrival rate falls with the queue."}
          />
          <Equation
            tex={String.raw`\mathrm{MF}=\frac{N\,t_L}{c\,t_{\text{cycle}}}\quad:\quad
\mathrm{MF}<1\ \text{under-trucked},\ \ \mathrm{MF}=1\ \text{balanced},\ \ \mathrm{MF}>1\ \text{over-trucked}.`}
            caption={es ? "El match factor: cociente de llegada de camiones a servicio del cargador." : "The match factor: ratio of truck arrival rate to loader service rate."}
          />
          <Equation
            tex={String.raw`\text{throughput}\ \xrightarrow[\ N\to\infty\ ]{}\ \frac{c}{t_L}\quad(\text{saturates at the loader rate});\qquad
\text{plan } x_i^{*}\ \xrightarrow[\text{fixed fleet}]{}\ \text{achieved} < x_i^{*}\ \text{(grade slips).}`}
            caption={es ? "El rendimiento se satura en la tasa del cargador; la flota fija degrada el plan." : "Throughput saturates at the loader rate; the fixed fleet degrades the plan."}
          />

          <Callout variant="strong" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "S07 enseña el match factor barriendo la flota contra un cargador fijo (KPIs throughput_per_hr, loader_wait_per_load). S11 enseña plan-vs-realidad: el KPI plan_adherence_pct y grade_dev muestran cómo una flota sub-equipada desliza la ley fuera de la banda. Juntos cierran el bucle optimize-then-simulate del laboratorio."
                : "S07 teaches the match factor by sweeping the fleet against a fixed loader (KPIs throughput_per_hr, loader_wait_per_load). S11 teaches plan-vs-reality: the plan_adherence_pct and grade_dev KPIs show how an under-trucked fleet slips grade out of band. Together they close the lab's optimize-then-simulate loop."}
            </p>
          </Callout>

          <figure className="figure">
            <svg
              className="fig-svg wide"
              viewBox="0 0 520 340"
              role="img"
              aria-label={es ? "Rendimiento frente al número de camiones: lineal por debajo de MF=1, saturado por encima." : "Throughput vs. number of trucks: linear below MF=1, saturated above."}
            >
              <text x="260" y="22" textAnchor="middle" fill="var(--color-fg)" fontSize="13">
                {es ? "Rendimiento vs. flota: limitado por flota (MF<1) ⟶ limitado por cargador (MF>1)" : "Throughput vs. fleet: fleet-limited (MF<1) ⟶ loader-limited (MF>1)"}
              </text>
              {/* Axes */}
              <line x1="60" y1="290" x2="480" y2="290" stroke="var(--color-fg)" strokeWidth="1.5" />
              <line x1="60" y1="290" x2="60" y2="40" stroke="var(--color-fg)" strokeWidth="1.5" />
              <text x="270" y="324" textAnchor="middle" fill="var(--color-fg)" fontSize="12">{es ? "N camiones" : "N trucks"}</text>
              <text x="26" y="165" textAnchor="middle" fill="var(--color-fg)" fontSize="12" transform="rotate(-90 26 165)">{es ? "rendimiento" : "throughput"}</text>
              {/* saturation ceiling */}
              <line x1="60" y1="90" x2="480" y2="90" stroke="var(--color-warn)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="430" y="84" textAnchor="middle" fill="var(--color-warn)" fontSize="11">{es ? "tasa cargador c/t_L" : "loader rate c/t_L"}</text>
              {/* curve: linear then saturating */}
              <path d="M60,290 L240,90 Q300,70 480,68" stroke="var(--color-accent)" strokeWidth="2.5" fill="none" />
              {/* MF=1 marker */}
              <line x1="240" y1="290" x2="240" y2="60" stroke="var(--color-fg-faint)" strokeWidth="1" strokeDasharray="3 3" />
              <text x="240" y="306" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">MF = 1</text>
              <text x="150" y="200" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "limitado por flota" : "fleet-limited"}</text>
              <text x="370" y="120" textAnchor="middle" fill="var(--color-fg-faint)" fontSize="11">{es ? "limitado por cargador" : "loader-limited"}</text>
            </svg>
            <figcaption className="fig-cap">
              {es
                ? "Por debajo de MF=1 cada camión añade rendimiento casi linealmente; por encima, el rendimiento satura en la tasa del cargador y el camión extra solo hace cola — la guía de dimensionamiento del match factor (S07)."
                : "Below MF=1 each truck adds throughput almost linearly; above it, throughput saturates at the loader rate and the extra truck merely queues — the match-factor sizing guide (S07)."}
            </figcaption>
          </figure>

          <Refs ids={["morgan1968", "burt2014", "grossharris2018", "ortools"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
    {
      id: "complexity",
      label: es ? "Exacto vs. heurístico; complejidad" : "Exact vs. heuristic; complexity",
      content: (
        <div className="th-block">
          <div className="prose">
            <p>
              {es
                ? "La teoría de la complejidad organiza cuándo un problema es tratable. La clase P contiene los problemas resolubles en tiempo polinómico (caminos mínimos por Dijkstra, LP, asignación TU); la clase NP contiene aquellos cuya solución se verifica en tiempo polinómico. Un problema es NP-difícil si es al menos tan duro como los más difíciles de NP, y NP-completo si además está en NP. El job-shop, el TSP y el VRP son NP-difíciles: no se conoce algoritmo de tiempo polinómico, y si existiera uno para cualquiera de ellos, existiría para todos (P=NP). En la práctica esto fija una frontera: por debajo de cierto tamaño, los métodos exactos (CP-SAT, MILP con branch-and-cut) resuelven y demuestran la optimalidad; por encima, el árbol de búsqueda explota y hay que recurrir a metaheurísticas."
                : "Complexity theory organizes when a problem is tractable. The class P contains problems solvable in polynomial time (shortest paths by Dijkstra, LP, TU assignment); the class NP contains those whose solution is verifiable in polynomial time. A problem is NP-hard if it is at least as hard as the hardest in NP, and NP-complete if it is also in NP. Job-shop, TSP, and VRP are NP-hard: no polynomial-time algorithm is known, and if one existed for any of them, one would exist for all (P=NP). In practice this draws a frontier: below a certain size, exact methods (CP-SAT, MILP with branch-and-cut) solve and prove optimality; above it, the search tree explodes and one falls back on metaheuristics."}
            </p>
            <p>
              {es
                ? "Los métodos exactos dan un certificado: branch-and-bound mantiene a la vez la mejor solución entera hallada (cota superior) y la mejor cota de relajación (cota inferior); la brecha de optimalidad entre ambas mide cuán lejos del óptimo podría estar la solución actual. Cuando la brecha llega a cero, la optimalidad está probada. Esto los hace solvers de tipo anytime: pueden interrumpirse con una solución factible y una garantía cuantificada. Las metaheurísticas (búsqueda local guiada, recocido simulado, algoritmos genéticos) renuncian a la prueba a cambio de escalar: exploran el espacio de soluciones con movimientos inteligentes y devuelven una solución muy buena sin saber cuán cerca del óptimo está. Para el VRP grande de S08 esto es indispensable — OR-Tools usa GUIDED_LOCAL_SEARCH bajo límite de tiempo justamente porque la enumeración exacta es inviable."
                : "Exact methods give a certificate: branch-and-bound keeps both the best integer solution found (an upper bound) and the best relaxation bound (a lower bound); the optimality gap between them measures how far from optimal the current solution might be. When the gap reaches zero, optimality is proven. This makes them anytime solvers: they can be interrupted with a feasible solution and a quantified guarantee. Metaheuristics (guided local search, simulated annealing, genetic algorithms) give up the proof in exchange for scaling: they explore the solution space with smart moves and return a very good solution without knowing how close to optimal it is. For the large S08 VRP this is indispensable — OR-Tools uses GUIDED_LOCAL_SEARCH under a time limit precisely because exact enumeration is infeasible."}
            </p>
            <p>
              {es
                ? "Esta dicotomía exacto-vs-heurístico tiene una consecuencia arquitectónica directa en SimLab: el modelo de dos carriles. Los escenarios cuyo solver es código nativo y no trivial (S06 CP-SAT, S08 routing, S11 LP+routing) no pueden correr en el navegador (no hay WebAssembly de OR-Tools en el carril en vivo) y, además, su resolución puede tardar segundos. Por eso se precalculan: el solver corre una vez de forma determinista (instancias sembradas, un hilo, semilla fija) y el trazo óptimo comprometido se reproduce en la web — Gantt para S06, vehículos recorriendo la red para S08/S11. Los escenarios de Python puro y estocásticos corren en el carril en vivo (Pyodide en el navegador). La frontera de complejidad de esta sub-pestaña es, literalmente, la frontera entre los dos carriles del laboratorio."
                : "This exact-vs-heuristic dichotomy has a direct architectural consequence in SimLab: the two-lane model. Scenarios whose solver is native, non-trivial code (S06 CP-SAT, S08 routing, S11 LP+routing) cannot run in the browser (there is no OR-Tools WebAssembly in the live lane) and, moreover, their solve can take seconds. So they are precomputed: the solver runs once deterministically (seeded instances, single thread, fixed seed) and the committed optimal trace replays on the web — Gantt for S06, vehicles driving the network for S08/S11. The pure-Python, stochastic scenarios run in the live lane (Pyodide in the browser). The complexity frontier of this sub-tab is, literally, the boundary between the lab's two lanes."}
            </p>
          </div>

          <div className="assume">
            <p className="assume-title">{es ? "Supuestos y límites" : "Assumptions & limits"}</p>
            <ul>
              {[
                es
                  ? "La NP-dureza es de peor caso: no impide que muchas instancias prácticas (incluidas las de SimLab) se resuelvan a optimalidad rápido. La intratabilidad teórica y la dificultad práctica no son lo mismo."
                  : "NP-hardness is worst-case: it does not prevent many practical instances (including SimLab's) from solving to optimality fast. Theoretical intractability and practical difficulty are not the same.",
                es
                  ? "P≠NP es una conjetura no demostrada; toda la frontera “exacto solo para pequeño” se apoya en ella, no en un teorema."
                  : "P≠NP is an unproven conjecture; the whole “exact only for small” frontier rests on it, not on a theorem.",
                es
                  ? "La brecha de optimalidad acota la solución del solver, no la calidad del modelo: un modelo equivocado puede resolverse a brecha cero y aun así no representar la operación real."
                  : "The optimality gap bounds the solver's solution, not the model's quality: a wrong model can solve to zero gap and still not represent the real operation.",
                es
                  ? "Las metaheurísticas son sensibles a parámetros (estrategia inicial, tipo de búsqueda local, límite de tiempo); cambiarlos cambia la solución, y dos corridas con distinta configuración no son comparables sin cuidado."
                  : "Metaheuristics are parameter-sensitive (initial strategy, local-search type, time limit); changing them changes the solution, and two runs under different settings are not comparable without care.",
              ].map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>

          <Equation
            tex={String.raw`\text{P}\subseteq\text{NP};\quad \text{NP-hard}\ \ge\ \text{NP};\qquad
\text{Dijkstra, LP, TU-assignment}\in\text{P},\quad \text{job-shop, TSP, VRP}\in\text{NP-hard}.`}
            caption={es ? "El mapa de complejidad: qué es tratable y qué es NP-difícil." : "The complexity map: what is tractable and what is NP-hard."}
          />
          <Equation
            tex={String.raw`\text{gap}=\frac{z_{\text{best}}-z_{\text{bound}}}{|z_{\text{best}}|}\ \xrightarrow{\ \text{branch-and-cut}\ }\ 0\ \ (\text{optimality proven}).`}
            caption={es ? "La brecha de optimalidad de un solver anytime: cero = óptimo demostrado." : "An anytime solver's optimality gap: zero = optimality proven."}
          />
          <Equation
            tex={String.raw`\boxed{\ \text{small}\ \Rightarrow\ \text{exact (CP-SAT / MILP), proven optimum}\quad\big|\quad \text{large}\ \Rightarrow\ \text{metaheuristic, anytime, no proof}\ }`}
            caption={es ? "La regla de decisión exacto-vs-heurístico que separa los dos carriles de SimLab." : "The exact-vs-heuristic decision rule that splits SimLab's two lanes."}
          />

          <Callout variant="note" title={es ? "Rol en el modelado" : "Modeling role"}>
            <p>
              {es
                ? "Esta sub-pestaña justifica por qué S06/S08/S11 viven en el carril de precómputo (solver nativo, NP-difícil, determinista) mientras los simuladores estocásticos de Python puro corren en vivo. La frontera de complejidad es la frontera de la arquitectura."
                : "This sub-tab justifies why S06/S08/S11 live in the precompute lane (native solver, NP-hard, deterministic) while the pure-Python stochastic simulators run live. The complexity frontier is the architecture's frontier."}
            </p>
          </Callout>

          <Refs ids={["garey1979", "papadimitriou1998", "applegate2006", "voudouris1999"]} label={es ? "Referencias:" : "References:"} />
        </div>
      ),
    },
  ];

  return <SubTabs orientation="vertical" ariaLabel={es ? "Teoría de optimización y ruteo" : "Optimization & routing theory"} tabs={tabs} />;
}
