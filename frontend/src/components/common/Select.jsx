/**
 * Select component - Custom dropdown select input with styled dropdown menu
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Selecione...',
  error,
  touched,
  disabled = false,
  required = false,
  variant = 'default',
  showChevron = true,
  ensureVisibleOnOpen = false,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const hasError = touched && error;
  const isMinimal = variant === 'minimal';

  // Find the selected option label
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;
  const minimalPadding = showChevron ? 'pr-6' : 'pr-0';
  const buttonClasses = isMinimal
    ? `
      w-full text-left bg-transparent border-0 px-0 py-1 ${minimalPadding}
      text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-propertree-green/20
      disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200
      font-medium text-sm
      ${!selectedOption ? 'text-gray-400' : ''}
    `
    : `
      w-full rounded-lg sm:rounded-xl border-2 ${hasError ? 'border-red-500' : 'border-gray-200'}
      px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-left text-gray-900 bg-white
      shadow-sm hover:shadow-md hover:border-gray-300 hover:bg-gray-50
      focus:outline-none focus:ring-2 focus:ring-propertree-green/20 focus:border-propertree-green focus:shadow-md
      disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 disabled:shadow-none
      transition-all duration-300 ease-in-out
      font-medium text-sm
      ${!selectedOption ? 'text-gray-400' : ''}
      ${isOpen ? 'ring-2 ring-propertree-green/20 border-propertree-green shadow-md' : ''}
    `;

  const handleOptionSelect = useCallback((optionValue) => {
    const syntheticEvent = {
      target: {
        name,
        value: optionValue,
      },
    };
    onChange(syntheticEvent);
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [name, onChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
        if (onBlur) {
          onBlur(event);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onBlur]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => 
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && options[focusedIndex]) {
            handleOptionSelect(options[focusedIndex].value);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        default:
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, focusedIndex, options, handleOptionSelect]);

  useEffect(() => {
    if (!isOpen || !ensureVisibleOnOpen) return;
    const scrollFrame = requestAnimationFrame(() => {
      const target = dropdownRef.current || selectRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const margin = 16;
      const bottomOverflow = rect.bottom - window.innerHeight + margin;
      if (bottomOverflow > 0) {
        window.scrollBy({ top: bottomOverflow, behavior: 'smooth' });
        return;
      }
      const topOverflow = rect.top - margin;
      if (topOverflow < 0) {
        window.scrollBy({ top: topOverflow, behavior: 'smooth' });
      }
    });

    return () => cancelAnimationFrame(scrollFrame);
  }, [ensureVisibleOnOpen, isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setFocusedIndex(-1);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-xs sm:text-sm font-medium text-propertree-dark mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={selectRef}>
        {/* Custom Select Button */}
        <button
          type="button"
          id={name}
          onClick={handleToggle}
          disabled={disabled}
          className={buttonClasses}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          {...props}
        >
          <span className="block truncate">{displayValue}</span>
        </button>
        
        {/* Chevron Icon */}
        {showChevron && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                disabled ? 'opacity-50' : ''
              } ${isOpen ? 'transform rotate-180' : ''}`} 
            />
          </div>
        )}

        {/* Custom Dropdown Menu */}
        {isOpen && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 max-h-60 overflow-auto"
            role="listbox"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db transparent'
            }}
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options available
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = index === focusedIndex;
                const isFirst = index === 0;
                const isLast = index === options.length - 1;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleOptionSelect(option.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`
                      w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium
                      transition-colors duration-150 ease-in-out
                      ${
                        isSelected
                          ? 'bg-propertree-green/10 text-propertree-green font-semibold'
                          : isFocused
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                      ${isFirst ? 'rounded-t-lg' : ''}
                      ${isLast ? 'rounded-b-lg' : ''}
                    `}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
      
      {hasError && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  placeholder: PropTypes.string,
  error: PropTypes.string,
  touched: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'minimal']),
  showChevron: PropTypes.bool,
  ensureVisibleOnOpen: PropTypes.bool,
  className: PropTypes.string,
};

export default Select;