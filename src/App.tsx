// src/App.tsx
import React, { Suspense } from 'react'; 
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

import './App.css'; 

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RadioProvider } from './context/RadioContext'; 

import useNativeFeatures from './hooks/useNativeFeatures';

import PageLoader from './components/PageLoader';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './Login';
import CreateProfile from './CreateProfile';
import MainLayout from './layouts/MainLayout';

// --- Admin Imports ---
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Newsroom from './pages/admin/Newsroom';
// New Admin Pages (Lazy loaded if preferred, but direct here for simplicity)
import Users from './pages/admin/Users';
import SystemConfig from './pages/admin/SystemConfig';
import Prompts from './pages/admin/Prompts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      gcTime: 1000 * 60 * 30,   
      retry: 1,                 
      refetchOnWindowFocus: false, 
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RadioProvider> 
            <ErrorBoundary>
               <AppRoutes />
            </ErrorBoundary>
          </RadioProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Helper for protecting routes
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  
  // Initialize native features (Push Notifs, etc) if on mobile
  useNativeFeatures(user); 
  
  if (loading) return <PageLoader />;
  
  // Logic Update: We no longer block generic access if !user.
  // We only check profile if user EXISTS.
  if (user && !profile) {
     return <CreateProfile />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={ user ? <Navigate to="/" replace /> : <Login /> } />
        <Route path="/create-profile" element={user ? <CreateProfile /> : <Navigate to="/login" replace />} />
        
        {/* --- ADMIN ROUTES --- */}
        {/* Protected: Only visible if user has role='admin' */}
        <Route path="/admin" element={ 
            user && profile?.role === 'admin' ? <AdminLayout /> : <Navigate to="/" /> 
        }>
            <Route index element={<AdminDashboard />} />
            <Route path="newsroom" element={<Newsroom />} />
            <Route path="users" element={<Users />} />
            <Route path="config" element={<SystemConfig />} />
            <Route path="prompts" element={<Prompts />} />
        </Route>

        {/* Main Layout handles both Public (Feed) and Private (Dashboard) routes internal logic */}
        <Route path="/*" element={<MainLayout profile={profile} />} />
      </Routes>
    </Suspense>
  );
}

export default App;
