// src/components/ui/Toast.tsx
import React from 'react';
import './Toast.css';

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
  return (
    <div className={`ui-toast ${type}`}>
      <span className="ui-toast-message">{message}</span>
      
      <div className="ui-toast-actions">
        {action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onClose();
            }}
            className="ui-toast-action-btn"
          >
            {action.label}
          </button>
        )}

        <button onClick={onClose} className="ui-toast-close">
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
