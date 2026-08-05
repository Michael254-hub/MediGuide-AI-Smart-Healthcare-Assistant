import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Logo } from "../brand/Logo";
import Navbar from "../Navbar";

export function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(!isHomePage);
  const [trackedIsHomePage, setTrackedIsHomePage] = useState(isHomePage);

  // Route changed since the last render: reset synchronously instead of via an effect
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-based-on-a-prop-change).
  if (isHomePage !== trackedIsHomePage) {
    setTrackedIsHomePage(isHomePage);
    if (!isHomePage) {
      setIsScrolled(true);
    }
  }

  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled
          ? "border-b border-brand-border bg-white/90 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="MediGuide home">
          <Logo />
        </Link>
        <Navbar />
      </div>
    </header>
  );
}
