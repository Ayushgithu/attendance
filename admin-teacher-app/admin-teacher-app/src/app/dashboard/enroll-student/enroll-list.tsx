"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ClipboardList, Search } from "lucide-react";
import LineIcon from "@/components/dash/LineIcon";
import { Avatar, Card, Chip, StatCard } from "@/components/dash/ui";

export type EnrollRow = {
  key: string;
  subject: string;
  session: string;
  year: string;
  branch: string | null;
  batch: string;
  students: number;
};

const TONES = ["primary", "info", "purple", "success", "warning"] as const;

export function EnrollStats({ rows, action }: { rows: EnrollRow[]; action?: ReactNode }) {
  const students = rows.reduce((n, r) => n + r.students, 0);
  const subjects = new Set(rows.map((r) => r.subject)).size;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={<LineIcon name="list" size={24} />} label="Enrollment groups" value={String(rows.length)} hint="Subject, batch & session" />
      <StatCard icon={<LineIcon name="users" size={24} />} label="Students enrolled" value={String(students)} hint="Across all groups" />
      <StatCard icon={<LineIcon name="files" size={24} />} label="Subjects" value={String(subjects)} hint="With enrollments" />
      {action}
    </div>
  );
}

export function EnrollList({ rows }: { rows: EnrollRow[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.subject, r.session, r.year, r.branch ?? "", r.batch].some((v) => v.toLowerCase().includes(t))
    );
  }, [q, rows]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          <div className="text-base font-medium text-slate-900/90">
            Enrollments <span className="ml-1 text-sm text-slate-900/50">({shown.length})</span>
          </div>
          <div className="text-xs text-slate-900/50">Students enrolled, by subject, branch and batch</div>
        </div>
        <label className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject, batch, year…"
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[rgb(var(--brand-rgb)/0.15)]"
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-t border-slate-200 px-6 py-14 text-center">
          <Avatar size={56}><ClipboardList size={24} /></Avatar>
          <div className="mt-2 text-base font-medium text-slate-900/90">No enrollments yet</div>
          <div className="text-sm text-slate-900/50">Use “Enroll Student” to add the first one.</div>
        </div>
      ) : shown.length === 0 ? (
        <div className="border-t border-slate-200 px-6 py-10 text-center text-sm text-slate-900/50">
          Nothing matches “{q}”.
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-900/55">
                <th className="w-12 px-5 py-3">#</th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Branch</th>
                <th className="px-3 py-3">Batch</th>
                <th className="px-3 py-3">Session</th>
                <th className="px-3 py-3">Year</th>
                <th className="px-5 py-3 text-right">Students</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.key} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                  <td className="px-5 py-3 text-slate-900/50">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar color={TONES[i % TONES.length]} size={34}>
                        {r.subject.trim().charAt(0).toUpperCase()}
                      </Avatar>
                      <span className="font-medium text-slate-900/90">{r.subject}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {r.branch ? <Chip color="info" small>{r.branch}</Chip> : <span className="text-slate-900/40">—</span>}
                  </td>
                  <td className="px-3 py-3"><Chip color="purple" small>{r.batch}</Chip></td>
                  <td className="px-3 py-3 text-slate-900/70">{r.session}</td>
                  <td className="px-3 py-3 text-slate-900/70">{r.year}</td>
                  <td className="px-5 py-3 text-right">
                    <Chip color="primary" small>{r.students}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
