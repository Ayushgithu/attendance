"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the page's server data every few seconds and when the tab regains focus,
 *  so a session the teacher just scheduled appears without a manual reload. */
export default function AutoRefresh({ everyMs = 10_000 }: { everyMs?: number }) {
    const router = useRouter();
    useEffect(() => {
        const tick = () => document.visibilityState === "visible" && router.refresh();
        const timer = setInterval(tick, everyMs);
        window.addEventListener("focus", tick);
        document.addEventListener("visibilitychange", tick);
        return () => {
            clearInterval(timer);
            window.removeEventListener("focus", tick);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [router, everyMs]);
    return null;
}
