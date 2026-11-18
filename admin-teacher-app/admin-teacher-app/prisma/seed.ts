import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || "Admin";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running the admin seed.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const [existingRole, existingStudent] = await Promise.all([
    prisma.roles.findUnique({
      where: { email },
      select: { role: true },
    }),
    prisma.student.findUnique({
      where: { email },
      select: { id: true },
    }),
  ]);

  if (existingRole) {
    if (existingRole.role !== "ADMIN") {
      throw new Error("ADMIN_EMAIL is already assigned to a non-admin account; no changes were made.");
    }
    console.log("Admin account already exists; no changes were made.");
    return;
  }
  if (existingStudent) {
    throw new Error("ADMIN_EMAIL is already used by a student account; no changes were made.");
  }

  await prisma.roles.create({
    data: {
      email,
      password: await hashPassword(password),
      role: "ADMIN",
      firstName,
    },
  });
  console.log("Admin account created.");
}

seedAdmin()
  .catch((error: unknown) => {
    console.error("Admin seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
