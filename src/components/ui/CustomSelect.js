// In file: src/components/ui/CustomSelect.js
import React, { useState, useEffect, useRef } from 'react';
import '../../App.css'; // For .custom-select styles

function CustomSelect({ name, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find(option => (option.value || option) === value);
  const displayLabel = selectedOption?.label || selectedOption || value;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectRef]);

  const handleSelectOption = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div className="custom-select-container" ref={selectRef}>
      <button
        type="button"
        className={`custom-select-value ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{displayLabel}</span>
        <svg className="custom-select-arrow" xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
          <path d="M7 10l5 5 5-5z"></path><path d="M0 0h24v24H0z" fill="none"></path>
        </svg>
      </button>

      {isOpen && (
        <ul className="custom-select-options" role="listbox">
          {options.map((option, index) => {
            const optionValue = option.value || option;
            const optionLabel = option.label || option;
            const isSelected = optionValue === value;

            return (
              <li
                key={index}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectOption(optionValue)}
                role="option"
                aria-selected={isSelected}
              >
                {optionLabel}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default CustomSelect;
