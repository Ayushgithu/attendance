import { apiBase } from "@/lib/api-base";
import { serverHeaders } from "@/lib/server-headers";

import React from "react";
import { Calendars } from "./dashboard/calendar";
import CardWithFormList from "./dashboard/card";
import AttendanceChart from "./dashboard/chart";
import { auth } from "../api/auth";

async function getAttendanceSummary({id,date}:any) {
  try {
    const response = await fetch(
        `${await apiBase()}/api/dashboard?id=${id}&date=${date}`,
        { headers: await serverHeaders() }
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Failed to load attendance summary:", error);
    return null;
  }
}
async function getDetails({id,date}:any) {
  try {
    const response = await fetch(
        `${await apiBase()}/api/get-subject-branch-batch?id=${id}`,
        { headers: await serverHeaders() }
    );
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Failed to load dashboard details:", error);
    return null;
  }
}

async function page({searchParams}:any) {
    const res = await auth();
    const id = res?.id;
    const {date} = await searchParams;

   
    const dashboardData = await getAttendanceSummary({id,date});
    const getDetail = await getDetails({id,date});
    return (
        <div className="space-y-6">
            {/* Stat tiles */}
            <CardWithFormList data={getDetail} />

            {/* Chart + calendar */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                    <AttendanceChart data={dashboardData} />
                </div>
                <div>
                    <Calendars id={id} />
                </div>
            </div>
            {/* <div className="bg-background p-5 my-5 rounded"></div> */}
        </div>
    );
}

export default page;
