import { BsPeople, BsPersonCheck, BsPersonX, BsPlus } from 'react-icons/bs';

const SUMMARY_STATS = [
  { title: "Total Users", count: "1,248", icon: <BsPeople size={20} />, iconColor: "text-blue-600", bg: "bg-blue-50"},
  { title: "Active Users", count: "1,102", icon: <BsPersonCheck size={20} />, iconColor: "text-green-600", bg: "bg-green-50"},
  { title: "Suspended Users", count: "146", icon: <BsPersonX size={20} />, iconColor: "text-red-600", bg: "bg-red-50"},
];

const MOCK_USERS = [
  { id: "USR-001", name: "Alice Doe", email: "alice@example.com", role: "Provider", status: "Active", joined: "2024-01-15" },
  { id: "USR-002", name: "Bob Smith", email: "bob@example.com", role: "Manager", status: "Suspended", joined: "2024-02-20" },
];

export default function SuperUser_ManageUsers()
{
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
                  <select className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white">
                    <option>All Roles</option>
                    <option>Provider</option>
                    <option>Manager</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-37.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</label>
                  <select className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white">
                    <option>All Statuses</option>
                    <option>Active</option>
                    <option>Suspended</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-37.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Joined</label>
                  <input type="date" className="w-full p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors h-[38px]">
                  Reset Filters
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
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
                      {MOCK_USERS.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-900">{user.id}</td>
                          <td className="p-4">{user.name}</td>
                          <td className="p-4 text-slate-500">{user.email}</td>
                          <td className="p-4">{user.role}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'Active' ? 'text-green-700' : 'text-red-700'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="p-4">{user.joined}</td>
                          <td className="p-4">
                            <button className="text-blue-600 hover:underline">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
        </div>
    )
}