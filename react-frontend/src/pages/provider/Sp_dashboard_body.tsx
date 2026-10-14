import axios from "axios";
import { useEffect, useState } from "react";
import { BASE_URL } from "../../services/endpoints";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import AssignedJobs from "./AssignedJobs";

// interface JobType {
//   assignment_id: string;
//   service_name: string;
//   full_name: string;
//   service_address: string;
//   scheduled_date: string;
//   hour_start: string;
//   status: string;
// }

// interface JobAssignmentsResponse {
//   assigned_at: string;
//   assignment_id: string;
//   assignment_score: number;
//   booking_id: string;
//   created_at: string;
//   customer_name: string;
//   customer_phone: string;
//   estimated_duration_min: number;
//   hour_end: string;
//   hour_start: string;
//   notes: string | null;
//   scheduled_at: string;
//   scheduled_date: string;
//   service_address: string;
//   service_id: string;
//   service_name: string;
//   service_provider_id: string;
//   sp_id: string;
//   sp_name: string;
//   sp_phone: string;
//   status: string;
//   updated_at: string;
// }

// const columns = [
//   { key: "service_name", label: "Service Name" },
//   { key: "customer_name", label: "Customer Name" },
//   { key: "service_address", label: "Address" },
//   { key: "scheduled_date", label: "Date" },
//   { key: "hour_start", label: "Time" },
//   { key: "status", label: "Status" },
// ] satisfies {key: keyof JobAssignmentsResponse; label:string }[];

export default function _AssignedJobs_() {
  
  // const token = useSelector((state: RootState) => state.auth.token);
  // const user = useSelector((state: RootState) => state.auth.user);
  // const spId = user?.id;

  // const [jobs, setJobs] = useState<Array<JobType>>([
  //   {
  //     assignment_id: "",
  //     full_name: "",
  //     hour_start: "",
  //     scheduled_date: "",
  //     service_address: "",
  //     service_name: "",
  //     status: "",
  //   },
  // ]);
  // useEffect(() => {
  //   if (!token || !spId) return;

  //   async function fillJobs() {
  //     const response = await axios.get<Array<JobAssignmentsResponse>>(
  //       `${BASE_URL}/job-assignments/provider/${encodeURIComponent(spId ?? "")}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "x-role": "service_provider",
  //         },
  //       },
  //     );
  //     // console.log(response.data);
  //     setJobs(
  //       response.data.map((job: JobAssignmentsResponse) => {
  //         return {
  //           assignment_id: job.assignment_id,
  //           service_name: job.service_name,
  //           full_name: job.customer_name,
  //           service_address: job.service_address,
  //           scheduled_date: job.scheduled_date,
  //           hour_start: job.hour_start,
  //           status: job.status,
  //         };
  //       }),
  //     );
  //   }
  //   fillJobs();
  // }, []);

  return (
    <div>
        <AssignedJobs />
    </div>
  );
}
