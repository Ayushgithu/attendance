"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardHeader } from "@/components/dash/ui";
import React from "react";

interface Stats {
    present: number;
    absent: number;
}

export default function AttendanceChart({
    data,
}: {
    data: { attendanceRecord: Record<string, Record<string, Stats>> };
}) {
    const attendance = data?.attendanceRecord;
    //   present: stats?.present || 0,
    // Convert API data to an array format for the chart
    const chartData = React.useMemo(() => {
        return Object.entries(attendance || {}).flatMap(([subject, batches]) =>
            Object.entries(batches).map(([batch, stats]) => ({
                subject: `${subject} (Batch ${batch})`,
                present: stats.present || 0,
                absent: stats.absent || 0,
            }))
        );
    }, [attendance]);



    // console.log("Chart Data:", chartData);
    return (
        <Card>
            <CardHeader
                title="Attendance Overview"
                subtitle="Present and absent students by subject and batch"
            />
            <div className="px-4 pb-2 sm:px-6">
                {chartData.length === 0 ? (
                    <div className="grid h-[300px] place-items-center text-sm text-slate-900/50">
                        No attendance recorded for this day
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="subject" tick={{ fontSize: 12, fill: "#64748b" }} angle={-15} textAnchor="end" height={60} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="present" fill="#10B981" name="Present Students" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="absent" fill="#F43F5E" name="Absent Students" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-900/10 px-6 py-3 text-xs text-slate-900/50">
                <div>Total attendance data</div>
                <div>Updated: {new Date().toLocaleDateString()}</div>
            </div>
        </Card>
    );
}
