import { useTranslation } from "react-i18next";
import { Tabs } from "@/components/content/Tabs";
import { ReferenceList } from "@/components/content/Cite";
import { QueueingTheory } from "@/components/theory/QueueingTheory";
import { DesMethodology } from "@/components/theory/DesMethodology";
import { AbmTheory } from "@/components/theory/AbmTheory";
import { useLang } from "@/lib/useLang";

export default function Theory() {
  const { t } = useTranslation();
  const es = useLang() === "es";

  const topTabs = [
    { id: "queueing", label: es ? "Teoría de colas (M/M/c)" : "Queueing theory (M/M/c)", content: <QueueingTheory es={es} /> },
    { id: "des", label: es ? "Metodología DES" : "DES methodology", content: <DesMethodology es={es} /> },
    { id: "abm", label: es ? "Modelos de agentes (ABM)" : "Agent-based modeling", content: <AbmTheory es={es} /> },
    { id: "refs", label: es ? "Bibliografía" : "Bibliography", content: <div className="prose"><ReferenceList heading={es ? "Bibliografía completa" : "Full bibliography"} /></div> },
  ];

  return (
    <div className="page-body">
      <div className="page-head">
        <h1>{t("nav.theory")}</h1>
        <p className="lede">{es
          ? "Los fundamentos, con rigor y referencias: la teoría de colas que el simulador valida, la metodología completa del estudio de simulación, y los modelos basados en agentes — con ecuaciones, diagramas y bibliografía con DOI."
          : "The foundations, with rigor and references: the queueing theory the simulator validates, the full simulation-study methodology, and agent-based models — with equations, diagrams, and a DOI'd bibliography."}</p>
      </div>
      <Tabs tabs={topTabs} ariaLabel={t("nav.theory")} />
    </div>
  );
}
