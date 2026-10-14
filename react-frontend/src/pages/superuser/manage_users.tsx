import React, { useEffect, useState } from "react";
import { BsPeople, BsPersonCheck, BsPersonX, BsPlus } from "react-icons/bs";
import useAuth from "@/hooks/useAuth";
import { RolesEnum } from "@/common/roles.enum";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/users.service";
import type { UserRole, UserStatus } from "@/models/api.models";

interface UsersResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
}

export default function SuperUser_ManageUsers() {
  const { user, isAuthenticated } = useAuth();
  const super_user_id = user?.id;

  const [users, setUsers] = useState<Array<UsersResponse>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const blockedUsers = users.filter((u) => u.status === "blocked").length;

  const SUMMARY_STATS = [
    {
      title: "Total Users",
      count: totalUsers,
      icon: <BsPeople size={20} />,
      iconColor: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Users",
      count: activeUsers,
      icon: <BsPersonCheck size={20} />,
      iconColor: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Blocked Users",
      count: blockedUsers,
      icon: <BsPersonX size={20} />,
      iconColor: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  const [isAddUser, setIsAddUser] = useState(false);
  const [isEditingUserID, setIsEditingUserID] = useState<string | null>(null);
  const [isEditingUserRole, setIsEditingUserRole] = useState<string | null>(null);
  const [isEditingUserStatus, setIsEditingUserStatus] = useState(true);

  const [status, setStatus] = useState("all_statuses");
  const [role, setRole] = useState("all-roles");
  const [search, setSearch] = useState("");

  const filtered_users = users.filter((userItem) => {
    if (status !== "all_statuses") {
      if (status === "active" && userItem.status !== "active") return false;
      if (status === "blocked" && userItem.status !== "blocked") return false;
    }
    if (role !== "all-roles" && userItem.role.toLowerCase() !== role.toLowerCase()) {
      return false;
    }
    if (
      search &&
      !userItem.name.toLowerCase().includes(search.toLowerCase()) &&
      !userItem.email.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const fetchAllUsers = async () => {
    if (!isAuthenticated || !user || user.role !== RolesEnum.ADMIN) return;
    try {
      setIsLoading(true);
      setError(null);

      const users_data = await getAllUsers();
      setUsers(
        (users_data || []).map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status || "active",
          joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "-",
        })),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch users from server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [super_user_id]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            User Management
          </h1>
          <p className="text-slate-500 text-sm">
            Manage and moderate platform users, roles, and account security status.
          </p>
        </div>
        <button
          onClick={() => setIsAddUser(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer"
        >
          <BsPlus size={20} />
          Add New User
        </button>
      </div>

      {isAddUser && (
        <AddUser
          onClose={() => setIsAddUser(false)}
          refreshUsers={fetchAllUsers}
        />
      )}
      {isEditingUserID && isEditingUserRole && (
        <EditUser
          userId={isEditingUserID}
          role={isEditingUserRole}
          isActive={isEditingUserStatus}
          onClose={() => {
            setIsEditingUserID(null);
            setIsEditingUserRole(null);
          }}
          refreshUsers={fetchAllUsers}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUMMARY_STATS.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32"
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.iconColor}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        {/* Search Bar */}
        <div className="flex flex-col gap-1 flex-[2] min-w-[200px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Search Users
          </label>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Role Filter */}
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Role Filter
          </label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="all-roles">All Roles</option>
            <option value="customer">Customer</option>
            <option value="provider">Provider</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Status
          </label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all_statuses">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50">
            {error}
          </div>
        ) : filtered_users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No users match the selected criteria.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered_users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4 capitalize">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.status === "active"
                          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{u.joined}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setIsEditingUserID(u.id);
                        setIsEditingUserRole(u.role);
                        setIsEditingUserStatus(u.status === "active");
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs cursor-pointer"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface AddUserProps {
  onClose: () => void;
  refreshUsers: () => void;
}

function AddUser({ onClose, refreshUsers }: AddUserProps) {
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.startsWith("+91") ? phone : `+91${phone.replace(/\D/g, "")}`,
        password: password.trim() || "Password@123",
        role,
        status: "active" as UserStatus,
      });

      refreshUsers();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create user.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Create New User</h2>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            >
              <option value="customer">Customer</option>
              <option value="provider">Provider</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@tatkuunited.com"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Initial Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Defaults to Password@123 if empty"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 mt-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer"
          >
            {isSubmitting ? "Creating..." : "Add User"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface EditUserProps {
  onClose: () => void;
  userId: string;
  role: string;
  isActive: boolean;
  refreshUsers: () => void;
}

function EditUser({
  onClose,
  userId,
  role: initialRole,
  isActive: initialStatus,
  refreshUsers,
}: EditUserProps) {
  const [isActive, setIsActive] = useState(initialStatus);
  const [role, setRole] = useState<UserRole>(initialRole as UserRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateUser(userId, {
        status: isActive ? "active" : "blocked",
        role,
      });

      refreshUsers();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this user account?",
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await deleteUser(userId);
      refreshUsers();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete user.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Edit User Account
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Modify account access and role for ID:{" "}
          <span className="font-mono text-slate-700 text-xs">{userId}</span>
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Account Status
              </label>
              <span
                className={`text-sm font-semibold ${
                  isActive ? "text-green-700" : "text-red-700"
                }`}
              >
                {isActive ? "Active (Can log in)" : "Blocked (Suspended)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                isActive
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {isActive ? "Block Account" : "Activate"}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value="customer">Customer</option>
              <option value="provider">Provider</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="text-red-600 hover:text-red-800 text-xs font-semibold cursor-pointer"
            >
              Delete User
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
