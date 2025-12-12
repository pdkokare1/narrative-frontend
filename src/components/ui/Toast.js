// src/components/ui/Toast.js
import React from 'react';
import '../../App.css'; 

function Toast({ message, type, onClose, action }) {
  const bgColors = {
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
        {/* --- NEW: Action Button (e.g. Undo) --- */}
        {action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onClose(); // Close toast after action
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
}

export default Toast;
