import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HTTP_METHODS_ENUM } from "@/common/http.methods";
import { apiService } from "@/common/services/apiService";
import { ENDPOINT_ENUM } from "@/common/endpoints";
import { handleLogout, getStoredUser, getStoredUserId } from "@/common/services/authService";
import { useAuthContext } from "@/common/AuthContext";
import {
  getUserById,
  updateUser,
  addUserAddress,
  deleteUserAddress,
} from "@/services/users.service";
import { getBookingsByCustomer } from "@/services/bookings.service";

function AccountSettingsPage() {
  const navigate = useNavigate();
  const authContext = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");

  const [addresses, setAddresses] = useState<any[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [activities, setActivities] = useState<any[]>([]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const storedUser = getStoredUser();
  const customerId =
    authContext.authDetails?.user?.id ||
    (authContext.authDetails?.user as any)?._id ||
    getStoredUserId() ||
    storedUser?.id ||
    storedUser?._id;

  const showMessage = (text: string) => {
    setMessage(text);
    setError("");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const showError = (text: string) => {
    setError(text);
    setMessage("");

    setTimeout(() => {
      setError("");
    }, 4000);
  };

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const validatePhone = (value: string) => {
    return /^(?!([0-9])\1{9})\d{10}$/.test(value.trim());
  };

  const validateName = (value: string) => {
    return /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(value.trim());
  };

  // Load customer information
  useEffect(() => {
    const loadProfile = async () => {
      if (!customerId) {
        navigate("/auth/login");
        return;
      }

      try {
        const data = await getUserById(customerId);

        setName(data.name || (data as any).full_name || storedUser?.name || "");
        setEmail(data.email || storedUser?.email || "");

        const rawPhone = data.phone
          ? String(data.phone).replace(/\D/g, "").slice(-10)
          : "";

        setPhone(rawPhone);
        setDob(data.dob || "");

        const savedAddresses = Array.isArray(data.addresses)
          ? data.addresses
          : [];
        setAddresses(
          savedAddresses.map((address: any) => ({
            id: address.id ?? address._id,
            tag: address.label || address.tag || "Home",
            text:
              address.line ||
              address.text ||
              [address.city, address.state].filter(Boolean).join(", "),
          })),
        );
      } catch (err) {
        console.error(err);
        showError("Could not load your profile from the server.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [customerId, navigate]);

  // Load recent activity from real bookings
  useEffect(() => {
    const loadActivity = async () => {
      if (!customerId) return;

      try {
        const data = await getBookingsByCustomer(customerId);

        setActivities(
          (data || [])
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt || b.created_at).getTime() -
                new Date(a.createdAt || a.created_at).getTime(),
            )
            .slice(0, 4),
        );
      } catch {
        setActivities([]);
      }
    };

    loadActivity();
  }, [customerId]);

  // Save personal information
  const handleSavePersonalInfo = async () => {
    if (!name.trim()) {
      showError("Name is required.");
      return;
    }

    if (!validateName(name)) {
      showError("Name can contain letters and spaces only.");
      return;
    }

    if (!validateEmail(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    if (!validatePhone(phone)) {
      showError(
        "Phone must be a valid 10-digit number and cannot contain the same digit repeatedly.",
      );
      return;
    }

    if (dob && new Date(dob) >= new Date()) {
      showError("Date of birth must be in the past.");
      return;
    }

    if (!customerId) {
      navigate("/auth/login");
      return;
    }

    setSaving(true);

    try {
      const updatedUserDoc = await updateUser(customerId, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.startsWith("+91") ? phone : `+91${phone}`,
        dob: dob || undefined,
      });

      // Update session storage so UI across the application stays in sync
      const updatedSession = {
        ...(storedUser || {}),
        id: updatedUserDoc._id || customerId,
        _id: updatedUserDoc._id || customerId,
        name: updatedUserDoc.name || name.trim(),
        email: updatedUserDoc.email || email.trim(),
        phone: updatedUserDoc.phone || `+91${phone}`,
      };

      sessionStorage.setItem("user", JSON.stringify(updatedSession));

      showMessage("Personal information saved successfully!");
    } catch (err: any) {
      showError(
        err?.response?.data?.message || err.message || "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Add address
  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      showError("Please enter an address.");
      return;
    }

    if (!customerId) return;

    try {
      const savedAddresses = await addUserAddress(customerId, {
        label: "Home",
        line: newAddress.trim(),
        city: "Sri City",
        location: {
          type: "Point",
          coordinates: [80.027, 13.556],
        },
      } as any);

      if (Array.isArray(savedAddresses)) {
        setAddresses(
          savedAddresses.map((address: any) => ({
            id: address.id ?? address._id,
            tag: address.label || "Home",
            text: address.line || "",
          })),
        );
      }

      setNewAddress("");
      setShowAddressForm(false);
      showMessage("Address added successfully!");
    } catch (err: any) {
      showError(
        err?.response?.data?.message || err.message || "Failed to save address.",
      );
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: string | number) => {
    if (!customerId) return;

    try {
      const savedAddresses = await deleteUserAddress(customerId, String(id));

      if (Array.isArray(savedAddresses)) {
        setAddresses(
          savedAddresses.map((address: any) => ({
            id: address.id ?? address._id,
            tag: address.label || "Home",
            text: address.line || "",
          })),
        );
      } else {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
      showMessage("Address removed.");
    } catch (err: any) {
      showError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to remove address.",
      );
    }
  };

  // Change password: verify current password, then update with bcrypt hash on backend
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }

    if (!customerId || !email) {
      showError("Session expired. Please log in again.");
      return;
    }

    try {
      // 1. Verify current credentials against backend auth/login endpoint
      try {
        await apiService(HTTP_METHODS_ENUM.post, ENDPOINT_ENUM.AUTH_LOGIN, {
          email: email.trim(),
          password: currentPassword,
        });
      } catch {
        showError("Current password is incorrect.");
        return;
      }

      // 2. Update to new password via PATCH /users/:id (bcrypt hashed by usersService.update)
      await updateUser(customerId, {
        password: newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);

      showMessage("Password successfully updated!");
    } catch (err: any) {
      showError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to change password.",
      );
    }
  };

  // Logout using canonical authService
  const onLogoutClick = () => {
    handleLogout();
    navigate("/auth/login");
  };

  // Account deletion notice: Self-service account deletion is restricted by backend admin authorization.
  const handleRequestAccountDeletion = () => {
    showMessage(
      "Self-service account deletion is restricted. Please email support@tatkuunited.com to request account closure.",
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Notifications */}
      {message && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-lg shadow-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="fixed top-6 right-6 z-50 bg-red-500 text-white px-5 py-3 rounded-lg shadow-lg max-w-sm">
          {error}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Profile Hero */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
              {name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {name || "Your Name"}
              </h1>

              <p className="text-slate-500 mt-1">{email}</p>

              <div className="mt-3">
                <span className="font-semibold text-slate-900">4.8 ★</span>

                <span className="text-sm text-slate-500 ml-2">
                  Avg Rating Given
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold">Personal Information</h2>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name
                  </label>

                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-2 border-slate-200 p-3 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border-2 p-3 rounded-lg ${
                      email && !validateEmail(email)
                        ? "border-red-400"
                        : "border-slate-200"
                    }`}
                  />

                  {email && !validateEmail(email) && (
                    <p className="text-red-500 text-sm mt-1">
                      Please enter a valid email address.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>

                  <div className="flex">
                    <span className="bg-slate-100 border-2 border-r-0 border-slate-200 rounded-l-lg px-4 flex items-center">
                      +91
                    </span>

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="10-digit number"
                      className="w-full border-2 border-slate-200 p-3 rounded-r-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full border-2 border-slate-200 p-3 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200">
                <button
                  onClick={handleSavePersonalInfo}
                  disabled={saving}
                  className={`text-white font-medium py-3 px-6 rounded-lg ${
                    saving
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                  }`}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold">Saved Addresses</h2>
              </div>

              <div className="p-6">
                {addresses.length === 0 ? (
                  <p className="text-slate-500">No saved addresses.</p>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex justify-between items-center border border-slate-200 rounded-lg p-4"
                      >
                        <div>
                          <p className="font-semibold">{address.tag}</p>

                          <p className="text-sm text-slate-500 mt-1">
                            {address.text}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showAddressForm && (
                  <div className="mt-5 bg-slate-50 p-4 rounded-lg">
                    <input
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Enter full address..."
                      className="w-full border-2 border-slate-200 p-3 rounded-lg"
                    />

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleAddAddress}
                        className="bg-blue-500 text-white px-5 py-2 rounded-lg cursor-pointer"
                      >
                        Save Address
                      </button>

                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="bg-slate-200 px-5 py-2 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowAddressForm(true)}
                  className="mt-5 text-blue-600 font-medium cursor-pointer"
                >
                  + Add New Address
                </button>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold">Security</h2>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Password</h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Keep your account secure
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="text-blue-600 font-medium cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>

                <hr className="my-5" />

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Logout</h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Sign out of your account
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="text-orange-500 font-medium cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-8">
            {/* Payment */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold">Payment Methods</h2>
              </div>

              <div className="p-6">
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="font-semibold">UPI</p>

                  <p className="text-sm text-slate-500 mt-1">
                    Default payment method
                  </p>
                </div>

                <button
                  onClick={() =>
                    showMessage(
                      "Payment method management will be added with Checkout.",
                    )
                  }
                  className="mt-5 text-blue-600 font-medium cursor-pointer"
                >
                  + Add Payment Method
                </button>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>

              <div className="p-6">
                {activities.length === 0 ? (
                  <p className="text-slate-500">No recent activity.</p>
                ) : (
                  <div className="space-y-5">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="border-b border-slate-100 pb-4"
                      >
                        <p className="font-medium">
                          {activity.service_name || "Home Service"}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          {activity.created_at
                            ? new Date(activity.created_at).toLocaleDateString()
                            : ""}
                        </p>

                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {activity.status || "Upcoming"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone & Account Management */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800">
                  Account Management
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    Active Session
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    End your active session on this device.
                  </p>
                  <button
                    type="button"
                    onClick={onLogoutClick}
                    className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-lg cursor-pointer transition text-sm"
                  >
                    Log Out of Session
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Account Deletion
                  </h3>
                  <div className="mt-2 rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                    <p className="font-semibold">Self-service deletion is restricted</p>
                    <p className="mt-0.5">
                      To safeguard your active bookings and audit history, accounts cannot be deleted directly from this page. To request permanent account closure and personal data removal, please contact an administrator at{" "}
                      <a
                        href="mailto:support@tatkuunited.com"
                        className="font-medium underline hover:text-amber-900"
                      >
                        support@tatkuunited.com
                      </a>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestAccountDeletion}
                    className="w-full mt-3 border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-2.5 rounded-lg cursor-pointer transition text-xs"
                  >
                    Request Account Deletion via Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Change Password</h2>

              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                className="w-full border-2 border-slate-200 p-3 rounded-lg"
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full border-2 border-slate-200 p-3 rounded-lg"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full border-2 border-slate-200 p-3 rounded-lg"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 bg-slate-200 py-3 rounded-lg cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleChangePassword}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSettingsPage;
