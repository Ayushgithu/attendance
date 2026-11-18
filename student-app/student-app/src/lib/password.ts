import bcrypt from "bcryptjs";

const isHash = (value: string) => /^\$2[aby]\$/.test(value);

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);

/** Verifies against a bcrypt hash; falls back to plain compare for legacy (unhashed) rows. */
export async function verifyPassword(plain: string, stored?: string | null) {
    if (!plain || !stored) return false;
    return isHash(stored) ? bcrypt.compare(plain, stored) : plain === stored;
}
