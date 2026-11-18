"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectFaces, loadFaceApi } from "@/lib/face-client";
import { createTracker, LIVENESS, randomChallenge, type LivenessState } from "@/lib/liveness";

type Status = "idle" | "running" | "passed" | "timeout";

/**
 * Runs a random liveness challenge on the live <video>. Calls `onPassed` once, when the person
 * has blinked / turned and looked back. Restart with `start()` (also used for "Try again").
 */
export function useLiveness(videoRef: React.RefObject<HTMLVideoElement | null>, onPassed: () => void) {
    const [status, setStatus] = useState<Status>("idle");
    const [info, setInfo] = useState<LivenessState>({ kind: "blink", done: false, prompt: "Starting…", progress: 0 });
    const runId = useRef(0);
    const passedCb = useRef(onPassed);
    passedCb.current = onPassed;

    const stop = useCallback(() => {
        runId.current++; // invalidates any running loop
    }, []);

    const start = useCallback(async () => {
        const id = ++runId.current;
        const tracker = createTracker(randomChallenge());
        setStatus("running");
        setInfo({ kind: "blink", done: false, prompt: "Starting…", progress: 0 });
        try {
            await loadFaceApi();
        } catch {
            if (runId.current === id) setStatus("timeout");
            return;
        }
        const work = document.createElement("canvas");
        const t0 = Date.now();
        while (runId.current === id) {
            const v = videoRef.current;
            if (v && v.videoWidth) {
                const scale = 320 / v.videoWidth;
                work.width = 320;
                work.height = Math.round(v.videoHeight * scale);
                work.getContext("2d")!.drawImage(v, 0, 0, work.width, work.height);
                try {
                    const faces = await detectFaces(work);
                    const L = faces.length === 1 ? faces[0].landmarks : null;
                    if (runId.current !== id) return;
                    const st = tracker.update(L);
                    setInfo(L ? st : { ...st, prompt: faces.length > 1 ? "Only one person, please" : "Show your face to the camera" });
                    if (st.done) {
                        setStatus("passed");
                        runId.current++;
                        passedCb.current();
                        return;
                    }
                } catch (e) {
                    console.error("liveness frame failed", e);
                }
            }
            if (Date.now() - t0 > LIVENESS.timeoutMs) {
                if (runId.current === id) setStatus("timeout");
                return;
            }
            await new Promise((r) => setTimeout(r, 40));
        }
    }, [videoRef]);

    useEffect(() => stop, [stop]);

    return { status, info, start, stop };
}
