import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { UserSchema } from "@/schema/UserSchema";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../api-response";
import { ApiError } from "../api-error";
import { hashPassword } from "@/lib/password";
import { parseDescriptor } from "@/lib/face-match";
import { isCloudinaryConfigured, uploadFacePhoto } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const getTextField = (name: string) => {
        const value = formData.get(name);
        return typeof value === "string" ? value.trim() : "";
    };

    const userData: UserSchema = {
        Firstname: formData.get("Firstname") as string,
        lastname: formData.get("lastname") as string,
        rollNumber: formData.get("rollNumber") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        phone: formData.get("phone") as string,
        role: formData.get("role") as string,
        batch: getTextField("batch"),
        branch: getTextField("branch"),
        avatar: formData.get("avatar") as File,
    };
    const descriptor = (() => {
        try {
            return parseDescriptor(JSON.parse(String(formData.get("descriptor") ?? "null")));
        } catch {
            return null;
        }
    })();
    const {Firstname,lastname,rollNumber,email,password,batch,avatar,branch} = userData;

    try {
        // Validation
        if (![Firstname,lastname,rollNumber,email,password,batch,branch,avatar].every((e) => e)) {
            return NextResponse.json(
                new ApiError(402, "Invalid details", "Invalid details")
            );
        }
        const existing = await prisma.student.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                new ApiError(409, "Email already registered", "Email already registered")
            );
        }
        if (!descriptor) {
            return NextResponse.json(
                new ApiError(400, "No face detected", "Please upload a clear photo of your face")
            );
        }
        // Store the captured photo in Cloudinary (private/authenticated asset).
        // Without Cloudinary credentials (local dev) fall back to the local folder.
        const photoBytes = Buffer.from(await userData.avatar.arrayBuffer());
        let avatarRef: string;
        if (isCloudinaryConfigured()) {
            try {
                avatarRef = await uploadFacePhoto(photoBytes);
            } catch (e) {
                console.error("Cloudinary upload failed:", e);
                return NextResponse.json(
                    new ApiError(502, "Photo upload failed", "Could not save your photo. Please try again.")
                );
            }
        } else {
            avatarRef = `${Date.now()}.jpeg`;
            try {
                await writeFile(`./public/temp/${avatarRef}`, new Uint8Array(photoBytes));
            } catch (e) {
                console.warn("Cloudinary is not configured and the local save failed:", e);
            }
        }

        // Insert user data into the database
        const hashedPassword = await hashPassword(password);
        const res = await prisma.$transaction(async (tx) => {
            // Match existing batch / branch names ignoring case and spacing, so "cs", "CS " and
            // "CS" all land on the same branch the admin created (no accidental duplicates).
            const batchData =
                (await tx.batch.findFirst({
                    where: { batch: { equals: batch, mode: "insensitive" } },
                    select: { id: true },
                })) ?? (await tx.batch.create({ data: { batch }, select: { id: true } }));
            const branchData =
                (await tx.branch.findFirst({
                    where: { branchName: { equals: branch, mode: "insensitive" } },
                    select: { id: true },
                })) ?? (await tx.branch.create({ data: { branchName: branch }, select: { id: true } }));

            return tx.student.create({
                data: {
                    role: "STUDENT",
                    Firstname,
                    lastname,
                    rollNumber,
                    email,
                    password: hashedPassword,
                    avatar: avatarRef, // Cloudinary public_id (or local file name in dev)
                    faceDescriptor: descriptor,
                    batch: {
                        connect: {
                            id: batchData.id,
                        },
                    },
                    branch: {
                        connect: {
                            id: branchData.id,
                        },
                    },
                },
            });
        });
        if (res) {
            return NextResponse.json(
                new ApiResponse({
                    status: 200,
                    data: "User created successfully",
                })
            );
        }
        return NextResponse.json(
            new ApiError(403, "User not created", "User not created")
        );
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            new ApiError(403, "Something went wrong", "something went wrong")
        );
    }
}


/** Public list of existing branches and batches, used as suggestions on the register form. */
export async function GET() {
    try {
        const [branches, batches] = await Promise.all([
            prisma.branch.findMany({ select: { branchName: true }, orderBy: { branchName: "asc" } }),
            prisma.batch.findMany({ select: { batch: true }, orderBy: { batch: "asc" } }),
        ]);
        return NextResponse.json({
            branches: branches.map((b) => b.branchName),
            batches: batches.map((b) => b.batch),
        });
    } catch {
        return NextResponse.json({ branches: [], batches: [] });
    }
}
