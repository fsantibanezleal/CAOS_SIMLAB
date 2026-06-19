// CAOS_SIMLAB master bibliography. DOIs/URLs verified 2026-06-19 (see wip/caos-simlab/content/citations).
// verified:false means "no DOI exists to verify" (book/software/pre-DOI era), NOT "in doubt".
// Resolve DOIs at https://doi.org/<doi>.

export interface Citation {
  id: string;
  label: string;
  citation: string;
  doi?: string;
  url?: string;
  verified: boolean;
  tags: Array<"queueing" | "des" | "abm" | "tools">;
}

export const CITATIONS: Citation[] = [
  { id: "erlang1917", label: "Erlang 1917", citation: "Erlang, A. K. (1917/1918). Solution of some problems in the theory of probabilities of significance in automatic telephone exchanges. Elektroteknikeren 13; Eng. transl. The Post Office Electrical Engineers' Journal 10 (1918), 189–197.", url: "https://search.worldcat.org/oclc/80012890", verified: false, tags: ["queueing"] },
  { id: "kendall1953", label: "Kendall 1953", citation: "Kendall, D. G. (1953). Stochastic processes occurring in the theory of queues and their analysis by the method of the imbedded Markov chain. The Annals of Mathematical Statistics 24(3), 338–354.", doi: "10.1214/aoms/1177728975", verified: true, tags: ["queueing"] },
  { id: "little1961", label: "Little 1961", citation: "Little, J. D. C. (1961). A proof for the queuing formula: L = λW. Operations Research 9(3), 383–387.", doi: "10.1287/opre.9.3.383", verified: true, tags: ["queueing"] },
  { id: "kingman1961", label: "Kingman 1961", citation: "Kingman, J. F. C. (1961). The single server queue in heavy traffic. Mathematical Proceedings of the Cambridge Philosophical Society 57(4), 902–904.", doi: "10.1017/S0305004100036094", verified: true, tags: ["queueing"] },
  { id: "pollaczek1930", label: "Pollaczek 1930", citation: "Pollaczek, F. (1930). Über eine Aufgabe der Wahrscheinlichkeitstheorie I–II. Mathematische Zeitschrift 32, 64–100 & 729–750.", doi: "10.1007/BF01194620", verified: false, tags: ["queueing"] },
  { id: "grossharris2018", label: "Shortle, Thompson, Gross & Harris 2018", citation: "Shortle, J. F., Thompson, J. M., Gross, D., & Harris, C. M. (2018). Fundamentals of Queueing Theory (5th ed.). Hoboken, NJ: Wiley. ISBN 978-1-118-94352-6.", doi: "10.1002/9781119453765", verified: true, tags: ["queueing"] },
  { id: "lawkelton2015", label: "Law 2015", citation: "Law, A. M. (2015). Simulation Modeling and Analysis (5th ed.). New York: McGraw-Hill Education. ISBN 978-0-07-340132-4.", url: "https://www.mheducation.com/highered/product/simulation-modeling-analysis-law/M9780073401324.html", verified: false, tags: ["des"] },
  { id: "banks2010", label: "Banks, Carson, Nelson & Nicol 2010", citation: "Banks, J., Carson, J. S., Nelson, B. L., & Nicol, D. M. (2010). Discrete-Event System Simulation (5th ed.). Upper Saddle River, NJ: Pearson. ISBN 978-0-13-606212-7.", url: "https://www.pearson.com/en-us/subject-catalog/p/discrete-event-system-simulation/P200000003161", verified: false, tags: ["des"] },
  { id: "welch1983", label: "Welch 1983", citation: "Welch, P. D. (1983). The statistical analysis of simulation results. In S. S. Lavenberg (Ed.), The Computer Performance Modeling Handbook (pp. 268–328). New York: Academic Press.", url: "https://search.worldcat.org/oclc/8451904", verified: false, tags: ["des"] },
  { id: "sargent2013", label: "Sargent 2013", citation: "Sargent, R. G. (2013). Verification and validation of simulation models. Journal of Simulation 7(1), 12–24.", doi: "10.1057/jos.2012.20", verified: true, tags: ["des"] },
  { id: "lecuyer1999", label: "L'Ecuyer 1999", citation: "L'Ecuyer, P. (1999). Good parameter sets for combined multiple recursive random number generators. Operations Research 47(1), 159–164.", doi: "10.1287/opre.47.1.159", verified: true, tags: ["des"] },
  { id: "matsumoto1998", label: "Matsumoto & Nishimura 1998", citation: "Matsumoto, M., & Nishimura, T. (1998). Mersenne twister: A 623-dimensionally equidistributed uniform pseudo-random number generator. ACM TOMACS 8(1), 3–30.", doi: "10.1145/272991.272995", verified: true, tags: ["des"] },
  { id: "schelling1971", label: "Schelling 1971", citation: "Schelling, T. C. (1971). Dynamic models of segregation. The Journal of Mathematical Sociology 1(2), 143–186.", doi: "10.1080/0022250X.1971.9989794", verified: true, tags: ["abm"] },
  { id: "kermack1927", label: "Kermack & McKendrick 1927", citation: "Kermack, W. O., & McKendrick, A. G. (1927). A contribution to the mathematical theory of epidemics. Proceedings of the Royal Society of London A 115(772), 700–721.", doi: "10.1098/rspa.1927.0118", verified: true, tags: ["abm"] },
  { id: "reynolds1987", label: "Reynolds 1987", citation: "Reynolds, C. W. (1987). Flocks, herds and schools: A distributed behavioral model. Computer Graphics (SIGGRAPH '87) 21(4), 25–34.", doi: "10.1145/37402.37406", verified: true, tags: ["abm"] },
  { id: "bonabeau2002", label: "Bonabeau 2002", citation: "Bonabeau, E. (2002). Agent-based modeling: Methods and techniques for simulating human systems. PNAS 99(suppl. 3), 7280–7287.", doi: "10.1073/pnas.082080899", verified: true, tags: ["abm"] },
  { id: "grimm2006", label: "Grimm et al. 2006", citation: "Grimm, V., Berger, U., Bastiansen, F., et al. (2006). A standard protocol for describing individual-based and agent-based models. Ecological Modelling 198(1–2), 115–126.", doi: "10.1016/j.ecolmodel.2006.04.023", verified: true, tags: ["abm"] },
  { id: "grimm2020", label: "Grimm et al. 2020", citation: "Grimm, V., Railsback, S. F., Vincenot, C. E., et al. (2020). The ODD protocol for describing agent-based and other simulation models: A second update. JASSS 23(2), 7.", doi: "10.18564/jasss.4259", verified: true, tags: ["abm"] },
  { id: "epstein1996", label: "Epstein & Axtell 1996", citation: "Epstein, J. M., & Axtell, R. (1996). Growing Artificial Societies: Social Science from the Bottom Up. Brookings Institution Press & MIT Press. ISBN 978-0-262-55025-3.", url: "https://direct.mit.edu/books/monograph/2503", verified: false, tags: ["abm"] },
  { id: "simpy", label: "SimPy", citation: "Team SimPy (2002–present). SimPy: Discrete-event simulation for Python (process-based DES framework) [Software].", url: "https://simpy.readthedocs.io/", verified: false, tags: ["tools", "des"] },
  { id: "kazil2020", label: "Kazil, Masad & Crooks 2020", citation: "Kazil, J., Masad, D., & Crooks, A. (2020). Utilizing Python for agent-based modeling: The Mesa framework. In SBP-BRiMS 2020, LNCS 12268 (pp. 308–317). Springer.", doi: "10.1007/978-3-030-61255-9_30", verified: true, tags: ["tools", "abm"] },
  { id: "terhoeven2025", label: "ter Hoeven et al. 2025", citation: "ter Hoeven, E., Kwakkel, J., Hess, V., et al. (2025). Mesa 3: Agent-based modeling with Python in 2025. Journal of Open Source Software 10(107), 7668.", doi: "10.21105/joss.07668", verified: true, tags: ["tools", "abm"] },
  { id: "ortools", label: "OR-Tools", citation: "Perron, L., & Furnon, V. (Google) (2010–present). OR-Tools: Google's operations research software suite [Software].", url: "https://developers.google.com/optimization", verified: false, tags: ["tools"] },
];

export const CITATIONS_BY_ID: Record<string, Citation> = Object.fromEntries(CITATIONS.map((c) => [c.id, c]));
export type CitationId = string;

export function citationHref(c: Citation): string | undefined {
  if (c.doi) return `https://doi.org/${c.doi}`;
  return c.url;
}
