// In file: src/components/ui/CustomTooltip.js
import React from 'react';
import '../../App.css'; // For .tooltip-custom styles

function CustomTooltip({ visible, text, x, y }) {
  if (!visible) return null;

  const style = {
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
}

export default CustomTooltip;
