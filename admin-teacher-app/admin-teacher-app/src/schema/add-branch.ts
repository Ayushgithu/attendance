import { z } from "zod";

export const addBranch = z.object({
    branch: z.string().trim().min(1, "Branch is required"),
});

export type AddBranch = z.infer<typeof addBranch>;
