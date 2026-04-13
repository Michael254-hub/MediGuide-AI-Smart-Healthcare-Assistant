import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import VerifyAccount from "./pages/VerifyAccount";
import Dashboard from "./pages/Dashboard";
import SubmitSymptoms from "./pages/SubmitSymptoms";
import AdminDashboard from "./pages/AdminDashboard";
import ClinicalDashboard from "./pages/ClinicalDashboard";
import MedicalProfessionalApplication from "./pages/MedicalProfessionalApplication";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-med-bg font-sans text-med-text">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/85 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-med-primary to-med-accent text-xl font-bold text-white shadow-md">
              M
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xl font-extrabold tracking-tight text-med-dark sm:text-2xl">
                MediGuide
              </span>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 sm:block">
                AI-assisted health support
              </span>
            </div>
          </Link>
          <Navbar />
        </div>
      </header>

      <main className="grow flex flex-col overflow-x-clip">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-account" element={<VerifyAccount />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/clinical"
            element={
              <PrivateRoute>
                <ClinicalDashboard />
              </PrivateRoute>
            }
          />
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

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                M
              </div>
              <span className="font-bold text-slate-300 tracking-tight">
                MediGuide
              </span>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} MediGuide. For informational purposes
              only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
