"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AddCard } from "@/components/dash/ui";
import Swal from "sweetalert2";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import React, { useState } from "react";
import { roleSchema, RoleSchema } from "@/schema/role-schema";
import axios from "axios";

export function RoleForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);

    const form = useForm<RoleSchema>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            email: "",
            role: "TEACHER",
            password: "",
            firstName: "",
            phone: "",
            lastName: "",
        },
    });

    const onSubmit: SubmitHandler<RoleSchema> = React.useCallback(
        async (values) => {
            Swal.fire({
                title: "Creating account",
                text: "Please wait...",
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => Swal.showLoading(),
            });

            try {
                const res = await axios.post(
                    `/api/role?id=${session?.user?.id}`,
                    { values },
                    { headers: { "Content-Type": "application/json" } }
                );
                Swal.close();

                if (res?.data?.status === 200) {
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Account is created successfully",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setDialogOpen(false);
                    form.reset();
                    router.refresh(); // reload the roles table
                } else {
                    // Show the server's reason instead of always saying "not authorized".
                    const reason =
                        typeof res?.data?.errors === "string" && res.data.errors
                            ? res.data.errors
                            : res?.data?.message || "Account could not be created.";
                    Swal.fire({
                        icon: "error",
                        title: "Account creation failed",
                        text: reason,
                        confirmButtonColor: "red",
                    });
                }
            } catch (error: any) {
                Swal.close();
                const status = error?.response?.status;
                Swal.fire({
                    icon: "error",
                    title: status === 401 || status === 403 ? "Not authorized" : "Oops...",
                    text:
                        status === 401 || status === 403
                            ? "Only a logged-in admin can create roles. Please sign in again."
                            : "Something went wrong. Please try again!",
                });
            }
        },
        [session, form, router]
    );

    return (
        <Dialog
            open={dialogOpen}
            onOpenChange={(isOpen) => {
                setDialogOpen(isOpen);
                if (!isOpen) form.reset();
            }}
        >
            <DialogTrigger asChild>
                <AddCard title="Role" hint="Create an admin or teacher account" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-semibold">
                        Add new Role
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500">
                        Create a teacher or admin account.
                    </DialogDescription>
                </DialogHeader>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid gap-4 grid-cols-2 py-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="name@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <FormControl>
                                            <select
                                                {...field}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="TEACHER">Teacher</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="First name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Last name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="10-digit phone" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="At least 8 characters" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter className="w-full">
                            <Button type="submit" className="w-full" variant="default">
                                Create account
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
