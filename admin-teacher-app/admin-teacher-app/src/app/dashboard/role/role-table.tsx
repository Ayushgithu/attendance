"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search, Users } from "lucide-react";
import LineIcon from "@/components/dash/LineIcon";
import { Avatar, Card, Chip, StatCard } from "@/components/dash/ui";

type RoleItem = {
    id: string;
    email: string;
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
    role: "ADMIN" | "TEACHER" | string;
};

const TONES = ["primary", "info", "purple", "success", "warning"] as const;

export function Role({ data, action }: { data: any; action?: ReactNode }) {
    const users: RoleItem[] = data?.getUser ?? [];
    const [q, setQ] = useState("");

    const shown = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return users;
        return users.filter((u) =>
            [u.firstName, u.lastName ?? "", u.email, u.phone ?? "", u.role].some((v) =>
                String(v).toLowerCase().includes(t)
            )
        );
    }, [q, users]);

    return (
        <div className="flex w-full flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<LineIcon name="users" size={24} />} label="Total users" value={String(users.length)} hint="Admins & teachers" />
                <StatCard icon={<LineIcon name="user" size={24} />} label="Teachers" value={String(data?.teacherCount ?? 0)} hint="Mark & schedule attendance" />
                <StatCard icon={<LineIcon name="ok" size={24} />} label="Admins" value={String(data?.adminCount ?? 0)} hint="Full access" />
                {action}
            </div>

            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
                    <div className="text-base font-medium text-slate-900/90">
                        Admins &amp; teachers <span className="ml-1 text-sm text-slate-900/50">({shown.length})</span>
                    </div>
                    <label className="relative w-full sm:w-72">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900/40" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search name, email, role…"
                            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[rgb(var(--brand-rgb)/0.15)]"
                        />
                    </label>
                </div>

                {users.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 border-t border-slate-200 px-6 py-14 text-center">
                        <Avatar size={56}><Users size={24} /></Avatar>
                        <div className="mt-2 text-base font-medium text-slate-900/90">No users yet</div>
                        <div className="text-sm text-slate-900/50">Use “Add Role” to create an admin or teacher.</div>
                    </div>
                ) : shown.length === 0 ? (
                    <div className="border-t border-slate-200 px-6 py-10 text-center text-sm text-slate-900/50">
                        Nothing matches “{q}”.
                    </div>
                ) : (
                    <div className="overflow-x-auto border-t border-slate-200">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-900/55">
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-3 py-3">Email</th>
                                    <th className="px-3 py-3">Phone</th>
                                    <th className="px-5 py-3 text-right">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((u, i) => {
                                    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                                    return (
                                        <tr key={u.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar color={TONES[i % TONES.length]} size={34}>
                                                        {(u.firstName ?? "?").trim().charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <span className="font-medium text-slate-900/90">{name || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-slate-900/70">{u.email}</td>
                                            <td className="px-3 py-3 text-slate-900/70">{u.phone || "—"}</td>
                                            <td className="px-5 py-3 text-right">
                                                <Chip color={u.role === "ADMIN" ? "purple" : "info"} small>
                                                    {u.role === "ADMIN" ? "Admin" : u.role === "TEACHER" ? "Teacher" : u.role}
                                                </Chip>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
