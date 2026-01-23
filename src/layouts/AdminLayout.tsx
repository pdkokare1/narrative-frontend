// src/layouts/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Simple Icons (SVG) to avoid dependencies
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  News: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  Brain: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Config: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Log: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Exit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Menu: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
};

const AdminLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Security Check (Preserved)
  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
            <Icons.Exit />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-6">You do not have permission to view this area.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const NavItem = ({ to, icon, label, end = false }: any) => (
    <NavLink 
      to={to} 
      end={end}
      onClick={() => setSidebarOpen(false)} // Close on mobile click
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
        ${isActive 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden glass"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-slate-100 flex flex-col shadow-2xl transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">N</div>
          <div>
            <h1 className="text-lg font-bold tracking-wider leading-none">NARRATIVE</h1>
            <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">Workspace</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem to="/admin" label="Overview" icon={<Icons.Dashboard />} end />
          
          <div className="pt-6 pb-2 pl-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Content</div>
          <NavItem to="/admin/newsroom" label="Newsroom" icon={<Icons.News />} />
          <NavItem to="/admin/prompts" label="AI Brain" icon={<Icons.Brain />} />
          
          <div className="pt-6 pb-2 pl-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">System</div>
          <NavItem to="/admin/users" label="Users" icon={<Icons.Users />} />
          <NavItem to="/admin/config" label="Settings" icon={<Icons.Config />} />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 px-2">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border border-slate-600">
                {profile?.username?.charAt(0).toUpperCase() || 'A'}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium truncate">{profile?.username || 'Admin'}</p>
               <p className="text-xs text-slate-500 truncate">{user.email}</p>
             </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Icons.Exit /> Exit to App
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10">
           <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
             <Icons.Menu />
           </button>
           <span className="font-bold text-slate-800">Admin Panel</span>
           <div className="w-6" /> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
