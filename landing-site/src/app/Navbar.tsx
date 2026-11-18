import Link from "next/link";
import LineIcon from "@/components/dash/LineIcon";
import { ADMIN_LOGIN, STUDENT_LOGIN, STUDENT_REGISTER } from "@/lib/links";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Who it's for" },
];

export function Logo({ hideTextOnMobile = false }: { hideTextOnMobile?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-[10px]"
        style={{
          background: "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 60%, var(--brand-light) 100%)",
          boxShadow: "0 4px 10px rgb(var(--brand-rgb) / 0.4)",
        }}
      >
        <LineIcon name="ok" size={24} className="text-white" />
      </span>
      <span className={`${hideTextOnMobile ? "hidden sm:inline " : ""}text-[1.2rem] font-extrabold leading-tight tracking-tight text-slate-900/90`}>
        Attendance<span className="text-[color:var(--brand)]">Face</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo hideTextOnMobile />
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-slate-900/70 transition hover:text-[color:var(--brand)]">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={ADMIN_LOGIN} className="hidden rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-block">
            Admin / Teacher
          </a>
          <a href={STUDENT_LOGIN} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Student sign in
          </a>
          <a
            href={STUDENT_REGISTER}
            className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            style={{ background: "var(--brand)" }}
          >
            Register
          </a>
        </div>
      </div>
    </header>
  );
}
