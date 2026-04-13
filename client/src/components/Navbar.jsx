import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Brain,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Stethoscope,
  UserCircle2,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [profileState, setProfileState] = useState({
    loading: false,
    complete: null,
    details: null,
  });

  useEffect(() => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileProfileOpen(false);
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
        const profileResponse = await patientProfileAPI.getProfile();
        const details = profileResponse.data.data || null;
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

  useEffect(() => {
    if (!isMobileProfileOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen, isMobileProfileOpen]);

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
    setIsMobileMenuOpen(false);
    setIsMobileProfileOpen(false);
    navigate("/submit", { state: { editProfile: true } });
  };

  const handleViewAssessmentHistory = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileProfileOpen(false);
    navigate("/dashboard");
  };

  const openMobileProfile = () => {
    setIsMobileMenuOpen(false);
    setIsMobileProfileOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navigationLinks = isAuthenticated
    ? !verified
      ? [
          {
            to: "/verify-account",
            label: "Verify account",
            description: "Complete your verification to unlock the full workspace.",
            icon: CircleAlert,
          },
        ]
      : [
          {
            to: "/dashboard",
            label: "Assessment Dashboard",
            description: "Review assessment history and follow-up actions.",
            icon: LayoutDashboard,
          },
          {
            to: "/clinical",
            label: "MediGuide AI Workspace",
            description: "Open the clinical workspace and multimodal chat.",
            icon: Brain,
          },
          ...(user?.role !== "admin"
            ? [
                {
                  to: "/professional-application",
                  label:
                    user?.role === "medical_professional"
                      ? "Professional Status"
                      : "Apply to Guide",
                  description:
                    user?.role === "medical_professional"
                      ? "Review your approved professional role and verification details."
                      : "Apply to provide human medical guidance when escalation is needed.",
                  icon: Stethoscope,
                },
              ]
            : []),
          ...(user?.role === "admin"
            ? [
                {
                  to: "/admin",
                  label: "Admin Panel",
                  description: "Manage users, triage status, and reports.",
                  icon: BadgeCheck,
                },
              ]
            : []),
        ]
    : [
        {
          to: "/login",
          label: "Log In",
          description: "Access your account and continue where you left off.",
          icon: UserCircle2,
        },
        {
          to: "/register",
          label: "Get Started",
          description: "Create an account to begin assessments and AI support.",
          icon: BadgeCheck,
        },
      ];

  const getLinkClasses = (path, mobile = false) => {
    const isActive = location.pathname === path;

    if (mobile) {
      return `block rounded-2xl border px-4 py-3 transition ${
        isActive
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`;
    }

    return `transition-colors font-medium ${
      isActive ? "text-med-primary" : "text-med-text hover:text-med-primary"
    }`;
  };

  const renderNavigationLinks = (mobile = false) =>
    navigationLinks.map((item) =>
      mobile ? (
        <Link key={item.to} to={item.to} className={getLinkClasses(item.to, true)}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-600">
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="mt-1 text-xs text-slate-500">{item.description}</div>
            </div>
          </div>
        </Link>
      ) : (
        <Link key={item.to} to={item.to} className={getLinkClasses(item.to)}>
          {item.label}
        </Link>
      )
    );

  const mobileMenuLinks = isAuthenticated
    ? verified
      ? [
          { to: "/dashboard", label: "Assessment", description: "Assessment history and follow-up details." },
          { to: "/clinical", label: "MediGuide AI", description: "Open the AI workspace and conversation view." },
          ...(user?.role !== "admin"
            ? [
                {
                  to: "/professional-application",
                  label:
                    user?.role === "medical_professional"
                      ? "Professional Status"
                      : "Apply to Guide",
                  description:
                    user?.role === "medical_professional"
                      ? "Review your approved verification status and role."
                      : "Apply to provide human medical guidance when needed.",
                },
              ]
            : []),
          ...(user?.role === "admin"
            ? [{ to: "/admin", label: "Admin Panel", description: "Manage users, reports, and triage workflows." }]
            : []),
        ]
      : [
          {
            to: "/verify-account",
            label: "Verify account",
            description: "Complete verification before using the workspace.",
          },
        ]
    : [];

  return (
    <>
      <nav className="flex items-center gap-2">
        {isAuthenticated && (
          <div className="hidden xl:flex xl:items-center xl:gap-6">
            {renderNavigationLinks(false)}
          </div>
        )}

        {isAuthenticated ? (
          <>
            <div className="hidden xl:block xl:border-l xl:border-slate-200 xl:pl-6">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left hover:border-slate-300 hover:bg-slate-100 transition-all"
                >
                  <UserCircle2 className="h-9 w-9 shrink-0 text-med-primary" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800">
                      {user?.name || "Profile"}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {verified ? "Verified account" : "Verification pending"}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70">
                    <ProfilePanelContent
                      patientProfileDetails={patientProfileDetails}
                      patientProfileLabel={patientProfileLabel}
                      primaryContact={primaryContact}
                      profileState={profileState}
                      user={user}
                      verified={verified}
                      onEditProfile={handleEditProfile}
                      onLogout={handleLogout}
                      onViewAssessmentHistory={handleViewAssessmentHistory}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex items-center gap-2 xl:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileProfileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-sky-50 text-med-primary shadow-sm transition hover:border-sky-200 hover:bg-sky-100"
                aria-label="Open profile panel"
              >
                <UserCircle2 className="h-6 w-6" />
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[min(18rem,calc(100vw-1.5rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/80">
                  <div className="border-b border-slate-200 px-2 pb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Menu
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Jump to the key workspace pages.
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    {mobileMenuLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeMobileMenu}
                        className={`block rounded-2xl border px-4 py-3 transition ${
                          location.pathname === item.to
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.description}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="hidden items-center gap-3 sm:flex">
              {renderNavigationLinks(false)}
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                to="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-med-text transition-colors hover:text-med-primary"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-med-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-med-secondary"
              >
                Start
              </Link>
            </div>
          </>
        )}
      </nav>

      {isAuthenticated && isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-transparent xl:hidden"
          onClick={closeMobileMenu}
          aria-label="Close navigation menu"
        />
      )}

      {isAuthenticated && isMobileProfileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[80] bg-slate-950/35 backdrop-blur-sm xl:hidden"
            onClick={() => setIsMobileProfileOpen(false)}
            aria-label="Close profile panel"
          />
          <section className="fixed inset-0 z-[90] overflow-y-auto bg-white xl:hidden">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Account
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Profile Panel</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileProfileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Close profile panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mx-auto max-w-3xl px-5 pb-10 pt-4">
              <ProfilePanelContent
                patientProfileDetails={patientProfileDetails}
                patientProfileLabel={patientProfileLabel}
                primaryContact={primaryContact}
                profileState={profileState}
                user={user}
                verified={verified}
                onEditProfile={handleEditProfile}
                onLogout={handleLogout}
                onViewAssessmentHistory={handleViewAssessmentHistory}
              />
            </div>
          </section>
        </>
      )}
    </>
  );
};

const ProfilePanelContent = ({
  user,
  primaryContact,
  verified,
  profileState,
  patientProfileLabel,
  patientProfileDetails,
  onEditProfile,
  onViewAssessmentHistory,
  onLogout,
}) => (
  <>
    <div className="flex items-start gap-4">
      <UserCircle2 className="h-14 w-14 shrink-0 text-med-primary" />
      <div className="min-w-0">
        <div className="truncate text-base font-bold text-slate-900">{user?.name}</div>
        <div className="truncate text-sm text-slate-500">{primaryContact}</div>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
          <BadgeCheck className="h-3.5 w-3.5" />
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
          {verified ? <ShieldCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
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
        <span className="max-w-[160px] truncate text-sm font-medium text-slate-700">
          {primaryContact}
        </span>
      </div>
    </div>

    {user?.role !== "admin" && verified && (
      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Patient profile</h4>
            <p className="mt-1 text-xs text-slate-500">
              Structured intake details shown inside the main profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-200"
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
            <div className="text-sm font-semibold capitalize text-slate-800">
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

    {user?.role !== "admin" && verified && (
      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Assessment history</h4>
            <p className="text-xs text-slate-500">
              Past assessments, timestamps, and key clinical responses.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAssessmentHistory}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-colors hover:bg-slate-100"
        >
          <div className="text-sm font-semibold text-slate-900">View assessment history</div>
          <div className="mt-1 text-xs text-slate-500">
            Open the full record of all past assessments, timestamps, key clinical
            questions, and patient responses.
          </div>
        </button>
      </div>
    )}

    <div className="mt-4 border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  </>
);

export default Navbar;
