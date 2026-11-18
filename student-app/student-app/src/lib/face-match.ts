// Server-side helpers: no ML model needed, just vector math.

export const DESCRIPTOR_LENGTH = 128;
/** Max Euclidean distance to count as the same person (lower = stricter). */
export const FACE_MATCH_THRESHOLD = 0.5;

/** Validates a descriptor coming from the client. */
export function parseDescriptor(input: unknown): number[] | null {
    if (!Array.isArray(input) || input.length !== DESCRIPTOR_LENGTH) return null;
    if (!input.every((n) => typeof n === "number" && Number.isFinite(n))) return null;
    return input as number[];
}

export function faceDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
}

export type FaceCheck =
    | { ok: true; distance: number }
    | { ok: false; reason: "NOT_ENROLLED" | "BAD_DESCRIPTOR" | "NO_MATCH" };

export function checkFace(probe: unknown, stored: number[] | null | undefined): FaceCheck {
    const p = parseDescriptor(probe);
    if (!p) return { ok: false, reason: "BAD_DESCRIPTOR" };
    if (!stored || stored.length !== DESCRIPTOR_LENGTH) return { ok: false, reason: "NOT_ENROLLED" };
    const distance = faceDistance(p, stored);
    return distance <= FACE_MATCH_THRESHOLD ? { ok: true, distance } : { ok: false, reason: "NO_MATCH" };
}

export const FACE_ERROR_MESSAGES = {
    NOT_ENROLLED: "No face is enrolled for this student. Please re-register or ask an admin.",
    BAD_DESCRIPTOR: "No face detected. Please try again.",
    NO_MATCH: "Face did not match.",
} as const;
