"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/dash/ui";

export function Calendars({ id }: { id: string }) {
    const [date, setDate] = React.useState<Date | undefined>(new Date());

    // Ensure the correct date without timezone shifts
    const formattedDate = date
        ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
              .toISOString()
              .split("T")[0]
        : undefined;

    const router = usePathname();
    const route = useRouter();

    React.useEffect(() => {
        if (formattedDate) {
            route.push(`${router}?date=${formattedDate}`);
        } else {
            route.push(`${router}`);
        }
    }, [formattedDate]);

    return (
        <Card>
            <CardHeader title="Calendar" subtitle="Pick a day to filter the chart" />
            <div className="flex justify-center px-2 pb-4">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selected) => setDate(selected)}
                    className="bg-white"
                />
            </div>
        </Card>
    );
}
