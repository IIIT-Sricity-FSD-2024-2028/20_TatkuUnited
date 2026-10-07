import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function SchedulePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const serviceName = searchParams.get("service") || "Home Cleaning";
    const location = searchParams.get("location") || "Sri City";
    const price = Number(searchParams.get("price")) || 500;

    const [mode, setMode] = useState("instant");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    const handleAddToCart = () => {
        if (mode === "scheduled" && (!date || !time)) {
            alert("Please select a date and time.");
            return;
        }

        const newItem = {
            id: Date.now(),
            serviceName: serviceName,
            location: location,
            schedule:
                mode === "instant"
                    ? "Instant Booking"
                    : `Scheduled for ${date} at ${time}`,
            price: price,
        };

        const existingCart = JSON.parse(
            localStorage.getItem("cartItems") || "[]"
        );

        localStorage.setItem(
            "cartItems",
            JSON.stringify([...existingCart, newItem])
        );

        navigate("/cart");
    };

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="max-w-3xl mx-auto px-6 py-12">

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Schedule Your Service
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Choose when you want your service to be provided.
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="bg-white border border-slate-200 rounded-xl p-2 flex gap-2 mb-6">

                    <button
                        className={`flex-1 py-3 rounded-lg font-medium cursor-pointer ${
                            mode === "instant"
                                ? "bg-blue-500 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                        onClick={() => setMode("instant")}
                    >
                        Instant
                    </button>

                    <button
                        className={`flex-1 py-3 rounded-lg font-medium cursor-pointer ${
                            mode === "scheduled"
                                ? "bg-blue-500 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                        onClick={() => setMode("scheduled")}
                    >
                        Scheduled
                    </button>

                </div>

                {/* Schedule Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

                    {/* Info Banner */}
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-4 mb-6">
                        {mode === "instant"
                            ? "Your service will be assigned to an available provider immediately."
                            : "Choose your preferred date and time for the service."}
                    </div>

                    {/* Scheduled Fields */}
                    {mode === "scheduled" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Date
                                </label>

                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full border-2 border-slate-200 p-3 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Time
                                </label>

                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full border-2 border-slate-200 p-3 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                            </div>

                        </div>
                    )}

                    {/* Service Summary */}
                    <div className="border-t border-slate-200 pt-6">

                        <h2 className="text-xl font-semibold text-slate-900 mb-5">
                            Service Summary
                        </h2>

                        <div className="space-y-4">

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Service
                                </span>

                                <span className="font-medium text-slate-900">
                                    {serviceName}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Location
                                </span>

                                <span className="font-medium text-slate-900">
                                    {location}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Estimated Price
                                </span>

                                <span className="font-bold text-blue-600">
                                    ₹{price}
                                </span>
                            </div>

                        </div>

                    </div>

                    {/* Add To Cart */}
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg cursor-pointer transition mt-8"
                    >
                        Add to Cart
                    </button>

                </div>

            </main>

        </div>
    );
}

export default SchedulePage;