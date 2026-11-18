import { requireAuth } from "../require-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../api-response";


export async function GET(req: NextRequest) {
    const authz = await requireAuth(req);
    if (authz.error) return authz.error;

    try {
        const id = req.nextUrl.searchParams.get("id");
        console.log("id", id);
        const dateParam = req.nextUrl.searchParams.get("date");

        if (!id) {
            return NextResponse.json(
                new ApiResponse({
                    status: 400,
                    data: "Invalid request: Missing ID",
                })
            );
        }

        // Validate and parse date, defaulting to today if not provided.
        const date = dateParam ? new Date(dateParam) : new Date();
        if (isNaN(date.getTime())) {
            return NextResponse.json(
                new ApiResponse({ status: 400, data: "Invalid date format" })
            );
        }

        // Fetching data for a single **day**, not the whole month.
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        // Fetch attendance summary for the given day
        const attendanceRecord = await getAttendanceSummary(startDate, id);
        // If no data found, return 404
        if (Object.keys(attendanceRecord).length === 0) {
            return NextResponse.json(
                new ApiResponse({
                    status: 404,
                    data: "No attendance records found",
                })
            );
        }

        // Return successful response
        return NextResponse.json(
            new ApiResponse({
                status: 200,
                data: { attendanceRecord },
            })
        );
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json(
            new ApiResponse({ status: 500, data: "Internal server error" })
        );
    }
}

// 🔹 Fetch attendance summary for a specific day
const getAttendanceSummary = async (date: Date, id: string) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const scheduleAttendance = await prisma.scheduleAttendance.findMany({
        where: {
            teacherId: id,
            startTime: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: {
            Attendance: {
                select: {
                    status: true,
                    student: {
                        select: {
                            Firstname: true,
                            role: true,
                            batch: { select: { batch: true } },
                            rollNumber: true,
                        },
                    },
                    subject: {
                        select: {
                            subjectName: true,
                        },
                    },
                },
            },
        },
    });

    const summary: Record<
        string,
        Record<string, { total: number; present: number; absent: number }>
    > = {};

    scheduleAttendance.forEach((record) => {
        record.Attendance.forEach((att) => {
            const subjectName = att.subject?.subjectName || "Unknown Subject";
            const batchName = att.student?.batch?.batch || "Unknown Batch";

            if (!summary[subjectName]) {
                summary[subjectName] = {};
            }
            if (!summary[subjectName][batchName]) {
                summary[subjectName][batchName] = {
                    total: 0,
                    present: 0,
                    absent: 0,
                };
            }

            summary[subjectName][batchName].total++;
            if (att.status === "PRESENT") {
                summary[subjectName][batchName].present++;
            } else {
                summary[subjectName][batchName].absent++;
            }
        });
    });

    return summary;
};
