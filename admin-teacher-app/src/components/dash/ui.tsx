"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Tailwind port of the Lexical Software (Materio / MUI) building blocks.
 * Palette: theme accent (see globals.css) + Slate. Font: Public Sans.
 */

export const DASH_FONT = "var(--font-public-sans), 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";


// Cards are flat: no shadow, just a thin light border.
export const CARD_BORDER = "border border-slate-200";

// Plain, calm page background behind every dashboard / sign-in page.
export const PAGE_BG = "#F6F8F7";

/* ───────────────────────── Card ───────────────────────── */

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-[10px] ${CARD_BORDER} ${
        hover ? "transition duration-150 " : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <div className="text-lg font-medium leading-snug tracking-[0.15px] text-slate-900/90">{title}</div>
          {subtitle && <div className="mt-0.5 text-sm text-slate-900/50">{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ───────────────────────── Hero / stats ───────────────────────── */

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  /** "muted" for offline/neutral, "danger" for problems. */
  tone?: "default" | "muted" | "danger";
}) {
  const tile = {
    default: "bg-[rgb(var(--brand-rgb)/0.08)] text-[color:var(--brand)]",
    muted: "bg-slate-100 text-slate-500",
    danger: "bg-rose-50 text-rose-600",
  }[tone];
  return (
    <Card>
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${tile}`}>{icon}</span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold uppercase tracking-wide text-slate-900/55">{label}</div>
          <div className="mt-0.5 text-2xl font-extrabold leading-tight text-slate-900/90">{value}</div>
          {hint && <div className="mt-0.5 text-xs text-slate-900/55">{hint}</div>}
        </div>
      </div>
    </Card>
  );
}

/* ───────────────────────── Chip / Avatar / Field ───────────────────────── */

export type Tone = "primary" | "success" | "warning" | "error" | "secondary" | "purple" | "info";

export const TONES: Record<Tone, { bg: string; fg: string; main: string }> = {
  primary: { bg: "rgb(var(--brand-rgb) / 0.16)", fg: "var(--brand)", main: "var(--brand)" },
  success: { bg: "rgba(16,185,129,0.16)", fg: "#059669", main: "#10B981" },
  warning: { bg: "rgba(245,158,11,0.16)", fg: "#D97706", main: "#F59E0B" },
  error: { bg: "rgba(244,63,94,0.16)", fg: "#E11D48", main: "#F43F5E" },
  secondary: { bg: "rgba(100,116,139,0.16)", fg: "#475569", main: "#64748B" },
  purple: { bg: "rgba(168,85,247,0.16)", fg: "#9333EA", main: "#A855F7" },
  info: { bg: "rgba(14,165,233,0.16)", fg: "#0284C7", main: "#0EA5E9" },
};

export type ChipColor = Tone;

/** MUI "light skin, rounded" chip. */
export function Chip({
  color = "secondary",
  children,
  small = false,
}: {
  color?: Tone;
  children: ReactNode;
  small?: boolean;
}) {
  const c = TONES[color];
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium whitespace-nowrap ${
        small ? "px-2 py-[1px] text-[11px]" : "px-3 py-[3px] text-[13px]"
      }`}
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

export function Avatar({
  children,
  color = "primary",
  size = 46,
}: {
  children: ReactNode;
  color?: Tone;
  size?: number;
}) {
  const c = TONES[color];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, background: c.bg, color: c.fg, fontSize: size * 0.4 }}
    >
      {children}
    </div>
  );
}

export function Field({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-slate-900/60">{k}</div>
      <div className="truncate text-sm font-semibold text-slate-900/90">{v}</div>
    </div>
  );
}


/** Dashed "add new" tile, same size/spacing as StatCard. Works as a DialogTrigger child. */
export const AddCard = forwardRef<
  HTMLButtonElement,
  { title: string; label?: string; hint?: string } & ButtonHTMLAttributes<HTMLButtonElement>
>(function AddCard({ title, label = "Add new", hint, className = "", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={`group flex h-full w-full items-start gap-3 rounded-[10px] border border-dashed border-[color:var(--brand)]/50 bg-white p-4 text-left transition hover:border-[color:var(--brand)] hover:bg-[rgb(var(--brand-rgb)/0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-rgb)/0.3)] sm:p-5 ${className}`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[rgb(var(--brand-rgb)/0.08)] text-[color:var(--brand)] transition group-hover:bg-[color:var(--brand)] group-hover:text-white">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold uppercase tracking-wide text-[color:var(--brand)]">{label}</span>
        <span className="mt-0.5 block text-2xl font-extrabold leading-tight text-slate-900/90">{title}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-900/55">{hint}</span>}
      </span>
    </button>
  );
});
