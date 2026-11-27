import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import {
  createUser,
  deleteUser,
  fetchUsers,
  superuserActions,
  updateUser,
} from "@/store/superuser/superuser-slice";
import { BsPeople, BsPersonCheck, BsPersonX, BsPlus } from "react-icons/bs";
import SummaryCards from "@/components/superuser/SummaryCards";
import DataTable, { type Column } from "@/components/superuser/DataTable";
import type {
  CreateUserDto,
  GeoLocationDto,
  UserDocument,
  UserRole,
} from "@/models/api.models";
import { CitySelect } from "@/components/shared/CitySelect";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { SUPPORTED_CITIES } from "@/common/cities";
import { RolesEnum, type Role } from "@/common/roles.enum";

const ROLE_LABELS: Record<Role, string> = {
  [RolesEnum.CUSTOMER]: "Customer",
  [RolesEnum.PROVIDER]: "Service Provider",
  [RolesEnum.MANAGER]: "Manager",
  [RolesEnum.ADMIN]: "Super User",
};

const CREATABLE_ROLES: Role[] = [RolesEnum.MANAGER, RolesEnum.ADMIN];

export default function SuperUser_ManageUsers() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, pending, error } = useSelector(
    (state: RootState) => state.superuser,
  );

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
  const editingUser = isEditingUserID
    ? (users.find((user) => user._id === isEditingUserID) ?? null)
    : null;

  const [status, setStatus] = useState("all_statuses");
  const [role, setRole] = useState("all-roles");
  const [search, setSearch] = useState("");

  const filtered_users = users.filter((u) => {
    if (status !== "all_statuses") {
      if (status === "active" && u.status !== "active") return false;
      if (status === "suspended" && u.status !== "blocked") return false;
    }
    if (role !== "all-roles" && u.role !== role) return false;
    if (search && !(u.name || "").toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const columns: Column<UserDocument>[] = [
    { header: "Name", render: (row) => <>{row.name}</> },
    {
      header: "Email/Phone",
      render: (row) => <span className="text-slate-500">{row.email}</span>,
    },
    { header: "Role", render: (row) => <>{row.role}</> },
    {
      header: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === "active" ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}
        >
          {row.status === "active" ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <button
          onClick={() => {
            dispatch(superuserActions.clearError());
            setIsEditingUserID(row._id);
          }}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          Edit
        </button>
      ),
    },
  ];

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const closeAdd = () => {
    setIsAddUser(false);
    dispatch(superuserActions.clearError());
  };

  const closeEdit = () => {
    setIsEditingUserID(null);
    dispatch(superuserActions.clearError());
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            User Management
          </h1>
          <p className="text-slate-500 text-sm">
            Manage and moderate platform users, roles, and security status.
          </p>
        </div>
        <button
          onClick={() => {
            dispatch(superuserActions.clearError());
            setIsAddUser(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer"
        >
          <BsPlus size={20} />
          Add New User
        </button>
      </div>

      {isAddUser && <AddUser onClose={closeAdd} />}
      {editingUser && <EditUser user={editingUser} onClose={closeEdit} />}

      <SummaryCards stats={SUMMARY_STATS} />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 flex-2 min-w-50">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Search Users
          </label>
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-37.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Role Filter
          </label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option id="all-roles" value="all-roles">
              All Roles
            </option>
            {Object.values(RolesEnum).map((r) => (
              <option key={r} id={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-37.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Account Status
          </label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option id="all_statuses" value="all_statuses">
              All Statuses
            </option>
            <option id="active" value="active">
              Active
            </option>
            <option id="suspended" value="suspended">
              Suspended
            </option>
          </select>
        </div>

        <button
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors h-9.5 cursor-pointer"
          onClick={() => {
            setStatus("all_statuses");
            setRole("all-roles");
            setSearch("");
          }}
        >
          Reset Filters
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered_users}
        rowKey={(row) => row._id}
        isLoading={pending > 0}
        error={isAddUser || editingUser ? null : error}
        emptyMessage="No users found matching your filters."
      />
    </div>
  );
}

interface AddUserProps {
  onClose: () => void;
}

interface EditUserProps {
  onClose: () => void;
  user: UserDocument;
}

function AddUser({ onClose }: AddUserProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { submitting, error: storeError } = useSelector(
    (state: RootState) => state.superuser,
  );

  const [role, setRole] = useState<UserRole | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [gender, setGender] = useState("");
  const [managerCoords, setManagerCoords] = useState<[number, number] | null>(
    null,
  );
  const [managerCity, setManagerCity] = useState("");
  const [cityCenterHint, setCityCenterHint] = useState<[number, number]>(
    SUPPORTED_CITIES[0].coordinates,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const error = formError ?? storeError;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!role) {
      setFormError("Please select a role.");
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      setFormError("Please enter a valid full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(phone.trim())) {
      setFormError("Please enter a valid 10-digit Indian phone number.");
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (
      !dob ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
      dob < "1900-01-01" ||
      dob >= todayStr
    ) {
      setFormError("Please enter a valid date of birth in the past.");
      return;
    }
    if (role === RolesEnum.MANAGER && !managerCoords) {
      setFormError(
        "Please pin the manager location on the map or use Live Location.",
      );
      return;
    }

    const user: CreateUserDto = {
      name,
      email,
      password: "Password@123",
      gender: gender || undefined,
      phone,
      dob: dob || undefined,
      role,
    };
    const managerLocation: GeoLocationDto | undefined =
      role === RolesEnum.MANAGER && managerCoords
        ? {
            type: "Point",
            coordinates: managerCoords,
          }
        : undefined;

    try {
      await dispatch(createUser({ user, managerLocation })).unwrap();
      onClose();
    } catch {
      // the rejected thunk stores a readable message in the slice
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Create New User</h2>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200"
        >
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
              <option value="" disabled>
                Select Role
              </option>
              {CREATABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </option>
              ))}
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
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
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
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              DOB
            </label>
            <input
              type="date"
              value={dob}
              min="1900-01-01"
              max={todayStr}
              onChange={(e) => setDob(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {role === RolesEnum.MANAGER && (
            <>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Manager City
                </label>
                <CitySelect
                  value={managerCity}
                  placeholder="Select city to center map"
                  onChange={(cityOption) => {
                    setManagerCity(cityOption.name);
                    setCityCenterHint(cityOption.coordinates);
                    setManagerCoords(cityOption.coordinates);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <LocationPicker
                  value={managerCoords}
                  centerHint={cityCenterHint}
                  heightClass="h-56"
                  label="Manager Location (Pin on Map or Use Live Location)"
                  onChange={(coords, resolved) => {
                    setManagerCoords(coords);
                    if (resolved?.city) setManagerCity(resolved.city);
                  }}
                />
              </div>
            </>
          )}
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
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Adding User..." : "Add User"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditUser({ onClose, user }: EditUserProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { submitting, error } = useSelector(
    (state: RootState) => state.superuser,
  );
  const [status, setStatus] = useState<"active" | "blocked">(
    user.status === "blocked" ? "blocked" : "active",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateUser({ id: user._id, dto: { status } })).unwrap();
      onClose();
    } catch {
      // the rejected thunk stores a readable message in the slice
    }
  };

  const handleDeleteUser = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (
      !window.confirm("Are you sure you want to permanently delete this user?")
    ) {
      return;
    }

    try {
      await dispatch(deleteUser(user._id)).unwrap();
      onClose();
    } catch {
      // the rejected thunk stores a readable message in the slice
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Edit User Status
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Modify account access for user ID:{" "}
          <span className="font-mono text-slate-700 text-xs">{user._id}</span>
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200"
          >
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
                className={`text-sm font-semibold ${status === "active" ? "text-green-700" : "text-slate-500"}`}
              >
                {status === "active" ? "Active" : "Suspended"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={status === "active"}
                onChange={(e) =>
                  setStatus(e.target.checked ? "active" : "blocked")
                }
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={submitting}
              className="px-4 py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Delete User
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
