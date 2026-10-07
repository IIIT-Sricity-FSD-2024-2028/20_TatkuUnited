import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:10000";

function AccountSettingsPage() {
    const navigate = useNavigate();

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

    const getSession = () => {
        try {
            return JSON.parse(
                sessionStorage.getItem("tu_auth_session") || "null"
            );
        } catch {
            return null;
        }
    };

    const getToken = () => {
        return sessionStorage.getItem("tu_auth_token");
    };

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
            const session = getSession();
            const token = getToken();

            if (!session || !token) {
                navigate("/auth/login");
                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/customers/${session.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Unable to load profile.");
                }

                const data = await response.json();

                setName(data.full_name || session.name || "");
                setEmail(data.email || session.email || "");

                const rawPhone = data.phone
                    ? String(data.phone).replace(/\D/g, "").slice(-10)
                    : "";

                setPhone(rawPhone);
                setDob(data.dob || "");

                const savedAddresses = data.saved_addresses || [];

                if (savedAddresses.length > 0) {
                    setAddresses(savedAddresses);
                } else if (data.address) {
                    setAddresses([
                        {
                            id: 1,
                            tag: "Home",
                            text: data.address,
                        },
                    ]);
                }

            } catch (err) {
                console.error(err);
                showError("Could not load your profile.");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);

    // Load recent activity
    useEffect(() => {
        const loadActivity = async () => {
            const token = getToken();

            if (!token) return;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/bookings/my`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) return;

                const data = await response.json();

                setActivities(
                    (data || [])
                        .sort(
                            (a: any, b: any) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime()
                        )
                        .slice(0, 4)
                );
            } catch {
                setActivities([]);
            }
        };

        loadActivity();
    }, []);

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
                "Phone must be a valid 10-digit number and cannot contain the same digit repeatedly."
            );
            return;
        }

        if (dob && new Date(dob) >= new Date()) {
            showError("Date of birth must be in the past.");
            return;
        }

        const session = getSession();
        const token = getToken();

        if (!session || !token) {
            navigate("/auth/login");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/customers/${session.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        full_name: name.trim(),
                        email: email.trim(),
                        phone: `+91${phone}`,
                        dob: dob,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                throw new Error(
                    data?.message || "Failed to save personal information."
                );
            }

            // Update session so UI stays in sync
            const updatedSession = {
                ...session,
                name: name.trim(),
                email: email.trim(),
            };

            sessionStorage.setItem(
                "tu_auth_session",
                JSON.stringify(updatedSession)
            );

            showMessage("Personal information saved successfully!");
        } catch (err: any) {
            showError(err.message || "Failed to save changes.");
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

        const session = getSession();
        const token = getToken();

        if (!session || !token) return;

        const updatedAddresses = [
            ...addresses,
            {
                id: Date.now(),
                tag: "Other",
                text: newAddress.trim(),
            },
        ];

        try {
            const response = await fetch(
                `${API_BASE_URL}/customers/${session.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        saved_addresses: updatedAddresses,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to save address.");
            }

            setAddresses(updatedAddresses);
            setNewAddress("");
            setShowAddressForm(false);

            showMessage("Address added successfully!");
        } catch (err: any) {
            showError(err.message || "Failed to save address.");
        }
    };

    // Delete address
    const handleDeleteAddress = async (id: number) => {
        const session = getSession();
        const token = getToken();

        if (!session || !token) return;

        const updatedAddresses = addresses.filter(
            (address) => address.id !== id
        );

        try {
            const response = await fetch(
                `${API_BASE_URL}/customers/${session.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        saved_addresses: updatedAddresses,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete address.");
            }

            setAddresses(updatedAddresses);
            showMessage("Address removed.");
        } catch (err: any) {
            showError(err.message || "Failed to remove address.");
        }
    };

    // Change password
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

        const token = getToken();

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/change-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                throw new Error(
                    data?.message || "Unable to change password."
                );
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordModal(false);

            showMessage("Password successfully updated!");
        } catch (err: any) {
            showError(err.message || "Failed to change password.");
        }
    };

    // Logout
    const handleLogout = async () => {
        const token = getToken();

        try {
            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch {
            // Continue logout even if request fails
        }

        sessionStorage.removeItem("tu_auth_token");
        sessionStorage.removeItem("tu_auth_session");

        navigate("/auth/login");
    };

    // Delete account
    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to permanently delete your account? This cannot be undone."
        );

        if (!confirmed) return;

        const session = getSession();
        const token = getToken();

        if (!session || !token) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/customers/${session.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete account.");
            }

            sessionStorage.removeItem("tu_auth_token");
            sessionStorage.removeItem("tu_auth_session");

            navigate("/auth/login");
        } catch (err: any) {
            showError(err.message || "Failed to delete account.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-slate-500">
                    Loading account settings...
                </p>
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

                            <p className="text-slate-500 mt-1">
                                {email}
                            </p>

                            <div className="mt-3">
                                <span className="font-semibold text-slate-900">
                                    4.8 ★
                                </span>

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
                                <h2 className="text-xl font-semibold">
                                    Personal Information
                                </h2>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Full Name
                                    </label>

                                    <input
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
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
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
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
                                                setPhone(
                                                    e.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 10)
                                                )
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
                                        onChange={(e) =>
                                            setDob(e.target.value)
                                        }
                                        className="w-full border-2 border-slate-200 p-3 rounded-lg"
                                    />
                                </div>

                            </div>

                            <div className="p-6 border-t border-slate-200">
                                <button
                                    onClick={handleSavePersonalInfo}
                                    disabled={saving}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-6 rounded-lg cursor-pointer"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>

                        </div>

                        {/* Addresses */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-xl font-semibold">
                                    Saved Addresses
                                </h2>
                            </div>

                            <div className="p-6">

                                {addresses.length === 0 ? (
                                    <p className="text-slate-500">
                                        No saved addresses.
                                    </p>
                                ) : (
                                    <div className="space-y-4">

                                        {addresses.map((address) => (
                                            <div
                                                key={address.id}
                                                className="flex justify-between items-center border border-slate-200 rounded-lg p-4"
                                            >
                                                <div>
                                                    <p className="font-semibold">
                                                        {address.tag}
                                                    </p>

                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {address.text}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        handleDeleteAddress(
                                                            address.id
                                                        )
                                                    }
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
                                            onChange={(e) =>
                                                setNewAddress(e.target.value)
                                            }
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
                                                onClick={() =>
                                                    setShowAddressForm(false)
                                                }
                                                className="bg-slate-200 px-5 py-2 rounded-lg cursor-pointer"
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                    </div>
                                )}

                                <button
                                    onClick={() =>
                                        setShowAddressForm(true)
                                    }
                                    className="mt-5 text-blue-600 font-medium cursor-pointer"
                                >
                                    + Add New Address
                                </button>

                            </div>

                        </div>

                        {/* Security */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-xl font-semibold">
                                    Security
                                </h2>
                            </div>

                            <div className="p-6">

                                <div className="flex justify-between items-center">

                                    <div>
                                        <h3 className="font-semibold">
                                            Password
                                        </h3>

                                        <p className="text-sm text-slate-500 mt-1">
                                            Keep your account secure
                                        </p>
                                    </div>

                                    <button
                                        onClick={() =>
                                            setShowPasswordModal(true)
                                        }
                                        className="text-blue-600 font-medium cursor-pointer"
                                    >
                                        Change Password
                                    </button>

                                </div>

                                <hr className="my-5" />

                                <div className="flex justify-between items-center">

                                    <div>
                                        <h3 className="font-semibold">
                                            Logout
                                        </h3>

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
                                <h2 className="text-xl font-semibold">
                                    Payment Methods
                                </h2>
                            </div>

                            <div className="p-6">

                                <div className="border border-slate-200 rounded-lg p-4">
                                    <p className="font-semibold">
                                        UPI
                                    </p>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Default payment method
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        showMessage(
                                            "Payment method management will be added with Checkout."
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
                                <h2 className="text-xl font-semibold">
                                    Recent Activity
                                </h2>
                            </div>

                            <div className="p-6">

                                {activities.length === 0 ? (
                                    <p className="text-slate-500">
                                        No recent activity.
                                    </p>
                                ) : (
                                    <div className="space-y-5">

                                        {activities.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="border-b border-slate-100 pb-4"
                                            >
                                                <p className="font-medium">
                                                    {activity.service_name ||
                                                        "Home Service"}
                                                </p>

                                                <p className="text-sm text-slate-500 mt-1">
                                                    {activity.created_at
                                                        ? new Date(
                                                              activity.created_at
                                                          ).toLocaleDateString()
                                                        : ""}
                                                </p>

                                                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    {activity.status ||
                                                        "Upcoming"}
                                                </span>
                                            </div>
                                        ))}

                                    </div>
                                )}

                            </div>

                        </div>

                        {/* Danger Zone */}
                        <div className="bg-white border border-red-200 rounded-xl shadow-sm">

                            <div className="p-6 border-b border-red-100">
                                <h2 className="text-xl font-semibold text-red-600">
                                    Danger Zone
                                </h2>
                            </div>

                            <div className="p-6">

                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Deleting your account will permanently
                                    remove your data and booking history.
                                </p>

                                <button
                                    onClick={handleDeleteAccount}
                                    className="w-full mt-5 border border-red-300 text-red-600 hover:bg-red-50 font-medium py-3 rounded-lg cursor-pointer"
                                >
                                    Delete My Account
                                </button>

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

                            <h2 className="text-xl font-bold">
                                Change Password
                            </h2>

                            <button
                                onClick={() =>
                                    setShowPasswordModal(false)
                                }
                                className="text-xl cursor-pointer"
                            >
                                ×
                            </button>

                        </div>

                        <div className="space-y-4">

                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                }
                                placeholder="Current Password"
                                className="w-full border-2 border-slate-200 p-3 rounded-lg"
                            />

                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(e.target.value)
                                }
                                placeholder="New Password"
                                className="w-full border-2 border-slate-200 p-3 rounded-lg"
                            />

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm New Password"
                                className="w-full border-2 border-slate-200 p-3 rounded-lg"
                            />

                        </div>

                        <div className="flex gap-3 mt-6">

                            <button
                                onClick={() =>
                                    setShowPasswordModal(false)
                                }
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