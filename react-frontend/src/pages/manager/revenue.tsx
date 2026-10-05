import { useState } from "react";
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
  const [filter, setFilter] = useState<string>("");
  return (
    <div>
      <header className="flex justify-between">
        <div>
          <h1>Revenue Overview</h1>
          <p>Track your platform performance and revenue trends</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline">Filter</Button>}
          />
          <DropdownMenuContent className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Select filter</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
                <DropdownMenuRadioItem value="all">
                  All time
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="week">
                  This week
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="month">
                  This month
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="quater">
                  This quater
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
            <CardContent>{"total revenue"}</CardContent>
          </Card>
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Number of bookings</CardTitle>
              <CardAction>
                <Calendar />
              </CardAction>
            </CardHeader>
            <CardContent>{"total bookings"}</CardContent>
          </Card>
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Active providers</CardTitle>
              <CardAction>
                <PersonStandingIcon />
              </CardAction>
            </CardHeader>
            <CardContent>{"total bookings"}</CardContent>
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
