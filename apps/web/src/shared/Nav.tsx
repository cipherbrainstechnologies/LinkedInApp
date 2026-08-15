"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const links = [
    { href: "/home", label: "Home" },
    { href: "/resumes", label: "Resumes" },
    { href: "/discover", label: "Discover" },
    { href: "/applications", label: "Applications" },
    { href: "/plan", label: "Plan" },
    { href: "/onboarding", label: "Onboarding" },
  ];

  return (
    <nav className="nav" aria-label="Main navigation">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
