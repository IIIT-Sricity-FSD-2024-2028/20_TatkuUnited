import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../services/api";

interface FormData {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    role: string;
    name: string;
    email: string;
    customer_id?: string | null;
  };
}

const borderClass = (error?: boolean) => {
  return `w-full border-2 p-2 rounded-lg transition-colors focus:outline-none ${error
    ? "border-red-500 focus:border-red-600"
    : "border-slate-400 focus:border-blue-500"
    }`;
};

async function loginUser(postData: { email: string; password: string }): Promise<{ success: boolean, data: LoginResponse | null, error: string | null }> {
  try {
    const response = await axios.post<LoginResponse>(
      `${BASE_URL}/auth/login`,
      postData,
    );
    return { success: true, data: response.data, error: null };
  } catch (error: any) {
    const rawMessage =
      error.response?.data?.message ||
      "Invalid email or password. Please try again.";
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage;
    return { success: false, data: null, error: message };
  }
}

function LoginHeader() {
  return (
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold my-3">Login</h1>
      <p className="text-slate-500">
        Login to get amazing services from Tatku United
      </p>
    </div>
  );
}

function RegisterLink() {
  return (
    <p className="mt-6 text-center">
      Don't have an account?{" "}
      <Link
        className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
        to="/auth/register"
      >
        Register here
      </Link>
    </p>
  );
}

interface FormErrors {
  email?: boolean;
  password?: boolean;
}

function FillUserData() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({
    email: false,
    password: false,
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password.trim();

    // Validate Email & Password atomically
    const emailValid = Boolean(
      trimmedEmail && trimmedEmail.includes("@") && trimmedEmail.includes("."),
    );
    const passwordValid = Boolean(
      trimmedPassword.length >= 8 &&
      (!trimmedEmail || !trimmedPassword.includes(trimmedEmail)),
    );

    const newErrors = {
      email: !emailValid,
      password: !passwordValid,
    };

    setErrors(newErrors);

    if (!emailValid || !passwordValid) return;

    setSubmitting(true);
    setApiError(null);

    const res = await loginUser({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    setSubmitting(false);

    if (res.success && res.data) {
      // Store session details consistent with Tatku United platform standard
      sessionStorage.setItem("tu_auth_token", res.data.access_token);
      sessionStorage.setItem(
        "tu_auth_session",
        JSON.stringify({
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          customer_id: res.data.user.customer_id || null,
          loginAt: Date.now(),
        }),
      );

      // Redirect to home route
      navigate("/");
    } else {
      setApiError(res.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      {apiError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{apiError}</span>
          <button
            type="button"
            className="text-red-700 font-bold ml-2 hover:text-red-900"
            onClick={() => setApiError(null)}
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1 text-left"
          >
            Email Address
          </label>
          <input
            className={borderClass(errors.email)}
            type="email"
            name="email"
            id="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            aria-invalid={errors.email}
          />
          {errors.email && (
            <p className="text-xs text-red-500 text-left mt-1">
              Please enter a valid email address (e.g., user@example.com).
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1 text-left"
          >
            Password
          </label>
          <div className="relative">
            <input
              className={borderClass(errors.password)}
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              aria-invalid={errors.password}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-xs font-semibold select-none px-1 py-0.5"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 text-left mt-1">
              Password must be at least 8 characters long and cannot contain
              your email.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-500 mt-4 cursor-pointer hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <span>Logging in...</span> : "Login"}
        </button>
      </form>
    </div>
  );
}

function LoginPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen p-4">
      <div className="w-full max-w-md p-8">
        <LoginHeader />
        <FillUserData />
        <RegisterLink />
      </div>
    </div>
  );
}

export default LoginPage;
