"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

export interface HistoryItem { id: string; date: string; status: string }
export interface SubjectStats {
    subjectId: string;
    subject: string;
    total: number;
    present: number;
    absent: number;
    percentage: number;
    low: boolean;
    history: HistoryItem[];
}
export interface MyAttendance {
    overall: { total: number; present: number; absent: number; percentage: number; low: boolean };
    subjects: SubjectStats[];
    minPercent: number;
}

/** Fired (window event) by the camera dialog right after the student marks attendance. */
export const ATTENDANCE_MARKED_EVENT = "attendance:marked";

const POLL_MS = 10_000;

/**
 * The student's live attendance totals. Refreshes every few seconds, when the tab regains focus,
 * and immediately after the student marks — so a teacher marking attendance shows up without a reload.
 */
export function useMyAttendance() {
    const [data, setData] = useState<MyAttendance | null>(null);
    const [error, setError] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const inFlight = useRef(false);

    const load = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        try {
            const r = await axios.get("/api/my-attendance", { headers: { "Cache-Control": "no-cache" } });
            if (r.data.status === 200) {
                setData(r.data.data);
                setError(false);
                setUpdatedAt(new Date());
            } else setError(true);
        } catch {
            setError(true);
        } finally {
            inFlight.current = false;
        }
    }, []);

    useEffect(() => {
        load();
        const timer = setInterval(() => {
            if (document.visibilityState === "visible") load();
        }, POLL_MS);
        const onVisible = () => document.visibilityState === "visible" && load();
        window.addEventListener("focus", load);
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener(ATTENDANCE_MARKED_EVENT, load);
        return () => {
            clearInterval(timer);
            window.removeEventListener("focus", load);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener(ATTENDANCE_MARKED_EVENT, load);
        };
    }, [load]);

    return { data, error, updatedAt, reload: load };
}
