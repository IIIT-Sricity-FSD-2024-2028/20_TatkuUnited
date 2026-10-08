import { useState } from "react";

function RatingsFeedbackPage() {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        setError("");
        setSubmitted(false);

        if (rating === 0) {
            setError("Please select a rating before submitting.");
            return;
        }

        if (!feedback.trim()) {
            setError("Please write some feedback before submitting.");
            return;
        }

        setSubmitted(true);
        setRating(0);
        setFeedback("");
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-3xl mx-auto px-6 py-10">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Rate Your Service
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Share your experience with us.
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

                    <h2 className="text-xl font-semibold text-slate-900">
                        How was your service?
                    </h2>

                    <div className="flex gap-2 mt-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => {
                                    setRating(star);
                                    setError("");
                                    setSubmitted(false);
                                }}
                                className="text-3xl cursor-pointer hover:scale-110 transition"
                            >
                                {star <= rating ? "★" : "☆"}
                            </button>
                        ))}
                    </div>

                    <p className="text-sm text-slate-500 mt-3">
                        {rating === 0
                            ? "Select a rating"
                            : `You rated this service ${rating}/5`}
                    </p>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Your Feedback
                        </label>

                        <textarea
                            value={feedback}
                            onChange={(e) => {
                                setFeedback(e.target.value);
                                setError("");
                                setSubmitted(false);
                            }}
                            placeholder="Tell us about your experience..."
                            rows={5}
                            className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 mt-3">
                            {error}
                        </p>
                    )}

                    {submitted && (
                        <p className="text-sm text-green-600 mt-3">
                            Thank you! Your review has been submitted successfully.
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg mt-6 cursor-pointer transition"
                    >
                        Submit Review
                    </button>

                </div>
            </main>
        </div>
    );
}

export default RatingsFeedbackPage;