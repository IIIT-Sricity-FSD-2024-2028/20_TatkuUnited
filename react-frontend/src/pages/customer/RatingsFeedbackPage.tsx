import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  fetchCustomerBookings,
} from "@/store/booking/booking-slice";
import {
  ReviewActions,
  fetchReviews,
  submitReview,
} from "@/store/review/review-slice";
import type { ServiceDocument } from "@/models/api.models";

function RatingsFeedbackPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  // all data comes from the store
  const customerId = useSelector((state: RootState) => state.auth.user?.id);
  const { bookings, loaded: bookingsLoaded } = useSelector(
    (state: RootState) => state.booking,
  );
  const {
    reviews: reviewsList,
    submitting,
    error: reviewError,
  } = useSelector((state: RootState) => state.review);
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const loading = !!customerId && !bookingsLoaded;

  // form state only
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const error = formError || reviewError || "";
  const clearErrors = () => {
    setFormError("");
    dispatch(ReviewActions.clearError());
  };

  const targetBookingId = searchParams.get("bookingId");

  useEffect(() => {
    if (!customerId) return;
    dispatch(fetchCustomerBookings());
    dispatch(fetchReviews());
  }, [dispatch, customerId]);

  // pick the booking from the link, else the first completed one
  const selectedBooking =
    completedBookings.find((b) => b._id === selectedBookingId) ??
    completedBookings.find((b) => b._id === targetBookingId) ??
    completedBookings[0] ??
    null;

  const handleSubmit = async () => {
    clearErrors();
    setSuccessMessage("");

    if (!selectedBooking) {
      setFormError("Please select a completed booking to review.");
      return;
    }

    if (rating === 0) {
      setFormError("Please select a rating from 1 to 5 stars before submitting.");
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
      setFormError("This booking does not have valid provider or service references.");
      return;
    }

    try {
      await dispatch(
        submitReview({
          booking: selectedBooking._id,
          provider: providerId,
          service: serviceId,
          rating,
          review: feedback.trim() || undefined,
        }),
      ).unwrap();
      setSuccessMessage("Thank you! Your review has been submitted successfully.");
      setRating(0);
      setFeedback("");
    } catch {
      // the message is in state.review.error
    }
  };

  const serviceName = selectedBooking
    ? typeof selectedBooking.service === "object" && selectedBooking.service !== null
      ? (selectedBooking.service as ServiceDocument).name
      : "Selected Service"
    : "No Service Selected";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div>
<section className="space-y-6">
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
                      setSelectedBookingId(match._id);
                      clearErrors();
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
                        clearErrors();
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
                      clearErrors();
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
        </section>
      </div>


    </div>
  );
}

export default RatingsFeedbackPage;