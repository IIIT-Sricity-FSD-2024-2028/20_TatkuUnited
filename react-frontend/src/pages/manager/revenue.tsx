import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RootState } from "../../store";
import { Skeleton } from "../../components/ui/skeleton";
import {
  PERIOD_LABELS,
  categoryBreakdown,
  filterByPeriod,
  formatRupees,
  revenueTrend,
  summarise,
  type Period,
} from "./revenue-utils";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Calendar,
  LucideBadgeIndianRupee,
  PersonStandingIcon,
} from "lucide-react";

export default function ManagerRevenue() {
  const [period, setPeriod] = useState<Period>("all");
  const { bookings, providers, categories, pending } = useSelector(
    (state: RootState) => state.manager,
  );
  const loading = pending > 0;

  // recalculated only when the bookings or the chosen period change
  const inPeriod = useMemo(
    () => filterByPeriod(bookings, period),
    [bookings, period],
  );
  const summary = useMemo(() => summarise(inPeriod), [inPeriod]);
  const trend = useMemo(() => revenueTrend(inPeriod, period), [inPeriod, period]);
  const hasRevenue = trend.some((point) => point.revenue > 0);
  const categoryRows = useMemo(
    () => categoryBreakdown(inPeriod, categories),
    [inPeriod, categories],
  );
  const activeProviders = providers.filter((p) => p.status === "approved").length;

  const stat = (value: string | number) =>
    loading ? <Skeleton className="h-6 w-24" /> : value;

  return (
    <div>
      <header className="flex justify-between">
        <div>
          <h1>Revenue Overview</h1>
          <p>Track your platform performance and revenue trends</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline">{PERIOD_LABELS[period]}</Button>}
          />
          <DropdownMenuContent className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Select filter</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={period}
                onValueChange={(value) => setPeriod(value as Period)}
              >
                <DropdownMenuRadioItem value="all">
                  All time
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="week">
                  This week
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="month">
                  This month
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="quarter">
                  This quarter
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="year">
                  This year
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main>
        <div className="flex gap-2 justify-between">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
              <CardAction>
                <LucideBadgeIndianRupee />
              </CardAction>
            </CardHeader>
            <CardContent>
              {stat(formatRupees(summary.gross))}
              {!loading && (
                <p className="text-sm text-muted-foreground">
                  Platform share {formatRupees(summary.platformShare)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Number of bookings</CardTitle>
              <CardAction>
                <Calendar />
              </CardAction>
            </CardHeader>
            <CardContent>
              {stat(summary.bookings)}
              {!loading && (
                <p className="text-sm text-muted-foreground">
                  {summary.completed} completed
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Active providers</CardTitle>
              <CardAction>
                <PersonStandingIcon />
              </CardAction>
            </CardHeader>
            <CardContent>{stat(activeProviders)}</CardContent>
          </Card>
        </div>
        <div className="flex justify-between gap-2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : !hasRevenue ? (
                <p className="text-sm text-muted-foreground">
                  No completed bookings in this period.
                </p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 8, right: 8, left: 0 }}>
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        minTickGap={16}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        tickFormatter={(paise: number) =>
                          `₹${new Intl.NumberFormat("en-IN", {
                            notation: "compact",
                          }).format(paise / 100)}`
                        }
                      />
                      <Tooltip
                        cursor={{ fill: "var(--muted)" }}
                        formatter={(value) => [
                          formatRupees(Number(value)),
                          "Revenue",
                        ]}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="var(--primary)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          <div>Booking distribution chart</div>
        </div>
        <div className="flex justify-around">
          <div>Category Revenue Split</div>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : categoryRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed bookings in this period.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 font-medium">Service Category</th>
                    <th className="py-2 font-medium text-right">
                      Total Bookings
                    </th>
                    <th className="py-2 font-medium text-right">
                      Total Revenue
                    </th>
                    <th className="py-2 font-medium text-right">
                      Avg Revenue / Booking
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryRows.map((row) => (
                    <tr key={row.category} className="border-b last:border-0">
                      <td className="py-2">{row.category}</td>
                      <td className="py-2 text-right">{row.bookings}</td>
                      <td className="py-2 text-right">
                        {formatRupees(row.revenue)}
                      </td>
                      <td className="py-2 text-right">
                        {formatRupees(row.average)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
