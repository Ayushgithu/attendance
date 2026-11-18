"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { User2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getDescriptor, loadFaceApi } from "@/lib/face-client";
import { useLiveness } from "@/hooks/use-liveness";
export default function CameraCapture({ attendanceData }: any) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [matchResult, setMatchResult] = useState<string | null>(null);
    const [attendanceMarked, setAttendanceMarked] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false); // Track dialog open/close state
    // Hold the stream itself: the <video> unmounts when the dialog closes, so we can't
    // rely on videoRef.srcObject to find (and stop) the camera.
    const streamRef = useRef<MediaStream | null>(null);
    const openRef = useRef(false);
    const Router = useRouter();
    const { data: session } = useSession();
    const id = session?.user?.id;

    // Liveness: the person must blink or turn their head before the photo is taken
    // (a still photo can't do either). Passing it triggers the capture automatically.
    const liveness = useLiveness(videoRef, () => {
        captureAndVerify();
    });

    // Always release the camera if this component is removed while it's on.
    useEffect(() => {
        return () => {
            openRef.current = false;
            liveness.stop();
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        openRef.current = open;
        if (open) {
            loadFaceApi().catch(() => toast.error("Could not load face models."));
            startCamera().then((ok) => {
                if (ok) liveness.start();
            });
        } else {
            liveness.stop();
            stopCamera();
            resetState(); // Clear image & match result when dialog closes
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const startCamera = async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            // Dialog closed while the browser was asking for permission: release at once.
            if (!openRef.current) {
                stream.getTracks().forEach((t) => t.stop());
                return false;
            }
            stopCamera(); // never keep two streams alive
            streamRef.current = stream;
            // the dialog content mounts a moment after `open` flips; wait for the <video>
            for (let i = 0; i < 20 && !videoRef.current; i++) await new Promise((r) => setTimeout(r, 50));
            if (!videoRef.current || !openRef.current) {
                stopCamera();
                return false;
            }
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => undefined);
            return true;
        } catch (error) {
            console.error("Error accessing webcam:", error);
            toast.error("Could not open the camera. Please allow camera access.");
            return false;
        }
    };
    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            (videoRef.current.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
    };
    const resetState = () => {
        setCapturedImage(null);
        setMatchResult(null);
        setAttendanceMarked(false);
    };
    const captureAndVerify = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!video || !canvas || !context || !video.videoWidth) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/png"));
        setMatchResult("Checking face...");
        try {
            const descriptor = await getDescriptor(canvas);
            stopCamera();
            if (!descriptor) {
                setMatchResult("No face detected. Close and try again.");
                return;
            }
            await markAttendance(descriptor);
        } catch (error) {
            console.error(error);
            stopCamera();
            setMatchResult("Verification failed.");
        }
    };

    const markAttendance = async (descriptor: number[]) => {
        try {
            const response = await fetch(
                `/api/attendance?id=${id}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...attendanceData, descriptor }),
                }
            );
            if (!response.ok) {
                throw new Error(`Failed with status ${response.status}`);
            }
            const data = await response.json();
            // console.log(data);
            if (data.status === 200) {
                setMatchResult("Face verified");
                setAttendanceMarked(true);
                toast.success(data.message);
                window.dispatchEvent(new Event("attendance:marked")); // refresh the live counters
            } else {
                setMatchResult(typeof data.errors === "string" ? data.errors : "Face not verified");
                toast.error(typeof data.errors === "string" ? data.errors : "Face not verified");
            }

            Router.refresh(); // Corrected syntax
            stopCamera(); // Stop camera after attendance is marked
        } catch (error) {
            // console.error(error);
            toast.error("Failed to mark attendance.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="space-x-1" variant="ghost">
                    <User2 />
                    <span>Mark</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col items-center gap-4 p-4">
                <div className="flex flex-col items-center gap-4">
                    {!capturedImage && (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className=" w-80 h-60 border rounded-lg "
                        />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                    {capturedImage && (
                        <>
                            <h3 className="text-lg font-semibold">
                                Captured Image:
                            </h3>
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-80 h-60 border rounded-lg "
                            />
                            {matchResult && (
                                <p className="text-lg font-bold">
                                    {matchResult}
                                </p>
                            )}
                            {attendanceMarked && (
                                <p className="text-primary font-bold">
                                    Attendance Marked Successfully
                                </p>
                            )}
                        </>
                    )}
                </div>
                {!capturedImage && (
                    <div className="w-80 space-y-2 text-center">
                        {liveness.status === "timeout" ? (
                            <>
                                <p className="text-sm font-medium text-red-500">Liveness check timed out.</p>
                                <Button onClick={() => liveness.start()} className="rounded-sm">
                                    Try again
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="min-h-[1.5rem] text-base font-semibold" aria-live="polite">
                                    {liveness.info.prompt}
                                </p>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-200"
                                        style={{ width: `${Math.round(liveness.info.progress * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Live check: follow the instruction so we know it is really you.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
