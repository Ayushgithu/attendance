import { apiBase } from "@/lib/api-base";
import { serverHeaders } from "@/lib/server-headers";
import React from 'react';
import Attandace from './Attandace';
import RunningCount from './running-count';
import AutoRefresh from './auto-refresh';
import axios from 'axios';
import { auth } from '@/app/api/auth';


export const dynamic = 'force-dynamic';

async function fetchData(id?: string): Promise<any> {
  if (!id) return null;
  try {
    const data = await axios.get(`${await apiBase()}/api/student-attendance?id=${id}`, { headers: await serverHeaders() })
    return data.data
  } catch (error) {
    console.error('something went wrong', error)
  }
}
const page = async () => {
  const user = await auth();
  const response = await fetchData(user?.id);




  return (
    // <Box/>
    <div className=' px-7  w-full flex justify-start gap-10 '>
      <div className=' w-full items-center content-center  '><AutoRefresh /><RunningCount /><Attandace data={response?.data} /></div>
    </div>

  );
}

export default page;
