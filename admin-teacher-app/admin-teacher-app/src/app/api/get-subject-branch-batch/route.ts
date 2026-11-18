import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../api-response";
import { isDatabaseId } from "@/lib/database-id";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const authz = await requireAuth(req);
    if (authz.error) return authz.error;

    const id = req.nextUrl.searchParams.get("id");

    if (!isDatabaseId(id)) {
        return NextResponse.json(new ApiError(400, "Invalid input", "Invalid input"))
    }

    try {
        const [branch, batch, subject] = await Promise.all([
            // get branch
            await prisma.branch.findMany({
                select: {
                    id: true,
                    branchName: true
                }
            }),
            // get batch
            await prisma.batch.findMany({
                select: {
                    id: true,
                    batch: true
                }
            }),
            // get subject
            await prisma.subject.findMany({
                select: {
                    id: true,
                    subjectName: true
                }
            }),
        ])

        const [batchCount, branchCount, subjectCount, student, role, attendance] = await Promise.all([
            // get branch
            await prisma.branch.count({}),
            // get batch
            await prisma.batch.count({}),
            // get subject
            await prisma.subject.count({}),
            await prisma.student.count({
                where: {
                    role: "STUDENT"
                }
            }),
            await prisma.roles.count({
                where: {
                    role: "TEACHER"
                }
            }),
            await prisma.attendance.count({})
        ])
        return NextResponse.json(new ApiResponse({
            status: 200,
            data: { batch, branch, subject, batchCount, branchCount, subjectCount, student, role, attendance },
            message: "Get Subject Branch"
        }))
    }
    catch (error) {
        return NextResponse.json(new ApiError(500, "Internal Server Error", error))
    }
}