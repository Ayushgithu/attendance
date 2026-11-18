"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { detectFaces, getDescriptor, loadFaceApi } from "@/lib/face-client";
import { evaluateFrame, type Check } from "@/lib/face-quality";

export interface CapturedFace {
    file: File;
    descriptor: number[];
    previewUrl: string;
}

const ANALYZE_WIDTH = 320; // frames are analysed at this width (fast), the final photo is full size
const STABLE_FRAMES = 3; // all checks must pass this many analyses in a row

/**
 * Live camera capture with real-time photo-quality checks
 * (one face, centered, distance, facing forward, lighting, sharpness, plain background).
 */
export default function FaceCapture({
    onCapture,
    onClear,
}: {
    onCapture: (c: CapturedFace) => void;
    onClear?: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const workRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const stableRef = useRef(0);
    const runningRef = useRef(false);

    const [active, setActive] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [checks, setChecks] = useState<Check[]>([]);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<CapturedFace | null>(null);

    const stopCamera = useCallback(() => {
        runningRef.current = false;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    useEffect(() => stopCamera, [stopCamera]);

    const startCamera = async () => {
        setError(null);
        setResult(null);
        onClear?.();
        setLoadingModels(true);
        try {
            const [stream] = await Promise.all([
                navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
                    audio: false,
                }),
                loadFaceApi(),
            ]);
            streamRef.current = stream;
            setActive(true);
            // wait for the <video> element to mount
            requestAnimationFrame(async () => {
                const v = videoRef.current;
                if (!v) return;
                v.srcObject = stream;
                await v.play().catch(() => undefined);
                stableRef.current = 0;
                runningRef.current = true;
                loop();
            });
        } catch (e) {
            console.error(e);
            setError("Could not open the camera. Allow camera access in your browser and try again.");
        } finally {
            setLoadingModels(false);
        }
    };

    const analyze = async () => {
        const v = videoRef.current;
        const c = workRef.current;
        if (!v || !c || !v.videoWidth) return;
        const scale = ANALYZE_WIDTH / v.videoWidth;
        c.width = ANALYZE_WIDTH;
        c.height = Math.round(v.videoHeight * scale);
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const { data } = ctx.getImageData(0, 0, c.width, c.height);
        const gray = new Uint8Array(c.width * c.height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++)
            gray[j] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;

        const faces = await detectFaces(c);
        const main = faces[0];
        const res = evaluateFrame({
            gray,
            width: c.width,
            height: c.height,
            faceCount: faces.length,
            box: main?.box,
            landmarks: main?.landmarks,
        });
        stableRef.current = res.ok ? stableRef.current + 1 : 0;
        setChecks(res.checks);
        setReady(stableRef.current >= STABLE_FRAMES);
    };

    const loop = async () => {
        while (runningRef.current) {
            try {
                await analyze();
            } catch (e) {
                console.error("analyze failed", e);
            }
            await new Promise((r) => setTimeout(r, 350));
        }
    };

    const capture = async () => {
        const v = videoRef.current;
        if (!v || busy) return;
        setBusy(true);
        setError(null);
        try {
            const full = document.createElement("canvas");
            full.width = v.videoWidth;
            full.height = v.videoHeight;
            full.getContext("2d")!.drawImage(v, 0, 0);
            const descriptor = await getDescriptor(full);
            if (!descriptor) {
                setError("Couldn't read your face in that shot. Please try again.");
                return;
            }
            const blob: Blob = await new Promise((res, rej) =>
                full.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.92)
            );
            const file = new File([blob], `face-${Date.now()}.jpeg`, { type: "image/jpeg" });
            const captured = { file, descriptor, previewUrl: URL.createObjectURL(blob) };
            stopCamera();
            setActive(false);
            setResult(captured);
            onCapture(captured);
        } catch (e) {
            console.error(e);
            setError("Capture failed. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const retake = () => {
        if (result) URL.revokeObjectURL(result.previewUrl);
        startCamera();
    };

    // ----- captured state -----
    if (result) {
        return (
            <div className="flex items-center gap-4 rounded-lg border p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.previewUrl} alt="Your photo" className="h-24 w-24 rounded-md object-cover" />
                <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600">✓ Photo captured</p>
                    <Button type="button" variant="outline" size="sm" onClick={retake}>
                        Retake
                    </Button>
                </div>
            </div>
        );
    }

    // ----- idle state -----
    if (!active) {
        return (
            <div className="space-y-2">
                <Button type="button" variant="outline" className="w-full" onClick={startCamera} disabled={loadingModels}>
                    {loadingModels ? "Starting camera…" : "📷 Open camera"}
                </Button>
                <p className="text-xs text-muted-foreground">
                    Take a live photo: plain light wall behind you, good front lighting, face the camera.
                </p>
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    }

    // ----- live camera -----
    return (
        <div className="space-y-3">
            <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                />
                {/* oval guide */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
                    <defs>
                        <mask id="fc-mask">
                            <rect width="100" height="100" fill="white" />
                            <ellipse cx="50" cy="50" rx="23" ry="36" fill="black" />
                        </mask>
                    </defs>
                    <rect width="100" height="100" fill="rgba(0,0,0,0.45)" mask="url(#fc-mask)" />
                    <ellipse
                        cx="50" cy="50" rx="23" ry="36" fill="none"
                        stroke={ready ? "#10B981" : "#ffffff"} strokeWidth="0.8" strokeDasharray={ready ? "0" : "2 1.5"}
                    />
                </svg>
            </div>
            <canvas ref={workRef} className="hidden" />

            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {checks.map((c) => (
                    <li key={c.id} className={c.ok ? "text-green-600" : "text-slate-500"}>
                        {c.ok ? "✓" : "○"} {c.label}
                    </li>
                ))}
            </ul>
            {(() => {
                const first = checks.find((c) => !c.ok && c.hint);
                return (
                    <p className="min-h-[1.25rem] text-sm font-medium" aria-live="polite">
                        {ready ? "Perfect — hold still and capture." : first?.hint || "Checking…"}
                    </p>
                );
            })()}
            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={capture} disabled={!ready || busy}>
                    {busy ? "Reading face…" : "Capture"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        stopCamera();
                        setActive(false);
                    }}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}
