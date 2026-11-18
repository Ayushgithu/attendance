"use client";

import { useMemo, useState, type ReactNode } from "react";
import { GitBranch, Search } from "lucide-react";
import LineIcon from "@/components/dash/LineIcon";
import { Avatar, Card, Chip, StatCard } from "@/components/dash/ui";

export type BranchRow = {
  id: string;
  branchName: string;
  createdAt: string;
  registered: number;
  enrolled: number;
  subjects: string[];
};

const AVATAR_TONES = ["primary", "info", "purple", "success", "warning"] as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Three summary tiles above the list. */
export function BranchStats({ branches, action }: { branches: BranchRow[]; action?: ReactNode }) {
  const students = branches.reduce((n, b) => n + b.registered, 0);
  const subjects = new Set(branches.flatMap((b) => b.subjects)).size;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={<LineIcon name="sliders" size={24} />} label="Branches" value={String(branches.length)} hint="Active branches" />
      <StatCard icon={<LineIcon name="users" size={24} />} label="Students registered" value={String(students)} hint="Across all branches" />
      <StatCard icon={<LineIcon name="files" size={24} />} label="Subjects in use" value={String(subjects)} hint="Linked to a branch" />
      {action}
    </div>
  );
}

/** Searchable grid of branch cards. */
export function BranchList({ branches }: { branches: BranchRow[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? branches.filter((b) => b.branchName.toLowerCase().includes(t)) : branches;
  }, [q, branches]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-medium text-slate-900/90">
          All branches <span className="ml-1 text-sm text-slate-900/50">({shown.length})</span>
        </div>
        <label className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search branch…"
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[rgb(var(--brand-rgb)/0.15)]"
          />
        </label>
      </div>

      {branches.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <Avatar size={56}><GitBranch size={24} /></Avatar>
          <div className="mt-2 text-base font-medium text-slate-900/90">No branches yet</div>
          <div className="text-sm text-slate-900/50">Use “Add new branch” to create your first one.</div>
        </Card>
      ) : shown.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-slate-900/50">No branch matches “{q}”.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((b, i) => (
            <Card key={b.id} hover className="flex flex-col gap-4 p-5 hover:border-[color:var(--brand)]">
              <div className="flex items-center gap-3">
                <Avatar color={AVATAR_TONES[i % AVATAR_TONES.length]} size={44}>
                  {b.branchName.trim().charAt(0).toUpperCase()}
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900/90">{b.branchName}</div>
                  <div className="text-xs text-slate-900/50">Created {fmtDate(b.createdAt)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <div className="text-xl font-bold text-slate-900/90">{b.registered}</div>
                  <div className="text-xs text-slate-900/55">Registered</div>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <div className="text-xl font-bold text-slate-900/90">{b.enrolled}</div>
                  <div className="text-xs text-slate-900/55">Enrolled</div>
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-900/50">Subjects</div>
                {b.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {b.subjects.map((s) => (
                      <Chip key={s} color="primary" small>{s}</Chip>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-900/45">Not used yet</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
