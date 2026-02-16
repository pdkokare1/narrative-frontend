// src/App.tsx
import React, { Suspense, useState, useCallback, useRef, useEffect } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import './App.css'; 

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { RadioProvider } from './context/RadioContext'; 

// UPDATED: Now we will actually USE this hook
import useNativeFeatures from './hooks/useNativeFeatures';
import { useActivityTracker } from './hooks/useActivityTracker'; 
import { upgradeHabitGoal } from './services/userService';    

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

// --- Modal Imports ---
import LevelUpModal from './components/modals/LevelUpModal';
import PalateCleanserModal from './components/modals/PalateCleanserModal'; 

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
  
  // --- UPDATED: 1. ACTIVATE NATIVE FEATURES ---
  // This initializes Push Notifications and Permissions when user is logged in
  useNativeFeatures(user);

  // --- UPDATED: 2. HANDLE SPLASH SCREEN & STATUS BAR ---
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Hide the splash screen once React is mounted
      SplashScreen.hide();

      // Set Status Bar to Dark (matches your Zinc-950 background)
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#09090b' }); // Zinc-950
    }
  }, []);
  
  // --- Global Modal States ---
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showPalateCleanser, setShowPalateCleanser] = useState(false);

  // --- SAFETY: Prevent Modal Spam ---
  const lastInterventionRef = useRef<number>(0);

  // --- Global Activity Listener ---
  const handleGlobalTrigger = useCallback((command: string) => {
    const now = Date.now();
    const COOLDOWN = 1000 * 60 * 30; // 30 Minutes

    if (command === 'trigger_goal_upgrade') {
      setShowLevelUp(true);
    } 
    else if (command === 'trigger_palate_cleanser') {
      if (now - lastInterventionRef.current > COOLDOWN) {
          setShowPalateCleanser(true);
          lastInterventionRef.current = now; 
      } else {
          console.log("Palate Cleanser suppressed by frontend safety cooldown.");
      }
    }
  }, []);

  useActivityTracker('app_root', 'feed', handleGlobalTrigger);

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
        {/* UPDATED: Removed invalid profile prop; MainLayout now self-fetches */}
        <Route path="/*" element={<MainLayout />} />
      </Routes>

      {/* --- Global Modals --- */}
      <LevelUpModal 
        isOpen={showLevelUp} 
        onClose={() => setShowLevelUp(false)}
        onConfirm={handleConfirmLevelUp}
      />

      <PalateCleanserModal 
        open={showPalateCleanser}
        onClose={() => setShowPalateCleanser(false)}
        onSwitchToPositive={() => {
            setShowPalateCleanser(false);
            addToast('We are curating lighter stories for you...', 'info');
        }}
      />

    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ERROR BOUNDARY MOVED TO TOP LEVEL to catch Auth/Init failures */}
      <ErrorBoundary>
        <AuthProvider>
          <RadioProvider>
            <ToastProvider>
                 <AppRoutes />
            </ToastProvider>
          </RadioProvider>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
