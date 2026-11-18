import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";
import { ApiResponse } from "../api-response";
import { isDatabaseId } from "@/lib/database-id";


interface ScheduleAttendance {
    startTime: Date;
    endTime: Date;
    subjectId: string;
    batchId: string;
    branchId: string;
}

export async function POST(req: NextRequest) {
    const authz = await requireAuth(req, { roles: ['ADMIN','TEACHER'] });
    if (authz.error) return authz.error;

    const teacherId = new URL(req.url).searchParams.get("id");

    if (!isDatabaseId(teacherId)) {
        return NextResponse.json(new ApiError(400, "Invalid input", "Invalid teacher ID"));
    }

    try {
        const { subjectId, startTime, endTime, batchId }: ScheduleAttendance = await req.json();

        if (![subjectId, teacherId, startTime, endTime, batchId].every(Boolean)) {
            return NextResponse.json(new ApiError(400, "Invalid input", "Missing required details"));
        }

        // Check if the teacher is assigned to the subject
        // Prefer the assignment for this exact batch (that's the one students are enrolled under).
        const teacherSubject =
            (await prisma.teacherSubject.findFirst({
                where: { teacherId, subjectId, BatchId: batchId },
                select: { id: true },
            })) ??
            (await prisma.teacherSubject.findFirst({
                where: { teacherId, subjectId },
                select: { id: true },
            }));

        if (!teacherSubject) {
            return NextResponse.json(new ApiError(403, "Teacher not assigned to subject", "Teacher is not assigned to this subject"));
        }

        // Check if attendance is already scheduled for the same day
        const existingSchedule = await prisma.scheduleAttendance.findFirst({
            where: {
                // teacherSubjectId: teacherSubject.id,
                batchId: batchId,
                subjectId: subjectId,
                teacherId: teacherId,
                startTime: {
                    gte: new Date(new Date(startTime).setHours(0, 0, 0, 0)),
                    lte: new Date(new Date(startTime).setHours(23, 59, 59, 999))
                }
            }
        });

        // console.log("Existing schedule:", existingSchedule);
        if (existingSchedule) {
            // If schedule exists, update only endTime
            const updatedSchedule = await prisma.scheduleAttendance.update({
                where: { id: existingSchedule.id },
                data: { endTime: new Date(endTime) }
            });
            if (updatedSchedule) {

                return NextResponse.json(new ApiResponse({ status: 200, data: "schedule is updated" }));
            }
            return NextResponse.json(new ApiError(500, "Internal server error", "Failed to update schedule"));

        }

        // Retrieve students from the batch
        const students = await prisma.student.findMany({
            where: { batchId },
            select: { id: true },
        });

        if (!students.length) {
            return NextResponse.json(new ApiError(404, "No students found", "No students found in this batch"));
        }

        // Create the schedule and its initial attendance records.
        const newSchedule = await prisma.scheduleAttendance.create({
            data: {
                teacherId,
                batchId,
                subjectId,
                teacherSubjectId: teacherSubject.id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                Attendance: {
                    create: students.map(student => ({
                        status: "NOT_MARKED",
                        student: { connect: { id: student.id } },
                        subject: { connect: { id: subjectId } },
                        batch: { connect: { id: batchId } },
                        teacher: { connect: { id: teacherId } },
                    })),
                },
            },
        });

        return NextResponse.json(new ApiResponse({ status: 200, data: newSchedule }));

    } catch (error) {
        console.error("Error creating schedule:", error);
        return NextResponse.json(new ApiError(500, "Internal server error", error));
    }
}
