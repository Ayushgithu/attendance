import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "../api-response";
import { isDatabaseId } from "@/lib/database-id";


// Helper: Format a date-time string into a day (DD/MM/YYYY) and time (HH:MM:SS)

export async function GET(req: NextRequest): Promise<Response> {
    const authz = await requireAuth(req);
    if (authz.error) return authz.error;

  const id = req?.nextUrl?.searchParams?.get("id");
  if (!id) {
    return NextResponse.json(new ApiError(403, "id not found"));
  }

  try {
    if (!isDatabaseId(id)) {
      return NextResponse.json(new ApiError(400, "Invalid student ID"));
    }

    // Get today's start and end time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        Firstname: true,
        lastname: true,
        avatar: true,
        rollNumber: true,
        batchId: true,
        role: true,
        Enroll: {
          select: {
            id: true,
            session: true,
            year: true,
            batch: { select: { id: true, batch: true } },
            subject: { select: { id: true, subjectName: true } },
          },
        },
        Attendance: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            createdAt: true,
            subjectId: true,
            scheduleId: true,
            subject: { select: { id: true, subjectName: true } },
            // schedule:{}
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(new ApiError(404, "Student not found"));
    }

    // ALL sessions the teacher scheduled for this student's batch + enrolled subjects.
    const schedules = await prisma.scheduleAttendance.findMany({
      where: {
        batchId: student.batchId,
        subjectId: { in: student.Enroll.map((e: any) => e.subject.id) },
        startTime: { not: null },
      },
      orderBy: { startTime: "desc" },
      select: { id: true, subjectId: true, startTime: true, endTime: true },
    });

    const data = {
      ...student,
      Enroll: student.Enroll.map((enroll: any) => ({
        ...enroll,
        teacherSubject: {
          scheduleAttendance: schedules
            .filter((sc) => sc.subjectId === enroll.subject.id)
            .map(({ id, startTime, endTime }) => ({ id, startTime, endTime })),
        },
      })),
    };

    return NextResponse.json(new ApiResponse({ status: 200, data }));
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(new ApiError(500, "Something went wrong", error));
  }
}

