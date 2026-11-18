import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const authz = await requireAuth(req, { roles: ['ADMIN','TEACHER'] });
    if (authz.error) return authz.error;

    const id = await req.nextUrl.searchParams.get('id');

    if (!id) return NextResponse.json(new ApiError(401, 'User not authorized'));

    const body = await req.json().catch(() => null);
    const branch = typeof body?.branch === "string" ? body.branch.trim() : "";
    if (!branch) {
        return NextResponse.json({ status: 402, message: "Branch name is required", errors: "Branch name is required" });
    }

    try {
        const exists = await prisma.branch.findFirst({
            where: { branchName: { equals: branch, mode: "insensitive" } },
            select: { id: true },
        });
        if (exists) {
            return NextResponse.json({ status: 409, message: "Branch already exists", errors: "This branch already exists." });
        }

        const response = await prisma.branch.create({ data: { branchName: branch } });
        return NextResponse.json({
            status: 200,
            data: response,
            message: 'Branch created successfully'
        });
    } catch (error) {
        console.error("branch create failed", error);
        return NextResponse.json({ status: 500, message: "Branch not created", errors: "Branch could not be created. Please try again." });
    }
}

// get branch

export async function GET(req: NextRequest) {
    const authz = await requireAuth(req);
    if (authz.error) return authz.error;

    const id = await req.nextUrl.searchParams.get('id');

    if (!id) return NextResponse.json(new ApiError(401, 'User not authorized'));

    try {
        const response = await prisma.branch.findMany({});
        if (response) {
            return NextResponse.json({
                status: 200,
                data: response,
                message: 'Branch fetched successfully'
            })
        }
        return NextResponse.json(new ApiError(403, 'Branch not fetched', 'Branch not fetched'));
    } catch (error) {
        return NextResponse.json(new ApiError(403, 'Branch not fetched', error));
    }
}