import type { Metadata } from "next";
interface RootLayoutProps {
    children: React.ReactNode;
}

import { Public_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
// import Navbar from "./Navbar/page";
// import NavBarItem from "./Navbar/topNavbar";
// import Navbar from "@/dashboad/Navbar.tsx/page";
// import NavBarItem from "@/dashboad/Navbar.tsx/navBarItem";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./Provider";
import { Toaster } from "@/components/ui/toaster";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TanstackProvider } from "@/hooks/tanstack-provider";

const publicSans = Public_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-public-sans",
});

export const metadata: Metadata = {
    title: "Attendance via Face",
    description: "Face-recognition attendance for classrooms: register with a live photo, mark attendance with a quick face scan.",
};

// context api
export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                suppressHydrationWarning
                className={cn(
                    publicSans.variable,
                    "   h-full   antialiased text-slate-900 w-full"
                )}
                data-new-gr-c-s-check-loaded="14.1209.0"
                data-gr-ext-installed=""
            >
                {/* <Navbar/> */}
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    forcedTheme="light"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <NextTopLoader  />
                        <TanstackProvider>{children}</TanstackProvider>
                    </AuthProvider>
                    <Toaster />
                    <ToastContainer />
                </ThemeProvider>
            </body>
        </html>
    );
}
