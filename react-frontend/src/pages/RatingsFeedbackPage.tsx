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
            <main className="max-w-4xl mx-auto px-6 py-10">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Ratings & Feedback
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Tell us about your experience with our service.
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Home Cleaning
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                                Sri City
                            </p>
                        </div>

                        <div className="text-2xl">
                            🛠️
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

                    <h2 className="text-xl font-semibold text-slate-900">
                        How was your service?
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        Your feedback helps us improve our services.
                    </p>

                    <div className="flex gap-2 mt-5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => {
                                    setRating(star);
                                    setError("");
                                    setSubmitted(false);
                                }}
                                className="text-4xl cursor-pointer hover:scale-110 transition"
                            >
                                {star <= rating ? "★" : "☆"}
                            </button>
                        ))}
                    </div>

                    <p className="text-sm text-slate-500 mt-3">
                        {rating === 0
                            ? "Select a rating from 1 to 5"
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
                            className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mt-4">
                            {error}
                        </div>
                    )}

                    {submitted && (
                        <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-3 mt-4">
                            Thank you! Your review has been submitted successfully.
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg mt-6 cursor-pointer transition"
                    >
                        Submit Review
                    </button>

                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        What customers are saying
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="text-yellow-400 text-lg">
                                ★★★★★
                            </div>

                            <p className="text-slate-600 mt-3">
                                "Excellent service and very professional staff."
                            </p>

                            <p className="text-sm font-medium text-slate-900 mt-4">
                                Sarah M.
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="text-yellow-400 text-lg">
                                ★★★★☆
                            </div>

                            <p className="text-slate-600 mt-3">
                                "The service was quick and the staff was helpful."
                            </p>

                            <p className="text-sm font-medium text-slate-900 mt-4">
                                James K.
                            </p>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}

export default RatingsFeedbackPage;