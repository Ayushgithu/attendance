"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import LineIcon from "@/components/dash/LineIcon";
import { Card, CardHeader, Chip, StatCard } from "@/components/dash/ui";

interface Row {
    studentId: string;
    roll: string;
    name: string;
    batch: string;
    subject: string;
    total: number;
    present: number;
    absent: number;
    percentage: number;
    low: boolean;
}

const selectCls =
    "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900/80 outline-none focus:ring-1 focus:ring-[color:var(--brand)]";

export default function ReportsPage() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [batchId, setBatchId] = useState("");
    const [rows, setRows] = useState<Row[]>([]);
    const [subjects, setSubjects] = useState<{ id: string; subjectName: string }[]>([]);
    const [batches, setBatches] = useState<{ id: string; batch: string }[]>([]);
    const [minPercent, setMinPercent] = useState(75);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [onlyLow, setOnlyLow] = useState(false);

    const query = useMemo(() => {
        const p = new URLSearchParams();
        if (from) p.set("from", from);
        if (to) p.set("to", to);
        if (subjectId) p.set("subjectId", subjectId);
        if (batchId) p.set("batchId", batchId);
        return p;
    }, [from, to, subjectId, batchId]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/attendance-report?${query}`);
            if (data.status === 200) {
                setRows(data.data.rows);
                setSubjects(data.data.subjects);
                setBatches(data.data.batches);
                setMinPercent(data.data.minPercent);
            } else toast.error("Could not load the report");
        } catch {
            toast.error("Could not load the report");
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        load();
    }, [load]);

    const shown = onlyLow ? rows.filter((r) => r.low) : rows;
    const lowCount = rows.filter((r) => r.low).length;
    const students = new Set(rows.map((r) => r.studentId)).size;
    const avg = rows.length ? Math.round((rows.reduce((s, r) => s + r.percentage, 0) / rows.length) * 10) / 10 : 0;

    const sendWarnings = async () => {
        if (!lowCount || !confirm(`Email a low-attendance warning to ${lowCount} student(s)?`)) return;
        setSending(true);
        try {
            const { data } = await axios.post(`/api/attendance-report?${query}`);
            data.status === 200 ? toast.success(data.message) : toast.error("Could not send warnings");
        } catch {
            toast.error("Could not send warnings");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard icon={<LineIcon name="users" size={24} />} label="Students" value={String(students)} hint="In this report" />
                <StatCard icon={<LineIcon name="bar" size={24} />} label="Average attendance" value={`${avg}%`} hint="Across student-subject pairs" />
                <StatCard icon={<LineIcon name="warn" size={24} />} label={`Below ${minPercent}%`} value={String(lowCount)} hint="Need attention" />
            </div>

            <Card>
                <CardHeader
                    title="Attendance report"
                    subtitle="Present vs sessions held, per student and subject"
                    action={
                        <div className="flex flex-wrap justify-end gap-2">
                            <button
                                onClick={sendWarnings}
                                disabled={!lowCount || sending}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900/80 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                {sending ? "Sending…" : "✉ Email low-attendance students"}
                            </button>
                            <a
                                href={`/api/attendance-report?${query}&format=csv`}
                                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                                style={{ background: "var(--brand)" }}
                            >
                                <LineIcon name="download" size={18} className="text-white" /> Download CSV
                            </a>
                        </div>
                    }
                />

                <div className="flex flex-wrap items-end gap-3 px-6 pb-4">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-900/50">
                        From
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${selectCls} mt-1 block`} />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-900/50">
                        To
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${selectCls} mt-1 block`} />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-900/50">
                        Subject
                        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={`${selectCls} mt-1 block min-w-[160px]`}>
                            <option value="">All subjects</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>{s.subjectName}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-900/50">
                        Batch
                        <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className={`${selectCls} mt-1 block min-w-[140px]`}>
                            <option value="">All batches</option>
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>{b.batch}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex h-10 items-center gap-2 text-sm text-slate-900/70">
                        <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
                        Only below {minPercent}%
                    </label>
                </div>

                <div className="overflow-x-auto border-t border-slate-200">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-900/50">
                            <tr>
                                {["Roll", "Name", "Batch", "Subject", "Sessions", "Present", "Absent", "Attendance"].map((h) => (
                                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-900/50">Loading…</td></tr>
                            ) : shown.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-900/50">No attendance data for these filters</td></tr>
                            ) : (
                                shown.map((r) => (
                                    <tr key={`${r.studentId}-${r.subject}`} className="border-t border-slate-100 hover:bg-slate-50/60">
                                        <td className="px-4 py-3 font-medium">{r.roll}</td>
                                        <td className="px-4 py-3">{r.name}</td>
                                        <td className="px-4 py-3">{r.batch}</td>
                                        <td className="px-4 py-3">{r.subject}</td>
                                        <td className="px-4 py-3">{r.total}</td>
                                        <td className="px-4 py-3 text-emerald-600">{r.present}</td>
                                        <td className="px-4 py-3 text-rose-600">{r.absent}</td>
                                        <td className="px-4 py-3">
                                            <Chip color={r.low ? "error" : "success"} small>{r.percentage}%</Chip>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
