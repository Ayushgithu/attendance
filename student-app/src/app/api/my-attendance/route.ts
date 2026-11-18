import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../api-response";
import { ApiError } from "../api-error";
import { requireAuth } from "../require-auth";
import { isLow, MIN_PERCENT, summarize } from "@/lib/attendance-stats";


/** The logged-in student's own attendance, grouped by subject. */
export async function GET(req: NextRequest) {
    const authz = await requireAuth(req);
    if (authz.error) return authz.error;
    try {
        const studentId = String(authz.token!.id);
        // every subject the student is enrolled in, so subjects with no session yet still show up
        const enrolled = await prisma.enroll.findMany({
            where: { studentId },
            select: { subjectId: true, subject: { select: { subjectName: true } } },
        });

        const records = await prisma.attendance.findMany({
            where: { studentId: String(authz.token!.id) },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                createdAt: true,
                subjectId: true,
                subject: { select: { subjectName: true } },
                scheduleAttendance: { select: { startTime: true, endTime: true } },
            },
        });

        const bySubject = new Map<string, { subject: string; recs: any[]; history: any[] }>();
        for (const r of records as any[]) {
            if (!bySubject.has(r.subjectId)) bySubject.set(r.subjectId, { subject: r.subject.subjectName, recs: [], history: [] });
            const g = bySubject.get(r.subjectId)!;
            const end = r.scheduleAttendance?.endTime ?? null;
            g.recs.push({ status: r.status, createdAt: r.createdAt, sessionEnd: end });
            // an unmarked record whose window is still open is "upcoming", not "absent"
            const open = r.status === "NOT_MARKED" && (!end || new Date(end) > new Date());
            g.history.push({ id: r.id, date: r.scheduleAttendance?.startTime ?? r.createdAt, status: open ? "UPCOMING" : r.status === "NOT_MARKED" ? "NOT_MARKED" : r.status });
        }

        for (const e of enrolled) {
            if (!bySubject.has(e.subjectId)) bySubject.set(e.subjectId, { subject: e.subject.subjectName, recs: [], history: [] });
        }

        const subjects = [...bySubject.entries()].map(([subjectId, g]) => {
            const s = summarize(g.recs);
            return { subjectId, subject: g.subject, ...s, low: isLow(s), history: g.history.slice(0, 15) };
        });
        subjects.sort((a, b) => a.subject.localeCompare(b.subject));

        const overall = summarize(subjects.flatMap((_, i) => [...bySubject.values()][i].recs));
        return NextResponse.json(
            new ApiResponse({ status: 200, data: { overall: { ...overall, low: isLow(overall) }, subjects, minPercent: MIN_PERCENT }, message: "Success" }),
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (error) {
        console.error("my-attendance error:", error);
        return NextResponse.json(new ApiError(500, "Internal Server Error", "Failed to load attendance"), { status: 500 });
    }
}
