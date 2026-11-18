import { apiBase } from "@/lib/api-base";
import { serverHeaders } from "@/lib/server-headers";
import { auth } from '@/app/api/auth';
import axios from 'axios'
import React from 'react'
import AttendanceTable from './mark';

export const dynamic = "force-dynamic";

async function getData({ id }: { id: string }) {
    try {
        const res = await axios.get(`${await apiBase()}/api/mark-attendance-by-teacher?id=${id}`, { timeout: 5000, headers: await serverHeaders() });
        return res.data.data || [];
    } catch (error) {
        console.error("Error fetching data:", error);
        return { data: [] };
    }
}
async function Mark() {
    const res = await auth()
    const id = res?.role?.id;
    const role = res?.role?.role

    const response = await getData({ id });
    return (
        <div className='rounded-[10px] border border-slate-200 bg-background'>
            <AttendanceTable attendanceData={response} role={role} />
        </div>
    )
}

export default Mark
