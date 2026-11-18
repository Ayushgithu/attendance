import { ADMIN_LOGIN, STUDENT_LOGIN } from "@/lib/links";
import LineIcon from "@/components/dash/LineIcon";
import { Chip } from "@/components/dash/ui";

const POINTS = ["Mark attendance in seconds", "Contactless and hard to fake", "Works on any laptop or phone camera"];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* soft brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgb(var(--brand-rgb) / 0.18), transparent 70%)" }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Chip color="info">● Face-recognition attendance</Chip>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900/90 sm:text-5xl lg:text-[3.4rem]">
            Attendance that takes <span className="text-[color:var(--brand)]">one look.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-900/60">
            Students register once with a live photo. After that, marking attendance is a quick face scan, with no
            registers, no proxies and no waiting in line.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={STUDENT_LOGIN}
              className="rounded-md px-6 py-3 text-base font-semibold text-white shadow-[0_6px_16px_rgb(var(--brand-rgb)/0.35)] transition hover:brightness-110"
              style={{ background: "var(--brand)" }}
            >
              Student sign in
            </a>
            <a
              href={ADMIN_LOGIN}
              className="rounded-md border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900/80 transition hover:bg-slate-50"
            >
              Admin / Teacher sign in
            </a>
          </div>
          <ul className="mt-8 space-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-[0.95rem] text-slate-900/70">
                <LineIcon name="ok" size={20} className="text-[#10B981]" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/** Illustration built in code: a camera frame with a face guide and the result chips around it. */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
          {/* stylised head & shoulders */}
          <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f2c9a8" />
                <stop offset="1" stopColor="#d9a47f" />
              </linearGradient>
            </defs>
            <path d="M70 300c10-62 60-92 130-92s120 30 130 92z" fill="#64748b" />
            <rect x="178" y="170" width="44" height="50" rx="16" fill="url(#skin)" />
            <ellipse cx="200" cy="120" rx="52" ry="64" fill="url(#skin)" />
            <path d="M146 112c-4-52 30-70 58-70s64 18 52 76c-10-30-30-40-56-40s-42 10-54 34z" fill="#1e293b" />
            <circle cx="180" cy="122" r="4.5" fill="#1e293b" />
            <circle cx="220" cy="122" r="4.5" fill="#1e293b" />
            <path d="M185 150q15 11 30 0" stroke="#9a5b3c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </svg>
          {/* guide oval */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <ellipse cx="50" cy="42" rx="23" ry="37" fill="none" stroke="#10B981" strokeWidth="0.7" />
          </svg>
          {/* corner brackets */}
          {["left-3 top-3 border-l-2 border-t-2", "right-3 top-3 border-r-2 border-t-2", "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2"].map((c) => (
            <span key={c} className={`absolute h-6 w-6 rounded-sm border-white/80 ${c}`} />
          ))}
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            Verifying…
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-900/50">
          {["One face", "Centered", "Well lit"].map((t) => (
            <span key={t} className="rounded-md bg-emerald-50 py-1.5 text-emerald-600">✓ {t}</span>
          ))}
        </div>
      </div>

      {/* floating result card */}
      <div className="absolute -bottom-12 -left-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] sm:-left-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
          <LineIcon name="ok" size={22} className="text-[#10B981]" />
        </span>
        <div>
          <div className="text-sm font-bold text-slate-900/90">Attendance marked</div>
          <div className="text-xs text-slate-900/50">Present · just now</div>
        </div>
      </div>
      <div className="absolute -right-3 -top-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.12)] sm:-right-6">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-900/40">Today</div>
        <div className="text-xl font-extrabold text-slate-900/90">24 / 28</div>
        <div className="text-xs text-slate-900/50">students present</div>
      </div>
    </div>
  );
}
