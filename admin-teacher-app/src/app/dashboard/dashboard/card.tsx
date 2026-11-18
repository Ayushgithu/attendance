'use client'

import LineIcon from "@/components/dash/LineIcon";
import { StatCard } from "@/components/dash/ui";

export default function CardWithFormList({ data }: any) {
    const d = data ?? {};
    const items = [
        { label: "Students", icon: "users", value: d.student, hint: `${d.batchCount ?? 0} batches` },
        { label: "Teachers", icon: "user", value: d.role, hint: `${d.branchCount ?? 0} branches` },
        { label: "Subjects", icon: "files", value: d.subjectCount, hint: "Across all branches" },
        { label: "Attendance Records", icon: "ok", value: d.attendance, hint: "All time" },
    ] as const;
    return (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {items.map((item) => (
                <StatCard
                    key={item.label}
                    icon={<LineIcon name={item.icon} size={24} />}
                    label={item.label}
                    value={String(item.value ?? 0)}
                    hint={item.hint}
                />
            ))}
        </div>
    )
}
