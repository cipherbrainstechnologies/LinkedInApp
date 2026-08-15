import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="af-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-lg)" }}>
      <div>
        <h1 className="af-h1">{title}</h1>
        {description && <p className="af-muted">{description}</p>}
      </div>
      {actions && <div className="af-row">{actions}</div>}
    </header>
  );
}

export function Card({
  children,
  highlight,
  className,
}: {
  children: ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div className={`af-card${highlight ? " af-card-highlight" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="af-kpi">
      <div className="af-kpi-value">{value}</div>
      <div className="af-kpi-label">{label}</div>
      {hint && <div className="af-muted" style={{ marginTop: "0.25rem" }}>{hint}</div>}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "demo" | "success";
}) {
  const cls =
    variant === "demo" ? "af-badge af-badge-demo" : variant === "success" ? "af-badge af-badge-success" : "af-badge";
  return <span className={cls}>{children}</span>;
}

export function Spinner() {
  return <div className="af-spinner" role="status" aria-label="Loading" />;
}

export function EmptyState({
  title,
  description,
  action,
  illustration,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <div className="af-empty">
      {illustration}
      <h2 className="af-h2">{title}</h2>
      {description && <p className="af-muted">{description}</p>}
      {action && <div style={{ marginTop: "var(--space-md)" }}>{action}</div>}
    </div>
  );
}

export function PipelineHero() {
  return (
    <svg
      className="af-empty-icon"
      viewBox="0 0 240 120"
      role="img"
      aria-label="Applications moving through a verified pipeline"
    >
      <defs>
        <linearGradient id="af-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect x="8" y="40" width="56" height="40" rx="8" fill="#E0E7FF" />
      <rect x="88" y="30" width="56" height="50" rx="8" fill="url(#af-grad)" opacity="0.9" />
      <rect x="172" y="36" width="56" height="44" rx="8" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
      <path d="M64 60 H88 M144 55 L172 58" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="120" cy="60" r="6" fill="#06B6D4" />
    </svg>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const text = label ?? status.replace(/_/g, " ");
  const variant =
    status === "SUBMITTED" || status === "VERIFIED_SUBMITTED"
      ? "success"
      : status === "WAITING_FOR_USER" || status === "MANUAL_ACTION_REQUIRED"
        ? "warning"
        : status === "FAILED" || status === "CANCELLED"
          ? "danger"
          : "default";
  return (
    <span className={`af-status af-status-${variant}`}>
      {text}
    </span>
  );
}

export function PolicyBadge({ mode }: { mode: string }) {
  const assisted = mode === "ASSISTED";
  return (
    <span className={`af-policy ${assisted ? "af-policy-assisted" : "af-policy-auto"}`}>
      {assisted ? "Assisted — you complete submission" : "Connector may auto-submit when allowed"}
    </span>
  );
}

export function Alert({
  children,
  variant = "info",
  role = "status",
}: {
  children: ReactNode;
  variant?: "info" | "error" | "success" | "warning";
  role?: "alert" | "status";
}) {
  return (
    <div className={`af-alert af-alert-${variant}`} role={role}>
      {children}
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="af-skeleton-stack" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="af-skeleton-line" style={{ width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

export function JobsEmptyIllustration() {
  return (
    <svg className="af-empty-icon" viewBox="0 0 120 100" role="img" aria-label="No jobs found">
      <rect x="10" y="20" width="100" height="60" rx="8" fill="#F1F5F9" stroke="#CBD5E1" />
      <circle cx="40" cy="45" r="10" fill="#E0E7FF" />
      <rect x="58" y="38" width="40" height="6" rx="3" fill="#CBD5E1" />
      <rect x="58" y="50" width="28" height="6" rx="3" fill="#E2E8F0" />
      <path d="M30 75 L50 55 L70 70 L90 50" stroke="#94A3B8" strokeWidth="2" fill="none" strokeDasharray="4 3" />
    </svg>
  );
}
