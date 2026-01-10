// src/components/modals/LoginModal.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './NarrativeModal.css'; // Reusing existing modal styles for consistency

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div style={{ marginBottom: '20px', fontSize: '40px' }}>🔐</div>
        
        <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
          Unlock The Gamut
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '25px' }}>
          {message || "Create a free account to access developing narratives, save articles, and customize your feed."}
        </p>

        <Link 
          to="/login" 
          className="btn-primary" 
          style={{ display: 'block', width: '100%', textDecoration: 'none', padding: '12px', boxSizing: 'border-box' }}
        >
          Log In / Sign Up
        </Link>
        
        <button 
          onClick={onClose}
          style={{ 
            background: 'transparent', border: 'none', color: 'var(--text-tertiary)', 
            marginTop: '15px', cursor: 'pointer', fontSize: '0.9rem' 
          }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
