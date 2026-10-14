import AssignedJobs from "./AssignedJobs";
import JobCalender from "./JobCalender";
import Settings from "./Settings";
import { Card, CardContent } from "@/components/ui/card";

type BodyProps = {
  activePage: string;
};

export default function Body({ activePage }: BodyProps) {
  let content;

  switch (activePage) {
    case "Dashboard":
      content = <AssignedJobs />;
      break;
    case "Job Calender":
      content = <JobCalender />;
      break;
    case "Reports":
      content = <AssignedJobs />;
      break;
    case "Settings":
      content = <Settings />;
      break;
    case "Earnings":
      content = <Settings />;
      break;

    default:
      content = (
        <Card>
          <CardContent className="pt-6">Page not found</CardContent>
        </Card>
      );
  }

  return (
    <main className="flex-1 bg-muted/30 p-4 sm:p-8">
      {content}
    </main>
  );
}
