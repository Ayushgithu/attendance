import { z } from "zod";

export const addSubject = z.object({
    subjectname: z.string().trim().min(1, "Subject name is required").max(100),
});

export type AddSubject = z.infer<typeof addSubject>;
