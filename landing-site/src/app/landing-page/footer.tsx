import { ADMIN_LOGIN, STUDENT_LOGIN, STUDENT_REGISTER } from "@/lib/links";
import { Logo } from "../Navbar";
import LineIcon, { type LineIconName } from "@/components/dash/LineIcon";

const COLUMNS: { title: string; links: { label: string; href: string; icon: LineIconName; external?: boolean }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Features", icon: "sliders", href: "#features" },
      { label: "How it works", icon: "list", href: "#how" },
      { label: "Who it's for", icon: "users", href: "#roles" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Student sign in", icon: "user", href: STUDENT_LOGIN },
      { label: "Register", icon: "ok", href: STUDENT_REGISTER },
      { label: "Admin / Teacher sign in", icon: "gear", href: ADMIN_LOGIN },
    ],
  },
];

export default function Footer() {
  return (
    <>
      {/* CTA band */}
      <section className="px-5 pb-20">
        <div
          className="mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-2xl px-6 py-14 text-center text-white"
          style={{ background: "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 60%, var(--brand-light) 100%)" }}
        >
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to retire the paper register?</h2>
          <p className="max-w-xl text-lg text-white/85">Create your account, take your live photo and you are set.</p>
          <a href={STUDENT_REGISTER} className="inline-flex items-center gap-2 rounded-md bg-white px-7 py-3 text-base font-bold text-[color:var(--brand-dark)] shadow-lg transition hover:bg-slate-50">
            <LineIcon name="user" size={20} className="text-[color:var(--brand-dark)]" />
            Create a student account
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-900/60">
              Face-recognition attendance for classrooms. Register once with a live photo, then mark attendance with a quick scan.
            </p>
          </div>

          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-900/50">{c.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex items-center gap-2 text-sm text-slate-900/70 transition hover:text-[color:var(--brand)]"
                    >
                      <LineIcon name={l.icon} size={16} className="text-[color:var(--brand)]" />
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-slate-200">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-sm text-slate-900/50 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Attendance Face. All rights reserved.</p>
            <p className="font-semibold text-slate-900/70">
              Powered by{" "}
              <a href="https://lexicalsoftware.in" target="_blank" rel="noopener noreferrer" className="text-[color:var(--brand)] hover:underline">
                Lexical Software
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
