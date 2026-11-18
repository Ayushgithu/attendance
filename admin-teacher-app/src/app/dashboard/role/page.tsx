import { apiBase } from "@/lib/api-base";
import { serverHeaders } from "@/lib/server-headers";
import React, { Suspense } from "react";
import { Role } from "./role-table";
import { RoleForm } from "./role";
import { auth } from "@/app/api/auth";
import axios from "axios";



async function getData({ id }: { id: string }) {
    try {
        const res = await axios.get(
            `${await apiBase()}/api/role?id=${id}`,{ timeout: 5000, headers: await serverHeaders() }
        );
        return res.data;
    } catch (error) {
        return "something went wrong";
    }
}

async function page() {
    const response = await auth();
    const id = response?.role?.id;
    const res = await getData({ id });

    return (
        <section className="flex w-full flex-col gap-6">
            <Role data={res?.data} action={<RoleForm />} />
        </section>
    );
}

export default page;
