// src/pages/admin/Users.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IUserProfile } from '../../types';
import PageLoader from '../../components/PageLoader';

const Users: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<IUserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers(page, search);
      setUsers(res.data.data.users);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to fetch users", err);
      alert('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timeout);
  }, [page, search]);

  const toggleBan = async (user: IUserProfile) => {
    if(!window.confirm(`Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} this user?`)) return;
    try {
      await adminService.updateUserStatus(user.userId, { isBanned: !user.isBanned });
      fetchUsers(); // Refresh
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const toggleRole = async (user: IUserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if(!window.confirm(`Promote/Demote this user to ${newRole}?`)) return;
    try {
      await adminService.updateUserStatus(user.userId, { role: newRole });
      fetchUsers(); // Refresh
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <input 
          type="text" 
          placeholder="Search users by email or name..."
          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && users.length === 0 ? <PageLoader /> : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">User</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Role</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Stats (Views)</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Joined</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.userId} className={`hover:bg-slate-50 transition-colors ${user.isBanned ? 'bg-red-50' : ''}`}>
                  <td className="p-4">
                    <p className="font-medium text-slate-800">{user.username}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    {user.isBanned && <span className="text-xs bg-red-600 text-white px-1 rounded ml-1">BANNED</span>}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                     <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-slate-100'}`}>
                        {user.role || 'user'}
                     </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {user.articlesViewedCount || 0}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                       onClick={() => toggleRole(user)}
                       className="text-xs border border-slate-300 px-3 py-1 rounded hover:bg-slate-100"
                    >
                      {user.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button 
                       onClick={() => toggleBan(user)}
                       className={`text-xs px-3 py-1 rounded ${user.isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {user.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination Controls could go here */}
    </div>
  );
};

export default Users;
