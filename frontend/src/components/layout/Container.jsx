/**
 * Container component - Responsive container wrapper
 */
import React from 'react';
import PropTypes from 'prop-types';

const Container = ({ children, size = 'default', className = '' }) => {
  const sizes = {
    sm: 'max-w-3xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-xl',
    full: 'max-w-full',
  };

  return (
    <div className={`${sizes[size]} relative z-10 mx-auto px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

Container.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'default', 'lg', 'full']),
  className: PropTypes.string,
};

export default Container;
