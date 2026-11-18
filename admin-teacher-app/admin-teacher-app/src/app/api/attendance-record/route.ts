import type { Student, Attendance } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../api-response";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";

// this is a get method of returing the values

export async function GET(request: NextRequest): Promise<Response> {
    const authz = await requireAuth(request, { roles: ['ADMIN', 'TEACHER'], matchId: false });
    if (authz.error) return authz.error;
    const url = new URL(request.url);

    const dateString = url.searchParams.get("date");
    let currentDate = dateString ? new Date(dateString) : new Date();
    if (isNaN(currentDate.getTime())) currentDate = new Date();
    const subjectId = url.searchParams.get("subjectId") ?? undefined;
    const batchId = url.searchParams.get("batchId") ?? undefined;

    // Set the time of currentDate to midnight
    currentDate.setHours(0, 0, 0, 0);
    try {
        const user = await prisma.student.findMany({
            include: {
                Attendance: {
                    where: {
                        status: "PRESENT",
                        createdAt: {
                            gte: new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth(),
                                currentDate.getDate()
                            ),
                            lt: new Date(
                                currentDate.getFullYear(),
                                currentDate.getMonth(),
                                currentDate.getDate() + 1
                            ),
                        },
                        ...(subjectId ? { subjectId } : {}),
                        ...(batchId ? { batchId } : {})
                    },
                },

            },
            where: {
                role: "STUDENT",
            },
        });

        // Get the count of students who have attended on the current date
        const presentStudentsCount = await prisma.attendance.count({
            where: {
                status: "PRESENT",
                createdAt: {
                    gte: new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        currentDate.getDate()
                    ),
                    lt: new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        currentDate.getDate() + 1
                    ),
                },
            },
        });
        // total students are in the class room
        const totalstudent = await prisma.student.count({
            where: {
                role: "STUDENT",
            },
        });
        return NextResponse.json(
            new ApiResponse({
                status: 200,
                data: { user, presentStudentsCount, totalstudent },
                message: "Success",
            })
        );
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            new ApiError(500, "Internal Server Error", error)
        );
    }
}
