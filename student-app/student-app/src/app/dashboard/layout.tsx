import { Public_Sans } from "next/font/google";
import Dashboard from "./dashboard";

const publicSans = Public_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-public-sans",
});

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={publicSans.variable}>
            <Dashboard>{children}</Dashboard>
        </div>
    );
}
