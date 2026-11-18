import { z } from "zod";

export const roleSchema = z.object({
    email: z.string().trim().email("A valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["ADMIN", "TEACHER"], { errorMap: () => ({ message: "Choose a role" }) }),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    phone: z.string().trim().min(10, "Phone is required"),
});

export type RoleSchema = z.infer<typeof roleSchema>;
