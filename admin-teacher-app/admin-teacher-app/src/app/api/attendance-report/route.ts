import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../api-response";
import { ApiError } from "../api-error";
import { requireAuth } from "../require-auth";
import { isLow, MIN_PERCENT, summarize, toCsv } from "@/lib/attendance-stats";
import { mailTemplates, sendMail } from "@/lib/mailer";


interface Row {
    studentId: string;
    email: string;
    roll: string;
    name: string;
    batch: string;
    subjectId: string;
    subject: string;
    total: number;
    present: number;
    absent: number;
    percentage: number;
    low: boolean;
}

async function buildReport(url: URL) {
    const parse = (v: string | null, endOfDay = false) => {
        if (!v) return undefined;
        const d = new Date(v);
        if (isNaN(d.getTime())) return undefined;
        if (endOfDay) d.setHours(23, 59, 59, 999);
        else d.setHours(0, 0, 0, 0);
        return d;
    };
    const from = parse(url.searchParams.get("from"));
    const to = parse(url.searchParams.get("to"), true);
    const subjectId = url.searchParams.get("subjectId") || undefined;
    const batchId = url.searchParams.get("batchId") || undefined;

    const records = await prisma.attendance.findMany({
        where: {
            ...(subjectId ? { subjectId } : {}),
            ...(batchId ? { student: { batchId } } : {}),
            ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        select: {
            status: true,
            createdAt: true,
            studentId: true,
            subjectId: true,
            subject: { select: { subjectName: true } },
            student: { select: { email: true, Firstname: true, lastname: true, rollNumber: true, batch: { select: { batch: true } } } },
            scheduleAttendance: { select: { endTime: true } },
        },
    });

    // group by student + subject
    const groups = new Map<string, { meta: any; recs: any[] }>();
    for (const r of records as any[]) {
        const key = `${r.studentId}:${r.subjectId}`;
        if (!groups.has(key)) groups.set(key, { meta: r, recs: [] });
        groups.get(key)!.recs.push({ status: r.status, createdAt: r.createdAt, sessionEnd: r.scheduleAttendance?.endTime });
    }
    const rows: Row[] = [...groups.values()].map(({ meta, recs }) => {
        const s = summarize(recs);
        return {
            studentId: meta.studentId,
            email: meta.student.email,
            roll: meta.student.rollNumber,
            name: `${meta.student.Firstname} ${meta.student.lastname ?? ""}`.trim(),
            batch: meta.student.batch?.batch ?? "",
            subjectId: meta.subjectId,
            subject: meta.subject.subjectName,
            total: s.total,
            present: s.present,
            absent: s.absent,
            percentage: s.percentage,
            low: isLow(s),
        };
    });
    rows.sort((a, b) => a.subject.localeCompare(b.subject) || a.roll.localeCompare(b.roll, undefined, { numeric: true }));
    return rows;
}

export async function GET(req: NextRequest) {
    const authz = await requireAuth(req, { roles: ["ADMIN", "TEACHER"], matchId: false });
    if (authz.error) return authz.error;
    try {
        const url = new URL(req.url);
        const rows = await buildReport(url);

        if (url.searchParams.get("format") === "csv") {
            const csv = toCsv([
                ["Roll Number", "Name", "Batch", "Subject", "Sessions", "Present", "Absent", "Attendance %", "Status"],
                ...rows.map((r) => [r.roll, r.name, r.batch, r.subject, r.total, r.present, r.absent, r.percentage, r.low ? "LOW" : "OK"]),
            ]);
            return new Response("﻿" + csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="attendance-report-${new Date().toISOString().slice(0, 10)}.csv"`,
                },
            });
        }

        const [subjects, batches] = await Promise.all([
            prisma.subject.findMany({ select: { id: true, subjectName: true }, orderBy: { subjectName: "asc" } }),
            prisma.batch.findMany({ select: { id: true, batch: true }, orderBy: { batch: "asc" } }),
        ]);
        return NextResponse.json(
            new ApiResponse({ status: 200, data: { rows, subjects, batches, minPercent: MIN_PERCENT }, message: "Success" })
        );
    } catch (error) {
        console.error("attendance-report error:", error);
        return NextResponse.json(new ApiError(500, "Internal Server Error", "Failed to build report"), { status: 500 });
    }
}

/** Emails a low-attendance warning to every student below the minimum in the current filter. */
export async function POST(req: NextRequest) {
    const authz = await requireAuth(req, { roles: ["ADMIN", "TEACHER"], matchId: false });
    if (authz.error) return authz.error;
    try {
        const rows = (await buildReport(new URL(req.url))).filter((r) => r.low);
        let sent = 0;
        for (const r of rows) {
            const m = mailTemplates.low(r.name.split(" ")[0] || r.name, r.subject, r.percentage, MIN_PERCENT);
            if (await sendMail(r.email, m.subject, m.title, m.html, m.text)) sent++;
        }
        return NextResponse.json(
            new ApiResponse({ status: 200, data: { low: rows.length, sent }, message: `Warnings sent: ${sent} of ${rows.length}` })
        );
    } catch (error) {
        console.error("attendance-report notify error:", error);
        return NextResponse.json(new ApiError(500, "Internal Server Error", "Failed to send warnings"), { status: 500 });
    }
}
