/**
 * LanguageSwitcher - Component for switching between languages
 */
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
];

const LanguageSwitcher = ({
  className = '',
  align = 'right',
  direction = 'down',
  fullWidth = false,
  showLabelOnMobile = false,
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    // Update HTML lang attribute
    document.documentElement.lang = langCode;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const alignClass = align === 'left' ? 'left-0' : 'right-0';
  const directionClass = direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';
  const dropdownWidthClass = fullWidth ? 'w-full' : 'w-48';
  const buttonWidthClass = fullWidth ? 'w-full justify-between' : '';
  const labelClass = showLabelOnMobile ? 'inline' : 'hidden md:inline';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-base font-medium text-propertree-dark hover:text-propertree-green hover:bg-propertree-cream-100 transition-colors focus:outline-none ${buttonWidthClass}`}
        aria-label={t('language.selectLanguage')}
      >
        <Globe className="w-5 h-5" />
        <span className={labelClass}>{currentLanguage.name}</span>
      </button>

      {isOpen && (
        <div className={`absolute ${alignClass} ${directionClass} ${dropdownWidthClass} bg-white rounded-xl shadow-card py-1 border border-propertree-cream-300 z-50`}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-base text-left hover:bg-gray-100 transition-colors ${
                i18n.language === lang.code ? 'bg-propertree-cream-100 text-propertree-green font-medium' : 'text-gray-700'
              }`}
            >
              <span>{lang.name}</span>
              {i18n.language === lang.code && (
                <Check className="w-5 h-5 ml-auto text-propertree-green" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;





