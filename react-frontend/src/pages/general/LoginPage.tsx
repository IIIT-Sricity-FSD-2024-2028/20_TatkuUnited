import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleLogin } from "@/common/services/authService";
import { useAuthContext } from "@/common/AuthContext";
import UrlMap from "@/common/urlMap";
import { toast } from "@/components/ui/toast";

interface FormData {
  email: string;
  password: string;
}

const borderClass = (error?: boolean) => {
  return `w-full border-2 p-2 rounded-lg transition-colors focus:outline-none ${
    error
      ? "border-red-500 focus:ring-2 focus:ring-red-500"
      : "border-slate-400 focus:ring-2 focus:ring-blue-500"
  }`;
};

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
  const [errors, setErrors] = useState<FormErrors>({
    email: false,
    password: false,
  });

  const authContext = useAuthContext();

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
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

    const res = await handleLogin(trimmedEmail, trimmedPassword);
    setSubmitting(false);

    if (typeof res !== "string") {
      // Redirect to home route
      authContext.setAuthDetails(res);
      toast.add({
        type: "info",
        description: "Login success",
      });
      navigate(UrlMap[res.user.role]);
    } else {
      toast.add({
        type: "error",
        description: res,
        priority: "high",
      });
    }
  };

  return (
    <div className="w-full max-w-md px-4">
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
          className={`bg-blue-500 mt-4 hover:bg-blue-600 disabled:opacity-60 text-white font-medium w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            submitting ? "cursor-not-allowed" : "cursor-pointer"
          }`}
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
