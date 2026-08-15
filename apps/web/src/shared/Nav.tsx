"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@applyflow/ui-web";

const PRIMARY_LINKS = [
  { href: "/home", label: "Home", mobileLabel: "Home" },
  { href: "/discover", label: "Find jobs", mobileLabel: "Jobs" },
  { href: "/applications", label: "Applications", mobileLabel: "Apps" },
  { href: "/plan", label: "Plan & usage", mobileLabel: "Plan" },
];

const SECONDARY_LINKS = [
  { href: "/resumes", label: "Resumes" },
  { href: "/help", label: "Help & demo" },
  { href: "/onboarding", label: "Onboarding" },
];

const ALL_LINKS = [...PRIMARY_LINKS, ...SECONDARY_LINKS];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/home" && pathname.startsWith(href));
}

export function Nav() {
  const pathname = usePathname();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  return (
    <>
      <header className="af-candidate-header">
        <div className="af-row">
          <Link
            href="/home"
            style={{ fontWeight: 700, textDecoration: "none", color: "var(--color-ink-950)" }}
          >
            ApplyFlow
          </Link>
          {demoMode && <Badge variant="demo">Demo</Badge>}
        </div>
        <nav className="af-candidate-nav" aria-label="Main navigation">
          {ALL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={isActive(pathname, link.href) ? "true" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <nav className="af-mobile-nav" aria-label="Primary mobile navigation">
        {PRIMARY_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            data-active={isActive(pathname, link.href) ? "true" : undefined}
          >
            {link.mobileLabel}
          </Link>
        ))}
        <Link href="/help" data-active={isActive(pathname, "/help") ? "true" : undefined}>
          Help
        </Link>
      </nav>
    </>
  );
}

export function CandidatePage({ children }: { children: React.ReactNode }) {
  return (
    <main className="af-page af-page-with-mobile-nav">
      <Nav />
      <div className="af-container">{children}</div>
    </main>
  );
}
