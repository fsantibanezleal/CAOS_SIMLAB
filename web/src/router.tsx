import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import Introduction from "@/pages/Introduction";
import Experiments from "@/pages/Experiments";
import Theory from "@/pages/Theory";
import Build from "@/pages/Build";
import NotFound from "@/pages/NotFound";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Introduction />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/build" element={<Build />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
