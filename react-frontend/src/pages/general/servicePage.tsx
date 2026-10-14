import type { ReviewDocument, ServiceDocument } from "@/models/api.models";
import { getReviewsByService, getServiceById } from "@/services";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import PublicNavbar from "../PublicNavbar";
import NotFound from "../components/notFound";
import { Spinner } from "@/components/ui/spinner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

// price is stored in paise (349900 -> ₹3,499)
const formatPrice = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);

// duration is stored in minutes (240 -> "4 hr")
const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= Math.round(value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function ServicePage() {
  const { serviceId } = useParams();
  const [service, setService] = useState<ServiceDocument>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<ReviewDocument[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchService() {
      if (!serviceId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const serviceData = await getServiceById(serviceId);
        setService(serviceData);
      } finally {
        setIsLoading(false);
      }
    }
    fetchService();
  }, [serviceId]);

  // TODO: fetch reviews for this service
  useEffect(() => {
    async function fetchReviews() {
      if (!serviceId) return;
      try {
        setIsReviewsLoading(true);
        const reviewData = await getReviewsByService(serviceId);
        setReviews(reviewData);
      } finally {
        setIsReviewsLoading(false);
      }
    }
    fetchReviews();
  }, [serviceId]);

  if (isLoading)
    return (
      <div>
        <PublicNavbar
          brandInitials="TU"
          brandName="Tatku United"
          key={serviceId}
          onNavigate={navigate}
        />
        <div className="flex h-dvh justify-center items-center">
          <Spinner />
        </div>
      </div>
    );
  if (!serviceId || !service) return <NotFound />;

  return (
    <div>
      <PublicNavbar
        brandInitials="TU"
        brandName="Tatku United"
        key={serviceId}
        onNavigate={navigate}
      />
      <div className="mt-22 mx-auto max-w-5xl px-4 pb-16 space-y-10">
        {/* Header + gallery */}
        <div className="flex flex-col md:flex-row items-center justify-evenly gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{service.name}</h1>
            <Badge>
              {typeof service.category === "string"
                ? service.category
                : service.category.name}
            </Badge>
            {(service.reviewCount ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <StarRating value={service.rating ?? 0} />
                <span className="font-medium">{(service.rating ?? 0).toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({service.reviewCount ?? 0} reviews)
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-row justify-center">
            {service.imageUrls && service.imageUrls.length > 0 && (
              <Carousel className="w-full max-w-48 sm:max-w-xs">
                <CarouselContent>
                  {service.imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <Card>
                          <CardContent>
                            <img
                              src={url}
                              alt={`${service.name} ${index + 1}`}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>
        </div>

        {/* Summary + booking */}
        <div className="space-y-2">
          <p>{service.description}</p>
          <p>Price: {formatPrice(service.price)}</p>
          <p>Duration: {formatDuration(service.duration)}</p>
          <Badge variant={service.isActive ? "default" : "secondary"}>
            {service.isActive ? "Active" : "Unavailable"}
          </Badge>
          <div>
            <Button disabled={!service.isActive}>Book now</Button>
          </div>
        </div>

        {/* How it works */}
        {service.howItWorks && service.howItWorks.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xl font-semibold">How it works?</h3>
            <div className="space-y-2">
              {service.howItWorks.map((step, idx) => (
                <Item key={idx} variant="outline">
                  <ItemContent>
                    <ItemTitle>{step.title}</ItemTitle>
                    <ItemDescription>{step.desc}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </div>
          </section>
        )}

        {/* Covered / not covered */}
        <div className="flex flex-col md:flex-row justify-evenly gap-6">
          {service.whatIsCovered && service.whatIsCovered.length > 0 && (
            <section className="flex-1 space-y-3">
              <h3 className="text-xl font-semibold">What is covered?</h3>
              {service.whatIsCovered.map((wic, idx) => (
                <Item className="rounded-none" key={idx} variant="outline">
                  <ItemContent>
                    <ItemDescription>{wic}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </section>
          )}
          {service.whatIsNotCovered && service.whatIsNotCovered.length > 0 && (
            <section className="flex-1 space-y-3">
              <h3 className="text-xl font-semibold">What is not covered?</h3>
              {service.whatIsNotCovered.map((winc, idx) => (
                <Item className="rounded-none" key={idx} variant="outline">
                  <ItemContent>
                    <ItemDescription>{winc}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </section>
          )}
        </div>

        {/* FAQ */}
        {service.faq && service.faq.length > 0 && (
          <>
            <Separator />
            <section className="space-y-3">
              <h3 className="text-xl font-semibold">
                Frequently asked questions
              </h3>
              <Accordion className="w-full">
                {service.faq.map((item, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </>
        )}

        {/* Ratings & reviews */}
        <Separator />
        <section className="space-y-6">
          <h3 className="text-xl font-semibold">Ratings & reviews</h3>

          {/* Rating summary (already available on the service) */}
          <div className="flex items-center gap-4">
            <span className="text-5xl font-semibold">
              {(service.rating ?? 0).toFixed(1)}
            </span>
            <div className="space-y-1">
              <StarRating value={service.rating ?? 0} size={20} />
              <p className="text-sm text-muted-foreground">
                Based on {service.reviewCount ?? 0} reviews
              </p>
            </div>
          </div>

          {/* Review list (placeholder, wire up fetching in the effect above) */}
          {isReviewsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reviews to show yet.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <StarRating value={review.rating} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    {review.review && (
                      <p className="text-sm">{review.review}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
