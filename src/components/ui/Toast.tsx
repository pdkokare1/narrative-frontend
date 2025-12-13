// src/components/ui/Toast.tsx
import React from 'react';
import '../../App.css'; 

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'error';
  onClose: () => void;
  action?: ToastAction | null;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, action }) => {
  const bgColors: Record<string, string> = {
    success: '#4CAF50',
    error: '#E57373',
    info: '#2E4E6B'
  };

  return (
    <div style={{
      background: bgColors[type] || bgColors.info,
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      marginTop: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: '280px',
      maxWidth: '90vw',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <span style={{ fontSize: '13px', fontWeight: '500', flex: 1 }}>{message}</span>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onClose();
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              color: 'white',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            {action.label}
          </button>
        )}

        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            fontSize: '18px', 
            cursor: 'pointer',
            padding: '0 5px',
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
