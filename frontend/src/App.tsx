import { Navigate, Route, Routes } from "react-router-dom";
import { ChallengesPage } from "./pages/ChallengesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { SimulationPage } from "./pages/SimulationPage";
import { AppLayout } from "./layout/AppLayout";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/play/:scenarioId" element={<SimulationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
