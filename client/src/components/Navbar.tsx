import { useEffect, useState, type ReactNode } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { isUserVerified } from "../utils/auth";
import { patientProfileAPI } from "../services/api";
import { ButtonLink } from "./ui/Button";
import type { PatientProfileDetails } from "../types/patientProfile";

interface ProfileState {
  loading: boolean;
  complete: boolean | null;
  details: PatientProfileDetails | null;
}

const MARKETING_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#security", label: "Security" },
  { href: "#why-mediguide", label: "About" },
  { href: "#contact", label: "Contact" },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const verified = isUserVerified(user);
  const isHomePage = location.pathname === "/";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [profileState, setProfileState] = useState<ProfileState>({
    loading: false,
    complete: null,
    details: null,
  });
  const [trackedPathname, setTrackedPathname] = useState(location.pathname);

  // Route changed since the last render: close any open menus synchronously instead of
  // via an effect (https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-based-on-a-prop-change).
  if (location.pathname !== trackedPathname) {
    setTrackedPathname(location.pathname);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileProfileOpen(false);
  }

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
      } catch {
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
    const handlePatientProfileUpdated = (event: Event) => {
      const details = (event as CustomEvent<PatientProfileDetails>).detail || null;
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  interface NavLinkItem {
    to: string;
    label: string;
    description: string;
    icon: LucideIcon;
  }

  const navigationLinks: NavLinkItem[] = isAuthenticated
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
            label: "Assessment",
            description: "Review assessment history and follow-up actions.",
            icon: LayoutDashboard,
          },
          {
            to: "/medichat",
            label: "MediChat",
            description: "Open the MediChat workspace and multimodal chat.",
            icon: Brain,
          },
          ...(user?.role !== "admin" && user?.role !== "medical_professional"
            ? [
                {
                  to: "/professional-application",
                  label: "Apply to Guide",
                  description:
                    "Apply to provide human medical guidance when escalation is needed.",
                  icon: Stethoscope,
                },
              ]
            : []),
        ]
    : [];

  const getLinkClasses = (path: string, mobile = false) => {
    const isActive = location.pathname === path;

    if (mobile) {
      return `block rounded-2xl border px-4 py-3 transition ${
        isActive
          ? "border-brand-secondary/30 bg-brand-secondary/10 text-brand-primary"
          : "border-brand-border bg-white text-brand-text hover:border-slate-300 hover:bg-slate-50"
      }`;
    }

    return `transition-colors font-medium ${
      isActive ? "text-brand-primary" : "text-brand-text hover:text-brand-primary"
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
      ),
    );

  const mobileMenuLinks = isAuthenticated
    ? verified
      ? [
          {
            to: "/dashboard",
            label: "Assessment",
            description: "Assessment history and follow-up details.",
          },
          {
            to: "/medichat",
            label: "MediChat",
            description: "Open the MediChat workspace and conversation view.",
          },
          ...(user?.role !== "admin" && user?.role !== "medical_professional"
            ? [
                {
                  to: "/professional-application",
                  label: "Apply to Guide",
                  description: "Apply to provide human medical guidance when needed.",
                },
              ]
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
      <nav className="flex items-center gap-2" aria-label="Primary">
        {isAuthenticated && (
          <div className="hidden xl:flex xl:items-center xl:gap-6">
            {renderNavigationLinks(false)}
          </div>
        )}

        {!isAuthenticated && isHomePage && (
          <div className="hidden items-center gap-6 lg:flex">
            {MARKETING_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-text-muted transition-colors hover:text-brand-primary"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {isAuthenticated ? (
          <>
            <div className="hidden xl:block xl:border-l xl:border-brand-border xl:pl-6">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((current) => !current)}
                  className="flex w-[min(18rem,28vw)] items-center gap-3 rounded-2xl border border-brand-border bg-slate-50 px-4 py-2.5 text-left transition-all hover:border-slate-300 hover:bg-slate-100"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                >
                  <UserCircle2 className="h-9 w-9 shrink-0 text-brand-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-brand-text">
                      {user?.name || "Profile"}
                    </div>
                    <div className="truncate text-xs text-brand-text-muted">
                      {verified ? "Verified account" : "Verification pending"}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-brand-text-muted transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(26rem,calc(100vw-2rem))] max-h-[calc(100vh-6rem)] overflow-hidden rounded-3xl border border-brand-border bg-white p-5 shadow-2xl shadow-slate-200/70">
                    <ProfilePanelContent
                      className="max-h-[calc(100vh-8.5rem)]"
                      patientProfileDetails={patientProfileDetails}
                      patientProfileLabel={patientProfileLabel}
                      primaryContact={primaryContact}
                      profileState={profileState}
                      userName={user?.name}
                      userRole={user?.role}
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-border bg-white text-brand-text shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileProfileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 text-brand-primary shadow-sm transition hover:bg-brand-secondary/20"
                aria-label="Open profile panel"
              >
                <UserCircle2 className="h-6 w-6" />
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[70] w-[min(18rem,calc(100vw-1.5rem))] rounded-3xl border border-brand-border bg-white p-3 shadow-2xl shadow-slate-200/80">
                  <div className="border-b border-brand-border px-2 pb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-text-muted">
                      Menu
                    </p>
                    <p className="mt-1 text-sm text-brand-text-muted">
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
                            ? "border-brand-secondary/30 bg-brand-secondary/10 text-brand-primary"
                            : "border-brand-border bg-white text-brand-text hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="mt-1 text-xs text-brand-text-muted">
                          {item.description}
                        </div>
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
              <ButtonLink to="/login" variant="ghost" size="sm">
                Sign In
              </ButtonLink>
              <ButtonLink to="/register" variant="primary" size="sm">
                Get Started
              </ButtonLink>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                to="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-brand-text transition-colors hover:text-brand-primary"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-primary/90"
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
            <div className="sticky top-0 flex items-center justify-between border-b border-brand-border bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-text-muted">
                  Account
                </p>
                <h2 className="mt-1 text-lg font-bold text-brand-text">Profile Panel</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileProfileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-border text-brand-text-muted transition hover:bg-slate-50"
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
                userName={user?.name}
                userRole={user?.role}
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

interface ProfilePanelContentProps {
  className?: string;
  userName?: string;
  userRole?: string;
  primaryContact: string;
  verified: boolean;
  profileState: ProfileState;
  patientProfileLabel: string;
  patientProfileDetails: PatientProfileDetails | null;
  onEditProfile: () => void;
  onViewAssessmentHistory: () => void;
  onLogout: () => void;
}

const ProfilePanelContent = ({
  className = "",
  userName,
  userRole,
  primaryContact,
  verified,
  profileState,
  patientProfileLabel,
  patientProfileDetails,
  onEditProfile,
  onViewAssessmentHistory,
  onLogout,
}: ProfilePanelContentProps): ReactNode => (
  <div className={`flex h-full flex-col ${className}`}>
    <div className="overflow-y-auto pr-1">
      <div className="rounded-3xl bg-slate-50 p-4">
        <div className="flex items-start gap-4">
          <UserCircle2 className="h-14 w-14 shrink-0 text-brand-primary" />
          <div className="min-w-0 flex-1">
            <div className="break-words text-base font-bold text-brand-text">
              {userName || "Profile"}
            </div>
            <div className="mt-1 break-all text-sm text-brand-text-muted">{primaryContact}</div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-brand-text-muted shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              {userRole || "patient"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-brand-text-muted">Account status</span>
          <span
            className={`inline-flex items-center gap-1 text-sm font-semibold ${
              verified ? "text-brand-success" : "text-brand-warning"
            }`}
          >
            {verified ? <ShieldCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
            {verified ? "Verified" : "Pending"}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-brand-text-muted">Assessment profile</span>
          <span
            className={`text-sm font-semibold ${
              profileState.complete
                ? "text-brand-success"
                : profileState.complete === false
                  ? "text-brand-warning"
                  : "text-brand-text-muted"
            }`}
          >
            {patientProfileLabel}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="text-sm text-brand-text-muted">Primary contact</span>
          <span className="max-w-[13rem] break-all text-right text-sm font-medium text-brand-text">
            {primaryContact}
          </span>
        </div>
      </div>

      {userRole !== "admin" && verified && (
        <div className="mt-4 rounded-2xl border border-brand-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-brand-text">Patient profile</h4>
              <p className="mt-1 text-xs text-brand-text-muted">
                Structured intake details shown inside the main profile.
              </p>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              className="rounded-full bg-brand-secondary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-secondary/20"
            >
              {profileState.complete ? "Update" : "Complete"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-xs text-brand-text-muted">Age</div>
              <div className="text-sm font-semibold text-brand-text">
                {patientProfileDetails?.demographics?.age ?? "Not set"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-xs text-brand-text-muted">Sex at birth</div>
              <div className="text-sm font-semibold capitalize text-brand-text">
                {patientProfileDetails?.demographics?.sexAtBirth ?? "Not set"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-xs text-brand-text-muted">Medications</div>
              <div className="text-sm font-semibold text-brand-text">
                {patientProfileDetails?.profileSummary?.medicationCount ?? 0}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-xs text-brand-text-muted">Allergies</div>
              <div className="text-sm font-semibold text-brand-text">
                {patientProfileDetails?.profileSummary?.allergyCount ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {userRole !== "admin" && verified && (
        <div className="mt-4 rounded-2xl border border-brand-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-text">Assessment history</h4>
              <p className="text-xs text-brand-text-muted">
                Past assessments, timestamps, and key clinical responses.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewAssessmentHistory}
            className="mt-4 w-full rounded-2xl border border-brand-border bg-slate-50 px-4 py-4 text-left transition-colors hover:bg-slate-100"
          >
            <div className="text-sm font-semibold text-brand-text">View assessment history</div>
            <div className="mt-1 text-xs text-brand-text-muted">
              Open the full record of all past assessments, timestamps, key clinical questions,
              and patient responses.
            </div>
          </button>
        </div>
      )}
    </div>

    <div className="mt-4 border-t border-brand-border bg-white pt-4">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  </div>
);

export default Navbar;
