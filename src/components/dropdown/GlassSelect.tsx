import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './GlassSelect.css';

export interface DropdownOption {
  value: string;
  label: string;
}

interface GlassSelectProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
}

const GlassSelect: React.FC<GlassSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option",
  style,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      className={`glass-select-wrapper ${className} ${disabled ? 'disabled' : ''}`} 
      style={style} 
      ref={dropdownRef}
    >
      <div 
        className={`glass-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
      >
        <span className={selectedOption ? 'value-selected' : 'value-placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className="glass-select-chevron" 
        />
      </div>

      {isOpen && (
        <div className="glass-select-menu">
          {options.length === 0 ? (
            <div className="glass-select-empty">No options available</div>
          ) : (
            options.map((option) => (
              <div 
                key={option.value}
                className={`glass-select-item ${option.value === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GlassSelect;
