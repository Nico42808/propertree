/**
 * Modal component - Overlay dialog
 */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-propertree-dark/55 p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className={`my-6 w-full ${sizes[size]} overflow-hidden rounded-3xl border border-white/60 bg-white shadow-card-hover sm:my-8`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-7 sm:py-6">
          <h2 className="text-xl font-semibold tracking-tight text-propertree-dark sm:text-2xl">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-propertree-dark/40 transition hover:bg-propertree-green-50 hover:text-propertree-dark"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-propertree-cream-100 px-5 py-4 sm:px-7 sm:py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  closeOnOverlayClick: PropTypes.bool,
};

export default Modal;
