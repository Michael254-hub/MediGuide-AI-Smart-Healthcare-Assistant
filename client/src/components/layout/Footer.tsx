import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, ShieldAlert, Twitter } from "lucide-react";
import { Logo } from "../brand/Logo";

const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Company",
    links: [
      { label: "Why MediGuide", href: "/#why-mediguide" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Security & Privacy", href: "/#security" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Features", href: "/#features" },
      { label: "FAQ", href: "/#faq" },
      { label: "Sign In", href: "/login" },
      { label: "Get Started", href: "/register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="mono" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Your intelligent healthcare companion — educational guidance, always paired with a
              clear path to professional care.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="MediGuide on X"
                className="flex size-9 items-center justify-center rounded-full border border-slate-800 text-slate-400 transition hover:border-slate-600 hover:text-white"
              >
                <Twitter className="size-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="MediGuide on LinkedIn"
                className="flex size-9 items-center justify-center rounded-full border border-slate-800 text-slate-400 transition hover:border-slate-600 hover:text-white"
              >
                <Linkedin className="size-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="MediGuide on GitHub"
                className="flex size-9 items-center justify-center rounded-full border border-slate-800 text-slate-400 transition hover:border-slate-600 hover:text-white"
              >
                <Github className="size-4" />
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {column.title}
              </p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/#") ? (
                      <a href={link.href} className="text-sm text-slate-400 transition hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-sm text-slate-400 transition hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div id="contact" className="scroll-mt-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Contact
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="mailto:support@mediguide.health"
                  className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                >
                  <Mail className="size-4" />
                  support@mediguide.health
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
          <p>
            <span className="font-semibold text-slate-200">Medical disclaimer:</span> MediGuide
            provides AI-assisted educational health information and guidance. It is not a
            substitute for professional medical advice, diagnosis, or treatment. Always consult a
            qualified healthcare professional for medical concerns. If you are experiencing a
            medical emergency, contact your local emergency services immediately.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm sm:flex-row">
          <p>© {new Date().getFullYear()} MediGuide. For informational purposes only.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link to="/accessibility" className="transition hover:text-white">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
