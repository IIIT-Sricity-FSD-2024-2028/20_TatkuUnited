import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleRegister } from "@/common/services/authService";
import type { Role } from "@/common/roles.enum";
import { toast } from "@/components/ui/toast";
import { ENDPOINT_ENUM } from "@/common/endpoints";
import { CitySelect } from "@/components/shared/CitySelect";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { SUPPORTED_CITIES } from "@/common/cities";

interface FormData {
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  coordinates: [number, number];
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  addressLine?: boolean;
  city?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
}

const borderClass = (error?: boolean) => {
  return `w-full border-2 p-2 rounded-lg ${error ? "border-red-500" : "border-slate-400"}`;
};

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
  role: Role;
  setRole: React.Dispatch<React.SetStateAction<Role>>;
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
          onClick={() => setRole("provider")}
          className={`${role == "provider" ? "bg-blue-100 text-blue-800 border-2 border-blue-600" : "border-2 border-slate-400"} cursor-pointer hover:border-2 ease-in-out duration-200 hover:bg-blue-100 hover:text-blue-600 flex justify-center items-center font-medium w-48 h-16 rounded-lg p-2`}
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

interface FillLocationDataProps {
  role: Role;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setCurPage: React.Dispatch<React.SetStateAction<number>>;
}

function FillLocationData({
  role,
  formData,
  setFormData,
  errors,
  setErrors,
  setCurPage,
}: FillLocationDataProps) {
  const [cityCenterHint, setCityCenterHint] = useState<[number, number]>(
    formData.coordinates,
  );
  const [invalidData, setInvalidData] = useState(false);

  const validateLocation = () => {
    const newErrors: FormErrors = {
      city: !formData.city.trim(),
      addressLine: formData.addressLine.trim().length < 5,
    };
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return !Object.values(newErrors).some(Boolean);
  };

  return (
    <div className="w-full max-w-lg px-5">
      <h2 className="mt-4 mb-1 text-xl font-semibold text-left">
        {role === "customer" ? "Your Home Address" : "Your Default Location"}
      </h2>
      <p className="text-sm text-slate-500 mb-4 text-left">
        {role === "customer"
          ? "Saved as your Home address. You can add more addresses later."
          : "Used as your default service location."}
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            City
          </label>
          <CitySelect
            value={formData.city}
            onChange={(cityOption) => {
              setFormData((prev) => ({
                ...prev,
                city: cityOption.name,
                coordinates: cityOption.coordinates,
              }));
              setCityCenterHint(cityOption.coordinates);
            }}
            className={`w-full border-2 p-2 rounded-lg bg-white text-sm ${
              errors.city ? "border-red-500" : "border-slate-400"
            }`}
            required
          />
        </div>

        <LocationPicker
          value={formData.coordinates}
          centerHint={cityCenterHint}
          heightClass="h-52"
          label="Pin Location on Map or Use Live Location"
          onChange={(coords, resolved) => {
            setFormData((prev) => ({
              ...prev,
              coordinates: coords,
              city: resolved?.city ?? prev.city,
              addressLine: resolved?.addressLine || prev.addressLine,
            }));
          }}
        />

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Street Address Line
          </label>
          <input
            className={borderClass(errors.addressLine)}
            type="text"
            name="addressLine"
            id="addressLine"
            placeholder="Flat / House No., Street, Area"
            value={formData.addressLine}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, addressLine: e.target.value }))
            }
          />
        </div>
      </div>

      {invalidData && (
        <p className="text-sm text-left my-2 text-red-500">
          Please select a city and enter your street address (at least 5 characters).
        </p>
      )}

      <div className="flex justify-center gap-2.5">
        <button
          type="button"
          className="bg-blue-500 mt-6 cursor-pointer hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg"
          onClick={() => setCurPage(2)}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-blue-500 mt-6 cursor-pointer hover:bg-blue-600 text-white font-medium w-full py-3 px-4 rounded-lg"
          onClick={() => {
            if (!validateLocation()) {
              setInvalidData(true);
              return;
            }
            setInvalidData(false);
            setCurPage(4);
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
  role: Role;
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

  const navigate = useNavigate();

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

    const res = await handleRegister({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password.trim(),
      role,
      address: {
        line: formData.addressLine.trim(),
        city: formData.city,
        location: {
          type: "Point",
          coordinates: formData.coordinates,
        },
      },
    });
    setSubmitting(false);

    if (res === "success") {
      toast.add({
        type: "info",
        description: "Account created successfully",
      });
      navigate(ENDPOINT_ENUM.AUTH_LOGIN);
    } else {
      toast.add({
        type: "error",
        description: res,
      });
    }
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
            setCurPage(3);
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
          className={`bg-blue-500 mt-6 hover:bg-blue-600 disabled:opacity-60 text-white font-medium w-full py-3 px-4 rounded-lg ${
            submitting ? "cursor-not-allowed" : "cursor-pointer"
          }`}
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

function RegisterPage() {
  const [curPage, setCurPage] = useState(1);
  const [role, setRole] = useState<Role>("customer");

  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    addressLine: "",
    city: SUPPORTED_CITIES[0].name,
    coordinates: SUPPORTED_CITIES[0].coordinates,
    password: "",
    confirmPassword: "",
  });

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full py-8">
      <CreateAccount />
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
        <FillLocationData
          key={curPage}
          role={role}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          setCurPage={setCurPage}
        />
      )}
      {curPage == 4 && (
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
      <LoginLink />
    </div>
  );
}

export default RegisterPage;
