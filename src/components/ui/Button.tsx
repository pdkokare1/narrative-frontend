// src/components/ui/Button.tsx
import React from 'react';
import useHaptic from '../../hooks/useHaptic';
import './Button.css'; // We will create this next

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'text';
  isLoading?: boolean;
  isActive?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  isLoading = false, 
  isActive = false,
  icon,
  children, 
  className = '', 
  onClick,
  ...props 
}) => {
  const vibrate = useHaptic();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoading && !props.disabled) {
      vibrate();
      if (onClick) onClick(e);
    }
  };

  return (
    <button 
      className={`ui-btn btn-${variant} ${isActive ? 'active' : ''} ${className}`}
      onClick={handleClick}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="btn-spinner"></div>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
