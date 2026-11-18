import { headers } from "next/headers";

/**
 * Origin of THIS app, derived from the incoming request. Server components use it to call
 * their own /api routes, so it can never point at another app/port the way a hand-edited
 * NEXT_PUBLIC_PORT / NEXTAUTH_URL value can.
 */
export async function apiBase() {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) return process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
}
