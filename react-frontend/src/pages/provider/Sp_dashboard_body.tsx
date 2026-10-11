import axios from "axios";
import { useEffect, useState } from "react";
import { BASE_URL } from "../../services/api";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

interface JobType {
  assignment_id: string;
  service_name: string;
  full_name: string;
  service_address: string;
  scheduled_date: string;
  hour_start: string;
  status: string;
}

interface JobAssignmentsResponse {
  assigned_at: string;
  assignment_id: string;
  assignment_score: number;
  booking_id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  estimated_duration_min: number;
  hour_end: string;
  hour_start: string;
  notes: string | null;
  scheduled_at: string;
  scheduled_date: string;
  service_address: string;
  service_id: string;
  service_name: string;
  service_provider_id: string;
  sp_id: string;
  sp_name: string;
  sp_phone: string;
  status: string;
  updated_at: string;
}

export default function AssignedJobs() {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const spId = user?.id;

  const [jobs, setJobs] = useState<Array<JobType>>([
    {
      assignment_id: "",
      full_name: "",
      hour_start: "",
      scheduled_date: "",
      service_address: "",
      service_name: "",
      status: "",
    },
  ]);
  useEffect(() => {
    if (!token || !spId) return;

    async function fillJobs() {
      const response = await axios.get<Array<JobAssignmentsResponse>>(
        `${BASE_URL}/job-assignments/provider/${encodeURIComponent(spId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-role": "service_provider",
          },
        },
      );
      // console.log(response.data);
      setJobs(
        response.data.map((job: JobAssignmentsResponse) => {
          return {
            assignment_id: job.assignment_id,
            service_name: job.service_name,
            full_name: job.customer_name,
            service_address: job.service_address,
            scheduled_date: job.scheduled_date,
            hour_start: job.hour_start,
            status: job.status,
          };
        }),
      );
    }
    fillJobs();
  }, []);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-slate-800">Assigned Jobs</h1>

      {jobs.length === 0 ? (
        <p>No jobs assigned.</p>
      ) : (
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 text-sm text-slate-500">
            <tr>
              <th className="px-4 py-3">Service Name</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => (
              <tr key={job.assignment_id}>
                <td className="px-4 py-4">{job.service_name}</td>
                <td className="px-4 py-4">{job.full_name}</td>
                <td className="px-4 py-4">{job.service_address}</td>
                <td className="px-4 py-4">{job.scheduled_date}</td>
                <td className="px-4 py-4">{job.hour_start}</td>
                <td className="px-4 py-4">{job.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
