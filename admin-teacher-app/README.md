# Attendance via Face: Admin & Teacher app

Teachers can: add subjects/branches, enroll students, schedule attendance, mark attendance by face, view students and reports.
Admins can do all of that and also create teacher/admin accounts (Roles page).
Only admin/teacher accounts can sign in here; students register in the Student app.

## Where this app sits
One shared landing site links to this app and to the other one; each app lives on its own domain.
This app has no landing page: opening `/` sends signed-in users to `/dashboard` and everyone else to `NEXT_PUBLIC_LANDING_URL`.
Signing out also returns to the landing site.

## Setup
1. Copy `.env.example` to `.env.local` and fill it in. `DATABASE_URL` (pooler, port 6543) and `DIRECT_URL` (session pooler, port 5432) must point to the SAME Supabase database as the other app.
2. `pnpm install`
3. `pnpm exec prisma generate`
4. `pnpm dev`

## Running both apps together
Student app and Admin/Teacher app are separate Next.js projects that share one database.
- Give each its own `NEXTAUTH_URL` / `NEXT_PUBLIC_PORT` (own domain or port) and its own `NEXTAUTH_SECRET`, so their login cookies never clash.
- Run migrations and the admin seed from ONE of them only (the Admin/Teacher app).

## First admin
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters) in `.env.local`, then:
```bash
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
pnpm run face:backfill   # only if students already exist without face data
```
