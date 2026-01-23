// src/pages/admin/Users.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IUserProfile } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable, AdminThead, AdminTbody, AdminTr, AdminTh, AdminTd } from '../../components/admin/AdminTable';
import { AdminBadge } from '../../components/admin/AdminBadge';
import { AdminCard } from '../../components/admin/AdminCard';

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
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timeout);
  }, [page, search]);

  const toggleBan = async (user: IUserProfile) => {
    if(!window.confirm(`Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} this user?`)) return;
    try {
      await adminService.updateUserStatus(user.userId, { isBanned: !user.isBanned });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const toggleRole = async (user: IUserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if(!window.confirm(`Promote/Demote this user to ${newRole}?`)) return;
    try {
      await adminService.updateUserStatus(user.userId, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  return (
    <div>
      <AdminPageHeader title="User Management" description="View and manage user accounts and permissions." />

      <AdminCard className="mb-6">
        <input 
          type="text" 
          placeholder="Search users by email or name..."
          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </AdminCard>

      {loading && users.length === 0 ? <PageLoader /> : (
        <AdminTable>
            <AdminThead>
              <tr>
                <AdminTh>User</AdminTh>
                <AdminTh>Role</AdminTh>
                <AdminTh>Stats (Views)</AdminTh>
                <AdminTh>Joined</AdminTh>
                <AdminTh className="text-right">Actions</AdminTh>
              </tr>
            </AdminThead>
            <AdminTbody>
              {users.map((user) => (
                <tr key={user.userId} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${user.isBanned ? 'bg-red-50/50' : ''}`}>
                  <AdminTd>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {user.username.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="font-semibold text-slate-800">{user.username}</p>
                         <p className="text-xs text-slate-500">{user.email}</p>
                       </div>
                    </div>
                    {user.isBanned && <span className="mt-1 inline-block text-[10px] font-bold text-red-600 uppercase tracking-wider">Banned</span>}
                  </AdminTd>
                  <AdminTd>
                     {user.role === 'admin' ? (
                        <AdminBadge variant="purple">Admin</AdminBadge>
                     ) : (
                        <AdminBadge variant="neutral">User</AdminBadge>
                     )}
                  </AdminTd>
                  <AdminTd>
                    {user.articlesViewedCount || 0}
                  </AdminTd>
                  <AdminTd>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </AdminTd>
                  <AdminTd className="text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                         onClick={() => toggleRole(user)}
                         className="text-xs border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 font-medium"
                      >
                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                      </button>
                      <button 
                         onClick={() => toggleBan(user)}
                         className={`text-xs px-3 py-1.5 rounded-lg font-medium ${user.isBanned ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      >
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </AdminTd>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    No users found matching "{search}".
                  </td>
                </tr>
              )}
            </AdminTbody>
        </AdminTable>
      )}
    </div>
  );
};

export default Users;
