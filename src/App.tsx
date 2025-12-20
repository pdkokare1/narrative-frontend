import React, { Suspense } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom';
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

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  
  // Initialize native features (Push Notifs, etc) if on mobile
  useNativeFeatures(user); 
  
  if (loading) return <PageLoader />;
  if (!user) return <Login />;
  
  if (!profile) {
     return <CreateProfile />;
  }

  // Pass profile to Layout for personalization
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/create-profile" element={<Navigate to="/" replace />} />
        <Route path="/*" element={<MainLayout profile={profile} />} />
      </Routes>
    </Suspense>
  );
}

export default App;
