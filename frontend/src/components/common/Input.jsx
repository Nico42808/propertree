/**
 * Input component - Form input with label and error
 */
import React from 'react';
import PropTypes from 'prop-types';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const hasError = touched && error;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-propertree-dark/70 sm:text-sm sm:normal-case sm:tracking-normal">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-propertree-dark/40">
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full rounded-2xl border ${hasError ? 'border-red-400' : 'border-gray-200'} bg-white ${leftIcon ? 'pl-11' : 'pl-4'} ${rightIcon ? 'pr-11' : 'pr-4'} py-3 text-sm font-medium text-propertree-dark placeholder:text-gray-400 shadow-subtle transition focus:border-propertree-green focus:outline-none focus:ring-4 focus:ring-propertree-green/10 disabled:cursor-not-allowed disabled:bg-propertree-cream-100 disabled:text-gray-400 sm:py-3.5 sm:text-base`}
          {...props}
        />

        {rightIcon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-propertree-dark/40">
            {rightIcon}
          </div>
        )}
      </div>

      {hasError && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  touched: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
};

export default Input;
