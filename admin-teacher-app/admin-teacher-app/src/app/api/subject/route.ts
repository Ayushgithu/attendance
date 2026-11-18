import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "../api-response";

interface Subject {
    subject: string;
}

export async function POST(req: NextRequest) {
    const authz = await requireAuth(req, { roles: ['ADMIN','TEACHER'] });
    if (authz.error) return authz.error;

    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) {
        return NextResponse.json(new ApiError(401, "User not authorized"));
    }

    try {
        const body = await req.json().catch(() => null);
        const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
        if (!subject) {
            return NextResponse.json({ status: 402, message: "Subject name is required", errors: "Subject name is required" });
        }

        const duplicate = await prisma.subject.findFirst({
            where: { subjectName: { equals: subject, mode: "insensitive" } },
            select: { id: true },
        });
        if (duplicate) {
            return NextResponse.json({ status: 409, message: "Subject already exists", errors: "This subject already exists." });
        }

        const response = await prisma.subject.create({ data: { subjectName: subject } });
        return NextResponse.json({
            status: 200,
            data: response,
            message: "Subject created successfully",
        });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ status: 500, message: "Subject not created", errors: "Subject could not be created. Please try again." });
    }
}

// get the subjects
export async function GET(req: NextRequest) {
    const authz = await requireAuth(req);
    if (authz.error) return authz.error;

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
        return NextResponse.json(new ApiError(403, "", "id not found"));
    }
    try {
        const response = await prisma.subject.findMany();
        if (response) {
            return NextResponse.json(
                new ApiResponse({
                    status: 200,
                    data: response,
                    message: "Fetched successfully",
                })
            );
        }
        return NextResponse.json(
            new ApiError(403, "Subject not found", "Subject not found")
        );
    } catch (error) {
        return NextResponse.json(
            new ApiError(403, "You are not authorized", error)
        );
    }
}
