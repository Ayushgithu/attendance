import type { Attendance, Student } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../api-response";
import { checkFace, FACE_ERROR_MESSAGES } from "@/lib/face-match";
import { notifyAttendanceMarked } from "@/lib/notify";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";


// Helper: Get attendance record for a student for a specific subject on a given date.
async function getAttendanceForDate(studentId: string, subjectId: string, date: Date): Promise<Attendance | null> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.attendance.findFirst({
    where: {
      studentId,
      subjectId,
      createdAt: { gte: startOfDay, lt: endOfDay },
      status: "NOT_MARKED",
    },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
    const authz = await requireAuth(req);
    if (authz.error) return authz.error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json(new ApiError(400, "Bad Request", "ID not provided"));

  try {
    const { descriptor, subjectId, scheduleId } = await req.json();
    if (!descriptor || !subjectId || !scheduleId)
      return NextResponse.json(new ApiError(400, "Bad Request", "Missing required parameters"));

    // ✅ The student is always the logged-in user; verify the face against their stored descriptor
    const user = await prisma.student.findUnique({
      where: { id: String(authz.token!.id) },
      select: { id: true, faceDescriptor: true },
    });
    if (!user) return NextResponse.json(new ApiError(404, "Not Found", "Student not found"));

    const face = checkFace(descriptor, user.faceDescriptor);
    if (!face.ok)
      return NextResponse.json(new ApiError(401, "Face not verified", FACE_ERROR_MESSAGES[face.reason]));

    // ✅ The teacher must have SET a schedule (start + end time) for this session
    const schedule = await prisma.scheduleAttendance.findFirst({
      where: { id: scheduleId, subjectId },
      select: { id: true, startTime: true, endTime: true, batchId: true },
    });

    if (!schedule || !schedule.startTime || !schedule.endTime)
      return NextResponse.json(
        new ApiError(403, "Attendance not scheduled", "Attendance time has not been set by the teacher. You cannot mark attendance yet.")
      );

    // ✅ Only inside the window the teacher set
    const now = new Date();
    if (now < schedule.startTime)
      return NextResponse.json(
        new ApiError(403, "Attendance not open", `Attendance has not started yet. It opens at ${schedule.startTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}.`)
      );
    if (now > schedule.endTime)
      return NextResponse.json(
        new ApiError(403, "Attendance closed", "The attendance window has closed.")
      );

    // ✅ Check if attendance already marked
    const attendanceForToday = await prisma.attendance.findFirst({
      where: { studentId: user.id, subjectId, status: "NOT_MARKED", scheduleId: schedule.id },
    });
    if (!attendanceForToday)
      return NextResponse.json(new ApiResponse({ status: 200, data: {}, message: "Attendance already marked" }));

    // ✅ Mark attendance for today's schedule
    await prisma.attendance.update({
      where: {
        id: attendanceForToday.id,
        studentId: user.id,
        subjectId,
        scheduleId: schedule.id,
      },
      data: {
        studentId: user.id,
        subjectId,
        scheduleId: schedule.id,
        status: "PRESENT",
      },
    });

    await notifyAttendanceMarked(user.id, subjectId);

    return NextResponse.json(new ApiResponse({ status: 200, data: {}, message: "Attendance marked successfully" }));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(new ApiError(500, "Internal Server Error", "Failed to mark attendance"));
  }
}
export async function GET(req: NextRequest): Promise<Response> {
    const authz = await requireAuth(req, { roles: ['ADMIN','TEACHER'] });
    if (authz.error) return authz.error;

  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const response = await prisma.student.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true, email: true, Firstname: true, lastname: true, avatar: true,
        rollNumber: true, batchId: true, role: true, phone: true, branchId: true,
        Attendance: {
          where: { status: "PRESENT", createdAt: { gte: currentDate } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(new ApiResponse({ status: 200, data: response, message: "Fetched successfully" }));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(new ApiError(500, "Internal Server Error", "Failed to fetch data"));
  }
}