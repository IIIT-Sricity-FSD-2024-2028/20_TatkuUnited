import type { CategoryDocument } from "@/models/api.models";
import type { RegionBooking } from "@/store/manager/manager-slice";

// Plain functions for the Revenue page. They take bookings in and return
// numbers out, with no React in them, so they are easy to test on their own.
// All money is in paise, as the API sends it.

export const formatRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export type Period = "all" | "week" | "month" | "quarter" | "year";

export const PERIOD_LABELS: Record<Period, string> = {
  all: "All time",
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

/** Start (inclusive) and end (exclusive) of the period containing `now`. */
export function getPeriodRange(
  period: Period,
  now = new Date(),
): { start: Date; end: Date } | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case "week": {
      // weeks start on Monday
      const daysSinceMonday = (now.getDay() + 6) % 7;
      const start = new Date(y, m, now.getDate() - daysSinceMonday);
      return { start, end: new Date(y, m, start.getDate() + 7) };
    }
    case "month":
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1) };
    case "quarter": {
      const q = Math.floor(m / 3) * 3;
      return { start: new Date(y, q, 1), end: new Date(y, q + 3, 1) };
    }
    case "year":
      return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) };
    default:
      return null; // "all" has no bounds
  }
}

export function filterByPeriod(
  bookings: RegionBooking[],
  period: Period,
  now = new Date(),
): RegionBooking[] {
  const range = getPeriodRange(period, now);
  if (!range) return bookings;
  return bookings.filter((b) => {
    const when = new Date(b.scheduledDate);
    return when >= range.start && when < range.end;
  });
}

export interface RevenueSummary {
  bookings: number; // every booking in the period, whatever its status
  completed: number;
  gross: number; // what customers paid for completed bookings
  platformShare: number; // the platform's cut of that
}

export function summarise(bookings: RegionBooking[]): RevenueSummary {
  const completed = bookings.filter((b) => b.status === "completed");
  return {
    bookings: bookings.length,
    completed: completed.length,
    gross: completed.reduce((sum, b) => sum + b.price, 0),
    platformShare: completed.reduce((sum, b) => sum + b.platformShare, 0),
  };
}

/** How many bookings are in each status, skipping statuses with none. */
export function countByStatus(
  bookings: RegionBooking[],
): { status: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const b of bookings) counts.set(b.status, (counts.get(b.status) ?? 0) + 1);
  return [...counts].map(([status, count]) => ({ status, count }));
}

export interface CategoryRow {
  category: string;
  bookings: number;
  revenue: number;
  average: number; // revenue per booking
}

/** Completed bookings grouped by their service's category, biggest first. */
export function categoryBreakdown(
  bookings: RegionBooking[],
  categories: CategoryDocument[],
): CategoryRow[] {
  const groups = new Map<string, { bookings: number; revenue: number }>();
  for (const b of bookings) {
    if (b.status !== "completed") continue;
    const name = categoryNameOf(b, categories);
    const group = groups.get(name) ?? { bookings: 0, revenue: 0 };
    group.bookings += 1;
    group.revenue += b.price;
    groups.set(name, group);
  }
  return [...groups]
    .map(([category, g]) => ({
      category,
      bookings: g.bookings,
      revenue: g.revenue,
      average: Math.round(g.revenue / g.bookings),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// The API populates booking.service, but a booking whose service was deleted
// comes back as null, so fall back to a label instead of crashing.
function categoryNameOf(
  booking: RegionBooking,
  categories: CategoryDocument[],
): string {
  const service = booking.service;
  if (!service || typeof service === "string") return "Uncategorised";
  const category = service.category;
  if (typeof category === "string") {
    return categories.find((c) => c._id === category)?.name ?? "Uncategorised";
  }
  return category?.name ?? "Uncategorised";
}

export interface TrendPoint {
  label: string; // shown on the chart axis
  revenue: number; // paise
}

/**
 * Revenue of completed bookings over time. Short periods (week, month) are
 * grouped by day and longer ones by month. Empty days and months are included
 * as zero, so the chart has no gaps.
 */
export function revenueTrend(
  bookings: RegionBooking[],
  period: Period,
  now = new Date(),
): TrendPoint[] {
  const completed = bookings.filter((b) => b.status === "completed");
  const byDay = period === "week" || period === "month";
  const keyOf = (d: Date) =>
    byDay
      ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      : `${d.getFullYear()}-${d.getMonth()}`;

  const totals = new Map<string, number>();
  for (const b of completed) {
    const key = keyOf(new Date(b.scheduledDate));
    totals.set(key, (totals.get(key) ?? 0) + b.price);
  }

  // work out which days or months to show
  let from: Date;
  let to: Date;
  const range = getPeriodRange(period, now);
  if (range) {
    from = range.start;
    to = new Date(range.end.getTime() - 1);
  } else if (completed.length) {
    const times = completed.map((b) => new Date(b.scheduledDate).getTime());
    from = new Date(Math.min(...times));
    to = new Date(Math.max(...times));
  } else {
    return [];
  }

  const points: TrendPoint[] = [];
  const cursor = byDay
    ? new Date(from.getFullYear(), from.getMonth(), from.getDate())
    : new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to) {
    points.push({
      label: byDay
        ? cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : `${cursor.toLocaleDateString("en-IN", { month: "short" })} '${String(cursor.getFullYear()).slice(-2)}`,
      revenue: totals.get(keyOf(cursor)) ?? 0,
    });
    if (byDay) cursor.setDate(cursor.getDate() + 1);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}
