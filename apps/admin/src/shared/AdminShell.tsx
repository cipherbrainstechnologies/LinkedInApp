"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminMe } from "@/shared/api";
import { Badge } from "@applyflow/ui-web";

const NAV = [
  { href: "/", label: "Dashboard", section: "Overview" },
  { href: "/users", label: "Users", section: "Customers", permission: "customers.read" },
  { href: "/applications", label: "Applications", section: "Customers", permission: "customers.read" },
  { href: "/commercial/plans", label: "Plans & quotas", section: "Commercial", permission: "plans.manage" },
  { href: "/intelligence/providers", label: "AI providers", section: "Intelligence", permission: "ai.manage" },
  { href: "/operations/reports", label: "Reports", section: "Operations", permission: "customers.read" },
  { href: "/operations/audit", label: "Audit log", section: "Operations", permission: "audit.read" },
  { href: "/demo", label: "Demo center", section: "Configuration" },
];

export function AdminShell({
  admin,
  children,
  onLogout,
}: {
  admin: AdminMe;
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  let lastSection = "";

  return (
    <div className="af-admin-layout">
      <aside className="af-admin-rail" aria-label="Admin navigation">
        <div className="af-row" style={{ marginBottom: "var(--space-lg)" }}>
          <strong style={{ fontSize: "var(--text-lg)" }}>ApplyFlow</strong>
          {admin.demoMode && <Badge variant="demo">Demo</Badge>}
        </div>
        <nav>
          {NAV.filter((item) => !item.permission || admin.permissions.includes(item.permission)).map((item) => {
            const showSection = item.section !== lastSection;
            lastSection = item.section;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <div key={item.href}>
                {showSection && <div className="af-admin-rail-section">{item.section}</div>}
                <Link href={item.href} data-active={active ? "true" : undefined}>
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="af-admin-main">
        <div className="af-admin-topbar">
          <span className="af-muted">{admin.displayName} · {admin.roles.join(", ")}</span>
          <button type="button" className="af-btn af-btn-secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
        <div className="af-container">{children}</div>
      </div>
    </div>
  );
}
