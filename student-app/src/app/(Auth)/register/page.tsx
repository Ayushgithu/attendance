'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signUpSchema } from "@/schema/signUpSchema"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@radix-ui/react-toast"
import { format } from "date-fns"
import LineIcon from "@/components/dash/LineIcon"
import { PAGE_BG } from "@/components/dash/ui"
import { Logo } from "../../Navbar"
import axios from "axios"
import FaceCapture, { type CapturedFace } from "@/components/face-capture"
import { useEffect, useState } from "react"

export default function Register() {
  const { toast } = useToast()

  const [captured, setCaptured] = useState<CapturedFace | null>(null)
  const [options, setOptions] = useState<{ branches: string[]; batches: string[] }>({ branches: [], batches: [] })

  // suggestions: existing branches / batches, so students pick the same names the admin created
  useEffect(() => {
    axios.get('/api/signup').then((r) => setOptions(r.data)).catch(() => undefined)
  }, [])

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      Firstname: '',
      lastname: '',
      password: '',
      email: '',
      avatar: undefined,
      rollNumber: '',
      phone: '',
      batch: '',
      branch: ''
    }
  });

  const onSubmit = async (data: any) => {
    if (!captured) {
      toast({
        title: "Live photo required",
        description: "Open the camera and capture your photo.",
        variant: "destructive",
      });
      return;
    }
    const formData = new FormData();
    formData.append("descriptor", JSON.stringify(captured.descriptor));
    formData.append("avatar", captured.file);
    for (const key in data) {
      if (key !== "avatar") formData.append(key, data[key]);
    }
    try {
      const response = await axios.post(
        `/api/signup`,
        formData, // Send formData directly
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      const res = await response.data;
      if (res.status === 200) {
        toast({
          title: "Success",
          description: format(new Date(), "MMM dd, yyyy"),
          action: <ToastAction altText="Success">Account Created!</ToastAction>,
        });
        // reset();
        setTimeout(() => { window.location.assign("/login"); }, 1500);
      } else {
        toast({
          title: "Error",
          description: (typeof res.errors === "string" && res.errors) || "Something went wrong!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
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
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">Join in under a minute.</h1>
          <p className="mt-3 max-w-sm text-lg text-white/85">
            Fill in your details, take a live photo and you can mark attendance with a quick face scan.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ["Your details", "Name, roll number, batch and branch"],
              ["A live photo", "Guided camera: plain background, good light"],
              ["You are in", "Sign in and mark attendance by face"],
            ].map(([t, d], i) => (
              <li key={t} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[color:var(--brand-dark)]">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-bold">{t}</span>
                  <span className="text-sm text-white/80">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/70">&copy; {new Date().getFullYear()} Student Power Club · Powered by <span className="font-semibold text-white">Lexical Software</span></p>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>
        <Card className="w-full max-w-md border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-extrabold tracking-tight">Create an account</CardTitle>
            <CardDescription className="text-center">Already registered? <Link href="/login" className="font-semibold text-[color:var(--brand)]">Sign in</Link></CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" placeholder="John" {...register('Firstname')} />
                    {errors.Firstname && <p className="text-red-500 text-xs">{errors.Firstname.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastname">Last Name</Label>
                    <Input id="lastname" placeholder="Doe" {...register('lastname')} />
                    {errors.lastname && <p className="text-red-500 text-xs">{errors.lastname.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input type="email" placeholder="john@example.com" id="email" {...register('email')} />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input id="rollNumber" placeholder="0901CS..." {...register('rollNumber')} />
                  {errors.rollNumber && <p className="text-red-500 text-xs">{errors.rollNumber.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" placeholder="phone" {...register('phone')} />
                  {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                </div>
              
                <div>
                  <Label htmlFor="batch">Batch</Label>
                  <Input id="batch" placeholder="Batch" list="batch-options" autoComplete="off" {...register('batch')} />
                  <datalist id="batch-options">{options.batches.map((b) => <option key={b} value={b} />)}</datalist>
                  <p className="text-xs text-slate-500">Pick your batch from the list. A new one is added only if it doesn&apos;t exist.</p>
                  {errors.batch && <p className="text-red-500 text-xs">{errors.batch.message}</p>}
                </div>

                <div>
                  <Label htmlFor="avatar">Live Photo</Label>
                  <FaceCapture
                    onCapture={(c) => {
                      setCaptured(c)
                      setValue("avatar", c.file as any, { shouldValidate: true })
                    }}
                    onClear={() => {
                      setCaptured(null)
                      setValue("avatar", undefined as any)
                    }}
                  />
                  {errors.avatar && <p className="text-red-500 text-xs">{errors.avatar.message}</p>}
                </div>
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Input type="text" id="branch" list="branch-options" autoComplete="off" {...register('branch')} />
                  <datalist id="branch-options">{options.branches.map((b) => <option key={b} value={b} />)}</datalist>
                  <p className="text-xs text-slate-500">Pick your branch from the list. A new one is added only if it doesn&apos;t exist.</p>
                  {errors.branch && <p className="text-red-500 text-xs">{errors.branch.message}</p>}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input type="password" placeholder="********" id="password" {...register('password')} />
                  {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full font-semibold shadow-none">Create account</Button>


              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
