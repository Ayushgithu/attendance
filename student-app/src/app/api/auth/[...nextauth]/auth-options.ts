import { prisma } from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { verifyPassword } from "@/lib/password";
import { authCookies } from "@/lib/auth-cookies";
// Prisma client for accessing the database

export const authOptions: NextAuthOptions = {
    cookies: authCookies, // app-specific cookie names (see lib/auth-cookies.ts)
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {},
            async authorize(credentials) {
                try {
                    // Extract email from credentials
                    const { email, password } = credentials as {
                        email: string;
                        password: string;
                    };
                    // Query the database to find a user with the provided email
                    const [student, roles] = await Promise.all([
                        prisma.student.findUnique({
                            where: {
                                email,
                            },
                        }),
                        prisma.roles.findUnique({
                            where: {
                                email,
                            },
                        }),
                    ]);
                    // Student app: only student accounts can sign in here.
                    if (!student) {
                        return null;
                    }
                    const user = student;

                    // If user found, check if passwords match
                    if (user && (await verifyPassword(password, user.password))) {
                        return {
                            id: user.id.toString(),
                            email: user.email,
                            role: user.role ?? "STUDENT",
                            Firstname: student?.Firstname ?? roles?.firstName ?? "",
                            rollNumber: student?.rollNumber ?? "",
                            avatar: student?.avatar ?? "",
                        }; // Return user object if password matches
                    } else {
                        // If passwords don't match, return null
                        return null;
                    }
                } catch (error) {
                    // Handle any errors that occur during database query
                    console.error("Error:", error);
                    return null;
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],

    callbacks: {
        // Allow redirects to this app and to the shared landing site (used after sign-out).
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            const landing = (process.env.NEXT_PUBLIC_LANDING_URL || "").replace(/\/+$/, "");
            try {
                const target = new URL(url);
                if (target.origin === new URL(baseUrl).origin) return url;
                if (landing && target.origin === new URL(landing).origin) return url;
            } catch {}
            return baseUrl;
        },
        async jwt({ token, user, trigger, session }: any) {
            if (trigger === "update" && session?.name) {
                token.name = session.name;
            }
            if (user) {
                token.id = user.id?.toString();
                token.rollNumber = user.rollNumber;
                token.name = user.Firstname;
                token.avatar = user.avatar;
                token.email = user.email;
                token.role = user;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
        signOut: "/",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
};
