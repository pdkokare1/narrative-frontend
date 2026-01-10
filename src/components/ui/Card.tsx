import React, { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  // FIXED: Added 'xl' to the allowed padding types
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'; 
  variant?: 'default' | 'outlined' | 'elevated' | 'glass';
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  padding = 'md',
  variant = 'default',
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`
        card 
        card-variant-${variant} 
        card-padding-${padding} 
        ${onClick ? 'card-interactive' : ''} 
        ${className}
      `}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;
