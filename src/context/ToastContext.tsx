import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
// @ts-ignore
import Toast from '../components/ui/Toast';
import useHaptic from '../hooks/useHaptic'; // Import Haptics

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
  action?: ToastAction | null;
}

interface ToastContextType {
  addToast: (message: string, type?: 'info' | 'success' | 'error', action?: ToastAction | null) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const triggerHaptic = useHaptic(); // Initialize Haptic Hook

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info', action: ToastAction | null = null) => {
    const id = Date.now();

    // UX IMPROVEMENT: Sensory Feedback
    // Trigger vibration based on toast type
    if (type === 'success') triggerHaptic('success');
    else if (type === 'error') triggerHaptic('error');
    else triggerHaptic('light');

    // UX IMPROVEMENT: Clear existing toasts so only ONE shows at a time.
    setToasts([{ id, message, type, action }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, [triggerHaptic]); // Added dependency

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            action={toast.action}
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
