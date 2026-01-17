// src/hooks/usePWAInstall.tsx
import { useState, useEffect } from 'react';

const usePWAInstall = () => {
  // Initialize state based on the global variable we set in index.tsx
  const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).deferredPrompt || null);
  const [isInstallable, setIsInstallable] = useState<boolean>(!!(window as any).deferredPrompt);

  useEffect(() => {
    // 1. Listen for new events (if it hasn't fired yet)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      // Update global stash
      (window as any).deferredPrompt = e;
      // Update local state
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log("PWA Hook: Captured event via listener");
    };

    // 2. Check global stash on mount (in case we missed the event)
    if ((window as any).deferredPrompt) {
        setIsInstallable(true);
        setDeferredPrompt((window as any).deferredPrompt);
        console.log("PWA Hook: Found stashed event on mount");
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Listen for successful installation to cleanup
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      (window as any).deferredPrompt = null;
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstallable(false);
    } else {
      console.log('User dismissed the install prompt');
    }
    // We clear the prompt because it can't be used twice
    setDeferredPrompt(null);
    (window as any).deferredPrompt = null;
  };

  return { isInstallable, triggerInstall };
};

export default usePWAInstall;
