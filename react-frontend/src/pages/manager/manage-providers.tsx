import { BsStarFill } from "react-icons/bs";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function ManagerManageProviders() {
  const { providers, pending } = useSelector(
    (state: RootState) => state.manager,
  );
  const loading = pending > 0;

  const active = providers.filter((p) => p.status === "approved");
  // providers nobody has rated yet shouldn't pull the average down
  const rated = active.filter((p) => (p.ratingCount ?? 0) > 0);
  const averageRating = rated.length
    ? (rated.reduce((sum, p) => sum + (p.rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";

  const stat = (value: string | number) =>
    loading ? <Skeleton className="h-6 w-16" /> : value;

  return (
    <div>
      <div>
        <h1>Service Providers</h1>
        <p>Manage and monitor your service providers</p>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Provider Pulse</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Card className="w-full max-w-sm">
            <CardContent>
              <div>{stat(active.length)}</div>
              Active
            </CardContent>
          </Card>
          <Card className="w-full max-w-sm">
            <CardContent>
              <div>{stat(averageRating)}</div>
              Average Rating
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Service Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Repeat this card for every provider */}
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>{"Provider name"}</CardTitle>
              <CardDescription>{"Provider category"}</CardDescription>
              <CardAction className="flex items-center gap-1">
                <BsStarFill className="text-yellow-500 text-xl" />
                <div className="flex flex-col">
                  <p>{"Rating"}</p>
                  <p>{"Provider status"}</p>
                </div>
              </CardAction>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
