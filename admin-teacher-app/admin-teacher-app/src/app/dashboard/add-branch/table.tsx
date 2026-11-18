import { prisma } from "@/lib/prisma";
import { BranchStats, BranchList } from "./branch-list";
import { SubjectForm } from "./subject-form";

// Always read fresh data so new branches / enrollments show up after router.refresh().
export const dynamic = "force-dynamic";

async function getBranches() {
  try {
    const [branches, enrollments] = await Promise.all([
      prisma.branch.findMany({
        orderBy: { branchName: "asc" },
        select: {
          id: true,
          branchName: true,
          createdAt: true,
          _count: { select: { students: true } }, // students registered in this branch
        },
      }),
      // every enrollment row = one student enrolled in one subject under a branch
      prisma.enroll.findMany({
        where: { branchId: { not: null } },
        select: {
          branchId: true,
          studentId: true,
          subject: { select: { subjectName: true } },
        },
      }),
    ]);

    const stats = new Map<string, { students: Set<string>; subjects: Set<string> }>();
    for (const e of enrollments) {
      const s = stats.get(e.branchId!) ?? { students: new Set(), subjects: new Set() };
      s.students.add(e.studentId);
      s.subjects.add(e.subject.subjectName);
      stats.set(e.branchId!, s);
    }

    return branches.map((b) => ({
      id: b.id,
      branchName: b.branchName,
      createdAt: b.createdAt.toISOString(),
      registered: b._count.students,
      enrolled: stats.get(b.id)?.students.size ?? 0,
      subjects: [...(stats.get(b.id)?.subjects ?? [])].sort(),
    }));
  } catch (error) {
    console.error("Error fetching branches:", error);
    return null;
  }
}

export async function Subject() {
  const branches = await getBranches();

  if (branches === null) {
    return (
      <div className="w-full rounded-[10px] border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">
        Could not load branches. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <BranchStats branches={branches} action={<SubjectForm />} />
      <BranchList branches={branches} />
    </div>
  );
}
