// src/hooks/usePWAInstall.tsx
import { useState, useEffect } from 'react';

const usePWAInstall = () => {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 1. Check if the event was already captured globally (in index.tsx)
    // This fixes the race condition where the event fires before this component mounts.
    if ((window as any).deferredPrompt) {
      console.log("PWA Hook: Found stashed install event");
      setIsInstallable(true);
    }

    // 2. Listen for the event in case it fires *after* this hook mounts
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("PWA Hook: Captured new install event");
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setIsInstallable(true);
    };

    // 3. Listen for successful installation to hide the button
    const handleAppInstalled = () => {
      console.log("PWA installed successfully");
      (window as any).deferredPrompt = null;
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) {
        return;
    }

    // Show the install prompt
    promptEvent.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);

    // Whether accepted or dismissed, we clear the stashed event 
    // because it can typically only be used once.
    (window as any).deferredPrompt = null;
    setIsInstallable(false);
  };

  return { isInstallable, triggerInstall };
};

export default usePWAInstall;
