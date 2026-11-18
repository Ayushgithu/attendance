import withAuth from "next-auth/middleware";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";

export const proxy = withAuth(
    function authProxy() {
        return NextResponse.next();
    },
    {
        pages: { signIn: "/login" },
        cookies: { sessionToken: { name: SESSION_COOKIE_NAME } },
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                if (pathname.startsWith("/api/")) {
                    return true;
                }

                if (pathname.startsWith("/api/auth") || pathname === "/login") {
                    return true;
                }

                if (pathname === "/" || pathname.startsWith("/student")) {
                    return true;
                }

                return !!token;
            },
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*"],
};
