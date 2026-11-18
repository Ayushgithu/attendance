"use client";

import { useMyAttendance } from "@/hooks/use-my-attendance";
import LineIcon from "@/components/dash/LineIcon";
import { Card, CardHeader, Chip, StatCard, type Tone } from "@/components/dash/ui";

const STATUS_TONE: Record<string, Tone> = {
    PRESENT: "success",
    LATE: "warning",
    ABSENT: "error",
    EXCUSED: "info",
    UPCOMING: "secondary",
    NOT_MARKED: "secondary",
};

export default function MyAttendancePage() {
    const { data, error, updatedAt } = useMyAttendance();

    if (error && !data) return <Card className="p-8 text-center text-slate-900/60">Could not load your attendance.</Card>;
    if (!data) return <Card className="p-8 text-center text-slate-900/50">Loading…</Card>;

    const { overall, subjects, minPercent } = data;
    const lowSubjects = subjects.filter((s) => s.low);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-900/50">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
            </div>
            {lowSubjects.length > 0 && (
                <div className="flex items-start gap-3 rounded-[10px] border border-rose-200 bg-rose-50 p-4 text-rose-700">
                    <LineIcon name="warn" size={22} className="mt-0.5 shrink-0 text-rose-600" />
                    <div className="text-sm">
                        <b>Low attendance:</b> you are below {minPercent}% in {lowSubjects.map((s) => s.subject).join(", ")}. Attend upcoming classes to bring it up.
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<LineIcon name="bar" size={24} />} label="Overall" value={`${overall.percentage}%`} hint={overall.low ? `Below ${minPercent}%` : "On track"} />
                <StatCard icon={<LineIcon name="ok" size={24} />} label="Present" value={String(overall.present)} hint="Classes attended" />
                <StatCard icon={<LineIcon name="clock" size={24} />} label="Missed" value={String(overall.absent)} hint="Classes missed" />
                <StatCard icon={<LineIcon name="list" size={24} />} label="Classes held" value={String(overall.total)} hint="So far" />
            </div>

            {subjects.length === 0 ? (
                <Card className="p-10 text-center text-slate-900/50">No attendance recorded yet.</Card>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {subjects.map((s) => (
                        <Card key={s.subjectId}>
                            <CardHeader
                                title={s.subject}
                                subtitle={`${s.present} of ${s.total} classes attended`}
                                action={<Chip color={s.low ? "error" : "success"}>{s.percentage}%</Chip>}
                            />
                            <div className="px-6 pb-4">
                                <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${Math.min(100, s.percentage)}%`, background: s.low ? "#F43F5E" : "#10B981" }}
                                    />
                                    <div className="absolute inset-y-0 w-px bg-slate-900/40" style={{ left: `${minPercent}%` }} title={`Minimum ${minPercent}%`} />
                                </div>
                                <div className="mt-1 text-right text-[11px] text-slate-900/40">minimum {minPercent}%</div>
                            </div>
                            <div className="border-t border-slate-100 px-6 py-4">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-900/40">Recent classes</div>
                                <div className="flex flex-wrap gap-2">
                                    {s.history.map((h) => (
                                        <span key={h.id} className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-900/60">
                                            {new Date(h.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                            <Chip color={STATUS_TONE[h.status] ?? "secondary"} small>{h.status.replace("_", " ").toLowerCase()}</Chip>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
