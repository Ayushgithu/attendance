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
import React, { useEffect, useState } from "react";
import axios from "axios";
import { addSubject, AddSubject } from "@/schema/add-subject";


export function SubjectForm() {
    const { data: session } = useSession();
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);

    // Redirect to dashboard if user is logged in

    const form = useForm<AddSubject>({
        resolver: zodResolver(addSubject),
        defaultValues: {
            subjectname: ""
        },
    });

    const onSubmit: SubmitHandler<AddSubject> = React.useCallback(
        async (values) => {
            Swal.fire({
                title: "Adding subject",
                text: "Please wait...",
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => Swal.showLoading(),
            });

            try {
                const res = await axios.post(
                    `/api/subject?id=${session?.user?.id}`,
                    { subject: values.subjectname },
                    { headers: { "Content-Type": "application/json" } }
                );
                Swal.close();

                if (res?.data?.status === 200) {
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Subject added successfully",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setDialogOpen(false);
                    form.reset();
                    router.refresh(); // reload the subject table
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Subject creation failed",
                        text:
                            typeof res?.data?.errors === "string" && res.data.errors
                                ? res.data.errors
                                : "Subject could not be created.",
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
                <AddCard title="Subject" hint="Create a subject to assign and enroll" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-semibold">
                        Add new Subject
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500">
                        Enter the subject name, e.g. Mathematics
                    </DialogDescription>
                </DialogHeader>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="">
                       
                            <FormField
                                control={form.control}
                                name="subjectname"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Data Structures" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                      

                        <DialogFooter className="mt-4">
                            <Button
                                type="submit"
                                className=""
                                variant="default"
                            >
                                Add new Subject
                            </Button>
                        </DialogFooter>
                    </form>
                </FormProvider>
            </DialogContent>
        </Dialog>
    );
}
