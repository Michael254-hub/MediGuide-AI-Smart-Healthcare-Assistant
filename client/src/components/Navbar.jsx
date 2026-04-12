import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  ChevronDown,
  CircleAlert,
  LogOut,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { isUserVerified } from "../utils/auth";
import { patientProfileAPI } from "../services/api";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const verified = isUserVerified(user);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileState, setProfileState] = useState({
    loading: false,
    complete: null,
    details: null,
  });

  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let isActive = true;

    const loadPatientProfileState = async () => {
      if (!isAuthenticated || !verified || user?.role === "admin") {
        if (isActive) {
          setProfileState({ loading: false, complete: null, details: null });
        }
        return;
      }

      try {
        if (isActive) {
          setProfileState((current) => ({ ...current, loading: true }));
        }
        const response = await patientProfileAPI.getProfile();
        const details = response.data.data || null;
        if (isActive) {
          setProfileState({
            loading: false,
            complete: Boolean(details?.profileComplete),
            details,
          });
        }
      } catch (error) {
        if (isActive) {
          setProfileState({
            loading: false,
            complete: false,
            details: null,
          });
        }
      }
    };

    loadPatientProfileState();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, verified, user?.role]);

  useEffect(() => {
    const handlePatientProfileUpdated = (event) => {
      const details = event.detail || null;
      setProfileState({
        loading: false,
        complete: Boolean(details?.profileComplete),
        details,
      });
    };

    window.addEventListener("patient-profile-updated", handlePatientProfileUpdated);
    return () => {
      window.removeEventListener("patient-profile-updated", handlePatientProfileUpdated);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const primaryContact = user?.email || user?.phone || "No contact on file";
  const patientProfileLabel =
    profileState.complete === null
      ? "Not applicable"
      : profileState.loading
        ? "Checking..."
        : profileState.complete
          ? "Complete"
          : "Needs attention";
  const patientProfileDetails = profileState.details;

  const handleEditProfile = () => {
    setIsProfileOpen(false);
    navigate("/submit", { state: { editProfile: true } });
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
          <div className="relative border-l pl-6 border-slate-200">
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left hover:border-slate-300 hover:bg-slate-100 transition-all"
            >
              <UserCircle2 className="w-9 h-9 text-med-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {user?.name || "Profile"}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {verified ? "Verified account" : "Verification pending"}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-80 rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 p-5 z-50">
                <div className="flex items-start gap-4">
                  <UserCircle2 className="w-14 h-14 text-med-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-base font-bold text-slate-900 truncate">
                      {user?.name}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {primaryContact}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 capitalize">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {user?.role || "patient"}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Account status</span>
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-semibold ${
                        verified ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {verified ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <CircleAlert className="w-4 h-4" />
                      )}
                      {verified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Assessment profile</span>
                    <span
                      className={`text-sm font-semibold ${
                        profileState.complete
                          ? "text-emerald-600"
                          : profileState.complete === false
                            ? "text-amber-600"
                            : "text-slate-500"
                      }`}
                    >
                      {patientProfileLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Primary contact</span>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                      {primaryContact}
                    </span>
                  </div>
                </div>

                {user?.role !== "admin" && verified && (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Patient profile</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Structured intake details shown inside the main profile.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleEditProfile}
                        className="px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold hover:bg-sky-200 transition-colors"
                      >
                        {profileState.complete ? "Update" : "Complete"}
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <div className="text-xs text-slate-500">Age</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {patientProfileDetails?.demographics?.age ?? "Not set"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <div className="text-xs text-slate-500">Sex at birth</div>
                        <div className="text-sm font-semibold text-slate-800 capitalize">
                          {patientProfileDetails?.demographics?.sexAtBirth ?? "Not set"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <div className="text-xs text-slate-500">Medications</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {patientProfileDetails?.profileSummary?.medicationCount ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <div className="text-xs text-slate-500">Allergies</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {patientProfileDetails?.profileSummary?.allergyCount ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
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
