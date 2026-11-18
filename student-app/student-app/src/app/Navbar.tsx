import Link from "next/link";
import LineIcon from "@/components/dash/LineIcon";

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
