import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RolesEnum } from "@/common/roles.enum";
import useAuth from "@/hooks/useAuth";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchProviderBookings,
  fetchProviderByUser,
} from "@/store/provider/provider-slice";
import type { BookingDocument, OrderDocument } from "@/models/api.models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

function getGrossAmount(booking: BookingDocument) {
  return typeof booking.order === "string"
    ? booking.price
    : (booking.order as OrderDocument).totalAmount;
}

function payoutStatus(booking: BookingDocument): "pending" | "paid" | "unknown" {
  switch (booking.payoutStatus) {
    case "pending":
    case "paid":
      return booking.payoutStatus;
    default:
      return "unknown";
  }
}

export default function Revenue() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const isProvider = user?.role === RolesEnum.PROVIDER;
  const { profile, bookings: allBookings, pending, error } = useSelector((s: RootState) => s.provider);

  useEffect(() => {
    if (isProvider && user?.id && !profile) {
      void dispatch(fetchProviderByUser(user.id));
    }
  }, [dispatch, isProvider, profile, user?.id]);

  useEffect(() => {
    if (profile?._id) {
      void dispatch(fetchProviderBookings(profile._id));
    }
  }, [dispatch, profile?._id]);

  const bookings = useMemo(
    () => allBookings.filter((booking) => booking.status === "completed"),
    [allBookings],
  );
  const isLoading = pending > 0 && (!profile || allBookings.length === 0);
  const isError = Boolean(error) && allBookings.length === 0;

  const totals = useMemo(() => {
    const grossRevenue = bookings.reduce(
      (total, booking) => total + getGrossAmount(booking),
      0,
    );
    const providerEarnings = bookings.reduce(
      (total, booking) => total + booking.providerShare,
      0,
    );
    const pendingPayout = bookings
      .filter((booking) => payoutStatus(booking) === "pending")
      .reduce((total, booking) => total + booking.providerShare, 0);
    const paidPayout = bookings
      .filter((booking) => payoutStatus(booking) === "paid")
      .reduce((total, booking) => total + booking.providerShare, 0);

    return {
      grossRevenue,
      providerEarnings,
      pendingPayout,
      paidPayout,
      averageBookingValue: bookings.length
        ? grossRevenue / bookings.length
        : 0,
    };
  }, [bookings]);

  if (!isProvider) {
    return (
      <Card>
        <CardContent className="pt-6">Provider access required.</CardContent>
      </Card>
    );
  }

  if (isLoading) {
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
          Earnings from your completed bookings.
        </p>
      </div>

      {isError && <p className="text-destructive">Unable to load earnings.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total earnings</CardDescription>
            <CardTitle>{formatCurrency(totals.providerEarnings)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {bookings.length} completed booking(s)
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending payout</CardDescription>
            <CardTitle>{formatCurrency(totals.pendingPayout)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Awaiting settlement
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Gross service value</CardDescription>
            <CardTitle>{formatCurrency(totals.grossRevenue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Customer order totals
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Average booking value</CardDescription>
            <CardTitle>{formatCurrency(totals.averageBookingValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Per completed booking
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Provider share from completed bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground">No completed bookings found.</p>
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
                  {bookings.map((booking) => (
                    <tr className="border-b last:border-0" key={booking._id}>
                      <td className="px-2 py-3">
                        {new Date(booking.scheduledDate).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>
                      <td className="px-2 py-3 font-mono text-xs">
                        {booking._id}
                      </td>
                      <td className="px-2 py-3 font-medium">
                        {formatCurrency(booking.providerShare)}
                      </td>
                      <td className="px-2 py-3 capitalize">
                        {payoutStatus(booking)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Paid payout total: {formatCurrency(totals.paidPayout)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
