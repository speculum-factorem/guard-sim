import { Navigate, Route, Routes } from "react-router-dom";
import { getAuthToken } from "./authToken";
import { ChallengesPage } from "./pages/ChallengesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SimulationPage } from "./pages/SimulationPage";
import { AppLayout } from "./layout/AppLayout";

/** Лендинг для гостей; при сохранённом JWT — сразу дашборд. */
function LandingOrDashboard() {
  if (getAuthToken()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <HomePage />;
}

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LandingOrDashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/play/:scenarioId" element={<SimulationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
