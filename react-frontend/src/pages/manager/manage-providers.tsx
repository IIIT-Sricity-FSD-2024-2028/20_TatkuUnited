import { BsStarFill } from "react-icons/bs";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function ManagerManageProviders() {
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
              <div>{"active provider conunt"}</div>
              Active
            </CardContent>
          </Card>
          <Card className="w-full max-w-sm">
            <CardContent>
              <div>{"average rating"}</div>
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
