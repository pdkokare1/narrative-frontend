// src/components/modals/LoginModal.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import './LoginModal.css'; 

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close" onClick={onClose}>×</button>
        
        <h2 className="login-modal-title">
          Unlock The Gamut
        </h2>
        
        <p className="login-modal-desc">
          {message || "Create a free account to access developing narratives, save articles, and customize your feed."}
        </p>

        <Link 
          to="/login" 
          className="btn-primary login-modal-btn"
        >
          Log In / Sign Up
        </Link>
        
        <button 
          className="login-modal-guest-btn"
          onClick={onClose}
        >
          Continue as Guest
        </button>
      </div>
    </div>,
    document.body
  );
};

export default LoginModal;
