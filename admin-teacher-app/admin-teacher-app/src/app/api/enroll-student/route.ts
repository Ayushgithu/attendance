import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "../api-response";
import { isDatabaseId } from "@/lib/database-id";

export async function POST(req: NextRequest) {
    const authz = await requireAuth(req, { roles: ['ADMIN','TEACHER'] });
    if (authz.error) return authz.error;

  // Get the teacher id from the URL query parameters.
  const teacherId = req.nextUrl.searchParams.get("id") ?? "";
  if (!isDatabaseId(teacherId)) {
    return NextResponse.json(
      new ApiError(401, "User not authorized", "User not authorized")
    );
  }
  // console.log("teacherId by browser", teacherId);

  // console.log("subjectId", await req.json());
  const { values } = await req.json();
  const { subjectId, session, year, batchId, branchId } = await values;
  // console.log("values", values);
  if (![subjectId, session, year, batchId,branchId].every((e) => !!e)) {
    return NextResponse.json(
      new ApiError(400, "Invalid details", "Invalid details")
    );
  }

  try {
    // Step 1: Retrieve the subject.
    // console.log("subjectId", subjectId);
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      return NextResponse.json(
        new ApiError(404, "Subject not found", "Subject not found")
      );
    }

    // Step 2: Ensure a TeacherSubject exists for this teacher + subject + batch
    // (one per batch, so schedules and enrollments of different batches never mix).
    let teacherSubject = await prisma.teacherSubject.findFirst({
      where: { teacherId, subjectId, BatchId: batchId },
    });

    if (!teacherSubject) {
      teacherSubject = await prisma.teacherSubject.create({
        data: {
          teacher: { connect: { id: teacherId } },
          subject: { connect: { id: subjectId } },
          Batch: { connect: { id: batchId } },
          branch: { connect: { id: branchId } },
        },
      });
    }

    // Step 3: Fetch students from the specified batch and branch.
    const students = await prisma.student.findMany({
      where: { batchId, branchId, role: "STUDENT" },
      select: { id: true, batchId: true },
    });

    if (students.length === 0) {
      return NextResponse.json(
        new ApiError(
          404,
          "No students found",
          "No students are registered in this branch and batch yet."
        )
      );
    }

    // Step 4: Check for already enrolled students for the subject.
    const studentIds = students.map((student) => student.id);
    const existingEnrollments = await prisma.enroll.findMany({
      where: {
        subjectId,
        studentId: { in: studentIds },
      },
      select: { studentId: true },
    });

    // Create a set of student IDs that are already enrolled.
    const enrolledStudentIds = new Set(
      existingEnrollments.map((enroll) => enroll.studentId)
    );

    // Filter out students who are already enrolled in the subject.
    const studentsToEnroll = students.filter(
      (student) => !enrolledStudentIds.has(student.id)
    );

    if (studentsToEnroll.length === 0) {
      return NextResponse.json(
        new ApiError(
          409,
          "All students are already enrolled in this subject",
          "All students of this branch and batch are already enrolled in this subject."
        )
      );
    }

    // Step 5: Create enrollments for each student not already enrolled.
    const enrollments = await prisma.enroll.createMany({
      data: studentsToEnroll.map((student) => ({
        studentId: student.id,
        subjectId,
        batchId: student.batchId!,
        session,
        year,
        teacherSubjectId: teacherSubject!.id,
        branchId,
      })),
    });

    if (enrollments.count > 0) {
      return NextResponse.json(
        new ApiResponse({
          status: 200,
          data: {
            createdEnrollments: enrollments.count,
            skippedStudents:
              studentIds.length - studentsToEnroll.length,
          },
          message: "Enrolled students successfully",
        })
      );
    }

    return NextResponse.json(
      new ApiError(
        404,
        "No enrollments created",
        "No enrollments created"
      )
    );
  } catch (error) {
    console.error("Error enrolling students:", error);
    return NextResponse.json(new ApiError(500, "Internal Server Error"));
  }
}
export async function GET(req: NextRequest): Promise<Response> {
    const authz = await requireAuth(req, { roles: ['ADMIN','TEACHER'] });
    if (authz.error) return authz.error;

  // Retrieve the teacherId from query parameters.
  const teacherId = req.nextUrl.searchParams.get("id") ?? "";
  if (!teacherId) {
    return NextResponse.json(
      new ApiError(
        401,
        "Teacher ID is required",
        "Teacher ID is required"
      )
    );
  }

  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch enrollments for the given teacher via the teacherSubject relation.
    // Include subject, batch, session, year and the attendance schedule from teacherSubject.
    const enrollments = await prisma.enroll.findMany({
      where: {
        teacherSubject: { teacherId },
      },
      select: {
        session: true,
        year: true,
        // branchId: true,
        subject: {
          select: {
            id: true,
            subjectName: true,
          },
        },
        batch: {
          select: {
            id: true,
            batch: true,
          },
        },
        branch: {
          select: {
            id: true,
            branchName: true,
          },
        },
        teacherSubject: {
          select: {
            schedules: {
              where: {
                startTime: {
                  gte: today,
                  lt: tomorrow,
                },
              },
              orderBy: { startTime: "desc" },
              take: 1,
              select: {
                id: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });

    // Group enrollments by subject, session, year, and batch.
    // Also, include the attendance schedule from teacherSubject if its startTime is today.
    const groups = new Map<
      string,
      {
        subject: { id: string; subjectName: string };
        session: string;
        year: string;
        batch: { id: string; batch: string };
        branch: { id: string; branchName: string } | null;
        studentCount: number;
        scheduleAttendance: {
          id: string;
          startTime: Date | null;
          endTime: Date | null;
        } | null;
      }
    >();

    enrollments.forEach((enroll) => {
      // Create a unique key for grouping.
      const key = `${enroll.subject.id}-${enroll.branch?.id ?? ""}-${enroll.session}-${enroll.year}-${enroll.batch.id}`;

      // Get the schedule attendance from teacherSubject.
      const validSchedule = enroll.teacherSubject?.schedules[0] ?? null;

      if (groups.has(key)) {
        groups.get(key)!.studentCount += 1;
      } else {
        groups.set(key, {
          subject: enroll.subject,
          session: enroll.session,
          year: enroll.year,
          batch: enroll.batch,
          branch: enroll.branch ?? null,
          studentCount: 1,
          scheduleAttendance: validSchedule,
        });
      }
    });

    const result = Array.from(groups.values());

    return NextResponse.json(
      new ApiResponse({
        status: 200,
        data: result,
        message:
          "Subjects with session, year, batch, student count and today’s attendance schedule retrieved successfully",
      })
    );
  } catch (error) {
    console.error("Error retrieving enrollments:", error);
    return NextResponse.json(new ApiError(500, "Internal Server Error"));
  }
}
