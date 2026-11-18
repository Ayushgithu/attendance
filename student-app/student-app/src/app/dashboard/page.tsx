import { redirect } from "next/navigation";

// Students land on their attendance page.
export default function DashboardHome() {
    redirect("/dashboard/attendance");
}
