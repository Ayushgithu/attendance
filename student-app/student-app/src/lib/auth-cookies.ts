/**
 * Cookie names are unique to this app.
 *
 * Browsers share cookies between ports on the same host (localhost:3000 and localhost:3001
 * see each other's cookies). With NextAuth's default names, logging in or out of one app
 * overwrote or deleted the other app's session. Giving each app its own names keeps the
 * admin/teacher session and the student session completely independent.
 */
const secure = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
const prefix = secure ? "__Secure-" : "";

export const SESSION_COOKIE_NAME = `${prefix}student.session-token`;

const base = { sameSite: "lax" as const, path: "/", secure };

export const authCookies = {
    sessionToken: { name: SESSION_COOKIE_NAME, options: { ...base, httpOnly: true } },
    callbackUrl: { name: `${prefix}student.callback-url`, options: base },
    csrfToken: { name: `student.csrf-token`, options: { ...base, httpOnly: true } },
};
