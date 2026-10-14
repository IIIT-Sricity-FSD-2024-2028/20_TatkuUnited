import {
  Card,
  CardHeader,
  CardAction,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ServiceDocument } from "@/models/api.models";
import { useNavigate } from "react-router-dom";

export default function ServiceCard({ service }: { service: ServiceDocument }) {
  const navigate = useNavigate();
  function handleExplore() {
    navigate(`/services/${service._id}`);
  }
  function handleBook() {
    navigate(`/customer/schedule/${service._id}`);
  }

  return (
    <Card className="w-full max-w-sm pt-0">
      <img
        src={service.imageUrls[0]}
        alt="Service cover image"
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction>
          <Badge variant="secondary">
            {typeof service.category === "string"
              ? service.category
              : service.category.name}
          </Badge>
        </CardAction>
        <CardTitle>{service.name}</CardTitle>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={handleExplore} className="w-38 mx-3">
          Explore more
        </Button>
        <Button onClick={handleBook} className="w-38 mx-3">
          Book now
        </Button>
      </CardFooter>
    </Card>
  );
}
