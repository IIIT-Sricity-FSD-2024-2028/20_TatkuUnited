import { useMemo } from "react";
import database from "../database.json";

type AssignedJobsProps = {
    spId: string;
};

export default function AssignedJobs({ spId }: AssignedJobsProps) {
    const jobs = useMemo(() => {
        const servicesById = new Map(
        database.services.map((service) => [
            service.service_id,
            service,
        ])
        );

        const bookingsById = new Map(
        database.bookings.map((booking) => [
            booking.booking_id,
            booking,
        ])
        );

        const customersById = new Map(
        database.customers.map((customer) => [
            customer.customer_id,
            customer,
        ])
        );

        return database.jobAssignments
        .filter((assignment) => assignment.sp_id === spId)
        .map((assignment) => {
            const service = servicesById.get(assignment.service_id);
            const booking = bookingsById.get(assignment.booking_id);
            const customer = booking
            ? customersById.get(booking.customer_id)
            : undefined;

            return {
            assignment_id: assignment.assignment_id,
            service_name: service?.service_name,
            full_name: customer?.full_name,
            service_address: booking?.service_address,
            scheduled_date: assignment.scheduled_date,
            hour_start: assignment.hour_start,
            status: assignment.status,
            };
        });
    }, [spId]);

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