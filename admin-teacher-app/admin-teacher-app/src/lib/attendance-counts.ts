import { prisma } from "@/lib/prisma";
import { summarize } from "@/lib/attendance-stats";

export type Counts = { totalPresent: number; totalAbsent: number };

/**
 * Present / absent totals per `${studentId}:${subjectId}`, computed with the same rules the
 * student portal uses (unmarked classes are not counted).
 */
export async function getCounts(studentIds: string[], subjectIds: string[]) {
    const records = await prisma.attendance.findMany({
        where: { studentId: { in: studentIds }, subjectId: { in: subjectIds } },
        select: {
            studentId: true,
            subjectId: true,
            status: true,
            createdAt: true,
            scheduleAttendance: { select: { endTime: true } },
        },
    });

    const groups = new Map<string, any[]>();
    for (const r of records) {
        const key = `${r.studentId}:${r.subjectId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({
            status: r.status,
            createdAt: r.createdAt,
            sessionEnd: r.scheduleAttendance?.endTime ?? null,
        });
    }

    const out = new Map<string, Counts>();
    for (const [key, recs] of groups) {
        const s = summarize(recs);
        out.set(key, { totalPresent: s.present, totalAbsent: s.absent });
    }
    return out;
}

export async function getCountsFor(studentId: string, subjectId: string): Promise<Counts> {
    const map = await getCounts([studentId], [subjectId]);
    return map.get(`${studentId}:${subjectId}`) ?? { totalPresent: 0, totalAbsent: 0 };
}
