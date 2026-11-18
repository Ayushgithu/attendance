import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/auth-options";

// This app has no landing page of its own: signed-in users go to their dashboard,
// everyone else goes back to the shared landing site (or straight to /login if it is not configured).
export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  redirect(process.env.NEXT_PUBLIC_LANDING_URL || "/login");
}
