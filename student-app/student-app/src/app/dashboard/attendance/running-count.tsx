"use client";

import LineIcon from "@/components/dash/LineIcon";
import { Avatar, Card, Chip, StatCard } from "@/components/dash/ui";
import { useMyAttendance } from "@/hooks/use-my-attendance";

const AVATAR_TONES = ["primary", "info", "purple", "success", "warning"] as const;

/** Live present / absent / total counters, overall and per subject, as dashboard-style cards. */
export default function RunningCount() {
    const { data, error } = useMyAttendance();

    if (error && !data) return null;
    if (!data) return <Card className="mb-4 p-4 text-sm text-slate-900/50">Loading your attendance count…</Card>;

    const { overall, subjects, minPercent } = data;

    return (
        <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-base font-medium text-slate-900/90">Your attendance count</div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<LineIcon name="ok" size={24} />} label="Present" value={String(overall.present)} hint="Classes attended" />
                <StatCard
                    icon={<LineIcon name="warn" size={24} />}
                    label="Absent"
                    value={String(overall.absent)}
                    hint="Classes missed"
                    tone={overall.absent > 0 ? "danger" : "muted"}
                />
                <StatCard icon={<LineIcon name="list" size={24} />} label="Total" value={String(overall.total)} hint="Classes held" />
                <StatCard
                    icon={<LineIcon name="bar" size={24} />}
                    label="Percent"
                    value={`${overall.percentage}%`}
                    hint={overall.low ? `Below the ${minPercent}% minimum` : `Minimum ${minPercent}%`}
                    tone={overall.low ? "danger" : "default"}
                />
            </div>

            {subjects.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {subjects.map((s, i) => (
                        <Card key={s.subjectId} className="flex items-start gap-3 p-4 sm:p-5">
                            <Avatar color={AVATAR_TONES[i % AVATAR_TONES.length]} size={48}>
                                {s.subject.trim().charAt(0).toUpperCase()}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold uppercase tracking-wide text-slate-900/55">{s.subject}</div>
                                <div className="mt-0.5 text-2xl font-extrabold leading-tight text-slate-900/90">
                                    {s.present}/{s.total}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    {s.total === 0 ? (
                                        <Chip color="secondary" small>No classes yet</Chip>
                                    ) : (
                                        <>
                                            <Chip color={s.low ? "error" : "success"} small>{s.percentage}%</Chip>
                                            <span className="text-xs text-slate-900/55">{s.absent} absent</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
