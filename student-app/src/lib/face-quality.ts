// Photo-quality rules for registration. Pure maths (no ML, no DOM) so it is easy to tune/test.
// All thresholds are in one place: tweak QUALITY below.

export const QUALITY = {
    /** face width as a fraction of the frame width */
    faceWidth: { min: 0.22, max: 0.62 },
    /** max distance of the face centre from the frame centre (fraction of frame size) */
    centerOffset: 0.14,
    /** average face brightness (0-255) */
    faceBrightness: { min: 70, max: 190 },
    /** max brightness difference between left and right half of the face (uneven light / shadow) */
    faceUnevenness: 35,
    /** minimum sharpness (variance of Laplacian on the face) */
    sharpness: 45,
    /** background: share of "busy" (edge) pixels outside the face must stay below this */
    backgroundBusy: 0.14,
    /** background must not be too dark */
    backgroundBrightness: { min: 70 },
    /** nose position between the eyes (0.5 = looking straight) */
    yaw: { min: 0.4, max: 0.6 },
    /** max head tilt in degrees */
    tilt: 12,
} as const;

export interface Box { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }

export interface FrameInput {
    /** grayscale pixels, row-major, w*h */
    gray: Uint8Array;
    width: number;
    height: number;
    faceCount: number;
    /** face box in the same pixel coordinates as `gray` */
    box?: Box;
    /** 68-point landmarks (same coordinates) */
    landmarks?: Point[];
}

export type CheckId = "face" | "position" | "size" | "pose" | "light" | "sharp" | "background";

export interface Check { id: CheckId; label: string; ok: boolean; hint: string }

export interface QualityResult { ok: boolean; checks: Check[] }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function meanRect(g: Uint8Array, W: number, x0: number, y0: number, x1: number, y1: number) {
    let s = 0, n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { s += g[y * W + x]; n++; }
    return n ? s / n : 0;
}

/** Variance of the Laplacian inside a rectangle (classic blur measure). */
export function laplacianVariance(g: Uint8Array, W: number, H: number, box: Box) {
    const x0 = clamp(Math.floor(box.x) + 1, 1, W - 2), x1 = clamp(Math.ceil(box.x + box.width) - 1, 1, W - 2);
    const y0 = clamp(Math.floor(box.y) + 1, 1, H - 2), y1 = clamp(Math.ceil(box.y + box.height) - 1, 1, H - 2);
    let sum = 0, sumSq = 0, n = 0;
    for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
            const i = y * W + x;
            const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - W] - g[i + W];
            sum += l; sumSq += l * l; n++;
        }
    }
    if (!n) return 0;
    const mean = sum / n;
    return sumSq / n - mean * mean;
}

/** Share of pixels with a strong gradient and mean brightness, outside an enlarged face box. */
export function backgroundStats(g: Uint8Array, W: number, H: number, box: Box, grow = 1.7) {
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const hw = (box.width * grow) / 2, hh = (box.height * grow) / 2 * 1.25; // extra room for hair/shoulders
    let edges = 0, n = 0, sum = 0;
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            if (Math.abs(x - cx) < hw && Math.abs(y - cy) < hh) continue;
            const i = y * W + x;
            const gx = g[i + 1] - g[i - 1];
            const gy = g[i + W] - g[i - W];
            if (Math.abs(gx) + Math.abs(gy) > 40) edges++;
            sum += g[i]; n++;
        }
    }
    return { busy: n ? edges / n : 0, brightness: n ? sum / n : 0, pixels: n };
}

export function evaluateFrame(f: FrameInput): QualityResult {
    const Q = QUALITY;
    const W = f.width, H = f.height;
    const checks: Check[] = [];
    const add = (id: CheckId, label: string, ok: boolean, hint: string) => checks.push({ id, label, ok, hint });

    const haveFace = f.faceCount === 1 && !!f.box;
    add("face", "One face visible", haveFace,
        f.faceCount === 0 ? "No face found. Look at the camera." : f.faceCount > 1 ? "Only one person in the frame, please." : "Looking for your face…");

    if (!haveFace || !f.box) {
        for (const [id, label] of [["position", "Centered"], ["size", "Distance"], ["pose", "Facing forward"], ["light", "Even lighting"], ["sharp", "Sharp image"], ["background", "Plain background"]] as const)
            add(id, label, false, "");
        return { ok: false, checks };
    }
    const b = f.box;

    // position
    const dx = Math.abs(b.x + b.width / 2 - W / 2) / W;
    const dy = Math.abs(b.y + b.height / 2 - H / 2) / H;
    add("position", "Centered", dx <= Q.centerOffset && dy <= Q.centerOffset, "Move so your face is in the middle of the oval.");

    // size / distance
    const rel = b.width / W;
    add("size", "Distance", rel >= Q.faceWidth.min && rel <= Q.faceWidth.max,
        rel < Q.faceWidth.min ? "Move closer to the camera." : rel > Q.faceWidth.max ? "Move a little further back." : "");

    // pose from landmarks (68-pt: 36 = left eye outer, 45 = right eye outer, 30 = nose tip)
    let poseOk = true, poseHint = "";
    const L = f.landmarks;
    if (L && L.length >= 46) {
        const eyeL = L[36], eyeR = L[45], nose = L[30];
        const span = eyeR.x - eyeL.x;
        const yaw = span > 0 ? (nose.x - eyeL.x) / span : 0.5;
        const tilt = Math.abs((Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x) * 180) / Math.PI);
        if (yaw < Q.yaw.min || yaw > Q.yaw.max) { poseOk = false; poseHint = "Look straight at the camera."; }
        else if (tilt > Q.tilt) { poseOk = false; poseHint = "Keep your head level."; }
    }
    add("pose", "Facing forward", poseOk, poseHint);

    // lighting on the face
    const fx0 = clamp(Math.floor(b.x), 0, W - 1), fx1 = clamp(Math.ceil(b.x + b.width), 1, W);
    const fy0 = clamp(Math.floor(b.y), 0, H - 1), fy1 = clamp(Math.ceil(b.y + b.height), 1, H);
    const mid = Math.floor((fx0 + fx1) / 2);
    const left = meanRect(f.gray, W, fx0, fy0, mid, fy1);
    const right = meanRect(f.gray, W, mid, fy0, fx1, fy1);
    const mean = (left + right) / 2;
    const lightOk = mean >= Q.faceBrightness.min && mean <= Q.faceBrightness.max && Math.abs(left - right) <= Q.faceUnevenness;
    add("light", "Even lighting", lightOk,
        mean < Q.faceBrightness.min ? "Too dark. Face a light source." : mean > Q.faceBrightness.max ? "Too bright. Avoid direct glare." : "Uneven light. Avoid side shadows.");

    // sharpness
    const sharp = laplacianVariance(f.gray, W, H, b);
    add("sharp", "Sharp image", sharp >= Q.sharpness, "Hold still / clean the camera lens.");

    // background
    const bg = backgroundStats(f.gray, W, H, b);
    const bgOk = bg.pixels < 200 || (bg.busy <= Q.backgroundBusy && bg.brightness >= Q.backgroundBrightness.min);
    add("background", "Plain background", bgOk,
        bg.brightness < Q.backgroundBrightness.min ? "Background is too dark." : "Stand in front of a plain, light wall.");

    return { ok: checks.every((c) => c.ok), checks };
}
