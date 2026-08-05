import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import VerifyAccount from "./pages/VerifyAccount";
import Dashboard from "./pages/Dashboard";
import SubmitSymptoms from "./pages/SubmitSymptoms";
import AdminPortal from "./pages/AdminPortal";
import MedicPortal from "./pages/MedicPortal";
import ClinicalDashboard from "./pages/ClinicalDashboard";
import MedicalProfessionalApplication from "./pages/MedicalProfessionalApplication";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg font-sans text-brand-text">
      <Header />

      <main className="flex grow flex-col overflow-x-clip">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-account" element={<VerifyAccount />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/accessibility" element={<Accessibility />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <PrivateRoute>
                <SubmitSymptoms />
              </PrivateRoute>
            }
          />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/medic" element={<MedicPortal />} />
          <Route
            path="/medichat"
            element={
              <PrivateRoute>
                <ClinicalDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/clinical" element={<Navigate to="/medichat" replace />} />
          <Route
            path="/professional-application"
            element={
              <PrivateRoute>
                <MedicalProfessionalApplication />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
