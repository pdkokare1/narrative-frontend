// src/components/ui/Input.tsx
import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  error?: string;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  icon, 
  isLoading, 
  error, 
  fullWidth = false,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className={`ui-input-wrapper ${fullWidth ? 'full-width' : ''} ${className}`}>
      {label && <label className="ui-input-label">{label}</label>}
      
      <div className={`ui-input-container ${error ? 'has-error' : ''}`}>
        {icon && <span className="ui-input-icon">{icon}</span>}
        
        <input 
          ref={ref}
          className="ui-input-field"
          disabled={isLoading || props.disabled}
          {...props} 
        />

        {isLoading && (
          <div className="ui-input-spinner"></div>
        )}
      </div>

      {error && <span className="ui-input-error-text">{error}</span>}
    </div>
  );
});

export default Input;
