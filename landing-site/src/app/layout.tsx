import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Attendance via Face",
  description: "Face-recognition attendance for classrooms: register with a live photo, mark attendance with a quick face scan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(publicSans.variable, "h-full w-full antialiased text-slate-900")}>{children}</body>
    </html>
  );
}
