import { cookies } from "next/headers";

/** Forwards the logged-in user's cookies when a server component calls our own API. */
export async function serverHeaders() {
    return { cookie: (await cookies()).toString() };
}
