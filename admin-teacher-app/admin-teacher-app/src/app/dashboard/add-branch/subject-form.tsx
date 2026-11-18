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
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import axios from "axios";
import { addBranch, AddBranch } from "@/schema/add-branch";

export function SubjectForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);

    const form = useForm<AddBranch>({
        resolver: zodResolver(addBranch),
        defaultValues: { branch: "" },
    });

    const onSubmit: SubmitHandler<AddBranch> = React.useCallback(
        async (values) => {
            Swal.fire({
                title: "Adding branch",
                text: "Please wait...",
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => Swal.showLoading(),
            });

            try {
                // The /api/branch route expects { branch } and returns status in the body.
                const res = await axios.post(
                    `/api/branch?id=${session?.user?.id}`,
                    { branch: values.branch },
                    { headers: { "Content-Type": "application/json" } }
                );
                Swal.close();

                if (res?.data?.status === 200) {
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Branch added successfully",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setDialogOpen(false);
                    form.reset();
                    router.refresh(); // reload the branch table
                } else {
                    const reason =
                        typeof res?.data?.errors === "string" && res.data.errors
                            ? res.data.errors
                            : "Branch could not be created (it may already exist).";
                    Swal.fire({
                        icon: "error",
                        title: "Branch creation failed",
                        text: reason,
                        confirmButtonColor: "red",
                    });
                }
            } catch (error) {
                Swal.close();
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Something went wrong. Please try again!",
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
                <AddCard title="Branch" hint="Create a branch for students and subjects" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-semibold">
                        Add new branch
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500">
                        Enter the branch name, e.g. Computer Science
                    </DialogDescription>
                </DialogHeader>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="branch"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branch</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Branch name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="submit" variant="default">
                                Add branch
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
