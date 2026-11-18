"use client";
// Browser-side face descriptor extraction (face-api, runs fully in the browser).
// The library bundle and models are served from /public (vendor/ and models/).

let loading: Promise<any> | null = null;

export function loadFaceApi(): Promise<any> {
    if (!loading) {
        loading = (async () => {
            const faceapi: any = await import(
                /* webpackIgnore: true */ "/vendor/face-api.esm.js" as string
            );
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
                faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
            ]);
            return faceapi;
        })().catch((e) => {
            loading = null; // allow retry
            throw e;
        });
    }
    return loading;
}

/** Descriptor (128 numbers) of the single face in a video/canvas/image, or null if none found. */
export async function getDescriptor(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<number[] | null> {
    const faceapi = await loadFaceApi();
    const det = await faceapi
        .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    return det ? Array.from(det.descriptor as Float32Array) : null;
}

export async function getDescriptorFromFile(file: File): Promise<number[] | null> {
    const faceapi = await loadFaceApi();
    const img = await faceapi.bufferToImage(file);
    return getDescriptor(img);
}

export interface LiveFace {
    box: { x: number; y: number; width: number; height: number };
    landmarks: { x: number; y: number }[];
}

/** All faces (box + 68 landmarks) in a frame. Cheap enough to run twice a second. */
export async function detectFaces(input: HTMLVideoElement | HTMLCanvasElement): Promise<LiveFace[]> {
    const faceapi = await loadFaceApi();
    const res = await faceapi
        .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks();
    return res.map((r: any) => ({
        box: { x: r.detection.box.x, y: r.detection.box.y, width: r.detection.box.width, height: r.detection.box.height },
        landmarks: r.landmarks.positions.map((p: any) => ({ x: p.x, y: p.y })),
    }));
}
