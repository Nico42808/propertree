/**
 * TextArea component - Multi-line text input
 */
import React from 'react';
import PropTypes from 'prop-types';

const TextArea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  className = '',
  ...props
}) => {
  const hasError = touched && error;
  const charCount = value?.length || 0;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-propertree-dark/70 sm:text-sm sm:normal-case sm:tracking-normal">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`block w-full resize-vertical rounded-2xl border ${hasError ? 'border-red-400' : 'border-gray-200'} bg-white px-4 py-3 text-sm text-propertree-dark placeholder:text-gray-400 shadow-subtle transition focus:border-propertree-green focus:outline-none focus:ring-4 focus:ring-propertree-green/10 disabled:cursor-not-allowed disabled:bg-propertree-cream-100 sm:py-3.5 sm:text-base`}
        {...props}
      />

      <div className="mt-1.5 flex justify-between">
        {hasError ? <p className="text-xs text-red-600 sm:text-sm">{error}</p> : <span />}
        {maxLength && <p className="text-xs text-propertree-dark/50 sm:text-sm">{charCount}/{maxLength}</p>}
      </div>
    </div>
  );
};

TextArea.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  touched: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  className: PropTypes.string,
};

export default TextArea;
