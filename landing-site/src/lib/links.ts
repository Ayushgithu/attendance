// Where each login lives. Set these in .env.local (see .env.example).
const clean = (url?: string) => (url ?? "").trim().replace(/\/+$/, "");

export const STUDENT_APP = clean(process.env.NEXT_PUBLIC_STUDENT_APP_URL) || "http://localhost:3001";
export const ADMIN_APP = clean(process.env.NEXT_PUBLIC_ADMIN_APP_URL) || "http://localhost:3002";

export const STUDENT_LOGIN = `${STUDENT_APP}/login`;
export const STUDENT_REGISTER = `${STUDENT_APP}/register`;
export const ADMIN_LOGIN = `${ADMIN_APP}/login`;
