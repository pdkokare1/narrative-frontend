// src/layouts/AdminLayout.tsx
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Basic security check (double layer, App.tsx handles the main one)
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You do not have permission to view this area.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Helper for NavLink classes
  const navClass = ({ isActive }: { isActive: boolean }) => 
    `block px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`;

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-wider">NARRATIVE <span className="text-xs bg-red-600 px-2 py-0.5 rounded ml-1">ADMIN</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavLink to="/admin" end className={navClass}>
            Dashboard
          </NavLink>
          
          <div className="pt-4 pb-1 pl-4 text-xs font-semibold text-slate-500 uppercase">Content</div>
          <NavLink to="/admin/newsroom" className={navClass}>
            Newsroom
          </NavLink>
          <NavLink to="/admin/prompts" className={navClass}>
            AI Brain (Prompts)
          </NavLink>
          
          <div className="pt-4 pb-1 pl-4 text-xs font-semibold text-slate-500 uppercase">System</div>
          <NavLink to="/admin/users" className={navClass}>
            User Management
          </NavLink>
          <NavLink to="/admin/logs" className={navClass}>
            Activity Logs
          </NavLink>
          <NavLink to="/admin/config" className={navClass}>
            System Config
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                A
             </div>
             <div>
               <p className="text-sm font-medium">{profile?.username || 'Admin'}</p>
               <p className="text-xs text-slate-400">Super Admin</p>
             </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 w-full text-xs text-center text-slate-400 hover:text-white"
          >
            Exit to Main App
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
