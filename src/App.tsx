// src/App.tsx
import React, { Suspense, useState, useCallback } from 'react'; 
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

import './App.css'; 

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { RadioProvider } from './context/RadioContext'; 

import useNativeFeatures from './hooks/useNativeFeatures';
import { useActivityTracker } from './hooks/useActivityTracker'; // NEW: Global Tracker
import { upgradeHabitGoal } from './services/userService';    // NEW: Service

import PageLoader from './components/PageLoader';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './Login';
import CreateProfile from './CreateProfile';
import MainLayout from './layouts/MainLayout';

// --- Admin Imports ---
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Newsroom from './pages/admin/Newsroom';
import Users from './pages/admin/Users';
import SystemConfig from './pages/admin/SystemConfig';
import Prompts from './pages/admin/Prompts';
import Narratives from './pages/admin/Narratives'; 

// --- NEW: Modal Import ---
import LevelUpModal from './components/modals/LevelUpModal';

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

function AppRoutes() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // --- NEW: Level Up Modal State ---
  const [showLevelUp, setShowLevelUp] = useState(false);

  // --- NEW: Global Activity Listener ---
  // This hook ensures we track the session globally and listen for the "Level Up" command
  // from the backend (analyticsController).
  const handleGlobalTrigger = useCallback((command: string) => {
    if (command === 'trigger_goal_upgrade') {
      setShowLevelUp(true);
    }
  }, []);

  // Initialize Global Tracker ('root' context, 'feed' type for general tracking)
  useActivityTracker('app_root', 'feed', handleGlobalTrigger);

  // Handle "Accept Challenge"
  const handleConfirmLevelUp = async () => {
    try {
      await upgradeHabitGoal();
      addToast('Challenge Accepted! Daily goal updated to 20 mins.', 'success');
      setShowLevelUp(false);
    } catch (error) {
      console.error('Upgrade failed', error);
      addToast('Could not update goal. Try again later.', 'error');
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={ user ? <Navigate to="/" replace /> : <Login /> } />
        <Route path="/create-profile" element={user ? <CreateProfile /> : <Navigate to="/login" replace />} />
        
        {/* --- ADMIN ROUTES --- */}
        <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="newsroom" element={<Newsroom />} />
            <Route path="narratives" element={<Narratives />} />
            <Route path="users" element={<Users />} />
            <Route path="config" element={<SystemConfig />} />
            <Route path="prompts" element={<Prompts />} />
        </Route>

        {/* Main Layout handles both Public (Feed) and Private (Dashboard) routes internal logic */}
        <Route path="/*" element={<MainLayout profile={null} />} />
      </Routes>

      {/* --- NEW: Global Modal --- */}
      <LevelUpModal 
        isOpen={showLevelUp} 
        onClose={() => setShowLevelUp(false)}
        onConfirm={handleConfirmLevelUp}
      />

    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RadioProvider>
          <ToastProvider>
            <ErrorBoundary>
               <AppRoutes />
            </ErrorBoundary>
          </ToastProvider>
        </RadioProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
