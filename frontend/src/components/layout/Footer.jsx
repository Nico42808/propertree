/**
 * Footer component
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Home, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-propertree-dark text-propertree-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Brand */}
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <img src="/logo.png" alt="Propertree" className="h-6 w-auto object-contain" />
              </span>
              <span className="text-xl font-bold text-white">Propertree</span>
            </div>
            <p className="text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.company')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="hover:text-propertree-green transition-colors text-sm">
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-propertree-green transition-colors text-sm">
                  {t('footer.careers')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-propertree-green transition-colors text-sm">
                  {t('footer.blog')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.support')}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="hover:text-propertree-green transition-colors text-sm">
                  {t('footer.helpCenter')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-propertree-green transition-colors text-sm">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-propertree-green transition-colors text-sm">
                  {t('footer.termsOfUse')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-propertree-green transition-colors text-sm">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.socialMedia')}</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="#" className="hover:text-propertree-green transition-colors" aria-label="Facebook">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-propertree-green transition-colors" aria-label="Twitter">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-propertree-green transition-colors" aria-label="Instagram">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-propertree-green transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-propertree-dark-400 mt-8 pt-8 text-sm text-center">
          <p>&copy; {currentYear} Propertree. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;