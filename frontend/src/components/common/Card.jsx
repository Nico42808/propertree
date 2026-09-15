/**
 * Card component - Container with shadow and border
 */
import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ children, className = '', hover = false, padding = true }) => {
  const hoverClass = hover
    ? 'hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 cursor-pointer'
    : '';
  const paddingClass = padding ? 'p-5 sm:p-6 lg:p-7' : '';

  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-subtle ${paddingClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  padding: PropTypes.bool,
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 sm:mb-5 ${className}`}>{children}</div>
);

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg sm:text-xl font-semibold tracking-tight text-propertree-dark ${className}`}>
    {children}
  </h3>
);

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

const CardBody = ({ children, className = '' }) => <div className={className}>{children}</div>;

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-5 border-t border-gray-100 pt-5 ${className}`}>{children}</div>
);

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
