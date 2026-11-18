import { prisma } from "@/lib/prisma";
import { isLow, MIN_PERCENT, summarize } from "./attendance-stats";
import { mailTemplates, sendMail } from "./mailer";


/** Per-subject summary for one student (used by the history page, emails and reports). */
export async function studentSubjectSummary(studentId: string, subjectId: string) {
    const records = await prisma.attendance.findMany({
        where: { studentId, subjectId },
        select: { status: true, createdAt: true, scheduleAttendance: { select: { endTime: true } } },
    });
    return summarize(records.map((r: any) => ({ status: r.status, createdAt: r.createdAt, sessionEnd: r.scheduleAttendance?.endTime })));
}

/**
 * After a successful mark: confirmation email, plus a warning if the student is now below the minimum.
 * Never throws (a mail problem must not undo the attendance).
 */
export async function notifyAttendanceMarked(studentId: string, subjectId: string) {
    try {
        const [student, subject] = await Promise.all([
            prisma.student.findUnique({ where: { id: studentId }, select: { email: true, Firstname: true } }),
            prisma.subject.findUnique({ where: { id: subjectId }, select: { subjectName: true } }),
        ]);
        if (!student?.email || !subject) return;
        const m = mailTemplates.marked(student.Firstname, subject.subjectName, new Date());
        await sendMail(student.email, m.subject, m.title, m.html, m.text);

        const summary = await studentSubjectSummary(studentId, subjectId);
        if (isLow(summary)) {
            const w = mailTemplates.low(student.Firstname, subject.subjectName, summary.percentage, MIN_PERCENT);
            await sendMail(student.email, w.subject, w.title, w.html, w.text);
        }
    } catch (e) {
        console.error("notifyAttendanceMarked failed:", e);
    }
}
