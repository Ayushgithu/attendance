import { NextRequest, NextResponse } from "next/server";
import { checkFace, FACE_ERROR_MESSAGES } from "@/lib/face-match";
import { notifyAttendanceMarked } from "@/lib/notify";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";
import type { Attendance } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "../api-response";
import { isDatabaseId } from "@/lib/database-id";
import { getCounts, getCountsFor } from "@/lib/attendance-counts";


// ✅ Function to check if attendance is already marked for the student today
async function getAttendanceForDate(
    studentId: string,
    subjectId: string,
    date: Date
): Promise<Attendance | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.attendance.findFirst({
        where: {
            studentId,
            subjectId,
            status: "NOT_MARKED",
            // only a session whose time has been set (start + end) for today
            scheduleAttendance: {
                startTime: { gte: startOfDay, lt: endOfDay },
                endTime: { not: null },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function POST(req: NextRequest): Promise<Response> {
    const authz = await requireAuth(req, { roles: ['ADMIN','TEACHER'] });
    if (authz.error) return authz.error;

    try {
        // ✅ Get `id` from request query
        const id = req.nextUrl.searchParams.get("id");
        if (!id)
            return NextResponse.json(
                new ApiError(400, "Bad Request", "ID not provided")
            );

        // ✅ Extract request body
        const { descriptor, subjectId, id: studentId } = await req.json();
        if (!descriptor || !subjectId || !studentId)
            return NextResponse.json(
                new ApiError(400, "Bad Request", "Missing required parameters")
            );

        // ✅ Only teachers/admins reach this point (enforced by requireAuth).
        {
            // ✅ Find the student and verify the captured face against their stored descriptor
            const user = await prisma.student.findUnique({
                where: { id: studentId },
                select: {
                    id: true,
                    batchId: true,
                    faceDescriptor: true,
                },
            });

            if (!user)
                return NextResponse.json(
                    new ApiError(404, "Not Found", "Student not found")
                );

            const face = checkFace(descriptor, user.faceDescriptor);
            if (!face.ok)
                return NextResponse.json(
                    new ApiError(401, "Face not verified", FACE_ERROR_MESSAGES[face.reason])
                );

            // ✅ Check if the student already marked attendance today
            const attendanceForToday = await getAttendanceForDate(
                // user.id,
                studentId,
                subjectId,
                new Date()
            );
            if (!attendanceForToday) {
                const counts = await getCountsFor(studentId, subjectId);
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const alreadyPresent = await prisma.attendance.findFirst({
                    where: { studentId, subjectId, status: "PRESENT", createdAt: { gte: startOfDay } },
                    select: { id: true },
                });
                if (alreadyPresent) {
                    return NextResponse.json(
                        new ApiResponse({
                            status: 200,
                            data: { counts },
                            message: "Attendance already marked",
                        })
                    );
                }
                return NextResponse.json(
                    new ApiError(
                        404,
                        "No session",
                        "No attendance session is scheduled for this student today. Schedule attendance first."
                    )
                );
            }

            // ✅ Mark attendance
            const res = await prisma.attendance.update({
                where: {
                    // id: user.id,
                    id: attendanceForToday.id,
                    studentId: studentId,
                    subjectId: subjectId,
                    // subjectId
                },
                data: {
                    studentId: user.id,
                    subjectId,
                    status: "PRESENT",
                    batchId: user.batchId,
                },
            });
            await notifyAttendanceMarked(user.id, subjectId);
            const counts = await getCountsFor(studentId, subjectId);

            return NextResponse.json(
                new ApiResponse({
                    status: 200,
                    data: { counts },
                    message: "Attendance marked successfully",
                })
            );
        }
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            new ApiError(
                500,
                "Internal Server Error",
                "Failed to mark attendance"
            )
        );
    }
}

export async function GET(req: NextRequest): Promise<Response> {
    const authz = await requireAuth(req, { roles: ['ADMIN','TEACHER'] });
    if (authz.error) return authz.error;

    try {
        // Get teacher id from query string and validate it
        const teacherId = req?.nextUrl?.searchParams?.get("id");
        if (!isDatabaseId(teacherId)) {
            return NextResponse.json(
                new ApiError(400, "Invalid or missing teacherId")
            );
        }

        // Step 1: Find teacher assigned subjects and batches
        const teacherSubjects = await prisma.teacherSubject.findMany({
            where: { teacherId },
            select: {
                subjectId: true,
                BatchId: true,
            },
        });
        if (!teacherSubjects.length) {
            return NextResponse.json(
                new ApiError(404, "No assigned batches or subjects found")
            );
        }
        const batchIds = teacherSubjects
            .map((ts) => ts.BatchId)
            .filter((id): id is string => id !== null);
        const subjectIds = teacherSubjects.map((ts) => ts.subjectId);

        // Step 2: Fetch students for those batches along with enrollment info
        const students = await prisma.student.findMany({
            where: { batchId: { in: batchIds } },
            select: {
                id: true,
                Firstname: true,
                lastname: true,
                email: true,
                rollNumber: true,
                batch: { select: { id: true, batch: true } },
                branch: { select: { id: true, branchName: true } },
                Enroll: {
                    where: { subjectId: { in: subjectIds } },
                    select: {
                        batch: { select: { id: true, batch: true } },
                        subject: { select: { id: true, subjectName: true } },
                    },
                },
            },
        });
        if (!students.length) {
            return NextResponse.json(
                new ApiError(404, "No students found for the given teacher")
            );
        }

        // Step 3: present / absent totals per student & subject (same rules as the student portal).
        const counts = await getCounts(
            students.map((st) => st.id),
            subjectIds
        );

        // Step 4: Build a summary grouped by subject for each student.
        // The key is a combination of batch, branch, and subject.
        const attendanceSummary: Record<string, any> = {};

        students.forEach((student) => {
            // For each enrollment record (each subject the student is enrolled in)
            student.Enroll.forEach((enrollment) => {
                const key = `${enrollment.batch.batch}-${student.branch.branchName}-${enrollment.subject.subjectName}`;
                if (!attendanceSummary[key]) {
                    attendanceSummary[key] = {
                        batch: enrollment.batch.batch,
                        branch: student.branch.branchName,
                        subject: enrollment.subject.subjectName,
                        subjectId: enrollment.subject.id,
                        students: [],
                    };
                }

                const c = counts.get(`${student.id}:${enrollment.subject.id}`);
                const totalPresent = c?.totalPresent ?? 0;
                const totalAbsent = c?.totalAbsent ?? 0;

                attendanceSummary[key].students.push({
                    id: student.id,
                    name: `${student.Firstname} ${student.lastname}`,
                    rollNumber: student.rollNumber,
                    email: student.email,
                    totalPresent,
                    totalAbsent,
                });
            });
        });

        // console.log(Object.values(attendanceSummary));
        return NextResponse.json(
            new ApiResponse({
                status: 200,
                data: Object.values(attendanceSummary),
            })
        );
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            new ApiError(500, "Something went wrong", error)
        );
    }
}