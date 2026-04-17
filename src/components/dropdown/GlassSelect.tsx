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
  searchable?: boolean;
}

const GlassSelect: React.FC<GlassSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option",
  style,
  className = "",
  disabled = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    if (!isOpen) {
        setSearchTerm("");
    }
  }, [isOpen]);

  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const showCustomOption = searchable && searchTerm && !options.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());

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
        className={`glass-select-trigger ${isOpen ? 'open' : ''} ${searchable ? 'searchable' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={searchable ? -1 : 0}
        onKeyDown={(e) => {
          if (!searchable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
      >
        {searchable && isOpen ? (
            <input 
                type="text" 
                className="glass-select-input"
                placeholder={selectedOption ? selectedOption.label : placeholder}
                value={searchTerm}
                autoFocus
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
            />
        ) : (
            <span className={selectedOption || value ? 'value-selected' : 'value-placeholder'}>
                {selectedOption ? selectedOption.label : (value || placeholder)}
            </span>
        )}
        <ChevronDown 
          size={18} 
          className="glass-select-chevron" 
        />
      </div>

      {isOpen && (
        <div className="glass-select-menu">
          {showCustomOption && (
              <div 
                className="glass-select-item custom"
                onClick={() => handleSelect(searchTerm)}
              >
                Use "<strong>{searchTerm}</strong>"
              </div>
          )}
          {filteredOptions.length === 0 && !showCustomOption ? (
            <div className="glass-select-empty">No options found</div>
          ) : (
            filteredOptions.slice(0, 100).map((option) => (
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
