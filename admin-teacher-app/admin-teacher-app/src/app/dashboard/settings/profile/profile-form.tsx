"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(40),
  lastName: z.string().trim().max(40),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number")
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileForm() {
  const { update } = useSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  });

  // Load the saved profile so the form shows real data.
  useEffect(() => {
    let active = true;
    axios
      .get("/api/profile")
      .then(({ data }) => {
        if (!active) return;
        setEmail(data.email);
        form.reset({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          phone: data.phone ?? "",
        });
      })
      .catch(() => toast.error("Could not load your profile"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: ProfileFormValues) {
    try {
      const { data } = await axios.patch("/api/profile", values);
      form.reset({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      await update({ name: data.firstName }); // refresh the name shown in the header
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not update profile");
    }
  }

  return (
    <div className="bg-background p-4 w-full max-w-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input disabled={loading} {...field} />
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
                  <Input disabled={loading} {...field} />
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
                  <Input disabled={loading} inputMode="tel" placeholder="+91 98765 43210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Email</FormLabel>
            <Input value={email} disabled readOnly />
            <FormDescription>Your email is your login and can&apos;t be changed here.</FormDescription>
          </FormItem>
          <Button type="submit" disabled={loading || form.formState.isSubmitting || !form.formState.isDirty}>
            {form.formState.isSubmitting ? "Updating…" : "Update profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
