/**
 * LanguageSwitcher - English-only language indicator
 */
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({
  className = '',
  fullWidth = false,
  showLabelOnMobile = false,
}) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== 'en') {
      i18n.changeLanguage('en');
    }
    document.documentElement.lang = 'en';
  }, [i18n]);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      <div
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-base font-semibold text-propertree-dark ${fullWidth ? 'w-full' : ''}`}
        aria-label="Language: English"
      >
        <Globe className="w-5 h-5 flex-shrink-0" />
        <span className={showLabelOnMobile ? 'inline' : 'hidden md:inline'}>English</span>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
