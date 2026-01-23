// src/layouts/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../pages/admin/Admin.css'; // Import the new styles

// Fixed Icons with explicit style
const Icons = {
  Dashboard: () => <svg style={{width:'20px', height:'20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  News: () => <svg style={{width:'20px', height:'20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  Brain: () => <svg style={{width:'20px', height:'20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Users: () => <svg style={{width:'20px', height:'20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Config: () => <svg style={{width:'20px', height:'20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Exit: () => <svg style={{width:'16px', height:'16px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Menu: () => <svg style={{width:'24px', height:'24px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
};

const AdminLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Security Check
  if (!user || profile?.role !== 'admin') {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc'}}>
        <div style={{background:'white', padding:'32px', borderRadius:'12px', border:'1px solid #e2e8f0', textAlign:'center'}}>
          <h1 style={{fontSize:'1.5rem', marginBottom:'16px'}}>Access Denied</h1>
          <button onClick={() => navigate('/')} className="btn btn-primary">Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Mobile Backdrop */}
      {sidebarOpen && <div className="modal-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
           <span style={{fontWeight:'bold', fontSize:'1.2rem', letterSpacing:'1px'}}>NARRATIVE</span>
        </div>
        
        <nav className="admin-nav">
          <NavLink to="/admin" end onClick={() => setSidebarOpen(false)} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Icons.Dashboard /> <span>Overview</span>
          </NavLink>
          
          <div className="admin-nav-section">Content</div>
          <NavLink to="/admin/newsroom" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Icons.News /> <span>Newsroom</span>
          </NavLink>
          <NavLink to="/admin/prompts" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Icons.Brain /> <span>AI Brain</span>
          </NavLink>
          
          <div className="admin-nav-section">System</div>
          <NavLink to="/admin/users" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Icons.Users /> <span>Users</span>
          </NavLink>
          <NavLink to="/admin/config" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Icons.Config /> <span>Settings</span>
          </NavLink>
        </nav>

        <div style={{padding:'20px', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
          <button onClick={() => navigate('/')} className="admin-nav-item" style={{width:'100%', justifyContent:'center'}}>
            <Icons.Exit /> Exit
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="mobile-header">
           <button onClick={() => setSidebarOpen(true)}><Icons.Menu /></button>
           <span style={{fontWeight:'bold'}}>Admin</span>
           <div style={{width:24}} />
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
