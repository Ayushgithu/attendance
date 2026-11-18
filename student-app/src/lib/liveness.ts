// Liveness challenges (pure logic, no DOM/ML): "blink" or "turn your head and look back".
// A still photo (or a screenshot held up to the camera) can do neither, so it can never pass.

export interface Pt { x: number; y: number }
export type ChallengeKind = "blink" | "turn";

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Eye aspect ratio for 6 eye landmarks (open ≈ 0.25-0.35, closed < 0.15). */
function ear(L: Pt[], i: number) {
    return (dist(L[i + 1], L[i + 5]) + dist(L[i + 2], L[i + 4])) / (2 * dist(L[i], L[i + 3]));
}

/** Average EAR of both eyes from 68-point landmarks (left eye 36-41, right eye 42-47). */
export function avgEar(L: Pt[]) {
    return (ear(L, 36) + ear(L, 42)) / 2;
}

/** 0.5 = looking straight; lower/higher = head turned either way. */
export function yawRatio(L: Pt[]) {
    const span = L[45].x - L[36].x;
    return span > 0 ? (L[30].x - L[36].x) / span : 0.5;
}

export const LIVENESS = {
    /** blink = EAR drops under this fraction of the person's open-eye baseline... */
    blinkClosed: 0.72,
    /** ...and recovers above this fraction */
    blinkOpen: 0.88,
    /** frames needed to learn the open-eye baseline */
    baselineFrames: 3,
    /** |yaw - 0.5| below this counts as "facing the camera" */
    frontal: 0.07,
    /** |yaw - 0.5| above this counts as "turned" */
    turned: 0.14,
    /** give up after this many ms */
    timeoutMs: 12000,
} as const;

export interface LivenessState {
    kind: ChallengeKind;
    done: boolean;
    /** what to show the user */
    prompt: string;
    /** 0..1 */
    progress: number;
}

/**
 * Feed one frame's landmarks at a time with `update`. `L` is null when no (single) face is visible.
 */
export function createTracker(kind: ChallengeKind) {
    const C = LIVENESS;
    let stage = 0;
    let baselineSamples: number[] = [];
    let baseline = 0;
    let frontalRun = 0;

    const prompts = {
        blink: ["Look at the camera…", "Now blink", "Blink detected"],
        turn: ["Look at the camera…", "Slowly turn your head to one side", "Now look back at the camera", "Done"],
    } as const;

    function state(done: boolean): LivenessState {
        const list = prompts[kind];
        const idx = done ? list.length - 1 : Math.min(stage, list.length - 2);
        return { kind, done, prompt: list[idx], progress: done ? 1 : Math.min(0.95, stage / (list.length - 1)) };
    }

    return {
        update(L: Pt[] | null): LivenessState {
            if (!L || L.length < 48) return state(false);

            if (kind === "blink") {
                const e = avgEar(L);
                if (stage === 0) {
                    // learn the open-eye baseline (use the max so a half-closed start does not lower it)
                    baselineSamples.push(e);
                    if (baselineSamples.length >= C.baselineFrames) {
                        baseline = Math.max(...baselineSamples);
                        stage = 1;
                    }
                } else if (stage === 1) {
                    baseline = Math.max(baseline * 0.98 + e * 0.02, e > baseline ? e : baseline * 0.98); // slow drift
                    if (e < baseline * C.blinkClosed) stage = 2;
                } else if (stage === 2) {
                    if (e > baseline * C.blinkOpen) return state(true);
                }
                return state(false);
            }

            // turn
            const off = Math.abs(yawRatio(L) - 0.5);
            if (stage === 0) {
                frontalRun = off < C.frontal ? frontalRun + 1 : 0;
                if (frontalRun >= 2) stage = 1;
            } else if (stage === 1) {
                if (off > C.turned) stage = 2;
            } else if (stage === 2) {
                frontalRun = off < C.frontal ? frontalRun + 1 : 0;
                if (frontalRun >= 2) return state(true);
            }
            return state(false);
        },
        reset() {
            stage = 0; baselineSamples = []; baseline = 0; frontalRun = 0;
        },
    };
}

export const randomChallenge = (): ChallengeKind => (Math.random() < 0.5 ? "blink" : "turn");
