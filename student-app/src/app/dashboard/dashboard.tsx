"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import LineIcon, { type LineIconName } from "@/components/dash/LineIcon";
import { Avatar, Chip, DASH_FONT, PAGE_BG } from "@/components/dash/ui";

type Role = "ADMIN" | "TEACHER" | "STUDENT";

interface NavItem {
    href: string;
    label: string;
    icon: LineIconName;
    /** Roles that can see the item. Omit = everyone. */
    roles?: Role[];
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
    {
        title: "Attendance",
        items: [
            { href: "/dashboard/attendance", label: "My Attendance", icon: "ok" },
            { href: "/dashboard/my-attendance", label: "My Record", icon: "history" },
        ],
    },
];

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", TEACHER: "Teacher", STUDENT: "Student" };

export default function Dashboard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const user: any = session?.user;
    const role: string | undefined = user?.role?.role;
    const displayName: string = user?.Firstname || user?.name || "";

    const [navOpen, setNavOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Items visible for this role (unknown role, e.g. Google sign-in, keeps the old behaviour: show all).
    const sections = useMemo(
        () =>
            NAV_SECTIONS.map((s) => ({
                ...s,
                items: s.items.filter((i) => !i.roles || !role || i.roles.includes(role as Role)),
            })).filter((s) => s.items.length > 0),
        [role]
    );
    const pages = useMemo(() => sections.flatMap((s) => s.items), [sections]);
    const results = pages.filter((p) => p.label.toLowerCase().includes(query.trim().toLowerCase()));

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key === "Escape") {
                setSearchOpen(false);
                setMenuOpen(false);
            }
        };
        const onClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("mousedown", onClick);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("mousedown", onClick);
        };
    }, []);

    const go = (href: string) => {
        setQuery("");
        setSearchOpen(false);
        searchRef.current?.blur();
        router.push(href);
    };

    const isActive = (href: string) =>
        href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

    const initial = (displayName || "U").trim().charAt(0).toUpperCase();

    return (
        <div className="dash-light flex min-h-screen flex-1" style={{ fontFamily: DASH_FONT, background: PAGE_BG }}>
            {/* mobile backdrop */}
            {navOpen && (
                <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setNavOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-[1px_0_0_rgba(15,23,42,0.08)] ${
                    navOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <Link
                    href="/dashboard"
                    prefetch={false}
                    onClick={() => setNavOpen(false)}
                    className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-900/10 px-6"
                >
                    <span
                        className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                        style={{
                            background:
                                "linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 60%, var(--brand-light) 100%)",
                            boxShadow: "0 4px 10px rgb(var(--brand-rgb) / 0.4)",
                        }}
                    >
                        <LineIcon name="ok" size={24} className="text-white" />
                    </span>
                    <span>
                        <span className="block text-[1.25rem] font-extrabold leading-tight tracking-tight text-slate-900/90">
                            Attendance
                        </span>
                        <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-900/40">
                            Face Recognition
                        </span>
                    </span>
                </Link>

                <nav className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
                    {sections.map((section) => (
                        <div key={section.title} className="mt-4 first:mt-0">
                            <div className="mb-2 flex items-center gap-2 px-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.4px] text-slate-900/40">
                                    {section.title}
                                </span>
                                <span className="h-px grow bg-slate-900/10" />
                            </div>
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                prefetch={false}
                                                onClick={() => setNavOpen(false)}
                                                className={`flex items-center gap-3 rounded-md px-3 py-[9px] text-[0.9375rem] transition ${
                                                    active
                                                        ? "font-medium text-white"
                                                        : "text-slate-900/75 hover:bg-slate-900/[0.04]"
                                                }`}
                                                style={active ? { background: "var(--brand)" } : undefined}
                                            >
                                                <LineIcon
                                                    name={item.icon}
                                                    size={22}
                                                    className={active ? "text-white" : "text-slate-600"}
                                                />
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
                <div className="shrink-0 border-t border-slate-900/10 px-6 py-4 text-xs text-slate-900/40">
                    Powered by <span className="font-semibold text-slate-900/60">Lexical Software</span>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col pt-16">
                {/* Top bar: fixed, attached to the sidebar on desktop */}
                <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:left-[260px]">
                    <button
                        onClick={() => setNavOpen(true)}
                        aria-label="Open menu"
                        className="flex h-9 w-9 items-center justify-center rounded-md text-xl text-slate-900/70 transition hover:bg-slate-900/[0.05] lg:hidden"
                    >
                        ☰
                    </button>

                    <div className="relative w-full max-w-sm">
                        <LineIcon
                            name="search"
                            size={18}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-900/40"
                        />
                        <input
                            ref={searchRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSearchOpen(true);
                            }}
                            onFocus={() => setSearchOpen(true)}
                            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && results[0]) go(results[0].href);
                            }}
                            placeholder="Search pages…"
                            className="w-full rounded-md bg-slate-900/[0.04] py-2 pl-9 pr-12 text-sm text-slate-900/90 outline-none transition placeholder:text-slate-900/40 focus:bg-white focus:ring-1 focus:ring-[color:var(--brand)]"
                        />
                        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-300 px-1.5 text-[10px] font-semibold text-slate-900/40 sm:block">
                            Ctrl K
                        </kbd>
                        {searchOpen && (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-md bg-white py-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.15)]">
                                {results.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-slate-900/50">No pages found</div>
                                ) : (
                                    results.map((r) => (
                                        <button
                                            key={r.href}
                                            onMouseDown={() => go(r.href)}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-900/80 transition hover:bg-[rgb(var(--brand-rgb)/0.08)]"
                                        >
                                            <LineIcon name={r.icon} size={20} className="text-slate-600" />
                                            {r.label}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        {displayName && (
                            <span className="hidden items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-slate-900/70 md:flex">
                                <LineIcon name="user" size={18} className="text-slate-900/50" />
                                {displayName}
                            </span>
                        )}
                        {role && <Chip color="success">● {ROLE_LABEL[role] ?? role}</Chip>}

                        <div ref={menuRef} className="relative">
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className="relative block rounded-full"
                                aria-label="Account menu"
                            >
                                <Avatar size={38}>{initial}</Avatar>
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[color:var(--brand-light)]" />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-md bg-white py-2 shadow-[0_10px_30px_rgba(15,23,42,0.15)]">
                                    <div className="flex items-center gap-3 px-4 pb-3 pt-2">
                                        <Avatar size={40}>{initial}</Avatar>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold text-slate-900/90">
                                                {displayName || "User"}
                                            </div>
                                            <div className="text-xs text-slate-900/50">
                                                {role ? ROLE_LABEL[role] ?? role : ""}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="my-1 h-px bg-slate-900/10" />
                                    <MenuItem
                                        onClick={() => {
                                            setMenuOpen(false);
                                            router.push("/dashboard/settings/profile");
                                        }}
                                    >
                                        ⚙️ Settings
                                    </MenuItem>
                                    <div className="my-1 h-px bg-slate-900/10" />
                                    <MenuItem
                                        onClick={() =>
                                            signOut({
                                                callbackUrl:
                                                    process.env.NEXT_PUBLIC_LANDING_URL || "/login",
                                            })
                                        }
                                        danger
                                    >
                                        ↩ Logout
                                    </MenuItem>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}

function MenuItem({
    children,
    onClick,
    danger,
}: {
    children: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:bg-slate-900/[0.04] ${
                danger ? "text-[#E11D48]" : "text-slate-900/80"
            }`}
        >
            {children}
        </button>
    );
}
