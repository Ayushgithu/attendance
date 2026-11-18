// One-time migration: compute face descriptors for students registered before the
// Python -> TypeScript move, using the photos in public/temp/<avatar>.
//
//   npx prisma db push          # adds Student.faceDescriptor
//   npm run face:backfill       # fills it in (safe to re-run; skips students already done)
//
// Students whose photo is missing / has no clear face are listed at the end and must re-register
// (or an admin can re-upload their photo).
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { init, descriptorFromBuffer } = require("./face-node.cjs");

const { v2: cloudinary } = require("cloudinary");
const PHOTO_DIR = path.join(__dirname, "..", "public", "temp");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set to connect to PostgreSQL");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const isCloud = (a) => !!a && a.startsWith("attendance-faces/");
if (!process.env.CLOUDINARY_URL && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}
async function loadPhoto(avatar) {
  if (isCloud(avatar)) {
    const url = cloudinary.url(avatar, { type: "authenticated", sign_url: true, secure: true, format: "jpg" });
    const r = await fetch(url);
    if (!r.ok) throw new Error(`cloudinary fetch ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  const file = path.join(PHOTO_DIR, avatar || "");
  if (!avatar || !fs.existsSync(file)) throw new Error("photo file missing");
  return fs.readFileSync(file);
}


(async () => {
  await init();
  const students = await prisma.student.findMany({
    select: { id: true, email: true, avatar: true, faceDescriptor: true },
  });
  const todo = students.filter((s) => !s.faceDescriptor || s.faceDescriptor.length !== 128);
  console.log(`${todo.length} of ${students.length} students need a descriptor`);

  const failed = [];
  for (const s of todo) {
    try {
      const d = await descriptorFromBuffer(await loadPhoto(s.avatar));
      if (!d) throw new Error("no face detected");
      await prisma.student.update({ where: { id: s.id }, data: { faceDescriptor: d } });
      console.log("ok   ", s.email);
    } catch (e) {
      failed.push(`${s.email}: ${e.message}`);
      console.log("FAIL ", s.email, "-", e.message);
    }
  }
  console.log(`\nDone. ${todo.length - failed.length} updated, ${failed.length} failed.`);
  if (failed.length) console.log("Need re-registration:\n" + failed.join("\n"));
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
