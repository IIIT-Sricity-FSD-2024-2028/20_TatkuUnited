import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PublicNavbar from "../PublicNavbar";
import Footer from "../general/landing/Footer";
import { useAuthContext } from "@/common/AuthContext";
import { getStoredUser, getStoredUserId } from "@/common/services/authService";
import { getBookingsByCustomer } from "@/services/bookings.service";
import { createReview, getAllReviews } from "@/services/reviews.service";
import type { BookingDocument, ReviewDocument, ServiceDocument } from "@/models/api.models";

function RatingsFeedbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authContext = useAuthContext();

  const [completedBookings, setCompletedBookings] = useState<BookingDocument[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingDocument | null>(null);
  const [reviewsList, setReviewsList] = useState<ReviewDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const storedUser = getStoredUser();
  const customerId =
    authContext.authDetails?.user?.id ||
    (authContext.authDetails?.user as any)?._id ||
    getStoredUserId() ||
    storedUser?.id ||
    storedUser?._id;

  const targetBookingId = searchParams.get("bookingId");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!customerId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const [bookings, reviews] = await Promise.all([
          getBookingsByCustomer(customerId).catch(() => []),
          getAllReviews().catch(() => []),
        ]);

        if (!isMounted) return;

        const completed = (bookings || []).filter(
          (b) => b.status === "completed",
        );
        setCompletedBookings(completed);
        setReviewsList(reviews || []);

        if (targetBookingId) {
          const match = completed.find((b) => b._id === targetBookingId);
          if (match) setSelectedBooking(match);
          else if (completed.length > 0) setSelectedBooking(completed[0]);
        } else if (completed.length > 0) {
          setSelectedBooking(completed[0]);
        }
      } catch (err: any) {
        if (isMounted) {
          setError("Failed to load your booking history for reviews.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [customerId, targetBookingId]);

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    if (!selectedBooking) {
      setError("Please select a completed booking to review.");
      return;
    }

    if (rating === 0) {
      setError("Please select a rating from 1 to 5 stars before submitting.");
      return;
    }

    const providerId =
      typeof selectedBooking.provider === "object" && selectedBooking.provider !== null
        ? (selectedBooking.provider as any)._id
        : selectedBooking.provider;

    const serviceId =
      typeof selectedBooking.service === "object" && selectedBooking.service !== null
        ? (selectedBooking.service as any)._id
        : selectedBooking.service;

    if (!providerId || !serviceId) {
      setError("This booking does not have valid provider or service references.");
      return;
    }

    setSubmitting(true);
    try {
      await createReview({
        booking: selectedBooking._id,
        provider: providerId,
        service: serviceId,
        rating,
        review: feedback.trim() || undefined,
      });

      setSuccessMessage("Thank you! Your review has been submitted successfully.");
      setRating(0);
      setFeedback("");

      // Refresh public reviews list
      const updatedReviews = await getAllReviews().catch(() => []);
      setReviewsList(updatedReviews);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit review. Each booking can only be reviewed once.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const serviceName = selectedBooking
    ? typeof selectedBooking.service === "object" && selectedBooking.service !== null
      ? (selectedBooking.service as ServiceDocument).name
      : "Selected Service"
    : "No Service Selected";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <PublicNavbar
          brandName="TatkuUnited"
          brandInitials="TU"
          onNavigate={(path) => navigate(path)}
        />

        <main className="max-w-4xl mx-auto px-6 pt-32 pb-16">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Ratings & Feedback
            </h1>

            <p className="text-slate-500 mt-2">
              Share your genuine feedback on completed services to help improve platform quality.
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
              <p>Checking completed bookings...</p>
            </div>
          ) : completedBookings.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800 mb-8">
              <div className="text-3xl mb-2">ℹ️</div>
              <h2 className="text-lg font-bold">No Completed Bookings Found</h2>
              <p className="mt-2 text-sm max-w-md mx-auto">
                Reviews can only be submitted for completed services rendered by a service provider. Once your booking is marked completed, you will be able to leave a rating here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/customer/bookings")}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition cursor-pointer"
              >
                View My Bookings
              </button>
            </div>
          ) : (
            <>
              {/* Completed Booking Selector */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Completed Service to Review:
                </label>
                <select
                  value={selectedBooking?._id || ""}
                  onChange={(e) => {
                    const match = completedBookings.find((b) => b._id === e.target.value);
                    if (match) {
                      setSelectedBooking(match);
                      setError("");
                      setSuccessMessage("");
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none bg-white"
                >
                  {completedBookings.map((b) => {
                    const name =
                      typeof b.service === "object" && b.service !== null
                        ? (b.service as ServiceDocument).name
                        : "Service";
                    const date = b.scheduledDate
                      ? new Date(b.scheduledDate).toLocaleDateString("en-IN")
                      : "Completed";
                    return (
                      <option key={b._id} value={b._id}>
                        {name} — {date} (#{b._id.slice(-6)})
                      </option>
                    );
                  })}
                </select>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{serviceName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Booking Ref: <span className="font-mono">{selectedBooking?._id}</span>
                    </p>
                  </div>
                  <div className="text-2xl">🛠️</div>
                </div>
              </div>

              {/* Review Submission Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
                <h2 className="text-xl font-semibold text-slate-900">
                  How was your service?
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Your feedback is verified against your completed booking.
                </p>

                <div className="flex gap-2 mt-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        setError("");
                        setSuccessMessage("");
                      }}
                      className="text-4xl cursor-pointer hover:scale-110 transition text-amber-400"
                    >
                      {star <= rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-slate-500 mt-2">
                  {rating === 0
                    ? "Click stars to rate (1 to 5)"
                    : `You rated this service ${rating} out of 5 stars`}
                </p>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Feedback (Optional)
                  </label>

                  <textarea
                    value={feedback}
                    onChange={(e) => {
                      setFeedback(e.target.value);
                      setError("");
                      setSuccessMessage("");
                    }}
                    placeholder="Tell us about the punctuality, cleanliness, and overall quality of work..."
                    rows={4}
                    className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 resize-none text-sm"
                  />
                </div>

                {error && (
                  <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mt-4 text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 mt-4 text-sm">
                    {successMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium w-full py-3 px-4 rounded-lg mt-6 cursor-pointer transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting Review...
                    </>
                  ) : (
                    "Submit Verified Review"
                  )}
                </button>
              </div>
            </>
          )}

          {/* Real Customer Reviews Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Recent Verified Reviews
            </h2>

            {reviewsList.length === 0 ? (
              <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6 text-center">
                No verified customer reviews have been submitted yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewsList.slice(0, 6).map((rev) => {
                  const stars = "★".repeat(rev.rating) + "☆".repeat(Math.max(0, 5 - rev.rating));
                  const date = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString("en-IN")
                    : "";
                  return (
                    <div
                      key={rev._id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-amber-400 text-lg">{stars}</div>
                        <span className="text-xs text-slate-400">{date}</span>
                      </div>

                      <p className="text-slate-600 mt-2 text-sm italic">
                        "{rev.review || "Rating submitted without text comments."}"
                      </p>

                      <p className="text-xs font-semibold text-slate-700 mt-3">
                        Verified Customer
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default RatingsFeedbackPage;