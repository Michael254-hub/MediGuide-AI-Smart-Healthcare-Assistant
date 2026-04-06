import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SubmitSymptoms from "./pages/SubmitSymptoms";
import AdminDashboard from "./pages/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <div className="min-h-screen bg-med-bg text-med-text flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-med-primary to-med-accent flex items-center justify-center text-white font-bold text-xl shadow-md">
              M
            </div>
            <span className="font-extrabold text-2xl text-med-dark tracking-tight">
              MediGuide
            </span>
          </div>
          <Navbar />
        </div>
      </header>

      <main className="grow flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
