import type { BookingDocument, ProviderDocument, ServiceDocument, UserDocument } from "@/models/api.models";

export function formatProviderTime(minutes: number, hour12 = false): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hour12) {
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(mins).padStart(2, "0")} ${period}`;
}

export function getActiveOffers(
  bookings: BookingDocument[],
  providerId?: string,
): BookingDocument[] {
  const now = Date.now();
  return bookings.filter((booking) => {
    const offer = booking.offers?.find(
      (item) =>
        (!providerId || String(item.provider) === providerId) &&
        item.status === "offered",
    );
    if (offer?.expiresAt) return new Date(offer.expiresAt).getTime() > now;
    if (booking.offerExpiresAt) return new Date(booking.offerExpiresAt).getTime() > now;
    return booking.status === "awaiting_provider";
  });
}

export function getOfferServiceName(booking: BookingDocument): string {
  return typeof booking.service === "object" && booking.service !== null
    ? (booking.service as ServiceDocument).name
    : "Service Job";
}

export function getOfferCustomerName(booking: BookingDocument): string {
  return typeof booking.customer === "object" && booking.customer !== null
    ? (booking.customer as UserDocument).name
    : "Customer";
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const requestError = error as {
      data?: { message?: string | string[] };
      message?: string;
    };
    const message = requestError.data?.message ?? requestError.message;
    return Array.isArray(message) ? message.join(", ") : message ?? fallback;
  }
  return fallback;
}

export function getProviderId(provider: ProviderDocument | undefined): string | undefined {
  return provider?._id;
}
