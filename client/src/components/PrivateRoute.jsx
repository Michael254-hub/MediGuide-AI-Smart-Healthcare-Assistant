import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { isUserVerified } from "../utils/auth";

export default function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isUserVerified(user)) {
    return <Navigate to="/verify-account" replace />;
  }

  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
