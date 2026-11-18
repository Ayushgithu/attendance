import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireAuth } from "../../require-auth";

const schema = z.object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
});

/** PATCH /api/profile/password — change the logged-in user's password. */
export async function PATCH(req: NextRequest) {
    const authz = await requireAuth(req, { matchId: false });
    if (authz.error) return authz.error;

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json(
            { message: parsed.error.issues[0]?.message ?? "Invalid input" },
            { status: 400 }
        );
    }
    const { currentPassword, newPassword } = parsed.data;
    if (currentPassword === newPassword) {
        return NextResponse.json(
            { message: "New password must be different from the current one" },
            { status: 400 }
        );
    }

    try {
        const id = authz.token.id as string;
        const user = await prisma.student.findUnique({ where: { id }, select: { password: true } });
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        if (!(await verifyPassword(currentPassword, user.password))) {
            return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
        }
        await prisma.student.update({
            where: { id },
            data: { password: await hashPassword(newPassword) },
        });
        return NextResponse.json({ message: "Password updated" });
    } catch (error) {
        console.error("password update failed", error);
        return NextResponse.json({ message: "Could not update password" }, { status: 500 });
    }
}
