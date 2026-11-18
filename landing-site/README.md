# Attendance via Face: Landing site

The ONE public landing page. It has no database and no login of its own.
Its buttons send visitors to the right app, which lives on its own domain:

| Button | Goes to |
|---|---|
| Student sign in | `NEXT_PUBLIC_STUDENT_APP_URL`/login |
| Register | `NEXT_PUBLIC_STUDENT_APP_URL`/register |
| Admin / Teacher sign in | `NEXT_PUBLIC_ADMIN_APP_URL`/login |

## Run
```bash
cp .env.example .env.local   # set the two app URLs
pnpm install
pnpm dev                     # http://localhost:3000
```
Local setup: landing on 3000, student app `pnpm dev -p 3001`, admin/teacher app `pnpm dev -p 3002`.
After a sign-out, each app sends the visitor back here (`NEXT_PUBLIC_LANDING_URL` in the app's `.env.local`).
