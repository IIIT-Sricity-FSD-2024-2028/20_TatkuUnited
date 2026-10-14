import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '@/common/endpoints';
import { BsPeople, BsPersonCheck, BsPersonX, BsPlus } from 'react-icons/bs';
import SummaryCards from '@/components/superuser/SummaryCards';
import DataTable, { type Column } from '@/components/superuser/DataTable';
import { createManager, getAllUsers } from '@/services';
import type { CreateManagerDto, UserRole } from '@/models/api.models';
import useAuth from '@/hooks/useAuth';
import { RolesEnum } from '@/common/roles.enum';

export interface UsersResponse {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'manager' | 'admin';
  status: 'active' | 'blocked';
  joined?: string;
}

export default function SuperUser_ManageUsers() {
  const { user, isAuthenticated, token } = useAuth();

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
  const [isEditingUserStatus, setIsEditingUserStatus] = useState<'active' | 'blocked' | null>(null);

  const [status, setStatus] = useState('all_statuses');
  const [role, setRole] = useState('all-roles');
  const [search, setSearch] = useState('');

  const filtered_users = users.filter((u) => {
    if (status !== 'all_statuses') {
      if (status === "active" && u.status !== 'active') return false;
      if (status === "suspended" && u.status !== 'blocked') return false;
    }
    if (role !== 'all-roles' && u.role !== role) return false;
    if (search && !(u.name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns: Column<UsersResponse>[] = [
    { header: "User ID", render: (row) => <span className="font-medium text-slate-900">{row._id}</span> },
    { header: "Name", render: (row) => <>{row.name}</> },
    { header: "Email/Phone", render: (row) => <span className="text-slate-500">{row.email}</span> },
    { header: "Role", render: (row) => <>{row.role}</> },
    {
      header: "Status", render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'active' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
          {row.status === 'active' ? "Active" : "Suspended"}
        </span>
      )
    },
    {
      header: "Actions", render: (row) => (
        <button
          onClick={() => {
            setIsEditingUserID(row._id);
            setIsEditingUserStatus(row.status);
          }}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          Edit
        </button>
      )
    },
  ];

  const fetchAllUsers = async () => {
    if (!isAuthenticated || !user || user.role !== RolesEnum.ADMIN) return;
    try {
      setIsLoading(true);
      setError(null);

      const users_data = await getAllUsers();
      setUsers(
        (users_data || []).map((u) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: (u.status as 'active' | 'blocked') || "active",
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
  }, [token, isAuthenticated, user]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">User Management</h1>
          <p className="text-slate-500 text-sm">Manage and moderate platform users, roles, and security status.</p>
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
          token={token}
          onClose={() => setIsAddUser(false)}
          refreshUsers={fetchAllUsers}
        />
      )}
      {Boolean(isEditingUserID) && (
        <EditUser
          token={token}
          userId={isEditingUserID!}
          is_active={isEditingUserStatus}
          onClose={() => {
            setIsEditingUserID(null);
            setIsEditingUserStatus(null);
          }}
          refreshUsers={fetchAllUsers}
        />
      )}

      <SummaryCards stats={SUMMARY_STATS} />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 flex-2 min-w-50">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Users</label>
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-37.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Filter</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option id="all-roles" value="all-roles">
              All Roles
            </option>
            <option id="provider" value="provider">
              Service Provider
            </option>
            <option id="manager" value="manager">
              Manager
            </option>
            <option id="customer" value="customer">
              Customer
            </option>
            <option id="admin" value="admin">
              Super User
            </option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-37.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</label>
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
        isLoading={isLoading}
        error={error}
        emptyMessage="No users found matching your filters."
      />
    </div>
  );
}

interface AddUserProps {
  onClose: () => void;
  token: string | null | undefined;
  refreshUsers: () => void;
}

interface EditUserProps {
  onClose: () => void;
  token: string | null | undefined;
  userId: string;
  is_active: 'active' | 'blocked' | string | null;
  refreshUsers: () => void;
}

function AddUser({ onClose, token, refreshUsers }: AddUserProps) {
  const [role, setRole] = useState<UserRole | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [managerLng, setManagerLng] = useState('');
  const [managerLat, setManagerLat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onAddUser = async (newUser: any) => {
    const activeToken = token || sessionStorage.getItem('token');
    if (!activeToken) {
      setError("Authentication token missing. Please sign in again.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post(`${BASE_URL}/users`, newUser, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const createdUser = response.data;
      console.log('New User', createdUser);

      if (newUser.role === 'manager') {
        const managerDto: CreateManagerDto = {
          user: createdUser._id || createdUser.id,
          salary: 0,
          experience: 0,
          location: {
            type: 'Point',
            coordinates: [parseFloat(managerLng), parseFloat(managerLat)],
          },
        };
        await createManager(managerDto);
        console.log('Manager object created');
      }

      onClose();
      refreshUsers();
    } catch (err: any) {
      console.error('Error adding new user: ', err);
      setError(err?.response?.data?.message || err?.message || 'Error adding new user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (role === 'manager' && (!managerLng || !managerLat)) {
      setError('Please enter manager location coordinates.');
      return;
    }

    const newUser = {
      name,
      email,
      password: 'Password@123',
      gender,
      phone,
      dob,
      role,
    };

    onAddUser(newUser);
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            >
              <option value="" disabled>Select Role</option>
              <option value="manager">Manager</option>
              <option value="admin">Super User</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Full Name
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Phone Number
            </label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              DOB
            </label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
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
              <option value="" disabled>Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {role === 'manager' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Manager Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={managerLng}
                  onChange={(e) => setManagerLng(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. 78.4867"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Manager Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={managerLat}
                  onChange={(e) => setManagerLat(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. 17.385"
                  required
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
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Adding User...' : 'Add User'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditUser({ onClose, token, userId, is_active, refreshUsers }: EditUserProps) {
  const [status, setStatus] = useState<'active' | 'blocked'>(
    is_active === 'blocked' ? 'blocked' : 'active'
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeToken = token || sessionStorage.getItem('token');
    if (!activeToken) {
      setError("Authentication token missing. Please sign in again.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await axios.patch(
        `${BASE_URL}/users/${userId}`,
        { status },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );
      onClose();
      refreshUsers();
    } catch (err: any) {
      console.error("Error updating the user", err);
      setError(err?.response?.data?.message || err?.message || "Error updating user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const activeToken = token || sessionStorage.getItem('token');
    if (!activeToken) {
      setError("Authentication token missing. Please sign in again.");
      return;
    }

    if (!window.confirm("Are you sure you want to permanently delete this user?")) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await axios.delete(
        `${BASE_URL}/users/${userId}`,
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );
      onClose();
      refreshUsers();
    } catch (err: any) {
      console.error("Error deleting the user", err);
      setError(err?.response?.data?.message || err?.message || "Error deleting user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Edit User Status</h2>
        <p className="text-sm text-slate-500 mb-6">
          Modify account access for user ID: <span className="font-mono text-slate-700 text-xs">{userId}</span>
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Status</label>
              <span className={`text-sm font-semibold ${status === 'active' ? 'text-green-700' : 'text-slate-500'}`}>
                {status === 'active' ? 'Active' : 'Suspended'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={status === 'active'}
                onChange={(e) => setStatus(e.target.checked ? 'active' : 'blocked')}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={isLoading}
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
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
