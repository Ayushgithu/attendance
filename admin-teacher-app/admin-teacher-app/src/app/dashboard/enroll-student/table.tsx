import { apiBase } from "@/lib/api-base";
import { serverHeaders } from "@/lib/server-headers";
import { auth } from "@/app/api/auth";
import { EnrollStats, EnrollList, type EnrollRow } from "./enroll-list";
import { SubjectForm } from "./enroll-student-form";
import axios from "axios";

// Function to fetch enrollment data using the teacherId only.
// Expecting response data in the format described above.
async function fetchUserEnrollments({ id }: { id: string }) {
  try {
    const res = await axios.get(
      `${await apiBase()}/api/enroll-student?id=${id}`,
      { timeout: 5000, headers: await serverHeaders() }
    );
    return res.data; // Should be an array of enrollment groups.
  } catch (error) {
    console.error("Error fetching enrollment data:", error);
    return { data: [] };
  }
}

export const dynamic = "force-dynamic";

export default async function EnrollTable({ data }: { data?: any }) {
  const res = await auth();
  const id = res?.role.id;

  const response = await fetchUserEnrollments({ id });
  const rows: EnrollRow[] = (response.data || []).map((e: any, i: number) => ({
    key: `${e.subject?.id ?? i}-${e.session}-${e.year}-${e.batch?.id ?? i}-${e.branch?.id ?? ""}`,
    subject: e.subject?.subjectName ?? "—",
    session: String(e.session ?? "—"),
    year: String(e.year ?? "—"),
    branch: e.branch?.branchName ?? null,
    batch: e.batch?.batch ?? "—",
    students: Number(e.studentCount ?? 0),
  }));

  return (
    <div className="flex w-full flex-col gap-5">
      <EnrollStats rows={rows} action={<SubjectForm data={data} />} />
      <EnrollList rows={rows} />
    </div>
  );
}
