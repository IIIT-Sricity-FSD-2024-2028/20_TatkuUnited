import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import AuthContext from '../../common/AuthContext';
import axios from 'axios';
import { BASE_URL } from "../../services/endpoints";
import { BsPeople, BsPersonCheck, BsPersonX, BsPlus } from 'react-icons/bs';
import SummaryCards, { type SummaryStat } from '@/components/superuser/SummaryCards';
import DataTable, { type Column } from '@/components/superuser/DataTable';



interface UsersResponse {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'manager' | 'admin';
  status: 'active' | 'blocked';
}



export default function SuperUser_ManageUsers() {
  const authContext = useContext(AuthContext);
  const token = authContext?.authDetails?.token;
  const user = authContext?.authDetails?.user;
  const super_user_id = user?.id;


  const [users, setUsers] = useState<Array<UsersResponse>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status=== 'active').length;

  const SUMMARY_STATS: SummaryStat[] = [
    { title: "Total Users", count: totalUsers, icon: <BsPeople size={20} />, iconColor: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Users", count: activeUsers, icon: <BsPersonCheck size={20} />, iconColor: "text-green-600", bg: "bg-green-50" },
    { title: "Suspended Users", count: totalUsers - activeUsers, icon: <BsPersonX size={20} />, iconColor: "text-red-600", bg: "bg-red-50" },
  ];


  const [isAddUser, setIsAddUser] = useState(false);
  const [isEditingUserID, setIsEditingUserID] = useState<string | null>(null);
  const [isEditingUserRole, setIsEditingUserRole] = useState<string | null>(null);
  const [isEditingUserStatus, setIsEditingUserStatus] = useState<'active' | 'blocked' | null>(null);;

  const [status, setStatus] = useState('all_statuses');
  const [role, setRole] = useState('all-roles');
  const [search, setSearch] = useState('');

  const filtered_users = users.filter((user) => {
    if (status != 'all_statuses') {
      if (status === "active" && user.status !== 'active') return false;
      if (status === "suspended" && user.status !== 'blocked') return false;
    }
    if (role != 'all-roles' && user.role != role) return false;
    if (!user.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())) return false;
    return true;
  });





  const columns: Column<UsersResponse>[] = [
    { header: "User ID", render: (row) => <span className="font-medium text-slate-900">{row._id}</span> },
    { header: "Name", render: (row) => <>{row.name}</> },
    { header: "Email/Phone", render: (row) => <span className="text-slate-500">{row.email}</span> },
    { header: "Role", render: (row) => <>{row.role}</> },
    {
      header: "Status", render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
          {row.status === 'active' ? "Active" : "Suspended"}
        </span>
      )
    },
    {
      header: "Actions", render: (row) => (
        <button onClick={() => { setIsEditingUserID(row._id); setIsEditingUserRole(row.role); setIsEditingUserStatus(row.status) }} className="text-blue-600 hover:underline">
          Edit
        </button>
      )
    },
  ];



  const fetchAllUsers = async () => {
    if (!token || !super_user_id) return;
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get<Array<UsersResponse>>(`${BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      );
      setUsers(response.data);
      console.log(response.data);

    } catch (err) {
      setError("Failed to fetch users. Please check your connection.");
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [token, super_user_id]);


  return (
    <div className="flex flex-col gap-6">

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">User Management</h1>
          <p className="text-slate-500 text-sm">Manage and moderate platform users, roles, and security status.</p>
        </div>
        <button onClick={() => setIsAddUser(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
          <BsPlus size={20} />
          Add New User
        </button>

      </div>

      {isAddUser && (<AddUser token={token} super_user_id={super_user_id} onClose={() => setIsAddUser(false)} refreshUsers={fetchAllUsers} />)}
      {isEditingUserID && isEditingUserRole && (
        <EditUser
          token={token}
          super_user_id={super_user_id}
          userId={isEditingUserID}
          is_active={isEditingUserStatus}
          onClose={() => { setIsEditingUserID(null); setIsEditingUserRole(null) }}
          refreshUsers={fetchAllUsers} />)}

      {/* Summary Cards — uses reusable SummaryCards component */}
      <SummaryCards stats={SUMMARY_STATS} />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">

        {/* Styled Search Bar Section */}
        <div className="flex flex-col gap-1 flex-2 min-w-50">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Users</label>
          <input
            type='text'
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
            onChange={(e) => setRole(e.target.value)}>
            <option id='all-roles' value="all-roles">
              All Roles
            </option>
            <option id='provider' value="provider">
              Service Provider
            </option>
            <option id='manager' value="manager">
              Manager
            </option>
            <option id='customer' value="customer">
              Customer
            </option>
            <option id='admin' value="admin">
              Super User
            </option>
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-37.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}>
            <option
              id='all_statuses'
              value="all_statuses"
            >
              All Statuses
            </option>
            <option
              id='active'
              value="active"
            >
              Active
            </option>
            <option
              id='suspended'
              value="suspended"
            >
              Suspended
            </option>
          </select>
        </div>

        <button
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors h-9.5"
          onClick={() => {
            setStatus("all_statuses");
            setRole("all-roles");
            setSearch("");
          }}>
          Reset Filters
        </button>

      </div>

      {/* Data Table — uses reusable DataTable component */}
      <DataTable
        columns={columns}
        data={filtered_users}
        rowKey={(row) => row._id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No users found matching your filters."
      />
    </div>
  )
}


interface AddUserProps {
  onClose: () => void;
  token: string | null | undefined;
  super_user_id: string | undefined;
  refreshUsers: () => void;
}

interface EditUserProps {
  onClose: () => void;
  token: string | null | undefined;
  super_user_id: string | undefined;
  userId: string;
  is_active: 'active' | 'blocked' | string | null;
  refreshUsers: () => void;
}


function AddUser({ onClose, token, super_user_id, refreshUsers }: AddUserProps) { 
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  const onAddUser = async (newUser: any) => {

    try {
      if(!token && !super_user_id) return;
      const response = await axios.post(`${BASE_URL}/users`, newUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('New User', response.data);
      onClose();
      refreshUsers();
    }
    catch (err) {
      console.error("Error adding new user: ", err);
    }
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const newUser = {
      name: name,
      email: email,
      password: "Password@123",
      gender: gender,
      phone: phone,
      dob: dob,
      role: role,
    }

    onAddUser(newUser);

    setName('');
    setEmail('');
    setPhone('');
    setRole('');
    setDob('');
    setGender('');
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Create New User</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              required
            >
              <option value="" disabled>Select Role</option>
              <option value="manager">Collective Manager</option>
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
        </div>

        <div className="flex justify-end items-center gap-3 mt-2 border-t border-slate-100 pt-4">
          
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">
            Cancel
          </button>
          
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
            Add User
          </button>

        </div>
      </form>
    </div>
  );
}


function EditUser({ onClose, token, super_user_id, userId, is_active, refreshUsers }: EditUserProps) {
  const [status, setStatus] = useState(is_active ?? 'active');

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!token || !super_user_id) return;

    try {
      const response = await axios.patch(`${BASE_URL}/users/${userId}`,
        {
          status: status
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
             
          },
        }
      );

      console.log(response.data);
      onClose();
      refreshUsers();
    }
    catch (err) {
      console.error("Error updating the user", err);
    }
  }

  const handleDeleteUser = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!token || !super_user_id) return;

    try {
      const response = await axios.delete(`${BASE_URL}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
             
          },
        }
      );
      console.log(response.data);
      onClose();
      refreshUsers();
    }
    catch (err) {
      console.error("Error deleting the user", err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Edit User Status</h2>
        <p className="text-sm text-slate-500 mb-6">
          Modify account access for user ID: <span className="font-mono text-slate-700 text-xs">{userId}</span>
        </p>

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
                type='checkbox'
                className="sr-only peer"
                checked={status === 'active'}
                onChange={(e) => setStatus(e.target.checked ? 'active' : 'blocked')}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-4">
            <button type='button' onClick={handleDeleteUser} className="px-4 py-2 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
              Delete User
            </button>
            <div className="flex gap-3">
              <button type='button' onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">Cancel</button>
              <button type='submit' className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">Save Changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
