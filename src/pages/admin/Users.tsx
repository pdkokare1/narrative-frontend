// src/pages/admin/Users.tsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { IUserProfile } from '../../types';
import PageLoader from '../../components/PageLoader';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable, AdminThead, AdminTbody, AdminTr, AdminTh, AdminTd } from '../../components/admin/AdminTable';
import { AdminBadge } from '../../components/admin/AdminBadge';
import { AdminCard } from '../../components/admin/AdminCard';
import './Admin.css';

const Users: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<IUserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [page] = useState(1);

  const fetchUsers = async () => {
    try {
      const res = await adminService.getAllUsers(page, search);
      setUsers(res.data.data.users);
    } catch (err) { alert('Error loading users'); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 500);
    return () => clearTimeout(t);
  }, [page, search]);

  const toggleBan = async (user: IUserProfile) => {
    if(!window.confirm(`Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} this user?`)) return;
    await adminService.updateUserStatus(user.userId, { isBanned: !user.isBanned }).then(fetchUsers);
  };

  const toggleRole = async (user: IUserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if(!window.confirm(`Promote/Demote to ${newRole}?`)) return;
    await adminService.updateUserStatus(user.userId, { role: newRole }).then(fetchUsers);
  };

  return (
    <div>
      <AdminPageHeader title="User Management" description="Manage accounts and permissions." />

      <AdminCard className="mb-4">
        <input 
          type="text" 
          placeholder="Search users by email or name..."
          className="form-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </AdminCard>

      {loading && !users.length ? <PageLoader /> : (
        <AdminTable>
            <AdminThead>
              <tr>
                <AdminTh>User Details</AdminTh>
                <AdminTh>Role</AdminTh>
                <AdminTh>Stats (Views)</AdminTh>
                <AdminTh className="text-right">Actions</AdminTh>
              </tr>
            </AdminThead>
            <AdminTbody>
              {users.map((user) => (
                <AdminTr key={user.userId}>
                  <AdminTd>
                    <div style={{fontWeight:'600'}}>{user.username}</div>
                    <div style={{fontSize:'0.8rem', color:'#64748b'}}>{user.email}</div>
                    {user.isBanned && <span style={{color:'red', fontSize:'0.7rem', fontWeight:'bold', textTransform:'uppercase'}}>BANNED</span>}
                  </AdminTd>
                  <AdminTd>
                     <AdminBadge variant={user.role === 'admin' ? 'purple' : 'neutral'}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                     </AdminBadge>
                  </AdminTd>
                  <AdminTd>{user.articlesViewedCount || 0}</AdminTd>
                  <AdminTd className="text-right">
                    <div className="flex-end">
                      <button onClick={() => toggleRole(user)} className="btn btn-outline btn-sm">
                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                      </button>
                      <button onClick={() => toggleBan(user)} className={`btn btn-sm ${user.isBanned ? 'btn-success' : 'btn-danger'}`}>
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTbody>
        </AdminTable>
      )}
    </div>
  );
};

export default Users;
