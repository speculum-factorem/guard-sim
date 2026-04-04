import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAppAccess } from "./components/RequireAppAccess";
import { AccountPage } from "./pages/AccountPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DefenderPage } from "./pages/DefenderPage";
import { LandingGate } from "./pages/LandingGate";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SimulationPage } from "./pages/SimulationPage";
import { AppLayout } from "./layout/AppLayout";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LandingGate />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAppAccess>
              <DashboardPage />
            </RequireAppAccess>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAppAccess>
              <AccountPage />
            </RequireAppAccess>
          }
        />
        <Route
          path="/challenges"
          element={
            <RequireAppAccess>
              <ChallengesPage />
            </RequireAppAccess>
          }
        />
        <Route
          path="/play/:scenarioId"
          element={
            <RequireAppAccess>
              <SimulationPage />
            </RequireAppAccess>
          }
        />
        <Route
          path="/defender"
          element={
            <RequireAppAccess>
              <DefenderPage />
            </RequireAppAccess>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
