import { useContext, useEffect, useState } from "react";
import AuthContext from "@/common/AuthContext";
import { RolesEnum } from "@/common/roles.enum";
import {HTTP_METHODS_ENUM} from "@/common/http.methods";
import { ENDPOINT_ENUM, buildEndpoint } from "@/services/endpoints";
import { apiService } from "@/services/apiService";
import DataTable, {type Column} from "./DataTable";

interface Job
{
    assignment_id: string;
    service_name: string;
    customer_name: string;
    service_address: string;
    scheduled_date: string;
    hour_start: string;
    status: string;
}


interface Booking {
    _id: string;
    service?: {
        _id: string;
        name: string;
    };
    customer?: {
        _id: string;
        name: string;
        phone: string;
    };
    order?: {
        address?: {
        line?: string;
        city?: string;
        };
    };
    scheduledDate: string;
    startTime: number;
    endTime: number;
    status: string;
}

const columns = [
    { key: "service_name", label: "Service Name" },
    { key: "customer_name", label: "Customer Name" },
    { key: "service_address", label: "Address" },
    { key: "scheduled_date", label: "Date" },
    { key: "hour_start", label: "Time" },
    { key: "status", label: "Status" },
];

export default function AssignedJobs() {
    const authContext = useContext(AuthContext);
    const [jobs, setJobs] = useState<Job[]>([]);

    const providerId = authContext?.authDetails.user.id;
    const role = authContext?.authDetails.user.role;

    useEffect(() => {
        if(!providerId || role !== RolesEnum.PROVIDER) {
            return;
        }

        async function fetchJobs() {
            try {
                const endpoint = buildEndpoint(
                    ENDPOINT_ENUM.BOOKINGS_BY_PROVIDER,
                    {providerId,},
                );

                const response = await apiService(
                    HTTP_METHODS_ENUM.get,
                    endpoint, 
                    undefined,
                );

                const formattedJobs: Job[] = response.map(
                    (job: JobApiResponse) => ({
                        assignment_id: job.assignment_id,
                        service_name: job.service_name,
                        customer_name: job.customer_name,
                        service_address: job.service_address,
                        scheduled_date: job.scheduled_date,
                        hour_start: job.hour_start,
                        status: job.status,
                    }),
                );

                setJobs(formattedJobs);
            } catch (error) {
                console.error("Failed to fetch assigned jobs:", error);
            }
        }
        fetchJobs();
    }, [providerId, role]);

    return (
        <div className="rounded-lg bg-white p-6 shadow">
            <h1 className="mb-4 text-2xl font-bold text-slate-800">
                Assigned Jobs
            </h1>

            {jobs.length === 0 ? (
                <p>No jobs assigned.</p>
            ) : (
                <DataTable
                    columns={columns}
                    data={jobs}
                    rowKey="assignment_id"
                />
            )}
        </div>
    );
}