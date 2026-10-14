import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { Skeleton } from "../../components/ui/skeleton";
import {
  PERIOD_LABELS,
  filterByPeriod,
  formatRupees,
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
  const { bookings, providers, pending } = useSelector(
    (state: RootState) => state.manager,
  );
  const loading = pending > 0;

  // recalculated only when the bookings or the chosen period change
  const inPeriod = useMemo(
    () => filterByPeriod(bookings, period),
    [bookings, period],
  );
  const summary = useMemo(() => summarise(inPeriod), [inPeriod]);
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
        <div className="flex justify-between">
          <div>Revenue Trends chart</div>
          <div>Booking distribution chart</div>
        </div>
        <div className="flex justify-around">
          <div>Category Revenue Split</div>
        </div>
        <div>
          {/* <table></table> */}
          Table here: Service Category Total Bookings Total Revenue Avg Revenue
          / Booking
        </div>
      </main>
    </div>
  );
}
