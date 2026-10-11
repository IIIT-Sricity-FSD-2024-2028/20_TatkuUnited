import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:10000";

function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validateEmail = (value: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    };

    const handleLogin = async () => {
        setError("");

        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Password is required.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                    role: "customer",
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Invalid email or password."
                );
            }

            if (!data?.access_token || !data?.user) {
                throw new Error("Invalid login response from server.");
            }

            // Save authentication token
            sessionStorage.setItem(
                "tu_auth_token",
                data.access_token
            );

            // Save logged-in user session
            sessionStorage.setItem(
                "tu_auth_session",
                JSON.stringify({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    customer_id: data.user.customer_id || null,
                    loginAt: Date.now(),
                })
            );

            // Go to Account Settings for now
            navigate("/account-settings");

        } catch (err: any) {
            setError(
                err.message ||
                "Something went wrong while logging in."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">

            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">

                    <div className="w-16 h-16 mx-auto bg-blue-500 text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                        TU
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome Back
                    </h1>

                    <p className="text-slate-500 mt-2">
                        Login to your Tatku United account
                    </p>

                </div>

                {/* Login Card */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-5 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div className="mb-5">

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email Address
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={`w-full border-2 p-3 rounded-lg focus:outline-none ${
                                email && !validateEmail(email)
                                    ? "border-red-400"
                                    : "border-slate-200 focus:border-blue-500"
                            }`}
                        />

                        {email && !validateEmail(email) && (
                            <p className="text-red-500 text-sm mt-1">
                                Please enter a valid email address.
                            </p>
                        )}

                    </div>

                    {/* Password */}
                    <div className="mb-6">

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full border-2 border-slate-200 p-3 rounded-lg focus:outline-none focus:border-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleLogin();
                                }
                            }}
                        />

                    </div>

                    {/* Login Button */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg cursor-pointer transition"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    {/* Register */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Don't have an account?{" "}
                        <button
                            onClick={() => navigate("/auth/register")}
                            className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                        >
                            Register
                        </button>
                    </p>

                </div>

            </div>

        </div>
    );
}

export default LoginPage;