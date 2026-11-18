"use catch"
import { apiBase } from "@/lib/api-base";
import { serverHeaders } from "@/lib/server-headers";
import { auth } from "@/app/api/auth";
import axios from "axios";
import { Student } from "./table";

async function getStudent({ id }: { id: string }) {
    try {
        const data = await axios.get(`${await apiBase()}/api/student?id=${id}`, { headers: await serverHeaders() });
        const response = data.data;
        if (!response) {
            throw Error('no data found');
        }
        return response;
    } catch (error) {

        if (!error) {
            throw Error('something went wrong')
        }
    }
}

export default async function fetchStudent() {

    const data = await auth()
    const response = await getStudent({ id: data?.id });
    
   return response;
}