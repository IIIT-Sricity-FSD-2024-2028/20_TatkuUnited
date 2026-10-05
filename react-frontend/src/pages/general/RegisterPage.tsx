import axios from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  address?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
}

const BASE_URL = "http://localhost:10000";

const borderClass = (error?: boolean) => {
  return `w-full border-2 p-2 rounded-lg ${error ? "border-red-500" : "border-slate-400"}`;
};

async function createUserAccount(postData: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "" | "customer" | "service_provider";
}) {
  try {
    await axios.post(`${BASE_URL}/auth/register`, postData);
    return true;
  } catch (error) {
    return false;
  }
}

function CreateAccount() {
  return (
    <div>
      <h1 className="text-3xl font-bold my-3">Create your account</h1>
      <p className="text-slate-500">
        Register to get started with Tatku United
      </p>
    </div>
  );
}

interface SelectRolePageProps {
  role: "" | "customer" | "service_provider";
  setRole: React.Dispatch<
    React.SetStateAction<"" | "customer" | "service_provider">
  >;
  setCurPage: React.Dispatch<React.SetStateAction<number>>;
}

function SelectRolePage({ role, setRole, setCurPage }: SelectRolePageProps) {
  return (
    <div>
      <p className="text-md my-2 text-slate-600">Who are you registering as?</p>
      <div className="flex items-center gap-2">
        <div
          onClick={() => setRole("customer")}
          className={`${role == "customer" ? "bg-blue-100 text-blue-800 border-2 border-blue-600" : "border-2 border-slate-400"} cursor-pointer hover:border-2 ease-in-out duration-200 hover:bg-blue-100 hover:text-blue-600 flex justify-center items-center font-medium w-48 h-16 rounded-lg p-2`}
        >
          Customer
        </div>
        <div
          onClick={() => setRole("service_provider")}
          className={`${role == "service_provider" ? "bg-blue-100 text-blue-800 border-2 border-blue-600" : "border-2 border-slate-400"} cursor-pointer hover:border-2 ease-in-out duration-200 hover:bg-blue-100 hover:text-blue-600 flex justify-center items-center font-medium w-48 h-16 rounded-lg p-2`}
        >
          Service Provider
        </div>
      </div>
      <div className="flex justify-center">
        <button
          className="bg-blue-500 mt-6 cursor-pointer hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg"
          onClick={() => setCurPage(2)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

interface FillUserDataProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setCurPage: React.Dispatch<React.SetStateAction<number>>;
}

function FillUserData({
  formData,
  setFormData,
  errors,
  setErrors,
  setCurPage,
}: FillUserDataProps) {
  const [invalidData, setInvalidData] = useState<boolean>(false);

  const updateField = (
    field: keyof FormData,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((formData) => ({
      ...formData,
      [field]: e.target.value,
    }));
  };

  const validateData = () => {
    const newErrors: FormErrors = {
      name: formData.name.length < 3 || formData.name.length > 200,
      phone: formData.phone.length !== 10,
      email: !formData.email.includes("@") || !formData.email.includes("."),
      address: formData.address.length < 10,
    };
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return !Object.values(newErrors).some(Boolean);
  };

  return (
    <div className="w-full md:w-md">
      <h2 className="my-4 text-xl font-semibold text-left mx-5">
        Your personal information
      </h2>
      <form className="flex flex-col gap-4 mx-5">
        <input
          className={borderClass(errors.name)}
          type="text"
          name="name"
          id="name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) => updateField("name", e)}
        />
        <input
          className={borderClass(errors.phone)}
          type="text"
          name="phone"
          id="phone"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={(e) => updateField("phone", e)}
        />
        <input
          className={borderClass(errors.email)}
          type="text"
          name="email"
          id="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => updateField("email", e)}
        />
        <input
          className={borderClass(errors.address)}
          type="text"
          name="address"
          id="address"
          placeholder="Enter your address"
          value={formData.address}
          onChange={(e) => updateField("address", e)}
        />
      </form>
      <p
        className={`text-sm text-left my-2 mx-5 text-red-500 ${invalidData ? "" : "hidden"}`}
      >
        {" "}
        Invalid data filled.
      </p>
      <div className="flex justify-center mx-5 gap-2.5">
        <button
          className="bg-blue-500 mt-6 cursor-pointer hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg"
          onClick={() => setCurPage(1)}
        >
          Back
        </button>
        <button
          className="bg-blue-500 mt-6 cursor-pointer hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg"
          onClick={() => {
            if (!validateData()) {
              setInvalidData(true);
              return;
            }

            setInvalidData(false);
            setCurPage(3);
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

interface FillPasswordProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setCurPage: React.Dispatch<React.SetStateAction<number>>;
  role: "" | "customer" | "service_provider";
}

function FillPassword({
  formData,
  setFormData,
  errors,
  setErrors,
  setCurPage,
  role,
}: FillPasswordProps) {
  const [submitting, setSubmitting] = useState(false);

  const updateField = (
    field: keyof FormData,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((formData) => ({
      ...formData,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    const { password, confirmPassword, name, email } = formData;
    const invalid =
      password.length < 8 ||
      password.includes(name) ||
      password.includes(email) ||
      confirmPassword !== password;

    setErrors((prev) => ({
      ...prev,
      password: invalid,
      confirmPassword: invalid,
    }));

    if (invalid) return;

    setSubmitting(true);
    const res = await createUserAccount({
      fullName: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password.trim(),
      role,
    });
    setSubmitting(false);

    setCurPage(res ? 4 : 5);
  };

  return (
    <div className="w-full md:w-md">
      <h3 className="my-4 text-xl font-semibold text-left mx-5">
        Set your password
      </h3>
      <form className="flex flex-col gap-4 mx-5">
        <input
          className={borderClass(errors.password)}
          type="password"
          name="password"
          id="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => updateField("password", e)}
        />
        <input
          className={borderClass(errors.confirmPassword)}
          type="password"
          name="confirm-password"
          id="confirm-password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e)}
        />
      </form>
      <div className="flex justify-center mx-5 gap-2.5">
        <button
          className="bg-blue-500 mt-6 cursor-pointer hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg"
          onClick={() => {
            setCurPage(2);
            setFormData((prev) => ({
              ...prev,
              password: "",
              confirmPassword: "",
            }));
            setErrors({});
          }}
        >
          Back
        </button>
        <button
          disabled={submitting}
          className="bg-blue-500 mt-6 cursor-pointer hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium w-full py-3 px-4 rounded-lg"
          onClick={handleSubmit}
        >
          {submitting ? "Creating account..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

function LoginLink() {
  return (
    <p className="mt-4">
      Already have an account?{" "}
      <Link className="text-blue-500 cursor-pointer" to="/auth/login">
        Login here
      </Link>
    </p>
  );
}

function RegistrationSuccess() {
  return (
    <div>
      <h1 className="text-3xl font-bold my-3">Account Created!</h1>
      <p className="text-slate-500">
        Proceed to login:{" "}
        <Link className="text-blue-500 cursor-pointer" to="/auth/login">
          Login here
        </Link>
      </p>
    </div>
  );
}

function RegistrationFailed() {
  return (
    <div>
      <h1 className="text-3xl font-bold my-3">Account Creation Failed!</h1>
      <p className="text-slate-500">Try again later.</p>
    </div>
  );
}

function RegisterPage() {
  const [curPage, setCurPage] = useState(1);
  const [role, setRole] = useState<"" | "customer" | "service_provider">("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen">
      {curPage != 4 && curPage != 5 && <CreateAccount />}
      {curPage == 1 && (
        <SelectRolePage
          key={curPage}
          role={role}
          setRole={setRole}
          setCurPage={setCurPage}
        />
      )}
      {curPage == 2 && (
        <FillUserData
          key={curPage}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          setCurPage={setCurPage}
        />
      )}
      {curPage == 3 && (
        <FillPassword
          key={curPage}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          setCurPage={setCurPage}
          role={role}
        />
      )}
      {curPage == 4 && <RegistrationSuccess />}
      {curPage == 5 && <RegistrationFailed />}
      {curPage != 4 && curPage != 5 && <LoginLink />}
    </div>
  );
}

export default RegisterPage;
