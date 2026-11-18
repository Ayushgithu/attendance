import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../api-response";
import { requireAuth } from "../require-auth";
import { ApiError } from "../api-error";
import { hashPassword } from "@/lib/password";
import type { Roles } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest) {
    const authz = await requireAuth(req, { roles: ['ADMIN'] });
    if (authz.error) return authz.error;

    try {
        const id = new URL(req.url).searchParams.get("id");


        if (!id) {
            return NextResponse.json(
                new ApiError(401, "ID not found", "ID not found")
            );
        }

        const data = await req.json();
        const { email, password, firstName, phone, lastName } = data?.values ?? {};
        // The Roles.role column is a Postgres enum: anything other than these values makes
        // Prisma throw, so normalise ("teacher" -> "TEACHER") and reject the rest clearly.
        const role = String(data?.values?.role ?? "").trim().toUpperCase();
        if (
            ![email, role, password, firstName, phone, lastName].every(
                (value) => value
            )
        ) {
            return NextResponse.json(
                new ApiError(402, "Invalid details", "Please fill in all fields")
            );
        }
        if (role !== "ADMIN" && role !== "TEACHER") {
            return NextResponse.json(
                new ApiError(402, "Invalid role", "Role must be ADMIN or TEACHER")
            );
        }

        // Check if email is already registered
        const [checkEmail, checkStudent] = await Promise.all([
            prisma.roles.findUnique({ where: { email } }),
            prisma.student.findUnique({ where: { email } }),
        ]);
        if (checkEmail || checkStudent) {
            return NextResponse.json(
                new ApiError(402, "", "Email already registered")
            );
        }

        // Create new teacher role
        const teacher = await prisma.roles.create({
            data: { role, email, password: await hashPassword(password), firstName, phone, lastName },
        });

        if (!teacher) {
            return NextResponse.json(
                new ApiError(402, "", "Error creating account")
            );
        }

        return NextResponse.json(
            new ApiResponse({
                status: 200,
                data: "Account is created",
                message: "Successfully created",
            })
        );
    } catch (error) {
        return NextResponse.json(
            new ApiError(403, "You're not authorized", error)
        );
    }
}

// GET roles
export async function GET(req: NextRequest) {
    const authz = await requireAuth(req, { roles: ['ADMIN'] });
    if (authz.error) return authz.error;

    try {
        const id = new URL(req.url).searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                new ApiError(403, "You are not authorized")
            );
        }

        const [getUser, teacherCount, adminCount] = await Promise.all([
            prisma.roles.findMany({
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    phone: true,
                },
            }),
            prisma.roles.count({
                where: { role: "TEACHER" },
            }),
            prisma.roles.count({
                where: { role: "ADMIN" },
            }),
        ]);

        return NextResponse.json(
            new ApiResponse({
                status: 200,
                data: { getUser, teacherCount, adminCount },
                message: "Fetched successfully",
            })
        );
    } catch (error) {
        return NextResponse.json(new ApiError(401, "Unauthorized user", error));
    }
}
