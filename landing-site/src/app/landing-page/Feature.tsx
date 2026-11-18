import LineIcon, { type LineIconName } from "@/components/dash/LineIcon";

const FEATURES: { icon: LineIconName; title: string; text: string }[] = [
  { icon: "users", title: "Face-verified attendance", text: "Each student is matched against their own enrolled face, so nobody can mark attendance for a friend." },
  { icon: "ok", title: "Live-photo registration", text: "A guided camera checks lighting, distance, background and head position so every enrolment is clean." },
  { icon: "clock", title: "Scheduled sessions", text: "Teachers open an attendance window for a subject and batch; students can only mark inside it." },
  { icon: "bar", title: "Dashboard and charts", text: "Present and absent counts per subject and batch, with a calendar to look at any day." },
  { icon: "sliders", title: "Subjects, batches and branches", text: "Set up subjects, enrol students and organise batches and branches in a few clicks." },
  { icon: "gear", title: "Secure by default", text: "Passwords are hashed, every API call needs a login, and admin pages are role-protected." },
];

const STEPS = [
  { n: "1", title: "Register with a live photo", text: "A student signs up and takes a quick guided selfie, which is turned into the face data used for matching." },
  { n: "2", title: "Teacher schedules the class", text: "Pick a subject and batch and open the attendance window for the students enrolled in it." },
  { n: "3", title: "Scan to mark present", text: "The student looks at the camera. A match marks them present; a mismatch is rejected on the spot." },
];

const ROLES: { icon: LineIconName; title: string; text: string[] }[] = [
  { icon: "user", title: "Students", text: ["Mark your own attendance", "See today's classes", "Track your record"] },
  { icon: "users", title: "Teachers", text: ["Schedule attendance", "Mark by face for a class", "Manage enrolments and subjects"] },
  { icon: "gear", title: "Admins", text: ["Create teacher and admin accounts", "Manage branches and subjects", "See the whole picture"] },
];

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900/90 sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg text-slate-900/60">{text}</p>}
    </div>
  );
}

export default function Features() {
  return (
    <>
      {/* Features */}
      <section id="features" className="scroll-mt-16 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead eyebrow="Features" title="Everything attendance needs" text="From registration to reports, in one place." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgb(var(--brand-rgb)/0.1)]">
                  <LineIcon name={f.icon} size={26} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900/90">{f.title}</h3>
                <p className="mt-1.5 leading-relaxed text-slate-900/60">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead eyebrow="How it works" title="Three steps, then it runs itself" />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold text-white"
                  style={{ background: "var(--brand)", boxShadow: "0 4px 10px rgb(var(--brand-rgb) / 0.35)" }}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900/90">{s.title}</h3>
                <p className="mt-1.5 leading-relaxed text-slate-900/60">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-16 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHead eyebrow="Who it's for" title="Built for the whole classroom" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[rgb(var(--brand-rgb)/0.1)]">
                    <LineIcon name={r.icon} size={24} />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900/90">{r.title}</h3>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {r.text.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-slate-900/70">
                      <LineIcon name="ok" size={18} className="mt-0.5 shrink-0 text-[#10B981]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
