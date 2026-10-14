import { useEffect, useMemo, useState } from "react";
import { RolesEnum } from "@/common/roles.enum";
import { useAuthContext } from "@/common/AuthContext";
import { getProviderByUser } from "@/services/providers.service";
import { getBookingsByProvider } from "@/services/bookings.service";
import type {
    BookingDocument,
    OrderDocument,
    ProviderDocument,
} from "@/models/api.models";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(paise: number): string {
    return new Intl.NumberFormat("en-IN", {
        currency: "INR",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: "currency",
    }).format(paise / 100);
}

function getOrderTotal(booking: BookingDocument): number {
    if (typeof booking.order === "string") {
        return booking.price;
    }
    return (booking.order as OrderDocument).totalAmount;
}

function getDate(booking: BookingDocument): string {
    return new Date(booking.scheduledDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getPayoutStatus(booking: BookingDocument): "pending" | "paid" {
    return booking.payoutStatus === "paid" || booking.payoutStatus === "transferred"
        ? "paid"
        : "pending";
}

export default function Revenue() {
    const { authDetails } = useAuthContext();
    const [provider, setProvider] = useState<ProviderDocument | null>(null);
    const [completedBookings, setCompletedBookings] = useState<BookingDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const user = authDetails?.user;
        if (!user || user.role !== RolesEnum.PROVIDER) {
            setLoading(false);
            return;
        }
        const userId = user.id;

        async function loadRevenue() {
            try {
                setLoading(true);
                setError(null);
                const providerProfile = await getProviderByUser(userId);
                const bookings = await getBookingsByProvider(providerProfile._id);
                setProvider(providerProfile);
                setCompletedBookings(
                    bookings.filter((booking) => booking.status === "completed"),
                );
            } catch (requestError) {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Unable to load earnings.",
                );
            } finally {
                setLoading(false);
            }
        }

        void loadRevenue();
    }, [authDetails]);

    const summary = useMemo(() => {
        const providerEarnings = completedBookings.reduce(
            (total, booking) => total + booking.providerShare,
            0,
        );
        const grossRevenue = completedBookings.reduce(
            (total, booking) => total + getOrderTotal(booking),
            0,
        );
        const pendingPayout = completedBookings
            .filter((booking) => getPayoutStatus(booking) === "pending")
            .reduce((total, booking) => total + booking.providerShare, 0);
        const paidPayout = completedBookings
            .filter((booking) => getPayoutStatus(booking) === "paid")
            .reduce((total, booking) => total + booking.providerShare, 0);

        return {
            providerEarnings,
            grossRevenue,
            pendingPayout,
            paidPayout,
            averageBookingValue: completedBookings.length
                ? grossRevenue / completedBookings.length
                : 0,
        };
    }, [completedBookings]);

    if (authDetails?.user.role !== RolesEnum.PROVIDER) {
        return (
            <Card>
                <CardContent className="pt-6">Provider access required.</CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton className="h-28" key={index} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Earnings Overview</h1>
                <p className="text-sm text-muted-foreground">
                    Completed bookings for {provider?.user && typeof provider.user !== "string"
                        ? provider.user.name
                        : "your provider account"}.
                </p>
            </div>

            {error && <p className="text-destructive">{error}</p>}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardDescription>Total earnings</CardDescription>
                        <CardTitle>{formatCurrency(summary.providerEarnings)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        {completedBookings.length} completed booking(s)
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Pending payout</CardDescription>
                        <CardTitle>{formatCurrency(summary.pendingPayout)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Awaiting settlement
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Gross service value</CardDescription>
                        <CardTitle>{formatCurrency(summary.grossRevenue)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Customer order totals
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Average booking value</CardDescription>
                        <CardTitle>{formatCurrency(summary.averageBookingValue)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Per completed booking
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                    <CardDescription>
                        Provider share from completed bookings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {completedBookings.length === 0 ? (
                        <p className="text-muted-foreground">
                            No completed bookings found.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b text-muted-foreground">
                                    <tr>
                                        <th className="px-2 py-3 font-medium">Date</th>
                                        <th className="px-2 py-3 font-medium">Booking</th>
                                        <th className="px-2 py-3 font-medium">Amount</th>
                                        <th className="px-2 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedBookings.map((booking) => (
                                        <tr className="border-b last:border-0" key={booking._id}>
                                            <td className="px-2 py-3">{getDate(booking)}</td>
                                            <td className="px-2 py-3 font-mono text-xs">
                                                {booking._id}
                                            </td>
                                            <td className="px-2 py-3 font-medium">
                                                {formatCurrency(booking.providerShare)}
                                            </td>
                                            <td className="px-2 py-3 capitalize">
                                                {getPayoutStatus(booking)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p className="mt-4 text-sm text-muted-foreground">
                        Paid payout total: {formatCurrency(summary.paidPayout)}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
