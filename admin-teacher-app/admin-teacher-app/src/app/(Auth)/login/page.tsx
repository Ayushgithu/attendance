"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LineIcon from "@/components/dash/LineIcon";
import { PAGE_BG } from "@/components/dash/ui";
import { LoginType, signInSchema } from "@/schema/signInSchema";
import { Logo } from "../../Navbar";

/** This app only signs in admin and teacher accounts (enforced again on the server in auth-options.ts). */
const COPY = {
    heading: "Admin & Teacher portal.",
    blurb: "Sign in to schedule classes, mark attendance by face and manage reports.",
    points: [["Classes and schedules","Enroll students and schedule attendance"],["Reports","Filter, export and email low-attendance students"]] as [string, string][],
    cardTitle: "Admin / Teacher sign in",
    wrongAccount: "Invalid email or password, or this is not an admin or teacher account.",
};

export default function LoginPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") router.replace("/dashboard");
    }, [status, router]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginType>({
        resolver: zodResolver(signInSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: LoginType) => {
        try {
            const res = await signIn("credentials", { ...values, redirect: false });
            if (res?.ok) {
                router.replace("/dashboard");
                return;
            }
            Swal.fire({
                icon: "error",
                title: "Login failed",
                text: COPY.wrongAccount,
                confirmButtonColor: "#0077B6",
            });
        } catch (error) {
            console.error("Login error:", error);
            Swal.fire({ icon: "error", title: "Oops...", text: "Something went wrong. Please try again!" });
        }
    };

    return (
        <div className="dash-light flex min-h-screen flex-col lg:flex-row" style={{ background: PAGE_BG }}>
            {/* Left: brand panel */}
            <div
                className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex lg:w-[42%]"
                style={{ background: "linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 55%, var(--brand-light) 100%)" }}
            >
                <div aria-hidden className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10" />
                <div aria-hidden className="absolute -right-10 top-20 h-48 w-48 rounded-full bg-white/10" />
                <Link href="/" className="relative flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/20">
                        <LineIcon name="ok" size={24} className="text-white" />
                    </span>
                    <span className="text-xl font-extrabold tracking-tight">AttendanceFace</span>
                </Link>
                <div className="relative">
                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight">{COPY.heading}</h1>
                    <p className="mt-3 max-w-sm text-lg text-white/85">{COPY.blurb}</p>
                    <ul className="mt-8 space-y-4">
                        {COPY.points.map(([t, d]) => (
                            <li key={t} className="flex items-start gap-4">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--brand-dark)]">
                                    <LineIcon name="ok" size={14} />
                                </span>
                                <span>
                                    <span className="block font-bold">{t}</span>
                                    <span className="text-sm text-white/80">{d}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-sm text-white/70">
                    &copy; {new Date().getFullYear()} Powered by <span className="font-semibold text-white">Lexical Software</span>
                </p>
            </div>

            {/* Right: form */}
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
                <div className="mb-6 lg:hidden">
                    <Logo />
                </div>
                <Card className="w-full max-w-md border-slate-200 bg-white shadow-none">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-extrabold tracking-tight">{COPY.cardTitle}</CardTitle>
                        <CardDescription className="text-center">Enter your email and password to continue.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent>
                            <div className="grid gap-4">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" autoComplete="email" placeholder="name@example.com" {...register("email")} />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" autoComplete="current-password" placeholder="Password" {...register("password")} />
                                    {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                                </div>
                                <Button type="submit" className="w-full shadow-none" disabled={isSubmitting}>
                                    {isSubmitting ? "Signing in..." : "Sign in"}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                    <CardFooter className="justify-center text-sm text-slate-600">
                        <span>Accounts are created by an admin. Students sign in on the student site.</span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
