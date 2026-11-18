import { apiBase } from "@/lib/api-base";
import { serverHeaders } from "@/lib/server-headers";
import React from "react";
import EnrollTable from "./table";
import { auth } from "@/app/api/auth";


const getBasicInfo = async ({ id }: { id: string }) => {
    try {
        const res = await fetch(
            `${await apiBase()}/api/get-subject-branch-batch?id=${id}`,
            { headers: await serverHeaders() }
        );
        const data = await res.json();
        return data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
    }
};
async function page() {
    const user = await auth();
    const id = user?.id;
    const data = await getBasicInfo({id});
    return (
        <section className="flex w-full flex-col gap-6">
            <EnrollTable data={data} />
        </section>
    );
}

export default page;
