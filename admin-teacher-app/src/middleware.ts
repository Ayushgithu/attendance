import withAuth from "next-auth/middleware";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";

export default withAuth(
    function middleware(){
        return NextResponse.next();
    },

    {
        pages: { signIn: "/login" },
        cookies: { sessionToken: { name: SESSION_COOKIE_NAME } },
        callbacks:{
            authorized:({token,req})=>{
                const {pathname} = req.nextUrl;
                const {role} = token ?? {};
                // console.log("role",role?.role);

                
                // allow dashboard;
              
                if (pathname.startsWith('/api/')) {
                    return true;
                }
                // allow auth-related routes;

                if (pathname.startsWith("/api/auth")||pathname==="/login") {
                    return true;
                }

                if(pathname==="/" || pathname.startsWith("/api/")||pathname.startsWith("/student")){
                    return true;
                }

                return !!token;
            },
        },
    }
);

export const config = {
    matcher:[
        // "/((?!_next/static!_next/image|image|favicon.icon|public/).*)",
        "/dashboard/:path*"
    ]
}