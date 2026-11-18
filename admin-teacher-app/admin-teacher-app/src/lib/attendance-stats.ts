// Pure helpers for attendance percentages (no DB, no DOM) so they are easy to test.

/** Students below this percentage get a warning. Override with ATTENDANCE_MIN_PERCENT. */
export const MIN_PERCENT = Number(process.env.ATTENDANCE_MIN_PERCENT ?? 75);

export interface RecordLike {
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "NOT_MARKED";
    createdAt: Date | string;
    /** End of the scheduled window this record belongs to (if any). */
    sessionEnd?: Date | string | null;
}

export interface Summary {
    total: number;
    present: number;
    absent: number;
    excused: number;
    /** 0-100, one decimal. 100 when there are no counted sessions yet. */
    percentage: number;
}

/**
 * Which records count as a "session" for the percentage:
 *  - PRESENT / LATE      -> attended
 *  - ABSENT              -> missed (only when explicitly marked absent)
 *  - NOT_MARKED          -> NOT counted at all (neither present nor absent), open or closed
 *  - EXCUSED             -> ignored (neither helps nor hurts)
 */
export function summarize(records: RecordLike[], now: Date = new Date()): Summary {
    let present = 0, absent = 0, excused = 0;
    for (const r of records) {
        if (r.status === "PRESENT" || r.status === "LATE") present++;
        else if (r.status === "ABSENT") absent++;
        else if (r.status === "EXCUSED") excused++;
        // NOT_MARKED: ignored
    }
    const total = present + absent;
    const percentage = total === 0 ? 100 : Math.round((present / total) * 1000) / 10;
    return { total, present, absent, excused, percentage };
}

export const isLow = (s: Summary) => s.total > 0 && s.percentage < MIN_PERCENT;

/** CSV cell: quotes, and defuses spreadsheet formulas (=, +, -, @) so exports are safe to open. */
export function csvCell(value: unknown): string {
    let s = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
