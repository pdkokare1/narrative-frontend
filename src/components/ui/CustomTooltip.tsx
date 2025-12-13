// src/components/ui/CustomTooltip.tsx
import React from 'react';
import '../../App.css';

interface CustomTooltipProps {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ visible, text, x, y }) => {
  if (!visible) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -100%)',
    marginTop: '-10px',
  };

  return (
    <div
      className="tooltip-custom"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {text}
    </div>
  );
};

export default CustomTooltip;
