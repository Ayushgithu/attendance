import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "../require-auth";

const profileSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required").max(40),
    lastName: z.string().trim().max(40).optional().default(""),
    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number")
        .or(z.literal(""))
        .optional()
        .default(""),
});

/** GET /api/profile — the logged-in user's own profile. */
export async function GET(req: NextRequest) {
    const authz = await requireAuth(req, { matchId: false });
    if (authz.error) return authz.error;

    const user = await prisma.roles.findUnique({
        where: { id: authz.token.id as string },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
    });
}

/** PATCH /api/profile — update name and phone. Email is intentionally not editable. */
export async function PATCH(req: NextRequest) {
    const authz = await requireAuth(req, { matchId: false });
    if (authz.error) return authz.error;

    const parsed = profileSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json(
            { message: parsed.error.issues[0]?.message ?? "Invalid input" },
            { status: 400 }
        );
    }
    const { firstName, lastName, phone } = parsed.data;

    try {
        const user = await prisma.roles.update({
            where: { id: authz.token.id as string },
            data: { firstName: firstName, lastName: lastName, phone: phone || null },
            select: { firstName: true, lastName: true, phone: true },
        });
        return NextResponse.json({
            message: "Profile updated",
            firstName: user.firstName,
            lastName: user.lastName ?? "",
            phone: user.phone ?? "",
        });
    } catch (error) {
        console.error("profile update failed", error);
        return NextResponse.json({ message: "Could not update profile" }, { status: 500 });
    }
}
