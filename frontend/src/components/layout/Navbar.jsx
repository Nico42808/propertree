/**
 * Navbar component - Property management navigation
 */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, Building, LayoutDashboard, LogOut, Menu, TrendingUp, User, Wrench, X } from 'lucide-react';
import { useAuth } from '../../hooks';
import { Avatar, Button, LanguageSwitcher } from '../common';
import ServiceNotifications from '../services/ServiceNotifications';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, isLandlord, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAdminUser = isAuthenticated && isAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => (isAdmin() ? '/admin/dashboard' : '/landlord/properties');
  const desktopLink = `text-propertree-dark hover:text-propertree-green rounded-lg font-medium transition-colors flex items-center whitespace-nowrap ${isAdminUser ? 'px-2.5 lg:px-3 py-2 text-sm gap-1.5' : 'px-3 lg:px-4 py-2.5 text-base gap-2'}`;
  const iconClass = `${isAdminUser ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`;
  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <nav className={`sticky top-0 z-40 ${isLanding ? 'bg-slate-50' : 'bg-white shadow-subtle border-b border-propertree-cream-300'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-[4.5rem] gap-4 sm:gap-5">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <img src="/logo.png" alt="Propertree" className={`${isAdminUser ? 'h-6 sm:h-7' : 'h-7 sm:h-8'} w-auto object-contain`} />
            <span className={`${isAdminUser ? 'text-base sm:text-lg' : 'text-lg sm:text-xl lg:text-2xl'} font-bold text-propertree-dark whitespace-nowrap`}>Propertree</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 min-w-0 justify-end">
            {isAuthenticated ? (
              <>
                <div className={`flex items-center ${isAdminUser ? 'gap-1 lg:gap-2' : 'gap-2 lg:gap-3'}`}>
                  {isLandlord() && !isAdmin() && (
                    <>
                      <Link to="/landlord/properties" className={desktopLink}><Building className={iconClass} />Assets</Link>
                      <Link to="/landlord/services" className={desktopLink}><Wrench className={iconClass} />Services</Link>
                    </>
                  )}
                  {isAdmin() && (
                    <>
                      <Link to="/admin/dashboard" className={desktopLink}><LayoutDashboard className={iconClass} />Dashboard</Link>
                      <Link to="/admin/properties" className={desktopLink}><Building className={iconClass} />Properties</Link>
                      <Link to="/admin/users" className={desktopLink}><User className={iconClass} />Users</Link>
                      <Link to="/admin/analytics" className={desktopLink}><TrendingUp className={iconClass} />Analytics</Link>
                      <Link to="/admin/performance" className={desktopLink}><Activity className={iconClass} />Performance</Link>
                    </>
                  )}
                </div>

                {isLandlord() && !isAdmin() && <ServiceNotifications onOpenMyServices={() => navigate('/landlord/services')} />}
                <div className={`flex-shrink-0 ml-1 ${isAdminUser ? 'scale-90 origin-right [&_span]:hidden lg:[&_span]:inline' : ''}`}><LanguageSwitcher /></div>

                <div className="relative flex-shrink-0 ml-1">
                  <button onClick={() => setProfileMenuOpen((value) => !value)} className="flex items-center space-x-2 focus:outline-none">
                    <Avatar src={user?.profile?.profile_photo || user?.profile_photo} name={user?.profile?.first_name || user?.first_name || user?.email} size={isAdminUser ? 'sm' : 'md'} />
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card py-1 border border-propertree-cream-300">
                      <Link to={getDashboardLink()} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
                      <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setProfileMenuOpen(false)}><User className="w-4 h-4 mr-2" />{t('common.profile')}</Link>
                      <hr className="my-1" />
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4 mr-2" />{t('common.logout')}</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <LanguageSwitcher />
                <Button variant="ghost" size="md" onClick={() => navigate('/login')}>{t('common.login')}</Button>
                <Button variant="primary" size="md" onClick={() => navigate('/register')}>{t('common.signUp')}</Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && isLandlord() && !isAdmin() && <ServiceNotifications onOpenMyServices={() => navigate('/landlord/services')} />}
            <button onClick={() => setMobileMenuOpen((value) => !value)} className="inline-flex items-center justify-center p-2.5 rounded-lg text-propertree-dark hover:text-propertree-green hover:bg-propertree-cream-100 focus:outline-none">
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                {isLandlord() && !isAdmin() && (
                  <>
                    <Link to="/landlord/properties" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>Assets</Link>
                    <Link to="/landlord/services" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>Services</Link>
                  </>
                )}
                {isAdmin() && (
                  <>
                    <Link to="/admin/dashboard" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>Dashboard</Link>
                    <Link to="/admin/properties" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>Properties</Link>
                    <Link to="/admin/users" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>Users</Link>
                    <Link to="/admin/analytics" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>Analytics</Link>
                    <Link to="/admin/performance" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>Performance</Link>
                  </>
                )}
                <Link to="/profile" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>{t('common.profile')}</Link>
                <button onClick={() => { handleLogout(); closeMobile(); }} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50">{t('common.logout')}</button>
                <div className="mt-2 pt-2 border-t border-gray-100 px-1"><LanguageSwitcher align="left" direction="up" fullWidth showLabelOnMobile /></div>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>{t('common.login')}</Link>
                <Link to="/register" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-propertree-green hover:bg-gray-50" onClick={closeMobile}>{t('common.signUp')}</Link>
                <div className="mt-2 pt-2 border-t border-gray-100 px-1"><LanguageSwitcher align="left" direction="up" fullWidth showLabelOnMobile /></div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
