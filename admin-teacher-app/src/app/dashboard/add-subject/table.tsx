import { prisma } from "@/lib/prisma";
import { SubjectStats, SubjectGrid } from "./subject-list";
import { SubjectForm } from "./subject-form";

// Always read fresh data so new subjects / enrollments show up after router.refresh().
export const dynamic = "force-dynamic";

async function getSubjects() {
  try {
    const [subjects, enrollments, assignments] = await Promise.all([
      prisma.subject.findMany({
        orderBy: { subjectName: "asc" },
        select: { id: true, subjectName: true, createdAt: true },
      }),
      // every enrollment row = one student enrolled in this subject, under a branch and batch
      prisma.enroll.findMany({
        select: {
          subjectId: true,
          studentId: true,
          branch: { select: { branchName: true } },
          batch: { select: { batch: true } },
        },
      }),
      prisma.teacherSubject.findMany({
        select: {
          subjectId: true,
          teacher: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const stats = new Map<string, { students: Set<string>; branches: Set<string>; batches: Set<string>; teachers: Set<string> }>();
    const get = (id: string) => {
      if (!stats.has(id)) stats.set(id, { students: new Set(), branches: new Set(), batches: new Set(), teachers: new Set() });
      return stats.get(id)!;
    };
    for (const e of enrollments) {
      const s = get(e.subjectId);
      s.students.add(e.studentId);
      if (e.branch?.branchName) s.branches.add(e.branch.branchName);
      s.batches.add(e.batch.batch);
    }
    for (const a of assignments) {
      get(a.subjectId).teachers.add(`${a.teacher.firstName} ${a.teacher.lastName ?? ""}`.trim());
    }

    return subjects.map((sub) => {
      const s = stats.get(sub.id);
      return {
        id: sub.id,
        subjectName: sub.subjectName,
        createdAt: sub.createdAt.toISOString(),
        enrolled: s?.students.size ?? 0,
        branches: [...(s?.branches ?? [])].sort(),
        batches: [...(s?.batches ?? [])].sort(),
        teachers: [...(s?.teachers ?? [])].sort(),
      };
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return null;
  }
}

export async function Subject() {
  const subjects = await getSubjects();

  if (subjects === null) {
    return (
      <div className="w-full rounded-[10px] border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">
        Could not load subjects. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <SubjectStats subjects={subjects} action={<SubjectForm />} />
      <SubjectGrid subjects={subjects} />
    </div>
  );
}
