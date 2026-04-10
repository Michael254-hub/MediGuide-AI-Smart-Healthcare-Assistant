import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { isUserVerified } from "../utils/auth";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const verified = isUserVerified(user);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex items-center gap-6">
      {isAuthenticated ? (
        <>
          {!verified ? (
            <Link
              to="/verify-account"
              className="text-med-text hover:text-med-primary transition-colors font-medium"
            >
              Verify Account
            </Link>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="text-med-text hover:text-med-primary transition-colors font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/clinical"
                className="text-med-text hover:text-med-primary transition-colors font-medium flex items-center gap-1"
              >
                <span>🧠</span> Clinical AI
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-med-text hover:text-med-primary transition-colors font-medium"
                >
                  Admin Panel
                </Link>
              )}
            </>
          )}
          <div className="flex items-center gap-4 border-l pl-6 border-slate-200">
            <span className="text-sm font-medium text-slate-500">
              Hi, {user?.name?.split(" ")[0]}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="text-med-text hover:text-med-primary transition-colors font-medium"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 bg-med-primary text-white rounded-full font-medium hover:bg-med-secondary shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
