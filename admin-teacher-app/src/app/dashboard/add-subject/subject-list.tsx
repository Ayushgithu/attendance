"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BookOpen, Search } from "lucide-react";
import LineIcon from "@/components/dash/LineIcon";
import { Avatar, Card, Chip, StatCard } from "@/components/dash/ui";

export type SubjectRow = {
  id: string;
  subjectName: string;
  createdAt: string;
  enrolled: number;
  branches: string[];
  batches: string[];
  teachers: string[];
};

const AVATAR_TONES = ["primary", "info", "purple", "success", "warning"] as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function SubjectStats({ subjects, action }: { subjects: SubjectRow[]; action?: ReactNode }) {
  const enrolled = subjects.reduce((n, s) => n + s.enrolled, 0);
  const teachers = new Set(subjects.flatMap((s) => s.teachers)).size;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={<LineIcon name="files" size={24} />} label="Subjects" value={String(subjects.length)} hint="In the system" />
      <StatCard icon={<LineIcon name="users" size={24} />} label="Total enrollments" value={String(enrolled)} hint="Student–subject pairs" />
      <StatCard icon={<LineIcon name="user" size={24} />} label="Teachers assigned" value={String(teachers)} hint="Across all subjects" />
      {action}
    </div>
  );
}

function Row({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-900/50">{label}</div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <Chip key={i} color="primary" small>{i}</Chip>
          ))}
        </div>
      ) : (
        <span className="text-sm text-slate-900/45">{empty}</span>
      )}
    </div>
  );
}

export function SubjectGrid({ subjects }: { subjects: SubjectRow[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? subjects.filter((s) => s.subjectName.toLowerCase().includes(t)) : subjects;
  }, [q, subjects]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-medium text-slate-900/90">
          All subjects <span className="ml-1 text-sm text-slate-900/50">({shown.length})</span>
        </div>
        <label className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject…"
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[rgb(var(--brand-rgb)/0.15)]"
          />
        </label>
      </div>

      {subjects.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Avatar size={56}><BookOpen size={24} /></Avatar>
          <div className="mt-2 text-base font-medium text-slate-900/90">No subjects yet</div>
          <div className="text-sm text-slate-900/50">Use “Add new Subject” to create your first one.</div>
        </Card>
      ) : shown.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-slate-900/50">No subject matches “{q}”.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((s, i) => (
            <Card key={s.id} hover className="flex flex-col gap-4 p-5 hover:border-[color:var(--brand)]">
              <div className="flex items-center gap-3">
                <Avatar color={AVATAR_TONES[i % AVATAR_TONES.length]} size={44}>
                  {s.subjectName.trim().charAt(0).toUpperCase()}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-slate-900/90">{s.subjectName}</div>
                  <div className="text-xs text-slate-900/50">Created {fmtDate(s.createdAt)}</div>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-1.5 text-center">
                  <div className="text-lg font-bold leading-tight text-slate-900/90">{s.enrolled}</div>
                  <div className="text-[11px] text-slate-900/55">Enrolled</div>
                </div>
              </div>
              <Row label="Branches" items={s.branches} empty="Not used yet" />
              <Row label="Batches" items={s.batches} empty="—" />
              <Row label="Teachers" items={s.teachers} empty="Not assigned" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
