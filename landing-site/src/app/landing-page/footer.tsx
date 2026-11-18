import { STUDENT_REGISTER } from "@/lib/links";
import { Logo } from "../Navbar";

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
          <a href={STUDENT_REGISTER} className="rounded-md bg-white px-7 py-3 text-base font-bold text-[color:var(--brand-dark)] shadow-lg transition hover:bg-slate-50">
            Create a student account
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Logo />
          <div className="text-center text-sm text-slate-900/50 sm:text-right">
            <p>&copy; {new Date().getFullYear()} Student Power Club. All rights reserved.</p>
            <p className="mt-0.5 font-semibold text-slate-900/70">Powered by <span className="text-[color:var(--brand)]">Lexical Software</span></p>
          </div>
        </div>
      </footer>
    </>
  );
}
