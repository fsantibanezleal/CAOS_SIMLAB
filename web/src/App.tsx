import { useState } from "react";
import { About } from "./components/About";
import { Header, type Tab } from "./components/Header";
import { LearnPanel } from "./components/LearnPanel";
import { Simulator } from "./components/Simulator";

export default function App() {
  const [tab, setTab] = useState<Tab>("simulator");
  return (
    <div className="app">
      <Header tab={tab} setTab={setTab} />
      <main className="content">
        {tab === "simulator" && <Simulator />}
        {tab === "learn" && <LearnPanel />}
        {tab === "about" && <About />}
      </main>
      <footer className="footer">
        <span>CAOS_SIMLAB · v0.02.000 · MIT</span>
        <a className="link" href="https://github.com/fsantibanezleal/CAOS_SIMLAB" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
