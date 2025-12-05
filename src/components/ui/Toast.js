import React from 'react';
import '../../App.css'; // We will add styles to App.css later

function Toast({ message, type, onClose }) {
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
      minWidth: '250px',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <span style={{ fontSize: '13px', fontWeight: '500' }}>{message}</span>
      <button 
        onClick={onClose} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'white', 
          fontSize: '16px', 
          cursor: 'pointer',
          marginLeft: '15px'
        }}
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
