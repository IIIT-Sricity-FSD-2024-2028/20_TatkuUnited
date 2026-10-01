import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import axios from 'axios';
import { BASE_URL } from '../../services/api';
import { BsPeople, BsPersonCheck, BsPersonX, BsPlus } from 'react-icons/bs';



interface UsersResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: boolean;
  joined: string;
}



export default function SuperUser_ManageUsers()
{
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const super_user_id = user?.id;

  const [users, setUsers] = useState<Array<UsersResponse>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status).length;

  const SUMMARY_STATS = [
  { title: "Total Users", count: totalUsers, icon: <BsPeople size={20} />, iconColor: "text-blue-600", bg: "bg-blue-50"},
  { title: "Active Users", count: activeUsers, icon: <BsPersonCheck size={20} />, iconColor: "text-green-600", bg: "bg-green-50"},
  { title: "Suspended Users", count: totalUsers - activeUsers, icon: <BsPersonX size={20} />, iconColor: "text-red-600", bg: "bg-red-50"},
];


  const [status, setStatus] = useState('all_statuses');
  const [role, setRole] = useState('all-roles');

  const filtered_users = users.filter((user) => {
    if (status != 'all_statuses')
    {
      if(status==="active" && user.status != true) return false;
      if(status==="suspended" && user.status != false) return false;
    }
    if(role!='all-roles' && user.role != role) return false;
    return true;
  });



  useEffect(() => {
    if(!token || !super_user_id) return;

    async function fetchAllUsers() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get<Array<UsersResponse>>(`${BASE_URL}/super-users/all-users`, {
          headers: {Authorization: `Bearer ${token}`, "x-role": "super_user",
          },
         },
        );
        setUsers(response.data);
        console.log(response.data);

      } catch(err) {
        setError("Failed to fetch users. Please check your connection.");
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllUsers();
  }, [token]);

  
  return(
        <div className="flex flex-col gap-6">
      
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">User Management</h1>
                <p className="text-slate-500 text-sm">Manage and moderate platform users, roles, and security status.</p>
              </div>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                <BsPlus size={20} />
                Add New User
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SUMMARY_STATS.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
                        <div className='flex justify-between items-start'>
                            <div className='p-2 rounded-lg ${stat.bg} ${stat.iconColor}'>
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
                <div className="flex flex-col gap-1 flex-1 min-w-37.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Filter</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}>
                    <option id='all-roles' value="all-roles">
                      All Roles
                    </option>
                    <option id='provider' value="Service Provider">
                      Service Provider
                    </option>
                    <option id='manager' value="Collective Manager">
                      Manager
                    </option>
                    <option id='customer' value="Customer">
                      Customer
                    </option>
                    <option id='super_user' value="Super User">
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
                    setStatus("all-statuses");
                    
                    setRole("all-roles");
                  }}>
                  Reset Filters
                </button>

            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading Users...</div>  
                  ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4">User ID</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email/Phone</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Joined</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                      {filtered_users.map((user) => (
                        
                        <tr key={user.id} className="hover:bg-slate-50">
                          
                          <td className="p-4 font-medium text-slate-900">{user.id}</td>
                          <td className="p-4">{user.name}</td>
                          <td className="p-4 text-slate-500">{user.email}</td>
                          <td className="p-4">{user.role}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === true ? 'text-green-700' : 'text-red-700'}`}>
                              {user.status === true ? "Active" : "Suspended"}
                            </span>
                          </td>
                          <td className="p-4">
                            {new Date(user.joined).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <button className="text-blue-600 hover:underline">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
            </div>
        </div>
    )
}