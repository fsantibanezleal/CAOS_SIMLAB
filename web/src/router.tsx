import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
          {/* Enter and land directly on the simulator. */}
          <Route path="/" element={<Experiments />} />
          <Route path="/experiments" element={<Navigate to="/" replace />} />
          <Route path="/introduction" element={<Introduction />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/build" element={<Build />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
