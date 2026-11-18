import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ApiError } from "./api-error";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";

export type AppRole = "ADMIN" | "TEACHER" | "STUDENT";

interface Options {
    /** Allowed roles. Omit to allow any logged-in user. */
    roles?: AppRole[];
    /** If true (default) and the request has an `id` query param, it must be the caller's own id. */
    matchId?: boolean;
}

/**
 * Verifies the NextAuth session cookie on an API request.
 * Returns `{ token }` on success or `{ error }` (a ready-to-return response) on failure.
 */
export async function requireAuth(req: NextRequest, options: Options = {}) {
    const { roles, matchId = true } = options;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: SESSION_COOKIE_NAME });

    if (!token?.id) {
        return {
            error: NextResponse.json(new ApiError(401, "Unauthorized", "Please log in"), { status: 401 }),
        };
    }

    const role = (token.role as any)?.role as AppRole | undefined;
    if (roles && (!role || !roles.includes(role))) {
        return {
            error: NextResponse.json(new ApiError(403, "Forbidden", "Insufficient permissions"), { status: 403 }),
        };
    }

    const queryId = req.nextUrl.searchParams.get("id");
    if (matchId && queryId && queryId !== token.id) {
        return {
            error: NextResponse.json(new ApiError(403, "Forbidden", "ID does not match session"), { status: 403 }),
        };
    }

    return { token, role };
}
